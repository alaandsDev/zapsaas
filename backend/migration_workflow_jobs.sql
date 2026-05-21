-- ============================================================
-- Wayvo — Delays reais: fila de continuações de workflow
-- Execute no Supabase > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS workflow_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  flow_id UUID,
  phone TEXT NOT NULL,
  name TEXT DEFAULT '',
  resume_node_ids JSONB NOT NULL DEFAULT '[]',
  run_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | done | failed
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wf_jobs_due
  ON workflow_jobs(status, run_at);
