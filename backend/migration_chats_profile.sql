-- Adiciona avatar e refresh tracking
ALTER TABLE chats ADD COLUMN IF NOT EXISTS profile_pic_url TEXT;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS profile_pic_refreshed_at TIMESTAMPTZ;
