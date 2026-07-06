-- Migration: Gestão de Operações de Assistência Humanitária
-- Data: 2026-07-06

-- 1. Nova tabela: operacao_assistencia_humanitaria
CREATE TABLE IF NOT EXISTS operacao_assistencia_humanitaria (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                        VARCHAR(255)  NOT NULL,
  evento_relacionado_id       UUID, -- References eventos(id) if it exists, otherwise redap_registros(id) or similar
  tipo_desastre               VARCHAR(100)  NOT NULL,
  cobrade                     VARCHAR(20)   NOT NULL,
  municipio_id                UUID          NOT NULL, -- Adjust based on your general auth / user / geo structure
  localidade_afetada          TEXT,
  processo_administrativo     VARCHAR(100),
  numero_decreto              VARCHAR(100),
  coordenador_responsavel_id  UUID          REFERENCES auth.users(id),
  data_hora_inicio            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  data_hora_encerramento      TIMESTAMPTZ,
  descricao                   TEXT,
  status                      VARCHAR(20)   NOT NULL DEFAULT 'em_andamento'
                              CHECK (status IN ('em_andamento','encerrada','reaberta')),
  usuario_encerramento_id     UUID          REFERENCES auth.users(id),
  parecer_final               TEXT,
  created_at                  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Index unico parcial
CREATE UNIQUE INDEX IF NOT EXISTS idx_operacao_municipio_ativa
  ON operacao_assistencia_humanitaria(municipio_id)
  WHERE status = 'em_andamento';

-- 2. Nova tabela: operacao_diario
CREATE TABLE IF NOT EXISTS operacao_diario (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operacao_id            UUID         NOT NULL REFERENCES operacao_assistencia_humanitaria(id) ON DELETE CASCADE,
  data_hora              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  descricao              TEXT         NOT NULL,
  origem                 VARCHAR(10)  NOT NULL CHECK (origem IN ('automatico','manual')),
  usuario_id             UUID         REFERENCES auth.users(id),
  entidade_referencia    VARCHAR(50),
  entidade_referencia_id UUID,
  created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_operacao_diario_operacao ON operacao_diario(operacao_id);
CREATE INDEX IF NOT EXISTS idx_operacao_diario_data     ON operacao_diario(data_hora DESC);

-- 3. Adicionar operacao_id nas tabelas existentes
-- Obs: as tabelas devem existir no banco. 
-- Usamos bloco DO para ignorar se a tabela não existir, evitando erro de migração.

DO $$
BEGIN
  BEGIN
    ALTER TABLE abrigos ADD COLUMN operacao_id UUID REFERENCES operacao_assistencia_humanitaria(id);
    CREATE INDEX idx_abrigos_operacao ON abrigos(operacao_id) WHERE operacao_id IS NOT NULL;
  EXCEPTION WHEN others THEN END;

  BEGIN
    ALTER TABLE abrigos_ocupacao ADD COLUMN operacao_id UUID REFERENCES operacao_assistencia_humanitaria(id);
  EXCEPTION WHEN others THEN END;

  BEGIN
    ALTER TABLE estoque_movimentacoes ADD COLUMN operacao_id UUID REFERENCES operacao_assistencia_humanitaria(id);
    CREATE INDEX idx_estoque_mov_operacao ON estoque_movimentacoes(operacao_id) WHERE operacao_id IS NOT NULL;
  EXCEPTION WHEN others THEN END;

  BEGIN
    ALTER TABLE doacoes ADD COLUMN operacao_id UUID REFERENCES operacao_assistencia_humanitaria(id);
    CREATE INDEX idx_doacoes_operacao ON doacoes(operacao_id) WHERE operacao_id IS NOT NULL;
  EXCEPTION WHEN others THEN END;

  BEGIN
    ALTER TABLE logistica_distribuicoes ADD COLUMN operacao_id UUID REFERENCES operacao_assistencia_humanitaria(id);
    CREATE INDEX idx_logistica_dist_operacao ON logistica_distribuicoes(operacao_id) WHERE operacao_id IS NOT NULL;
  EXCEPTION WHEN others THEN END;

  BEGIN
    ALTER TABLE logistica_entregas ADD COLUMN operacao_id UUID REFERENCES operacao_assistencia_humanitaria(id);
  EXCEPTION WHEN others THEN END;

  BEGIN
    ALTER TABLE logistica_transferencias ADD COLUMN operacao_id UUID REFERENCES operacao_assistencia_humanitaria(id);
  EXCEPTION WHEN others THEN END;

  BEGIN
    ALTER TABLE logistica_rotas ADD COLUMN operacao_id UUID REFERENCES operacao_assistencia_humanitaria(id);
  EXCEPTION WHEN others THEN END;

  BEGIN
    ALTER TABLE contratos_emergenciais ADD COLUMN operacao_id UUID REFERENCES operacao_assistencia_humanitaria(id);
    CREATE INDEX idx_contratos_emerg_operacao ON contratos_emergenciais(operacao_id) WHERE operacao_id IS NOT NULL;
  EXCEPTION WHEN others THEN END;

  BEGIN
    ALTER TABLE contratos_fornecedores ADD COLUMN operacao_id UUID REFERENCES operacao_assistencia_humanitaria(id);
  EXCEPTION WHEN others THEN END;

  BEGIN
    ALTER TABLE contratos_empenhos ADD COLUMN operacao_id UUID REFERENCES operacao_assistencia_humanitaria(id);
  EXCEPTION WHEN others THEN END;

  BEGIN
    ALTER TABLE solicitacoes_assistencia ADD COLUMN operacao_id UUID REFERENCES operacao_assistencia_humanitaria(id);
    CREATE INDEX idx_solicitacoes_operacao ON solicitacoes_assistencia(operacao_id) WHERE operacao_id IS NOT NULL;
  EXCEPTION WHEN others THEN END;

  -- Para sah_solicitacoes (módulo recente SAH)
  BEGIN
    ALTER TABLE sah_solicitacoes ADD COLUMN operacao_id UUID REFERENCES operacao_assistencia_humanitaria(id);
    CREATE INDEX idx_sah_solicitacoes_operacao ON sah_solicitacoes(operacao_id) WHERE operacao_id IS NOT NULL;
  EXCEPTION WHEN others THEN END;

  BEGIN
    ALTER TABLE relatorios_gerados ADD COLUMN operacao_id UUID REFERENCES operacao_assistencia_humanitaria(id);
  EXCEPTION WHEN others THEN END;

  BEGIN
    ALTER TABLE documentos_anexos ADD COLUMN operacao_id UUID REFERENCES operacao_assistencia_humanitaria(id);
  EXCEPTION WHEN others THEN END;

  BEGIN
    ALTER TABLE fotografias ADD COLUMN operacao_id UUID REFERENCES operacao_assistencia_humanitaria(id);
  EXCEPTION WHEN others THEN END;
END $$;

-- Configurar RLS (Row Level Security)
ALTER TABLE operacao_assistencia_humanitaria ENABLE ROW LEVEL SECURITY;
ALTER TABLE operacao_diario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Operacoes sao visiveis para todos autenticados" 
ON operacao_assistencia_humanitaria FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Permite insercao de operacoes" 
ON operacao_assistencia_humanitaria FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Permite atualizacao de operacoes" 
ON operacao_assistencia_humanitaria FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Diario visivel para todos autenticados" 
ON operacao_diario FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Permite insercao no diario" 
ON operacao_diario FOR INSERT 
TO authenticated 
WITH CHECK (true);
