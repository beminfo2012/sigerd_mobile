-- ====================================================================
-- MÓDULO REDAP MULTI-SECRETARIAL (REDAP-001/2026)
-- SQL DE INSTALAÇÃO/MIGRAÇÃO DE BANCO DE DADOS (IDEMPOTENTE)
-- ====================================================================

-- 1. TABELA DE EVENTOS DE DESASTRE
CREATE TABLE IF NOT EXISTS public.eventos_desastre (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    nome_evento text NULL,
    cobrade_codigo text NOT NULL,
    cobrade_grupo text NULL,
    cobrade_subgrupo text NULL,
    cobrade_tipo text NULL,
    data_hora_evento timestamp with time zone NOT NULL,
    municipio_uf text NOT NULL DEFAULT 'Santa Maria de Jetibá / ES',
    area_afetada_localidade text NULL,
    decreto_municipal_emergencia text NULL,
    status_geral text NOT NULL DEFAULT 'RASCUNHO', -- RASCUNHO | EM_VALIDACAO | APROVADO | FECHADO
    id_sigerd text UNIQUE, -- REDAP-XXX/AAAA
    data_emissao timestamp with time zone NOT NULL DEFAULT now(),
    criado_por uuid NULL,
    latitude double precision NULL,
    longitude double precision NULL,
    polygon_coords text NULL,
    data_limite timestamp with time zone NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT eventos_desastre_pkey PRIMARY KEY (id)
);

-- Função para gerar o ID_SIGERD sequencial automaticamente (REDAP-XXX/AAAA)
CREATE OR REPLACE FUNCTION generate_id_sigerd()
RETURNS TRIGGER AS $$
DECLARE
    current_year text;
    next_num integer;
BEGIN
    -- Obter o ano a partir da data do evento
    current_year := to_char(NEW.data_hora_evento, 'YYYY');
    
    -- Contar registros existentes no mesmo ano para achar o sequencial
    SELECT COALESCE(MAX(SUBSTRING(id_sigerd FROM 7 FOR 3)::integer), 0) + 1
    INTO next_num
    FROM public.eventos_desastre
    WHERE to_char(data_hora_evento, 'YYYY') = current_year;
    
    -- Format: REDAP-XXX/YYYY
    NEW.id_sigerd := 'REDAP-' || lpad(next_num::text, 3, '0') || '/' || current_year;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para autogeração do id_sigerd antes do insert
DROP TRIGGER IF EXISTS trigger_generate_id_sigerd ON public.eventos_desastre;
CREATE TRIGGER trigger_generate_id_sigerd
BEFORE INSERT ON public.eventos_desastre
FOR EACH ROW
WHEN (NEW.id_sigerd IS NULL)
EXECUTE PROCEDURE generate_id_sigerd();


-- 2. TABELA DE SEÇÕES DO REDAP (Preenchimento por Secretaria)
CREATE TABLE IF NOT EXISTS public.redap_secoes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    evento_id uuid NOT NULL,
    secretaria_id text NOT NULL, -- ex: 'Redap_Saude', 'Redap_Obras', etc.
    secao text NOT NULL, -- DANOS_HUMANOS | DANOS_EDIFICACOES | DANOS_INFRAESTRUTURA | DANOS_AGRICOLAS | DANOS_AMBIENTAIS | OBSERVACOES
    dados_json jsonb NOT NULL DEFAULT '{}'::jsonb,
    responsavel_preenchimento text NULL,
    cargo_funcao text NULL,
    telefone text NULL,
    email text NULL,
    status_secao text NOT NULL DEFAULT 'PENDENTE', -- PENDENTE | PREENCHIDO | ENVIADO | VALIDADO
    data_preenchimento timestamp with time zone NULL,
    data_envio timestamp with time zone NULL,
    justificativa_devolucao text NULL, -- Guardar motivo quando DC devolve
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT redap_secoes_pkey PRIMARY KEY (id),
    CONSTRAINT fk_redap_secoes_evento FOREIGN KEY (evento_id) REFERENCES public.eventos_desastre (id) ON DELETE CASCADE,
    CONSTRAINT unique_evento_secao_secretaria UNIQUE (evento_id, secao, secretaria_id)
);


-- 3. TABELA DE WORKFLOW / FLUXO DE APROVAÇÃO
CREATE TABLE IF NOT EXISTS public.redap_fluxo_aprovacao (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    evento_id uuid NOT NULL,
    etapa integer NOT NULL, -- 1 a 5
    descricao_etapa text NOT NULL,
    responsavel text NULL,
    secretaria_responsavel text NULL,
    data_hora timestamp with time zone NOT NULL DEFAULT now(),
    status text NOT NULL DEFAULT 'PENDENTE', -- PENDENTE | CONCLUIDA
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT redap_fluxo_aprovacao_pkey PRIMARY KEY (id),
    CONSTRAINT fk_redap_fluxo_evento FOREIGN KEY (evento_id) REFERENCES public.eventos_desastre (id) ON DELETE CASCADE,
    CONSTRAINT unique_evento_etapa UNIQUE (evento_id, etapa)
);


-- 4. TABELA DE HISTÓRICO DE AÇÕES (AUDITORIA)
CREATE TABLE IF NOT EXISTS public.redap_historico_acoes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    evento_id uuid NOT NULL,
    data_hora timestamp with time zone NOT NULL DEFAULT now(),
    ator text NOT NULL,
    acao text NOT NULL,
    tipo_acao text NOT NULL, -- CRIACAO | ENVIO | ANALISE | APROVACAO | DEVOLUCAO | EDICAO
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT redap_historico_acoes_pkey PRIMARY KEY (id),
    CONSTRAINT fk_redap_historico_evento FOREIGN KEY (evento_id) REFERENCES public.eventos_desastre (id) ON DELETE CASCADE
);


