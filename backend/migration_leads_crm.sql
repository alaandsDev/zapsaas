-- ============================================================
-- ZapFlow — Evolução CRM dos Leads
-- Execute no Supabase > SQL Editor
-- ============================================================

ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMPTZ;

-- Backfill: última interação inicial = updated_at ou created_at
UPDATE leads
SET last_interaction_at = COALESCE(updated_at, created_at)
WHERE last_interaction_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_leads_last_interaction
  ON leads(user_id, last_interaction_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_phone
  ON leads(user_id, phone);
