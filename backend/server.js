const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, '../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const DISPATCHES_FILE = path.join(DATA_DIR, 'dispatches.json');
const CHATBOT_FILE = path.join(DATA_DIR, 'chatbot.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// Ensure data dir and files exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function initFile(filePath, defaultData) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
}

initFile(USERS_FILE, [
  { id: '1', name: 'Admin', email: 'admin@demo.com', password: hash('demo123'), role: 'admin', createdAt: new Date().toISOString() }
]);
initFile(LEADS_FILE, []);
initFile(MESSAGES_FILE, []);
initFile(DISPATCHES_FILE, []);
initFile(SESSIONS_FILE, {});
initFile(CHATBOT_FILE, {
  menus: {
    main: {
      text: '👋 Olá! Seja bem-vindo!\n\nComo posso te ajudar?\n\n1️⃣ Conhecer nossos produtos\n2️⃣ Suporte técnico\n3️⃣ Falar com atendente\n4️⃣ Horário de funcionamento',
      options: {
        '1': 'products',
        '2': 'support',
        '3': 'human',
        '4': 'hours'
      }
    },
    products: {
      text: '🛍️ Nossos produtos:\n\n• Plano Básico - R$ 97/mês\n• Plano Pro - R$ 197/mês\n• Plano Enterprise - R$ 397/mês\n\nDigite o número para saber mais:\n1️⃣ Plano Básico\n2️⃣ Plano Pro\n3️⃣ Plano Enterprise\n0️⃣ Voltar ao menu',
      options: {
        '1': 'basic',
        '2': 'pro',
        '3': 'enterprise',
        '0': 'main'
      }
    },
    support: {
      text: '🔧 Suporte Técnico\n\nEnvie sua dúvida ou problema e nossa equipe responderá em breve!\n\nOu acesse nossa central: suporte@empresa.com\n\n0️⃣ Voltar ao menu',
      options: { '0': 'main' }
    },
    human: {
      text: '👤 Transferindo para um atendente humano...\n\nAguarde um momento, em breve alguém irá te atender!\n\n0️⃣ Voltar ao menu',
      options: { '0': 'main' }
    },
    hours: {
      text: '🕐 Horário de Funcionamento:\n\nSegunda a Sexta: 08h às 18h\nSábado: 09h às 13h\nDomingo: Fechado\n\n0️⃣ Voltar ao menu',
      options: { '0': 'main' }
    },
    basic: {
      text: '📦 Plano Básico - R$ 97/mês\n\n✅ Chatbot simples\n✅ Até 500 contatos\n✅ 1.000 mensagens/mês\n✅ Suporte por email\n\nInteresse? Digite SIM para solicitar contato!\n\n0️⃣ Voltar ao menu',
      options: { '0': 'products', 'SIM': 'capture_lead', 'sim': 'capture_lead' }
    },
    pro: {
      text: '🚀 Plano Pro - R$ 197/mês\n\n✅ Chatbot avançado\n✅ Até 2.000 contatos\n✅ 10.000 mensagens/mês\n✅ Disparos em massa\n✅ Suporte prioritário\n\nInteresse? Digite SIM para solicitar contato!\n\n0️⃣ Voltar ao menu',
      options: { '0': 'products', 'SIM': 'capture_lead', 'sim': 'capture_lead' }
    },
    enterprise: {
      text: '💎 Plano Enterprise - R$ 397/mês\n\n✅ Recursos ilimitados\n✅ Contatos ilimitados\n✅ API dedicada\n✅ Suporte 24/7\n✅ Onboarding personalizado\n\nInteresse? Digite SIM para solicitar contato!\n\n0️⃣ Voltar ao menu',
      options: { '0': 'products', 'SIM': 'capture_lead', 'sim': 'capture_lead' }
    },
    capture_lead: {
      text: '📋 Ótimo! Para entrarmos em contato, preciso de algumas informações.\n\nQual é o seu nome?',
      options: {},
      action: 'collect_name'
    }
  },
  keywords: {
    'preço': 'products',
    'valor': 'products',
    'plano': 'products',
    'ajuda': 'support',
    'problema': 'support',
    'horario': 'hours',
    'horário': 'hours',
    'atendente': 'human',
    'humano': 'human',
    'oi': 'main',
    'olá': 'main',
    'ola': 'main',
    'menu': 'main'
  }
});

