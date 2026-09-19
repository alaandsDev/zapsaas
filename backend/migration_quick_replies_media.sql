-- Adiciona suporte a mídia nas respostas rápidas
ALTER TABLE quick_replies
  ADD COLUMN IF NOT EXISTS media_url  TEXT,
  ADD COLUMN IF NOT EXISTS media_type TEXT; -- 'image' | 'audio' | 'document'
