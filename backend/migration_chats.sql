-- ============================================================
-- Migration: Conversas (WhatsApp Web mirror) — chats + chat_messages
-- ============================================================

CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_slot INT NOT NULL DEFAULT 1,
  phone TEXT NOT NULL,                    -- só dígitos (5511...)
  name TEXT,                              -- pushName mais recente
  is_group BOOLEAN NOT NULL DEFAULT false,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  unread INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, session_slot, phone)
);
CREATE INDEX IF NOT EXISTS idx_chats_user_slot ON chats(user_id, session_slot);
CREATE INDEX IF NOT EXISTS idx_chats_last ON chats(user_id, session_slot, last_message_at DESC);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  wa_id TEXT,                             -- key.id do Baileys (idempotência)
  direction TEXT NOT NULL,                -- 'in' | 'out'
  type TEXT NOT NULL DEFAULT 'text',      -- text|image|audio|video|document|sticker|other
  text TEXT,
  caption TEXT,
  media_url TEXT,
  mime_type TEXT,
  status TEXT,                            -- sent|delivered|read|failed
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chat_id, wa_id)
);
CREATE INDEX IF NOT EXISTS idx_chat_msgs_chat_ts ON chat_messages(chat_id, timestamp ASC);

ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_chats" ON chats FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_chat_msgs" ON chat_messages FOR ALL TO service_role USING (true) WITH CHECK (true);
