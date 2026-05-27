-- Adiciona updated_at na tabela dispatches com trigger de atualização automática
ALTER TABLE dispatches
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Preenche registros existentes
UPDATE dispatches SET updated_at = created_at WHERE updated_at IS NULL;

-- Trigger para atualizar automaticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS dispatches_updated_at ON dispatches;
CREATE TRIGGER dispatches_updated_at
  BEFORE UPDATE ON dispatches
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
