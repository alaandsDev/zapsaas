-- Execute no Supabase > SQL Editor
--
-- Pricing v2: o Starter deixa de ser gratuito pra sempre — vira R$97,90/mês
-- com 7 dias de teste (cartão obrigatório pra assinantes NOVOS). O Pro sobe
-- pra R$197,90/mês e ganha o diferencial do Agente de IA treinável.
--
-- Rode isso só DEPOIS de:
--   1. Criar os novos Products/Prices no Stripe (ver guia enviado no chat)
--   2. Configurar STRIPE_PRICE_STARTER e STRIPE_PRICE_PRO nas env vars
--   3. Fazer deploy do backend com as mudanças de PLANS/checkout/webhook

-- Marca quem já passou pelo Stripe (ou foi migrado por aqui) pra nunca
-- receber um trial_period_days novo do lado do Stripe — evita gente
-- acumulando trial atrás de trial.
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_used BOOLEAN DEFAULT false;

-- Migra quem está no antigo plano gratuito (nunca teve assinatura Stripe)
-- pro Starter, com 7 dias de carência SEM precisar inserir cartão agora —
-- o cartão só é pedido quando a carência acabar (fluxo de checkout já
-- cobra na hora nesse caso, sem trial novo, porque a carência JÁ foi o
-- trial dele).
UPDATE users
SET plan = 'starter',
    plan_expires_at = now() + interval '7 days',
    trial_used = true
WHERE (plan IS NULL OR plan = 'free')
  AND stripe_customer_id IS NULL;

GRANT ALL ON users TO service_role;

-- Conferir depois de rodar:
-- SELECT plan, count(*) FROM users GROUP BY plan;
-- SELECT id, email, plan, plan_expires_at, trial_used FROM users WHERE plan = 'starter' LIMIT 20;
