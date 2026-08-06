-- ============================================================
-- MIGRATION: 20260805_oficios_storage_rls.sql
-- SIGERD / COMPDEC - Bucket Dedicado 'oficios_legados'
-- Cria o bucket público de armazenamento e define políticas de RLS
-- ============================================================

-- 1. Cria o bucket dedicado 'oficios_legados' no Supabase Storage caso não exista
INSERT INTO storage.buckets (id, name, public) 
SELECT 'oficios_legados', 'oficios_legados', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'oficios_legados'
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Limpeza de políticas anteriores para o bucket 'oficios_legados'
DROP POLICY IF EXISTS "Oficios Legados Insert Public" ON storage.objects;
DROP POLICY IF EXISTS "Oficios Legados Update Public" ON storage.objects;
DROP POLICY IF EXISTS "Oficios Legados Select Public" ON storage.objects;
DROP POLICY IF EXISTS "Oficios Legados Delete Public" ON storage.objects;

-- 3. Permite Upload (Insert) público no bucket 'oficios_legados'
CREATE POLICY "Oficios Legados Insert Public"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'oficios_legados');

-- 4. Permite Atualização/Upsert (Update) no bucket 'oficios_legados'
CREATE POLICY "Oficios Legados Update Public"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'oficios_legados')
WITH CHECK (bucket_id = 'oficios_legados');

-- 5. Permite Leitura Pública (Select) de todos os arquivos no bucket 'oficios_legados'
CREATE POLICY "Oficios Legados Select Public"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'oficios_legados');

-- 6. Permite Exclusão (Delete) caso seja necessário re-upload
CREATE POLICY "Oficios Legados Delete Public"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'oficios_legados');
