require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

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

  const { data: session, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('token', token)
    .single();

  if (error || !session) return res.status(401).json({ error: 'Sessão inválida' });
  if (new Date(session.expires_at) < new Date()) {
    await supabase.from('sessions').delete().eq('token', token);
    return res.status(401).json({ error: 'Sessão expirada' });
  }

  req.user = session.user_data;
  next();
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

    await supabase.from('sessions').insert({
      token,
      user_id: user.id,
      user_data: userData,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

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
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao buscar leads' });
  }
});

app.post('/api/leads', async (req, res) => {
  try {
    const { name, phone, interest, source } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });

    const { data, error } = await supabase
      .from('leads')
      .insert({ name, phone, interest: interest || '', source: source || 'form', status: 'new' })
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
    const { error } = await supabase.from('leads').delete().eq('id', req.params.id);
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
    const { error } = await supabase.from('messages').delete().eq('id', req.params.id);
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
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao buscar disparos' });
  }
});

app.post('/api/dispatches', requireAuth, async (req, res) => {
  try {
    const { messageId, contactIds, scheduledAt } = req.body;
    if (!messageId || !contactIds?.length) {
      return res.status(400).json({ error: 'Mensagem e contatos são obrigatórios' });
    }

    const { data: message } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (!message) return res.status(404).json({ error: 'Mensagem não encontrada' });

    const { data: contacts } = await supabase
      .from('leads')
      .select('id, name, phone')
      .in('id', contactIds);

    const items = (contacts || []).map(c => ({
      contactId: c.id,
      contactName: c.name,
      contactPhone: c.phone,
      status: 'pending'
    }));

    const { data: dispatch, error } = await supabase
      .from('dispatches')
      .insert({
        message_id: messageId,
        message_title: message.title,
        message_content: message.content,
        total: items.length,
        sent: 0,
        failed: 0,
        status: 'pending',
        items,
        scheduled_at: scheduledAt || null,
        user_id: req.user.id
      })
      .select()
      .single();

    if (error) throw error;

    // Simulate sending async
    simulateSending(dispatch.id);

    res.json(dispatch);
  } catch (e) {
    console.error('Dispatch error:', e);
    res.status(500).json({ error: 'Erro ao criar disparo' });
  }
});

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
    const [
      { count: totalLeads },
      { count: newLeads },
      { count: totalMessages },
      { count: totalDispatches },
      { data: dispatchData },
      { data: lastLeads }
    ] = await Promise.all([
      supabase.from('leads').select('*', { count: 'exact', head: true }),
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'new'),
      supabase.from('messages').select('*', { count: 'exact', head: true }),
      supabase.from('dispatches').select('*', { count: 'exact', head: true }),
      supabase.from('dispatches').select('sent'),
      supabase.from('leads').select('id, name, phone, status, created_at').order('created_at', { ascending: false }).limit(5)
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

// ── START ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 ZapSaaS v2 rodando em http://localhost:${PORT}`);
  console.log(`📦 Banco: Supabase`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}\n`);
});
