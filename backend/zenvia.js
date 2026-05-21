// Zenvia SMS — REST API (https://api.zenvia.com/v2/channels/sms/messages)
// Requer ZENVIA_TOKEN e ZENVIA_FROM (alfanumérico ou número aprovado).

const ZENVIA_URL = 'https://api.zenvia.com/v2/channels/sms/messages';

function cleanPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.startsWith('55') ? digits : `55${digits}`;
}

async function sendSms(to, text) {
  const token = process.env.ZENVIA_TOKEN;
  const from = process.env.ZENVIA_FROM;
  if (!token || !from) throw new Error('ZENVIA_TOKEN e ZENVIA_FROM não configurados');

  const res = await fetch(ZENVIA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-TOKEN': token },
    body: JSON.stringify({
      from,
      to: cleanPhone(to),
      contents: [{ type: 'text', text: String(text).slice(0, 480) }]
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || data?.error || `Zenvia HTTP ${res.status}`;
    throw new Error(msg);
  }
  return { id: data.id, status: 'sent' };
}

module.exports = { sendSms, cleanPhone };
