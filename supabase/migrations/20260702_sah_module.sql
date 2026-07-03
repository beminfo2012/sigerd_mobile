-- SAH (Solicitação de Assistência Humanitária) Module Tables
CREATE TABLE IF NOT EXISTS sah_solicitacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocolo VARCHAR(40) UNIQUE NOT NULL,
    evento_id UUID, -- For correlation if there is an event table, otherwise we rely on redap_id
    redap_id UUID REFERENCES redap_registros(id) ON DELETE SET NULL,
    municipio VARCHAR(120) NOT NULL DEFAULT 'Santa Maria de Jetibá',
    uf CHAR(2) NOT NULL DEFAULT 'ES',
    cobrade VARCHAR(20) NOT NULL,
    data_desastre DATE NOT NULL,
    decreto_emergencia VARCHAR(80),
    protocolo_s2id VARCHAR(60),
    destinos TEXT[] NOT NULL DEFAULT '{}',
    descricao_situacao TEXT NOT NULL,
    acoes_municipio TEXT,
    snapshot_desabrigados INTEGER NOT NULL DEFAULT 0,
    snapshot_desalojados INTEGER NOT NULL DEFAULT 0,
    snapshot_afetados INTEGER NOT NULL DEFAULT 0,
    snapshot_kits_entregues INTEGER NOT NULL DEFAULT 0,
    snapshot_deficit_kits INTEGER NOT NULL DEFAULT 0,
    snapshot_valor_estimado NUMERIC(14,2),
    valor_total_solicitado NUMERIC(14,2) NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'rascunho',
    data_envio TIMESTAMPTZ,
    data_aprovacao TIMESTAMPTZ,
    prazo_prestacao_contas DATE,
    observacoes_cepdec TEXT,
    observacoes_internas TEXT,
    
    -- Campos Sociais/CEPDEC
    assistente_social_nome VARCHAR(150),
    assistente_social_cress VARCHAR(30),
    assistente_social_email VARCHAR(120),
    assistente_social_telefone VARCHAR(20),
    familias_ate_4_pessoas INTEGER NOT NULL DEFAULT 0,
    familias_5_ou_mais_pessoas INTEGER NOT NULL DEFAULT 0,
    familias_cadUnico INTEGER NOT NULL DEFAULT 0,
    familias_rede_socioassistencial INTEGER NOT NULL DEFAULT 0,
    encaminhamentos_cras BOOLEAN NOT NULL DEFAULT FALSE,
    encaminhamentos_creas BOOLEAN NOT NULL DEFAULT FALSE,
    encaminhamentos_acolhimento BOOLEAN NOT NULL DEFAULT FALSE,
    encaminhamentos_aluguel_social BOOLEAN NOT NULL DEFAULT FALSE,
    encaminhamentos_abrigo BOOLEAN NOT NULL DEFAULT FALSE,
    encaminhamentos_outro VARCHAR(100),
    informacoes_adicionais_social TEXT,
    
    -- Campos Ofício
    oficio_numero VARCHAR(30),
    oficio_local VARCHAR(60) DEFAULT 'Santa Maria de Jetibá',
    oficio_qtde_cesta_basica INTEGER NOT NULL DEFAULT 0,
    oficio_qtde_kit_higiene_limpeza INTEGER NOT NULL DEFAULT 0,
    oficio_qtde_colchao INTEGER NOT NULL DEFAULT 0,
    oficio_qtde_jogo_lencol INTEGER NOT NULL DEFAULT 0,
    oficio_qtde_cobertor INTEGER NOT NULL DEFAULT 0,
    oficio_qtde_travesseiro INTEGER NOT NULL DEFAULT 0,
    oficio_qtde_telha INTEGER NOT NULL DEFAULT 0,
    caracteristicas_desastre TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS sah_metas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solicitacao_id UUID NOT NULL REFERENCES sah_solicitacoes(id) ON DELETE CASCADE,
    numero_meta SMALLINT NOT NULL,
    tipo VARCHAR(40) NOT NULL,
    descricao TEXT NOT NULL,
    historico_ocorrencia TEXT,
    localidade VARCHAR(200),
    coord_latitude NUMERIC(10,7),
    coord_longitude NUMERIC(10,7),
    pessoas_beneficiadas INTEGER NOT NULL DEFAULT 0,
    periodo_execucao_dias SMALLINT NOT NULL DEFAULT 30,
    valor_total_meta NUMERIC(14,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sah_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meta_id UUID NOT NULL REFERENCES sah_metas(id) ON DELETE CASCADE,
    numero_item SMALLINT NOT NULL,
    descricao VARCHAR(300) NOT NULL,
    quantidade NUMERIC(10,3) NOT NULL,
    unidade VARCHAR(20) NOT NULL,
    periodo_execucao_dias SMALLINT NOT NULL DEFAULT 30,
    valor_unitario NUMERIC(12,2) NOT NULL,
    valor_total_item NUMERIC(14,2) GENERATED ALWAYS AS (quantidade * valor_unitario) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sah_documentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solicitacao_id UUID NOT NULL REFERENCES sah_solicitacoes(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    nome_arquivo VARCHAR(255),
    caminho_storage VARCHAR(512),
    tamanho_bytes INTEGER,
    mime_type VARCHAR(80),
    gerado_automaticamente BOOLEAN DEFAULT FALSE,
    data_upload TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS sah_historico_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solicitacao_id UUID NOT NULL REFERENCES sah_solicitacoes(id) ON DELETE CASCADE,
    status_anterior VARCHAR(30),
    status_novo VARCHAR(30) NOT NULL,
    observacao TEXT,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    changed_by UUID REFERENCES auth.users(id)
);

-- RLS Setup
ALTER TABLE sah_solicitacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sah_metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sah_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE sah_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE sah_historico_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users on sah_solicitacoes" ON sah_solicitacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users on sah_metas" ON sah_metas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users on sah_itens" ON sah_itens FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users on sah_documentos" ON sah_documentos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users on sah_historico_status" ON sah_historico_status FOR ALL TO authenticated USING (true) WITH CHECK (true);
