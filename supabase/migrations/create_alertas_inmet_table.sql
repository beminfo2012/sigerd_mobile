-- ============================================================
-- MIGRAÇÃO: Criação do Módulo de Alertas (INMET)
-- ============================================================

CREATE TABLE IF NOT EXISTS alertas_inmet (
    id              VARCHAR(50) PRIMARY KEY,             -- ID único retornado pelo INMET
    tipo            VARCHAR(120) NOT NULL,              -- tipo/descrição, ex: 'Chuva Intensa'
    severidade      VARCHAR(50) NOT NULL,               -- ex: 'Perigo Potencial', 'Perigo', 'Grande Perigo'
    inicio          TIMESTAMP NOT NULL,                 -- data/hora início do aviso
    fim             TIMESTAMP NOT NULL,                 -- data/hora fim do aviso
    riscos          TEXT,                               -- riscos associados
    instrucoes      TEXT,                               -- instruções para a população
    msg             TEXT,                               -- mensagem geral
    descricao       TEXT,                               -- descrição detalhada
    criado_em       TIMESTAMP NOT NULL DEFAULT now(),
    atualizado_em   TIMESTAMP NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela
ALTER TABLE alertas_inmet ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir leitura pública de alertas_inmet" ON alertas_inmet;
DROP POLICY IF EXISTS "Permitir escrita de alertas_inmet" ON alertas_inmet;

-- Criar políticas públicas
CREATE POLICY "Permitir leitura pública de alertas_inmet" ON alertas_inmet FOR SELECT USING (true);
CREATE POLICY "Permitir escrita de alertas_inmet" ON alertas_inmet FOR ALL USING (true) WITH CHECK (true);
