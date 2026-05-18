-- ============================================================
-- Wayvo — Multi-fluxo: ativar/desativar + fluxo de entrada
-- Execute no Supabase > SQL Editor
-- ============================================================

ALTER TABLE workflows ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS is_entry BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_workflows_user_entry ON workflows(user_id, is_entry);
