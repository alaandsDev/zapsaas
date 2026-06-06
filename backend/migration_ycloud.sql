-- ============================================================
-- WAYVO — YCloud (BSP oficial): números por tenant
-- Execute no Supabase > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS ycloud_numbers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone       TEXT NOT NULL,            -- número da empresa, só dígitos com DDI (ex: 15559850060)
  waba_id     TEXT,                     -- WhatsApp Business Account ID (opcional)
  label       TEXT,                     -- apelido opcional (ex: "Loja Centro")
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (phone)                        -- um número pertence a um único tenant
);

CREATE INDEX IF NOT EXISTS idx_ycloud_numbers_user  ON ycloud_numbers(user_id);
CREATE INDEX IF NOT EXISTS idx_ycloud_numbers_phone ON ycloud_numbers(phone);

ALTER TABLE ycloud_numbers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ycloud_numbers_owner" ON ycloud_numbers;
CREATE POLICY "ycloud_numbers_owner" ON ycloud_numbers
  FOR ALL USING (user_id = auth.uid());
