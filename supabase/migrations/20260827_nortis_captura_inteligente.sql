-- Migração do Módulo de Captura Inteligente de Legislação — NORTIS 2.0

-- Forçar perfil postgres (Superuser do Supabase para ter permissão DDL no esquema public)
SET ROLE postgres;
SET search_path TO public;

-- 1. Fontes Legislativas Oficiais Configuráveis
CREATE TABLE IF NOT EXISTS public.fontes_legislativas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    nome VARCHAR(150) NOT NULL,
    esfera VARCHAR(30) NOT NULL DEFAULT 'Federal', -- Federal, Estadual, Municipal
    orgao VARCHAR(150) NOT NULL,
    url TEXT NOT NULL,
    tipo_integracao VARCHAR(50) NOT NULL DEFAULT 'RSS', -- API, RSS, HTML, JSON, XML, LexML
    metodo_coleta VARCHAR(50) NOT NULL DEFAULT 'GET',
    periodicidade_horas INTEGER NOT NULL DEFAULT 24,
    ativo BOOLEAN NOT NULL DEFAULT true,
    ultima_execucao TIMESTAMPTZ,
    ultima_execucao_sucesso TIMESTAMPTZ,
    qtd_documentos_encontrados INTEGER DEFAULT 0,
    qtd_documentos_classificados INTEGER DEFAULT 0,
    qtd_erros INTEGER DEFAULT 0,
    ultimo_erro TEXT,
    criado_em TIMESTAMPTZ DEFAULT now(),
    atualizado_em TIMESTAMPTZ DEFAULT now()
);

-- 2. Cadastro de Palavras-Chave e Pesos
CREATE TABLE IF NOT EXISTS public.palavras_chave (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    termo VARCHAR(100) NOT NULL,
    categoria VARCHAR(100) NOT NULL, -- Categoria 1 (Núcleo), 2 (Desastres), 3 (Gestão de Riscos), 4 (Transversais), 5 (Financeiros/Jurídicos)
    peso INTEGER NOT NULL DEFAULT 10,
    sinonimos TEXT[], -- Array de sinônimos/variantes
    tipo_correspondencia VARCHAR(30) NOT NULL DEFAULT 'EXPRESSAO', -- EXATA, EXPRESSAO, RADICAL, SINONIMO
    prioridade INTEGER DEFAULT 1,
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMPTZ DEFAULT now()
);

-- 3. Lista de Exclusão (Falsos Positivos)
CREATE TABLE IF NOT EXISTS public.lista_exclusao_captura (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    termo VARCHAR(100) NOT NULL,
    contexto_exclusao VARCHAR(150), -- ex: esporte, processo criminal, trânsito comum
    penalidade_peso INTEGER NOT NULL DEFAULT 50, -- Valor a deduzir do score
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMPTZ DEFAULT now()
);

-- 4. Regras de Combinação
CREATE TABLE IF NOT EXISTS public.regras_classificacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    condicao JSONB NOT NULL, -- ex: {"termos": ["deslizamento", "área de risco"], "operador": "AND"}
    pontuacao_bonus INTEGER NOT NULL DEFAULT 30,
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMPTZ DEFAULT now()
);

-- 5. Documentos Capturados (Pré-Cadastros)
CREATE TABLE IF NOT EXISTS public.documentos_capturados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fonte_id UUID REFERENCES public.fontes_legislativas(id) ON DELETE SET NULL,
    identificador_externo VARCHAR(150),
    tipo VARCHAR(50) DEFAULT 'Não identificado', -- Decreto, Lei, Portaria, etc.
    numero VARCHAR(50) DEFAULT 'Não identificado',
    ano INTEGER,
    data_publicacao DATE,
    data_vigencia DATE,
    orgao VARCHAR(150) DEFAULT 'Não identificado',
    esfera VARCHAR(30) DEFAULT 'Não identificado',
    ementa TEXT DEFAULT 'Não identificado',
    assunto VARCHAR(200),
    autoridade VARCHAR(150),
    texto_original TEXT NOT NULL,
    texto_normalizado TEXT NOT NULL,
    url_fonte TEXT NOT NULL,
    hash_documento VARCHAR(64) NOT NULL, -- SHA-256 para deduplicação
    status VARCHAR(50) NOT NULL DEFAULT 'RASCUNHO_AGUARDANDO_REVISAO', -- RASCUNHO_AGUARDANDO_REVISAO, APROVADO, EDITADO, DESCARTADO
    data_captura TIMESTAMPTZ DEFAULT now(),
    atualizado_em TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_doc_capturado_hash ON public.documentos_capturados(hash_documento);
