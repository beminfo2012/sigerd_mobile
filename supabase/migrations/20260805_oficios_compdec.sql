-- Migração: 20260805_oficios_compdec.sql
-- Tabela para gestão e acervo de ofícios da COMPDEC / Defesa Civil

CREATE TABLE IF NOT EXISTS oficios_compdec (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL, -- FK lógicamente ligada a tenants(id)

    -- Identificação / numeração
    sigla_orgao             VARCHAR(50) NOT NULL DEFAULT 'PMSMJ/COMPDEC',
    ano                     SMALLINT NOT NULL,
    numero_sequencial       INTEGER,              -- NULL enquanto RASCUNHO; atribuído na emissão
    numero_formatado        VARCHAR(20),           -- ex.: "015/2026"
    identificador_completo  VARCHAR(80),           -- ex.: "OF/PMSMJ/COMPDEC/N° 015/2026"

    -- Origem do registro
    fonte                   VARCHAR(30) NOT NULL DEFAULT 'SISTEMA_GERADO',  -- 'LEGADO_ARQUIVO_FISICO' | 'SISTEMA_GERADO'

    -- Ciclo de vida
    status                  VARCHAR(20) NOT NULL DEFAULT 'RASCUNHO',
                            -- RASCUNHO | EMITIDO | ENVIADO | RESPONDIDO | ARQUIVADO
    data_emissao            DATE,                  -- data que consta impressa no documento
    data_envio              DATE,
    data_resposta           DATE,

    -- Destinatário
    destinatario_nome       VARCHAR(200) NOT NULL,
    destinatario_cargo      VARCHAR(200),
    destinatario_orgao      VARCHAR(200),

    -- Conteúdo
    assunto                 TEXT NOT NULL,
    introducao              TEXT,                  -- ex.: "Por determinação do Excelentíssimo..."
    considerandos           JSONB DEFAULT '[]'::jsonb,     -- array ordenado de strings/parágrafos
    corpo_paragrafos        JSONB DEFAULT '[]'::jsonb,     -- parágrafos livres
    fecho                   VARCHAR(50) DEFAULT 'Respeitosamente,',

    -- Referências administrativas
    processo_edocs          VARCHAR(50),
    documentos_referenciados JSONB DEFAULT '[]'::jsonb,    -- [{tipo, id, numero_formatado}]

    -- Signatário
    signatario_nome         VARCHAR(200),
    signatario_cargo        VARCHAR(200),
    signatario_portaria     VARCHAR(50),

    -- Arquivos gerados/importados
    arquivo_docx_url        TEXT,                  -- MinIO / Supabase Storage
    arquivo_pdf_url         TEXT,                  -- MinIO / Supabase Storage
    arquivo_original_scan_url TEXT,                 -- scan de legado se não houver texto estruturado

    -- Auditoria
    created_by              UUID,
    validado_por            UUID,
    validado_em             TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_numero_por_ano_orgao
        UNIQUE (tenant_id, sigla_orgao, ano, numero_sequencial)
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_oficios_ano ON oficios_compdec (ano);
CREATE INDEX IF NOT EXISTS idx_oficios_status ON oficios_compdec (status);
CREATE INDEX IF NOT EXISTS idx_oficios_destinatario ON oficios_compdec (destinatario_orgao);
CREATE INDEX IF NOT EXISTS idx_oficios_tenant ON oficios_compdec (tenant_id);

-- Habilitar Row Level Security (RLS)
ALTER TABLE oficios_compdec ENABLE ROW LEVEL SECURITY;

-- Política de isolamento multi-tenant
DROP POLICY IF EXISTS tenant_isolation_oficios ON oficios_compdec;
CREATE POLICY tenant_isolation_oficios ON oficios_compdec
    USING (
        tenant_id = COALESCE(
            NULLIF(current_setting('app.current_tenant', true), '')::uuid,
            '00000000-0000-0000-0000-000000000000'::uuid
        )
    );
