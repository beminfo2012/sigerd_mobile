-- Liberando o acesso global temporariamente para resolver o bloqueio de RLS

-- 1. eventos_desastre
ALTER TABLE public.eventos_desastre ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso publico geral" ON public.eventos_desastre;
CREATE POLICY "Acesso publico geral" ON public.eventos_desastre FOR ALL USING (true) WITH CHECK (true);

-- 2. redap_fluxo_aprovacao
ALTER TABLE public.redap_fluxo_aprovacao ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso publico geral" ON public.redap_fluxo_aprovacao;
CREATE POLICY "Acesso publico geral" ON public.redap_fluxo_aprovacao FOR ALL USING (true) WITH CHECK (true);

-- 3. redap_secoes
ALTER TABLE public.redap_secoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso publico geral" ON public.redap_secoes;
CREATE POLICY "Acesso publico geral" ON public.redap_secoes FOR ALL USING (true) WITH CHECK (true);

-- 4. redap_historico_acoes
ALTER TABLE public.redap_historico_acoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso publico geral" ON public.redap_historico_acoes;
CREATE POLICY "Acesso publico geral" ON public.redap_historico_acoes FOR ALL USING (true) WITH CHECK (true);

-- 5. redap_assinaturas
ALTER TABLE public.redap_assinaturas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso publico geral" ON public.redap_assinaturas;
CREATE POLICY "Acesso publico geral" ON public.redap_assinaturas FOR ALL USING (true) WITH CHECK (true);

-- 6. redap_pareceres
ALTER TABLE public.redap_pareceres ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso publico geral" ON public.redap_pareceres;
CREATE POLICY "Acesso publico geral" ON public.redap_pareceres FOR ALL USING (true) WITH CHECK (true);

-- 7. redap_reaberturas
ALTER TABLE public.redap_reaberturas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso publico geral" ON public.redap_reaberturas;
CREATE POLICY "Acesso publico geral" ON public.redap_reaberturas FOR ALL USING (true) WITH CHECK (true);

-- 8. Adicionar coluna nivel_intensidade_final em eventos_desastre
ALTER TABLE public.eventos_desastre ADD COLUMN IF NOT EXISTS nivel_intensidade_final text;