CREATE INDEX IF NOT EXISTS idx_doc_capturado_status ON public.documentos_capturados(status);

-- 6. Classificações e Pontuações Calculadas
CREATE TABLE IF NOT EXISTS public.classificacoes_legislativas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    documento_id UUID NOT NULL REFERENCES public.documentos_capturados(id) ON DELETE CASCADE,
    pontuacao INTEGER NOT NULL DEFAULT 0,
    nivel_relevancia VARCHAR(30) NOT NULL, -- ALTA, MEDIA, BAIXA, IGNORAR
    palavras_encontradas JSONB, -- Array de objetos com termo, categoria, peso e local
    regras_aplicadas JSONB, -- Regras de combinação que pontuaram
    data_classificacao TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_classificacao_nivel ON public.classificacoes_legislativas(nivel_relevancia);

-- 7. Registro de Auditoria e Revisões Humanas
CREATE TABLE IF NOT EXISTS public.revisoes_legislativas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    documento_id UUID NOT NULL REFERENCES public.documentos_capturados(id) ON DELETE CASCADE,
    norma_publicada_id UUID REFERENCES public.nortis_normas(id) ON DELETE SET NULL,
    usuario_id UUID,
    usuario_nome VARCHAR(150),
    acao VARCHAR(30) NOT NULL, -- APROVADO, EDITADO_E_APROVADO, DESCARTADO
    motivo_descarte VARCHAR(100), -- Falso positivo, Duplicado, Não relevante, Fonte incorreta, Já cadastrado, Outro
    observacoes TEXT,
    dados_alterados JSONB,
    data_hora TIMESTAMPTZ DEFAULT now()
);

-- 8. Log de Execução da Captura
CREATE TABLE IF NOT EXISTS public.execucoes_captura_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fonte_id UUID REFERENCES public.fontes_legislativas(id) ON DELETE CASCADE,
    data_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
    data_fim TIMESTAMPTZ,
    status VARCHAR(30) NOT NULL DEFAULT 'EM_ANDAMENTO', -- SUCESSO, FALHA, EM_ANDAMENTO
    docs_encontrados INTEGER DEFAULT 0,
    docs_processados INTEGER DEFAULT 0,
    docs_relevantes INTEGER DEFAULT 0,
    mensagem_erro TEXT
);

-- Conceder permissões explícitas de tabela para todos os papéis Supabase
GRANT ALL ON TABLE public.fontes_legislativas TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.palavras_chave TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.lista_exclusao_captura TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.regras_classificacao TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.documentos_capturados TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.classificacoes_legislativas TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.revisoes_legislativas TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.execucoes_captura_log TO postgres, anon, authenticated, service_role;

-- Habilitar RLS em todas as novas tabelas
ALTER TABLE public.fontes_legislativas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.palavras_chave ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lista_exclusao_captura ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regras_classificacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_capturados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classificacoes_legislativas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revisoes_legislativas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execucoes_captura_log ENABLE ROW LEVEL SECURITY;

-- Políticas RLS permissivas padrão para leitura e escrita autenticada
CREATE POLICY "Permitir select para usuarios autenticados em fontes" ON public.fontes_legislativas FOR SELECT USING (true);
CREATE POLICY "Permitir all para usuarios autenticados em fontes" ON public.fontes_legislativas FOR ALL USING (true);

CREATE POLICY "Permitir select em palavras_chave" ON public.palavras_chave FOR SELECT USING (true);
CREATE POLICY "Permitir all em palavras_chave" ON public.palavras_chave FOR ALL USING (true);

CREATE POLICY "Permitir select em lista_exclusao" ON public.lista_exclusao_captura FOR SELECT USING (true);
CREATE POLICY "Permitir all em lista_exclusao" ON public.lista_exclusao_captura FOR ALL USING (true);

CREATE POLICY "Permitir select em regras_classificacao" ON public.regras_classificacao FOR SELECT USING (true);
CREATE POLICY "Permitir all em regras_classificacao" ON public.regras_classificacao FOR ALL USING (true);

CREATE POLICY "Permitir select em documentos_capturados" ON public.documentos_capturados FOR SELECT USING (true);
CREATE POLICY "Permitir all em documentos_capturados" ON public.documentos_capturados FOR ALL USING (true);

CREATE POLICY "Permitir select em classificacoes_legislativas" ON public.classificacoes_legislativas FOR SELECT USING (true);
CREATE POLICY "Permitir all em classificacoes_legislativas" ON public.classificacoes_legislativas FOR ALL USING (true);

