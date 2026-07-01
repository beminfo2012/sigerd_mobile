-- Módulo MRCR (Módulo de Referências de Custo) - Esquema Completo com DER-ES

-- 1. mrcr_tipologias
CREATE TABLE IF NOT EXISTS public.mrcr_tipologias (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo varchar NOT NULL,
    descricao text NOT NULL,
    unidade varchar(20) NOT NULL,
    categoria varchar NOT NULL,
    fonte_referencia varchar NOT NULL, -- SINAPI, SICRO, DER_ES_ROD, DER_ES_EDIF, PARAMETRICA, MANUAL
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. mrcr_composicoes
CREATE TABLE IF NOT EXISTS public.mrcr_composicoes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tipologia_id uuid REFERENCES public.mrcr_tipologias(id) ON DELETE CASCADE,
    composicoes_sinapi jsonb,
    composicoes_sicro jsonb,
    composicoes_deres_rod jsonb,
    composicoes_deres_edif jsonb,
    custo_unitario_sinapi numeric,
    custo_unitario_sicro numeric,
    custo_unitario_deres_rod numeric,
    custo_unitario_deres_edif numeric,
    mes_referencia_sinapi date,
    mes_referencia_sicro date,
    mes_referencia_deres date,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 3. mrcr_itens_redap (Registro de uso no REDAP)
CREATE TABLE IF NOT EXISTS public.mrcr_itens_redap (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    redap_id uuid NOT NULL,
    secao_id varchar NOT NULL,
    tipologia_id uuid REFERENCES public.mrcr_tipologias(id),
    quantidade numeric NOT NULL,
    custo_unitario_usado numeric NOT NULL,
    fonte_escolhida varchar NOT NULL, -- SINAPI, SICRO, DER_ES_ROD, DER_ES_EDIF, PARAMETRICA, MANUAL
    justificativa_fonte text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 4. mrcr_historico_precos
CREATE TABLE IF NOT EXISTS public.mrcr_historico_precos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tipologia_id uuid REFERENCES public.mrcr_tipologias(id) ON DELETE CASCADE,
    fonte varchar NOT NULL,
    custo_unitario numeric,
    custo_unitario_deres_rod numeric,
    custo_unitario_deres_edif numeric,
    mes_referencia date NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 5. mrcr_mapeamento_deres
CREATE TABLE IF NOT EXISTS public.mrcr_mapeamento_deres (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo_deres varchar NOT NULL,
    descricao_deres text NOT NULL,
    tipologia_id uuid REFERENCES public.mrcr_tipologias(id) ON DELETE CASCADE,
    fonte varchar NOT NULL CHECK (fonte IN ('DER_ES_ROD', 'DER_ES_EDIF')),
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 6. mrcr_atualizacoes_log
CREATE TABLE IF NOT EXISTS public.mrcr_atualizacoes_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    fonte varchar NOT NULL,
    mes_referencia date NOT NULL,
    importado_por varchar,
    data_import timestamp with time zone DEFAULT timezone('utc'::text, now()),
    composicoes_atualizadas integer DEFAULT 0,
    status varchar DEFAULT 'SUCESSO'
);

-- RLS (Habilitar para todas as tabelas MRCR e permitir acesso total)
ALTER TABLE public.mrcr_tipologias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso publico geral" ON public.mrcr_tipologias;
CREATE POLICY "Acesso publico geral" ON public.mrcr_tipologias FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.mrcr_composicoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso publico geral" ON public.mrcr_composicoes;
CREATE POLICY "Acesso publico geral" ON public.mrcr_composicoes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.mrcr_itens_redap ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso publico geral" ON public.mrcr_itens_redap;
CREATE POLICY "Acesso publico geral" ON public.mrcr_itens_redap FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.mrcr_historico_precos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso publico geral" ON public.mrcr_historico_precos;
CREATE POLICY "Acesso publico geral" ON public.mrcr_historico_precos FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.mrcr_mapeamento_deres ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso publico geral" ON public.mrcr_mapeamento_deres;
CREATE POLICY "Acesso publico geral" ON public.mrcr_mapeamento_deres FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.mrcr_atualizacoes_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso publico geral" ON public.mrcr_atualizacoes_log;
CREATE POLICY "Acesso publico geral" ON public.mrcr_atualizacoes_log FOR ALL USING (true) WITH CHECK (true);
