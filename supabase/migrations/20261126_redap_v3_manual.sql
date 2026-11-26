-- ============================================================================
-- SIGERD - MÓDULO REDAP V3 (Manual de Implementação v1.0)
-- Arquitetura relacional normalizada, versionamento de modelos, workflow
-- completo, pendências por seção/registro, auditoria imutável e RLS.
-- Reaproveita public.eventos_desastre e public.profiles existentes.
-- ============================================================================

-- 1. MODELOS PARAMETRIZÁVEIS POR SECRETARIA (VERSIONADOS)
CREATE TABLE IF NOT EXISTS public.redap_modelos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    secretaria_key text NOT NULL,
    secretaria_nome text NOT NULL,
    nome text NOT NULL,
    versao integer NOT NULL DEFAULT 1,
    configuracao_json jsonb NOT NULL DEFAULT '{}'::jsonb,
    ativo boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT uq_redap_modelos_tenant_sec_versao UNIQUE (tenant_id, secretaria_key, versao)
);

-- 2. RELATÓRIOS SETORIAIS POR EVENTO + SECRETARIA
CREATE TABLE IF NOT EXISTS public.redap_relatorios (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    evento_id uuid NOT NULL REFERENCES public.eventos_desastre(id) ON DELETE CASCADE,
    secretaria_key text NOT NULL,
    secretaria_nome text NOT NULL,
    modelo_id uuid REFERENCES public.redap_modelos(id),
    modelo_versao integer NOT NULL DEFAULT 1,
    status text NOT NULL DEFAULT 'NAO_INICIADO' CHECK (
        status IN ('NAO_INICIADO', 'EM_PREENCHIMENTO', 'ENVIADO', 'EM_ANALISE', 'DEVOLVIDO', 'APROVADO', 'CANCELADO')
    ),
    progresso integer NOT NULL DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
    responsavel_id uuid REFERENCES public.profiles(id),
    responsavel_nome text,
    responsavel_cargo text,
    responsavel_telefone text,
    responsavel_email text,
    prazo_envio timestamp with time zone,
    introducao_texto text,
    introducao_ia_gerada boolean NOT NULL DEFAULT false,
    introducao_confirmada_por text,
    introducao_confirmada_em timestamp with time zone,
    consideracoes_texto text,
    consideracoes_ia_gerada boolean NOT NULL DEFAULT false,
    consideracoes_confirmada_por text,
    consideracoes_confirmada_em timestamp with time zone,
    declaracao_responsabilidade boolean NOT NULL DEFAULT false,
    dados_complementares jsonb NOT NULL DEFAULT '{}'::jsonb,
    enviado_em timestamp with time zone,
    enviado_por text,
    aprovado_em timestamp with time zone,
    aprovado_por text,
    motivo_cancelamento text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RF03: Impede mais de um relatório ativo para o mesmo evento + secretaria
CREATE UNIQUE INDEX IF NOT EXISTS uq_redap_relatorios_ativo
    ON public.redap_relatorios (evento_id, secretaria_key)
    WHERE status <> 'CANCELADO';

CREATE INDEX IF NOT EXISTS idx_redap_relatorios_evento ON public.redap_relatorios(evento_id);
CREATE INDEX IF NOT EXISTS idx_redap_relatorios_status ON public.redap_relatorios(status);
CREATE INDEX IF NOT EXISTS idx_redap_relatorios_secretaria ON public.redap_relatorios(secretaria_key);

-- 3. DANOS ESTRUTURADOS (HUMANOS, INFRAESTRUTURA, EDIFICAÇÕES)
CREATE TABLE IF NOT EXISTS public.redap_danos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    relatorio_id uuid NOT NULL REFERENCES public.redap_relatorios(id) ON DELETE CASCADE,
    secao text NOT NULL, -- DANOS_HUMANOS | DANOS_INFRAESTRUTURA | DANOS_EDIFICACOES
    categoria text,
    item text NOT NULL,
    quantidade integer CHECK (quantidade IS NULL OR quantidade >= 0),
    quantidade_danificada integer CHECK (quantidade_danificada IS NULL OR quantidade_danificada >= 0),
    quantidade_destruida integer CHECK (quantidade_destruida IS NULL OR quantidade_destruida >= 0),
    valor_estimado numeric(14, 2) CHECK (valor_estimado IS NULL OR valor_estimado >= 0),
    localidade text,
    endereco text,
    latitude double precision,
    longitude double precision,
    descricao text,
    situacao_informacao text NOT NULL DEFAULT 'INFORMADO' CHECK (
        situacao_informacao IN ('INFORMADO', 'NAO_HOUVE_OCORRENCIA', 'NAO_SE_APLICA')
    ),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_redap_danos_relatorio ON public.redap_danos(relatorio_id);

-- 4. PREJUÍZOS ECONÔMICOS PÚBLICOS
CREATE TABLE IF NOT EXISTS public.redap_prejuizos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    relatorio_id uuid NOT NULL REFERENCES public.redap_relatorios(id) ON DELETE CASCADE,
    servico text NOT NULL,
    valor_estimado numeric(14, 2) CHECK (valor_estimado IS NULL OR valor_estimado >= 0),
    localidade text,
    descricao text,
    situacao_informacao text NOT NULL DEFAULT 'INFORMADO' CHECK (
        situacao_informacao IN ('INFORMADO', 'NAO_HOUVE_OCORRENCIA', 'NAO_SE_APLICA')
    ),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_redap_prejuizos_relatorio ON public.redap_prejuizos(relatorio_id);

-- 5. ATUAÇÃO DO ÓRGÃO — PESSOAS E EQUIPES
CREATE TABLE IF NOT EXISTS public.redap_equipes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    relatorio_id uuid NOT NULL REFERENCES public.redap_relatorios(id) ON DELETE CASCADE,
    tipo_acao text NOT NULL,
    quantidade_servidores integer NOT NULL DEFAULT 0 CHECK (quantidade_servidores >= 0),
    descricao_atividade text,
    local text,
    data_inicio date,
    data_fim date,
    status_acao text NOT NULL DEFAULT 'REALIZADA' CHECK (status_acao IN ('REALIZADA', 'EM_ANDAMENTO')),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_redap_equipes_relatorio ON public.redap_equipes(relatorio_id);

-- 6. ATUAÇÃO DO ÓRGÃO — MATERIAIS E EQUIPAMENTOS
CREATE TABLE IF NOT EXISTS public.redap_recursos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    relatorio_id uuid NOT NULL REFERENCES public.redap_relatorios(id) ON DELETE CASCADE,
    tipo text NOT NULL,
    nome text NOT NULL,
    quantidade numeric(12, 2) NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
    unidade text NOT NULL DEFAULT 'un.',
    local text,
    finalidade text,
    periodo text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_redap_recursos_relatorio ON public.redap_recursos(relatorio_id);

-- 7. ATUAÇÃO DO ÓRGÃO — RECURSOS FINANCEIROS / DESPESAS
CREATE TABLE IF NOT EXISTS public.redap_despesas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    relatorio_id uuid NOT NULL REFERENCES public.redap_relatorios(id) ON DELETE CASCADE,
    fonte text NOT NULL,
    tipo_despesa text NOT NULL,
    valor numeric(14, 2) NOT NULL DEFAULT 0 CHECK (valor >= 0),
    descricao text,
    documento_ref text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_redap_despesas_relatorio ON public.redap_despesas(relatorio_id);

-- 8. ANEXOS / RELATÓRIO FOTOGRÁFICO
CREATE TABLE IF NOT EXISTS public.redap_anexos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    relatorio_id uuid NOT NULL REFERENCES public.redap_relatorios(id) ON DELETE CASCADE,
    registro_relacionado_id uuid,
    secao text,
    storage_path text,
    url_preview text,
    nome_arquivo text,
    tipo_mime text,
    tamanho_bytes integer,
    data_foto timestamp with time zone DEFAULT now(),
    latitude double precision,
    longitude double precision,
    descricao text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_redap_anexos_relatorio ON public.redap_anexos(relatorio_id);

-- 9. PENDÊNCIAS DE ANÁLISE (DEFESA CIVIL -> SECRETARIA)
CREATE TABLE IF NOT EXISTS public.redap_pendencias (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    relatorio_id uuid NOT NULL REFERENCES public.redap_relatorios(id) ON DELETE CASCADE,
    secao text NOT NULL,
    campo_ou_registro_id text,
    descricao text NOT NULL,
    situacao text NOT NULL DEFAULT 'ABERTA' CHECK (situacao IN ('ABERTA', 'RESOLVIDA')),
    criado_por uuid REFERENCES public.profiles(id),
    criado_por_nome text,
    resolvido_em timestamp with time zone,
    resolvido_por text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_redap_pendencias_relatorio ON public.redap_pendencias(relatorio_id);

-- 10. HISTÓRICO IMUTÁVEL DE AUDITORIA
CREATE TABLE IF NOT EXISTS public.redap_historico (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    relatorio_id uuid REFERENCES public.redap_relatorios(id) ON DELETE CASCADE,
    evento_id uuid REFERENCES public.eventos_desastre(id) ON DELETE CASCADE,
    usuario_id uuid REFERENCES public.profiles(id),
    usuario_nome text NOT NULL,
    acao text NOT NULL,
    status_anterior text,
    status_novo text,
    observacao text,
    criado_em timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_redap_historico_relatorio ON public.redap_historico(relatorio_id);
CREATE INDEX IF NOT EXISTS idx_redap_historico_evento ON public.redap_historico(evento_id);

-- 11. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.redap_modelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redap_relatorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redap_danos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redap_prejuizos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redap_equipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redap_recursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redap_despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redap_anexos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redap_pendencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redap_historico ENABLE ROW LEVEL SECURITY;

-- Função auxiliar segura para verificar se o usuário é da Defesa Civil / Gestor REDAP
CREATE OR REPLACE FUNCTION public.is_redap_defesa_civil()
RETURNS boolean AS $$
BEGIN
    RETURN public.get_current_user_role() IN (
        'Admin', 'Administrador', 'administrador', 'admin',
        'Coordenador', 'Coordenador de Proteção e Defesa Civil',
        'Agente de Defesa Civil', 'Redap_Geral'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Modelos: leitura para autenticados, gestão para Defesa Civil
DROP POLICY IF EXISTS "redap_modelos_select" ON public.redap_modelos;
CREATE POLICY "redap_modelos_select" ON public.redap_modelos FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "redap_modelos_manage_dc" ON public.redap_modelos;
CREATE POLICY "redap_modelos_manage_dc" ON public.redap_modelos FOR ALL TO authenticated
    USING (public.is_redap_defesa_civil())
    WITH CHECK (public.is_redap_defesa_civil());

-- Relatórios: Defesa Civil vê/gerencia tudo; Secretaria vê/edita apenas os seus (enquanto editáveis)
DROP POLICY IF EXISTS "redap_relatorios_dc_all" ON public.redap_relatorios;
CREATE POLICY "redap_relatorios_dc_all" ON public.redap_relatorios FOR ALL TO authenticated
    USING (public.is_redap_defesa_civil())
    WITH CHECK (public.is_redap_defesa_civil());

DROP POLICY IF EXISTS "redap_relatorios_secretaria_select" ON public.redap_relatorios;
CREATE POLICY "redap_relatorios_secretaria_select" ON public.redap_relatorios FOR SELECT TO authenticated
    USING (secretaria_key = public.get_current_user_role());

DROP POLICY IF EXISTS "redap_relatorios_secretaria_update" ON public.redap_relatorios;
CREATE POLICY "redap_relatorios_secretaria_update" ON public.redap_relatorios FOR UPDATE TO authenticated
    USING (
        secretaria_key = public.get_current_user_role()
        AND status IN ('NAO_INICIADO', 'EM_PREENCHIMENTO', 'DEVOLVIDO')
    )
    WITH CHECK (
        secretaria_key = public.get_current_user_role()
        AND status IN ('EM_PREENCHIMENTO', 'ENVIADO', 'DEVOLVIDO')
    );

-- Helper para políticas das tabelas filhas (danos, prejuizos, equipes, recursos, despesas, anexos)
CREATE OR REPLACE FUNCTION public.can_access_redap_relatorio(p_relatorio_id uuid, p_require_write boolean DEFAULT false)
RETURNS boolean AS $$
DECLARE
    v_role text;
    v_sec text;
    v_status text;
BEGIN
    IF public.is_redap_defesa_civil() THEN
        RETURN true;
    END IF;
    v_role := public.get_current_user_role();
    SELECT secretaria_key, status INTO v_sec, v_status
    FROM public.redap_relatorios
    WHERE id = p_relatorio_id;

    IF v_sec IS NULL OR v_sec <> v_role THEN
        RETURN false;
    END IF;

    IF p_require_write THEN
        RETURN v_status IN ('NAO_INICIADO', 'EM_PREENCHIMENTO', 'DEVOLVIDO');
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Aplica políticas de isolamento por secretaria em todas as tabelas filhas
DO $$
DECLARE
    tbl text;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'redap_danos', 'redap_prejuizos', 'redap_equipes',
        'redap_recursos', 'redap_despesas', 'redap_anexos'
    ]
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "%s_select" ON public.%I', tbl, tbl);
        EXECUTE format(
            'CREATE POLICY "%s_select" ON public.%I FOR SELECT TO authenticated USING (public.can_access_redap_relatorio(relatorio_id, false))',
            tbl, tbl
        );

        EXECUTE format('DROP POLICY IF EXISTS "%s_write" ON public.%I', tbl, tbl);
        EXECUTE format(
            'CREATE POLICY "%s_write" ON public.%I FOR ALL TO authenticated USING (public.can_access_redap_relatorio(relatorio_id, true)) WITH CHECK (public.can_access_redap_relatorio(relatorio_id, true))',
            tbl, tbl
        );
    END LOOP;
END $$;

-- Pendências: Defesa Civil cria/edita; Secretaria lê as do seu relatório e pode marcar resolvida
DROP POLICY IF EXISTS "redap_pendencias_select" ON public.redap_pendencias;
CREATE POLICY "redap_pendencias_select" ON public.redap_pendencias FOR SELECT TO authenticated
    USING (public.can_access_redap_relatorio(relatorio_id, false));

DROP POLICY IF EXISTS "redap_pendencias_dc_all" ON public.redap_pendencias;
CREATE POLICY "redap_pendencias_dc_all" ON public.redap_pendencias FOR ALL TO authenticated
    USING (public.is_redap_defesa_civil())
    WITH CHECK (public.is_redap_defesa_civil());

DROP POLICY IF EXISTS "redap_pendencias_sec_update" ON public.redap_pendencias;
CREATE POLICY "redap_pendencias_sec_update" ON public.redap_pendencias FOR UPDATE TO authenticated
    USING (public.can_access_redap_relatorio(relatorio_id, true))
    WITH CHECK (public.can_access_redap_relatorio(relatorio_id, true));

-- Histórico: imutável (somente INSERT e SELECT)
DROP POLICY IF EXISTS "redap_historico_select" ON public.redap_historico;
CREATE POLICY "redap_historico_select" ON public.redap_historico FOR SELECT TO authenticated
    USING (
        public.is_redap_defesa_civil()
        OR (relatorio_id IS NOT NULL AND public.can_access_redap_relatorio(relatorio_id, false))
    );

DROP POLICY IF EXISTS "redap_historico_insert" ON public.redap_historico;
CREATE POLICY "redap_historico_insert" ON public.redap_historico FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');
