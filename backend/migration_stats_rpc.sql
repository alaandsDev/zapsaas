-- ============================================================
-- RPC para somar mensagens enviadas sem limite de 1000 linhas
-- Execute no Supabase > SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION sum_dispatches_sent(p_user_id UUID)
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(SUM(sent), 0)::BIGINT
  FROM dispatches
  WHERE user_id = p_user_id;
$$;
