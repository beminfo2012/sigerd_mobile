-- Migration para Ocorrencias v3.0

-- 1. Adicionar novas colunas na tabela ocorrencias_operacionais
ALTER TABLE ocorrencias_operacionais
ADD COLUMN IF NOT EXISTS risco_pessoas_estruturas BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS orgao_solicitado TEXT DEFAULT 'Defesa Civil',
ADD COLUMN IF NOT EXISTS orgao_atendeu TEXT DEFAULT 'Defesa Civil',
ADD COLUMN IF NOT EXISTS tipo_ocorrencia TEXT,
ADD COLUMN IF NOT EXISTS nivel_gravidade TEXT,
ADD COLUMN IF NOT EXISTS encaminhada BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS horario_encaminhamento TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS numero_ocorrencia_externa TEXT,
ADD COLUMN IF NOT EXISTS observacao_encaminhamento TEXT,
ADD COLUMN IF NOT EXISTS historico_status JSONB DEFAULT '[]'::jsonb;

-- 2. Migração de dados existentes
-- Define risco_pessoas_estruturas = true para ocorrências antigas que já têm COBRADE/categoria_risco
UPDATE ocorrencias_operacionais
SET risco_pessoas_estruturas = TRUE
WHERE categoria_risco IS NOT NULL AND categoria_risco != '';

-- Define órgãos default para registros antigos
UPDATE ocorrencias_operacionais
SET orgao_solicitado = 'Defesa Civil',
    orgao_atendeu = 'Defesa Civil'
WHERE orgao_solicitado IS NULL;

-- 3. Atualizar o schema cache do Supabase para refletir as novas colunas
NOTIFY pgrst, 'reload schema';
