-- Rastreamento de entrega por disparo
-- Adiciona referência direta de cloud_message_status → dispatches (sem FK para manter flexibilidade)
ALTER TABLE cloud_message_status
  ADD COLUMN IF NOT EXISTS parent_dispatch_id UUID REFERENCES dispatches(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_cloud_msg_status_parent_dispatch
  ON cloud_message_status(parent_dispatch_id)
  WHERE parent_dispatch_id IS NOT NULL;

-- Contadores de entrega/leitura na tabela de disparos
ALTER TABLE dispatches
  ADD COLUMN IF NOT EXISTS delivered INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS read INTEGER NOT NULL DEFAULT 0;
