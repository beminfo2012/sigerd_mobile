-- ============================================
-- SIGERD Mobile - Operational Occurrences
-- Database Migration Script
-- ============================================

-- 1. Create ocorrencias_operacionais table
CREATE TABLE IF NOT EXISTS ocorrencias_operacionais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ocorrencia_id UUID UNIQUE NOT NULL,
    ocorrencia_id_format TEXT NOT NULL, -- e.g. 001/2026
    denominacao TEXT NOT NULL,
    agente TEXT,
    matricula TEXT,
    solicitante TEXT,
    cpf TEXT,
    telefone TEXT,
    tem_solicitante_especifico BOOLEAN DEFAULT FALSE,
    endereco TEXT,
    bairro TEXT,
    data_ocorrencia TEXT,
    horario_ocorrencia TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    accuracy DOUBLE PRECISION,
    gps_timestamp TIMESTAMP WITH TIME ZONE,
    mortos INTEGER DEFAULT 0,
    feridos INTEGER DEFAULT 0,
    enfermos INTEGER DEFAULT 0,
    desalojados INTEGER DEFAULT 0,
    desabrigados INTEGER DEFAULT 0,
    desaparecidos INTEGER DEFAULT 0,
    outros_afetados INTEGER DEFAULT 0,
    tem_danos_humanos BOOLEAN DEFAULT FALSE,
    categoria_risco TEXT,
    nivel_risco TEXT,
    subtipos_risco TEXT[],
    checklist_respostas JSONB DEFAULT '{}'::jsonb,
    descricao_danos TEXT,
    observacoes TEXT,
    fotos JSONB DEFAULT '[]'::jsonb,
    assinatura_agente TEXT,
    assinatura_assistido TEXT,
    tem_apoio_tecnico BOOLEAN DEFAULT FALSE,
    apoio_tecnico JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'finalized',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    id_local INTEGER -- Reference to IndexedDB internal ID if needed
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ocorrencias_format ON ocorrencias_operacionais(ocorrencia_id_format);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_data ON ocorrencias_operacionais(data_ocorrencia);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_bairro ON ocorrencias_operacionais(bairro);

-- 3. Enable RLS
ALTER TABLE ocorrencias_operacionais ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DROP POLICY IF EXISTS "Allow authenticated to read occurrences" ON ocorrencias_operacionais;
CREATE POLICY "Allow authenticated to read occurrences"
    ON ocorrencias_operacionais FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated to insert occurrences" ON ocorrencias_operacionais;
CREATE POLICY "Allow authenticated to insert occurrences"
    ON ocorrencias_operacionais FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('Coordenador de Proteção e Defesa Civil', 'Agente de Defesa Civil', 'Admin', 'Administrador', 'administrador', 'Coordenador', 'Secretário', 'Técnico em Edificações')
        )
    );

DROP POLICY IF EXISTS "Allow authenticated to update occurrences" ON ocorrencias_operacionais;
CREATE POLICY "Allow authenticated to update occurrences"
    ON ocorrencias_operacionais FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('Coordenador de Proteção e Defesa Civil', 'Agente de Defesa Civil', 'Admin', 'Administrador', 'administrador', 'Coordenador', 'Secretário', 'Técnico em Edificações')
        )
    );

COMMENT ON TABLE ocorrencias_operacionais IS 'Operational occurrences registered by civil defense agents';
