-- ============================================================
-- MIGRAÇÃO: Criação do Módulo de Mapeamento de Capacidade Instalada (MCI)
-- ============================================================

-- 1. TABELA PRINCIPAL: mci_recursos
CREATE TABLE IF NOT EXISTS mci_recursos (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome                VARCHAR(150) NOT NULL,
    categoria           VARCHAR(30) NOT NULL, -- VEICULO, EQUIPAMENTO, ESTOQUE, PROFISSIONAL, INSTALACAO
    status              VARCHAR(30) NOT NULL DEFAULT 'DISPONIVEL', -- DISPONIVEL, EM_MANUTENCAO, EM_USO, OCUPADO, EM_REFORMA
    secretaria_id       VARCHAR(100) NOT NULL, -- Pasta responsável pelo recurso (ex: 'Obras', 'Saúde', 'Defesa Civil')
    detalhes            JSONB NOT NULL DEFAULT '{}'::jsonb, -- Atributos dinâmicos específicos da categoria
    ultima_atualizacao  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    atualizado_by       UUID REFERENCES auth.users(id),
    criado_em           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    atualizado_em       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    CONSTRAINT chk_mci_categoria CHECK (categoria IN ('VEICULO', 'EQUIPAMENTO', 'ESTOQUE', 'PROFISSIONAL', 'INSTALACAO')),
    CONSTRAINT chk_mci_status CHECK (status IN ('DISPONIVEL', 'EM_MANUTENCAO', 'EM_USO', 'OCUPADO', 'EM_REFORMA'))
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_mci_recursos_busca_rapida 
ON mci_recursos (categoria, status, secretaria_id);

CREATE INDEX IF NOT EXISTS idx_mci_recursos_detalhes_gin 
ON mci_recursos USING gin (detalhes);

-- 2. TABELA: mci_requisicoes (Solicitações da COMPDEC em eventos ativos)
CREATE TABLE IF NOT EXISTS mci_requisicoes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recurso_id      UUID NOT NULL REFERENCES mci_recursos(id) ON DELETE CASCADE,
    evento_id       UUID NOT NULL, -- FK lógica para ocorrencia_id
    status          VARCHAR(30) NOT NULL DEFAULT 'SOLICITADO', -- SOLICITADO, APROVADO, REJEITADO, FINALIZADO
    justificativa   TEXT NOT NULL,
    solicitado_por  UUID NOT NULL REFERENCES auth.users(id),
    criado_em       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    atualizado_em   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    CONSTRAINT chk_mci_req_status CHECK (status IN ('SOLICITADO', 'APROVADO', 'REJEITADO', 'FINALIZADO'))
);

CREATE INDEX IF NOT EXISTS idx_mci_requisicoes_evento ON mci_requisicoes (evento_id);

-- 3. TABELA: mci_log_auditoria
CREATE TABLE IF NOT EXISTS mci_log_auditoria (
    id                  BIGSERIAL PRIMARY KEY,
    recurso_id          UUID NOT NULL,
    usuario_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    acao                VARCHAR(40) NOT NULL, -- CRIAR, ATUALIZAR, EXCLUIR, REQUISITAR, ATUALIZAR_STATUS
    dados_anteriores    JSONB,
    dados_novos         JSONB,
    criado_em           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mci_log_auditoria_recurso ON mci_log_auditoria (recurso_id);

-- 4. TRIGGER: Auditoria Automática de Alterações
CREATE OR REPLACE FUNCTION fn_mci_auditoria_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO mci_log_auditoria (recurso_id, usuario_id, acao, dados_novos)
        VALUES (NEW.id, NEW.atualizado_by, 'CRIAR', row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO mci_log_auditoria (recurso_id, usuario_id, acao, dados_anteriores, dados_novos)
        VALUES (NEW.id, NEW.atualizado_by, 'ATUALIZAR', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO mci_log_auditoria (recurso_id, usuario_id, acao, dados_anteriores)
        VALUES (OLD.id, auth.uid(), 'EXCLUIR', row_to_json(OLD)::jsonb);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_mci_recursos_auditoria
AFTER INSERT OR UPDATE OR DELETE ON mci_recursos
FOR EACH ROW EXECUTE FUNCTION fn_mci_auditoria_trigger();

-- 5. SEGURANÇA (RLS - Row Level Security)
ALTER TABLE mci_recursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mci_requisicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mci_log_auditoria ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para mci_recursos
-- Leitura pública para todos os usuários logados do sistema
CREATE POLICY "Permitir leitura geral de recursos" 
ON mci_recursos FOR SELECT 
USING (true);

-- Permite inserção/atualização/deleção para a COMPDEC ou para a secretaria dona do recurso
CREATE POLICY "Permitir inserção de recursos pela própria secretaria ou COMPDEC"
ON mci_recursos FOR INSERT
WITH CHECK (
    (coalesce(auth.jwt() -> 'user_metadata' ->> 'secretaria', '') = secretaria_id) OR
    (coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'COMPDEC')
);

CREATE POLICY "Permitir atualização de recursos pela própria secretaria ou COMPDEC"
ON mci_recursos FOR UPDATE
USING (
    (coalesce(auth.jwt() -> 'user_metadata' ->> 'secretaria', '') = secretaria_id) OR
    (coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'COMPDEC')
)
WITH CHECK (
    (coalesce(auth.jwt() -> 'user_metadata' ->> 'secretaria', '') = secretaria_id) OR
    (coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'COMPDEC')
);

CREATE POLICY "Permitir exclusão de recursos pela própria secretaria ou COMPDEC"
ON mci_recursos FOR DELETE
USING (
    (coalesce(auth.jwt() -> 'user_metadata' ->> 'secretaria', '') = secretaria_id) OR
    (coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'COMPDEC')
);

-- Políticas de RLS para mci_requisicoes
CREATE POLICY "Permitir leitura geral de requisicoes"
ON mci_requisicoes FOR SELECT
USING (true);

CREATE POLICY "Permitir que apenas a COMPDEC crie requisições"
ON mci_requisicoes FOR INSERT
WITH CHECK (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'COMPDEC'
);

CREATE POLICY "Permitir atualização de requisição pelos envolvidos"
ON mci_requisicoes FOR UPDATE
USING (
    (coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'COMPDEC') OR
    EXISTS (
        SELECT 1 FROM mci_recursos r 
        WHERE r.id = recurso_id 
        AND r.secretaria_id = coalesce(auth.jwt() -> 'user_metadata' ->> 'secretaria', '')
    )
);

-- Políticas de RLS para mci_log_auditoria
CREATE POLICY "Permitir leitura de logs de auditoria pela COMPDEC"
ON mci_log_auditoria FOR SELECT
USING (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'COMPDEC'
);
