require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const wpp = require('./whatsapp');
const Stripe = require('stripe');
const cron = require('node-cron');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const app = express();

// ── CORS ──────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['https://zapsaas.vercel.app', 'https://delivery-full-production.up.railway.app', 'http://localhost:3000', 'http://localhost:5500'];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      cb(null, true);
    } else {
      cb(new Error(`CORS bloqueado para origem: ${origin}`));
    }
  },
  credentials: true
}));

app.use(express.json());

// ── SUPABASE ──────────────────────────────────────────────────
console.log('[startup] SUPABASE_URL:', process.env.SUPABASE_URL ? 'OK' : 'MISSING');
console.log('[startup] SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'OK' : 'MISSING');
console.log('[startup] PORT:', process.env.PORT || 3001);

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('[FATAL] Variáveis SUPABASE_URL e SUPABASE_SERVICE_KEY são obrigatórias!');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ── HELPERS ───────────────────────────────────────────────────
function hash(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Não autorizado' });

  try {
    const { data: session, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !session) {
      console.log('[auth] 401 - token:', token?.substring(0,12), '| erro:', error?.code, error?.message);
      return res.status(401).json({ error: 'Sessão inválida' });
    }
    if (new Date(session.expires_at) < new Date()) {
      await supabase.from('sessions').delete().eq('token', token);
      return res.status(401).json({ error: 'Sessão expirada' });
    }

    req.user = session.user_data;
    next();
  } catch (e) {
    console.error('[auth] Erro inesperado:', e.message);
    return res.status(500).json({ error: 'Erro de autenticação' });
  }
}

// ── HEALTH CHECK ──────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ═══════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email e senha são obrigatórios' });

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role, password')
      .eq('email', email)
      .eq('password', hash(password))
      .single();

    if (error || !user) return res.status(401).json({ error: 'Email ou senha inválidos' });

    const token = crypto.randomBytes(32).toString('hex');
    const userData = { id: user.id, name: user.name, email: user.email, role: user.role };

    const { error: sessionError } = await supabase.from('sessions').insert({
      token,
      user_id: user.id,
      user_data: userData,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });

    if (sessionError) {
      console.error('[login] Erro ao salvar sessão:', sessionError);
      return res.status(500).json({ error: 'Erro ao criar sessão: ' + sessionError.message });
    }

    console.log('[login] Sessão criada para:', userData.email);
    res.json({ token, user: userData });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Campos obrigatórios' });

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) return res.status(400).json({ error: 'Email já cadastrado' });

    const { error } = await supabase.from('users').insert({
      name,
      email,
      password: hash(password),
      role: 'user'
    });

    if (error) throw error;
    res.json({ message: 'Usuário criado com sucesso' });
  } catch (e) {
    console.error('Register error:', e);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

app.post('/api/auth/logout', requireAuth, async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  await supabase.from('sessions').delete().eq('token', token);
  res.json({ message: 'Logout realizado' });
});

// ═══════════════════════════════════════════════════════════════
// LEADS
// ═══════════════════════════════════════════════════════════════

app.get('/api/leads', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao buscar leads' });
  }
});

app.post('/api/leads', async (req, res) => {
  try {
    const { name, phone, interest, source, user_id: bodyUserId } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });

    // Try to get user from auth header if present
    let userId = bodyUserId || null;
    const authHeader = req.headers['authorization'];
    if (!userId && authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: session } = await supabase.from('sessions').select('user_id').eq('token', token).single();
      if (session) userId = session.user_id;
    }

    const { data, error } = await supabase
      .from('leads')
      .insert({ name, phone, interest: interest || '', source: source || 'form', status: 'new', user_id: userId })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao criar lead' });
  }
});

app.patch('/api/leads/:id', requireAuth, async (req, res) => {
  try {
    const allowed = ['name', 'phone', 'interest', 'status'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );

    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Lead não encontrado' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao atualizar lead' });
  }
});

app.delete('/api/leads/:id', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase.from('leads').delete().eq('id', req.params.id).eq('user_id', req.user.id);
    if (error) throw error;
    res.json({ message: 'Lead removido' });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao remover lead' });
  }
});

// ═══════════════════════════════════════════════════════════════
// MESSAGES
// ═══════════════════════════════════════════════════════════════

app.get('/api/messages', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
});

