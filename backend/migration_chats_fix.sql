-- ============================================================
-- Fix: Conversas não aparecem — diagnóstico e correção
-- Execute no Supabase > SQL Editor
-- ============================================================

-- 1. Garante que as tabelas existem
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_slot INT NOT NULL DEFAULT 1,
  phone TEXT NOT NULL,
  name TEXT,
  is_group BOOLEAN NOT NULL DEFAULT false,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  unread INT NOT NULL DEFAULT 0,
  profile_pic_url TEXT,
  profile_pic_refreshed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, session_slot, phone)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  wa_id TEXT,
  direction TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text',
  text TEXT,
  caption TEXT,
  media_url TEXT,
  mime_type TEXT,
  status TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chat_id, wa_id)
);

-- 2. Índices
CREATE INDEX IF NOT EXISTS idx_chats_user_slot ON chats(user_id, session_slot);
CREATE INDEX IF NOT EXISTS idx_chats_last ON chats(user_id, session_slot, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_msgs_chat_ts ON chat_messages(chat_id, timestamp ASC);

-- 3. RLS
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_chats" ON chats;
DROP POLICY IF EXISTS "service_role_chat_msgs" ON chat_messages;
CREATE POLICY "service_role_chats" ON chats FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_chat_msgs" ON chat_messages FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 4. Diagnóstico: mostra quantos chats e mensagens existem
SELECT 
  'chats' as tabela, COUNT(*) as total FROM chats
UNION ALL
SELECT 
  'chat_messages' as tabela, COUNT(*) as total FROM chat_messages;
