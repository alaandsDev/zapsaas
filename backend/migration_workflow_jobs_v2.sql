-- ============================================================
-- Wayvo — Workflow jobs: colunas para crash recovery e debug
-- Execute no Supabase > SQL Editor
-- ============================================================

-- Adiciona colunas de controle de execução (idempotente)
ALTER TABLE workflow_jobs
  ADD COLUMN IF NOT EXISTS started_at  TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS finished_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS error       TEXT        DEFAULT NULL;

-- Atualiza comentário do status para incluir novos valores
-- status: pending | processing | done | failed | skipped

-- Índice para crash recovery: achar jobs travados em 'processing'
CREATE INDEX IF NOT EXISTS idx_wf_jobs_processing
  ON workflow_jobs(status, started_at)
  WHERE status = 'processing';

-- Índice existente (garantia)
CREATE INDEX IF NOT EXISTS idx_wf_jobs_due
  ON workflow_jobs(status, run_at);

-- Limpa jobs muito antigos (> 30 dias) automaticamente via policy
-- (opcional — ajuda a manter a tabela enxuta em produção)
-- CREATE POLICY ... (configure via Supabase scheduled jobs se desejar)
