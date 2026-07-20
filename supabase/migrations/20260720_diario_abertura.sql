-- Migração para Módulo Diário de Abertura V1
-- Tabelas para captura e medição de fissuras/trincas/rachaduras

CREATE TABLE IF NOT EXISTS abertura_patologica (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    imovel_id UUID,
    vistoria_id UUID,
    noprer_id UUID,
    codigo_ponto VARCHAR(20) NOT NULL,
    localizacao_descricao VARCHAR(255) NOT NULL,
    categoria VARCHAR(20) NOT NULL DEFAULT 'Estrutural',
    status VARCHAR(20) NOT NULL DEFAULT 'ativa', -- ativa, estabilizada, encerrada
    criado_por UUID NOT NULL,
    data_abertura TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_abertura_tenant ON abertura_patologica (tenant_id);
ALTER TABLE abertura_patologica ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS abertura_registro_fotografico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    abertura_id UUID NOT NULL REFERENCES abertura_patologica(id) ON DELETE CASCADE,
    foto_url VARCHAR(500) NOT NULL,
    hash_sha256 VARCHAR(64) NOT NULL,
    data_hora TIMESTAMPTZ NOT NULL,
    fonte_data_hora VARCHAR(50) NOT NULL,
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
    fonte_geolocalizacao VARCHAR(50),
    largura_mm_medida NUMERIC(6,2),
    classificacao_patologia VARCHAR(50),
    fonte_classificacao VARCHAR(30) DEFAULT 'IBAPE-MG',
    metodo_medicao VARCHAR(50) DEFAULT 'manual_agente',
    confianca_deteccao NUMERIC(5,2),
    validado_por UUID,
    validado_em TIMESTAMPTZ,
    observacoes TEXT
);

CREATE INDEX IF NOT EXISTS idx_abertura_registro_tenant ON abertura_registro_fotografico (tenant_id);
ALTER TABLE abertura_registro_fotografico ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Permitir leitura para usuários autenticados do tenant" ON abertura_patologica
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir inserção para usuários autenticados do tenant" ON abertura_patologica
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir atualização para usuários autenticados do tenant" ON abertura_patologica
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir leitura para usuários autenticados do tenant" ON abertura_registro_fotografico
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir inserção para usuários autenticados do tenant" ON abertura_registro_fotografico
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir atualização para usuários autenticados do tenant" ON abertura_registro_fotografico
    FOR UPDATE USING (auth.uid() IS NOT NULL);
