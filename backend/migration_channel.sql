-- ============================================================
-- Fix: Adiciona coluna 'channel' na tabela dispatches
-- Execute no Supabase > SQL Editor
-- ============================================================

-- Adiciona coluna channel (baileys | cloud_api | simulated)
ALTER TABLE dispatches ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'baileys';

-- Adiciona completed_at se não existir
ALTER TABLE dispatches ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Adiciona processing_started_at se não existir (usado pelo cron lock)
ALTER TABLE dispatches ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ;

-- Atualiza registros antigos
UPDATE dispatches SET channel = 'baileys' WHERE channel IS NULL;

-- Índice para filtrar por canal
CREATE INDEX IF NOT EXISTS idx_dispatches_channel ON dispatches(user_id, channel);

SELECT 'channel column adicionada com sucesso!' as resultado;
