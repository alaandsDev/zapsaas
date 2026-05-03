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
const { useSupabaseAuthState } = require('./supabase_auth_state');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');
const { EventEmitter } = require('events');

// Supabase client compartilhado (injetado pelo server.js)
let _supabase = null;
function setSupabase(client) { _supabase = client; }

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
    if (existing && (existing.status === 'connecting' || existing.status === 'qr_ready')) {
      return { status: existing.status, qr: existing.qr };
    }

    // Fecha socket antigo se existir
    if (existing?.sock) {
      try { existing.sock.end(undefined); } catch {}
    }

    const authDir = path.join(this.AUTH_DIR, sessionId);
    if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

    // Usa Supabase se disponível, senão fallback para filesystem
    let state, saveCreds, deleteState;
    if (_supabase) {
      const result = await useSupabaseAuthState(_supabase, sessionId);
      state = result.state;
      saveCreds = result.saveCreds;
      deleteState = result.deleteState;
      console.log(`[WPP] Auth state: Supabase (sessão: ${sessionId})`);
    } else {
      const result = await useMultiFileAuthState(authDir);
      state = result.state;
      saveCreds = result.saveCreds;
      deleteState = async () => fs.rmSync(authDir, { recursive: true, force: true });
      console.log(`[WPP] Auth state: filesystem (sessão: ${sessionId})`);
    }
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      // Usar MacOS Chrome — mais estável e menos detectado
      browser: ['ZapFlow', 'Chrome', '120.0.0'],
      printQRInTerminal: false,
      logger: require('pino')({ level: 'silent' }),
      generateHighQualityLinkPreview: false,
      syncFullHistory: false,
      markOnlineOnConnect: false,   // Não marcar online ao conectar — menos suspeito
      keepAliveIntervalMs: 25000,
      connectTimeoutMs: 60000,
      retryRequestDelayMs: 2500,
      maxMsgRetryCount: 2,
      emitOwnEvents: false,
      fireInitQueries: true,
      getMessage: async () => ({ conversation: '' }),
    });

    const sessionData = {
      sock,
      status: 'connecting',
      qr: null,
      phone: null,
      sessionId,
      isNew: !fs.existsSync(path.join(authDir, 'creds.json')),
    };
    this.sessions.set(sessionId, sessionData);

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
        // Aguarda 1s para garantir que creds foram salvas antes de marcar conectado
        await new Promise(r => setTimeout(r, 1000));
        sessionData.status = 'connected';
        sessionData.qr = null;
        sessionData.phone = sock.user?.id?.split(':')[0] || null;
        this.reconnectAttempts.set(sessionId, 0);
        this._startKeepAlive(sessionId);
        this.emit('connected', { sessionId, phone: sessionData.phone });
        console.log(`[WPP] ✅ Conectado! Sessão: ${sessionId} | Número: +${sessionData.phone}`);
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const reason = lastDisconnect?.error?.message || '';
        const isLoggedOut = statusCode === DisconnectReason.loggedOut || statusCode === 401;
        const isConflict = statusCode === DisconnectReason.connectionReplaced;
        const isBanned = statusCode === 403;

        this._stopKeepAlive(sessionId);
        this.emit('disconnected', { sessionId, code: statusCode });

        console.log(`[WPP] ❌ Conexão fechada. Código: ${statusCode} | Razão: ${reason}`);

        if (isLoggedOut || isBanned) {
          // Logout real — limpa credenciais e não reconecta
          console.log(`[WPP] 🔴 Sessão ${sessionId} deslogada/banida. Limpando.`);
          sessionData.status = 'disconnected';
          this.sessions.delete(sessionId);
          this.reconnectAttempts.delete(sessionId);
          try { await deleteState(); } catch {}
          fs.rmSync(path.join(this.AUTH_DIR, sessionId), { recursive: true, force: true });
        } else if (isConflict) {
          // Outra instância conectou — não reconectar
          console.log(`[WPP] ⚠️ Sessão ${sessionId} substituída por outra instância.`);
          sessionData.status = 'disconnected';
        } else {
          // Desconexão temporária — reconecta com backoff exponencial
          sessionData.status = 'disconnected';
          const attempts = (this.reconnectAttempts.get(sessionId) || 0) + 1;
          this.reconnectAttempts.set(sessionId, attempts);
          const delay = this._getReconnectDelay(sessionId);
          console.log(`[WPP] 🔄 Reconectando ${sessionId} em ${delay/1000}s (tentativa ${attempts})...`);
          setTimeout(async () => {
            // Só reconecta se a sessão ainda existe e não foi explicitamente removida
            if (this.sessions.has(sessionId) || fs.existsSync(path.join(this.AUTH_DIR, sessionId, 'creds.json'))) {
              await this.createSession(sessionId);
            }
          }, delay);
        }
      }
    });

    // Salva credenciais imediatamente em cada update
    sock.ev.on('creds.update', async () => {
      await saveCreds();
    });

    sock.ev.on('messages.upsert', () => {});

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

  // Round-robin entre múltiplas sessões — 1 msg por sessão alternando
  async sendBulkRoundRobin(userId, sessions, contacts, message, delayMs = 2500) {
    if (!sessions?.length) throw new Error('Nenhuma sessão conectada');
    const results = [];
    let sessionIdx = 0;

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      const session = sessions[sessionIdx % sessions.length];
      sessionIdx++;

      try {
        const personalizedMsg = (contact.text || message)
          .replace(/\{nome\}/gi, contact.name || '')
          .replace(/\{name\}/gi, contact.name || '')
          .replace(/\{numero\}/gi, contact.phone || '');
        await this.sendMessage(session.key, contact.phone, personalizedMsg);
        results.push({ ...contact, status: 'sent', sentVia: `slot${session.slot}` });
        console.log(`[WPP] ✅ ${contact.phone} via slot ${session.slot}`);
      } catch (e) {
        results.push({ ...contact, status: 'failed', error: e.message, sentVia: `slot${session.slot}` });
        console.error(`[WPP] ❌ ${contact.phone} slot ${session.slot}: ${e.message}`);
      }

      if (delayMs > 0 && i < contacts.length - 1) {
        await new Promise(r => setTimeout(r, delayMs + Math.random() * 1000));
      }
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
    // Limpa do Supabase
    if (_supabase) {
      try { await _supabase.from('wpp_sessions').delete().eq('session_id', sessionId); } catch {}
    }
    // Limpa do filesystem (fallback)
    const authDir = path.join(this.AUTH_DIR, sessionId);
    fs.rmSync(authDir, { recursive: true, force: true });
    console.log(`[WPP] Sessão ${sessionId} desconectada e limpa`);
  }

  async restoreSessions() {
    // 1. Restaura do Supabase (principal)
    if (_supabase) {
      try {
        const { data } = await _supabase
          .from('wpp_sessions')
          .select('session_id, updated_at')
          .order('updated_at', { ascending: false });

        if (data?.length) {
          console.log(`[WPP] Restaurando ${data.length} sessão(ões) do Supabase...`);
          for (const row of data) {
            try {
              await this.createSession(row.session_id);
            } catch(e) {
              console.error(`[WPP] Erro ao restaurar ${row.session_id}:`, e.message);
            }
          }
          return;
        }
      } catch(e) {
        console.error('[WPP] Erro ao buscar sessões do Supabase:', e.message);
      }
    }

    // 2. Fallback: restaura do filesystem
    if (!fs.existsSync(this.AUTH_DIR)) return;
    const dirs = fs.readdirSync(this.AUTH_DIR);
    for (const sessionId of dirs) {
      const authDir = path.join(this.AUTH_DIR, sessionId);
      if (fs.statSync(authDir).isDirectory()) {
        const credsFile = path.join(authDir, 'creds.json');
        if (fs.existsSync(credsFile)) {
          console.log(`[WPP] Restaurando do filesystem: ${sessionId}`);
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

const manager = new WhatsAppManager();

module.exports = manager;
module.exports.setSupabase = (client) => setSupabase(client);
