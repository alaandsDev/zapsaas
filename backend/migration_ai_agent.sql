-- Execute no Supabase > SQL Editor
--
-- Agente de IA (Pro): usuário treina com instruções + perguntas frequentes,
-- e o agente passa a responder sozinho no WhatsApp.

CREATE TABLE IF NOT EXISTS ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  instructions TEXT DEFAULT '',
  faqs JSONB NOT NULL DEFAULT '[]', -- [{ question: string, answer: string }]
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_agents_user ON ai_agents(user_id);

GRANT ALL ON ai_agents TO service_role;
