-- Respostas rápidas (quick replies) — digitando "/" no chat
CREATE TABLE IF NOT EXISTS quick_replies (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shortcut    TEXT         NOT NULL,
  text        TEXT         NOT NULL,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quick_replies_user_id ON quick_replies(user_id);

ALTER TABLE quick_replies ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'quick_replies' AND policyname = 'service_role_quick_replies'
  ) THEN
    CREATE POLICY "service_role_quick_replies" ON quick_replies
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;
