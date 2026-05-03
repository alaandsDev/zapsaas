require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const wpp = require('./whatsapp');
const wppCloud = require('./whatsapp_cloud');
const zenvia = require('./zenvia');
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

// ── STRIPE WEBHOOK — raw body ANTES do express.json() ─────────
// CRÍTICO: deve vir antes de express.json() ou a assinatura falha
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
  } catch (e) {
    console.error('[stripe] webhook signature error:', e.message);
    return res.status(400).send(`Webhook Error: ${e.message}`);
  }

  try {
    // Helper: encontra user pelo stripe_customer_id
    const getUserByCustomer = async (customerId) => {
      const { data } = await supabase.from('users').select('id').eq('stripe_customer_id', customerId).single();
      return data;
    };

    // Helper: extende plano
    const extendPlan = async (userId, planId, customerId, periodEnd) => {
      const expires = periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase.from('users').update({
        plan: planId,
        plan_expires_at: expires,
        stripe_customer_id: customerId
      }).eq('id', userId);
      if (error) console.error('[stripe] Erro ao atualizar plano:', error.message);
      else console.log(`[stripe] ✅ Plano ${planId} ativo até ${expires} para user ${userId}`);
    };

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const meta = session.metadata || {};

      // Compra de pacote SMS (one-time)
      if (meta.type === 'sms_package' && meta.userId && meta.credits) {
        const credits = parseInt(meta.credits, 10);
        // Idempotência: marca purchase como paid; só credita se ainda não creditou
        const { data: purchase } = await supabase
          .from('sms_purchases')
          .select('id, status')
          .eq('stripe_session_id', session.id)
          .single();
        if (purchase && purchase.status !== 'paid') {
          await supabase.from('sms_purchases').update({
            status: 'paid', paid_at: new Date().toISOString()
          }).eq('id', purchase.id);
          // Soma créditos
          const { data: u } = await supabase.from('users').select('sms_credits').eq('id', meta.userId).single();
          const current = u?.sms_credits || 0;
          await supabase.from('users').update({ sms_credits: current + credits }).eq('id', meta.userId);
          console.log(`[stripe] ✅ +${credits} SMS creditados para user ${meta.userId}`);
        }
      }

      const { userId, planId } = meta;
      if (userId && planId) {
        // Busca subscription para pegar period_end real
        let periodEnd = null;
        if (session.subscription) {
          try {
            const sub = await stripe.subscriptions.retrieve(session.subscription);
            periodEnd = sub.current_period_end;
          } catch {}
        }
        await extendPlan(userId, planId, session.customer, periodEnd);
      }
    }

    // Renovação automática mensal — CRÍTICO para não perder acesso
    if (event.type === 'invoice.paid') {
      const invoice = event.data.object;
      if (invoice.billing_reason === 'subscription_cycle' && invoice.customer) {
        const user = await getUserByCustomer(invoice.customer);
        if (user) {
          let periodEnd = null;
          if (invoice.subscription) {
            try {
              const sub = await stripe.subscriptions.retrieve(invoice.subscription);
              periodEnd = sub.current_period_end;
            } catch {}
          }
          await extendPlan(user.id, 'pro', invoice.customer, periodEnd);
          console.log(`[stripe] 🔄 Renovação processada para customer ${invoice.customer}`);
        }
      }
    }

    if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object;
      const user = await getUserByCustomer(sub.customer);
      if (user) {
        if (sub.status === 'active') {
          await extendPlan(user.id, 'pro', sub.customer, sub.current_period_end);
        } else if (['canceled', 'unpaid', 'past_due'].includes(sub.status)) {
          await supabase.from('users').update({ plan: 'free', plan_expires_at: null }).eq('id', user.id);
          console.log(`[stripe] ⚠️ Plano rebaixado para free (status: ${sub.status})`);
        }
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      const user = await getUserByCustomer(sub.customer);
      if (user) {
        await supabase.from('users').update({ plan: 'free', plan_expires_at: null }).eq('id', user.id);
        console.log(`[stripe] ❌ Assinatura cancelada para customer ${sub.customer}`);
      }
    }
  } catch (e) {
    console.error('[stripe] webhook handler error:', e.message);
    // Ainda retorna 200 para o Stripe não retentar, mas loga o erro
  }

  res.json({ received: true });
});

