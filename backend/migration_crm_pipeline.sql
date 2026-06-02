-- ============================================================
-- Wayvo — CRM Pipeline (Kanban)
-- Execute no Supabase > SQL Editor
-- ============================================================

-- Tabela de colunas do pipeline (criadas pelo usuário)
CREATE TABLE IF NOT EXISTS crm_columns (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  color       TEXT DEFAULT '#00FFAE',
  position    INTEGER NOT NULL DEFAULT 0,
  is_default  BOOLEAN DEFAULT FALSE, -- coluna "Novo Lead" não pode ser deletada
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_columns_user
  ON crm_columns(user_id, position);

-- Adiciona coluna pipeline_column_id na tabela leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pipeline_column_id UUID REFERENCES crm_columns(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pipeline_position  INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_leads_pipeline
  ON leads(user_id, pipeline_column_id, pipeline_position);

-- RLS
ALTER TABLE crm_columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_crm_columns" ON crm_columns
  FOR ALL USING (auth.uid() = user_id);
