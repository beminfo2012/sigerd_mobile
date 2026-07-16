-- Ativação da extensão para embeddings (pgvector)
CREATE EXTENSION IF NOT EXISTS vector;

-- Embeddings do acervo (normas/dispositivos) e de casos internos
CREATE TABLE IF NOT EXISTS nortis_embeddings (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL,
    tipo_origem    VARCHAR(30) NOT NULL,  -- dispositivo | parecer | vistoria | noprer | ocorrencia
    origem_id      UUID NOT NULL,          -- FK lógica para a tabela de origem
    modelo_embedding VARCHAR(50) NOT NULL, -- ex: 'text-embedding-004' (Gemini)
    vetor          VECTOR(768),            -- dimensão conforme modelo escolhido (Gemini = 768)
    criado_em      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para busca semântica eficiente
CREATE INDEX IF NOT EXISTS idx_nortis_embeddings_vetor ON nortis_embeddings USING hnsw (vetor vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_nortis_embeddings_tenant ON nortis_embeddings (tenant_id);

-- Cada chamada ao Assistente NORTIS, para auditoria e melhoria contínua
CREATE TABLE IF NOT EXISTS nortis_ia_sugestoes (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID NOT NULL,
    usuario_id        UUID NOT NULL,
    contexto_modulo   VARCHAR(50) NOT NULL, -- 'vistoria' | 'noprer' | 'parecer' | 'busca_livre' | ...
    relato_entrada    TEXT NOT NULL,
    documentos_recuperados JSONB NOT NULL, -- ids + scores retornados pela busca híbrida
    resposta_gerada   JSONB NOT NULL,      -- resposta estruturada do LLM
    modelo_llm        VARCHAR(50) NOT NULL,
    status_revisao    VARCHAR(20) NOT NULL DEFAULT 'pendente', -- pendente | aceita | rejeitada | ignorada
    motivo_rejeicao   TEXT,
    revisado_por      UUID,
    revisado_em       TIMESTAMPTZ,
    criado_em         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nortis_ia_sugestoes_tenant ON nortis_ia_sugestoes (tenant_id);

-- Feedback de "caso similar confirmado" — sinal de reforço para rankeamento futuro
CREATE TABLE IF NOT EXISTS nortis_casos_similares_confirmados (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID NOT NULL,
    caso_origem_id    UUID NOT NULL,
    caso_similar_id   UUID NOT NULL,
    confirmado_por    UUID NOT NULL,
    criado_em         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Candidatos descobertos externamente, aguardando curadoria
CREATE TABLE IF NOT EXISTS nortis_descobertas_externas (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    url_fonte       TEXT NOT NULL,
    dominio_validado BOOLEAN NOT NULL DEFAULT false,
    tipo_sugerido   VARCHAR(30),
    numero_sugerido VARCHAR(50),
    ementa_sugerida TEXT,
    texto_extraido  TEXT,
    arquivo_pdf_path TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'aguardando_revisao',
    norma_id_criada UUID REFERENCES nortis_normas(id) ON DELETE SET NULL, -- preenchido após aprovação
    criado_por      UUID NOT NULL,
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE nortis_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE nortis_ia_sugestoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE nortis_casos_similares_confirmados ENABLE ROW LEVEL SECURITY;
ALTER TABLE nortis_descobertas_externas ENABLE ROW LEVEL SECURITY;

-- Políticas Básicas (Admin e Servidores têm acesso completo no contexto de MVP)
-- nortis_embeddings
CREATE POLICY "Leitura total para nortis_embeddings" ON nortis_embeddings FOR SELECT USING (true);
CREATE POLICY "Escrita para autenticados em nortis_embeddings" ON nortis_embeddings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Atualização para autenticados em nortis_embeddings" ON nortis_embeddings FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Exclusão para autenticados em nortis_embeddings" ON nortis_embeddings FOR DELETE USING (auth.role() = 'authenticated');

-- nortis_ia_sugestoes
CREATE POLICY "Leitura total para nortis_ia_sugestoes" ON nortis_ia_sugestoes FOR SELECT USING (true);
CREATE POLICY "Escrita para autenticados em nortis_ia_sugestoes" ON nortis_ia_sugestoes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Atualização para autenticados em nortis_ia_sugestoes" ON nortis_ia_sugestoes FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Exclusão para autenticados em nortis_ia_sugestoes" ON nortis_ia_sugestoes FOR DELETE USING (auth.role() = 'authenticated');

-- nortis_casos_similares_confirmados
CREATE POLICY "Leitura total para nortis_casos_similares_confirmados" ON nortis_casos_similares_confirmados FOR SELECT USING (true);
CREATE POLICY "Escrita para autenticados em nortis_casos_similares_confirmados" ON nortis_casos_similares_confirmados FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Atualização para autenticados em nortis_casos_similares_confirmados" ON nortis_casos_similares_confirmados FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Exclusão para autenticados em nortis_casos_similares_confirmados" ON nortis_casos_similares_confirmados FOR DELETE USING (auth.role() = 'authenticated');

-- nortis_descobertas_externas
CREATE POLICY "Leitura total para nortis_descobertas_externas" ON nortis_descobertas_externas FOR SELECT USING (true);
CREATE POLICY "Escrita para autenticados em nortis_descobertas_externas" ON nortis_descobertas_externas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Atualização para autenticados em nortis_descobertas_externas" ON nortis_descobertas_externas FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Exclusão para autenticados em nortis_descobertas_externas" ON nortis_descobertas_externas FOR DELETE USING (auth.role() = 'authenticated');
