-- ============================================================
-- ZapFlow — Módulo de Vendas / Receita (Fase 1)
-- Execute no Supabase > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  title TEXT DEFAULT '',
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'won',      -- won | pending | lost
  source TEXT NOT NULL DEFAULT 'manual',   -- manual | campaign | flow | integration
  dispatch_id UUID,
  workflow_id UUID,
  note TEXT DEFAULT '',
  closed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_user_closed ON sales(user_id, closed_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_user_status ON sales(user_id, status);
CREATE INDEX IF NOT EXISTS idx_sales_lead ON sales(lead_id);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_sales" ON sales
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
