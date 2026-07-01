-- Script para popular os dados iniciais do MRCR (Mapeamento DER-ES e Tipologias Base)

-- 1. Inserir Tipologias Básicas de Exemplo
INSERT INTO public.mrcr_tipologias (codigo, descricao, unidade, categoria, fonte_referencia)
VALUES
('01.01', 'Mobilização e desmobilização de equipamentos', 'und', 'SERVIÇOS PRELIMINARES', 'SICRO'),
('02.01', 'Escavação manual em solo mole', 'm³', 'MOVIMENTO DE TERRA', 'SINAPI'),
('03.01', 'Concreto estrutural fck = 25MPa', 'm³', 'SUPERESTRUTURA', 'DER_ES_ROD'),
('04.01', 'Alvenaria de vedação com blocos cerâmicos', 'm²', 'PAREDES E PAINÉIS', 'DER_ES_EDIF')
ON CONFLICT DO NOTHING;

-- 2. Obter os IDs gerados para mapear o DER-ES
DO $$ 
DECLARE
    id_mob uuid;
    id_esc uuid;
    id_conc uuid;
    id_alv uuid;
BEGIN
    SELECT id INTO id_mob FROM public.mrcr_tipologias WHERE codigo = '01.01';
    SELECT id INTO id_esc FROM public.mrcr_tipologias WHERE codigo = '02.01';
    SELECT id INTO id_conc FROM public.mrcr_tipologias WHERE codigo = '03.01';
    SELECT id INTO id_alv FROM public.mrcr_tipologias WHERE codigo = '04.01';

    -- 3. Inserir mapeamento DE/PARA DER-ES Rodovias
    INSERT INTO public.mrcr_mapeamento_deres (codigo_deres, descricao_deres, tipologia_id, fonte)
    VALUES
    ('0101001', 'Mobilizacao/desmobilizacao equipamentos', id_mob, 'DER_ES_ROD'),
    ('0201010', 'Escavacao carga transporte mat 1a cat', id_esc, 'DER_ES_ROD'),
    ('0301015', 'Concreto ciclopeico fck=15MPa', id_conc, 'DER_ES_ROD')
    ON CONFLICT DO NOTHING;

    -- 4. Inserir mapeamento DE/PARA DER-ES Edificações (IOPES)
    INSERT INTO public.mrcr_mapeamento_deres (codigo_deres, descricao_deres, tipologia_id, fonte)
    VALUES
    ('0205010', 'Escavacao manual', id_esc, 'DER_ES_EDIF'),
    ('0501001', 'Concreto FCK 25MPA virado na obra', id_conc, 'DER_ES_EDIF'),
    ('0602005', 'Alvenaria tijolo furado 9x19x19 cm', id_alv, 'DER_ES_EDIF')
    ON CONFLICT DO NOTHING;
END $$;
