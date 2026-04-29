-- Execute este SQL no Supabase > SQL Editor caso o login retorne 401

-- Desabilita RLS nas tabelas principais (service_role já bypassa, mas por segurança)
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Garante que service_role tem acesso total
GRANT ALL ON sessions TO service_role;
GRANT ALL ON users TO service_role;
GRANT ALL ON leads TO service_role;
GRANT ALL ON messages TO service_role;
GRANT ALL ON dispatches TO service_role;
GRANT ALL ON chatbot_config TO service_role;

-- Verifica sessões existentes
SELECT token, user_id, expires_at FROM sessions ORDER BY created_at DESC LIMIT 5;
