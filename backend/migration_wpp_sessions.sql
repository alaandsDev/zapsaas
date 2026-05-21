-- Execute no Supabase > SQL Editor
-- Persistência das credenciais WhatsApp (evita perda ao reiniciar Railway)

CREATE TABLE IF NOT EXISTS wpp_sessions (
  session_id TEXT PRIMARY KEY,
  creds      JSONB,
  keys       JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE wpp_sessions DISABLE ROW LEVEL SECURITY;
GRANT ALL ON wpp_sessions TO service_role;

CREATE INDEX IF NOT EXISTS idx_wpp_sessions_updated ON wpp_sessions(updated_at);
