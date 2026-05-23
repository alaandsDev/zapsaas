/**
 * email.js — Transactional emails via Resend
 * Requires: RESEND_API_KEY env var
 * Optional: FROM_EMAIL (default: noreply@wayvo.com.br)
 *           FRONTEND_URL (default: https://zapsaas.vercel.app)
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL     = process.env.FROM_EMAIL     || 'Wayvo <noreply@wayvo.com.br>';
const FRONTEND_URL   = process.env.FRONTEND_URL   || 'https://zapsaas.vercel.app';

// ── base send ────────────────────────────────────────────────────
async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY não configurada — e-mail ignorado:', subject);
    return;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error('[email] Resend error:', res.status, txt);
    } else {
      console.log(`[email] ✅ Enviado para ${to}: ${subject}`);
    }
  } catch (e) {
    console.error('[email] Falha ao enviar:', e.message);
  }
}

// ── shared layout ────────────────────────────────────────────────
function layout(content) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Wayvo</title>
</head>
<body style="margin:0;padding:0;background:#0B1120;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B1120;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- logo -->
        <tr><td style="padding-bottom:32px;text-align:center;">
          <span style="display:inline-block;background:linear-gradient(135deg,#00FF88,#00D1FF);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:24px;font-weight:800;letter-spacing:-0.5px;">
            Wayvo
          </span>
        </td></tr>

        <!-- card -->
        <tr><td style="background:#111827;border-radius:20px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">
          ${content}
        </td></tr>

        <!-- footer -->
        <tr><td style="padding-top:32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#4B5563;">
            © 2025 Wayvo — Automação de WhatsApp para negócios<br/>
            <a href="${FRONTEND_URL}/dashboard" style="color:#00FF88;text-decoration:none;">Acessar painel</a>
            &nbsp;·&nbsp;
            <a href="mailto:suporte@wayvo.com.br" style="color:#6B7280;text-decoration:none;">Suporte</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(href, label, color = '#00FF88') {
  return `<a href="${href}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,${color},#00D1FF);color:#0B1120;font-weight:700;font-size:15px;text-decoration:none;border-radius:12px;">${label}</a>`;
}

function pill(label, color) {
  return `<span style="display:inline-block;padding:4px 12px;border-radius:99px;background:${color}22;color:${color};font-size:12px;font-weight:600;border:1px solid ${color}44;">${label}</span>`;
}

// ── 1. Boas-vindas ───────────────────────────────────────────────
async function sendWelcome({ to, name }) {
  const subject = '🚀 Bem-vindo ao Wayvo!';
  const html = layout(`
    <!-- hero gradient strip -->
    <div style="height:5px;background:linear-gradient(90deg,#00FF88,#00D1FF);"></div>

    <div style="padding:40px 40px 32px;">
      <p style="margin:0 0 8px;font-size:28px;">👋</p>
      <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#F9FAFB;">
        Olá, ${name}!
      </h1>
      <p style="margin:0 0 28px;font-size:15px;color:#9CA3AF;line-height:1.7;">
        Sua conta Wayvo está pronta. Você agora tem acesso a
        <strong style="color:#F9FAFB;">automação de WhatsApp</strong>,
        disparos em massa, workflows inteligentes e muito mais.
      </p>

      <!-- steps -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
        ${[
          ['📱', 'Conectar WhatsApp', 'Vá em Conexões e escaneie o QR Code', '/dashboard/canais'],
          ['👥', 'Importar Leads',    'Importe sua lista de contatos em CSV ou XLSX', '/dashboard/leads'],
          ['🚀', 'Primeiro Disparo', 'Crie e envie sua primeira campanha',           '/dashboard/campanhas'],
        ].map(([icon, title, desc, path]) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="width:44px;vertical-align:top;">
                <span style="display:inline-block;width:36px;height:36px;line-height:36px;text-align:center;background:rgba(255,255,255,0.05);border-radius:10px;font-size:18px;">${icon}</span>
              </td>
              <td style="padding-left:12px;">
                <p style="margin:0;font-size:14px;font-weight:600;color:#F9FAFB;">${title}</p>
                <p style="margin:2px 0 0;font-size:13px;color:#6B7280;">${desc}</p>
              </td>
            </tr></table>
          </td>
        </tr>`).join('')}
      </table>

      <div style="text-align:center;">
        ${btn(FRONTEND_URL + '/dashboard', '🎯 Acessar meu painel')}
      </div>
    </div>

    <div style="padding:20px 40px;background:rgba(0,255,136,0.04);border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
      <p style="margin:0;font-size:13px;color:#6B7280;">
        Dúvidas? Fale com a gente em
        <a href="mailto:suporte@wayvo.com.br" style="color:#00FF88;text-decoration:none;">suporte@wayvo.com.br</a>
      </p>
    </div>
  `);
  return sendEmail({ to, subject, html });
}

// ── 2. Campanha concluída ────────────────────────────────────────
async function sendCampaignCompleted({ to, name, campaignName, sent, failed, total }) {
  const rate = total > 0 ? Math.round((sent / total) * 100) : 0;
  const rateColor = rate >= 80 ? '#00FF88' : rate >= 50 ? '#F59E0B' : '#EF4444';
  const subject = `✅ Campanha "${campaignName}" concluída`;
  const html = layout(`
    <div style="height:5px;background:linear-gradient(90deg,${rateColor},#00D1FF);"></div>

    <div style="padding:40px 40px 32px;">
      <p style="margin:0 0 8px;font-size:28px;">📊</p>
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#F9FAFB;">
        Campanha concluída
      </h1>
      <p style="margin:0 0 6px;font-size:15px;color:#9CA3AF;">
        Olá, <strong style="color:#F9FAFB;">${name}</strong>! Sua campanha
        <strong style="color:#F9FAFB;">"${campaignName}"</strong> terminou.
      </p>

      <!-- stats -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;background:rgba(255,255,255,0.03);border-radius:14px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">
        ${[
          ['Enviados',   sent,   '#00FF88'],
          ['Falhas',     failed, failed > 0 ? '#EF4444' : '#6B7280'],
          ['Total',      total,  '#9CA3AF'],
          ['Taxa',       rate + '%', rateColor],
        ].map(([label, value, color]) => `
        <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
          <td style="padding:14px 20px;font-size:13px;color:#9CA3AF;">${label}</td>
          <td style="padding:14px 20px;font-size:18px;font-weight:700;color:${color};text-align:right;">${value}</td>
        </tr>`).join('')}
      </table>

      <!-- progress bar -->
      <div style="background:rgba(255,255,255,0.07);border-radius:99px;height:6px;overflow:hidden;margin-bottom:28px;">
        <div style="width:${rate}%;height:100%;background:linear-gradient(90deg,${rateColor},#00D1FF);border-radius:99px;"></div>
      </div>

      <div style="text-align:center;">
        ${btn(FRONTEND_URL + '/dashboard/campanhas', '📋 Ver detalhes da campanha')}
      </div>
    </div>

    <div style="padding:20px 40px;background:rgba(0,0,0,0.2);border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
      ${pill('Campanha finalizada', rateColor)}
    </div>
  `);
  return sendEmail({ to, subject, html });
}

// ── 3. Sessão desconectada ───────────────────────────────────────
async function sendSessionDisconnected({ to, name, slot, phone }) {
  const subject = `⚠️ WhatsApp desconectado — Número ${slot}`;
  const phoneDisplay = phone ? `+${phone}` : `Slot ${slot}`;
  const html = layout(`
    <div style="height:5px;background:linear-gradient(90deg,#F59E0B,#EF4444);"></div>

    <div style="padding:40px 40px 32px;">
      <p style="margin:0 0 8px;font-size:28px;">⚠️</p>
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#F9FAFB;">
        Número desconectado
      </h1>
      <p style="margin:0 0 24px;font-size:15px;color:#9CA3AF;line-height:1.7;">
        Olá, <strong style="color:#F9FAFB;">${name}</strong>!<br/>
        O número <strong style="color:#F9FAFB;">${phoneDisplay}</strong> (Slot ${slot})
        foi desconectado do Wayvo. Disparos e automações desse número foram pausados.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;background:rgba(245,158,11,0.06);border-radius:14px;border:1px solid rgba(245,158,11,0.2);overflow:hidden;">
        <tr><td style="padding:20px;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#F59E0B;">O que pode ter acontecido?</p>
          <ul style="margin:0;padding-left:18px;font-size:13px;color:#9CA3AF;line-height:1.8;">
            <li>Você deslogou do WhatsApp no celular</li>
            <li>O WhatsApp foi reinstalado ou trocou de celular</li>
            <li>Sessão expirada por inatividade</li>
            <li>Reinicialização do servidor</li>
          </ul>
        </td></tr>
      </table>

      <div style="text-align:center;">
        ${btn(FRONTEND_URL + '/dashboard/canais', '🔗 Reconectar agora', '#F59E0B')}
      </div>
    </div>

    <div style="padding:20px 40px;background:rgba(0,0,0,0.2);border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
      ${pill('Ação necessária', '#F59E0B')}
    </div>
  `);
  return sendEmail({ to, subject, html });
}

module.exports = { sendEmail, sendWelcome, sendCampaignCompleted, sendSessionDisconnected };