-- 5. TABELA DE ASSINATURAS ELETRÔNICAS
CREATE TABLE IF NOT EXISTS public.redap_assinaturas (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    evento_id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    nome text NOT NULL,
    cargo_secretaria text NOT NULL,
    data_hora_assinatura timestamp with time zone NOT NULL DEFAULT now(),
    hash_assinatura text NOT NULL,
    status text NOT NULL DEFAULT 'ASSINADO',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT redap_assinaturas_pkey PRIMARY KEY (id),
    CONSTRAINT fk_redap_assinaturas_evento FOREIGN KEY (evento_id) REFERENCES public.eventos_desastre (id) ON DELETE CASCADE
);


-- 6. TRIGGERS UPDATED_AT PARA NOVAS TABELAS
DROP TRIGGER IF EXISTS update_eventos_desastre_updated_at ON public.eventos_desastre;
CREATE TRIGGER update_eventos_desastre_updated_at BEFORE UPDATE ON public.eventos_desastre FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_redap_secoes_updated_at ON public.redap_secoes;
CREATE TRIGGER update_redap_secoes_updated_at BEFORE UPDATE ON public.redap_secoes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();


-- 7. CONFIGURAÇÕES DE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.eventos_desastre ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redap_secoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redap_fluxo_aprovacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redap_historico_acoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redap_assinaturas ENABLE ROW LEVEL SECURITY;

-- Políticas para eventos_desastre
DROP POLICY IF EXISTS "Eventos: Acesso total para Defesa Civil" ON public.eventos_desastre;
CREATE POLICY "Eventos: Acesso total para Defesa Civil" ON public.eventos_desastre
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND profiles.role IN ('Admin', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'Agente de Defesa Civil'))
);

DROP POLICY IF EXISTS "Eventos: Visualização geral" ON public.eventos_desastre;
CREATE POLICY "Eventos: Visualização geral" ON public.eventos_desastre
FOR SELECT USING (true);

-- Políticas para redap_secoes
DROP POLICY IF EXISTS "Secoes: Acesso total para Defesa Civil" ON public.redap_secoes;
CREATE POLICY "Secoes: Acesso total para Defesa Civil" ON public.redap_secoes
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND profiles.role IN ('Admin', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'Agente de Defesa Civil'))
);

DROP POLICY IF EXISTS "Secoes: Secretarias gerenciam suas seções até fechar" ON public.redap_secoes;
CREATE POLICY "Secoes: Secretarias gerenciam suas seções até fechar" ON public.redap_secoes
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() 
        AND p.role LIKE 'Redap_%' 
        AND (
            -- Bloqueia alteração se já estiver VALIDADO ou se o Evento Geral estiver APROVADO
            status_secao NOT IN ('VALIDADO', 'ENVIADO') 
            AND NOT EXISTS (
                SELECT 1 FROM public.eventos_desastre e 
                WHERE e.id = evento_id 
                AND e.status_geral = 'APROVADO'
            )
        )
    )
);

DROP POLICY IF EXISTS "Secoes: Visualização geral" ON public.redap_secoes;
CREATE POLICY "Secoes: Visualização geral" ON public.redap_secoes
FOR SELECT USING (true);

-- Políticas para redap_fluxo_aprovacao
DROP POLICY IF EXISTS "Fluxo: Acesso total para Defesa Civil" ON public.redap_fluxo_aprovacao;
CREATE POLICY "Fluxo: Acesso total para Defesa Civil" ON public.redap_fluxo_aprovacao
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND profiles.role IN ('Admin', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'Agente de Defesa Civil'))
);

DROP POLICY IF EXISTS "Fluxo: Visualização geral" ON public.redap_fluxo_aprovacao;
CREATE POLICY "Fluxo: Visualização geral" ON public.redap_fluxo_aprovacao
FOR SELECT USING (true);

-- Políticas para redap_historico_acoes
DROP POLICY IF EXISTS "Historico: Inserção para qualquer autenticado" ON public.redap_historico_acoes;
CREATE POLICY "Historico: Inserção para qualquer autenticado" ON public.redap_historico_acoes
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Historico: Visualização geral" ON public.redap_historico_acoes;
CREATE POLICY "Historico: Visualização geral" ON public.redap_historico_acoes
FOR SELECT USING (true);

-- Políticas para redap_assinaturas
DROP POLICY IF EXISTS "Assinaturas: Qualquer autenticado assina" ON public.redap_assinaturas;
CREATE POLICY "Assinaturas: Qualquer autenticado assina" ON public.redap_assinaturas
FOR INSERT WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Assinaturas: Visualização geral" ON public.redap_assinaturas;
CREATE POLICY "Assinaturas: Visualização geral" ON public.redap_assinaturas
FOR SELECT USING (true);

-- 8. COMPATIBILIDADE DE COLUNAS DE EVENTO (ALTER TABLE INDEMPOTENTE)
ALTER TABLE public.eventos_desastre ADD COLUMN IF NOT EXISTS latitude double precision NULL;
ALTER TABLE public.eventos_desastre ADD COLUMN IF NOT EXISTS longitude double precision NULL;
ALTER TABLE public.eventos_desastre ADD COLUMN IF NOT EXISTS polygon_coords text NULL;
ALTER TABLE public.eventos_desastre ADD COLUMN IF NOT EXISTS data_limite timestamp with time zone NULL;
