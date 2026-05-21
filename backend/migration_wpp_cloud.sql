-- ============================================================
-- Migration: WhatsApp Cloud API (Meta direto)
-- ============================================================

CREATE TABLE IF NOT EXISTS whatsapp_cloud_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  phone_number_id TEXT NOT NULL,
  business_account_id TEXT,
  access_token TEXT NOT NULL,         -- permanente do system user
  webhook_verify_token TEXT NOT NULL, -- string custom pro Meta validar
  app_secret TEXT,                    -- pra validar assinatura do webhook (HMAC)
  display_phone TEXT,                 -- número formatado (ex: +5511...)
  verified_name TEXT,                 -- nome verificado na Meta
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Templates HSM (mensagens de marketing pré-aprovadas pela Meta)
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  meta_template_id TEXT,              -- id retornado pela Meta
  name TEXT NOT NULL,                 -- nome único na conta (ex: 'oferta_quinta')
  language TEXT NOT NULL DEFAULT 'pt_BR',
  category TEXT NOT NULL,             -- MARKETING|UTILITY|AUTHENTICATION
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING|APPROVED|REJECTED|PAUSED
  components JSONB NOT NULL,          -- estrutura header/body/footer/buttons
  rejected_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wpp_templates_user ON whatsapp_templates(user_id);

-- Disparos via Cloud API (separado do baileys atual)
CREATE TABLE IF NOT EXISTS cloud_dispatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  template_name TEXT,
  total INT NOT NULL DEFAULT 0,
  sent INT NOT NULL DEFAULT 0,
  delivered INT NOT NULL DEFAULT 0,
  read INT NOT NULL DEFAULT 0,
  failed INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  items JSONB NOT NULL DEFAULT '[]',  -- [{phone, name, vars, wamid, status, error}]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_cloud_disp_user ON cloud_dispatches(user_id, created_at DESC);

-- Mapeia wamid -> dispatch pra processar callbacks de status
CREATE TABLE IF NOT EXISTS cloud_message_status (
  wamid TEXT PRIMARY KEY,
  dispatch_id UUID REFERENCES cloud_dispatches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phone TEXT,
  status TEXT,                    -- sent|delivered|read|failed
  error TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE whatsapp_cloud_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloud_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloud_message_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_wpp_cloud_configs" ON whatsapp_cloud_configs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_wpp_templates" ON whatsapp_templates FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_cloud_dispatches" ON cloud_dispatches FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_cloud_msg_status" ON cloud_message_status FOR ALL TO service_role USING (true) WITH CHECK (true);
