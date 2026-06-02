-- ============================================================
-- WAYVO CRM — Pipeline Kanban Enterprise
-- Execute no Supabase > SQL Editor
-- ============================================================

-- ── 1. Pipeline Stages (etapas por tenant) ──────────────────
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#00FF88',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_user ON pipeline_stages(user_id, position);

-- ── 2. Campos CRM na tabela leads ───────────────────────────
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pipeline_stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS estimated_value DECIMAL(12,2) DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pipeline_position INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_leads_pipeline_stage ON leads(user_id, pipeline_stage_id);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(user_id, score DESC);

-- ── 3. Lead Activities (timeline/histórico) ──────────────────
CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  -- tipos: created, stage_change, note, message_sent, message_received,
  --        campaign_sent, workflow_executed, task_created, task_completed, field_updated
  content TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON lead_activities(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_activities_user ON lead_activities(user_id, created_at DESC);

-- ── 4. Lead Tasks ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lead_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  due_date TIMESTAMPTZ,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_lead ON lead_tasks(lead_id, completed);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_user ON lead_tasks(user_id, due_date);

-- ── 5. RLS ───────────────────────────────────────────────────
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities  ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_tasks        ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pipeline_stages_owner" ON pipeline_stages;
CREATE POLICY "pipeline_stages_owner" ON pipeline_stages
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "lead_activities_owner" ON lead_activities;
CREATE POLICY "lead_activities_owner" ON lead_activities
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "lead_tasks_owner" ON lead_tasks;
CREATE POLICY "lead_tasks_owner" ON lead_tasks
  FOR ALL USING (user_id = auth.uid());

-- ── 6. Backfill last_interaction_at ─────────────────────────
UPDATE leads
SET last_interaction_at = COALESCE(updated_at, created_at)
WHERE last_interaction_at IS NULL;
