-- ============================================================
-- MIGRAÇÃO: Criação do Módulo de Alertas (CEMADEN)
-- ============================================================

CREATE TABLE IF NOT EXISTS alertas_cemaden (
    id                  SERIAL PRIMARY KEY,
    numero_alerta       VARCHAR(20)  NOT NULL,           -- ex: '1253/2026'
    municipio           VARCHAR(120) NOT NULL,
    uf                  VARCHAR(2)   NOT NULL,
    tipo_evento         VARCHAR(60)  NOT NULL,            -- texto bruto, ex: 'MOVIMENTOS DE MASSA'
    categoria_risco     VARCHAR(20)  NOT NULL,            -- GEOLOGICO | HIDROLOGICO | OUTRO
    nivel_atual         VARCHAR(20)  NOT NULL,            -- OBSERVACAO | MODERADO | ALTO | MUITO_ALTO
    status              VARCHAR(20)  NOT NULL DEFAULT 'ATIVO', -- ATIVO | CESSADO | EXCLUIDO
    data_abertura       TIMESTAMP    NOT NULL,
    data_atualizacao    TIMESTAMP,
    data_cessar         TIMESTAMP,
    pessoas_expostas    INTEGER,
    moradias_expostas   INTEGER,
    pendencia_vinculo   BOOLEAN      NOT NULL DEFAULT FALSE, -- true = cessar sem abertura encontrada
    excluido_em         TIMESTAMP,
    excluido_por        UUID, -- Changed to UUID for auth.users reference (assuming standard supabase setup)
    motivo_exclusao     TEXT,
    criado_em           TIMESTAMP    NOT NULL DEFAULT now(),
    atualizado_em       TIMESTAMP    NOT NULL DEFAULT now()
);

-- Handle unique index safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'uq_alerta_numero_ativo') THEN
        CREATE UNIQUE INDEX uq_alerta_numero_ativo
            ON alertas_cemaden (numero_alerta)
            WHERE status <> 'EXCLUIDO';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_alerta_status') THEN
        CREATE INDEX idx_alerta_status ON alertas_cemaden (status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_alerta_categoria') THEN
        CREATE INDEX idx_alerta_categoria ON alertas_cemaden (categoria_risco, nivel_atual);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_alerta_municipio') THEN
        CREATE INDEX idx_alerta_municipio ON alertas_cemaden (municipio);
    END IF;
END $$;


CREATE TABLE IF NOT EXISTS alertas_cemaden_versoes (
    id                   SERIAL PRIMARY KEY,
    alerta_id            INTEGER NOT NULL REFERENCES alertas_cemaden(id),
    tipo_documento       VARCHAR(20) NOT NULL,   -- ABERTURA | ATUALIZACAO | CESSAR
    nivel                VARCHAR(20) NOT NULL,
    data_emissao_doc      TIMESTAMP,             -- 'ABERTO EM' do PDF
    data_atualizacao_doc  TIMESTAMP,             -- 'ATUALIZADO EM' do PDF
    cenario_risco         TEXT,
    situacao_atual        TEXT,
    tendencia             TEXT,
    recomendacoes         TEXT,
    acoes_defesa_civil    TEXT,
    arquivo_path          VARCHAR(255) NOT NULL,  -- caminho/URL do PDF armazenado
    arquivo_nome_original VARCHAR(255),
    dados_extraidos_json  JSONB,                  -- saída bruta do parser, para auditoria/reprocessamento
    confirmado_manualmente BOOLEAN NOT NULL DEFAULT FALSE,
    uploaded_by           UUID,
    uploaded_at            TIMESTAMP NOT NULL DEFAULT now()
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_versao_alerta') THEN
        CREATE INDEX idx_versao_alerta ON alertas_cemaden_versoes (alerta_id);
    END IF;
END $$;


CREATE TABLE IF NOT EXISTS alertas_cemaden_precipitacao (
    id              SERIAL PRIMARY KEY,
    versao_id       INTEGER NOT NULL REFERENCES alertas_cemaden_versoes(id),
    estacao_nome    VARCHAR(150),
    rede            VARCHAR(20),       -- ANA, etc.
    data_leitura    TIMESTAMP,
    acumulado_1h    NUMERIC(6,1),
    acumulado_3h    NUMERIC(6,1),
    acumulado_6h    NUMERIC(6,1),
    acumulado_12h   NUMERIC(6,1),
    acumulado_24h   NUMERIC(6,1),
    acumulado_48h   NUMERIC(6,1),
    acumulado_72h   NUMERIC(6,1),
    acumulado_96h   NUMERIC(6,1),
    acumulado_120h  NUMERIC(6,1)
);

CREATE TABLE IF NOT EXISTS alertas_cemaden_log (
    id          SERIAL PRIMARY KEY,
    alerta_id   INTEGER NOT NULL REFERENCES alertas_cemaden(id),
    acao        VARCHAR(40) NOT NULL,  -- UPLOAD_ABERTURA, UPLOAD_ATUALIZACAO, CESSAR_AUTOMATICO,
                                       -- CESSAR_MANUAL, EXCLUSAO, VINCULO_MANUAL
    usuario_id  UUID,
    detalhes    TEXT,
    criado_em   TIMESTAMP NOT NULL DEFAULT now()
);
