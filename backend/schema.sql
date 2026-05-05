-- ============================================================
-- ZapSaaS — Schema Supabase
-- Execute este SQL no Supabase > SQL Editor
-- ============================================================

-- Extensão para UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================
-- USERS
-- ========================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  plan TEXT DEFAULT 'free',
  plan_expires_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin demo (senha: demo123)
INSERT INTO users (id, name, email, password, role)
VALUES (
  gen_random_uuid(),
  'Admin',
  'admin@demo.com',
  encode(digest('demo123', 'sha256'), 'hex'),
  'admin'
) ON CONFLICT (email) DO NOTHING;

-- ========================
-- SESSIONS
-- ========================
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para limpeza de sessões expiradas
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- ========================
-- LEADS
-- ========================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  interest TEXT DEFAULT '',
  source TEXT DEFAULT 'form',
  status TEXT DEFAULT 'new',
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- ========================
-- MESSAGES (templates)
-- ========================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- DISPATCHES
-- ========================
CREATE TABLE IF NOT EXISTS dispatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  message_title TEXT NOT NULL,
  message_content TEXT NOT NULL,
  total INT DEFAULT 0,
  sent INT DEFAULT 0,
  failed INT DEFAULT 0,
  status TEXT DEFAULT 'pending',
  items JSONB DEFAULT '[]',
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispatches_status ON dispatches(status);
CREATE INDEX IF NOT EXISTS idx_dispatches_created_at ON dispatches(created_at DESC);

-- ========================
-- CONTACT LISTS (listas de contatos importados)
-- ========================
CREATE TABLE IF NOT EXISTS contact_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contacts JSONB NOT NULL DEFAULT '[]',
  total INT DEFAULT 0,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_lists_user ON contact_lists(user_id);
ALTER TABLE contact_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_contact_lists" ON contact_lists FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ========================
-- CHATBOT CONFIG
-- ========================
CREATE TABLE IF NOT EXISTS chatbot_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  menus JSONB NOT NULL,
  keywords JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Config padrão global (user_id NULL = padrão do sistema)
INSERT INTO chatbot_config (menus, keywords, user_id)
VALUES (
  '{
    "main": {
      "text": "👋 Olá! Seja bem-vindo!\n\nComo posso te ajudar?\n\n1️⃣ Conhecer nossos produtos\n2️⃣ Suporte técnico\n3️⃣ Falar com atendente\n4️⃣ Horário de funcionamento",
      "options": {"1": "products", "2": "support", "3": "human", "4": "hours"}
    },
    "products": {
      "text": "🛍️ Nossos produtos:\n\n• Plano Básico - R$ 97/mês\n• Plano Pro - R$ 197/mês\n• Plano Enterprise - R$ 397/mês\n\nDigite o número para saber mais:\n1️⃣ Plano Básico\n2️⃣ Plano Pro\n3️⃣ Plano Enterprise\n0️⃣ Voltar ao menu",
      "options": {"1": "basic", "2": "pro", "3": "enterprise", "0": "main"}
    },
    "support": {
      "text": "🔧 Suporte Técnico\n\nEnvie sua dúvida e nossa equipe responderá em breve!\n\nsuporte@empresa.com\n\n0️⃣ Voltar ao menu",
      "options": {"0": "main"}
    },
    "human": {
      "text": "👤 Transferindo para um atendente humano...\n\nAguarde um momento!\n\n0️⃣ Voltar ao menu",
      "options": {"0": "main"}
    },
    "hours": {
      "text": "🕐 Horário de Funcionamento:\n\nSegunda a Sexta: 08h às 18h\nSábado: 09h às 13h\nDomingo: Fechado\n\n0️⃣ Voltar ao menu",
      "options": {"0": "main"}
    },
    "basic": {
      "text": "📦 Plano Básico - R$ 97/mês\n\n✅ Chatbot simples\n✅ Até 500 contatos\n✅ 1.000 mensagens/mês\n✅ Suporte por email\n\nInteresse? Digite SIM!\n\n0️⃣ Voltar ao menu",
      "options": {"0": "products", "SIM": "capture_lead", "sim": "capture_lead"}
    },
    "pro": {
      "text": "🚀 Plano Pro - R$ 197/mês\n\n✅ Chatbot avançado\n✅ Até 2.000 contatos\n✅ 10.000 mensagens/mês\n✅ Disparos em massa\n✅ Suporte prioritário\n\nInteresse? Digite SIM!\n\n0️⃣ Voltar ao menu",
      "options": {"0": "products", "SIM": "capture_lead", "sim": "capture_lead"}
    },
    "enterprise": {
      "text": "💎 Plano Enterprise - R$ 397/mês\n\n✅ Recursos ilimitados\n✅ Contatos ilimitados\n✅ API dedicada\n✅ Suporte 24/7\n\nInteresse? Digite SIM!\n\n0️⃣ Voltar ao menu",
      "options": {"0": "products", "SIM": "capture_lead", "sim": "capture_lead"}
    },
    "capture_lead": {
      "text": "📋 Ótimo! Para entrarmos em contato, preciso de algumas informações.\n\nQual é o seu nome?",
      "options": {},
      "action": "collect_name"
    }
  }',
  '{
    "preço": "products",
    "valor": "products",
    "plano": "products",
    "ajuda": "support",
    "problema": "support",
    "horario": "hours",
    "horário": "hours",
    "atendente": "human",
    "humano": "human",
    "oi": "main",
    "olá": "main",
    "ola": "main",
    "menu": "main"
  }',
  NULL
) ON CONFLICT DO NOTHING;

-- ========================
-- Row Level Security
-- ========================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_config ENABLE ROW LEVEL SECURITY;

-- Service role bypassa RLS (usado pelo backend)
-- Essas policies permitem tudo para service_role
CREATE POLICY "service_role_users" ON users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_sessions" ON sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_leads" ON leads FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_messages" ON messages FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_dispatches" ON dispatches FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_chatbot" ON chatbot_config FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ========================
-- Função auto-update updated_at
-- ========================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
