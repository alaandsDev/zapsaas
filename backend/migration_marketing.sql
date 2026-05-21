-- ============================================================
-- Migration: Marketing Admin
-- Adiciona telefone do usuário (alvo de campanhas) e tabela de
-- campanhas de marketing disparadas pelo admin.
-- ============================================================

-- 1) phone do usuário (alvo das campanhas admin)
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);
CREATE INDEX IF NOT EXISTS idx_users_plan_expires_at ON users(plan_expires_at);

-- 2) Campanhas de marketing do admin
CREATE TABLE IF NOT EXISTS admin_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  segment JSONB NOT NULL,            -- filtros aplicados
  total INT NOT NULL DEFAULT 0,
  sent INT NOT NULL DEFAULT 0,
  failed INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending|sending|completed|failed
  items JSONB NOT NULL DEFAULT '[]',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_campaigns_created_at ON admin_campaigns(created_at DESC);

ALTER TABLE admin_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_admin_campaigns" ON admin_campaigns
  FOR ALL TO service_role USING (true) WITH CHECK (true);
