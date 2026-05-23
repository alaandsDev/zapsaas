-- ============================================================
-- Wayvo — Multi-usuário workspace
-- Execute no Supabase > SQL Editor
-- ============================================================

-- 1. Coluna que vincula um agente ao workspace do dono
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS workspace_owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS workspace_role TEXT DEFAULT NULL; -- 'admin' | 'agent'

-- 2. Tabela de convites pendentes
CREATE TABLE IF NOT EXISTS workspace_invites (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'agent',   -- 'admin' | 'agent'
  token         TEXT NOT NULL UNIQUE,            -- UUID aleatório enviado no email
  status        TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'accepted' | 'expired'
  invited_at    TIMESTAMPTZ DEFAULT NOW(),
  accepted_at   TIMESTAMPTZ DEFAULT NULL,
  expires_at    TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS idx_workspace_invites_token
  ON workspace_invites(token);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_owner
  ON workspace_invites(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_users_workspace
  ON users(workspace_owner_id) WHERE workspace_owner_id IS NOT NULL;
