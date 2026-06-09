-- ============================================================
-- WAYVO — YCloud: limite de números oficiais por cliente + roteamento
-- Execute no Supabase > SQL Editor
-- ============================================================

-- Limite de números oficiais por conta (base = 1; suba ao vender adicional)
ALTER TABLE users ADD COLUMN IF NOT EXISTS official_numbers_limit INTEGER DEFAULT 1;

-- Em qual número oficial a conversa entrou (para responder pelo número certo)
ALTER TABLE chats ADD COLUMN IF NOT EXISTS via_number TEXT;
