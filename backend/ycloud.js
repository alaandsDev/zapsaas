// YCloud — WhatsApp Business Platform (BSP oficial)
// Docs: https://docs.ycloud.com/reference/whatsapp_message-send-directly
// API key é da conta YCloud (env YCLOUD_API_KEY). O "from" é o número do cliente (E.164).

const BASE = 'https://api.ycloud.com/v2';

// Internacional puro: só normaliza com "+". Usar no "from" (número já registrado).
function intl(phone) {
  const d = String(phone || '').replace(/\D/g, '');
  return d ? `+${d}` : '';
}

// Destino: pode vir como número local brasileiro. Adiciona DDI 55 quando faltar.
function e164(phone) {
  const raw = String(phone || '').trim();
  const d = raw.replace(/\D/g, '');
  if (!d) return '';
  if (raw.startsWith('+')) return `+${d}`;       // já internacional
  if (d.length <= 11) return `+55${d}`;          // brasileiro sem DDI (DDD + número)
  return `+${d}`;                                // já tem DDI
}

async function call(apiKey, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = json?.error?.message || json?.message || json?.whatsappApiError?.message
      || (Object.keys(json).length ? JSON.stringify(json).slice(0, 300) : '');
    const msg = `YCloud HTTP ${res.status}${detail ? ' — ' + detail : ''}`;
    const err = new Error(msg);
    err.details = json;
    throw err;
  }
  return json;
}

// Texto livre (dentro da janela de 24h após o cliente responder)
async function sendText({ apiKey, from }, to, text) {
  return call(apiKey, '/whatsapp/messages/sendDirectly', {
    from: intl(from),
    to: e164(to),
    type: 'text',
    text: { body: String(text).slice(0, 4096) },
  });
}

// Imagem por URL pública + legenda
async function sendImage({ apiKey, from }, to, link, caption = '') {
  return call(apiKey, '/whatsapp/messages/sendDirectly', {
    from: intl(from),
    to: e164(to),
    type: 'image',
    image: { link, caption: caption || undefined },
  });
}

// Mídia genérica por URL pública. type: image | video | audio | document
async function sendMedia({ apiKey, from }, to, { type, link, caption, filename }) {
  const media = { link };
  if (caption && type !== 'audio') media.caption = caption;
  if (type === 'document' && filename) media.filename = filename;
  return call(apiKey, '/whatsapp/messages/sendDirectly', {
    from: intl(from),
    to: e164(to),
    type,
    [type]: media,
  });
}

// ── Embedded Signup (onboarding do cliente) ─────────────────────
// Vincula a WABA do cliente à sua conta YCloud (após o embedded signup)
async function bindWaba({ apiKey }, wabaId) {
  return call(apiKey, `/whatsapp/businessAccounts/${wabaId}/tp/bind`, {});
}

// Registra o número na plataforma (deixa CONNECTED)
async function registerPhoneNumber({ apiKey }, wabaId, phoneNumberId, pin) {
  return call(apiKey, `/whatsapp/phoneNumbers/${wabaId}/${phoneNumberId}/register`, pin ? { pin } : {});
}

// Busca detalhes do número (para descobrir o número E.164 real a partir do phoneNumberId)
async function getPhoneNumber({ apiKey }, phoneNumberId) {
  const res = await fetch(`${BASE}/whatsapp/phoneNumbers/${phoneNumberId}`, { headers: { 'X-API-Key': apiKey } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = json?.error?.message || json?.message || JSON.stringify(json).slice(0, 300);
    throw new Error(`YCloud HTTP ${res.status}${detail ? ' — ' + detail : ''}`);
  }
  return json;
}

// Lista templates da conta (para descobrir nome/idioma/status corretos)
async function listTemplates({ apiKey, wabaId }) {
  const qs = new URLSearchParams({ limit: '100', includeTotal: 'true' });
  if (wabaId) qs.set('filter.wabaId', wabaId);
  const res = await fetch(`${BASE}/whatsapp/templates?${qs}`, {
    headers: { 'X-API-Key': apiKey },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = json?.error?.message || json?.message || JSON.stringify(json).slice(0, 300);
    throw new Error(`YCloud HTTP ${res.status}${detail ? ' — ' + detail : ''}`);
  }
  return json.items || json.data || [];
}

// Template aprovado (única forma fora da janela de 24h)
async function sendTemplate({ apiKey, from }, to, templateName, language = 'pt_BR', variables = []) {
  const components = variables.length > 0 ? [{
    type: 'body',
    parameters: variables.map((v) => ({ type: 'text', text: String(v) })),
  }] : [];
  return call(apiKey, '/whatsapp/messages/sendDirectly', {
    from: intl(from),
    to: e164(to),
    type: 'template',
    template: { name: templateName, language: { code: language }, components },
  });
}

// Normaliza o payload do webhook de entrada para o formato interno do app
// Evento: whatsapp.inbound_message.received
function parseInbound(event) {
  if (event?.type !== 'whatsapp.inbound_message.received') return null;
  const m = event.whatsappInboundMessage || {};
  const out = {
    wamid: m.wamid || m.id || null,
    phone: String(m.from || '').replace(/\D/g, ''),      // cliente
    businessPhone: String(m.to || '').replace(/\D/g, ''), // número do cliente Wayvo
    pushName: m.customerProfile?.name || null,
    type: m.type || 'text',
    text: null,
    mediaUrl: null,
    caption: null,
    mimeType: null,
    timestamp: m.sendTime || new Date().toISOString(),
  };
  if (m.type === 'text') out.text = m.text?.body || '';
  else if (m.image) { out.mediaUrl = m.image.link; out.caption = m.image.caption || null; out.mimeType = m.image.mime_type || 'image/jpeg'; }
  else if (m.video) { out.mediaUrl = m.video.link; out.caption = m.video.caption || null; out.mimeType = m.video.mime_type || 'video/mp4'; }
  else if (m.audio) { out.mediaUrl = m.audio.link; out.mimeType = m.audio.mime_type || 'audio/ogg'; }
  else if (m.document) { out.mediaUrl = m.document.link; out.caption = m.document.caption || null; out.mimeType = m.document.mime_type || 'application/octet-stream'; }
  // Resposta de botão de template (quick reply)
  else if (m.button) { out.type = 'text'; out.text = m.button.text || m.button.payload || '(botão)'; }
  // Resposta de botão/lista interativa
  else if (m.interactive) {
    out.type = 'text';
    out.text = m.interactive.button_reply?.title || m.interactive.list_reply?.title || '(interativo)';
  }
  return out;
}

module.exports = {
  sendText, sendImage, sendMedia, sendTemplate, listTemplates,
  bindWaba, registerPhoneNumber, getPhoneNumber,
  parseInbound, e164, intl,
};
