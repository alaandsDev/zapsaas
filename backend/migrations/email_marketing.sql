-- Colunas de créditos de email na tabela users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_credits_base INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS email_credits_paid INTEGER NOT NULL DEFAULT 0;

-- Tabela de disparos de email
CREATE TABLE IF NOT EXISTS email_dispatches (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        TEXT,
  subject      TEXT,
  total        INTEGER NOT NULL DEFAULT 0,
  sent         INTEGER NOT NULL DEFAULT 0,
  failed       INTEGER NOT NULL DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'pending',
  items        JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_email_dispatches_user ON email_dispatches(user_id);

-- Tabela de compras de créditos de email
CREATE TABLE IF NOT EXISTS email_purchases (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_id         TEXT,
  amount_cents       INTEGER NOT NULL DEFAULT 0,
  credits            INTEGER NOT NULL DEFAULT 0,
  stripe_session_id  TEXT,
  status             TEXT NOT NULL DEFAULT 'pending',
  paid_at            TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Funções RPC para débito/crédito atômico
CREATE OR REPLACE FUNCTION consume_email_credits(p_user_id UUID, p_amount INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql AS $$
DECLARE
  v_base INTEGER; v_paid INTEGER; v_total INTEGER;
BEGIN
  SELECT email_credits_base, email_credits_paid INTO v_base, v_paid
    FROM users WHERE id = p_user_id FOR UPDATE;
  v_total := COALESCE(v_base,0) + COALESCE(v_paid,0);
  IF v_total < p_amount THEN RETURN -1; END IF;
  -- Consome base primeiro
  IF v_base >= p_amount THEN
    UPDATE users SET email_credits_base = email_credits_base - p_amount WHERE id = p_user_id;
  ELSE
    UPDATE users SET email_credits_base = 0,
      email_credits_paid = email_credits_paid - (p_amount - v_base) WHERE id = p_user_id;
  END IF;
  RETURN v_total - p_amount;
END;
$$;

CREATE OR REPLACE FUNCTION add_paid_email_credits(p_user_id UUID, p_amount INTEGER)
RETURNS VOID
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE users SET email_credits_paid = COALESCE(email_credits_paid,0) + p_amount WHERE id = p_user_id;
END;
$$;