CREATE POLICY "Permitir select em revisoes_legislativas" ON public.revisoes_legislativas FOR SELECT USING (true);
CREATE POLICY "Permitir all em revisoes_legislativas" ON public.revisoes_legislativas FOR ALL USING (true);

CREATE POLICY "Permitir select em execucoes_captura_log" ON public.execucoes_captura_log FOR SELECT USING (true);
CREATE POLICY "Permitir all em execucoes_captura_log" ON public.execucoes_captura_log FOR ALL USING (true);

-- Populate Seed Data: Fontes Iniciais
INSERT INTO public.fontes_legislativas (nome, esfera, orgao, url, tipo_integracao, metodo_coleta, periodicidade_horas, ativo)
VALUES 
('Diário Oficial da União - Seção 1', 'Federal', 'Imprensa Nacional', 'https://www.in.gov.br/leitura-jornal', 'RSS', 'GET', 24, true),
('LexML Brasil', 'Federal', 'Senado Federal / LexML', 'https://www.lexml.gov.br/busca/srw', 'API', 'GET', 24, true),
('Diário Oficial do Estado (DOE)', 'Estadual', 'Governo do Estado', 'https://dio.es.gov.br/', 'RSS', 'GET', 12, true)
ON CONFLICT DO NOTHING;

-- Populate Seed Data: Categorias de Palavras-Chave (Regras NORTIS 2.0)
INSERT INTO public.palavras_chave (termo, categoria, peso, tipo_correspondencia) VALUES
-- Categoria 1: Núcleo Defesa Civil
('Defesa Civil', 'Núcleo Defesa Civil', 100, 'EXPRESSAO'),
('Proteção e Defesa Civil', 'Núcleo Defesa Civil', 100, 'EXPRESSAO'),
('Sistema Nacional de Proteção e Defesa Civil', 'Núcleo Defesa Civil', 100, 'EXPRESSAO'),
('SINPDEC', 'Núcleo Defesa Civil', 100, 'EXATA'),
('COMPDEC', 'Núcleo Defesa Civil', 100, 'EXATA'),
('Coordenadoria Municipal de Proteção e Defesa Civil', 'Núcleo Defesa Civil', 100, 'EXPRESSAO'),
('Plano Nacional de Proteção e Defesa Civil', 'Núcleo Defesa Civil', 90, 'EXPRESSAO'),
('Política Nacional de Proteção e Defesa Civil', 'Núcleo Defesa Civil', 90, 'EXPRESSAO'),
('Agente de proteção e defesa civil', 'Núcleo Defesa Civil', 80, 'EXPRESSAO'),
('Voluntário de defesa civil', 'Núcleo Defesa Civil', 70, 'EXPRESSAO'),

-- Categoria 2: Desastres e Eventos Adversos
('Situação de Emergência', 'Desastres e Eventos Adversos', 90, 'EXPRESSAO'),
('Estado de Calamidade Pública', 'Desastres e Eventos Adversos', 90, 'EXPRESSAO'),
('Decreto de emergência', 'Desastres e Eventos Adversos', 85, 'EXPRESSAO'),
('Desastre', 'Desastres e Eventos Adversos', 60, 'EXPRESSAO'),
('Enchente', 'Desastres e Eventos Adversos', 50, 'EXPRESSAO'),
('Inundação', 'Desastres e Eventos Adversos', 50, 'EXPRESSAO'),
('Alagamento', 'Desastres e Eventos Adversos', 45, 'EXPRESSAO'),
('Enxurrada', 'Desastres e Eventos Adversos', 50, 'EXPRESSAO'),
('Estiagem', 'Desastres e Eventos Adversos', 50, 'EXPRESSAO'),
('Seca', 'Desastres e Eventos Adversos', 40, 'EXPRESSAO'),
('Deslizamento', 'Desastres e Eventos Adversos', 60, 'EXPRESSAO'),
('Escorregamento', 'Desastres e Eventos Adversos', 50, 'EXPRESSAO'),
('Queda de barreira', 'Desastres e Eventos Adversos', 50, 'EXPRESSAO'),
('Movimento de massa', 'Desastres e Eventos Adversos', 50, 'EXPRESSAO'),
('Erosão', 'Desastres e Eventos Adversos', 40, 'EXPRESSAO'),
('Terremoto', 'Desastres e Eventos Adversos', 60, 'EXPRESSAO'),
('Vendaval', 'Desastres e Eventos Adversos', 45, 'EXPRESSAO'),
('Tempestade', 'Desastres e Eventos Adversos', 45, 'EXPRESSAO'),
('Ciclone', 'Desastres e Eventos Adversos', 50, 'EXPRESSAO'),
('Granizo', 'Desastres e Eventos Adversos', 40, 'EXPRESSAO'),
('Incêndio florestal', 'Desastres e Eventos Adversos', 55, 'EXPRESSAO'),
('Desabamento', 'Desastres e Eventos Adversos', 50, 'EXPRESSAO'),
('Colapso estrutural', 'Desastres e Eventos Adversos', 50, 'EXPRESSAO'),
('Vazamento químico', 'Desastres e Eventos Adversos', 50, 'EXPRESSAO'),
('Produtos perigosos', 'Desastres e Eventos Adversos', 40, 'EXPRESSAO'),

