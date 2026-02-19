-- ==============================================================================
-- CORREÇÃO DE PERMISSÕES RLS (ROW LEVEL SECURITY) - TABELA s2id_records
-- ==============================================================================
-- Este script resolve o erro 42501 (permissão negada) que impede a sincronização
-- de registros S2ID (FIDEs) entre dispositivos.

-- 1. Garante que RLS está habilitado
ALTER TABLE public.s2id_records ENABLE ROW LEVEL SECURITY;

-- 2. Remove políticas antigas que podem estar bloqueando o acesso
DROP POLICY IF EXISTS "Enable read access for all users" ON public.s2id_records;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.s2id_records;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.s2id_records;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON public.s2id_records;
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.s2id_records;
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON public.s2id_records;

-- 3. Cria política de LEITURA irrestrita (Público + Autenticado)
-- Permite que qualquer dispositivo leia os registros para exibir no Dashboard
CREATE POLICY "Enable read access for all users"
ON public.s2id_records
FOR SELECT
TO public
USING (true);

-- 4. Cria política de ESCRITA total para usuários LOGADOS
-- Permite Insert, Update e Delete para qualquer usuário autenticado (Marcelo, etc.)
CREATE POLICY "Enable write access for authenticated users"
ON public.s2id_records
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- FIM
