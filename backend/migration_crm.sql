-- ============================================================
-- ZapFlow — CRM inbox (mensagens + threads)
-- Execute no Supabase > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS wa_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  name TEXT DEFAULT '',
  direction TEXT NOT NULL,         -- 'in' | 'out'
  body TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wa_messages_user_phone
  ON wa_messages(user_id, phone, created_at);

CREATE TABLE IF NOT EXISTS crm_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  name TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  note TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',   -- open | pending | closed
  assignee TEXT DEFAULT '',
  last_body TEXT DEFAULT '',
  last_at TIMESTAMPTZ DEFAULT NOW(),
  unread INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_crm_threads_user_last
  ON crm_threads(user_id, last_at DESC);

ALTER TABLE wa_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_wa_messages" ON wa_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_crm_threads" ON crm_threads
  FOR ALL TO service_role USING (true) WITH CHECK (true);
