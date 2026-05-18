require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const wpp = require('./whatsapp');
const workflowEngine = require('./workflow-engine');
const wppCloud = require('./whatsapp_cloud');
const zenvia = require('./zenvia');
const Stripe = require('stripe');
const cron = require('node-cron');

const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;

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

// ── MULTER (upload de mídia em memória) ───────────────────────
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 64 * 1024 * 1024 }, // 64 MB max
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg','image/png','image/gif','image/webp',
      'video/mp4','video/3gpp','video/quicktime','video/avi',
      'audio/mpeg','audio/mp4','audio/ogg','audio/wav','audio/aac','audio/webm',
      'application/pdf','application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip','application/x-rar-compressed',
      'text/plain','text/csv',
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`Tipo de arquivo não suportado: ${file.mimetype}`));
  },
});

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
// ── Limpeza de sessões expiradas (a cada 1h) ──────────────────
// Reduz crescimento da tabela sessions e carga no Supabase
setInterval(async () => {
  try {
    const { count } = await supabase.from('sessions')
      .delete({ count: 'exact' })
      .lt('expires_at', new Date().toISOString());
    if (count > 0) console.log(`[cleanup] ${count} sessões expiradas removidas`);
  } catch(e) { console.warn('[cleanup] erro:', e.message); }
}, 60 * 60 * 1000);

// ── Rate limit map cleanup (a cada 15min) ─────────────────────
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) { if (now > val.resetAt) rateLimitMap.delete(key); }
}, 15 * 60 * 1000);

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

// Injeta supabase no manager de WhatsApp para persistência de sessões
wpp.setSupabase(supabase);

// ── HELPERS ───────────────────────────────────────────────────
// SHA-256 mantido para senhas existentes; novas usam bcrypt via campo password_v2
function hash(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

// bcryptjs (pure JS, sem compilação nativa — funciona no Railway)
let bcrypt = null;
try { bcrypt = require('bcryptjs'); } catch { console.warn('[auth] bcryptjs não instalado'); }

async function hashPassword(password) {
  if (bcrypt) return bcrypt.hash(password, 12);
  const salt = crypto.randomBytes(16).toString('hex');
  return salt + ':' + crypto.createHash('sha256').update(salt + password).digest('hex');
}

async function verifyPassword(password, stored) {
  if (!stored) return false;
  try {
    // bcrypt hash
    if (stored.startsWith('$2b$') || stored.startsWith('$2a$')) {
      if (!bcrypt) {
        // bcrypt não instalado mas senha é bcrypt — fallback impossível, retorna false
        console.error('[auth] Senha bcrypt mas módulo não disponível!');
        return false;
      }
      return bcrypt.compare(password, stored);
    }
    // salt:sha256 format (hex salt de 32 chars)
    if (stored.includes(':') && stored.indexOf(':') === 32) {
      const [salt, h] = stored.split(':');
      return crypto.createHash('sha256').update(salt + password).digest('hex') === h;
    }
    // Legacy: sha256 puro sem salt
    return hash(password) === stored;
  } catch(e) {
    console.error('[auth] verifyPassword erro:', e.message);
    return false;
  }
}

// Cache de autenticação em memória — evita query no Supabase a cada requisição
const authCache = new Map(); // token → { user_data, expires_at, cachedAt }
const AUTH_CACHE_TTL = 60 * 1000; // 60 segundos

async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1] || req.query.token;
  if (!token) return res.status(401).json({ error: 'Não autorizado' });

  try {
    // Verifica cache primeiro — evita hit no Supabase
    const cached = authCache.get(token);
    if (cached && Date.now() - cached.cachedAt < AUTH_CACHE_TTL) {
      if (new Date(cached.expires_at) < new Date()) {
        authCache.delete(token);
        return res.status(401).json({ error: 'Sessão expirada' });
      }
      req.user = cached.user_data;
      return next();
    }

    const { data: session, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !session) {
      authCache.delete(token);
      return res.status(401).json({ error: 'Sessão inválida' });
    }
    if (new Date(session.expires_at) < new Date()) {
      await supabase.from('sessions').delete().eq('token', token);
      authCache.delete(token);
      return res.status(401).json({ error: 'Sessão expirada' });
    }

    // Salva no cache
    authCache.set(token, {
      user_data: session.user_data,
      expires_at: session.expires_at,
      cachedAt: Date.now()
    });

    req.user = session.user_data;
    next();
  } catch (e) {
    console.error('[auth] Erro inesperado:', e.message);
    return res.status(500).json({ error: 'Erro de autenticação' });
  }
}

// Limpa cache de auth expirado a cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [token, val] of authCache) {
    if (now - val.cachedAt > AUTH_CACHE_TTL * 2) authCache.delete(token);
  }
}, 5 * 60 * 1000);

// ── Limpeza seletiva das keys do Baileys a cada 24h ─────────
// Remove apenas keys antigas (>7 dias) para evitar acúmulo sem quebrar sessões ativas
setInterval(async () => {
  try {
    const { data: sessions } = await supabase.from('wpp_sessions').select('session_id, keys');
    if (!sessions) return;
    for (const s of sessions) {
      if (!s.keys || typeof s.keys !== 'object') continue;
      const keys = s.keys;
      const total = JSON.stringify(keys).length;
      // Só limpa se keys passou de 500KB — remove entradas mais antigas
      if (total > 500000) {
        const entries = Object.entries(keys);
        // Mantém apenas as últimas 1000 entradas
        const trimmed = Object.fromEntries(entries.slice(-1000));
        await supabase.from('wpp_sessions')
          .update({ keys: trimmed, updated_at: new Date().toISOString() })
          .eq('session_id', s.session_id);
        console.log(`[cleanup] Keys de ${s.session_id} reduzidas de ${entries.length} para 1000 entradas`);
      }
    }
  } catch (e) {
    console.error('[cleanup] Falhou:', e.message);
  }
}, 24 * 60 * 60 * 1000); // 24 horas

// ── Caches em memória (reduz queries repetidas no Supabase) ───
const chatsCache = new Map();  // key: userId:slot → { data, ts }
const profilePicCache = new Map(); // key: phone → { url, ts }

// ── HEALTH CHECK ──────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ═══════════════════════════════════════════════════════════════
// AUTH — com rate limit
// ═══════════════════════════════════════════════════════════════

app.post('/api/auth/login', rateLimit(15 * 60 * 1000, 10), async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email e senha são obrigatórios' });

    // Timeout de 10s para não deixar o cliente esperando 24s
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 10000)
    );

    const userPromise = supabase
      .from('users')
      .select('id, name, email, role, password')
      .eq('email', email.toLowerCase().trim())
      .single();

    const { data: user, error } = await Promise.race([userPromise, timeoutPromise])
      .catch(e => {
        if (e.message === 'timeout') return { data: null, error: { message: 'timeout' } };
        return { data: null, error: e };
      });

    if (error?.message === 'timeout') return res.status(503).json({ error: 'Servidor temporariamente lento, tente novamente em instantes' });
    if (error || !user) return res.status(401).json({ error: 'Email ou senha inválidos' });

    const valid = await verifyPassword(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Email ou senha inválidos' });

    // Migração lazy: se senha ainda é sha256, re-hash com bcrypt (em background)
    if (bcrypt && !user.password.startsWith('$2')) {
      hashPassword(password).then(newHash =>
        supabase.from('users').update({ password: newHash }).eq('id', user.id)
      ).catch(() => {});
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

    // Limpa sessões antigas em background — não bloqueia o login
    supabase.from('sessions')
      .select('token').eq('user_id', user.id).order('expires_at', { ascending: true })
      .then(({ data: oldSessions }) => {
        if (oldSessions && oldSessions.length > 5) {
          const toDelete = oldSessions.slice(0, oldSessions.length - 5).map(s => s.token);
          return supabase.from('sessions').delete().in('token', toDelete);
        }
      }).catch(() => {});

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
    const allowed = ['name', 'phone', 'interest', 'status', 'tags', 'notes', 'avatar_url', 'last_interaction_at'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );
    updates.updated_at = new Date().toISOString();

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
    const { messageId, contactIds, scheduledAt, useWhatsapp, dualChip, channel, mediaUrl, mediaMimetype, mediaFilename, sourceSessionSlot } = req.body;
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
    const items = (contacts || []).map(c => ({
      contactId: c.id,
      contactName: c.name,
      contactPhone: c.phone,
      status: 'pending',
      sourceSessionSlot: sourceSessionSlot ? parseInt(sourceSessionSlot) : null,
    }));

    const isScheduled = scheduledAt && new Date(scheduledAt) > new Date();

    const connectedForDispatch = getConnectedSessions(req.user.id);
    const cloudConfig = await getCloudConfig(req.user.id);
    const hasBaileys = connectedForDispatch.length > 0;
    const hasCloud = !!(cloudConfig?.access_token && cloudConfig?.enabled);

    const useCloud = channel === 'cloud' || (!hasBaileys && hasCloud);
    const useBaileys = !useCloud && hasBaileys && useWhatsapp !== false;
    const via = useCloud ? 'cloud_api' : useBaileys ? 'baileys' : 'simulated';
    if (useBaileys && sourceSessionSlot && !connectedForDispatch.some(s => s.slot === parseInt(sourceSessionSlot))) {
      return res.status(400).json({ error: `Número ${sourceSessionSlot} não está conectado.` });
    }

    const { data: dispatch, error } = await supabase.from('dispatches').insert({
      message_id: messageId,
      message_title: message.title,
      message_content: message.content,
      media_url: mediaUrl || null,
      media_mimetype: mediaMimetype || null,
      media_filename: mediaFilename || null,
      total: items.length,
      sent: 0, failed: 0,
      status: isScheduled ? 'scheduled' : 'pending',
      items,
      scheduled_at: scheduledAt || null,
      user_id: req.user.id,
      channel: via,
      session_slot: sourceSessionSlot ? parseInt(sourceSessionSlot) : null,
    }).select().single();

    if (error) throw error;

    if (!isScheduled) {
      if (useCloud) {
        executeCloudDispatch(dispatch.id, req.user.id);
      } else if (useBaileys) {
        executeRealDispatch(dispatch.id, req.user.id);
      } else {
        simulateSending(dispatch.id);
      }
    }

    res.json({ ...dispatch, via, scheduled: isScheduled });
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

app.post('/api/dispatches/:id/pause', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase.from('dispatches')
      .update({ status: 'paused' })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .in('status', ['sending', 'scheduled']);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Disparo pausado' });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao pausar disparo' });
  }
});