function hash(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Não autorizado' });
  const sessions = readJSON(SESSIONS_FILE);
  const session = sessions[token];
  if (!session || new Date(session.expiresAt) < new Date()) {
    return res.status(401).json({ error: 'Sessão expirada' });
  }
  req.user = session.user;
  next();
}

// AUTH
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const users = readJSON(USERS_FILE);
  const user = users.find(u => u.email === email && u.password === hash(password));
  if (!user) return res.status(401).json({ error: 'Email ou senha inválidos' });
  const token = crypto.randomBytes(32).toString('hex');
  const sessions = readJSON(SESSIONS_FILE);
  sessions[token] = {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };
  writeJSON(SESSIONS_FILE, sessions);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Campos obrigatórios' });
  const users = readJSON(USERS_FILE);
  if (users.find(u => u.email === email)) return res.status(400).json({ error: 'Email já cadastrado' });
  const newUser = { id: crypto.randomUUID(), name, email, password: hash(password), role: 'user', createdAt: new Date().toISOString() };
  users.push(newUser);
  writeJSON(USERS_FILE, users);
  res.json({ message: 'Usuário criado com sucesso' });
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const sessions = readJSON(SESSIONS_FILE);
  delete sessions[token];
  writeJSON(SESSIONS_FILE, sessions);
  res.json({ message: 'Logout realizado' });
});

// LEADS
app.get('/api/leads', requireAuth, (req, res) => {
  const leads = readJSON(LEADS_FILE);
  res.json(leads);
});

app.post('/api/leads', (req, res) => {
  const { name, phone, interest } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
  const leads = readJSON(LEADS_FILE);
  const newLead = {
    id: crypto.randomUUID(),
    name,
    phone,
    interest: interest || '',
    source: 'form',
    status: 'new',
    createdAt: new Date().toISOString()
  };
  leads.push(newLead);
  writeJSON(LEADS_FILE, leads);
  res.json(newLead);
});

app.delete('/api/leads/:id', requireAuth, (req, res) => {
  let leads = readJSON(LEADS_FILE);
  leads = leads.filter(l => l.id !== req.params.id);
  writeJSON(LEADS_FILE, leads);
  res.json({ message: 'Lead removido' });
});

