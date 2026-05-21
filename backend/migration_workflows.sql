-- ============================================================
-- ZapFlow — Workflows (automações visuais)
-- Execute no Supabase > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Novo fluxo',
  status TEXT NOT NULL DEFAULT 'draft',  -- draft | published
  nodes JSONB NOT NULL DEFAULT '[]',
  edges JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflows_user ON workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_updated ON workflows(updated_at DESC);

ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_workflows" ON workflows
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER update_workflows_updated_at
  BEFORE UPDATE ON workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
