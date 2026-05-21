-- ============================================================
-- Migration: SMS via Zenvia (créditos pré-pagos)
-- ============================================================

-- Saldo de SMS por usuário
ALTER TABLE users ADD COLUMN IF NOT EXISTS sms_credits INT NOT NULL DEFAULT 0;

-- Histórico de compras de pacotes
CREATE TABLE IF NOT EXISTS sms_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL,           -- 'sms_500' | 'sms_1000'
  amount_cents INT NOT NULL,          -- preço pago em centavos
  credits INT NOT NULL,               -- quantos SMS creditados
  stripe_session_id TEXT UNIQUE,      -- idempotência do webhook
  status TEXT NOT NULL DEFAULT 'pending', -- pending|paid|failed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_sms_purchases_user ON sms_purchases(user_id);

-- Histórico de disparos SMS
CREATE TABLE IF NOT EXISTS sms_dispatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  message TEXT NOT NULL,
  total INT NOT NULL DEFAULT 0,
  sent INT NOT NULL DEFAULT 0,
  failed INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending|sending|completed|failed
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_sms_dispatches_user ON sms_dispatches(user_id, created_at DESC);

ALTER TABLE sms_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_dispatches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_sms_purchases" ON sms_purchases FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_sms_dispatches" ON sms_dispatches FOR ALL TO service_role USING (true) WITH CHECK (true);
