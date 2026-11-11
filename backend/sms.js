// Camada de provedor de SMS — escolha via env SMS_PROVIDER (comtele | zenvia).
// Default: comtele se COMTELE_AUTH_KEY existir, senão zenvia.
const zenvia = require('./zenvia');

function clean(phone) {
  const d = String(phone || '').replace(/\D/g, '');
  return d.startsWith('55') ? d : `55${d}`;
}

// Comtele — https://docs.comtele.com.br/  POST https://sms.comtele.com.br/api/v2/send
async function sendComtele(to, text) {
  const key = process.env.COMTELE_AUTH_KEY;
  const sender = process.env.COMTELE_SENDER || '';
  if (!key) throw new Error('COMTELE_AUTH_KEY não configurada');

  const route = parseInt(process.env.COMTELE_ROUTE || '17', 10);
  const res = await fetch('https://api.comtele.com.br/messages/sms/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': key },
    body: JSON.stringify({
      receivers: [Number(clean(to))],
      contactGroups: [],
      message: String(text).slice(0, 480),
      route,
      tag: 'wayvo',
      custom: '',
      scheduleDate: null,
      ...(sender ? { sourceAddress: Number(sender) } : {}),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.hasError === true) {
    throw new Error((data?.errors?.[0]) || data?.message || `Comtele HTTP ${res.status}`);
  }
  return { id: data?.object?.requestId || null, status: 'sent' };
}

function provider() {
  const p = (process.env.SMS_PROVIDER || (process.env.COMTELE_AUTH_KEY ? 'comtele' : 'zenvia')).toLowerCase();
  return p;
}

async function sendSms(to, text) {
  return provider() === 'comtele' ? sendComtele(to, text) : zenvia.sendSms(to, text);
}

module.exports = { sendSms, sendComtele, provider };
