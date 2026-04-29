-- Execute no Supabase > SQL Editor

-- Adiciona colunas de plano e Stripe na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Adiciona status 'scheduled' nos dispatches (já existe como TEXT, só documentando)
-- Status possíveis: pending, scheduled, sending, completed, failed

-- Index para cron de agendados
CREATE INDEX IF NOT EXISTS idx_dispatches_scheduled ON dispatches(status, scheduled_at)
  WHERE status = 'scheduled';

-- Garante acesso service_role
GRANT ALL ON users TO service_role;
GRANT ALL ON dispatches TO service_role;
