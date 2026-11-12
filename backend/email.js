// Resend — https://resend.com/docs/api-reference/emails/send-email
async function sendEmail({ to, subject, html, text, from }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY não configurada');

  const fromAddr = from || process.env.RESEND_FROM || 'Wayvo <noreply@wayvo.app.br>';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      from: fromAddr,
      to: Array.isArray(to) ? to : [to],
      subject: String(subject || '(sem assunto)'),
      html: html ? String(html) : undefined,
      text: text ? String(text) : undefined,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || data?.name || `Resend HTTP ${res.status}`);
  }
  return { id: data?.id || null, status: 'sent' };
}

module.exports = { sendEmail };
