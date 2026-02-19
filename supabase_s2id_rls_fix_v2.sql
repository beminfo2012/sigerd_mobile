-- ==============================================================================
-- CORREÇÃO DE PERMISSÕES RLS - S2ID RECORDS (SCRIPT SEGURO)
-- ==============================================================================
-- Este script foi ajustado para ignorar erros se a tabela já estiver na publicação realtime.
-- Ele foca em liberar as permissões de INSERT/UPDATE para os agentes.

DO $$
BEGIN
    -- 1. Habilita Realtime (apenas se não estiver habilitado)
    -- Ignoramos o erro 42710 (duplicate_object) propositalmente
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.s2id_records;
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Tabela s2id_records já está no realtime (ok).';
    END;
END $$;

-- 2. Garante que RLS está habilitado na tabela
ALTER TABLE public.s2id_records ENABLE ROW LEVEL SECURITY;

-- 3. Limpeza de políticas antigas/conflitantes
DROP POLICY IF EXISTS "Enable read access for all users" ON public.s2id_records;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.s2id_records;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.s2id_records;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON public.s2id_records;
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.s2id_records;
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON public.s2id_records;

-- 4. CRIAÇÃO DAS NOVAS POLÍTICAS (PERMISSIVA)

-- Política de Leitura Pública (para Dashboards)
CREATE POLICY "Enable read access for all users"
ON public.s2id_records
FOR SELECT
TO public
USING (true);

-- Política de Escrita Total para Usuários Logados (Autenticados)
-- Permite que o Marcelo e outros agentes criem e editem registros
CREATE POLICY "Enable write access for authenticated users"
ON public.s2id_records
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Confirmação
SELECT 'Permissões corrigidas com sucesso!' as status;
