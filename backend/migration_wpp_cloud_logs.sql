-- Logs de eventos da integração Meta por tenant
CREATE TABLE IF NOT EXISTS wpp_cloud_logs (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action      text        NOT NULL,  -- 'sync' | 'template_created' | 'template_rejected' | 'webhook_validated' | 'token_updated' | 'test_sent'
  result      text        NOT NULL DEFAULT 'ok',  -- 'ok' | 'error'
  details     jsonb,
  error_msg   text,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wpp_cloud_logs_user_created_idx
  ON wpp_cloud_logs(user_id, created_at DESC);

-- RLS: usuário só vê seus próprios logs
ALTER TABLE wpp_cloud_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_logs" ON wpp_cloud_logs
  FOR ALL USING (user_id = auth.uid());