app.post('/api/dispatches/:id/resume', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase.from('dispatches')
      .update({ status: 'scheduled' })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .eq('status', 'paused');
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Disparo retomado' });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao retomar disparo' });
  }
});

app.post('/api/dispatches/:id/cancel', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase.from('dispatches')
      .update({ status: 'cancelled' })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .in('status', ['sending', 'scheduled', 'paused']);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Disparo cancelado' });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao cancelar disparo' });
  }
});

// Atualiza last_interaction_at dos leads que receberam o disparo
async function updateLeadsInteraction(contacts, userId) {
  try {
    const phones = [...new Set(contacts.map(c => (c.phone || '').replace(/\D/g, '')).filter(Boolean))];
    if (!phones.length) return;
    // Atualiza em lotes de 100 para não estourar o limite do Supabase
    const now = new Date().toISOString();
    const BATCH = 100;
    for (let i = 0; i < phones.length; i += BATCH) {
      await supabase.from('leads')
        .update({ last_interaction_at: now })
        .eq('user_id', userId)
        .in('phone', phones.slice(i, i + BATCH));
    }
    console.log(`[dispatch] last_interaction_at atualizado para ${phones.length} leads`);
  } catch (e) {
    console.error('[dispatch] Erro ao atualizar last_interaction_at:', e.message);
  }
}

async function executeRealDispatch(dispatchId, userId) {
  const { data: dispatch } = await supabase.from('dispatches').select('*').eq('id', dispatchId).single();
  if (!dispatch) return;

  await supabase.from('dispatches').update({ status: 'sending' }).eq('id', dispatchId);

  const sourceSessionSlot = dispatch.items?.find(item => item?.sourceSessionSlot)?.sourceSessionSlot;
  let sessions;
  try {
    sessions = pickDispatchSessions(getConnectedSessions(userId), sourceSessionSlot);
  } catch (e) {
    await supabase.from('dispatches').update({ status: 'failed' }).eq('id', dispatchId);
    console.error(`[dispatch] ${e.message}`);
    return;
  }
  if (!sessions.length) {
    await supabase.from('dispatches').update({ status: 'failed' }).eq('id', dispatchId);
    console.error(`[dispatch] Nenhuma sessão conectada para user ${userId}`);
    return;
  }

  const contacts = dispatch.items.map(i => ({ id: i.contactId, name: i.contactName, phone: i.contactPhone }));
  console.log(`[dispatch] ${dispatchId} — ${contacts.length} contatos, ${sessions.length} sessão(ões): ${sessions.map(s => s.key).join(', ')}`);

  // Baixa mídia uma vez se existir
  let media = null;
  if (dispatch.media_url) {
    try {
      console.log(`[dispatch] Baixando mídia: ${dispatch.media_url}`);
      let filePath = null;
      if (dispatch.media_url.includes('/storage/v1/object/public/media/')) {
        filePath = decodeURIComponent(dispatch.media_url.split('/storage/v1/object/public/media/')[1]);
      }
      let buffer;
      if (filePath) {
        const { data: fileData, error: dlErr } = await supabase.storage.from('media').download(filePath);
        if (dlErr) throw new Error('Storage: ' + dlErr.message);
        buffer = Buffer.from(await fileData.arrayBuffer());
      } else {
        const resp = await fetch(dispatch.media_url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        buffer = Buffer.from(await resp.arrayBuffer());
      }
      media = {
        buffer,
        mimetype: dispatch.media_mimetype || 'application/octet-stream',
        filename: dispatch.media_filename || 'arquivo',
        caption: dispatch.message_content || '',
      };
      console.log(`[dispatch] ✅ Mídia pronta: ${media.filename} | ${media.mimetype} | ${buffer.length} bytes`);
    } catch (e) {
      console.error(`[dispatch] ❌ Erro ao baixar mídia:`, e.message);
    }
  }

  const results = [...dispatch.items]; // preserva items existentes
  let sent = dispatch.sent || 0;
  let failed = dispatch.failed || 0;
  let sessionIdx = 0;

  for (let i = 0; i < contacts.length; i++) {
    // Verifica se foi pausado ou cancelado durante o envio
    const { data: current } = await supabase.from('dispatches').select('status').eq('id', dispatchId).single();
    if (current?.status === 'paused' || current?.status === 'cancelled') {
      console.log(`[dispatch] ${dispatchId} interrompido por status=${current.status}`);
      return;
    }
    // Pula contatos já enviados (retomada após restart)
    if (results[i]?.status === 'sent') { sessionIdx++; continue; }

    const contact = contacts[i];
    const session = sessions[sessionIdx % sessions.length];
    sessionIdx++;

    try {
      const personalizedMsg = dispatch.message_content.replace(/\{nome\}/gi, contact.name || '');
      if (media) media.caption = personalizedMsg;
      const sendResult = await wpp.sendMessage(session.key, contact.phone, personalizedMsg, media);
      results[i] = { ...dispatch.items[i], status: 'sent', sentAt: new Date().toISOString(), sentVia: session.slot, whatsappMessageId: sendResult.messageId || null, sentFrom: sendResult.from || session.phone || null };
      sent++;
      console.log(`[dispatch] ✓ ${i+1}/${contacts.length} ${contact.phone} via slot ${session.slot}`);
    } catch (e) {
      results[i] = { ...dispatch.items[i], status: 'failed', error: e.message, sentVia: session.slot };
      failed++;
      console.error(`[dispatch] ✗ ${contact.phone}: ${e.message}`);
    }

    // Salva progresso a cada 5 envios
    if (i % 5 === 0 || i === contacts.length - 1) {
      await supabase.from('dispatches').update({ sent, failed, items: results }).eq('id', dispatchId);
    }

    if (i < contacts.length - 1) {
      await new Promise(r => setTimeout(r, 2500 + Math.random() * 1000));
    }
  }

  await supabase.from('dispatches').update({
    sent, failed, status: 'completed',
    items: results,
    completed_at: new Date().toISOString()
  }).eq('id', dispatchId);

  // Atualiza last_interaction_at dos leads que receberam o disparo
  const sentContacts = contacts.filter((_, i) => results[i]?.status === 'sent');
  await updateLeadsInteraction(sentContacts, userId);

  console.log(`[dispatch] ${dispatchId} concluído: ${sent} enviados, ${failed} falhas (${sessions.length} sessão(ões) usada(s))`);
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
      // Atualiza last_interaction_at dos leads que receberam o disparo
      const sentContacts = dispatch.items
        .filter((_, i) => items[i]?.status === 'sent')
        .map(i => ({ phone: i.contactPhone }));
      await updateLeadsInteraction(sentContacts, dispatch.user_id);
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
    const now = new Date();
    const since7d  = new Date(now - 7  * 24 * 60 * 60 * 1000).toISOString();
    const since30d = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    const [
      { count: totalLeads },
      { count: newLeads },
      { count: activeLeads },
      { count: totalMessages },
      { count: totalDispatches },
      { data: dispatchData },
      { data: lastLeads }
    ] = await Promise.all([
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('user_id', uid),
      // Leads Novos: criados nos últimos 7 dias
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('user_id', uid).gte('created_at', since7d),
      // Leads Ativos: tiveram interação nos últimos 30 dias
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('user_id', uid).gte('last_interaction_at', since30d),
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('user_id', uid),
      supabase.from('dispatches').select('*', { count: 'exact', head: true }).eq('user_id', uid),
      supabase.from('dispatches').select('sent').eq('user_id', uid),
      supabase.from('leads').select('id, name, phone, status, created_at').eq('user_id', uid).order('created_at', { ascending: false }).limit(5)
    ]);

    const messagesSent = (dispatchData || []).reduce((acc, d) => acc + (d.sent || 0), 0);

    res.json({
      leads: totalLeads || 0,
      newLeads: newLeads || 0,
      activeLeads: activeLeads || 0,
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

// Insights reais p/ a dashboard: melhores horários (msgs recebidas) +
// desempenho por canal (origem dos leads). Só dados reais do usuário.
app.get('/api/dashboard/insights', requireAuth, async (req, res) => {
  try {
    const uid = req.user.id;
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [{ data: msgs }, { data: leadRows }] = await Promise.all([
      supabase.from('chat_messages')
        .select('timestamp')
        .eq('user_id', uid).eq('direction', 'in')
        .gte('timestamp', since.toISOString())
        .order('timestamp', { ascending: false })
        .limit(8000),
      supabase.from('leads')
        .select('source')
        .eq('user_id', uid)
        .limit(20000),
    ]);

    const hours = Array.from({ length: 24 }, (_, h) => ({
      h: `${String(h).padStart(2, '0')}h`, value: 0,
    }));
    (msgs || []).forEach((m) => {
      const d = new Date(m.timestamp);
      if (!isNaN(d)) hours[d.getHours()].value++;
    });

    const chanMap = new Map();
    (leadRows || []).forEach((l) => {
      const s = (l.source || 'form');
      chanMap.set(s, (chanMap.get(s) || 0) + 1);
    });
    const channels = [...chanMap.entries()]
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);

    res.json({
      hours,
      channels,
      hasData: (msgs?.length || 0) > 0 || channels.length > 0,
    });
  } catch (e) {
    console.error('Insights error:', e);
    res.status(500).json({ error: 'Erro ao buscar insights' });
  }
});

// Série temporal real por DATA (últimos N dias até hoje):
// enviadas = chat_messages out, respostas = chat_messages in, leads = leads criados.
app.get('/api/dashboard/timeseries', requireAuth, async (req, res) => {
  try {
    const uid = req.user.id;
    const days = Math.min(90, Math.max(1, parseInt(req.query.days) || 7));
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));
    const startISO = start.toISOString();

    const [{ data: msgs }, { data: leadRows }] = await Promise.all([
      supabase.from('chat_messages')
        .select('direction, timestamp')
        .eq('user_id', uid)
        .gte('timestamp', startISO)
        .limit(20000),
      supabase.from('leads')
        .select('created_at')
        .eq('user_id', uid)
        .gte('created_at', startISO)
        .limit(20000),
    ]);

    // esqueleto de N dias (chave = YYYY-MM-DD) preservando ordem
    const buckets = {};
    const order = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      order.push(key);
      buckets[key] = {
        date: key,
        label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        enviadas: 0,
        respostas: 0,
        leads: 0,
      };
    }
    const put = (iso, field) => {
      if (!iso) return;
      const k = new Date(iso).toISOString().slice(0, 10);
      if (buckets[k]) buckets[k][field]++;
    };
    (msgs || []).forEach((m) => put(m.timestamp, m.direction === 'in' ? 'respostas' : 'enviadas'));
    (leadRows || []).forEach((l) => put(l.created_at, 'leads'));

    res.json({ days, series: order.map((k) => buckets[k]) });
  } catch (e) {
    console.error('Timeseries error:', e);
    res.status(500).json({ error: 'Erro ao buscar série temporal' });
  }
});

