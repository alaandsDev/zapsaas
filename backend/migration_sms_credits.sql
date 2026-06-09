-- ============================================================
-- WAYVO — SMS: créditos base (resetam) + comprados (não resetam)
-- Execute no Supabase > SQL Editor
-- ============================================================

-- Base: recarregado para 1000 a cada renovação (não acumula)
ALTER TABLE users ADD COLUMN IF NOT EXISTS sms_credits_base INT NOT NULL DEFAULT 0;
-- Pago: pacotes comprados, nunca resetam
ALTER TABLE users ADD COLUMN IF NOT EXISTS sms_credits_paid INT NOT NULL DEFAULT 0;
-- Quando a base foi recarregada pela última vez
ALTER TABLE users ADD COLUMN IF NOT EXISTS sms_base_reset_at TIMESTAMPTZ;

-- Backfill: saldo antigo vira "pago" (não reseta); todos ganham base 1000
UPDATE users SET sms_credits_paid = sms_credits_paid + COALESCE(sms_credits, 0)
  WHERE COALESCE(sms_credits, 0) > 0;
UPDATE users SET sms_credits_base = 1000, sms_base_reset_at = NOW()
  WHERE sms_base_reset_at IS NULL;

-- Consome base primeiro, depois pago. Retorna saldo total restante; -1 se insuficiente.
CREATE OR REPLACE FUNCTION consume_sms_credits(p_user_id UUID, p_amount INT)
RETURNS INT AS $$
DECLARE v_base INT; v_paid INT; v_from_base INT;
BEGIN
  SELECT sms_credits_base, sms_credits_paid INTO v_base, v_paid
    FROM users WHERE id = p_user_id FOR UPDATE;
  IF (COALESCE(v_base,0) + COALESCE(v_paid,0)) < p_amount THEN
    RETURN -1;
  END IF;
  v_from_base := LEAST(COALESCE(v_base,0), p_amount);
  UPDATE users SET
    sms_credits_base = COALESCE(v_base,0) - v_from_base,
    sms_credits_paid = COALESCE(v_paid,0) - (p_amount - v_from_base)
  WHERE id = p_user_id;
  RETURN (COALESCE(v_base,0) - v_from_base) + (COALESCE(v_paid,0) - (p_amount - v_from_base));
END;
$$ LANGUAGE plpgsql;

-- Adiciona créditos pagos (após compra confirmada)
CREATE OR REPLACE FUNCTION add_paid_sms_credits(p_user_id UUID, p_amount INT)
RETURNS VOID AS $$
BEGIN
  UPDATE users SET sms_credits_paid = COALESCE(sms_credits_paid,0) + p_amount WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Recarrega a base para um valor fixo (renovação / cron mensal)
CREATE OR REPLACE FUNCTION reset_sms_base(p_user_id UUID, p_amount INT)
RETURNS VOID AS $$
BEGIN
  UPDATE users SET sms_credits_base = p_amount, sms_base_reset_at = NOW() WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;
