-- ============================================================
-- Migração: Criar usuário ADMINISTRADOR
-- Execute no Supabase > SQL Editor
-- ============================================================

-- Adiciona coluna plan_expires_at e stripe_customer_id se não existirem
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Adiciona coluna processing_started_at em dispatches para o cron lock
ALTER TABLE dispatches ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ;

-- Índices compostos para performance
CREATE INDEX IF NOT EXISTS idx_leads_user_status ON leads(user_id, status);
CREATE INDEX IF NOT EXISTS idx_dispatches_user_status ON dispatches(user_id, status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Cria o usuário administrador
-- Email: admin@zapsaas.com
-- Senha: Qx0rPl4HjHZfLRTolaF9
-- (O bcrypt será aplicado no primeiro login automaticamente)
INSERT INTO users (name, email, password, role, plan)
VALUES (
  'Administrador',
  'admin@zapsaas.com',
  'c8e6686b8a4b45a2e81236f2c2b87dfcbe986b69a7be51d4f5c9c0368ee244a9',
  'admin',
  'pro'
) ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  plan = 'pro',
  password = 'c8e6686b8a4b45a2e81236f2c2b87dfcbe986b69a7be51d4f5c9c0368ee244a9';

-- Limpa sessões expiradas (manutenção)
DELETE FROM sessions WHERE expires_at < NOW();