app.post('/api/messages', requireAuth, async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Título e conteúdo obrigatórios' });

    const { data, error } = await supabase
      .from('messages')
      .insert({ title, content, tags: tags || [], user_id: req.user.id })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao criar mensagem' });
  }
});

app.delete('/api/messages/:id', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase.from('messages').delete().eq('id', req.params.id).eq('user_id', req.user.id);
    if (error) throw error;
    res.json({ message: 'Mensagem removida' });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao remover mensagem' });
  }
});

// ═══════════════════════════════════════════════════════════════
// DISPATCHES
// ═══════════════════════════════════════════════════════════════

app.get('/api/dispatches', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('dispatches')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao buscar disparos' });
  }
});

app.post('/api/dispatches', requireAuth, async (req, res) => {
  try {
    const { messageId, contactIds, scheduledAt, useWhatsapp } = req.body;
    if (!messageId || !contactIds?.length) {
      return res.status(400).json({ error: 'Mensagem e contatos são obrigatórios' });
    }

    const limit = await checkDispatchLimit(req.user.id);
    if (!limit.ok) {
      return res.status(402).json({ error: `Limite de disparos do plano ${limit.plan} atingido (${limit.used}/${limit.limit} este mês). Faça upgrade para continuar.`, code: 'PLAN_LIMIT', plan: limit.plan, used: limit.used, limit: limit.limit });
    }

    const { data: message } = await supabase.from('messages').select('*').eq('id', messageId).eq('user_id', req.user.id).single();
    if (!message) return res.status(404).json({ error: 'Mensagem não encontrada' });

    const { data: contacts } = await supabase.from('leads').select('id, name, phone').in('id', contactIds).eq('user_id', req.user.id);
    const items = (contacts || []).map(c => ({ contactId: c.id, contactName: c.name, contactPhone: c.phone, status: 'pending' }));

    // Se agendado, verifica se é futuro
    const isScheduled = scheduledAt && new Date(scheduledAt) > new Date();
    const wppStatus = wpp.getStatus(req.user.id);
    const hasWhatsapp = wppStatus.status === 'connected';

    const { data: dispatch, error } = await supabase.from('dispatches').insert({
      message_id: messageId,
      message_title: message.title,
      message_content: message.content,
      total: items.length,
      sent: 0, failed: 0,
      status: isScheduled ? 'scheduled' : 'pending',
      items,
      scheduled_at: scheduledAt || null,
      user_id: req.user.id
    }).select().single();

    if (error) throw error;

    if (!isScheduled) {
      if (hasWhatsapp && useWhatsapp !== false) {
        // Disparo REAL via WhatsApp
        executeRealDispatch(dispatch.id, req.user.id);
      } else {
        // Simulação
        simulateSending(dispatch.id);
      }
    }

    res.json({ ...dispatch, via: hasWhatsapp ? 'whatsapp' : 'simulated', scheduled: isScheduled });
  } catch (e) {
    console.error('Dispatch error:', e);
    res.status(500).json({ error: 'Erro ao criar disparo' });
  }
});

app.delete('/api/dispatches/:id', requireAuth, async (req, res) => {
  try {
    await supabase.from('dispatches').delete().eq('id', req.params.id).eq('user_id', req.user.id);
    res.json({ message: 'Disparo removido' });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao remover disparo' });
  }
});

async function executeRealDispatch(dispatchId, userId) {
  const { data: dispatch } = await supabase.from('dispatches').select('*').eq('id', dispatchId).single();
  if (!dispatch) return;

  await supabase.from('dispatches').update({ status: 'sending' }).eq('id', dispatchId);

  const results = await wpp.sendBulk(userId, dispatch.items.map(i => ({
    id: i.contactId, name: i.contactName, phone: i.contactPhone
  })), dispatch.message_content, 2500);

  const sent = results.filter(r => r.status === 'sent').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const updatedItems = dispatch.items.map((item, idx) => ({
    ...item, status: results[idx]?.status || 'failed', sentAt: new Date().toISOString()
  }));

  await supabase.from('dispatches').update({
    sent, failed, status: 'completed',
    items: updatedItems,
    completed_at: new Date().toISOString()
  }).eq('id', dispatchId);

  console.log(`[dispatch] Real dispatch ${dispatchId}: ${sent} enviados, ${failed} falhas`);
}

