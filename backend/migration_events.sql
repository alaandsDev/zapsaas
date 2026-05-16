-- ============================================================
-- ZapFlow — Eventos (histórico para relatórios reais)
-- Execute no Supabase > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,              -- lead | message_out | message_in | campaign | automation | conversion
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_user_time
  ON events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_user_type_time
  ON events(user_id, type, created_at DESC);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_events" ON events
  FOR ALL TO service_role USING (true) WITH CHECK (true);