app.patch('/api/leads/:id', requireAuth, (req, res) => {
  const leads = readJSON(LEADS_FILE);
  const idx = leads.findIndex(l => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Lead não encontrado' });
  leads[idx] = { ...leads[idx], ...req.body };
  writeJSON(LEADS_FILE, leads);
  res.json(leads[idx]);
});

// MESSAGES
app.get('/api/messages', requireAuth, (req, res) => {
  res.json(readJSON(MESSAGES_FILE));
});

app.post('/api/messages', requireAuth, (req, res) => {
  const { title, content, tags } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Título e conteúdo obrigatórios' });
  const messages = readJSON(MESSAGES_FILE);
  const newMsg = {
    id: crypto.randomUUID(),
    title,
    content,
    tags: tags || [],
    createdAt: new Date().toISOString(),
    userId: req.user.id
  };
  messages.push(newMsg);
  writeJSON(MESSAGES_FILE, messages);
  res.json(newMsg);
});

app.delete('/api/messages/:id', requireAuth, (req, res) => {
  let messages = readJSON(MESSAGES_FILE);
  messages = messages.filter(m => m.id !== req.params.id);
  writeJSON(MESSAGES_FILE, messages);
  res.json({ message: 'Mensagem removida' });
});

// DISPATCHES
app.get('/api/dispatches', requireAuth, (req, res) => {
  res.json(readJSON(DISPATCHES_FILE));
});

app.post('/api/dispatches', requireAuth, async (req, res) => {
  const { messageId, contactIds, scheduledAt } = req.body;
  if (!messageId || !contactIds?.length) return res.status(400).json({ error: 'Mensagem e contatos são obrigatórios' });
  const messages = readJSON(MESSAGES_FILE);
  const leads = readJSON(LEADS_FILE);
  const message = messages.find(m => m.id === messageId);
  if (!message) return res.status(404).json({ error: 'Mensagem não encontrada' });
  const dispatches = readJSON(DISPATCHES_FILE);
  const contacts = leads.filter(l => contactIds.includes(l.id));
  const dispatchItems = contacts.map(c => ({
    contactId: c.id,
    contactName: c.name,
    contactPhone: c.phone,
    status: 'pending'
  }));
  const newDispatch = {
    id: crypto.randomUUID(),
    messageId,
    messageTitle: message.title,
    messageContent: message.content,
    total: contacts.length,
    sent: 0,
    failed: 0,
    status: 'pending',
    items: dispatchItems,
    scheduledAt: scheduledAt || null,
    createdAt: new Date().toISOString(),
    userId: req.user.id
  };
  dispatches.push(newDispatch);
  writeJSON(DISPATCHES_FILE, dispatches);

  // Simulate sending asynchronously
  simulateSending(newDispatch.id);
  res.json(newDispatch);
});

function simulateSending(dispatchId) {
  const dispatches = readJSON(DISPATCHES_FILE);
  const dispatch = dispatches.find(d => d.id === dispatchId);
  if (!dispatch) return;
  dispatch.status = 'sending';
  writeJSON(DISPATCHES_FILE, dispatches);

  let idx = 0;
  const interval = setInterval(() => {
    const dispatchesCurrent = readJSON(DISPATCHES_FILE);
    const d = dispatchesCurrent.find(d => d.id === dispatchId);
    if (!d || idx >= d.items.length) {
      clearInterval(interval);
      if (d) {
        d.status = 'completed';
        d.completedAt = new Date().toISOString();
        writeJSON(DISPATCHES_FILE, dispatchesCurrent);
      }
      return;
    }
    const success = Math.random() > 0.1;
    d.items[idx].status = success ? 'sent' : 'failed';
    d.items[idx].sentAt = new Date().toISOString();
    if (success) d.sent++;
    else d.failed++;
    writeJSON(DISPATCHES_FILE, dispatchesCurrent);
    idx++;
  }, 300);
}

// CHATBOT
app.get('/api/chatbot/config', requireAuth, (req, res) => {
  res.json(readJSON(CHATBOT_FILE));
});

app.post('/api/chatbot/message', (req, res) => {
  const { sessionId, message, currentMenu } = req.body;
  const chatbot = readJSON(CHATBOT_FILE);
  const text = (message || '').trim();
  const textLower = text.toLowerCase();

  let session = { menu: currentMenu || 'main', step: null, data: {} };

  // Keyword matching
  let targetMenu = null;
  for (const [keyword, menu] of Object.entries(chatbot.keywords)) {
    if (textLower.includes(keyword)) {
      targetMenu = menu;
      break;
    }
  }

  const menu = chatbot.menus[currentMenu || 'main'];
  let nextMenuKey = menu?.options?.[text] || menu?.options?.[textLower] || targetMenu;

  // Default to main if nothing matched
  if (!nextMenuKey && (!menu?.action)) {
    nextMenuKey = 'main';
  }

  const nextMenu = chatbot.menus[nextMenuKey] || chatbot.menus['main'];
  res.json({
    reply: nextMenu.text,
    nextMenu: nextMenuKey || 'main',
    action: nextMenu.action || null
  });
});

// STATS
app.get('/api/stats', requireAuth, (req, res) => {
  const leads = readJSON(LEADS_FILE);
  const messages = readJSON(MESSAGES_FILE);
  const dispatches = readJSON(DISPATCHES_FILE);
  const totalSent = dispatches.reduce((acc, d) => acc + (d.sent || 0), 0);
  const totalDispatches = dispatches.length;
  res.json({
    leads: leads.length,
    newLeads: leads.filter(l => l.status === 'new').length,
    messages: messages.length,
    dispatches: totalDispatches,
    messagesSent: totalSent,
    lastLeads: leads.slice(-5).reverse()
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`\n🚀 ZapSaaS Backend rodando em http://localhost:${PORT}\n`));
