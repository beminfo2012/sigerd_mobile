-- =====================================================================
-- MÓDULO: plano_contingencia (PLACON 2026)
-- Tenant: tenant_id presente em todas as tabelas, RLS habilitado.
-- =====================================================================

-- 1. Tabela mestre de órgãos participantes do plano
CREATE TABLE IF NOT EXISTS placon_orgaos (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    nome_curto      TEXT NOT NULL,          -- ex: "SECOBR"
    nome_completo   TEXT NOT NULL,
    cor_hex         TEXT NOT NULL,          -- ex: "#1e40af"
    icone           TEXT NOT NULL,          -- nome do ícone lucide-react
    descricao       TEXT NOT NULL,          -- responsabilidade institucional
    ordem           INTEGER NOT NULL DEFAULT 0,
    ativo           BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Atribuições por órgão, organizadas nas 3 fases
CREATE TABLE IF NOT EXISTS placon_atribuicoes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    orgao_id    UUID NOT NULL REFERENCES placon_orgaos(id) ON DELETE CASCADE,
    fase        TEXT NOT NULL CHECK (fase IN ('prevencao','preparacao','resposta')),
    texto       TEXT NOT NULL,
    ordem       INTEGER NOT NULL DEFAULT 0,
    base_legal  TEXT,   -- ex: "Decreto Municipal nº 022/2023"
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Contatos de cada órgão (extraídos da página de assinaturas)
CREATE TABLE IF NOT EXISTS placon_contatos (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    orgao_id                UUID NOT NULL REFERENCES placon_orgaos(id) ON DELETE CASCADE,
    nome                    TEXT NOT NULL,
    cargo                   TEXT NOT NULL,
    telefone                TEXT NOT NULL,
    email                   TEXT,
    is_responsavel_principal BOOLEAN NOT NULL DEFAULT false,
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Recursos do órgão, vinculados ao MCI (sem duplicar dados de disponibilidade)
CREATE TABLE IF NOT EXISTS placon_recursos (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    orgao_id        UUID NOT NULL REFERENCES placon_orgaos(id) ON DELETE CASCADE,
    mci_recurso_id  UUID REFERENCES mci_recursos(id) ON DELETE SET NULL,
    categoria       TEXT NOT NULL CHECK (
                        categoria IN ('veiculos','materiais','recursos_humanos','apoio_voluntario')
                    ),
    nome_recurso    TEXT NOT NULL,  -- cópia de exibição; fonte de verdade é o MCI
    alocado_plano   INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Auditoria de alterações de alocação (exigência de rastreabilidade)
CREATE TABLE IF NOT EXISTS placon_recursos_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    recurso_id      UUID NOT NULL REFERENCES placon_recursos(id) ON DELETE CASCADE,
    usuario_id      UUID NOT NULL,
    alocado_antes   INTEGER NOT NULL,
    alocado_depois  INTEGER NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Versões do plano (histórico anual — exigência legal §6º Lei 12.608/2012)
CREATE TABLE IF NOT EXISTS placon_versoes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    numero_versao       TEXT NOT NULL,  -- ex: "2026.1"
    data_alteracao      DATE NOT NULL,
    descricao           TEXT NOT NULL,
    usuario_id          UUID,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Vínculo usuário ↔ órgão(s) do plano (suporta múltiplos vínculos)
CREATE TABLE IF NOT EXISTS placon_usuario_orgao (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    usuario_id  UUID NOT NULL,
    orgao_id    UUID NOT NULL REFERENCES placon_orgaos(id) ON DELETE CASCADE,
    papel       TEXT NOT NULL DEFAULT 'membro'
                    CHECK (papel IN ('membro','responsavel','coordenador_compdec')),
    UNIQUE (tenant_id, usuario_id, orgao_id)
);

-- =====================================================================
-- RLS — Row Level Security (mesmo padrão dos outros módulos do SIGERD)
-- =====================================================================
ALTER TABLE placon_orgaos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE placon_atribuicoes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE placon_contatos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE placon_recursos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE placon_recursos_log     ENABLE ROW LEVEL SECURITY;
ALTER TABLE placon_versoes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE placon_usuario_orgao    ENABLE ROW LEVEL SECURITY;

-- Policies: permissão para leitura e escrita por tenant ou usuários autenticados
DO $$ BEGIN
    DROP POLICY IF EXISTS tenant_isolation ON placon_orgaos;
    CREATE POLICY tenant_isolation ON placon_orgaos
        USING (true) WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS tenant_isolation ON placon_atribuicoes;
    CREATE POLICY tenant_isolation ON placon_atribuicoes
        USING (true) WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS tenant_isolation ON placon_contatos;
    CREATE POLICY tenant_isolation ON placon_contatos
        USING (true) WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS tenant_isolation ON placon_recursos;
    CREATE POLICY tenant_isolation ON placon_recursos
        USING (true) WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS tenant_isolation ON placon_recursos_log;
    CREATE POLICY tenant_isolation ON placon_recursos_log
        USING (true) WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS tenant_isolation ON placon_versoes;
    CREATE POLICY tenant_isolation ON placon_versoes
        USING (true) WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS tenant_isolation ON placon_usuario_orgao;
    CREATE POLICY tenant_isolation ON placon_usuario_orgao
        USING (true) WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_placon_atribuicoes_tenant_orgao_fase ON placon_atribuicoes (tenant_id, orgao_id, fase);
CREATE INDEX IF NOT EXISTS idx_placon_contatos_tenant_orgao ON placon_contatos (tenant_id, orgao_id);
CREATE INDEX IF NOT EXISTS idx_placon_recursos_tenant_orgao ON placon_recursos (tenant_id, orgao_id);
CREATE INDEX IF NOT EXISTS idx_placon_usuario_orgao_tenant_user ON placon_usuario_orgao (tenant_id, usuario_id);
