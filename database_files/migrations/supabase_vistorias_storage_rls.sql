-- ============================================
-- SIGERD Mobile - Vistorias Storage RLS
-- Habilita o bucket de armazenamento e as políticas de segurança (RLS)
-- ============================================

-- 1. Cria o bucket 'vistorias_fotos' caso não exista e o torna público
INSERT INTO storage.buckets (id, name, public) 
SELECT 'vistorias_fotos', 'vistorias_fotos', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'vistorias_fotos'
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Remove políticas existentes para evitar conflitos na reaplicação
DROP POLICY IF EXISTS "Fotos Vistorias Insert" ON storage.objects;
DROP POLICY IF EXISTS "Fotos Vistorias Update" ON storage.objects;
DROP POLICY IF EXISTS "Fotos Vistorias Delete" ON storage.objects;
DROP POLICY IF EXISTS "Fotos Vistorias Select Public" ON storage.objects;

-- 3. Cria Políticas Específicas para o bucket 'vistorias_fotos'

-- Permite Upload (Insert) para usuários autenticados
CREATE POLICY "Fotos Vistorias Insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vistorias_fotos');

-- Permite Modificação (Update) para usuários autenticados
CREATE POLICY "Fotos Vistorias Update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'vistorias_fotos')
WITH CHECK (bucket_id = 'vistorias_fotos');

-- Permite Exclusão (Delete) para usuários autenticados
CREATE POLICY "Fotos Vistorias Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'vistorias_fotos');

-- Permite Acesso Público (Select) para visualização das fotos e assinaturas
CREATE POLICY "Fotos Vistorias Select Public"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vistorias_fotos');

-- 4. Garante RLS para a tabela 'vistorias' (Acesso total para autenticados)
ALTER TABLE IF EXISTS public.vistorias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso total autenticados vistorias" ON public.vistorias;
CREATE POLICY "Acesso total autenticados vistorias"
ON public.vistorias
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Script das Políticas de RLS para o Storage de Vistorias aplicado com sucesso!
