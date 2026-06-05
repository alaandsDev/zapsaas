let makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers, downloadMediaMessage;
try {
  const baileys = require('@whiskeysockets/baileys');
  makeWASocket = baileys.default;
  useMultiFileAuthState = baileys.useMultiFileAuthState;
  DisconnectReason = baileys.DisconnectReason;
  fetchLatestBaileysVersion = baileys.fetchLatestBaileysVersion;
  Browsers = baileys.Browsers;
  downloadMediaMessage = baileys.downloadMediaMessage;
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
    }, 10 * 60 * 1000); // 10 minutos (reduz carga Supabase)
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
        this.emit('disconnected', { sessionId, code: statusCode, isLoggedOut: isLoggedOut || isBanned });

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
          sessionData.status = 'reconnecting';
          const attempts = (this.reconnectAttempts.get(sessionId) || 0) + 1;
          this.reconnectAttempts.set(sessionId, attempts);
          const delay = this._getReconnectDelay(sessionId);
          console.log(`[WPP] 🔄 Reconectando ${sessionId} em ${delay/1000}s (tentativa ${attempts})...`);
          this.emit('reconnecting', { sessionId, attempt: attempts, delayMs: delay });
          setTimeout(async () => {
            // Só reconecta se a sessão ainda existe e não foi explicitamente removida
            // Verifica também no Supabase (Railway não tem filesystem persistente)
            let hasState = this.sessions.has(sessionId);
            if (!hasState) {
              hasState = fs.existsSync(path.join(this.AUTH_DIR, sessionId, 'creds.json'));
            }
            if (!hasState && _supabase) {
              try {
                const { data } = await _supabase.from('wpp_sessions').select('session_id').eq('session_id', sessionId).single();
                hasState = !!data;
              } catch {}
            }
            if (hasState) await this.createSession(sessionId);
          }, delay);
        }
      }
    });

    // Salva credenciais imediatamente em cada update
    sock.ev.on('creds.update', async () => {
      await saveCreds();
    });

    sock.ev.on('messages.upsert', async (upsert) => {
      try {
        console.log(`[WPP] messages.upsert disparou: ${upsert?.messages?.length} msgs, type=${upsert?.type}`);
        if (!upsert?.messages?.length) return;
        // 'append' = histórico sincronizado ao conectar (já lido no WhatsApp) — não conta como novo
        const isNewMessage = upsert.type === 'notify';
        for (const msg of upsert.messages) {
          if (!msg?.message) { console.log(`[WPP] msg sem message, key=${JSON.stringify(msg?.key)}`); continue; }
          const remoteJid = msg.key?.remoteJid || '';
          if (!remoteJid) { console.log(`[WPP] msg sem remoteJid`); continue; }
          const isPersonal = remoteJid.endsWith('@s.whatsapp.net') || remoteJid.endsWith('@c.us') || remoteJid.endsWith('@lid');
          if (!isPersonal) { console.log(`[WPP] filtrado jid=${remoteJid}`); continue; }

          // Para @lid, usa remoteJidAlt (@s.whatsapp.net) se disponível
          const resolvedJid = (remoteJid.endsWith('@lid') && msg.key?.remoteJidAlt)
            ? msg.key.remoteJidAlt
            : remoteJid;

          const phone = resolvedJid.split('@')[0].split(':')[0];
          if (!/^\d{10,15}$/.test(phone)) { console.log(`[WPP] filtrado phone=${phone}`); continue; }
          const ownPhone = sock.user?.id?.split(':')[0]?.split('@')[0];
          if (ownPhone && ownPhone === phone) { console.log(`[WPP] filtrado self phone=${phone}`); continue; }
          console.log(`[WPP] msg passou filtros: phone=${phone} fromMe=${msg.key?.fromMe} type=${upsert.type}`);

          const m = msg.message;

          // Ignora mensagens de protocolo / reactions / chave (não são conteúdo real)
          if (m.protocolMessage || m.reactionMessage || m.senderKeyDistributionMessage
              || m.messageContextInfo && Object.keys(m).length === 1) {
            continue;
          }

          const fromMe = !!msg.key?.fromMe;
          const text = m.conversation
            || m.extendedTextMessage?.text
            || m.imageMessage?.caption
            || m.videoMessage?.caption
            || m.documentMessage?.caption
            || '';
          let type = 'text';
          let mediaMessage = null;
          let mimeType = null;
          let fileName = null;
          if (m.imageMessage)         { type = 'image';    mediaMessage = m.imageMessage;    mimeType = m.imageMessage.mimetype; }
          else if (m.audioMessage)    { type = 'audio';    mediaMessage = m.audioMessage;    mimeType = m.audioMessage.mimetype; }
          else if (m.videoMessage)    { type = 'video';    mediaMessage = m.videoMessage;    mimeType = m.videoMessage.mimetype; }
          else if (m.documentMessage) { type = 'document'; mediaMessage = m.documentMessage; mimeType = m.documentMessage.mimetype; fileName = m.documentMessage.fileName; }
          else if (m.stickerMessage)  { type = 'sticker';  mediaMessage = m.stickerMessage;  mimeType = m.stickerMessage.mimetype; }
          else if (!text) { continue; } // sem texto e sem mídia — descarta

          // Baixa mídia (best-effort, só mensagens recebidas — fromMe não tem buffer disponível)
          let mediaBuffer = null;
          if (mediaMessage && downloadMediaMessage && !fromMe) {
            try {
              mediaBuffer = await downloadMediaMessage(msg, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
            } catch (e) {
              console.warn(`[WPP] Falha ao baixar mídia ${type}:`, e.message);
            }
          }

          this.emit('message', {
            sessionId,
            waId: msg.key?.id,
            phone,
            jid: remoteJid,
            fromMe,
            isNewMessage, // false = histórico, não incrementar unread
            pushName: msg.pushName || null,
            text,
            type,
            mimeType,
            fileName,
            mediaBuffer,
            timestamp: (msg.messageTimestamp ? Number(msg.messageTimestamp) : Date.now() / 1000) * 1000,
          });
        }
      } catch (e) {
        console.error('[WPP] messages.upsert handler error:', e.message);
      }
    });

    // Sincroniza unread count real do WhatsApp (chats já lidos no app)
    const syncChatUnread = (chats = []) => {
      for (const c of chats) {
        const jid = c.id || '';
        if (!jid.endsWith('@s.whatsapp.net') && !jid.endsWith('@c.us')) continue;
        const phone = jid.split('@')[0].split(':')[0];
        if (c.unreadCount !== undefined && c.unreadCount !== null) {
          this.emit('chat_unread', { sessionId, phone, unread: Math.max(0, c.unreadCount) });
        }
      }
    };
    sock.ev.on('chats.upsert', syncChatUnread);
    sock.ev.on('chats.update', syncChatUnread);

    // Atualizações de contatos (nome salvo no celular do usuário)
    sock.ev.on('contacts.upsert', (contacts) => {
      try {
        for (const c of contacts || []) {
          const jid = c.id || '';
          if (!jid.endsWith('@s.whatsapp.net') && !jid.endsWith('@c.us')) continue;
          const phone = jid.split('@')[0].split(':')[0];
          const name = c.name || c.notify || c.verifiedName || null;
          if (name) this.emit('contact', { sessionId, phone, name });
        }
      } catch {}
    });
    sock.ev.on('contacts.update', (contacts) => {
      try {
        for (const c of contacts || []) {
          const jid = c.id || '';
          if (!jid.endsWith('@s.whatsapp.net') && !jid.endsWith('@c.us')) continue;
          const phone = jid.split('@')[0].split(':')[0];
          const name = c.name || c.notify || c.verifiedName || null;
          if (name) this.emit('contact', { sessionId, phone, name });
        }
      } catch {}
    });

    return { status: 'connecting', qr: null };
  }

  // Busca foto de perfil — preview (pequena) ou image (alta)
  async getProfilePicture(sessionId, phone, type = 'image') {
    const session = this.sessions.get(sessionId);
    if (!session?.sock || session.status !== 'connected') return null;
    const cleaned = String(phone).replace(/\D/g, '');
    const jid = `${cleaned}@s.whatsapp.net`;
    try {
      return await session.sock.profilePictureUrl(jid, type);
    } catch (e) {
      return null; // contato sem foto OU privacy bloqueando
    }
  }

  // Marca mensagens como lidas no WhatsApp (envia o "visto" azul ao contato)
  // waIds: array de IDs (wa_id) das mensagens recebidas a marcar como lidas
  async markRead(sessionId, phone, waIds = []) {
    const session = this.sessions.get(sessionId);
    if (!session?.sock || session.status !== 'connected' || !waIds.length) return false;
    const cleaned = String(phone).replace(/\D/g, '');
    const jid = `${cleaned}@s.whatsapp.net`;
    try {
      const keys = waIds.filter(Boolean).map(id => ({ remoteJid: jid, id, fromMe: false }));
      if (keys.length) await session.sock.readMessages(keys);
      return true;
    } catch (e) {
      return false;
    }
  }

  _offEvent(ev, eventName, handler) {
    if (typeof ev.off === 'function') ev.off(eventName, handler);
    else if (typeof ev.removeListener === 'function') ev.removeListener(eventName, handler);
  }

  _waitForMessageAck(session, key, timeoutMs = 15000) {
    if (!key?.id) throw new Error('WhatsApp não retornou ID da mensagem.');

    return new Promise((resolve, reject) => {
      let done = false;
      const sameMessage = (candidateKey = {}) =>
        candidateKey.id === key.id && (!candidateKey.remoteJid || candidateKey.remoteJid === key.remoteJid);

      const finish = (error = null) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        this._offEvent(session.sock.ev, 'messages.update', onMessagesUpdate);
        this._offEvent(session.sock.ev, 'message-receipt.update', onReceiptUpdate);
        error ? reject(error) : resolve();
      };

      const onMessagesUpdate = (updates = []) => {
        for (const item of updates) {
          if (!sameMessage(item.key)) continue;
          const status = item.update?.status ?? item.status;
          if (status === 0) return finish(new Error('WhatsApp rejeitou a mensagem antes do envio.'));
          if (status == null || status >= 2) return finish();
        }
      };

      const onReceiptUpdate = (updates = []) => {
        for (const item of updates) {
          if (sameMessage(item.key)) return finish();
        }
      };

      const timer = setTimeout(() => {
        finish(new Error(`WhatsApp não confirmou o envio da mensagem ${key.id} em ${Math.round(timeoutMs / 1000)}s.`));
      }, timeoutMs);

      session.sock.ev.on('messages.update', onMessagesUpdate);
      session.sock.ev.on('message-receipt.update', onReceiptUpdate);
    });
  }

  async _sendWithAck(session, jid, content, timeoutMs = 15000) {
    const result = await session.sock.sendMessage(jid, content);
    await this._waitForMessageAck(session, result?.key, timeoutMs);
    return result;
  }

  async sendMessage(sessionId, phone, message, media = null) {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'connected') {
      throw new Error('WhatsApp não conectado. Escaneie o QR Code primeiro.');
    }

    const cleaned = phone.replace(/\D/g, '');
    const withCountry = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
    let jid = `${withCountry}@s.whatsapp.net`;

    try {
      const [waContact] = await session.sock.onWhatsApp(withCountry);
      if (!waContact?.exists) {
        throw new Error(`Número ${withCountry} não encontrado no WhatsApp.`);
      }
      jid = waContact.jid || jid;

      let result = null;
      // Envio direto: se sock.sendMessage resolver, considera enviado.
      // O ACK (delivered/read) chega depois via messages.update e atualiza o status no DB.
      // NÃO retentamos aqui — retry causava entrega duplicada quando o ACK demorava (#duplicate-msg).
      const sendWithRetry = async (content) => {
        const r = await session.sock.sendMessage(jid, content);
        if (!r?.key?.id) throw new Error('WhatsApp não retornou ID da mensagem.');
        return r;
      };

      if (media) {
        const { buffer, mimetype, filename, caption } = media;

        // Garante que o buffer está no formato correto para o Baileys
        const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

        console.log(`[wpp] Enviando mídia para ${phone}: tipo=${mimetype} tamanho=${buf.length} bytes filename=${filename}`);

        let msgContent;

        if (mimetype.startsWith('image/')) {
          msgContent = {
            image: buf,
            caption: caption || message || '',
            mimetype,
            jpegThumbnail: undefined,
          };
        } else if (mimetype.startsWith('video/')) {
          msgContent = {
            video: buf,
            caption: caption || message || '',
            mimetype,
            fileName: filename,
          };
        } else if (mimetype.startsWith('audio/')) {
          // MP3 e outros áudios como arquivo (não PTT)
          const isPtt = mimetype.includes('ogg') || mimetype.includes('opus');
          if (isPtt) {
            msgContent = { audio: buf, mimetype, ptt: true };
          } else {
            // MP3, AAC, etc — envia como documento de áudio
            msgContent = {
              audio: buf,
              mimetype,
              ptt: false,
              fileName: filename || 'audio.mp3',
            };
          }
        } else {
          // PDF, XLSX, DOCX, ZIP, etc.
          msgContent = {
            document: buf,
            mimetype,
            fileName: filename || 'arquivo',
            caption: caption || message || '',
          };
        }

        result = await sendWithRetry(msgContent, 20000);
        console.log(`[wpp] ✅ Mídia enviada para ${phone}`);

        // Envia texto separado após áudio (não suporta caption)
        if (message && (mimetype.startsWith('audio/'))) {
          await new Promise(r => setTimeout(r, 1000));
          result = await sendWithRetry({ text: message });
        }
      } else {
        result = await sendWithRetry({ text: message });
      }

      return { success: true, to: jid, messageId: result?.key?.id || null, from: session.phone || null };
    } catch (e) {
      console.error(`[wpp] ❌ Erro ao enviar para ${phone}:`, e.message);
      throw new Error(`Falha ao enviar para ${phone}: ${e.message}`);
    }
  }

  async sendBulk(sessionId, contacts, message, delayMs = 2000, media = null) {
    const results = [];
    for (const contact of contacts) {
      try {
        const personalizedMsg = (contact.text || message)
          .replace(/\{nome\}/gi, contact.name || '')
          .replace(/\{name\}/gi, contact.name || '')
          .replace(/\{numero\}/gi, contact.phone || '');
        const sendResult = await this.sendMessage(sessionId, contact.phone, personalizedMsg, media);
        results.push({ ...contact, status: 'sent', whatsappMessageId: sendResult.messageId || null, sentFrom: sendResult.from || null });
        console.log(`[WPP] ✅ Enviado para ${contact.phone}`);
      } catch (e) {
        results.push({ ...contact, status: 'failed', error: e.message });
        console.error(`[WPP] ❌ Falha ${contact.phone}:`, e.message);
      }
      if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs + Math.random() * 1500));
    }
    return results;
  }

  async sendBulkRoundRobin(userId, sessions, contacts, message, delayMs = 2500, media = null) {
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
        const sendResult = await this.sendMessage(session.key, contact.phone, personalizedMsg, media);
        results.push({ ...contact, status: 'sent', sentVia: `slot${session.slot}`, whatsappMessageId: sendResult.messageId || null, sentFrom: sendResult.from || session.phone || null });
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
