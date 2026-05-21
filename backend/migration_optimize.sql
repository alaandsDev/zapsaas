-- ============================================================
-- Otimização: Índices para reduzir carga no Supabase
-- Execute no Supabase > SQL Editor
-- ============================================================

-- SESSIONS: limpeza e índice para expiração
DELETE FROM sessions WHERE expires_at < NOW();
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- CHATS: índices para queries mais rápidas
CREATE INDEX IF NOT EXISTS idx_chats_user_slot_ts ON chats(user_id, session_slot, last_message_at DESC NULLS LAST);

-- CHAT_MESSAGES: índice para buscar mensagens de um chat
CREATE INDEX IF NOT EXISTS idx_chat_msgs_chat_ts ON chat_messages(chat_id, timestamp ASC);

-- DISPATCHES: índice para histórico por usuário
CREATE INDEX IF NOT EXISTS idx_dispatches_user_ts ON dispatches(user_id, created_at DESC);

-- LEADS: índice para busca
CREATE INDEX IF NOT EXISTS idx_leads_user_ts ON leads(user_id, created_at DESC);

-- CONTACT_LISTS: índice
CREATE INDEX IF NOT EXISTS idx_lists_user ON contact_lists(user_id, created_at DESC);

-- Verificar tamanho das tabelas
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  (SELECT count(*) FROM sessions) AS sessions_count
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================================
-- Limpeza wpp_sessions (tabela mais pesada — 5MB)
-- Remove sessões de usuários que não existem mais
-- ============================================================
DELETE FROM wpp_sessions 
WHERE user_id NOT IN (SELECT id FROM users);

-- Compacta a tabela após deleções
VACUUM ANALYZE wpp_sessions;
VACUUM ANALYZE sessions;
VACUUM ANALYZE dispatches;

-- Verifica tamanho após limpeza
SELECT tablename, pg_size_pretty(pg_total_relation_size('public.'||tablename)) as size
FROM pg_tables WHERE schemaname = 'public'
ORDER BY pg_total_relation_size('public.'||tablename) DESC;
