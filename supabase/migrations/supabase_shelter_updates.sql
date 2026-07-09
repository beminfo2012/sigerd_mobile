-- SCRIPT DE ATUALIZAÇÃO DO BANCO DE DADOS (SUPABASE)
-- Execute este script no SQL Editor do Supabase para garantir as colunas de operacao_id 
-- e criar a tabela de histórico de ativação de abrigos.

-- 1. Garante que operacao_id exista nas tabelas de assistência humanitária
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shelter_occupants' AND column_name='operacao_id') THEN 
        ALTER TABLE shelter_occupants ADD COLUMN operacao_id UUID REFERENCES operacao_assistencia_humanitaria(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shelter_donations' AND column_name='operacao_id') THEN 
        ALTER TABLE shelter_donations ADD COLUMN operacao_id UUID REFERENCES operacao_assistencia_humanitaria(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shelter_distributions' AND column_name='operacao_id') THEN 
        ALTER TABLE shelter_distributions ADD COLUMN operacao_id UUID REFERENCES operacao_assistencia_humanitaria(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shelter_inventory' AND column_name='operacao_id') THEN 
        ALTER TABLE shelter_inventory ADD COLUMN operacao_id UUID REFERENCES operacao_assistencia_humanitaria(id) ON DELETE SET NULL;
    END IF;
END $$;


-- 2. Cria a tabela de Histórico de Ativação de Abrigos
CREATE TABLE IF NOT EXISTS shelter_activation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shelter_id UUID REFERENCES shelters(id) ON DELETE CASCADE,
    operacao_id UUID REFERENCES operacao_assistencia_humanitaria(id) ON DELETE SET NULL,
    activation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    inactivation_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active'
);

-- Ativa RLS para a nova tabela
ALTER TABLE shelter_activation_history ENABLE ROW LEVEL SECURITY;

-- Cria política simples para leitura/escrita autenticada (ajuste conforme necessário para seu sistema de RLS)
DROP POLICY IF EXISTS "Enable read/write for authenticated users" ON shelter_activation_history;
CREATE POLICY "Enable read/write for authenticated users" ON shelter_activation_history 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- 3. Garante que o bucket de armazenamento 'shelters' exista
INSERT INTO storage.buckets (id, name, public) 
VALUES ('shelters', 'shelters', true)
ON CONFLICT (id) DO NOTHING;

-- Cria políticas básicas para o bucket (se não existirem)
DROP POLICY IF EXISTS "Acesso publico aos arquivos de shelters" ON storage.objects;
CREATE POLICY "Acesso publico aos arquivos de shelters" ON storage.objects FOR SELECT USING (bucket_id = 'shelters');

DROP POLICY IF EXISTS "Upload autenticado para shelters" ON storage.objects;
CREATE POLICY "Upload autenticado para shelters" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'shelters');
-- =====================================================================
-- Migração: Planta Baixa e Divisões Funcionais dos Abrigos
-- SIGERD — PostgreSQL
-- =====================================================================
-- Aditiva. Não altera nada do módulo de Abrigos já existente.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Catálogo de áreas segundo a doutrina de abrigos humanitários
--    (referência: Manual de Gestão de Abrigos Temporários / Ministério
--    do Desenvolvimento Regional e Cruz Vermelha). Tabela mestre,
--    reutilizável por todos os municípios/abrigos — não é por abrigo.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS catalogo_area_doutrina_abrigo (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo             VARCHAR(40) NOT NULL UNIQUE,   -- ex.: 'triagem', 'alojamento_feminino'
    nome               VARCHAR(120) NOT NULL,
    descricao_funcao   TEXT NOT NULL,                 -- o que a doutrina prevê para essa área
    categoria          VARCHAR(60) NOT NULL,          -- 'acolhimento' | 'saude' | 'apoio' | 'administracao' | 'seguranca'
    icone              VARCHAR(40) NULL,
    ordem_padrao       INTEGER NOT NULL DEFAULT 0,
    ativo              BOOLEAN NOT NULL DEFAULT true
);

-- Seed inicial — ajustar/expandir conforme a doutrina adotada pela
-- CEPDEC-ES / Defesa Civil Nacional.
INSERT INTO catalogo_area_doutrina_abrigo (codigo, nome, descricao_funcao, categoria, ordem_padrao) VALUES
('recepcao_triagem', 'Recepção e Triagem', 'Ponto único de entrada. Cadastro inicial, triagem de saúde e encaminhamento das famílias abrigadas.', 'administracao', 10),
('coordenacao', 'Coordenação do Abrigo', 'Sala de gestão operacional do abrigo, controle de listas e comunicação com a Defesa Civil.', 'administracao', 20),
('alojamento_familiar', 'Alojamento Familiar', 'Área destinada a famílias, preferencialmente com privacidade por meio de divisórias/tendas internas.', 'acolhimento', 30),
('alojamento_masculino', 'Alojamento Masculino', 'Área exclusiva para homens desacompanhados, separada do alojamento feminino.', 'acolhimento', 31),
('alojamento_feminino', 'Alojamento Feminino', 'Área exclusiva para mulheres desacompanhadas, com acesso restrito e monitorado.', 'acolhimento', 32),
('area_criancas', 'Espaço Amigo da Criança', 'Área lúdica e segura para crianças, com supervisão de adulto responsável.', 'acolhimento', 33),
('isolamento_saude', 'Sala de Isolamento / Saúde', 'Atendimento de saúde básico e isolamento de casos suspeitos de doenças transmissíveis.', 'saude', 40),
('sanitarios_masculino', 'Sanitários Masculinos', 'Instalações sanitárias segregadas por sexo, sinalizadas e com acesso facilitado.', 'saude', 41),
('sanitarios_feminino', 'Sanitários Femininos', 'Instalações sanitárias segregadas por sexo, sinalizadas e com acesso facilitado.', 'saude', 42),
('banho', 'Área de Banho', 'Chuveiros segregados por sexo, com escoamento adequado.', 'saude', 43),
('refeitorio', 'Refeitório', 'Área de preparo e/ou distribuição e consumo de refeições.', 'apoio', 50),
('deposito_doacoes', 'Depósito de Doações e Estoque', 'Armazenamento de itens de doação, kits de higiene, cobertores e alimentos não perecíveis.', 'apoio', 51),
('lavanderia', 'Área de Lavanderia', 'Espaço para lavagem e secagem de roupas e roupas de cama.', 'apoio', 52),
('area_animais', 'Área para Animais de Estimação', 'Espaço externo segregado para acomodação de animais de estimação das famílias abrigadas.', 'apoio', 53),
('seguranca_acesso', 'Controle de Acesso / Segurança', 'Ponto de controle de entrada e saída, registro de visitantes.', 'seguranca', 60),
('area_convivio', 'Área de Convívio Comum', 'Espaço comum para socialização e atividades coletivas.', 'acolhimento', 34)
ON CONFLICT (codigo) DO NOTHING;

-- ---------------------------------------------------------------------
-- 2. Planta baixa (arquivo PDF) vinculada ao abrigo — com versionamento
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS abrigo_planta_baixa (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    abrigo_id             UUID NOT NULL REFERENCES shelters(id) ON DELETE CASCADE,
    nome_arquivo_original VARCHAR(255) NOT NULL,
    caminho_storage        VARCHAR(500) NOT NULL,  -- chave/objeto no MinIO/Supabase Storage
    versao                INTEGER NOT NULL DEFAULT 1,
    ativo                 BOOLEAN NOT NULL DEFAULT true,  -- apenas 1 ativo por abrigo
    usuario_upload_id     UUID NULL,
    data_upload           TIMESTAMPTZ NOT NULL DEFAULT now(),
    observacoes           TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_planta_abrigo ON abrigo_planta_baixa (abrigo_id);

-- Apenas uma planta ATIVA por abrigo (histórico de versões preservado
-- com ativo = false).
CREATE UNIQUE INDEX IF NOT EXISTS uq_planta_ativa_por_abrigo
    ON abrigo_planta_baixa (abrigo_id)
    WHERE ativo = true;

-- ---------------------------------------------------------------------
-- 3. Vínculo entre a planta de um abrigo específico e as áreas da
--    doutrina que se aplicam a ele (o operador seleciona quais áreas
--    do catálogo existem naquela planta específica, e opcionalmente
--    anota a legenda/localização, ex.: "Sala 4 - fundo do pátio").
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS abrigo_planta_area_vinculada (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    abrigo_planta_id      UUID NOT NULL REFERENCES abrigo_planta_baixa(id),
    area_doutrina_id      UUID NOT NULL REFERENCES catalogo_area_doutrina_abrigo(id),
    identificador_planta  VARCHAR(60) NULL,   -- ex.: "Sala 4", "Ala B" — como está rotulado na prancha
    observacao            TEXT NULL,
    ordem                 INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_area_vinculada_planta ON abrigo_planta_area_vinculada (abrigo_planta_id);

-- Ativa RLS e cria políticas para as novas tabelas
ALTER TABLE catalogo_area_doutrina_abrigo ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura para autenticados" ON catalogo_area_doutrina_abrigo;
CREATE POLICY "Permitir leitura para autenticados" ON catalogo_area_doutrina_abrigo FOR SELECT TO authenticated USING (true);

ALTER TABLE abrigo_planta_baixa ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tudo para autenticados" ON abrigo_planta_baixa;
CREATE POLICY "Permitir tudo para autenticados" ON abrigo_planta_baixa FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE abrigo_planta_area_vinculada ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tudo para autenticados" ON abrigo_planta_area_vinculada;
CREATE POLICY "Permitir tudo para autenticados" ON abrigo_planta_area_vinculada FOR ALL TO authenticated USING (true) WITH CHECK (true);

COMMIT;

-- =====================================================================
-- Rollback:
-- BEGIN;
-- DROP TABLE IF EXISTS abrigo_planta_area_vinculada;
-- DROP TABLE IF EXISTS abrigo_planta_baixa;
-- DROP TABLE IF EXISTS catalogo_area_doutrina_abrigo;
-- COMMIT;
-- =====================================================================


ALTER TABLE abrigo_planta_area_vinculada ADD COLUMN IF NOT EXISTS coordenadas_json JSONB NULL;

DROP INDEX IF EXISTS uq_planta_ativa_por_abrigo;
