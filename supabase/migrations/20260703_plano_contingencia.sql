-- Habilitar extensao para UUID se nao existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela orgaos
CREATE TABLE IF NOT EXISTS orgaos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome_curto VARCHAR(255) NOT NULL,
  nome_completo VARCHAR(255) NOT NULL,
  cor_hex VARCHAR(7),
  icone VARCHAR(50),
  descricao_responsabilidade TEXT,
  ordem_exibicao INTEGER
);

-- Indice unico em nome_curto se nao existir
CREATE UNIQUE INDEX IF NOT EXISTS idx_orgaos_nome_curto ON orgaos (nome_curto);

-- Tabela contatos
CREATE TABLE IF NOT EXISTS contatos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  orgao_id UUID REFERENCES orgaos(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  cargo VARCHAR(255) NOT NULL,
  telefone VARCHAR(50),
  email VARCHAR(255),
  is_responsavel_principal BOOLEAN DEFAULT false
);

-- Enum fase_enum
DO $$ BEGIN
    CREATE TYPE fase_enum AS ENUM ('Prevenção', 'Preparação', 'Resposta');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabela atribuicoes
CREATE TABLE IF NOT EXISTS atribuicoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  orgao_id UUID REFERENCES orgaos(id) ON DELETE CASCADE,
  fase fase_enum NOT NULL,
  texto TEXT NOT NULL,
  ordem_exibicao INTEGER,
  base_legal VARCHAR(255)
);

-- Enum recurso_categoria_enum
DO $$ BEGIN
    CREATE TYPE recurso_categoria_enum AS ENUM ('Veículos', 'Materiais', 'Recursos Humanos', 'Instituições e Apoio Voluntário');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabela recursos_plano
CREATE TABLE IF NOT EXISTS recursos_plano (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  orgao_id UUID REFERENCES orgaos(id) ON DELETE CASCADE,
  mci_recurso_id UUID NOT NULL,
  categoria recurso_categoria_enum NOT NULL,
  alocado_no_plano INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela plano_versoes
CREATE TABLE IF NOT EXISTS plano_versoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_versao VARCHAR(50) NOT NULL,
  data_alteracao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  descricao_alteracao TEXT,
  observacoes TEXT
);

-- Tabela plano_assinaturas
CREATE TABLE IF NOT EXISTS plano_assinaturas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  orgao_id UUID REFERENCES orgaos(id) ON DELETE SET NULL,
  cargo VARCHAR(255) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  contato VARCHAR(255),
  identificacao_assinatura_edocs VARCHAR(255)
);

