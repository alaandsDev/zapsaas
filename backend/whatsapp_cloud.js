// WhatsApp Cloud API (Meta direto) — https://graph.facebook.com/v21.0
// Cada user tem sua própria credencial (multi-tenant).

const crypto = require('crypto');

const GRAPH = 'https://graph.facebook.com/v21.0';

function clean(phone) {
  const d = String(phone || '').replace(/\D/g, '');
  return d.startsWith('55') ? d : `55${d}`;
}

async function call(token, path, opts = {}) {
  const res = await fetch(`${GRAPH}${path}`, {
    method: opts.method || 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {})
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error?.message || `Meta HTTP ${res.status}`;
    const err = new Error(msg);
    err.code = json?.error?.code;
    err.details = json?.error;
    throw err;
  }
  return json;
}

// Envia mensagem de TEMPLATE (única forma fora da janela de 24h)
async function sendTemplate({ token, phoneNumberId }, to, templateName, language = 'pt_BR', variables = []) {
  const components = variables.length > 0 ? [{
    type: 'body',
    parameters: variables.map((v) => ({ type: 'text', text: String(v) }))
  }] : [];
  return call(token, `/${phoneNumberId}/messages`, {
    method: 'POST',
    body: {
      messaging_product: 'whatsapp',
      to: clean(to),
      type: 'template',
      template: { name: templateName, language: { code: language }, components }
    }
  });
}

// Mensagem de texto livre (só dentro da janela de 24h após contato responder)
async function sendText({ token, phoneNumberId }, to, text) {
  return call(token, `/${phoneNumberId}/messages`, {
    method: 'POST',
    body: {
      messaging_product: 'whatsapp',
      to: clean(to),
      type: 'text',
      text: { body: String(text).slice(0, 4096), preview_url: false }
    }
  });
}

// Verifica credenciais — pega info do número
async function verify({ token, phoneNumberId }) {
  return call(token, `/${phoneNumberId}?fields=display_phone_number,verified_name,quality_rating,name_status`);
}

// Lista templates da WABA (paginação automática, até 1000 templates)
async function listTemplates({ token, businessAccountId }) {
  const all = [];
  let path = `/${businessAccountId}/message_templates?limit=100`;
  while (path) {
    const page = await call(token, path);
    if (Array.isArray(page.data)) all.push(...page.data);
    path = page.paging?.next
      ? page.paging.next.replace(`${GRAPH}`, '')
      : null;
  }
  return { data: all };
}

// Cria template (precisa aprovação Meta)
async function createTemplate({ token, businessAccountId }, { name, language = 'pt_BR', category, components }) {
  return call(token, `/${businessAccountId}/message_templates`, {
    method: 'POST',
    body: { name, language, category, components }
  });
}

// Info da conta WABA (verificação empresarial, nome)
async function getAccount({ token, businessAccountId }) {
  return call(token, `/${businessAccountId}?fields=id,name,business_verification_status`);
}

// Qualidade + tier de limite de mensagens do número
async function getQuality({ token, phoneNumberId }) {
  return call(token, `/${phoneNumberId}?fields=quality_rating,messaging_limit_tier,code_verification_status,display_phone_number,verified_name`);
}

// Valida assinatura HMAC do webhook (X-Hub-Signature-256)
function verifyWebhookSignature(rawBody, signatureHeader, appSecret) {
  if (!signatureHeader || !appSecret) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
  try { return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected)); } catch { return false; }
}

module.exports = {
  sendTemplate, sendText, verify, listTemplates, createTemplate,
  verifyWebhookSignature, clean, getAccount, getQuality,
};