async function simulateSending(dispatchId) {
  const { data: dispatch } = await supabase
    .from('dispatches')
    .select('*')
    .eq('id', dispatchId)
    .single();

  if (!dispatch) return;

  await supabase.from('dispatches').update({ status: 'sending' }).eq('id', dispatchId);

  let idx = 0;
  const items = [...dispatch.items];

  const interval = setInterval(async () => {
    if (idx >= items.length) {
      clearInterval(interval);
      await supabase.from('dispatches').update({
        status: 'completed',
        completed_at: new Date().toISOString()
      }).eq('id', dispatchId);
      return;
    }

    const success = Math.random() > 0.1;
    items[idx].status = success ? 'sent' : 'failed';
    items[idx].sentAt = new Date().toISOString();

    const { data: current } = await supabase
      .from('dispatches')
      .select('sent, failed')
      .eq('id', dispatchId)
      .single();

    await supabase.from('dispatches').update({
      items,
      sent: (current?.sent || 0) + (success ? 1 : 0),
      failed: (current?.failed || 0) + (success ? 0 : 1)
    }).eq('id', dispatchId);

    idx++;
  }, 400);
}

// ═══════════════════════════════════════════════════════════════
// CHATBOT
// ═══════════════════════════════════════════════════════════════

app.get('/api/chatbot/config', requireAuth, async (req, res) => {
  try {
    const { data } = await supabase
      .from('chatbot_config')
      .select('*')
      .is('user_id', null)
      .single();

    res.json(data || { menus: {}, keywords: {} });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao buscar configuração do chatbot' });
  }
});

app.post('/api/chatbot/message', async (req, res) => {
  try {
    const { message, currentMenu } = req.body;

    const { data: config } = await supabase
      .from('chatbot_config')
      .select('menus, keywords')
      .is('user_id', null)
      .single();

    if (!config) return res.status(500).json({ error: 'Chatbot não configurado' });

    const { menus, keywords } = config;
    const text = (message || '').trim();
    const textLower = text.toLowerCase();

    let targetMenu = null;
    for (const [keyword, menu] of Object.entries(keywords)) {
      if (textLower.includes(keyword)) { targetMenu = menu; break; }
    }

    const menu = menus[currentMenu || 'main'];
    let nextMenuKey = menu?.options?.[text] || menu?.options?.[textLower] || targetMenu;
    if (!nextMenuKey && !menu?.action) nextMenuKey = 'main';

    const nextMenu = menus[nextMenuKey] || menus['main'];
    res.json({
      reply: nextMenu.text,
      nextMenu: nextMenuKey || 'main',
      action: nextMenu.action || null
    });
  } catch (e) {
    res.status(500).json({ error: 'Erro no chatbot' });
  }
});

// ═══════════════════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════════════════

