-- Adiciona coluna status em price_leads
ALTER TABLE price_leads
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pendente'
  CHECK (status IN ('pendente', 'em_contato', 'convertido'));
