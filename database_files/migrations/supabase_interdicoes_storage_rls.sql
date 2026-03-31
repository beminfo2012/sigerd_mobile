-- ============================================
-- SIGERD Mobile - Interdições Storage RLS
-- Enable storage bucket and security policies
-- ============================================

-- 1. Create the bucket if it doesn't exist and make it public
INSERT INTO storage.buckets (id, name, public) 
SELECT 'interdicoes_fotos', 'interdicoes_fotos', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'interdicoes_fotos'
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Fotos Interdicoes Insert" ON storage.objects;
DROP POLICY IF EXISTS "Fotos Interdicoes Update" ON storage.objects;
DROP POLICY IF EXISTS "Fotos Interdicoes Delete" ON storage.objects;
DROP POLICY IF EXISTS "Fotos Interdicoes Select Public" ON storage.objects;

-- 3. Create Specific Policies for bucket 'interdicoes_fotos'

-- Allow Upload (Insert) for authenticated users
CREATE POLICY "Fotos Interdicoes Insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'interdicoes_fotos');

-- Allow Modification (Update) for authenticated users
CREATE POLICY "Fotos Interdicoes Update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'interdicoes_fotos')
WITH CHECK (bucket_id = 'interdicoes_fotos');

-- Allow Deletion for authenticated users
CREATE POLICY "Fotos Interdicoes Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'interdicoes_fotos');

-- Allow Public Access (Select) to view photos
CREATE POLICY "Fotos Interdicoes Select Public"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'interdicoes_fotos');

-- 4. Ensure RLS for 'interdicoes' table (Total Access for authenticated)
ALTER TABLE IF EXISTS public.interdicoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso total autenticados interdicoes" ON public.interdicoes;
CREATE POLICY "Acesso total autenticados interdicoes"
ON public.interdicoes
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 5. Ensure RLS for 'desinterdicoes' table
ALTER TABLE IF EXISTS public.desinterdicoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso total autenticados desinterdicoes" ON public.desinterdicoes;
CREATE POLICY "Acesso total autenticados desinterdicoes"
ON public.desinterdicoes
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- RLS Policies for Interdicoes Storage applied successfully!