app.get('/api/stats', requireAuth, async (req, res) => {
  try {
    const uid = req.user.id;
    const [
      { count: totalLeads },
      { count: newLeads },
      { count: totalMessages },
      { count: totalDispatches },
      { data: dispatchData },
      { data: lastLeads }
    ] = await Promise.all([
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('user_id', uid),
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('status', 'new'),
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('user_id', uid),
      supabase.from('dispatches').select('*', { count: 'exact', head: true }).eq('user_id', uid),
      supabase.from('dispatches').select('sent').eq('user_id', uid),
      supabase.from('leads').select('id, name, phone, status, created_at').eq('user_id', uid).order('created_at', { ascending: false }).limit(5)
    ]);

    const messagesSent = (dispatchData || []).reduce((acc, d) => acc + (d.sent || 0), 0);

    res.json({
      leads: totalLeads || 0,
      newLeads: newLeads || 0,
      messages: totalMessages || 0,
      dispatches: totalDispatches || 0,
      messagesSent,
      lastLeads: lastLeads || []
    });
  } catch (e) {
    console.error('Stats error:', e);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// ═══════════════════════════════════════════════════════════════
// WHATSAPP
// ═══════════════════════════════════════════════════════════════

// Iniciar / conectar sessão (gera QR)
app.post('/api/whatsapp/connect', requireAuth, async (req, res) => {
  try {
    const sessionId = req.user.id; // cada usuário tem sua sessão
    const result = await wpp.createSession(sessionId);
    res.json(result);
  } catch (e) {
    console.error('[WPP] connect error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Status da sessão + QR Code atual
app.get('/api/whatsapp/status', requireAuth, async (req, res) => {
  const sessionId = req.user.id;
  res.json(wpp.getStatus(sessionId));
});

// Desconectar / logout
app.post('/api/whatsapp/disconnect', requireAuth, async (req, res) => {
  try {
    await wpp.disconnectSession(req.user.id);
    res.json({ message: 'Desconectado com sucesso' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Enviar mensagem única (teste)
app.post('/api/whatsapp/send', requireAuth, async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) return res.status(400).json({ error: 'Telefone e mensagem são obrigatórios' });
    const result = await wpp.sendMessage(req.user.id, phone, message);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Disparo em massa REAL via WhatsApp
app.post('/api/whatsapp/dispatch', requireAuth, async (req, res) => {
  try {
    const { messageId, contactIds } = req.body;
    if (!messageId || !contactIds?.length) {
      return res.status(400).json({ error: 'Mensagem e contatos são obrigatórios' });
    }

    const limit = await checkDispatchLimit(req.user.id);
    if (!limit.ok) {
      return res.status(402).json({ error: `Limite de disparos do plano ${limit.plan} atingido (${limit.used}/${limit.limit} este mês). Faça upgrade para continuar.`, code: 'PLAN_LIMIT', plan: limit.plan, used: limit.used, limit: limit.limit });
    }

    const status = wpp.getStatus(req.user.id);
    if (status.status !== 'connected') {
      return res.status(400).json({ error: 'WhatsApp não conectado. Escaneie o QR Code primeiro.' });
    }

    const { data: message } = await supabase.from('messages').select('*').eq('id', messageId).eq('user_id', req.user.id).single();
    if (!message) return res.status(404).json({ error: 'Mensagem não encontrada' });

    const { data: contacts } = await supabase.from('leads').select('id, name, phone').in('id', contactIds).eq('user_id', req.user.id);
    if (!contacts?.length) return res.status(404).json({ error: 'Nenhum contato encontrado' });

    // Cria registro do disparo no banco
    const items = contacts.map(c => ({ contactId: c.id, contactName: c.name, contactPhone: c.phone, status: 'pending' }));
    const { data: dispatch } = await supabase.from('dispatches').insert({
      message_id: messageId,
      message_title: message.title,
      message_content: message.content,
      total: contacts.length,
      sent: 0, failed: 0,
      status: 'sending',
      items,
      user_id: req.user.id
    }).select().single();

    res.json({ dispatchId: dispatch.id, total: contacts.length, message: 'Disparo iniciado!' });

    // Executa envio real em background
    (async () => {
      const results = await wpp.sendBulk(req.user.id, contacts, message.content, 2500);
      const sent = results.filter(r => r.status === 'sent').length;
      const failed = results.filter(r => r.status === 'failed').length;
      const updatedItems = results.map(r => ({
        contactId: r.id, contactName: r.name, contactPhone: r.phone,
        status: r.status, sentAt: new Date().toISOString(), error: r.error || null
      }));
      await supabase.from('dispatches').update({
        sent, failed, status: 'completed',
        items: updatedItems,
        completed_at: new Date().toISOString()
      }).eq('id', dispatch.id);
      console.log(`[WPP] Disparo ${dispatch.id} concluído: ${sent} enviados, ${failed} falhas`);
    })();

  } catch (e) {
    console.error('[WPP] dispatch error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Disparo em massa por lista de números diretos (contatos importados)
app.post('/api/whatsapp/bulk', requireAuth, async (req, res) => {
  try {
    const { phones, message, delay, pauseEvery, pauseDuration, scheduledAt } = req.body;
    if (!message || !phones?.length) {
      return res.status(400).json({ error: 'Mensagem e contatos são obrigatórios' });
    }

    const limit = await checkDispatchLimit(req.user.id);
    if (!limit.ok) {
      return res.status(402).json({ error: `Limite de disparos do plano ${limit.plan} atingido (${limit.used}/${limit.limit} este mês). Faça upgrade para continuar.`, code: 'PLAN_LIMIT', plan: limit.plan, used: limit.used, limit: limit.limit });
    }

    const status = wpp.getStatus(req.user.id);
    if (status.status !== 'connected') {
      return res.status(400).json({ error: 'WhatsApp não conectado. Escaneie o QR Code primeiro.' });
    }
    const items = phones.map(p => ({ contactName: p.name || p.phone, contactPhone: p.phone, status: 'pending' }));
    const { data: dispatch, error } = await supabase.from('dispatches').insert({
      message_id: null,
      message_title: `Disparo ${new Date().toLocaleDateString('pt-BR')}`,
      message_content: message,
      total: phones.length,
      sent: 0, failed: 0,
      status: scheduledAt ? 'scheduled' : 'sending',
      items,
      user_id: req.user.id,
      scheduled_at: scheduledAt || null
    }).select().single();
    if (error) throw error;
    res.json({ dispatchId: dispatch.id, total: phones.length, message: scheduledAt ? 'Disparo agendado!' : 'Disparo iniciado!' });
    if (!scheduledAt) {
      (async () => {
        const delayMs = Math.max(1000, (parseInt(delay) || 3) * 1000);
        const pause = parseInt(pauseEvery) || 0;
        const pauseMs = (parseInt(pauseDuration) || 5) * 60 * 1000;
        const updatedItems = [...items];
        let sent = 0, failed = 0;
        for (let i = 0; i < phones.length; i++) {
          const p = phones[i];
          try {
            // Support pre-personalized text per phone (multiMessage mode)
            const msgText = p.text || message.replace(/\{nome\}/gi, p.name || '').replace(/\{name\}/gi, p.name || '').replace(/\{numero\}/gi, p.phone || '');
            await wpp.sendMessage(req.user.id, p.phone, msgText);
            updatedItems[i] = { ...updatedItems[i], status: 'sent', sentAt: new Date().toISOString() };
            sent++;
          } catch (e) {
            updatedItems[i] = { ...updatedItems[i], status: 'failed', error: e.message };
            failed++;
          }
          await supabase.from('dispatches').update({ sent, failed, items: updatedItems }).eq('id', dispatch.id);
          if (i < phones.length - 1) {
            await new Promise(r => setTimeout(r, delayMs));
            if (pause > 0 && (i + 1) % pause === 0) {
              await new Promise(r => setTimeout(r, pauseMs));
            }
          }
        }
        await supabase.from('dispatches').update({
          sent, failed, status: 'completed', items: updatedItems,
          completed_at: new Date().toISOString()
        }).eq('id', dispatch.id);
      })();
    }
  } catch (e) {
    console.error('[bulk] error:', e);
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// LISTAS DE CONTATOS
// ═══════════════════════════════════════════════════════════════

// Listar todas as listas do usuário
app.get('/api/lists', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('contact_lists')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Criar nova lista com contatos
app.post('/api/lists', requireAuth, async (req, res) => {
  try {
    const { name, contacts } = req.body;
    if (!name || !contacts?.length) return res.status(400).json({ error: 'Nome e contatos são obrigatórios' });
    const { data, error } = await supabase.from('contact_lists').insert({
      name,
      contacts,
      total: contacts.length,
      user_id: req.user.id
    }).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Buscar contatos de uma lista
app.get('/api/lists/:id', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('contact_lists')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(404).json({ error: 'Lista não encontrada' });
  }
});

// Deletar lista
app.delete('/api/lists/:id', requireAuth, async (req, res) => {
  try {
    await supabase.from('contact_lists').delete().eq('id', req.params.id).eq('user_id', req.user.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});



const PLANS = {
  free: { name: 'Gratuito', price: 0,    priceId: null,                          leads: 50,    dispatches: 3  },
  pro:  { name: 'Pro',      price: 4700, priceId: process.env.STRIPE_PRICE_PRO,  leads: 99999, dispatches: 999 },
};

app.get('/api/plans', (req, res) => {
  res.json(Object.entries(PLANS).map(([id, p]) => ({ id, name: p.name, price: p.price, leads: p.leads, dispatches: p.dispatches })));
});

async function getEffectivePlan(userId) {
  const { data: user } = await supabase.from('users').select('plan, plan_expires_at').eq('id', userId).single();
  let plan = user?.plan || 'free';
  if (user?.plan_expires_at && new Date(user.plan_expires_at) < new Date()) plan = 'free';
  return plan;
}

async function checkDispatchLimit(userId) {
  const plan = await getEffectivePlan(userId);
  const limit = PLANS[plan]?.dispatches ?? 3;
  if (limit >= 999) return { ok: true, plan, used: 0, limit };
  const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from('dispatches')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', start.toISOString());
  const used = count || 0;
  return { ok: used < limit, plan, used, limit };
}

app.get('/api/usage', requireAuth, async (req, res) => {
  try {
    const dispatch = await checkDispatchLimit(req.user.id);
    res.json({ plan: dispatch.plan, dispatches: { used: dispatch.used, limit: dispatch.limit } });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao buscar uso' });
  }
});

app.get('/api/subscription', requireAuth, async (req, res) => {
  try {
    const { data: user } = await supabase.from('users').select('plan, plan_expires_at, stripe_customer_id').eq('id', req.user.id).single();
    res.json({ plan: user?.plan || 'free', expires_at: user?.plan_expires_at || null });
  } catch (e) {
    res.json({ plan: 'free', expires_at: null });
  }
});

app.post('/api/stripe/checkout', requireAuth, async (req, res) => {
  try {
    const { planId } = req.body;
    const plan = PLANS[planId];
    if (!plan || planId === 'free') return res.status(400).json({ error: 'Plano inválido' });
    if (!plan.priceId) return res.status(400).json({ error: `Configure STRIPE_PRICE_${planId.toUpperCase()} nas variáveis de ambiente` });

    const { data: user } = await supabase.from('users').select('*').eq('id', req.user.id).single();

    // Cria ou recupera customer no Stripe
    let customerId = user?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, name: user.name });
      customerId = customer.id;
      await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', req.user.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_update: { name: 'auto', address: 'auto' },
      mode: 'subscription',
      payment_method_types: ['card'],
      locale: 'pt-BR',
      phone_number_collection: { enabled: true },
      tax_id_collection: { enabled: true },
      line_items: [{ price: plan.priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL || 'https://zapsaas.vercel.app'}/?payment=success&plan=${planId}`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://zapsaas.vercel.app'}/?payment=cancelled`,
      metadata: { userId: req.user.id, planId },
    });

    res.json({ url: session.url });
  } catch (e) {
    console.error('[stripe] checkout error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/stripe/portal', requireAuth, async (req, res) => {
  try {
    const { data: user } = await supabase.from('users').select('stripe_customer_id').eq('id', req.user.id).single();
    if (!user?.stripe_customer_id) return res.status(400).json({ error: 'Nenhuma assinatura ativa' });

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: process.env.FRONTEND_URL || 'https://zapsaas.vercel.app',
    });
    res.json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Webhook Stripe — atualiza plano após pagamento
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
  } catch (e) {
    console.error('[stripe] webhook signature error:', e.message);
    return res.status(400).send(`Webhook Error: ${e.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, planId } = session.metadata;
    if (userId && planId) {
      const expires = new Date();
      expires.setMonth(expires.getMonth() + 1);
      await supabase.from('users').update({
        plan: planId,
        plan_expires_at: expires.toISOString(),
        stripe_customer_id: session.customer
      }).eq('id', userId);
      console.log(`[stripe] Plano ${planId} ativado para user ${userId}`);
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const { data: users } = await supabase.from('users').select('id').eq('stripe_customer_id', sub.customer);
    if (users?.[0]) {
      await supabase.from('users').update({ plan: 'free', plan_expires_at: null }).eq('id', users[0].id);
      console.log(`[stripe] Assinatura cancelada para customer ${sub.customer}`);
    }
  }

  res.json({ received: true });
});

// ═══════════════════════════════════════════════════════════════
// CRON — DISPAROS AGENDADOS (verifica a cada minuto)
// ═══════════════════════════════════════════════════════════════

cron.schedule('* * * * *', async () => {
  try {
    const now = new Date().toISOString();
    const { data: pending } = await supabase
      .from('dispatches')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_at', now);

    if (!pending?.length) return;

    console.log(`[cron] ${pending.length} disparos agendados para executar`);

    for (const dispatch of pending) {
      const wppStatus = wpp.getStatus(dispatch.user_id);
      await supabase.from('dispatches').update({ status: 'sending' }).eq('id', dispatch.id);

      if (wppStatus.status === 'connected') {
        console.log(`[cron] Executando disparo real ${dispatch.id}`);
        executeRealDispatch(dispatch.id, dispatch.user_id);
      } else {
        console.log(`[cron] WhatsApp não conectado para user ${dispatch.user_id}, simulando`);
        simulateSending(dispatch.id);
      }
    }
  } catch (e) {
    console.error('[cron] Erro:', e.message);
  }
});

// ── START ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`\n🚀 ZapSaaS v2 rodando em http://localhost:${PORT}`);
  console.log(`📦 Banco: Supabase`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💳 Stripe: ${process.env.STRIPE_SECRET_KEY ? 'configurado' : 'não configurado'}`);
  // Restaura sessões WhatsApp salvas
  await wpp.restoreSessions();
  console.log(`📱 WhatsApp: sessions restauradas\n`);
});
