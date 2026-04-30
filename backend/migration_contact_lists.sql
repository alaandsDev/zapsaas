-- ============================================================
-- Migração: Criar tabela contact_lists
-- Execute no Supabase > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS contact_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contacts JSONB NOT NULL DEFAULT '[]',
  total INT DEFAULT 0,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_lists_user ON contact_lists(user_id);

ALTER TABLE contact_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_contact_lists" ON contact_lists 
  FOR ALL TO service_role USING (true) WITH CHECK (true);