-- Categoria 3: Ciclo de Gestão de Riscos
('Plano de Contingência', 'Gestão de Riscos', 70, 'EXPRESSAO'),
('Reconhecimento de situação de emergência', 'Gestão de Riscos', 70, 'EXPRESSAO'),
('Mapeamento de áreas de risco', 'Gestão de Riscos', 65, 'EXPRESSAO'),
('Zoneamento de risco', 'Gestão de Riscos', 60, 'EXPRESSAO'),
('Obras de contenção', 'Gestão de Riscos', 55, 'EXPRESSAO'),
('Plano de evacuação', 'Gestão de Riscos', 60, 'EXPRESSAO'),
('Abrigo temporário', 'Gestão de Riscos', 55, 'EXPRESSAO'),
('Busca e salvamento', 'Gestão de Riscos', 60, 'EXPRESSAO'),
('Resgate', 'Gestão de Riscos', 50, 'EXPRESSAO'),
('Força-tarefa', 'Gestão de Riscos', 45, 'EXPRESSAO'),
('Reconstrução', 'Gestão de Riscos', 50, 'EXPRESSAO'),
('Ajuda humanitária', 'Gestão de Riscos', 55, 'EXPRESSAO'),
('Levantamento de danos', 'Gestão de Riscos', 55, 'EXPRESSAO'),

-- Categoria 4: Áreas Transversais
('Contenção de encosta', 'Áreas Transversais', 40, 'EXPRESSAO'),
('Drenagem pluvial', 'Áreas Transversais', 30, 'EXPRESSAO'),
('Segurança de barragens', 'Áreas Transversais', 45, 'EXPRESSAO'),
('Área de risco', 'Áreas Transversais', 45, 'EXPRESSAO'),
('Comunidade vulnerável', 'Áreas Transversais', 35, 'EXPRESSAO'),
('Remoção de famílias', 'Áreas Transversais', 40, 'EXPRESSAO'),
('Reassentamento', 'Áreas Transversais', 35, 'EXPRESSAO'),
('Emergência sanitária', 'Áreas Transversais', 40, 'EXPRESSAO'),

-- Categoria 5: Instrumentos Jurídicos e Financeiros
('Fundo de Defesa Civil', 'Instrumentos Financeiros', 70, 'EXPRESSAO'),
('FUNDEPDEC', 'Instrumentos Financeiros', 80, 'EXATA'),
('Dispensa de licitação', 'Instrumentos Financeiros', 60, 'EXPRESSAO'),
('Crédito extraordinário', 'Instrumentos Financeiros', 60, 'EXPRESSAO'),
('Crédito emergencial', 'Instrumentos Financeiros', 60, 'EXPRESSAO'),
('Transferência de recursos', 'Instrumentos Financeiros', 45, 'EXPRESSAO'),
('Convênio emergencial', 'Instrumentos Financeiros', 55, 'EXPRESSAO'),
('Reconhecimento federal', 'Instrumentos Financeiros', 65, 'EXPRESSAO')
ON CONFLICT DO NOTHING;

-- Populate Seed Data: Lista de Exclusão (Falsos Positivos)
INSERT INTO public.lista_exclusao_captura (termo, contexto_exclusao, penalidade_peso) VALUES
('defesa esportiva', 'Eventos esportivos', 60),
('campeonato de futebol', 'Esporte', 80),
('defesa prévia', 'Processo judicial/administrativo', 50),
('defesa criminal', 'Direito penal', 50),
('multa de trânsito', 'Trânsito comum', 40),
('licitação de material escolar', 'Administração geral', 30),
('poda preventiva de rotina', 'Arborização urbana sem risco', 30)
ON CONFLICT DO NOTHING;