-- Tabela planos_contingencia
CREATE TABLE IF NOT EXISTS planos_contingencia (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nivel VARCHAR(50) NOT NULL,
  motivo TEXT,
  area_afetada TEXT,
  comandante TEXT,
  status VARCHAR(50) DEFAULT 'Ativo',
  data_ativacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_encerramento TIMESTAMP WITH TIME ZONE,
  relatorio_final TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Estrutura Organizacional do SCO
CREATE TABLE IF NOT EXISTS sco_estrutura (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plano_id UUID REFERENCES planos_contingencia(id) ON DELETE CASCADE,
  sessao VARCHAR(100) NOT NULL,
  funcao VARCHAR(100) NOT NULL,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  atribuicao TEXT,
  status VARCHAR(50) DEFAULT 'Ativo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indice unico para chefias no SCO
CREATE UNIQUE INDEX IF NOT EXISTS idx_sco_estrutura_plano_sessao_funcao ON sco_estrutura (plano_id, sessao, funcao);

-- Tabela de Vinculos (Usuario - Orgao)
CREATE TABLE IF NOT EXISTS usuario_orgao (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  orgao_id UUID REFERENCES orgaos(id) ON DELETE CASCADE,
  UNIQUE(usuario_id, orgao_id)
);

-- Tabela de Auditoria do Plano de Contingência
CREATE TABLE IF NOT EXISTS plano_contingencia_auditoria (
  id BIGSERIAL PRIMARY KEY,
  tabela VARCHAR(50) NOT NULL,
  registro_id UUID,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  acao VARCHAR(20) NOT NULL,
  dados_anteriores JSONB,
  dados_novos JSONB,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Popular dados iniciais de Órgãos (Seed Idempotente sem ON CONFLICT)
INSERT INTO orgaos (nome_curto, nome_completo, cor_hex, icone, descricao_responsabilidade, ordem_exibicao)
SELECT * FROM (VALUES
('GAB', 'Gabinete do Prefeito', '#334155', 'Building', 'Direção geral da administração.', 1),
('COMPDEC', 'Coordenadoria Municipal de Proteção e Defesa Civil', '#ef4444', 'ShieldAlert', 'Coordenação geral do plano de contingência.', 2),
('SEMAD', 'Secretaria de Administração', '#3b82f6', 'Briefcase', 'Gestão administrativa e de pessoal.', 3),
('SEMPLA', 'Secretaria de Planejamento e Projetos', '#10b981', 'Map', 'Planejamento e alocação de projetos.', 4),
('SEMFAZ', 'Secretaria de Fazenda', '#14b8a6', 'DollarSign', 'Gestão financeira e orçamentária.', 5),
('COMUNICAÇÃO', 'Gerência de Comunicação e Jornalismo', '#f59e0b', 'Megaphone', 'Comunicação oficial e imprensa.', 6),
('SEJUR', 'Secretaria Jurídica', '#6366f1', 'Scale', 'Consultoria e assessoria jurídica.', 7),
('CGI', 'Controladoria Geral Interna', '#8b5cf6', 'Eye', 'Controle e auditoria interna.', 8),
('SEMED', 'Secretaria de Educação', '#ec4899', 'Book', 'Gestão das unidades escolares.', 9),
('SEMSA', 'Secretaria de Saúde', '#f43f5e', 'Activity', 'Assistência médica e sanitária.', 10),
('SETDAS', 'Secretaria de Trabalho, Desenvolvimento e Ação Social', '#d946ef', 'HeartHandshake', 'Assistência social e apoio humanitário.', 11),
('SECURB', 'Secretaria de Serviços Urbanos', '#f97316', 'Truck', 'Limpeza urbana e manutenção de vias.', 12),
('SECOBR', 'Secretaria de Obras e Infraestrutura', '#eab308', 'Wrench', 'Obras públicas e infraestrutura.', 13),
('SEAGRO', 'Secretaria de Agropecuária', '#84cc16', 'Tractor', 'Apoio à área rural e agropecuária.', 14),
('INTERIOR', 'Secretaria de Interior', '#22c55e', 'MapPin', 'Apoio às comunidades do interior.', 15),
('SEMMA', 'Secretaria de Meio Ambiente', '#10b981', 'Leaf', 'Gestão ambiental e licenciamento.', 16),
('SEDES', 'Secretaria de Defesa Social', '#334155', 'Shield', 'Segurança pública e Guarda Municipal.', 17),
('CBMES', 'Corpo de Bombeiros Militar (6º BBM)', '#dc2626', 'Flame', 'Busca, salvamento e resgate.', 18),
('PMES', 'Polícia Militar (8ª Cia Ind)', '#1d4ed8', 'Crosshair', 'Policiamento ostensivo e preservação da ordem.', 19),
('SCBV', 'Sociedade Civil de Bombeiros Voluntários (SCBV-SMJ)', '#ea580c', 'FireExtinguisher', 'Apoio voluntário em emergências.', 20),
('REMER', 'Radioamadores (REMER)', '#0284c7', 'Radio', 'Rede Nacional de Emergência de Radioamadores.', 21)
) AS v(nome_curto, nome_completo, cor_hex, icone, descricao_responsabilidade, ordem_exibicao)
WHERE NOT EXISTS (SELECT 1 FROM orgaos o WHERE o.nome_curto = v.nome_curto);

-- Inserir assinaturas baseadas na tabela fornecida
WITH orgs AS (SELECT id, nome_curto FROM orgaos)
INSERT INTO plano_assinaturas (orgao_id, cargo, nome, contato)
SELECT * FROM (VALUES
((SELECT id FROM orgs WHERE nome_curto = 'GAB'), 'Prefeito Municipal', 'Ronan Zocoloto Souza Dutra', '(27) 3263-4350 R.1002 · gabinete@pmsmj.es.gov.br'),
((SELECT id FROM orgs WHERE nome_curto = 'GAB'), 'Vice-Prefeito Municipal', 'Rafael Bozani Pimentel', '(27) 3263-4350 R.1002 · gabinete@pmsmj.es.gov.br'),
((SELECT id FROM orgs WHERE nome_curto = 'GAB'), 'Secretário de Gabinete', 'Geraldo Sebastião Thomas', '(27) 3263-4350 R.1002 · gabinete@pmsmj.es.gov.br'),
((SELECT id FROM orgs WHERE nome_curto = 'COMPDEC'), 'Coordenador Municipal de Proteção e Defesa Civil', 'Bruno Augusto Vieira Pagel', '(27) 3263-4350 R.1138 · defesacivil@pmsmj.es.gov.br'),
((SELECT id FROM orgs WHERE nome_curto = 'SEMAD'), 'Secretário de Administração', 'Luiz Ricardo de Souza Altoé', '(27) 3263-4350 R.1008 · adm@pmsmj.es.gov.br'),
((SELECT id FROM orgs WHERE nome_curto = 'SEMPLA'), 'Secretário de Planejamento e Projetos', 'Luiz Ricardo de Souza Altoé', '(27) 3263-4350 R.1018 · planejamento@pmsmj.es.gov.br'),
((SELECT id FROM orgs WHERE nome_curto = 'SEMFAZ'), 'Secretário de Fazenda', 'Valdecir Jacob', '(27) 3263-4350 R.1015 · financas@pmsmj.es.gov.br'),
((SELECT id FROM orgs WHERE nome_curto = 'COMUNICAÇÃO'), 'Gerente de Comunicação', 'Nicolas Vargas Teixeira', '(27) 3263-4350 R.1004 · gabinete@pmsmj.es.gov.br'),
((SELECT id FROM orgs WHERE nome_curto = 'SEJUR'), 'Secretário Jurídico', 'Cesar Geraldo Scalzer', '(27) 3263-4350 R.1005 · juridico@pmsmj.es.gov.br'),
((SELECT id FROM orgs WHERE nome_curto = 'CGI'), 'Controlador Geral', 'Priscila Jacob Knaak', '(27) 3263-4350 R.1011 · controladoria@pmsmj.es.gov.br'),
((SELECT id FROM orgs WHERE nome_curto = 'SEMED'), 'Secretária de Educação', 'Marcileide Stuhr', '(27) 3263-4350 R.1079 · educacao@pmsmj.es.gov.br'),
((SELECT id FROM orgs WHERE nome_curto = 'SEMSA'), 'Secretário de Saúde', 'Carlos Alberto Jarske', '(27) 3263-4350 R.1033 · saude@pmsmj.es.gov.br'),
((SELECT id FROM orgs WHERE nome_curto = 'SETDAS'), 'Secretária de Ação Social', 'Sarianna Gava Woelffel Pienegonda', '(27) 3263-4350 R.1057 · acaosocial@pmsmj.es.gov.br'),
((SELECT id FROM orgs WHERE nome_curto = 'SECURB'), 'Secretário de Serviços Urbanos', 'Alessandro Oliveira de Souza', '(27) 3263-4350 R.1049 · servicosurbanos@pmsmj.es.gov.br'),
((SELECT id FROM orgs WHERE nome_curto = 'SECOBR'), 'Secretário de Obras e Infraestrutura', 'Bruno Augusto Vieira Pagel', '(27) 3263-4350 R.1029 · obras@pmsmj.es.gov.br'),
((SELECT id FROM orgs WHERE nome_curto = 'SEAGRO'), 'Secretária de Agropecuária', 'Vanderlei Marquez', '(27) 3263-4350 R.1017 · agropecuaria@pmsmj.es.gov.br'),
((SELECT id FROM orgs WHERE nome_curto = 'INTERIOR'), 'Secretário de Interior', 'Adriano Haese', '(27) 3263-4350 R.1085 · interior@pmsmj.es.gov.br'),
((SELECT id FROM orgs WHERE nome_curto = 'SEMMA'), 'Subsecretário de Meio Ambiente', 'Leonardo Novelli Faian', '(27) 3263-4350 R.1025 · meioambiente@pmsmj.es.gov.br'),
((SELECT id FROM orgs WHERE nome_curto = 'SEDES'), 'Secretário de Defesa Social', 'Paulo Rogerio do Carmo Barboza', '(27) 3263-4350 R.1081 · sedes@pmsmj.es.gov.br'),
((SELECT id FROM orgs WHERE nome_curto = 'CBMES'), 'Comandante', 'Fábio Silva Ferreira', '(27) 3194-3768 · 1cia.6bbm@bombeiros.es.gov.br'),
((SELECT id FROM orgs WHERE nome_curto = 'PMES'), 'Comandante da Companhia Independente', 'Thales Gustavo Pereira Matias Vaz', '(27) 3259-9000 · chefep3.8ciaind@pm.es.gov.br'),
((SELECT id FROM orgs WHERE nome_curto = 'SCBV'), 'Presidente', 'Alexandre Fortunato Ribeiro', '(27) 99916-2725 · scbvsmj@gmail.com'),
((SELECT id FROM orgs WHERE nome_curto = 'REMER'), 'Representante da REMER', 'Cleverson Altierry Callott', '(27) 99838-8889 · cleversonaltierry@hotmail.com')
) AS v(orgao_id, cargo, nome, contato)
WHERE NOT EXISTS (SELECT 1 FROM plano_assinaturas LIMIT 1);

-- Inserir Atribuições Base
WITH orgs AS (SELECT id, nome_curto FROM orgaos)
INSERT INTO atribuicoes (orgao_id, fase, texto)
SELECT * FROM (VALUES
-- GAB
((SELECT id FROM orgs WHERE nome_curto = 'GAB'), 'Prevenção'::fase_enum, 'Direção estratégica e articulação institucional.'),
((SELECT id FROM orgs WHERE nome_curto = 'GAB'), 'Preparação'::fase_enum, 'Convocação de reuniões extraordinárias do GRAC.'),
((SELECT id FROM orgs WHERE nome_curto = 'GAB'), 'Resposta'::fase_enum, 'Decreto de Situação de Emergência ou Estado de Calamidade Pública.'),

-- COMPDEC
((SELECT id FROM orgs WHERE nome_curto = 'COMPDEC'), 'Prevenção'::fase_enum, 'Mapeamento de áreas de risco e ações preventivas.'),
((SELECT id FROM orgs WHERE nome_curto = 'COMPDEC'), 'Preparação'::fase_enum, 'Coordenação geral, vistorias e monitoramento de alertas.'),
((SELECT id FROM orgs WHERE nome_curto = 'COMPDEC'), 'Resposta'::fase_enum, 'Coordenação do SCO, decretação de emergência e acionamento da CEPDEC.'),

-- SEMAD
((SELECT id FROM orgs WHERE nome_curto = 'SEMAD'), 'Prevenção'::fase_enum, 'Gestão preventiva de pessoal e logística institucional.'),
((SELECT id FROM orgs WHERE nome_curto = 'SEMAD'), 'Preparação'::fase_enum, 'Organização de escalas de plantão de servidores.'),
((SELECT id FROM orgs WHERE nome_curto = 'SEMAD'), 'Resposta'::fase_enum, 'Mobilização emergencial de servidores e transporte de apoio.'),

-- SEMPLA
((SELECT id FROM orgs WHERE nome_curto = 'SEMPLA'), 'Prevenção'::fase_enum, 'Planejamento urbano com foco na redução de riscos.'),
((SELECT id FROM orgs WHERE nome_curto = 'SEMPLA'), 'Preparação'::fase_enum, 'Priorização de projetos de infraestrutura resiliente.'),
((SELECT id FROM orgs WHERE nome_curto = 'SEMPLA'), 'Resposta'::fase_enum, 'Apoio no mapeamento e avaliação de danos urbanos.'),

-- SEMFAZ
((SELECT id FROM orgs WHERE nome_curto = 'SEMFAZ'), 'Prevenção'::fase_enum, 'Previsão de reservas orçamentárias de contingência.'),
((SELECT id FROM orgs WHERE nome_curto = 'SEMFAZ'), 'Preparação'::fase_enum, 'Procedimentos simplificados para compras emergenciais.'),
((SELECT id FROM orgs WHERE nome_curto = 'SEMFAZ'), 'Resposta'::fase_enum, 'Liberação imediata de recursos financeiros e abertura de créditos extraordinários.'),

-- COMUNICAÇÃO
((SELECT id FROM orgs WHERE nome_curto = 'COMUNICAÇÃO'), 'Prevenção'::fase_enum, 'Campanhas educativas de conscientização da população.'),
((SELECT id FROM orgs WHERE nome_curto = 'COMUNICAÇÃO'), 'Preparação'::fase_enum, 'Elaboração de notas oficiais e canais de alerta.'),
((SELECT id FROM orgs WHERE nome_curto = 'COMUNICAÇÃO'), 'Resposta'::fase_enum, 'Divulgação de boletins oficiais, orientações à imprensa e população.'),

-- SEJUR
((SELECT id FROM orgs WHERE nome_curto = 'SEJUR'), 'Prevenção'::fase_enum, 'Análise jurídica de contratos e convênios de emergência.'),
((SELECT id FROM orgs WHERE nome_curto = 'SEJUR'), 'Preparação'::fase_enum, 'Minutas prévia de decretos de emergência.'),
((SELECT id FROM orgs WHERE nome_curto = 'SEJUR'), 'Resposta'::fase_enum, 'Assessoria jurídica em desapropriações, requisições administrativas e decretos.'),

-- CGI
((SELECT id FROM orgs WHERE nome_curto = 'CGI'), 'Prevenção'::fase_enum, 'Orientação sobre transparência em gastos de emergência.'),
((SELECT id FROM orgs WHERE nome_curto = 'CGI'), 'Preparação'::fase_enum, 'Acompanhamento preventivo dos processos de contratação.'),
((SELECT id FROM orgs WHERE nome_curto = 'CGI'), 'Resposta'::fase_enum, 'Auditoria simultânea e prestação de contas dos recursos empregados.'),

-- SEMED
((SELECT id FROM orgs WHERE nome_curto = 'SEMED'), 'Prevenção'::fase_enum, 'Educação para redução de riscos de desastres.'),
((SELECT id FROM orgs WHERE nome_curto = 'SEMED'), 'Preparação'::fase_enum, 'Preparação de escolas como possíveis abrigos temporários.'),
((SELECT id FROM orgs WHERE nome_curto = 'SEMED'), 'Resposta'::fase_enum, 'Cessão de escolas como abrigo temporário e apoio na alimentação (merenda).'),

-- SEMSA
((SELECT id FROM orgs WHERE nome_curto = 'SEMSA'), 'Prevenção'::fase_enum, 'Vigilância em saúde em áreas de risco.'),
((SELECT id FROM orgs WHERE nome_curto = 'SEMSA'), 'Preparação'::fase_enum, 'Abastecimento de insumos e preparação de equipes médicas.'),
((SELECT id FROM orgs WHERE nome_curto = 'SEMSA'), 'Resposta'::fase_enum, 'Assistência pré-hospitalar, vigilância epidemiológica e suporte em abrigos.'),

-- SETDAS
((SELECT id FROM orgs WHERE nome_curto = 'SETDAS'), 'Prevenção'::fase_enum, 'Mapeamento socioeconômico em áreas vulneráveis.'),
((SELECT id FROM orgs WHERE nome_curto = 'SETDAS'), 'Preparação'::fase_enum, 'Cadastro de abrigos e fornecedores de insumos emergenciais.'),
((SELECT id FROM orgs WHERE nome_curto = 'SETDAS'), 'Resposta'::fase_enum, 'Triagem socioeconômica, gestão de abrigos e distribuição de assistência humanitária.'),

-- SECURB
((SELECT id FROM orgs WHERE nome_curto = 'SECURB'), 'Prevenção'::fase_enum, 'Limpeza urbana regular para evitar obstrução de canais.'),
((SELECT id FROM orgs WHERE nome_curto = 'SECURB'), 'Preparação'::fase_enum, 'Escala de plantão de equipes de limpeza.'),
((SELECT id FROM orgs WHERE nome_curto = 'SECURB'), 'Resposta'::fase_enum, 'Limpeza de vias afetadas e sistemas de drenagem urbana.'),

-- SECOBR
((SELECT id FROM orgs WHERE nome_curto = 'SECOBR'), 'Prevenção'::fase_enum, 'Manutenção preventiva de encostas e drenagem.'),
((SELECT id FROM orgs WHERE nome_curto = 'SECOBR'), 'Preparação'::fase_enum, 'Vistorias geotécnicas e plantão 24h em maquinário pesado.'),
((SELECT id FROM orgs WHERE nome_curto = 'SECOBR'), 'Resposta'::fase_enum, 'Obras de contenção, desobstrução de vias e suporte logístico em infraestrutura.'),

-- SEAGRO
((SELECT id FROM orgs WHERE nome_curto = 'SEAGRO'), 'Prevenção'::fase_enum, 'Monitoramento de áreas rurais vulneráveis e estradas vicinais.'),
((SELECT id FROM orgs WHERE nome_curto = 'SEAGRO'), 'Preparação'::fase_enum, 'Disponibilização de máquinas agrícolas e suporte a produtores.'),
((SELECT id FROM orgs WHERE nome_curto = 'SEAGRO'), 'Resposta'::fase_enum, 'Desobstrução de estradas rurais e atendimento a comunidades agrárias.'),

-- INTERIOR
((SELECT id FROM orgs WHERE nome_curto = 'INTERIOR'), 'Prevenção'::fase_enum, 'Vistoria e manutenção de pontes e pontilhões no interior.'),
((SELECT id FROM orgs WHERE nome_curto = 'INTERIOR'), 'Preparação'::fase_enum, 'Prontidão de equipes locais nos distritos.'),
((SELECT id FROM orgs WHERE nome_curto = 'INTERIOR'), 'Resposta'::fase_enum, 'Socorro e logística rápida para distritos e localidades isoladas.'),

-- SEMMA
((SELECT id FROM orgs WHERE nome_curto = 'SEMMA'), 'Prevenção'::fase_enum, 'Fiscalização ambiental e monitoramento de áreas de preservação.'),
((SELECT id FROM orgs WHERE nome_curto = 'SEMMA'), 'Preparação'::fase_enum, 'Avaliação de risco de poda de árvores e encostas vegetadas.'),
((SELECT id FROM orgs WHERE nome_curto = 'SEMMA'), 'Resposta'::fase_enum, 'Remoção de árvores caídas e contenção de danos ambientais.'),

-- SEDES
((SELECT id FROM orgs WHERE nome_curto = 'SEDES'), 'Prevenção'::fase_enum, 'Patrulhamento preventivo e apoio em notificações.'),
((SELECT id FROM orgs WHERE nome_curto = 'SEDES'), 'Preparação'::fase_enum, 'Isolamento de áreas em risco iminente.'),
((SELECT id FROM orgs WHERE nome_curto = 'SEDES'), 'Resposta'::fase_enum, 'Patrulhamento de abrigos, isolamento de áreas de risco e apoio à PM.'),

-- CBMES
((SELECT id FROM orgs WHERE nome_curto = 'CBMES'), 'Prevenção'::fase_enum, 'Vistorias técnicas e pareceres de segurança.'),
((SELECT id FROM orgs WHERE nome_curto = 'CBMES'), 'Preparação'::fase_enum, 'Simulados e prontidão de resgate.'),
((SELECT id FROM orgs WHERE nome_curto = 'CBMES'), 'Resposta'::fase_enum, 'Busca, salvamento, resgate e combate a incêndios.'),

-- PMES
((SELECT id FROM orgs WHERE nome_curto = 'PMES'), 'Prevenção'::fase_enum, 'Policiamento ostensivo preventivo em áreas vulneráveis.'),
((SELECT id FROM orgs WHERE nome_curto = 'PMES'), 'Preparação'::fase_enum, 'Planos de contingência de segurança da ordem pública.'),
((SELECT id FROM orgs WHERE nome_curto = 'PMES'), 'Resposta'::fase_enum, 'Garantia da ordem pública, segurança dos abrigos e escolta de comboios.'),

-- SCBV
((SELECT id FROM orgs WHERE nome_curto = 'SCBV'), 'Prevenção'::fase_enum, 'Treinamento continuado de brigadistas e socorristas voluntários.'),
((SELECT id FROM orgs WHERE nome_curto = 'SCBV'), 'Preparação'::fase_enum, 'Prontidão de equipes voluntárias de primeiro atendimento.'),
((SELECT id FROM orgs WHERE nome_curto = 'SCBV'), 'Resposta'::fase_enum, 'Apoio em primeiros socorros, resgate e distribuição de insumos.'),

-- REMER
((SELECT id FROM orgs WHERE nome_curto = 'REMER'), 'Prevenção'::fase_enum, 'Manutenção de equipamentos de radioamador.'),
((SELECT id FROM orgs WHERE nome_curto = 'REMER'), 'Preparação'::fase_enum, 'Testes de comunicação e simulados de rede.'),
((SELECT id FROM orgs WHERE nome_curto = 'REMER'), 'Resposta'::fase_enum, 'Comunicação alternativa via radioamadores em caso de falha de telefonia (Decreto nº 022/2023).')
) AS v(orgao_id, fase, texto)
WHERE NOT EXISTS (SELECT 1 FROM atribuicoes LIMIT 1);

-- Habilitar RLS em todas as tabelas do PLACON
ALTER TABLE orgaos ENABLE ROW LEVEL SECURITY;
ALTER TABLE contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE atribuicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recursos_plano ENABLE ROW LEVEL SECURITY;
ALTER TABLE plano_versoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE plano_assinaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_orgao ENABLE ROW LEVEL SECURITY;
ALTER TABLE plano_contingencia_auditoria ENABLE ROW LEVEL SECURITY;

-- Remover politicas existentes para recriação limpa e sem erros
DROP POLICY IF EXISTS "Permitir leitura geral de orgaos" ON orgaos;
DROP POLICY IF EXISTS "Permitir leitura geral de contatos" ON contatos;
DROP POLICY IF EXISTS "Permitir leitura geral de atribuicoes" ON atribuicoes;
DROP POLICY IF EXISTS "Permitir leitura geral de recursos_plano" ON recursos_plano;
DROP POLICY IF EXISTS "Permitir leitura geral de plano_versoes" ON plano_versoes;
DROP POLICY IF EXISTS "Permitir leitura geral de plano_assinaturas" ON plano_assinaturas;
DROP POLICY IF EXISTS "Permitir leitura de usuario_orgao por usuarios autenticados" ON usuario_orgao;

DROP POLICY IF EXISTS "Permitir escrita de orgaos por COMPDEC" ON orgaos;
DROP POLICY IF EXISTS "Permitir escrita de contatos por COMPDEC ou responsavel do orgao" ON contatos;
DROP POLICY IF EXISTS "Permitir escrita de atribuicoes por COMPDEC ou responsavel do orgao" ON atribuicoes;
DROP POLICY IF EXISTS "Permitir escrita de recursos_plano por COMPDEC ou responsavel do orgao" ON recursos_plano;
DROP POLICY IF EXISTS "Permitir escrita de assinaturas por COMPDEC" ON plano_assinaturas;
DROP POLICY IF EXISTS "Permitir escrita de vinculo usuario_orgao por COMPDEC" ON usuario_orgao;

-- Criar Politicas de RLS: Leitura publica/geral
CREATE POLICY "Permitir leitura geral de orgaos" ON orgaos FOR SELECT USING (true);
CREATE POLICY "Permitir leitura geral de contatos" ON contatos FOR SELECT USING (true);
CREATE POLICY "Permitir leitura geral de atribuicoes" ON atribuicoes FOR SELECT USING (true);
CREATE POLICY "Permitir leitura geral de recursos_plano" ON recursos_plano FOR SELECT USING (true);
CREATE POLICY "Permitir leitura geral de plano_versoes" ON plano_versoes FOR SELECT USING (true);
CREATE POLICY "Permitir leitura geral de plano_assinaturas" ON plano_assinaturas FOR SELECT USING (true);
CREATE POLICY "Permitir leitura de usuario_orgao por usuarios autenticados" ON usuario_orgao FOR SELECT USING (auth.role() = 'authenticated');

-- Criar Politicas de RLS: Escrita restrita a COMPDEC/Admin ou usuarios vinculados
CREATE POLICY "Permitir escrita de orgaos por COMPDEC" ON orgaos FOR ALL USING (coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('COMPDEC', 'Admin', 'Administrador'));
CREATE POLICY "Permitir escrita de contatos por COMPDEC ou responsavel do orgao" ON contatos FOR ALL USING (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('COMPDEC', 'Admin', 'Administrador') OR
  EXISTS (SELECT 1 FROM usuario_orgao uo WHERE uo.orgao_id = contatos.orgao_id AND uo.usuario_id = auth.uid())
);
CREATE POLICY "Permitir escrita de atribuicoes por COMPDEC ou responsavel do orgao" ON atribuicoes FOR ALL USING (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('COMPDEC', 'Admin', 'Administrador') OR
  EXISTS (SELECT 1 FROM usuario_orgao uo WHERE uo.orgao_id = atribuicoes.orgao_id AND uo.usuario_id = auth.uid())
);
CREATE POLICY "Permitir escrita de recursos_plano por COMPDEC ou responsavel do orgao" ON recursos_plano FOR ALL USING (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('COMPDEC', 'Admin', 'Administrador') OR
  EXISTS (SELECT 1 FROM usuario_orgao uo WHERE uo.orgao_id = recursos_plano.orgao_id AND uo.usuario_id = auth.uid())
);
CREATE POLICY "Permitir escrita de assinaturas por COMPDEC" ON plano_assinaturas FOR ALL USING (coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('COMPDEC', 'Admin', 'Administrador'));
CREATE POLICY "Permitir escrita de vinculo usuario_orgao por COMPDEC" ON usuario_orgao FOR ALL USING (coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('COMPDEC', 'Admin', 'Administrador'));
