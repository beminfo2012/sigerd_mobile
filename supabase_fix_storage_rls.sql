-- Habilita RLS e garante permissões totais para o bucket de fotos no Supabase Storage
-- Execute este script no SQL Editor do seu Dashboard Supabase para resolver o erro "new row violates row-level security policy"

-- 1. Garante que o bucket 'ocorrencias_fotos' existe e é público
INSERT INTO storage.buckets (id, name, public) 
SELECT 'ocorrencias_fotos', 'ocorrencias_fotos', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'ocorrencias_fotos'
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Limpeza de políticas anteriores para evitar conflitos
DROP POLICY IF EXISTS "Fotos Ocorrencias Insert" ON storage.objects;
DROP POLICY IF EXISTS "Fotos Ocorrencias Update" ON storage.objects;
DROP POLICY IF EXISTS "Fotos Ocorrencias Delete" ON storage.objects;
DROP POLICY IF EXISTS "Fotos Ocorrencias Select Public" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;

-- 3. Criar Políticas Específicas para o bucket 'ocorrencias_fotos'

-- Permite Upload (Insert) para usuários autenticados
CREATE POLICY "Fotos Ocorrencias Insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ocorrencias_fotos');

-- Permite Alteração (Update/Upsert) para usuários autenticados
CREATE POLICY "Fotos Ocorrencias Update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'ocorrencias_fotos')
WITH CHECK (bucket_id = 'ocorrencias_fotos');

-- Permite Excluir fotos para usuários autenticados
CREATE POLICY "Fotos Ocorrencias Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'ocorrencias_fotos');

-- Permite que todos vejam as fotos (Select)
CREATE POLICY "Fotos Ocorrencias Select Public"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'ocorrencias_fotos');

-- 4. Garantia extra para a tabela de Ocorrências (RLS Total)
ALTER TABLE IF EXISTS public.ocorrencias_operacionais ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso total autenticados ocorrencias" ON public.ocorrencias_operacionais;
CREATE POLICY "Acesso total autenticados ocorrencias"
ON public.ocorrencias_operacionais
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