// ═══════════════════════════════════════════════════════════════
// VENDAS / RECEITA (Fase 1)
// ═══════════════════════════════════════════════════════════════

app.get('/api/sales', requireAuth, async (req, res) => {
  try {
    let qb = supabase.from('sales').select('*')
      .eq('user_id', req.user.id)
      .order('closed_at', { ascending: false })
      .limit(500);
    if (req.query.status) qb = qb.eq('status', req.query.status);
    const { data, error } = await qb;
    if (error) throw error;
    res.json(data || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/sales/summary', requireAuth, async (req, res) => {
  try {
    const uid = req.user.id;
    const days = Math.min(365, Math.max(1, parseInt(req.query.days) || 30));
    const now = new Date();
    const start = new Date(now); start.setDate(now.getDate() - (days - 1)); start.setHours(0, 0, 0, 0);
    const prevStart = new Date(start); prevStart.setDate(start.getDate() - days);

    const { data: rows } = await supabase
      .from('sales')
      .select('amount, status, source, closed_at')
      .eq('user_id', uid)
      .eq('status', 'won')
      .gte('closed_at', prevStart.toISOString())
      .limit(20000);

    const all = rows || [];
    const inRange = all.filter((r) => new Date(r.closed_at) >= start);
    const prev = all.filter((r) => {
      const d = new Date(r.closed_at);
      return d >= prevStart && d < start;
    });
    const sum = (a) => a.reduce((t, r) => t + Number(r.amount || 0), 0);
    const total = sum(inRange);
    const prevTotal = sum(prev);
    const count = inRange.length;

    const byDayMap = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      byDayMap[d.toISOString().slice(0, 10)] = {
        d: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), v: 0,
      };
    }
    const chanMap = new Map();
    inRange.forEach((r) => {
      const k = new Date(r.closed_at).toISOString().slice(0, 10);
      if (byDayMap[k]) byDayMap[k].v += Number(r.amount || 0);
      const s = r.source || 'manual';
      chanMap.set(s, (chanMap.get(s) || 0) + Number(r.amount || 0));
    });

    res.json({
      total,
      count,
      avgTicket: count ? Math.round((total / count) * 100) / 100 : 0,
      prevTotal,
      deltaPct: prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 1000) / 10 : null,
      byDay: Object.values(byDayMap),
      byChannel: [...chanMap.entries()].map(([source, amount]) => ({ source, amount })),
      days,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Receita & conversão por campanha/fluxo (atribuição real).
// ROI puro precisaria de custo da campanha (não rastreado) — por isso
// expomos receita atribuída + taxa de conversão, que são dados reais.
app.get('/api/sales/roi', requireAuth, async (req, res) => {
  try {
    const uid = req.user.id;
    const days = Math.min(365, Math.max(1, parseInt(req.query.days) || 30));
    const start = new Date(); start.setDate(start.getDate() - (days - 1)); start.setHours(0, 0, 0, 0);

    const [{ data: sales }, { data: dispatches }, { data: workflows }] = await Promise.all([
      supabase.from('sales')
        .select('amount, status, dispatch_id, workflow_id, closed_at')
        .eq('user_id', uid).eq('status', 'won')
        .gte('closed_at', start.toISOString()).limit(20000),
      supabase.from('dispatches')
        .select('id, message_title, total, created_at')
        .eq('user_id', uid).order('created_at', { ascending: false }).limit(200),
      supabase.from('workflows')
        .select('id, name')
        .eq('user_id', uid).limit(200),
    ]);

    const dMap = new Map((dispatches || []).map((d) => [d.id, d]));
    const wMap = new Map((workflows || []).map((w) => [w.id, w]));
    const acc = new Map(); // key -> agg

    (sales || []).forEach((s) => {
      const amt = Number(s.amount || 0);
      if (s.dispatch_id && dMap.has(s.dispatch_id)) {
        const d = dMap.get(s.dispatch_id);
        const k = `c:${d.id}`;
        const a = acc.get(k) || { kind: 'campaign', id: d.id, name: d.message_title || 'Campanha', recipients: d.total || 0, revenue: 0, count: 0 };
        a.revenue += amt; a.count++; acc.set(k, a);
      } else if (s.workflow_id && wMap.has(s.workflow_id)) {
        const w = wMap.get(s.workflow_id);
        const k = `f:${w.id}`;
        const a = acc.get(k) || { kind: 'flow', id: w.id, name: w.name || 'Fluxo', recipients: 0, revenue: 0, count: 0 };
        a.revenue += amt; a.count++; acc.set(k, a);
      } else {
        const a = acc.get('none') || { kind: 'none', id: null, name: 'Sem atribuição', recipients: 0, revenue: 0, count: 0 };
        a.revenue += amt; a.count++; acc.set('none', a);
      }
    });

    const rows = [...acc.values()].map((a) => ({
      ...a,
      avgTicket: a.count ? Math.round((a.revenue / a.count) * 100) / 100 : 0,
      convRate: a.recipients ? Math.round((a.count / a.recipients) * 1000) / 10 : null,
    })).sort((x, y) => y.revenue - x.revenue);

    res.json({ days, rows, totalRevenue: rows.reduce((t, r) => t + r.revenue, 0) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/sales', requireAuth, async (req, res) => {
  try {
    const { lead_id, title, amount, currency, status, note, closed_at, workflow_id } = req.body;
    let { source, dispatch_id } = req.body;
    const val = Number(amount);
    if (!(val >= 0)) return res.status(400).json({ error: 'Valor inválido' });

    // Atribuição automática (best-effort): se não veio campanha/fluxo mas
    // tem lead, vincula à campanha mais recente que mirou esse lead.
    if (!dispatch_id && !workflow_id && lead_id) {
      try {
        const { data: ds } = await supabase
          .from('dispatches')
          .select('id, items, created_at')
          .eq('user_id', req.user.id)
          .order('created_at', { ascending: false })
          .limit(50);
        const hit = (ds || []).find((d) =>
          Array.isArray(d.items) && d.items.some((it) => it.contactId === lead_id)
        );
        if (hit) {
          dispatch_id = hit.id;
          if (!source) source = 'campaign';
        }
      } catch {}
    }

    const { data, error } = await supabase.from('sales').insert({
      user_id: req.user.id,
      lead_id: lead_id || null,
      title: title || '',
      amount: val,
      currency: currency || 'BRL',
      status: ['won', 'pending', 'lost'].includes(status) ? status : 'won',
      source: ['manual', 'campaign', 'flow', 'integration'].includes(source) ? source : 'manual',
      note: note || '',
      dispatch_id: dispatch_id || null,
      workflow_id: workflow_id || null,
      closed_at: closed_at ? new Date(closed_at).toISOString() : new Date().toISOString(),
    }).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/sales/:id', requireAuth, async (req, res) => {
  try {
    const allowed = ['title', 'amount', 'currency', 'status', 'source', 'note', 'closed_at', 'lead_id', 'dispatch_id', 'workflow_id'];
    const patch = {};
    for (const k of allowed) if (req.body[k] !== undefined) patch[k] = req.body[k];
    if (patch.amount !== undefined) patch.amount = Number(patch.amount) || 0;
    if (patch.closed_at) patch.closed_at = new Date(patch.closed_at).toISOString();
    const { data, error } = await supabase.from('sales').update(patch)
      .eq('id', req.params.id).eq('user_id', req.user.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/sales/:id', requireAuth, async (req, res) => {
  try {
    await supabase.from('sales').delete()
      .eq('id', req.params.id).eq('user_id', req.user.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════
// WHATSAPP CLOUD API (Meta direto)
// ═══════════════════════════════════════════════════════════════

async function getCloudConfig(userId) {
  const { data } = await supabase.from('whatsapp_cloud_configs').select('*').eq('user_id', userId).single();
  return data;
}

// Disparo em massa via API Meta (Cloud API)
async function executeCloudDispatch(dispatchId, userId, useTemplate = false) {
  const dispatch = await supabase.from('dispatches').select('*').eq('id', dispatchId).single().then(r => r.data);
  if (!dispatch) return;

  const config = await getCloudConfig(userId);
  if (!config?.access_token || !config?.phone_number_id) {
    await supabase.from('dispatches').update({ status: 'failed' }).eq('id', dispatchId);
    console.error(`[cloud] Config Meta não encontrada para user ${userId}`);
    return;
  }

  await supabase.from('dispatches').update({ status: 'sending' }).eq('id', dispatchId);

  const creds = { token: config.access_token, phoneNumberId: config.phone_number_id, businessAccountId: config.business_account_id };
  const contacts = dispatch.items.map(i => ({ id: i.contactId, name: i.contactName, phone: i.contactPhone }));
  console.log(`[cloud] Dispatch ${dispatchId} — ${contacts.length} contatos via Meta API`);

  const updatedItems = [...dispatch.items];
  let sent = 0, failed = 0;

  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];
    try {
      if (useTemplate && dispatch.template_name) {
        // Envia template aprovado pela Meta
        const vars = [contact.name || ''].filter(Boolean);
        await wppCloud.sendTemplate(creds, contact.phone, dispatch.template_name, 'pt_BR', vars);
      } else {
        // Envia texto livre (só funciona dentro da janela 24h)
        const text = dispatch.message_content.replace(/\{nome\}/gi, contact.name || '');
        await wppCloud.sendText(creds, contact.phone, text);
      }
      updatedItems[i] = { ...updatedItems[i], status: 'sent', sentAt: new Date().toISOString(), sentVia: 'cloud_api' };
      sent++;
      console.log(`[cloud] ✅ ${contact.phone}`);
    } catch (e) {
      updatedItems[i] = { ...updatedItems[i], status: 'failed', error: e.message, sentVia: 'cloud_api' };
      failed++;
      console.error(`[cloud] ❌ ${contact.phone}: ${e.message}`);
    }
    await supabase.from('dispatches').update({ sent, failed, items: updatedItems }).eq('id', dispatchId);
    // Delay respeitoso (Meta tem rate limit de ~80 msg/s)
    if (i < contacts.length - 1) await new Promise(r => setTimeout(r, 500));
  }

  await supabase.from('dispatches').update({
    sent, failed, status: 'completed',
    items: updatedItems,
    completed_at: new Date().toISOString()
  }).eq('id', dispatchId);

  // Atualiza last_interaction_at dos leads que receberam o disparo
  const sentContacts = contacts.filter((_, i) => updatedItems[i]?.status === 'sent');
  await updateLeadsInteraction(sentContacts, userId);

  console.log(`[cloud] Dispatch ${dispatchId} concluído: ${sent} enviados, ${failed} falhas`);
}

// Bulk direto via Cloud API (lista de números)
async function sendBulkCloud(userId, phones, message, delayMs = 500) {
  const config = await getCloudConfig(userId);
  if (!config?.access_token) throw new Error('API Meta não configurada');
  const creds = { token: config.access_token, phoneNumberId: config.phone_number_id };
  const results = [];
  for (let i = 0; i < phones.length; i++) {
    const p = phones[i];
    try {
      const text = (p.text || message).replace(/\{nome\}/gi, p.name || '').replace(/\{name\}/gi, p.name || '');
      await wppCloud.sendText(creds, p.phone, text);
      results.push({ ...p, status: 'sent', sentVia: 'cloud_api' });
    } catch (e) {
      results.push({ ...p, status: 'failed', error: e.message, sentVia: 'cloud_api' });
    }
    if (i < phones.length - 1) await new Promise(r => setTimeout(r, delayMs));
  }
  return results;
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
// WORKFLOWS — Workflow Builder visual (tabela própria: workflows)
// ═══════════════════════════════════════════════════════════════

app.get('/api/workflows', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('workflows')
      .select('id, name, status, updated_at')
      .eq('user_id', req.user.id)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/workflows/:id', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('workflows').select('*')
      .eq('id', req.params.id).eq('user_id', req.user.id).single();
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(404).json({ error: 'Fluxo não encontrado' }); }
});

app.post('/api/workflows', requireAuth, async (req, res) => {
  try {
    const { name, nodes, edges, status } = req.body;
    const { data, error } = await supabase.from('workflows').insert({
      name: name || 'Novo fluxo',
      nodes: nodes || [],
      edges: edges || [],
      status: status === 'published' ? 'published' : 'draft',
      user_id: req.user.id,
    }).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/workflows/:id', requireAuth, async (req, res) => {
  try {
    const { name, nodes, edges, status } = req.body;
    const patch = { updated_at: new Date().toISOString() };
    if (name !== undefined) patch.name = name;
    if (nodes !== undefined) patch.nodes = nodes;
    if (edges !== undefined) patch.edges = edges;
    if (status !== undefined) patch.status = status === 'published' ? 'published' : 'draft';
    const { data, error } = await supabase.from('workflows').update(patch)
      .eq('id', req.params.id).eq('user_id', req.user.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/workflows/:id', requireAuth, async (req, res) => {
  try {
    await supabase.from('workflows').delete()
      .eq('id', req.params.id).eq('user_id', req.user.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Test-run manual: dispara o fluxo para um número de teste pelo WhatsApp do usuário
app.post('/api/workflows/:id/run', requireAuth, rateLimit(60 * 1000, 10), async (req, res) => {
  try {
    const { phone, name } = req.body;
    if (!phone) return res.status(400).json({ error: 'Informe um número de teste' });
    const { data: wf, error } = await supabase.from('workflows').select('*')
      .eq('id', req.params.id).eq('user_id', req.user.id).single();
    if (error || !wf) return res.status(404).json({ error: 'Fluxo não encontrado' });
    const connected = getConnectedSessions(req.user.id);
    if (!connected.length) {
      return res.status(409).json({ error: 'Nenhum canal WhatsApp conectado. Conecte em Canais.' });
    }
    const result = await workflowEngine.testRun(wf, connected[0].key, phone, name);
    res.json(result);
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

// ═══════════════════════════════════════════════════════════════
// MÍDIA — Upload e envio de anexos via WhatsApp
// ═══════════════════════════════════════════════════════════════

// Upload de arquivo → salva no Supabase Storage e retorna URL + metadados
app.post('/api/media/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    const { originalname, mimetype, buffer, size } = req.file;
    const ext = originalname.split('.').pop();
    const filename = `${req.user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from('media')
      .upload(filename, buffer, { contentType: mimetype, upsert: false });

    if (upErr) throw new Error('Erro no upload: ' + upErr.message);

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(filename);

    // Determina tipo para o frontend
    let type = 'document';
    if (mimetype.startsWith('image/')) type = 'image';
    else if (mimetype.startsWith('video/')) type = 'video';
    else if (mimetype.startsWith('audio/')) type = 'audio';

    res.json({
      filename,
      originalname,
      mimetype,
      size,
      type,
      url: urlData.publicUrl,
    });
  } catch (e) {
    console.error('[media] upload error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Deletar mídia do Storage
app.delete('/api/media/:filename(*)', requireAuth, async (req, res) => {
  try {
    const filename = req.params.filename;
    if (!filename.startsWith(req.user.id + '/')) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    await supabase.storage.from('media').remove([filename]);
    res.json({ message: 'Arquivo removido' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Envio de teste com mídia
app.post('/api/whatsapp/send-media', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const { phone, message, mediaUrl, mediaMimetype, mediaFilename } = req.body;
    if (!phone) return res.status(400).json({ error: 'Telefone obrigatório' });

    const connected = getConnectedSessions(req.user.id);
    if (!connected.length) return res.status(400).json({ error: 'Nenhum WhatsApp conectado.' });

    let media = null;
    if (req.file) {
      media = { buffer: req.file.buffer, mimetype: req.file.mimetype, filename: req.file.originalname, caption: message || '' };
    } else if (mediaUrl) {
      // Baixa do Supabase Storage diretamente (evita problema de bucket privado)
      let buffer;
      if (mediaUrl.includes('/storage/v1/object/public/media/')) {
        const filePath = mediaUrl.split('/storage/v1/object/public/media/')[1];
        const { data: fileData, error: dlErr } = await supabase.storage.from('media').download(filePath);
        if (dlErr) throw new Error('Erro ao baixar mídia: ' + dlErr.message);
        buffer = Buffer.from(await fileData.arrayBuffer());
      } else {
        const response = await fetch(mediaUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status} ao baixar mídia`);
        buffer = Buffer.from(await response.arrayBuffer());
      }
      media = { buffer, mimetype: mediaMimetype || 'application/octet-stream', filename: mediaFilename || 'arquivo', caption: message || '' };
    }

    const result = await wpp.sendMessage(connected[0].key, phone, message || '', media);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const MAX_SESSIONS_PER_USER = 2;

function sessionKey(userId, slot) {
  return `${userId}_slot${slot}`;
}

// Decompõe sessionId -> { userId, slot }
function parseSessionId(sessionId) {
  const m = String(sessionId || '').match(/^(.+)_slot(\d+)$/);
  if (m) return { userId: m[1], slot: parseInt(m[2]) };
  // legacy: sessionId == userId
  return { userId: sessionId, slot: 1 };
}

// ── SSE: clientes conectados por userId ──────────────────────
const sseClients = new Map(); // userId -> Set<res>

function sseSend(userId, event, data) {
  const set = sseClients.get(userId);
  if (!set || !set.size) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of set) {
    try { res.write(payload); } catch {}
  }
}

// Eventos de conexão WhatsApp → broadcast SSE pro usuário dono da sessão
wpp.on('qr', ({ sessionId, qr }) => {
  const { userId, slot } = parseSessionId(sessionId);
  if (!userId) return;
  sseSend(userId, 'connection', { slot, status: 'qr_ready', qr });
});
wpp.on('connected', ({ sessionId, phone }) => {
  const { userId, slot } = parseSessionId(sessionId);
  if (!userId) return;
  sseSend(userId, 'connection', { slot, status: 'connected', phone });
});
wpp.on('disconnected', ({ sessionId }) => {
  const { userId, slot } = parseSessionId(sessionId);
  if (!userId) return;
  sseSend(userId, 'connection', { slot, status: 'disconnected' });

  // Cancela disparos ativos desse slot para não enviar com número desconectado
  supabase.from('dispatches')
    .update({ status: 'cancelled', cancel_reason: 'Número desconectado' })
    .eq('user_id', userId)
    .eq('session_slot', slot)
    .in('status', ['sending', 'scheduled', 'paused'])
    .then(({ error }) => {
      if (error) console.error(`[disconnect] Erro ao cancelar disparos do slot${slot}:`, error.message);
      else console.log(`[disconnect] Disparos ativos do user=${userId} slot=${slot} cancelados por desconexão`);
    });
});

// SSE stream — autentica via Authorization header OU ?token=...
app.get('/api/chats/stream', requireAuth, (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();
  res.write(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`);

  const userId = req.user.id;
  if (!sseClients.has(userId)) sseClients.set(userId, new Set());
  sseClients.get(userId).add(res);

  const heartbeat = setInterval(() => {
    try { res.write(': ping\n\n'); } catch {}
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.get(userId)?.delete(res);
    if (!sseClients.get(userId)?.size) sseClients.delete(userId);
  });
});

// ── Atualiza nome salvo do contato (pelo phonebook do telefone do user) ──
wpp.on('contact', async ({ sessionId, phone, name }) => {
  try {
    const { userId, slot } = parseSessionId(sessionId);
    if (!userId || !name) return;
    await supabase.from('chats').update({ name, updated_at: new Date().toISOString() })
      .eq('user_id', userId).eq('session_slot', slot).eq('phone', phone);
  } catch (e) { console.warn('[contact update]', e.message); }
});

// ── Refresh de foto de perfil (cache 24h) ────────────────────
const PIC_CACHE_TTL = 24 * 60 * 60 * 1000; // 24h
async function refreshProfilePic(userId, slot, sessionId, phone, currentRow) {
  try {
    const refreshedAt = currentRow?.profile_pic_refreshed_at ? new Date(currentRow.profile_pic_refreshed_at).getTime() : 0;
    if (currentRow?.profile_pic_url && Date.now() - refreshedAt < PIC_CACHE_TTL) return null;
    const url = await wpp.getProfilePicture(sessionId, phone, 'image');
    if (url === currentRow?.profile_pic_url) {
      await supabase.from('chats').update({ profile_pic_refreshed_at: new Date().toISOString() })
        .eq('user_id', userId).eq('session_slot', slot).eq('phone', phone);
      return null;
    }
    await supabase.from('chats').update({
      profile_pic_url: url || null,
      profile_pic_refreshed_at: new Date().toISOString()
    }).eq('user_id', userId).eq('session_slot', slot).eq('phone', phone);
    return url;
  } catch (e) { return null; }
}

// ── Persistência de mensagens recebidas/enviadas em chats + chat_messages ──
async function uploadIncomingMedia(userId, evt) {
  if (!evt.mediaBuffer || !evt.mediaBuffer.length) return null;
  try {
    const ext = (evt.mimeType || '').split('/')[1]?.split(';')[0] || 'bin';
    const safeName = (evt.fileName || `${evt.type}_${Date.now()}`).replace(/[^a-zA-Z0-9.\-_]/g, '_').slice(0, 60);
    const filePath = `${userId}/incoming/${Date.now()}_${safeName}${safeName.includes('.') ? '' : '.' + ext}`;
    const { error } = await supabase.storage.from('media').upload(filePath, evt.mediaBuffer, {
      contentType: evt.mimeType || 'application/octet-stream', upsert: false
    });
    if (error) { console.warn('[chat media] upload erro:', error.message); return null; }
    const { data } = supabase.storage.from('media').getPublicUrl(filePath);
    return data?.publicUrl || null;
  } catch (e) { console.warn('[chat media] erro:', e.message); return null; }
}

wpp.on('message', async (evt) => {
  try {
    const { userId, slot } = parseSessionId(evt.sessionId);
    console.log(`[chat] msg ${evt.fromMe ? 'OUT' : 'IN'} session=${evt.sessionId} user=${userId} slot=${slot} phone=${evt.phone} type=${evt.type} text="${(evt.text || '').slice(0, 40)}"`);
    if (!userId) { console.warn('[chat] sessionId inválido, ignorando'); return; }

    const ts = evt.timestamp ? new Date(evt.timestamp).toISOString() : new Date().toISOString();
    const previewLabels = { image: '📷 Foto', audio: '🎵 Áudio', video: '🎬 Vídeo', document: '📄 Documento', sticker: '🌟 Figurinha' };
    const lastMsg = evt.text || previewLabels[evt.type] || '';

    // CRM: marca última interação do lead (best-effort, não bloqueia o chat)
    supabase.from('leads')
      .update({ last_interaction_at: ts })
      .eq('user_id', userId).eq('phone', evt.phone)
      .then(() => {}, () => {});

    const { data: existing } = await supabase
      .from('chats').select('id, unread, profile_pic_url, profile_pic_refreshed_at')
      .eq('user_id', userId).eq('session_slot', slot).eq('phone', evt.phone)
      .maybeSingle();
    let chatId = existing?.id;

    if (!chatId) {
      // Usa upsert para evitar duplicate key quando há race condition
      const { data: created, error: cErr } = await supabase.from('chats').upsert({
        user_id: userId, session_slot: slot, phone: evt.phone,
        name: evt.pushName || null,
        last_message: lastMsg,
        last_message_at: ts,
        unread: evt.fromMe ? 0 : 1,
      }, { onConflict: 'user_id,session_slot,phone' }).select('id').single();
      if (cErr) { console.error('[chat] erro criar chat:', cErr.message, cErr.details || ''); return; }
      chatId = created?.id;
    } else {
      await supabase.from('chats').update({
        name: evt.pushName || undefined,
        last_message: lastMsg,
        last_message_at: ts,
        unread: evt.fromMe ? (existing.unread || 0) : (existing.unread || 0) + 1,
        updated_at: new Date().toISOString(),
      }).eq('id', chatId);
    }
    if (!chatId) { console.error('[chat] chatId nulo'); return; }

    refreshProfilePic(userId, slot, evt.sessionId, evt.phone, existing).catch(() => {});

    const mediaUrl = await uploadIncomingMedia(userId, evt);

    // Insert mensagem — upsert só quando wa_id existir (NULL quebra unique constraint)
    const msgData = {
      chat_id: chatId, user_id: userId,
      direction: evt.fromMe ? 'out' : 'in',
      type: evt.type || 'text',
      text: evt.text || null,
      media_url: mediaUrl,
      mime_type: evt.mimeType || null,
      timestamp: ts,
      status: evt.fromMe ? 'sent' : null,
    };

    if (evt.waId) {
      const { error: mErr } = await supabase.from('chat_messages')
        .upsert({ ...msgData, wa_id: evt.waId }, { onConflict: 'chat_id,wa_id', ignoreDuplicates: true });
      if (mErr) console.error('[chat] erro upsert msg:', mErr.message, mErr.details || '');
    } else {
      const { error: mErr } = await supabase.from('chat_messages').insert(msgData);
      if (mErr && !mErr.message?.includes('duplicate')) {
        console.error('[chat] erro insert msg:', mErr.message, mErr.details || '');
      }
    }

    // Invalida cache chats
    chatsCache.delete(`${userId}:${slot}`);
    chatsCache.delete(`${userId}:null`);
    sseSend(userId, 'message', {
      chatId, slot, phone: evt.phone, name: evt.pushName,
      direction: evt.fromMe ? 'out' : 'in',
      type: evt.type, text: evt.text,
      media_url: mediaUrl, mime_type: evt.mimeType, timestamp: ts,
    });

    // Quando o cliente responde (mensagem de entrada), atualiza lead:
    // - status: new → contacted (não regride se já for converted)
    // - last_interaction_at: agora
    if (!evt.fromMe && evt.phone) {
      const phone = evt.phone.replace(/\D/g, '');
      supabase.from('leads')
        .select('id, status')
        .eq('user_id', userId)
        .eq('phone', phone)
        .single()
        .then(({ data: lead }) => {
          if (!lead) return;
          const patch = { last_interaction_at: new Date().toISOString() };
          if (lead.status === 'new') patch.status = 'contacted';
          return supabase.from('leads').update(patch).eq('id', lead.id);
        })
        .catch(e => console.error('[chat] erro ao atualizar lead:', e.message));
    }
  } catch (e) {
    console.error('[chat persist] ERRO:', e.message, e?.code || '', e?.details || '');
  }
});

// ── Endpoints de Conversas ────────────────────────────────────
// Lista conversas (filtrável por slot)
app.get('/api/chats', requireAuth, async (req, res) => {
  try {
    const slot = req.query.slot ? parseInt(req.query.slot) : null;
    console.log(`[chats GET] user=${req.user.id} slot=${slot}`);

    // Cache simples em memória por 10s — evita rafaga de queries no Supabase
    const cacheKey = `${req.user.id}:${slot}`;
    const cached = chatsCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < 10000) {
      return res.json(cached.data);
    }

    let q = supabase.from('chats')
      .select('id, session_slot, phone, name, last_message, last_message_at, unread, profile_pic_url')
      .eq('user_id', req.user.id)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(200);
    if (slot) q = q.eq('session_slot', slot);
    const { data, error } = await q;
    if (error) throw error;

    const result = data || [];
    chatsCache.set(cacheKey, { data: result, ts: Date.now() });
    console.log(`[chats GET] found ${result.length} chats`);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Mensagens de um chat
app.get('/api/chats/:chatId/messages', requireAuth, async (req, res) => {
  try {
    const { data: chat } = await supabase.from('chats')
      .select('id').eq('id', req.params.chatId).eq('user_id', req.user.id).single();
    if (!chat) return res.status(404).json({ error: 'Chat não encontrado' });

    const { data, error } = await supabase.from('chat_messages')
      .select('id, wa_id, direction, type, text, caption, media_url, mime_type, status, timestamp')
      .eq('chat_id', req.params.chatId)
      .order('timestamp', { ascending: true })
      .limit(500);
    if (error) throw error;
    // Zera unread ao abrir
    await supabase.from('chats').update({ unread: 0 }).eq('id', req.params.chatId);
    res.json(data || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Envia mensagem por uma sessão específica e persiste
app.post('/api/chats/send', requireAuth, async (req, res) => {
  try {
    const { slot, phone, message } = req.body;
    if (!phone || !message) return res.status(400).json({ error: 'phone e message obrigatórios' });
    const useSlot = slot ? parseInt(slot) : 1;
    const key = sessionKey(req.user.id, useSlot);
    const status = wpp.getStatus(key);
    if (status.status !== 'connected') return res.status(400).json({ error: `Slot ${useSlot} não conectado` });

    const r = await wpp.sendMessage(key, phone, message);
    // O hook messages.upsert (fromMe) também persiste, mas assegura aqui
    const cleanedPhone = String(phone).replace(/\D/g, '');
    const ts = new Date().toISOString();
    let { data: chat } = await supabase.from('chats').select('id')
      .eq('user_id', req.user.id).eq('session_slot', useSlot).eq('phone', cleanedPhone).maybeSingle();
    if (!chat) {
      const { data: created } = await supabase.from('chats').insert({
        user_id: req.user.id, session_slot: useSlot, phone: cleanedPhone,
        last_message: message, last_message_at: ts, unread: 0
      }).select('id').single();
      chat = created;
    } else {
      await supabase.from('chats').update({ last_message: message, last_message_at: ts, updated_at: ts }).eq('id', chat.id);
    }
    if (chat?.id) {
      await supabase.from('chat_messages').insert({
        chat_id: chat.id, user_id: req.user.id,
        direction: 'out', type: 'text', text: message,
        status: 'sent', timestamp: ts
      });
      sseSend(req.user.id, 'message', {
        chatId: chat.id, slot: useSlot, phone: cleanedPhone,
        direction: 'out', type: 'text', text: message, timestamp: ts,
      });
    }
    res.json({ ok: true, sentTo: r.to });
  } catch (e) {
    console.error('[chats/send]', e);
    res.status(500).json({ error: e.message });
  }
});

// Retorna todas as sessões ativas do usuário
function getUserSessions(userId) {
  const sessions = [];
  for (let s = 1; s <= MAX_SESSIONS_PER_USER; s++) {
    const key = sessionKey(userId, s);
    const st = wpp.getStatus(key);
    sessions.push({ slot: s, key, ...st });
  }
  return sessions;
}

// Retorna sessões conectadas — inclui sessão legada (userId sem slot)
function getConnectedSessions(userId) {
  const slotSessions = getUserSessions(userId).filter(s => s.status === 'connected');
  if (slotSessions.length) return slotSessions;

  // Fallback: sessão legada criada antes do sistema multi-slot
  const legacyStatus = wpp.getStatus(userId);
  if (legacyStatus?.status === 'connected') {
    return [{ slot: 1, key: userId, ...legacyStatus }];
  }
  return [];
}

function pickDispatchSessions(connectedSessions, sourceSessionSlot) {
  const slot = sourceSessionSlot ? parseInt(sourceSessionSlot) : null;
  if (!slot) return connectedSessions;
  const selected = connectedSessions.find(s => s.slot === slot);
  if (!selected) throw new Error(`Número ${slot} não está conectado.`);
  return [selected];
}

// Listar todas as sessões do usuário
app.get('/api/whatsapp/sessions', requireAuth, async (req, res) => {
  res.json(getUserSessions(req.user.id));
});

// Conectar uma sessão específica (slot 1 ou 2)
app.post('/api/whatsapp/sessions/:slot/connect', requireAuth, async (req, res) => {
  try {
    const slot = parseInt(req.params.slot);
    if (slot < 1 || slot > MAX_SESSIONS_PER_USER) {
      return res.status(400).json({ error: `Slot inválido. Use 1 ou 2.` });
    }
    const key = sessionKey(req.user.id, slot);
    const result = await wpp.createSession(key);
    res.json({ slot, ...result });
  } catch (e) {
    console.error('[WPP] connect error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Status de uma sessão específica
app.get('/api/whatsapp/sessions/:slot/status', requireAuth, async (req, res) => {
  const slot = parseInt(req.params.slot);
  const key = sessionKey(req.user.id, slot);
  res.json({ slot, ...wpp.getStatus(key) });
});

// Desconectar uma sessão específica
app.post('/api/whatsapp/sessions/:slot/disconnect', requireAuth, async (req, res) => {
  try {
    const slot = parseInt(req.params.slot);
    const key = sessionKey(req.user.id, slot);
    await wpp.disconnectSession(key);
    res.json({ message: `Slot ${slot} desconectado` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Manter rotas antigas funcionando (slot 1 = padrão)
app.post('/api/whatsapp/connect', requireAuth, async (req, res) => {
  try {
    const key = sessionKey(req.user.id, 1);
    const result = await wpp.createSession(key);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/whatsapp/status', requireAuth, async (req, res) => {
  res.json(wpp.getStatus(sessionKey(req.user.id, 1)));
});

app.post('/api/whatsapp/disconnect', requireAuth, async (req, res) => {
  try {
    await wpp.disconnectSession(sessionKey(req.user.id, 1));
    res.json({ message: 'Desconectado com sucesso' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Iniciar / conectar sessão (gera QR)
app.post('/api/whatsapp/connect_legacy', requireAuth, async (req, res) => {
  try {
    const sessionId = req.user.id;
    const result = await wpp.createSession(sessionId);
    res.json(result);
  } catch (e) {
    console.error('[WPP] connect error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Enviar mensagem única (teste) — usa primeira sessão conectada
app.post('/api/whatsapp/send', requireAuth, async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) return res.status(400).json({ error: 'Telefone e mensagem são obrigatórios' });
    const connected = getConnectedSessions(req.user.id);
    if (!connected.length) return res.status(400).json({ error: 'Nenhum WhatsApp conectado.' });
    const result = await wpp.sendMessage(connected[0].key, phone, message);
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

    const connected1 = getConnectedSessions(req.user.id);
    if (!connected1.length) {
      return res.status(400).json({ error: 'Nenhum WhatsApp conectado. Conecte pelo menos 1 número em Conexões.' });
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
      const results = await wpp.sendBulkRoundRobin(req.user.id, getConnectedSessions(req.user.id), contacts, message.content, 2500);
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
    const { phones, message, delay, pauseEvery, pauseDuration, scheduledAt, dualChip, mediaUrl, mediaMimetype, mediaFilename, channel, sourceSessionSlot } = req.body;
    if (!message || !phones?.length) {
      return res.status(400).json({ error: 'Mensagem e contatos são obrigatórios' });
    }

    const limit = await checkDispatchLimit(req.user.id);
    if (!limit.ok) {
      return res.status(402).json({ error: `Limite de disparos do plano ${limit.plan} atingido (${limit.used}/${limit.limit} este mês). Faça upgrade para continuar.`, code: 'PLAN_LIMIT', plan: limit.plan, used: limit.used, limit: limit.limit });
    }

    const connectedSessions = getConnectedSessions(req.user.id);
    const cloudCfg = await getCloudConfig(req.user.id);
    const hasBaileys = connectedSessions.length > 0;
    const hasCloudCfg = !!(cloudCfg?.access_token && cloudCfg?.enabled);
    const useCloud = channel === 'cloud' || (!hasBaileys && hasCloudCfg);
    if (!useCloud && sourceSessionSlot && !connectedSessions.some(s => s.slot === parseInt(sourceSessionSlot))) {
      return res.status(400).json({ error: `Número ${sourceSessionSlot} não está conectado.` });
    }

    if (!hasBaileys && !hasCloudCfg) {
      return res.status(400).json({ error: 'Nenhum canal configurado. Conecte o WhatsApp ou configure a API Meta.' });
    }
    if (channel === 'cloud' && !hasCloudCfg) {
      return res.status(400).json({ error: 'API Meta não configurada. Vá em WhatsApp Oficial e configure as credenciais.' });
    }
    const selectedSessions = useCloud ? connectedSessions : pickDispatchSessions(connectedSessions, sourceSessionSlot);
    const effectiveDualChip = !sourceSessionSlot && dualChip;
    if (effectiveDualChip && !useCloud && selectedSessions.length < 2) {
      return res.status(400).json({ error: 'Modo 2 Chips requer 2 números conectados.' });
    }

    const items = phones.map(p => ({
      contactName: p.name || p.phone,
      contactPhone: p.phone,
      status: 'pending',
      sourceSessionSlot: sourceSessionSlot ? parseInt(sourceSessionSlot) : null,
    }));
    const titleSuffix = useCloud ? ' [API Meta]' : effectiveDualChip ? ' [2 Chips]' : sourceSessionSlot ? ` [Número ${sourceSessionSlot}]` : '';
    const { data: dispatch, error } = await supabase.from('dispatches').insert({
      message_id: null,
      message_title: `Disparo ${new Date().toLocaleDateString('pt-BR')}${titleSuffix}`,
      message_content: message,
      total: phones.length,
      sent: 0, failed: 0,
      status: scheduledAt ? 'scheduled' : 'sending',
      items,
      user_id: req.user.id,
      scheduled_at: scheduledAt || null,
      channel: useCloud ? 'cloud_api' : 'baileys',
    }).select().single();
    if (error) throw error;
    res.json({ dispatchId: dispatch.id, total: phones.length, message: scheduledAt ? 'Disparo agendado!' : 'Disparo iniciado!', via: useCloud ? 'cloud_api' : 'baileys', sourceSessionSlot: sourceSessionSlot ? parseInt(sourceSessionSlot) : null });

    if (!scheduledAt) {
      if (useCloud) {
        // Executa via Cloud API
        (async () => {
          const results = await sendBulkCloud(req.user.id, phones, message, 600);
          const sent = results.filter(r => r.status === 'sent').length;
          const failed = results.filter(r => r.status === 'failed').length;
          const updatedItems = items.map((item, i) => ({ ...item, ...results[i] }));
          await supabase.from('dispatches').update({ sent, failed, status: 'completed', items: updatedItems, completed_at: new Date().toISOString() }).eq('id', dispatch.id);
        })();
      } else {
        const delayMs = Math.max(1000, (parseInt(delay) || 3) * 1000);
        const pause = parseInt(pauseEvery) || 0;
        const pauseMs = (parseInt(pauseDuration) || 5) * 60 * 1000;
        const updatedItems = [...items];
        let sent = 0, failed = 0;
        let sessionIdx = 0;

        // Baixa mídia uma vez antes do loop
        let media = null;
        if (mediaUrl) {
          try {
            console.log(`[bulk] Baixando mídia: ${mediaUrl}`);
            console.log(`[bulk] mimetype=${mediaMimetype} filename=${mediaFilename}`);

            let filePath = null;
            if (mediaUrl.includes('/storage/v1/object/public/media/')) {
              filePath = decodeURIComponent(mediaUrl.split('/storage/v1/object/public/media/')[1]);
            }

            let buffer;
            if (filePath) {
              console.log(`[bulk] Via Supabase Storage: ${filePath}`);
              const { data: fileData, error: dlErr } = await supabase.storage
                .from('media')
                .download(filePath);
              if (dlErr) throw new Error('Storage: ' + dlErr.message);
              buffer = Buffer.from(await fileData.arrayBuffer());
            } else {
              console.log(`[bulk] Via fetch: ${mediaUrl}`);
              const resp = await fetch(mediaUrl);
              if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
              buffer = Buffer.from(await resp.arrayBuffer());
            }

            media = {
              buffer,
              mimetype: mediaMimetype || 'application/octet-stream',
              filename: mediaFilename || 'arquivo',
              caption: message || ''
            };
            console.log(`[bulk] ✅ Mídia pronta: ${media.filename} | ${media.mimetype} | ${buffer.length} bytes`);
          } catch (e) {
            console.error('[bulk] ❌ Erro ao baixar mídia:', e.message);
          }
        }

        for (let i = 0; i < phones.length; i++) {
          const p = phones[i];
          const session = effectiveDualChip
            ? selectedSessions[sessionIdx % selectedSessions.length]
            : selectedSessions[0];
          if (effectiveDualChip) sessionIdx++;

          try {
            const msgText = (p.text || message)
              .replace(/\{nome\}/gi, p.name || '')
              .replace(/\{name\}/gi, p.name || '')
              .replace(/\{numero\}/gi, p.phone || '');
            const sendResult = await wpp.sendMessage(session.key, p.phone, msgText, media);
            updatedItems[i] = { ...updatedItems[i], status: 'sent', sentAt: new Date().toISOString(), sentVia: `slot${session.slot}`, whatsappMessageId: sendResult.messageId || null, sentFrom: sendResult.from || session.phone || null };
            sent++;
            console.log(`[bulk] ✅ ${i+1}/${phones.length} → ${p.phone} via ${session.key}`);
          } catch (e) {
            updatedItems[i] = { ...updatedItems[i], status: 'failed', error: e.message };
            failed++;
            console.error(`[bulk] ❌ ${i+1}/${phones.length} → ${p.phone}: ${e.message}`);
          }
          // Atualiza progresso no banco
          await supabase.from('dispatches')
            .update({ sent, failed, items: updatedItems })
            .eq('id', dispatch.id);
          // Delay entre envios (exceto no último)
          if (i < phones.length - 1) {
            await new Promise(r => setTimeout(r, delayMs));
            if (pause > 0 && (i + 1) % pause === 0) {
              console.log(`[bulk] ⏸️ Pausa de ${pauseDuration}min após ${i+1} envios`);
              await new Promise(r => setTimeout(r, pauseMs));
            }
          }
        }
        await supabase.from('dispatches').update({
          sent, failed, status: 'completed', items: updatedItems,
          completed_at: new Date().toISOString()
        }).eq('id', dispatch.id);
        console.log(`[bulk] Concluído: ${sent} enviados, ${failed} falhas${dualChip ? ` (modo 2 chips, ${connectedSessions.length} sessões)` : ''}`);
      } // end else baileys
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

const ADMIN_USER_BASE_FIELDS = 'id, name, email, role, created_at';
const ADMIN_USER_FULL_FIELDS = `${ADMIN_USER_BASE_FIELDS}, plan, plan_expires_at, stripe_customer_id`;

function normalizeAdminUser(user) {
  return {
    ...user,
    plan: user.plan || 'free',
    plan_expires_at: user.plan_expires_at || null,
    stripe_customer_id: user.stripe_customer_id || null,
  };
}

function isMissingOptionalUserColumn(error) {
  return Boolean(error?.message && /plan|plan_expires_at|stripe_customer_id/i.test(error.message));
}

async function adminUsersQuery({ limit, userId } = {}) {
  let query = supabase.from('users').select(ADMIN_USER_FULL_FIELDS);
  if (userId) query = query.eq('id', userId).single();
  else {
    query = query.order('created_at', { ascending: false });
    if (limit) query = query.limit(limit);
  }

  let { data, error } = await query;
  if (error && isMissingOptionalUserColumn(error)) {
    let fallback = supabase.from('users').select(ADMIN_USER_BASE_FIELDS);
    if (userId) fallback = fallback.eq('id', userId).single();
    else {
      fallback = fallback.order('created_at', { ascending: false });
      if (limit) fallback = fallback.limit(limit);
    }
    ({ data, error } = await fallback);
  }
  if (error?.code === 'PGRST116') return null;
  if (error) throw error;

  return Array.isArray(data)
    ? data.map(normalizeAdminUser)
    : normalizeAdminUser(data);
}

async function adminCount(table, applyFilter) {
  let query = supabase.from(table).select('id', { count: 'exact', head: true });
  if (applyFilter) query = applyFilter(query);
  const { count, error } = await query;
  if (error) {
    console.warn(`[admin] count ${table}:`, error.message);
    return 0;
  }
  return count || 0;
}

async function adminSum(table, column, applyFilter) {
  let query = supabase.from(table).select(column);
  if (applyFilter) query = applyFilter(query);
  const { data, error } = await query;
  if (error) {
    console.warn(`[admin] sum ${table}.${column}:`, error.message);
    return 0;
  }
  return (data || []).reduce((total, row) => total + (Number(row[column]) || 0), 0);
}

// Stats gerais do sistema
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  try {
    const [totalUsers, totalLeads, totalDispatches, users, totalSent] = await Promise.all([
      adminCount('users'),
      adminCount('leads'),
      adminCount('dispatches'),
      adminUsersQuery({ limit: 5 }),
      adminSum('dispatches', 'sent'),
    ]);

    res.json({
      totalUsers,
      totalLeads,
      totalDispatches,
      totalSent,
      proUsers: users.filter(u => u.plan === 'pro').length,
      recentUsers: users
    });
  } catch (e) {
    console.error('[admin/stats]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Lista todos os usuários com stats
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const users = await adminUsersQuery();

    // Busca stats por usuário
    const enriched = await Promise.all(users.map(async (u) => {
      const [leads, dispatches, lists, totalSent] = await Promise.all([
        adminCount('leads', q => q.eq('user_id', u.id)),
        adminCount('dispatches', q => q.eq('user_id', u.id)),
        adminCount('contact_lists', q => q.eq('user_id', u.id)),
        adminSum('dispatches', 'sent', q => q.eq('user_id', u.id))
      ]);
      return { ...u, stats: { leads, dispatches, lists, totalSent } };
    }));

    res.json(enriched);
  } catch (e) {
    console.error('[admin/users]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Busca usuário específico com histórico completo
app.get('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const user = await adminUsersQuery({ userId: req.params.id });
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

    // Salva a lista normalmente
    const { data, error } = await supabase.from('contact_lists').insert({
      name,
      contacts,
      total: contacts.length,
      user_id: req.user.id
    }).select().single();
    if (error) throw error;

    // Sincroniza contatos da lista como leads (ignora duplicatas por telefone)
    try {
      // Busca telefones que já existem para esse usuário (evita duplicatas)
      const phones = contacts.map(c => (c.NUMERO || c.phone || c.telefone || c.número || c.numero || '').toString().replace(/\D/g, '')).filter(Boolean);

      const { data: existing } = await supabase
        .from('leads')
        .select('phone')
        .eq('user_id', req.user.id)
        .in('phone', phones);

      const existingPhones = new Set((existing || []).map(l => l.phone));

      const newLeads = contacts
        .map(c => {
          const phone = (c.NUMERO || c.phone || c.telefone || c.número || c.numero || '').toString().replace(/\D/g, '');
          const name = c.NOME || c.name || c.nome || c.Name || c.Nome || phone;
          return { phone, name };
        })
        .filter(c => c.phone && !existingPhones.has(c.phone))
        .map(c => ({
          name: c.name,
          phone: c.phone,
          source: 'import',
          status: 'new',
          interest: '',
          user_id: req.user.id,
        }));

      if (newLeads.length > 0) {
        // Insere em lotes de 500 para não estourar o limite do Supabase
        const BATCH = 500;
        for (let i = 0; i < newLeads.length; i += BATCH) {
          await supabase.from('leads').insert(newLeads.slice(i, i + BATCH));
        }
      }

      res.json({ ...data, leads_synced: newLeads.length });
    } catch (syncErr) {
      // Falha na sincronização não deve derrubar a criação da lista
      console.error('Erro ao sincronizar leads:', syncErr.message);
      res.json({ ...data, leads_synced: 0, sync_warning: syncErr.message });
    }
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

// Sincronizar todas as listas existentes como leads (retroativo)
app.post('/api/lists/sync-all', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Busca todas as listas do usuário
    const { data: lists, error: listErr } = await supabase
      .from('contact_lists')
      .select('id, name, contacts')
      .eq('user_id', userId);
    if (listErr) throw listErr;

    // Busca todos os telefones já existentes como lead
    const { data: existingLeads } = await supabase
      .from('leads')
      .select('phone')
      .eq('user_id', userId);
    const existingPhones = new Set((existingLeads || []).map(l => l.phone));

    let totalSynced = 0;

    for (const list of (lists || [])) {
      const contacts = Array.isArray(list.contacts) ? list.contacts : [];
      const newLeads = contacts
        .map(c => {
          const phone = (c.NUMERO || c.phone || c.telefone || c.número || c.numero || '').toString().replace(/\D/g, '');
          const name = c.NOME || c.name || c.nome || c.Name || c.Nome || phone;
          return { phone, name };
        })
        .filter(c => c.phone && !existingPhones.has(c.phone))
        .map(c => {
          existingPhones.add(c.phone); // evita duplicata entre listas
          return {
            name: c.name,
            phone: c.phone,
            source: 'import',
            status: 'new',
            interest: '',
            user_id: userId,
          };
        });

      const BATCH = 500;
      for (let i = 0; i < newLeads.length; i += BATCH) {
        await supabase.from('leads').insert(newLeads.slice(i, i + BATCH));
      }
      totalSynced += newLeads.length;
    }

    res.json({ success: true, lists_processed: (lists || []).length, leads_synced: totalSynced });
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

cron.schedule('*/3 * * * *', async () => {
  try {
    const now = new Date().toISOString();

    // Lock atômico com timeout — evita travar quando Supabase está lento
    const cronPromise = supabase
      .from('dispatches')
      .update({ status: 'sending', processing_started_at: now })
      .eq('status', 'scheduled')
      .lte('scheduled_at', now)
      .select();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('cron timeout')), 8000)
    );

    let pending, error;
    try {
      const result = await Promise.race([cronPromise, timeoutPromise]);
      pending = result.data;
      error = result.error;
    } catch (timeoutErr) {
      return; // silencia timeout do cron
    }

    if (error) { console.error('[cron] Lock error:', error.message); return; }
    if (!pending?.length) return;

    console.log(`[cron] ${pending.length} disparos agendados para executar`);

    for (const dispatch of pending) {
      const cronSessions = getConnectedSessions(dispatch.user_id);
      if (cronSessions.length > 0) {
        console.log(`[cron] Executando disparo real ${dispatch.id} (${cronSessions.length} sessão(ões))`);
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
