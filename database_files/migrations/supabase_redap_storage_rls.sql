-- ====================================================================
-- MÓDULO REDAP - SEGURANÇA DE STORAGE (REDAP_FOTOS E REDAP)
-- SQL DE MIGRAÇÃO DE STORAGE RLS NO SUPABASE (IDEMPOTENTE)
-- GARANTE CONSISTÊNCIA DE PASTA IMUTÁVEL SE FINALIZADA/SUBMETIDA
-- ====================================================================

-- 1. Garante que o bucket 'redap_fotos' existe e é público
INSERT INTO storage.buckets (id, name, public) 
SELECT 'redap_fotos', 'redap_fotos', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'redap_fotos'
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Garante que o bucket 'redap' existe e é público
INSERT INTO storage.buckets (id, name, public) 
SELECT 'redap', 'redap', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'redap'
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Limpeza de políticas anteriores para evitar conflitos na reaplicação
DROP POLICY IF EXISTS "Redap Fotos: Acesso Público" ON storage.objects;
DROP POLICY IF EXISTS "Redap Fotos: Upload Autenticado" ON storage.objects;
DROP POLICY IF EXISTS "Redap Fotos: Update Autenticado" ON storage.objects;
DROP POLICY IF EXISTS "Redap Fotos: Delete Próprio" ON storage.objects;

DROP POLICY IF EXISTS "Redap: Acesso Público" ON storage.objects;
DROP POLICY IF EXISTS "Redap: Upload Autenticado" ON storage.objects;
DROP POLICY IF EXISTS "Redap: Update Autenticado" ON storage.objects;
DROP POLICY IF EXISTS "Redap: Delete Próprio" ON storage.objects;

-- 4. Criar Políticas Específicas para o bucket 'redap_fotos'
-- Permite que todos vejam as fotos (Select)
CREATE POLICY "Redap Fotos: Acesso Público" ON storage.objects
    FOR SELECT TO public USING (bucket_id = 'redap_fotos');

-- Permite Upload (Insert) para usuários autenticados (a validação de pasta ocorre na atualização/sincronização de tabelas)
CREATE POLICY "Redap Fotos: Upload Autenticado" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'redap_fotos');

-- Permite Modificação (Update/Upsert) para usuários autenticados APENAS se o evento/registro não estiver finalizado
CREATE POLICY "Redap Fotos: Update Autenticado" ON storage.objects
    FOR UPDATE TO authenticated 
    USING (
        bucket_id = 'redap_fotos' AND 
        NOT EXISTS (
            SELECT 1 FROM public.redap_registros r
            JOIN public.redap_eventos e ON e.id = r.evento_id
            WHERE r.id::text = (storage.foldername(name))[1]
            AND e.status_evento = 'Finalizado'
        )
    ) 
    WITH CHECK (bucket_id = 'redap_fotos');

-- Permite Excluir fotos para usuários autenticados APENAS se o evento/registro não estiver finalizado
CREATE POLICY "Redap Fotos: Delete Próprio" ON storage.objects
    FOR DELETE TO authenticated 
    USING (
        bucket_id = 'redap_fotos' AND 
        NOT EXISTS (
            SELECT 1 FROM public.redap_registros r
            JOIN public.redap_eventos e ON e.id = r.evento_id
            WHERE r.id::text = (storage.foldername(name))[1]
            AND e.status_evento = 'Finalizado'
        )
    );

-- 5. Criar Políticas Específicas para o bucket 'redap'
-- Permite que todos vejam os arquivos (Select)
CREATE POLICY "Redap: Acesso Público" ON storage.objects
    FOR SELECT TO public USING (bucket_id = 'redap');

-- Permite Upload (Insert) para usuários autenticados
CREATE POLICY "Redap: Upload Autenticado" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'redap');

-- Permite Modificação (Update/Upsert) para usuários autenticados APENAS se a pasta da FIDE não estiver submetida
CREATE POLICY "Redap: Update Autenticado" ON storage.objects
    FOR UPDATE TO authenticated 
    USING (
        bucket_id = 'redap' AND 
        NOT EXISTS (
            SELECT 1 FROM public.redap_records r
            WHERE (r.id::text = (storage.foldername(name))[1] OR r.redap_id::text = (storage.foldername(name))[1])
            AND r.status = 'submitted'
        )
    ) 
    WITH CHECK (bucket_id = 'redap');

-- Permite Excluir arquivos para usuários autenticados APENAS se a pasta da FIDE não estiver submetida
CREATE POLICY "Redap: Delete Próprio" ON storage.objects
    FOR DELETE TO authenticated 
    USING (
        bucket_id = 'redap' AND 
        NOT EXISTS (
            SELECT 1 FROM public.redap_records r
            WHERE (r.id::text = (storage.foldername(name))[1] OR r.redap_id::text = (storage.foldername(name))[1])
            AND r.status = 'submitted'
        )
    );