// ── Webhook WhatsApp Cloud API (Meta) ─────────────────────────
// GET para verificação inicial, POST para eventos. Usa raw body para HMAC.
app.get('/api/wpp-cloud/webhook', async (req, res) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode !== 'subscribe' || !token) return res.sendStatus(400);
    // Aceita verify se algum user tiver esse token configurado
    const { data } = await supabase.from('whatsapp_cloud_configs')
      .select('id').eq('webhook_verify_token', token).limit(1);
    if (data?.length) return res.status(200).send(challenge);
    return res.sendStatus(403);
  } catch (e) { res.sendStatus(500); }
});

app.post('/api/wpp-cloud/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const payload = JSON.parse(req.body.toString('utf8'));
    const phoneNumberId = payload?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
    if (!phoneNumberId) return res.sendStatus(200);

    const { data: config } = await supabase.from('whatsapp_cloud_configs')
      .select('*').eq('phone_number_id', phoneNumberId).single();
    if (!config) return res.sendStatus(200);

    // Verifica assinatura HMAC se houver app_secret configurado
    if (config.app_secret) {
      const sig = req.headers['x-hub-signature-256'];
      if (!wppCloud.verifyWebhookSignature(req.body, sig, config.app_secret)) {
        console.warn('[wpp-cloud] HMAC inválido');
        return res.sendStatus(401);
      }
    }

    const change = payload.entry[0].changes[0].value;

    // Status updates (sent/delivered/read/failed)
    if (change.statuses) {
      for (const st of change.statuses) {
        const wamid = st.id;
        const status = st.status;
        await supabase.from('cloud_message_status').upsert({
          wamid, user_id: config.user_id, phone: st.recipient_id,
          status, error: st.errors?.[0]?.message || null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'wamid' });

        // Atualiza contadores no dispatch (read-modify-write best-effort)
        const { data: row } = await supabase.from('cloud_message_status')
          .select('dispatch_id').eq('wamid', wamid).single();
        if (row?.dispatch_id) {
          const field = status === 'delivered' ? 'delivered'
            : status === 'read' ? 'read'
            : status === 'failed' ? 'failed' : null;
          if (field) {
            const { data: d } = await supabase.from('cloud_dispatches')
              .select(field).eq('id', row.dispatch_id).single();
            await supabase.from('cloud_dispatches')
              .update({ [field]: ((d?.[field]) || 0) + 1 })
              .eq('id', row.dispatch_id);
          }
        }
      }
    }

    // Mensagens recebidas (responses) — só loga; engine de automação plug aqui depois
    if (change.messages) {
      for (const msg of change.messages) {
        console.log(`[wpp-cloud] msg de ${msg.from}: ${msg.text?.body || msg.type}`);
      }
    }

    res.sendStatus(200);
  } catch (e) {
    console.error('[wpp-cloud webhook]', e);
    res.sendStatus(200); // sempre 200 pro Meta não retentar agressivo
  }
});

app.use(express.json());

