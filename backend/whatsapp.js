let makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers;
try {
  const baileys = require('@whiskeysockets/baileys');
  makeWASocket = baileys.default;
  useMultiFileAuthState = baileys.useMultiFileAuthState;
  DisconnectReason = baileys.DisconnectReason;
  fetchLatestBaileysVersion = baileys.fetchLatestBaileysVersion;
  Browsers = baileys.Browsers;
} catch(e) {
  console.error('[WPP] Erro ao carregar Baileys:', e.message);
}
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');
const { EventEmitter } = require('events');

class WhatsAppManager extends EventEmitter {
  constructor() {
    super();
    this.sessions = new Map(); // sessionId -> { sock, status, qr, ... }
    this.AUTH_DIR = path.join(__dirname, '../.wpp_auth');
    if (!fs.existsSync(this.AUTH_DIR)) fs.mkdirSync(this.AUTH_DIR, { recursive: true });
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  getStatus(sessionId) {
    const s = this.sessions.get(sessionId);
    if (!s) return { status: 'disconnected', qr: null };
    return { status: s.status, qr: s.qr || null, phone: s.phone || null };
  }

  async createSession(sessionId) {
    if (!makeWASocket) throw new Error('Baileys não carregado corretamente no servidor');
    // Se já existe sessão conectada, retorna
    const existing = this.sessions.get(sessionId);
    if (existing && existing.status === 'connected') {
      return { status: 'connected', phone: existing.phone };
    }

    // Se já está conectando, retorna o estado atual
    if (existing && existing.status === 'connecting') {
      return { status: 'connecting', qr: existing.qr };
    }

    const authDir = path.join(this.AUTH_DIR, sessionId);
    if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      browser: Browsers.ubuntu('ZapSaaS'),
      printQRInTerminal: false,
      logger: require('pino')({ level: 'silent' }),
      generateHighQualityLinkPreview: false,
      syncFullHistory: false,
    });

    const sessionData = {
      sock,
      status: 'connecting',
      qr: null,
      phone: null,
      sessionId
    };
    this.sessions.set(sessionId, sessionData);

    // QR Code
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          const qrDataURL = await qrcode.toDataURL(qr, { width: 300, margin: 2 });
          sessionData.qr = qrDataURL;
          sessionData.status = 'qr_ready';
          this.emit('qr', { sessionId, qr: qrDataURL });
          console.log(`[WPP] QR gerado para sessão: ${sessionId}`);
        } catch (e) {
          console.error('[WPP] Erro ao gerar QR:', e);
        }
      }

      if (connection === 'open') {
        sessionData.status = 'connected';
        sessionData.qr = null;
        sessionData.phone = sock.user?.id?.split(':')[0] || null;
        this.emit('connected', { sessionId, phone: sessionData.phone });
        console.log(`[WPP] Conectado! Sessão: ${sessionId} | Número: ${sessionData.phone}`);
      }

      if (connection === 'close') {
        const code = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = code !== DisconnectReason.loggedOut;

        console.log(`[WPP] Conexão fechada. Código: ${code} | Reconectar: ${shouldReconnect}`);
        sessionData.status = 'disconnected';
        this.emit('disconnected', { sessionId, code });

        if (shouldReconnect) {
          console.log(`[WPP] Reconectando sessão: ${sessionId}...`);
          setTimeout(() => this.createSession(sessionId), 3000);
        } else {
          // Logout — limpa credenciais
          this.sessions.delete(sessionId);
          fs.rmSync(path.join(this.AUTH_DIR, sessionId), { recursive: true, force: true });
        }
      }
    });

    sock.ev.on('creds.update', saveCreds);

    return { status: 'connecting', qr: null };
  }

  async sendMessage(sessionId, phone, message) {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'connected') {
      throw new Error('WhatsApp não conectado. Escaneie o QR Code primeiro.');
    }

    // Formata o número: remove tudo que não for dígito, adiciona @s.whatsapp.net
    const cleaned = phone.replace(/\D/g, '');
    // Adiciona 55 (Brasil) se não tiver código de país
    const withCountry = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
    const jid = `${withCountry}@s.whatsapp.net`;

    try {
      await session.sock.sendMessage(jid, { text: message });
      return { success: true, to: jid };
    } catch (e) {
      throw new Error(`Falha ao enviar para ${phone}: ${e.message}`);
    }
  }

  async sendBulk(sessionId, contacts, message, delayMs = 2000) {
    const results = [];
    for (const contact of contacts) {
      try {
        // Substitui {nome} pelo nome do contato
        const personalizedMsg = message.replace(/\{nome\}/gi, contact.name || '');
        await this.sendMessage(sessionId, contact.phone, personalizedMsg);
        results.push({ ...contact, status: 'sent' });
        console.log(`[WPP] Enviado para ${contact.phone}`);
      } catch (e) {
        results.push({ ...contact, status: 'failed', error: e.message });
        console.error(`[WPP] Falha ${contact.phone}:`, e.message);
      }
      // Delay entre mensagens para evitar ban
      if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs + Math.random() * 1000));
    }
    return results;
  }

  async disconnectSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session?.sock) {
      try { await session.sock.logout(); } catch {}
    }
    this.sessions.delete(sessionId);
    const authDir = path.join(this.AUTH_DIR, sessionId);
    fs.rmSync(authDir, { recursive: true, force: true });
    console.log(`[WPP] Sessão ${sessionId} desconectada e limpa`);
  }

  // Reconecta sessões salvas ao iniciar o servidor
  async restoreSessions() {
    if (!fs.existsSync(this.AUTH_DIR)) return;
    const dirs = fs.readdirSync(this.AUTH_DIR);
    for (const sessionId of dirs) {
      const authDir = path.join(this.AUTH_DIR, sessionId);
      if (fs.statSync(authDir).isDirectory()) {
        const credsFile = path.join(authDir, 'creds.json');
        if (fs.existsSync(credsFile)) {
          console.log(`[WPP] Restaurando sessão: ${sessionId}`);
          await this.createSession(sessionId);
        }
      }
    }
  }
}

module.exports = new WhatsAppManager();
