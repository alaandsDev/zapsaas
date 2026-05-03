-- ============================================================
-- Migration: Automação Inteligente (Flows visuais)
-- ============================================================

CREATE TABLE IF NOT EXISTS flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT false,
  trigger_keywords TEXT[],          -- palavras que disparam o fluxo (vazio = qualquer mensagem)
  graph JSONB NOT NULL DEFAULT '{"nodes":[],"edges":[]}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_flows_user ON flows(user_id);
CREATE INDEX IF NOT EXISTS idx_flows_enabled ON flows(user_id, enabled) WHERE enabled = true;

-- Estado de execução por contato
CREATE TABLE IF NOT EXISTS flow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID REFERENCES flows(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  contact_phone TEXT NOT NULL,
  contact_name TEXT,
  current_node_id TEXT,
  status TEXT NOT NULL DEFAULT 'running', -- running|waiting|completed|failed
  context JSONB NOT NULL DEFAULT '{}',     -- variáveis acumuladas no fluxo
  resume_at TIMESTAMPTZ,                   -- quando deve continuar (delay)
  last_message TEXT,                       -- última msg do contato
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_flow_exec_user_phone ON flow_executions(user_id, contact_phone);
CREATE INDEX IF NOT EXISTS idx_flow_exec_resume ON flow_executions(status, resume_at) WHERE status = 'waiting';

ALTER TABLE flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_flows" ON flows FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_flow_exec" ON flow_executions FOR ALL TO service_role USING (true) WITH CHECK (true);
