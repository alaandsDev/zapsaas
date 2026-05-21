-- ============================================================
-- Wayvo — Tabela de captação "Consultar Preço"
-- Execute no Supabase > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS price_leads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          TEXT NOT NULL,
  whatsapp      TEXT NOT NULL,
  email         TEXT NOT NULL,
  disparos_mensais TEXT,          -- ex: "1001_5000"
  usa_api_meta  BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para facilitar ordenação no painel
CREATE INDEX IF NOT EXISTS idx_price_leads_created
  ON price_leads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_price_leads_email
  ON price_leads(email);

-- Desabilita RLS (tabela administrativa, sem acesso pelo frontend dos clientes)
ALTER TABLE price_leads DISABLE ROW LEVEL SECURITY;
