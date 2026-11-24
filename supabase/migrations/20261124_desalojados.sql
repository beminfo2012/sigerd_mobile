-- ============================================
-- SIGERD Mobile - Gestão de Desalojados
-- Pessoas / Famílias desalojadas (fora de abrigos públicos)
-- ============================================

CREATE TABLE IF NOT EXISTS desalojados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    desalojado_id TEXT UNIQUE NOT NULL,
    operacao_id UUID,
    responsavel_nome TEXT NOT NULL,
    cpf TEXT,
    telefone TEXT,
    qtd_pessoas INTEGER NOT NULL DEFAULT 1,
    qtd_adultos INTEGER DEFAULT 0,
    qtd_criancas INTEGER DEFAULT 0,
    qtd_idosos INTEGER DEFAULT 0,
    qtd_pcd INTEGER DEFAULT 0,
    bairro_origem TEXT,
    endereco_origem TEXT,
    tipo_acolhimento TEXT DEFAULT 'Casa de Parentes',
    local_acolhimento TEXT,
    motivo TEXT DEFAULT 'Alagamento',
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'retornou', 'encaminhado_abrigo', 'deleted')),
    data_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_retorno TIMESTAMP WITH TIME ZONE,
    observacoes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced BOOLEAN DEFAULT TRUE
);

COMMENT ON TABLE desalojados IS 'Registro de pessoas e famílias desalojadas (em casa de parentes, amigos ou aluguel social)';

CREATE INDEX IF NOT EXISTS idx_desalojados_status ON desalojados(status);
CREATE INDEX IF NOT EXISTS idx_desalojados_operacao ON desalojados(operacao_id);
CREATE INDEX IF NOT EXISTS idx_desalojados_data ON desalojados(data_registro);

ALTER TABLE desalojados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read desalojados" ON desalojados;
CREATE POLICY "Allow authenticated users to read desalojados"
    ON desalojados FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert desalojados" ON desalojados;
CREATE POLICY "Allow authenticated users to insert desalojados"
    ON desalojados FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update desalojados" ON desalojados;
CREATE POLICY "Allow authenticated users to update desalojados"
    ON desalojados FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete desalojados" ON desalojados;
CREATE POLICY "Allow authenticated users to delete desalojados"
    ON desalojados FOR DELETE
    TO authenticated
    USING (true);
