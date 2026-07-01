-- Script de Migração: Novo Fluxo de Aprovação e Validação do REDAP (5 Fases)

-- 1. Alterar tabela eventos_desastre
-- Como status_geral pode ser um tipo ENUM ou VARCHAR dependendo da base, 
-- vamos atualizar para VARCHAR ou adicionar os novos valores.
-- Assumindo que a coluna seja VARCHAR na implementação atual:

-- Adicionar nova coluna de nível de intensidade final
ALTER TABLE public.eventos_desastre 
ADD COLUMN IF NOT EXISTS nivel_intensidade_final VARCHAR(50); 
-- (Pode ser: 'NIVEL_I', 'NIVEL_II', 'NIVEL_III')

-- 2. Reescrever a tabela redap_fluxo_aprovacao
-- Vamos adicionar as novas colunas necessárias, permitindo a transição do fluxo antigo.
ALTER TABLE public.redap_fluxo_aprovacao
ADD COLUMN IF NOT EXISTS fase VARCHAR(10),
ADD COLUMN IF NOT EXISTS nome_fase VARCHAR(255),
ADD COLUMN IF NOT EXISTS responsavel_papel VARCHAR(100),
ADD COLUMN IF NOT EXISTS responsavel_usuario_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS decisao_registrada JSONB;

-- (Opcional) Limpar dados antigos de fluxo caso estejam incompatíveis (com cuidado em PRD):
-- TRUNCATE TABLE public.redap_fluxo_aprovacao;

-- 3. Criar tabela redap_pareceres
CREATE TABLE IF NOT EXISTS public.redap_pareceres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id UUID NOT NULL REFERENCES public.eventos_desastre(id) ON DELETE CASCADE,
    tipo_parecer VARCHAR(100) NOT NULL, -- PARECER_TECNICO_CONSOLIDACAO | PARECER_DECISORIO_COORDENADOR
    autor_id UUID NOT NULL REFERENCES auth.users(id),
    cargo_autor VARCHAR(255),
    conteudo_texto TEXT,
    decisao VARCHAR(100), -- RECOMENDA_SE | RECOMENDA_ECP | NAO_RECOMENDA
    nivel_intensidade VARCHAR(50), -- NIVEL_I | NIVEL_II | NIVEL_III
    motivacao_ecp TEXT,
    requer_reconhecimento VARCHAR(50), -- NAO_REQUER | OPCIONAL | OBRIGATORIO
    documento_gerado_id UUID, -- Opcional, referência a tabela de documentos se houver
    data_emissao TIMESTAMPTZ DEFAULT NOW(),
    assinatura_hash VARCHAR(255)
);

-- 4. Criar tabela redap_reaberturas
CREATE TABLE IF NOT EXISTS public.redap_reaberturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id UUID NOT NULL REFERENCES public.eventos_desastre(id) ON DELETE CASCADE,
    parecer_anterior_id UUID NOT NULL REFERENCES public.redap_pareceres(id),
    motivo_reabertura TEXT NOT NULL,
    reaberto_por_id UUID NOT NULL REFERENCES auth.users(id),
    data_reabertura TIMESTAMPTZ DEFAULT NOW()
);

-- Atualização das Políticas RLS (Exemplo simplificado)
ALTER TABLE public.redap_pareceres ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura de pareceres aberta a autenticados" ON public.redap_pareceres FOR SELECT TO authenticated USING (true);
CREATE POLICY "Inserção de pareceres restrita" ON public.redap_pareceres FOR INSERT TO authenticated WITH CHECK (true);

ALTER TABLE public.redap_reaberturas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura reaberturas" ON public.redap_reaberturas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Inserção reaberturas" ON public.redap_reaberturas FOR INSERT TO authenticated WITH CHECK (true);
