-- ============================================================
-- Wayvo — Choices aguardando resposta do usuário
-- Execute no Supabase > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS workflow_pending_choices (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  phone      TEXT NOT NULL,
  flow_id    UUID,
  session_id TEXT NOT NULL,          -- sessão WhatsApp que enviou
  name       TEXT DEFAULT '',
  -- mapa: texto_normalizado → node_id destino
  -- ex: {"1":"abc","sim":"abc","2":"xyz","não":"xyz"}
  options_map JSONB NOT NULL DEFAULT '{}',
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca rápida por usuario+telefone (choice ativo)
CREATE INDEX IF NOT EXISTS idx_wf_pending_user_phone
  ON workflow_pending_choices(user_id, phone, expires_at);
