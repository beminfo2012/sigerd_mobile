-- ==============================================================================
-- NORTIS IA: FASE 5 - PESQUISA EXTERNA E CURADORIA
-- Objetivo: Armazenar normas externas encontradas pela IA para curadoria humana.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.nortis_sugestoes_curadoria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    usuario_id UUID NOT NULL,
    tipo_sugestao VARCHAR(50) DEFAULT 'LEGISLACAO', -- LEI, DECRETO, NOTA_TECNICA, MANUAL
    titulo VARCHAR(500) NOT NULL,
    url_origem VARCHAR(1000) NOT NULL,
    justificativa TEXT,
    nivel_confiabilidade VARCHAR(20) DEFAULT 'NIVEL_C', -- NIVEL_A, NIVEL_B, NIVEL_C
    status VARCHAR(50) DEFAULT 'PENDENTE', -- PENDENTE, APROVADA, REJEITADA
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Habilitar RLS
ALTER TABLE public.nortis_sugestoes_curadoria ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Usuários podem visualizar sugestões de sua instituição"
    ON public.nortis_sugestoes_curadoria FOR SELECT
    USING (tenant_id = auth.uid() OR auth.role() = 'authenticated'); -- Simplificação para compatibilidade com a modelagem do SIGERD

CREATE POLICY "Usuários podem criar sugestões"
    ON public.nortis_sugestoes_curadoria FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Apenas administradores podem atualizar o status"
    ON public.nortis_sugestoes_curadoria FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_nortis_sugestoes_curadoria_updated_at
    BEFORE UPDATE ON public.nortis_sugestoes_curadoria
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- FIM DA MIGRATION
