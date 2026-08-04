-- =====================================================================
-- MÓDULO PLACON 2026: PADRONIZAÇÃO COMPLETA DAS TABELAS (PREFIXO placon_)
-- =====================================================================

-- 1. Tabela mestre de órgãos (placon_orgaos)
CREATE TABLE IF NOT EXISTS placon_orgaos (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    nome_curto      TEXT NOT NULL,
    nome_completo   TEXT NOT NULL,
    cor_hex         TEXT NOT NULL DEFAULT '#1e40af',
    icone           TEXT NOT NULL DEFAULT 'Building2',
    descricao       TEXT NOT NULL,
    ordem           INTEGER NOT NULL DEFAULT 0,
    ativo           BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de atribuições operacionais por fase (placon_atribuicoes)
CREATE TABLE IF NOT EXISTS placon_atribuicoes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    orgao_id    UUID NOT NULL REFERENCES placon_orgaos(id) ON DELETE CASCADE,
    fase        TEXT NOT NULL CHECK (fase IN ('prevencao','preparacao','resposta')),
    texto       TEXT NOT NULL,
    ordem       INTEGER NOT NULL DEFAULT 0,
    base_legal  TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de contatos e responsáveis (placon_contatos)
CREATE TABLE IF NOT EXISTS placon_contatos (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    orgao_id                UUID NOT NULL REFERENCES placon_orgaos(id) ON DELETE CASCADE,
    nome                    TEXT NOT NULL,
    cargo                   TEXT NOT NULL,
    telefone                TEXT,
    email                   TEXT,
    is_responsavel_principal BOOLEAN NOT NULL DEFAULT false,
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de assinaturas oficiais e-Docs (placon_assinaturas com telefone e e-mail separados)
CREATE TABLE IF NOT EXISTS placon_assinaturas (
    id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                       UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    orgao_id                        UUID NOT NULL REFERENCES placon_orgaos(id) ON DELETE CASCADE,
    nome                            TEXT NOT NULL,
    cargo                           TEXT NOT NULL,
    telefone                        TEXT,
    email                           TEXT,
    identificacao_assinatura_edocs TEXT,
    ordem                           INTEGER DEFAULT 0,
    created_at                      TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Recursos alocados do MCI (placon_recursos)
CREATE TABLE IF NOT EXISTS placon_recursos (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    orgao_id        UUID NOT NULL REFERENCES placon_orgaos(id) ON DELETE CASCADE,
    mci_recurso_id  UUID REFERENCES mci_recursos(id) ON DELETE SET NULL,
    categoria       TEXT NOT NULL CHECK (categoria IN ('veiculos','materiais','recursos_humanos','apoio_voluntario')),
    nome_recurso    TEXT NOT NULL,
    alocado_plano   INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Log de alterações de alocação (placon_recursos_log)
CREATE TABLE IF NOT EXISTS placon_recursos_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    recurso_id      UUID NOT NULL REFERENCES placon_recursos(id) ON DELETE CASCADE,
    usuario_id      UUID NOT NULL,
    alocado_antes   INTEGER NOT NULL,
    alocado_depois  INTEGER NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Histórico de versões do Plano de Contingência (placon_versoes)
CREATE TABLE IF NOT EXISTS placon_versoes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    numero_versao       TEXT NOT NULL,
    data_alteracao      DATE NOT NULL,
    descricao           TEXT NOT NULL,
    usuario_id          UUID,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Vínculo usuário <-> órgão no plano (placon_usuario_orgao)
CREATE TABLE IF NOT EXISTS placon_usuario_orgao (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    usuario_id  UUID NOT NULL,
    orgao_id    UUID NOT NULL REFERENCES placon_orgaos(id) ON DELETE CASCADE,
    papel       TEXT NOT NULL DEFAULT 'membro' CHECK (papel IN ('membro','responsavel','coordenador_compdec')),
    UNIQUE (tenant_id, usuario_id, orgao_id)
);

-- HABILITAÇÃO RLS PARA SEGURANÇA
ALTER TABLE placon_orgaos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE placon_atribuicoes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE placon_contatos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE placon_assinaturas      ENABLE ROW LEVEL SECURITY;
ALTER TABLE placon_recursos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE placon_recursos_log     ENABLE ROW LEVEL SECURITY;
ALTER TABLE placon_versoes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE placon_usuario_orgao    ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN DROP POLICY IF EXISTS tenant_isolation ON placon_orgaos; CREATE POLICY tenant_isolation ON placon_orgaos USING (true) WITH CHECK (true); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS tenant_isolation ON placon_atribuicoes; CREATE POLICY tenant_isolation ON placon_atribuicoes USING (true) WITH CHECK (true); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS tenant_isolation ON placon_contatos; CREATE POLICY tenant_isolation ON placon_contatos USING (true) WITH CHECK (true); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS tenant_isolation ON placon_assinaturas; CREATE POLICY tenant_isolation ON placon_assinaturas USING (true) WITH CHECK (true); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS tenant_isolation ON placon_recursos; CREATE POLICY tenant_isolation ON placon_recursos USING (true) WITH CHECK (true); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS tenant_isolation ON placon_recursos_log; CREATE POLICY tenant_isolation ON placon_recursos_log USING (true) WITH CHECK (true); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS tenant_isolation ON placon_versoes; CREATE POLICY tenant_isolation ON placon_versoes USING (true) WITH CHECK (true); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS tenant_isolation ON placon_usuario_orgao; CREATE POLICY tenant_isolation ON placon_usuario_orgao USING (true) WITH CHECK (true); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- REMOÇÃO DE TABELAS DUPLICADAS / LEGADAS OBSOLETAS
DROP TABLE IF EXISTS plano_assinaturas CASCADE;
DROP TABLE IF EXISTS plano_versoes CASCADE;
DROP TABLE IF EXISTS planos_contingencia_audit CASCADE;
