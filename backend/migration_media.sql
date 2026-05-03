-- Execute no Supabase > SQL Editor

-- Cria bucket de mídia (se não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  67108864, -- 64 MB
  ARRAY[
    'image/jpeg','image/png','image/gif','image/webp',
    'video/mp4','video/3gpp','video/quicktime','video/avi',
    'audio/mpeg','audio/mp4','audio/ogg','audio/wav','audio/aac','audio/webm',
    'application/pdf','application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip','text/plain','text/csv'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Policy: service_role pode fazer tudo
CREATE POLICY "service_role_media" ON storage.objects
  FOR ALL TO service_role USING (bucket_id = 'media') WITH CHECK (bucket_id = 'media');

-- Policy: acesso público para leitura (URLs públicas funcionam)
CREATE POLICY "public_read_media" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'media');
