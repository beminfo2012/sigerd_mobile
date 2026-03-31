-- Habilita RLS e garante permissões totais para usuários autenticados na tabela interdicoes
ALTER TABLE IF EXISTS public.interdicoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable full access for authenticated users" ON public.interdicoes;
CREATE POLICY "Enable full access for authenticated users"
ON public.interdicoes
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Garante que o ID formatado seja único para evitar duplicidade na sincronização
-- ALTER TABLE public.interdicoes ADD CONSTRAINT interdicoes_interdicao_id_key UNIQUE (interdicao_id);
