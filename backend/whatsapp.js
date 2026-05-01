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
    this.reconnectAttempts = new Map(); // sessionId -> attempt count
    this.keepAliveTimers = new Map(); // sessionId -> interval
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

  _startKeepAlive(sessionId) {
    this._stopKeepAlive(sessionId);
    const timer = setInterval(async () => {
      const session = this.sessions.get(sessionId);
      if (!session || session.status !== 'connected') {
        this._stopKeepAlive(sessionId);
        return;
      }
      try {
        // Send presence available to keep connection alive
        await session.sock.sendPresenceUpdate('available');
        console.log(`[WPP] Keepalive enviado para sessão: ${sessionId}`);
      } catch (e) {
        console.warn(`[WPP] Keepalive falhou para ${sessionId}:`, e.message);
      }
    }, 4 * 60 * 1000); // Every 4 minutes
    this.keepAliveTimers.set(sessionId, timer);
  }

  _stopKeepAlive(sessionId) {
    const timer = this.keepAliveTimers.get(sessionId);
    if (timer) {
      clearInterval(timer);
      this.keepAliveTimers.delete(sessionId);
    }
  }

  _getReconnectDelay(sessionId) {
    const attempts = this.reconnectAttempts.get(sessionId) || 0;
    // Exponential backoff: 3s, 6s, 12s, 24s, max 60s
    return Math.min(3000 * Math.pow(2, attempts), 60000);
  }

  async createSession(sessionId) {
    if (!makeWASocket) throw new Error('Baileys não carregado corretamente no servidor');
    const existing = this.sessions.get(sessionId);
    if (existing && existing.status === 'connected') {
      return { status: 'connected', phone: existing.phone };
    }
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
      browser: Browsers.ubuntu('Chrome'),
      printQRInTerminal: false,
      logger: require('pino')({ level: 'silent' }),
      generateHighQualityLinkPreview: false,
      syncFullHistory: false,
      keepAliveIntervalMs: 30000,      // Ping interno a cada 30s
      connectTimeoutMs: 60000,          // Timeout de conexão 60s
      retryRequestDelayMs: 2000,        // Delay entre retries internos
      maxMsgRetryCount: 3,              // Retries de envio
      emitOwnEvents: false,
    });

    const sessionData = {
      sock,
      status: 'connecting',
      qr: null,
      phone: null,
      sessionId
    };
    this.sessions.set(sessionId, sessionData);

    // Remove any previous listeners to prevent memory leak on reconnect
    sock.ev.removeAllListeners('connection.update');
    sock.ev.removeAllListeners('creds.update');
    sock.ev.removeAllListeners('messages.upsert');

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr, isNewLogin } = update;

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
        this.reconnectAttempts.set(sessionId, 0); // Reset backoff on success
        this._startKeepAlive(sessionId);
        this.emit('connected', { sessionId, phone: sessionData.phone });
        console.log(`[WPP] ✅ Conectado! Sessão: ${sessionId} | Número: ${sessionData.phone}`);
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;
        const isBanned = statusCode === 401 || statusCode === 403;

        this._stopKeepAlive(sessionId);
        sessionData.status = 'disconnected';
        this.emit('disconnected', { sessionId, code: statusCode });

        console.log(`[WPP] ❌ Conexão fechada. Código: ${statusCode} | LoggedOut: ${isLoggedOut}`);

        if (isLoggedOut || isBanned) {
          // Logout real — limpa tudo, não reconecta
          console.log(`[WPP] Sessão ${sessionId} deslogada. Limpando credenciais.`);
          this.sessions.delete(sessionId);
          this.reconnectAttempts.delete(sessionId);
          fs.rmSync(path.join(this.AUTH_DIR, sessionId), { recursive: true, force: true });
        } else {
          // Erro temporário — reconecta com backoff
          const attempts = (this.reconnectAttempts.get(sessionId) || 0) + 1;
          this.reconnectAttempts.set(sessionId, attempts);
          const delay = this._getReconnectDelay(sessionId);
          console.log(`[WPP] Reconectando sessão ${sessionId} em ${delay/1000}s (tentativa ${attempts})...`);
          setTimeout(() => this.createSession(sessionId), delay);
        }
      }
    });

    // Save credentials on every update
    sock.ev.on('creds.update', saveCreds);

    // Handle messages to keep session active (optional processing)
    sock.ev.on('messages.upsert', () => {
      // Just receiving messages keeps the connection alive
    });

    return { status: 'connecting', qr: null };
  }

  async sendMessage(sessionId, phone, message) {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'connected') {
      throw new Error('WhatsApp não conectado. Escaneie o QR Code primeiro.');
    }

    const cleaned = phone.replace(/\D/g, '');
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
        const personalizedMsg = (contact.text || message)
          .replace(/\{nome\}/gi, contact.name || '')
          .replace(/\{name\}/gi, contact.name || '')
          .replace(/\{numero\}/gi, contact.phone || '');
        await this.sendMessage(sessionId, contact.phone, personalizedMsg);
        results.push({ ...contact, status: 'sent' });
        console.log(`[WPP] ✅ Enviado para ${contact.phone}`);
      } catch (e) {
        results.push({ ...contact, status: 'failed', error: e.message });
        console.error(`[WPP] ❌ Falha ${contact.phone}:`, e.message);
      }
      if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs + Math.random() * 1500));
    }
    return results;
  }

  async disconnectSession(sessionId) {
    this._stopKeepAlive(sessionId);
    const session = this.sessions.get(sessionId);
    if (session?.sock) {
      try { await session.sock.logout(); } catch {}
    }
    this.sessions.delete(sessionId);
    this.reconnectAttempts.delete(sessionId);
    const authDir = path.join(this.AUTH_DIR, sessionId);
    fs.rmSync(authDir, { recursive: true, force: true });
    console.log(`[WPP] Sessão ${sessionId} desconectada e limpa`);
  }

  async restoreSessions() {
    if (!fs.existsSync(this.AUTH_DIR)) return;
    const dirs = fs.readdirSync(this.AUTH_DIR);
    for (const sessionId of dirs) {
      const authDir = path.join(this.AUTH_DIR, sessionId);
      if (fs.statSync(authDir).isDirectory()) {
        const credsFile = path.join(authDir, 'creds.json');
        if (fs.existsSync(credsFile)) {
          console.log(`[WPP] Restaurando sessão: ${sessionId}`);
          try {
            await this.createSession(sessionId);
          } catch(e) {
            console.error(`[WPP] Erro ao restaurar ${sessionId}:`, e.message);
          }
        }
      }
    }
  }
}

module.exports = new WhatsAppManager();