// ── RATE LIMITING ─────────────────────────────────────────────
const rateLimitMap = new Map();
function rateLimit(windowMs, max) {
  return (req, res, next) => {
    const key = req.ip + ':' + req.path;
    const now = Date.now();
    const entry = rateLimitMap.get(key) || { count: 0, resetAt: now + windowMs };
    if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + windowMs; }
    entry.count++;
    rateLimitMap.set(key, entry);
    if (entry.count > max) {
      return res.status(429).json({ error: 'Muitas tentativas. Tente novamente em alguns minutos.' });
    }
    next();
  };
}
// Limpa entradas expiradas a cada 10 min
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) { if (now > val.resetAt) rateLimitMap.delete(key); }
}, 10 * 60 * 1000);

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
// SHA-256 mantido para senhas existentes; novas usam bcrypt via campo password_v2
function hash(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

// bcrypt lazy — usa módulo nativo se disponível, senão fallback para sha256+salt
let bcrypt = null;
try { bcrypt = require('bcrypt'); } catch {}

async function hashPassword(password) {
  if (bcrypt) return bcrypt.hash(password, 12);
  // Fallback: sha256 com salt aleatório — melhor que sem salt
  const salt = crypto.randomBytes(16).toString('hex');
  return salt + ':' + crypto.createHash('sha256').update(salt + password).digest('hex');
}

async function verifyPassword(password, stored) {
  if (!stored) return false;
  // bcrypt hash começa com $2b$
  if (stored.startsWith('$2b$') || stored.startsWith('$2a$')) {
    if (bcrypt) return bcrypt.compare(password, stored);
    return false;
  }
  // salt:hash format
  if (stored.includes(':') && stored.split(':')[0].length === 32) {
    const [salt, h] = stored.split(':');
    return crypto.createHash('sha256').update(salt + password).digest('hex') === h;
  }
  // Legacy sha256 sem salt
  return hash(password) === stored;
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
// AUTH — com rate limit
// ═══════════════════════════════════════════════════════════════

app.post('/api/auth/login', rateLimit(15 * 60 * 1000, 10), async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email e senha são obrigatórios' });

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role, password')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !user) return res.status(401).json({ error: 'Email ou senha inválidos' });

    // Suporta bcrypt e sha256 legacy (migração lazy)
    const valid = await verifyPassword(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Email ou senha inválidos' });

    // Migração lazy: se senha ainda é sha256, re-hash com bcrypt
    if (bcrypt && !user.password.startsWith('$2')) {
      const newHash = await hashPassword(password);
      await supabase.from('users').update({ password: newHash }).eq('id', user.id);
    }

    const token = crypto.randomBytes(32).toString('hex');
    const userData = { id: user.id, name: user.name, email: user.email, role: user.role };

    const { error: sessionError } = await supabase.from('sessions').insert({
      token,
      user_id: user.id,
      user_data: userData,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });

    if (sessionError) return res.status(500).json({ error: 'Erro ao criar sessão' });

    // Limpa sessões antigas do usuário (mantém últimas 5)
    const { data: oldSessions } = await supabase.from('sessions')
      .select('token').eq('user_id', user.id).order('expires_at', { ascending: true });
    if (oldSessions && oldSessions.length > 5) {
      const toDelete = oldSessions.slice(0, oldSessions.length - 5).map(s => s.token);
      await supabase.from('sessions').delete().in('token', toDelete);
    }

    res.json({ token, user: userData });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.post('/api/auth/register', rateLimit(60 * 60 * 1000, 5), async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Campos obrigatórios' });
    if (password.length < 6) return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });

    const normalizedEmail = email.toLowerCase().trim();
    const cleanedPhone = phone ? phone.replace(/\D/g, '') : null;
    const { data: existing } = await supabase.from('users').select('id').eq('email', normalizedEmail).single();
    if (existing) return res.status(400).json({ error: 'Email já cadastrado' });

    const hashed = await hashPassword(password);
    const { error } = await supabase.from('users').insert({
      name,
      email: normalizedEmail,
      password: hashed,
      role: 'user',
      phone: cleanedPhone || null
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
    const { name, phone, interest, source } = req.body;
    // SEGURANÇA: user_id NUNCA vem do body — apenas do token de auth ou null (form público)
    if (!name || !phone) return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });

    // Tenta obter user_id do token de auth (se existir)
    let userId = null;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: session } = await supabase.from('sessions')
        .select('user_id, expires_at').eq('token', token).single();
      if (session && new Date(session.expires_at) > new Date()) {
        userId = session.user_id;
      }
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

app.post('/api/chatbot/message', rateLimit(60 * 1000, 20), async (req, res) => {
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
// WHATSAPP CLOUD API (Meta direto)
// ═══════════════════════════════════════════════════════════════

async function getCloudConfig(userId) {
  const { data } = await supabase.from('whatsapp_cloud_configs').select('*').eq('user_id', userId).single();
  return data;
}

// Lê config (sem expor token completo)
app.get('/api/wpp-cloud/config', requireAuth, async (req, res) => {
  try {
    const c = await getCloudConfig(req.user.id);
    if (!c) return res.json(null);
    res.json({
      id: c.id,
      phone_number_id: c.phone_number_id,
      business_account_id: c.business_account_id,
      webhook_verify_token: c.webhook_verify_token,
      display_phone: c.display_phone,
      verified_name: c.verified_name,
      enabled: c.enabled,
      has_token: !!c.access_token,
      has_app_secret: !!c.app_secret,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Cria/atualiza credenciais
app.post('/api/wpp-cloud/config', requireAuth, async (req, res) => {
  try {
    const { phone_number_id, business_account_id, access_token, webhook_verify_token, app_secret } = req.body;
    if (!phone_number_id || !access_token || !webhook_verify_token) {
      return res.status(400).json({ error: 'phone_number_id, access_token e webhook_verify_token são obrigatórios' });
    }
    // Valida com Meta antes de salvar
    let info = null;
    try {
      info = await wppCloud.verify({ token: access_token, phoneNumberId: phone_number_id });
    } catch (e) {
      return res.status(400).json({ error: `Validação Meta falhou: ${e.message}` });
    }

    const payload = {
      user_id: req.user.id,
      phone_number_id,
      business_account_id: business_account_id || null,
      access_token,
      webhook_verify_token,
      app_secret: app_secret || null,
      display_phone: info.display_phone_number || null,
      verified_name: info.verified_name || null,
      enabled: true,
      updated_at: new Date().toISOString()
    };

    const existing = await getCloudConfig(req.user.id);
    if (existing) {
      await supabase.from('whatsapp_cloud_configs').update(payload).eq('user_id', req.user.id);
    } else {
      await supabase.from('whatsapp_cloud_configs').insert(payload);
    }
    res.json({ ok: true, info });
  } catch (e) {
    console.error('[wpp-cloud config]', e);
    res.status(500).json({ error: e.message });
  }
});

// Teste — envia template pra um número
app.post('/api/wpp-cloud/test', requireAuth, async (req, res) => {
  try {
    const { to, template, language, variables } = req.body;
    if (!to || !template) return res.status(400).json({ error: 'to e template obrigatórios' });
    const c = await getCloudConfig(req.user.id);
    if (!c) return res.status(400).json({ error: 'Configure as credenciais Meta primeiro' });
    const r = await wppCloud.sendTemplate(
      { token: c.access_token, phoneNumberId: c.phone_number_id },
      to, template, language || 'pt_BR', variables || []
    );
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message, details: e.details }); }
});

// Lista templates da WABA
app.get('/api/wpp-cloud/templates', requireAuth, async (req, res) => {
  try {
    const c = await getCloudConfig(req.user.id);
    if (!c) return res.status(400).json({ error: 'Configure as credenciais Meta primeiro' });
    if (!c.business_account_id) return res.status(400).json({ error: 'business_account_id não configurado' });
    const r = await wppCloud.listTemplates({ token: c.access_token, businessAccountId: c.business_account_id });
    res.json(r.data || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════
// AUTOMAÇÃO INTELIGENTE — Flows
// ═══════════════════════════════════════════════════════════════

app.get('/api/flows', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('flows')
      .select('id, name, description, enabled, trigger_keywords, created_at, updated_at')
      .eq('user_id', req.user.id)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/flows/:id', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('flows').select('*')
      .eq('id', req.params.id).eq('user_id', req.user.id).single();
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(404).json({ error: 'Fluxo não encontrado' }); }
});

app.post('/api/flows', requireAuth, async (req, res) => {
  try {
    const { name, description, graph, trigger_keywords } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome obrigatório' });
    const { data, error } = await supabase.from('flows').insert({
      user_id: req.user.id,
      name,
      description: description || null,
      trigger_keywords: trigger_keywords || null,
      graph: graph || { nodes: [], edges: [] }
    }).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/flows/:id', requireAuth, async (req, res) => {
  try {
    const allowed = ['name', 'description', 'enabled', 'graph', 'trigger_keywords'];
    const update = { updated_at: new Date().toISOString() };
    for (const k of allowed) if (req.body[k] !== undefined) update[k] = req.body[k];
    const { data, error } = await supabase.from('flows').update(update)
      .eq('id', req.params.id).eq('user_id', req.user.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/flows/:id', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase.from('flows').delete()
      .eq('id', req.params.id).eq('user_id', req.user.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════
// SMS — Zenvia (créditos pré-pagos)
// ═══════════════════════════════════════════════════════════════

const SMS_PACKAGES = {
  sms_500:  { credits: 500,  amountCents: 5000, label: '500 SMS por R$ 50,00' },
  sms_1000: { credits: 1000, amountCents: 7500, label: '1.000 SMS por R$ 75,00' },
};

// Saldo + lista de pacotes
app.get('/api/sms/balance', requireAuth, async (req, res) => {
  try {
    const { data: u } = await supabase.from('users').select('sms_credits').eq('id', req.user.id).single();
    res.json({
      credits: u?.sms_credits || 0,
      packages: Object.entries(SMS_PACKAGES).map(([id, p]) => ({ id, ...p }))
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Inicia checkout Stripe pra comprar pacote
app.post('/api/sms/purchase', requireAuth, async (req, res) => {
  try {
    const { packageId } = req.body;
    const pkg = SMS_PACKAGES[packageId];
    if (!pkg) return res.status(400).json({ error: 'Pacote inválido' });

    const { data: user } = await supabase.from('users').select('*').eq('id', req.user.id).single();

    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, name: user.name, metadata: { userId: user.id } });
      customerId = customer.id;
      await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', user.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'brl',
          product_data: { name: `ZapFlow — ${pkg.label}`, description: 'Créditos de SMS (não expira)' },
          unit_amount: pkg.amountCents,
        },
        quantity: 1
      }],
      metadata: {
        type: 'sms_package',
        userId: user.id,
        packageId,
        credits: String(pkg.credits)
      },
      success_url: `${process.env.FRONTEND_URL || 'https://zapsaas.vercel.app'}/dashboard/sms?paid=1`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://zapsaas.vercel.app'}/dashboard/sms?cancelled=1`,
    });

    // Cria purchase pendente (idempotência)
    await supabase.from('sms_purchases').insert({
      user_id: user.id,
      package_id: packageId,
      amount_cents: pkg.amountCents,
      credits: pkg.credits,
      stripe_session_id: session.id,
      status: 'pending'
    });

    res.json({ url: session.url });
  } catch (e) {
    console.error('[sms/purchase]', e);
    res.status(500).json({ error: e.message });
  }
});

// Calcula segmentos SMS — GSM-7 = 160/segmento; se tiver caractere fora do GSM-7
// (acentos como á/ã/ç, emoji, etc.), Zenvia usa UCS-2 = 70/segmento.
const GSM7_RE = /^[A-Za-z0-9 \r\n@£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ!"#%&'()*+,\-./:;<=>?¡ÄÖÑÜ§¿äöñüà^{}\\[\]~|€]*$/;
function smsSegments(text) {
  const t = String(text || '');
  if (!t) return 1;
  const isGsm = GSM7_RE.test(t);
  const perSeg = isGsm ? 160 : 70;
  return Math.max(1, Math.ceil(t.length / perSeg));
}

// Disparo único (teste)
app.post('/api/sms/send', requireAuth, async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) return res.status(400).json({ error: 'Telefone e mensagem obrigatórios' });

    const cost = smsSegments(message);
    const { data: u } = await supabase.from('users').select('sms_credits').eq('id', req.user.id).single();
    if ((u?.sms_credits || 0) < cost) {
      return res.status(402).json({ error: `Saldo insuficiente: precisa ${cost} crédito(s)`, code: 'NO_SMS_CREDITS', needed: cost, balance: u?.sms_credits || 0 });
    }

    const r = await zenvia.sendSms(phone, message);
    await supabase.from('users').update({ sms_credits: u.sms_credits - cost }).eq('id', req.user.id);
    res.json({ ...r, segmentsCharged: cost, remainingCredits: u.sms_credits - cost });
  } catch (e) {
    console.error('[sms/send]', e);
    res.status(500).json({ error: e.message });
  }
});

// Disparo em massa
app.post('/api/sms/bulk', requireAuth, async (req, res) => {
  try {
    const { phones, message, title, delaySeconds } = req.body;
    if (!message || !Array.isArray(phones) || !phones.length) {
      return res.status(400).json({ error: 'Mensagem e contatos obrigatórios' });
    }

    const { data: u } = await supabase.from('users').select('sms_credits').eq('id', req.user.id).single();
    const balance = u?.sms_credits || 0;
    // Estimativa de custo: usa o template puro (variáveis costumam ser curtas)
    const baseSegments = smsSegments(message);
    const estimatedCost = baseSegments * phones.length;
    if (balance < estimatedCost) {
      return res.status(402).json({
        error: `Saldo insuficiente: ${balance} crédito(s), estimativa ${estimatedCost} (${baseSegments} segmento(s) × ${phones.length} contatos)`,
        code: 'NO_SMS_CREDITS', balance, needed: estimatedCost
      });
    }

    const items = phones.map(p => ({
      name: p.name || null, phone: p.phone || p, status: 'pending'
    }));

    const { data: dispatch, error } = await supabase.from('sms_dispatches').insert({
      user_id: req.user.id,
      title: title || `SMS ${new Date().toLocaleDateString('pt-BR')}`,
      message,
      total: phones.length,
      status: 'sending',
      items
    }).select().single();
    if (error) throw error;

    res.json({ dispatchId: dispatch.id, total: phones.length, message: 'Disparo iniciado!' });

    // Background
    (async () => {
      const delayMs = Math.max(800, (Number(delaySeconds) || 1) * 1000);
      const updated = [...items];
      let sent = 0, failed = 0;
      for (let i = 0; i < phones.length; i++) {
        const p = phones[i];
        const phoneStr = p.phone || p;
        const name = p.name || '';
        try {
          const personalized = String(message)
            .replace(/\{nome\}/gi, name)
            .replace(/\{name\}/gi, name)
            .replace(/\{numero\}/gi, phoneStr);
          await zenvia.sendSms(phoneStr, personalized);
          const charged = smsSegments(personalized);
          updated[i] = { ...updated[i], status: 'sent', sentAt: new Date().toISOString(), segments: charged };
          sent++;
          // Debita por segmento real da mensagem personalizada
          const { data: cur } = await supabase.from('users').select('sms_credits').eq('id', req.user.id).single();
          await supabase.from('users').update({ sms_credits: Math.max(0, (cur?.sms_credits || 0) - charged) }).eq('id', req.user.id);
        } catch (e) {
          updated[i] = { ...updated[i], status: 'failed', error: e.message };
          failed++;
        }
        if (i % 5 === 0) {
          await supabase.from('sms_dispatches').update({ sent, failed, items: updated }).eq('id', dispatch.id);
        }
        await new Promise(r => setTimeout(r, delayMs));
      }
      await supabase.from('sms_dispatches').update({
        sent, failed, status: 'completed', items: updated, finished_at: new Date().toISOString()
      }).eq('id', dispatch.id);
    })();
  } catch (e) {
    console.error('[sms/bulk]', e);
    res.status(500).json({ error: e.message });
  }
});

// Histórico
app.get('/api/sms/dispatches', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sms_dispatches')
      .select('id, title, total, sent, failed, status, created_at, finished_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    res.json(data || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════
// ADMIN — MARKETING (campanhas para usuários da plataforma)
// ═══════════════════════════════════════════════════════════════

const ADMIN_WPP_SESSION = 'admin_marketing';

// Constrói query Supabase a partir dos filtros do segmento
function buildSegmentQuery(filters = {}) {
  let q = supabase.from('users').select('id, name, email, phone, plan, plan_expires_at, role, created_at');
  q = q.not('phone', 'is', null);
  if (filters.plan && ['free', 'pro'].includes(filters.plan)) q = q.eq('plan', filters.plan);
  if (filters.role && ['user', 'admin'].includes(filters.role)) q = q.eq('role', filters.role);
  if (filters.includeAdmins === false) q = q.neq('role', 'admin');
  if (filters.expiringInDays && Number(filters.expiringInDays) > 0) {
    const now = new Date().toISOString();
    const future = new Date(Date.now() + Number(filters.expiringInDays) * 86400000).toISOString();
    q = q.gte('plan_expires_at', now).lte('plan_expires_at', future);
  }
  if (filters.overdue === true) {
    q = q.lt('plan_expires_at', new Date().toISOString()).eq('plan', 'pro');
  }
  if (filters.inactiveDays && Number(filters.inactiveDays) > 0) {
    const cutoff = new Date(Date.now() - Number(filters.inactiveDays) * 86400000).toISOString();
    q = q.lt('created_at', cutoff);
  }
  return q;
}

// GET /api/admin/marketing/segment — preview de quem entra
app.post('/api/admin/marketing/segment', requireAdmin, async (req, res) => {
  try {
    const filters = req.body?.filters || {};
    const { data, error } = await buildSegmentQuery(filters).order('created_at', { ascending: false }).limit(500);
    if (error) throw error;
    res.json({
      total: (data || []).length,
      sample: (data || []).slice(0, 10),
      users: data || []
    });
  } catch (e) {
    console.error('[admin/marketing/segment]', e);
    res.status(500).json({ error: e.message });
  }
});

// WPP admin — connect/status/disconnect
app.post('/api/admin/marketing/wpp/connect', requireAdmin, async (req, res) => {
  try {
    const r = await wpp.createSession(ADMIN_WPP_SESSION);
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/admin/marketing/wpp/status', requireAdmin, (req, res) => {
  res.json(wpp.getStatus(ADMIN_WPP_SESSION));
});
app.post('/api/admin/marketing/wpp/disconnect', requireAdmin, async (req, res) => {
  try {
    await wpp.disconnectSession(ADMIN_WPP_SESSION);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Teste — envia 1 mensagem
app.post('/api/admin/marketing/wpp/test', requireAdmin, async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) return res.status(400).json({ error: 'Telefone e mensagem obrigatórios' });
    const r = await wpp.sendMessage(ADMIN_WPP_SESSION, phone, message);
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/admin/marketing/campaign — dispara campanha
app.post('/api/admin/marketing/campaign', requireAdmin, async (req, res) => {
  try {
    const { name, message, filters, delaySeconds } = req.body;
    if (!message) return res.status(400).json({ error: 'Mensagem obrigatória' });

    const status = wpp.getStatus(ADMIN_WPP_SESSION);
    if (status.status !== 'connected') {
      return res.status(400).json({ error: 'WhatsApp do admin não conectado. Conecte na aba Marketing.' });
    }

    const { data: targets, error } = await buildSegmentQuery(filters || {}).limit(5000);
    if (error) throw error;
    if (!targets?.length) return res.status(400).json({ error: 'Nenhum usuário no segmento' });

    const items = targets.map(u => ({
      userId: u.id, name: u.name, email: u.email, phone: u.phone, status: 'pending'
    }));

    const { data: campaign, error: cErr } = await supabase.from('admin_campaigns').insert({
      name: name || `Campanha ${new Date().toLocaleString('pt-BR')}`,
      message,
      segment: filters || {},
      total: targets.length,
      status: 'sending',
      items,
      created_by: req.user.id,
      started_at: new Date().toISOString()
    }).select().single();
    if (cErr) throw cErr;

    res.json({ campaignId: campaign.id, total: targets.length, message: 'Campanha iniciada!' });

    // Background dispatch
    (async () => {
      const delayMs = Math.max(1500, (Number(delaySeconds) || 3) * 1000);
      const updated = [...items];
      let sent = 0, failed = 0;
      for (let i = 0; i < targets.length; i++) {
        const u = targets[i];
        try {
          const personalized = message
            .replace(/\{nome\}/gi, u.name || '')
            .replace(/\{name\}/gi, u.name || '')
            .replace(/\{email\}/gi, u.email || '')
            .replace(/\{plano\}/gi, u.plan || 'free')
            .replace(/\{vencimento\}/gi, u.plan_expires_at ? new Date(u.plan_expires_at).toLocaleDateString('pt-BR') : '');
          await wpp.sendMessage(ADMIN_WPP_SESSION, u.phone, personalized);
          updated[i] = { ...updated[i], status: 'sent', sentAt: new Date().toISOString() };
          sent++;
        } catch (e) {
          updated[i] = { ...updated[i], status: 'failed', error: e.message };
          failed++;
        }
        if (i % 10 === 0) {
          await supabase.from('admin_campaigns').update({ sent, failed, items: updated }).eq('id', campaign.id);
        }
        await new Promise(r => setTimeout(r, delayMs + Math.random() * 1500));
      }
      await supabase.from('admin_campaigns').update({
        sent, failed,
        status: 'completed',
        items: updated,
        finished_at: new Date().toISOString()
      }).eq('id', campaign.id);
      console.log(`[admin marketing] campanha ${campaign.id} concluída: ${sent}/${targets.length}`);
    })();
  } catch (e) {
    console.error('[admin/marketing/campaign]', e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admin/marketing/campaigns — histórico
app.get('/api/admin/marketing/campaigns', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('admin_campaigns')
      .select('id, name, total, sent, failed, status, segment, started_at, finished_at, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    res.json(data || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/marketing/campaigns/:id', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase.from('admin_campaigns').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
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
// ADMIN — Painel Administrativo
// ═══════════════════════════════════════════════════════════════

async function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Não autorizado' });
  try {
    const { data: session } = await supabase
      .from('sessions').select('*').eq('token', token).single();
    if (!session) return res.status(401).json({ error: 'Sessão inválida' });
    if (new Date(session.expires_at) < new Date()) return res.status(401).json({ error: 'Sessão expirada' });
    if (session.user_data?.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado — área restrita ao administrador' });
    }
    req.user = session.user_data;
    next();
  } catch(e) {
    console.error('[requireAdmin] erro:', e.message);
    res.status(500).json({ error: 'Erro de autenticação' });
  }
}

// Stats gerais do sistema
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  try {
    const [
      { count: totalUsers },
      { count: totalLeads },
      { count: totalDispatches },
      { data: proUsers },
      { data: recentUsers }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('leads').select('*', { count: 'exact', head: true }),
      supabase.from('dispatches').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('id').eq('plan', 'pro'),
      supabase.from('users').select('id, name, email, role, plan, created_at').order('created_at', { ascending: false }).limit(5)
    ]);

    const { data: sentData } = await supabase.from('dispatches').select('sent');
    const totalSent = (sentData || []).reduce((a, d) => a + (d.sent || 0), 0);

    res.json({
      totalUsers: totalUsers || 0,
      totalLeads: totalLeads || 0,
      totalDispatches: totalDispatches || 0,
      totalSent,
      proUsers: proUsers?.length || 0,
      recentUsers: recentUsers || []
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Lista todos os usuários com stats
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role, plan, plan_expires_at, stripe_customer_id, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;

    // Busca stats por usuário
    const enriched = await Promise.all(users.map(async (u) => {
      const [
        { count: leads },
        { count: dispatches },
        { count: lists },
        { data: dispData }
      ] = await Promise.all([
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('user_id', u.id),
        supabase.from('dispatches').select('*', { count: 'exact', head: true }).eq('user_id', u.id),
        supabase.from('contact_lists').select('*', { count: 'exact', head: true }).eq('user_id', u.id),
        supabase.from('dispatches').select('sent').eq('user_id', u.id)
      ]);
      const totalSent = (dispData || []).reduce((a, d) => a + (d.sent || 0), 0);
      return { ...u, stats: { leads: leads || 0, dispatches: dispatches || 0, lists: lists || 0, totalSent } };
    }));

    res.json(enriched);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Busca usuário específico com histórico completo
app.get('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const { data: user } = await supabase.from('users')
      .select('id, name, email, role, plan, plan_expires_at, stripe_customer_id, created_at')
      .eq('id', req.params.id).single();
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    const [{ data: dispatches }, { data: leads }, { data: lists }] = await Promise.all([
      supabase.from('dispatches').select('id, message_title, total, sent, failed, status, created_at')
        .eq('user_id', req.params.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('leads').select('id, name, phone, status, created_at')
        .eq('user_id', req.params.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('contact_lists').select('id, name, total, created_at')
        .eq('user_id', req.params.id).order('created_at', { ascending: false })
    ]);

    res.json({ user, dispatches: dispatches || [], leads: leads || [], lists: lists || [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Atualiza cargo/plano do usuário
app.patch('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const { role, plan, plan_expires_at } = req.body;
    // Impede admin de alterar o próprio cargo
    if (req.params.id === req.user.id && role && role !== 'admin') {
      return res.status(400).json({ error: 'Você não pode remover o próprio cargo de admin' });
    }
    const updates = {};
    if (role) updates.role = role;
    if (plan) updates.plan = plan;
    if (plan_expires_at !== undefined) updates.plan_expires_at = plan_expires_at;

    const { data, error } = await supabase.from('users').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Deleta usuário e todos os dados
app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'Você não pode deletar sua própria conta de admin' });
    await supabase.from('users').delete().eq('id', req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Reset de senha pelo admin
app.post('/api/admin/users/:id/reset-password', requireAdmin, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
    const hashed = await hashPassword(newPassword);
    await supabase.from('users').update({ password: hashed }).eq('id', req.params.id);
    // Invalida todas as sessões do usuário
    await supabase.from('sessions').delete().eq('user_id', req.params.id);
    res.json({ success: true });
  } catch (e) {
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

// ═══════════════════════════════════════════════════════════════
// CRON — DISPAROS AGENDADOS (verifica a cada minuto)
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// CRON — DISPAROS AGENDADOS com lock atômico
// ═══════════════════════════════════════════════════════════════

cron.schedule('* * * * *', async () => {
  try {
    const now = new Date().toISOString();

    // Lock atômico: UPDATE status='processing' WHERE status='scheduled' AND scheduled_at <= now
    // Apenas UMA instância processa cada disparo — sem duplicatas
    const { data: pending, error } = await supabase
      .from('dispatches')
      .update({ status: 'sending', processing_started_at: now })
      .eq('status', 'scheduled')
      .lte('scheduled_at', now)
      .select();

    if (error) { console.error('[cron] Lock error:', error.message); return; }
    if (!pending?.length) return;

    console.log(`[cron] ${pending.length} disparos agendados para executar`);

    for (const dispatch of pending) {
      const wppStatus = wpp.getStatus(dispatch.user_id);
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
