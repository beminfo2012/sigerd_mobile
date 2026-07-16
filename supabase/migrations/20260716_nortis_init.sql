-- Tabela principal de normas/documentos
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE TABLE IF NOT EXISTS nortis_normas (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    tipo            VARCHAR(30) NOT NULL,  -- lei | decreto | portaria | nbr | nota_tecnica | sumula | acordao | parecer | faq
    numero          VARCHAR(50),
    ano             INTEGER,
    ambito          VARCHAR(20) NOT NULL,  -- federal | estadual | municipal | institucional
    orgao_emissor   VARCHAR(150),
    ementa          TEXT NOT NULL,
    texto_integral  TEXT,
    situacao        VARCHAR(20) NOT NULL DEFAULT 'vigente', -- vigente | revogada | alterada | em_analise
    norma_sucessora_id UUID REFERENCES nortis_normas(id),
    data_publicacao DATE,
    url_fonte_oficial TEXT,
    arquivo_pdf_path  TEXT, -- referência ao objeto no MinIO
    criado_por      UUID NOT NULL,
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
    busca_vetor     TSVECTOR
);

CREATE INDEX IF NOT EXISTS idx_nortis_normas_busca ON nortis_normas USING GIN (busca_vetor);
CREATE INDEX IF NOT EXISTS idx_nortis_normas_tenant ON nortis_normas (tenant_id);
ALTER TABLE nortis_normas ENABLE ROW LEVEL SECURITY;

-- Trigger de atualização do vetor de busca (ementa tem peso maior que texto integral)
CREATE OR REPLACE FUNCTION nortis_normas_tsvector_update() RETURNS trigger AS $$
BEGIN
  NEW.busca_vetor :=
    setweight(to_tsvector('portuguese', unaccent(coalesce(NEW.ementa, ''))), 'A') ||
    setweight(to_tsvector('portuguese', unaccent(coalesce(NEW.numero, ''))), 'A') ||
    setweight(to_tsvector('portuguese', unaccent(coalesce(NEW.texto_integral, ''))), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_nortis_normas_tsvector ON nortis_normas;
CREATE TRIGGER trg_nortis_normas_tsvector
BEFORE INSERT OR UPDATE ON nortis_normas
FOR EACH ROW EXECUTE FUNCTION nortis_normas_tsvector_update();

-- Dispositivos (granularidade de artigo/parágrafo/inciso, para citação precisa)
CREATE TABLE IF NOT EXISTS nortis_dispositivos (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    norma_id    UUID NOT NULL REFERENCES nortis_normas(id) ON DELETE CASCADE,
    tenant_id   UUID NOT NULL,
    artigo      VARCHAR(20),
    paragrafo   VARCHAR(20),
    inciso      VARCHAR(20),
    alinea      VARCHAR(10),
    texto       TEXT NOT NULL
);
ALTER TABLE nortis_dispositivos ENABLE ROW LEVEL SECURITY;

-- Temas/categorias (many-to-many)
CREATE TABLE IF NOT EXISTS nortis_temas (
    id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome  VARCHAR(100) NOT NULL UNIQUE  -- ex: 'Uso do Solo', 'Defesa Civil', 'Licitações', 'Obras Públicas'
);
ALTER TABLE nortis_temas ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS nortis_normas_temas (
    norma_id UUID REFERENCES nortis_normas(id) ON DELETE CASCADE,
    tema_id  UUID REFERENCES nortis_temas(id) ON DELETE CASCADE,
    PRIMARY KEY (norma_id, tema_id)
);
ALTER TABLE nortis_normas_temas ENABLE ROW LEVEL SECURITY;

-- Referências cruzadas (grafo: norma A revoga/altera/regulamenta norma B)
CREATE TABLE IF NOT EXISTS nortis_referencias (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    norma_origem_id  UUID NOT NULL REFERENCES nortis_normas(id),
    norma_destino_id UUID NOT NULL REFERENCES nortis_normas(id),
    tipo_relacao  VARCHAR(20) NOT NULL -- revoga | altera | regulamenta | cita
);
ALTER TABLE nortis_referencias ENABLE ROW LEVEL SECURITY;

-- Backlinks: onde essa norma foi citada dentro do próprio SIGERD
CREATE TABLE IF NOT EXISTS nortis_citacoes_internas (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    norma_id       UUID NOT NULL REFERENCES nortis_normas(id),
    tenant_id      UUID NOT NULL,
    modulo_origem  VARCHAR(50) NOT NULL, -- 'noprer' | 'vistoria' | 'embargo' | 'parecer' | 'ocorrencias'
    registro_origem_id UUID NOT NULL,
    criado_em      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE nortis_citacoes_internas ENABLE ROW LEVEL SECURITY;

-- Favoritos por usuário
CREATE TABLE IF NOT EXISTS nortis_favoritos (
    usuario_id UUID NOT NULL,
    norma_id   UUID NOT NULL REFERENCES nortis_normas(id),
    criado_em  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (usuario_id, norma_id)
);
ALTER TABLE nortis_favoritos ENABLE ROW LEVEL SECURITY;

-- Log de consultas (uso analítico e defensibilidade perante TCE-ES)
CREATE TABLE IF NOT EXISTS nortis_consultas_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    usuario_id  UUID NOT NULL,
    termo_busca TEXT,
    norma_id    UUID REFERENCES nortis_normas(id),
    contexto_modulo VARCHAR(50), -- de onde a busca partiu
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE nortis_consultas_log ENABLE ROW LEVEL SECURITY;
