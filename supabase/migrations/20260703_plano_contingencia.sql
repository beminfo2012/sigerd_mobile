-- Tabela orgaos
CREATE TABLE orgaos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome_curto VARCHAR(255) NOT NULL,
  nome_completo VARCHAR(255) NOT NULL,
  cor_hex VARCHAR(7),
  icone VARCHAR(50),
  descricao_responsabilidade TEXT,
  ordem_exibicao INTEGER
);

-- Tabela contatos
CREATE TABLE contatos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  orgao_id UUID REFERENCES orgaos(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  cargo VARCHAR(255) NOT NULL,
  telefone VARCHAR(50),
  email VARCHAR(255),
  is_responsavel_principal BOOLEAN DEFAULT false
);

-- Tabela atribuicoes
CREATE TYPE fase_enum AS ENUM ('Prevenção', 'Preparação', 'Resposta');

CREATE TABLE atribuicoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  orgao_id UUID REFERENCES orgaos(id) ON DELETE CASCADE,
  fase fase_enum NOT NULL,
  texto TEXT NOT NULL,
  ordem_exibicao INTEGER,
  base_legal VARCHAR(255)
);

-- Tabela recursos_plano
CREATE TYPE recurso_categoria_enum AS ENUM ('Veículos', 'Materiais', 'Recursos Humanos', 'Instituições e Apoio Voluntário');

CREATE TABLE recursos_plano (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  orgao_id UUID REFERENCES orgaos(id) ON DELETE CASCADE,
  mci_recurso_id UUID NOT NULL, -- references mci.recursos in actual schema, but let's assume it exists or use UUID
  categoria recurso_categoria_enum NOT NULL,
  alocado_no_plano INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela plano_versoes
CREATE TABLE plano_versoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_versao VARCHAR(50) NOT NULL,
  data_alteracao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  descricao_alteracao TEXT,
  observacoes TEXT
);

-- Tabela plano_assinaturas
CREATE TABLE plano_assinaturas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  orgao_id UUID REFERENCES orgaos(id) ON DELETE SET NULL,
  cargo VARCHAR(255) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  contato VARCHAR(255),
  identificacao_assinatura_edocs VARCHAR(255)
);

-- Popular dados iniciais de Órgãos (Seed)
INSERT INTO orgaos (nome_curto, nome_completo, cor_hex, icone, descricao_responsabilidade, ordem_exibicao) VALUES
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
('REMER', 'Radioamadores (REMER)', '#0284c7', 'Radio', 'Rede Nacional de Emergência de Radioamadores.', 21);

-- Inserir assinaturas baseadas na tabela fornecida
WITH orgs AS (SELECT id, nome_curto FROM orgaos)
INSERT INTO plano_assinaturas (orgao_id, cargo, nome, contato) VALUES
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
((SELECT id FROM orgs WHERE nome_curto = 'REMER'), 'Representante da REMER', 'Cleverson Altierry Callott', '(27) 99838-8889 · cleversonaltierry@hotmail.com');

-- Inserir Atribuições Base
WITH orgs AS (SELECT id, nome_curto FROM orgaos)
INSERT INTO atribuicoes (orgao_id, fase, texto) VALUES
-- COMPDEC
((SELECT id FROM orgs WHERE nome_curto = 'COMPDEC'), 'Prevenção', 'Mapeamento de áreas de risco e ações preventivas.'),
((SELECT id FROM orgs WHERE nome_curto = 'COMPDEC'), 'Preparação', 'Coordenação geral, vistorias e monitoramento de alertas.'),
((SELECT id FROM orgs WHERE nome_curto = 'COMPDEC'), 'Resposta', 'Coordenação do SCO, decretação de emergência e acionamento da CEPDEC.'),

-- SECOBR
((SELECT id FROM orgs WHERE nome_curto = 'SECOBR'), 'Prevenção', 'Manutenção preventiva de encostas e drenagem.'),
((SELECT id FROM orgs WHERE nome_curto = 'SECOBR'), 'Preparação', 'Vistorias geotécnicas e plantão 24h em maquinário pesado.'),
((SELECT id FROM orgs WHERE nome_curto = 'SECOBR'), 'Resposta', 'Obras de contenção, desobstrução de vias e suporte logístico em infraestrutura.'),

-- SEMSA
((SELECT id FROM orgs WHERE nome_curto = 'SEMSA'), 'Prevenção', 'Vigilância em saúde em áreas de risco.'),
((SELECT id FROM orgs WHERE nome_curto = 'SEMSA'), 'Preparação', 'Abastecimento de insumos e preparação de equipes médicas.'),
((SELECT id FROM orgs WHERE nome_curto = 'SEMSA'), 'Resposta', 'Assistência pré-hospitalar, vigilância epidemiológica e suporte em abrigos.'),

-- SETDAS
((SELECT id FROM orgs WHERE nome_curto = 'SETDAS'), 'Prevenção', 'Mapeamento socioeconômico em áreas vulneráveis.'),
((SELECT id FROM orgs WHERE nome_curto = 'SETDAS'), 'Preparação', 'Cadastro de abrigos e fornecedores de insumos emergenciais.'),
((SELECT id FROM orgs WHERE nome_curto = 'SETDAS'), 'Resposta', 'Triagem socioeconômica, gestão de abrigos e distribuição de assistência humanitária.'),

-- SEMED
((SELECT id FROM orgs WHERE nome_curto = 'SEMED'), 'Prevenção', 'Educação para redução de riscos de desastres.'),
((SELECT id FROM orgs WHERE nome_curto = 'SEMED'), 'Preparação', 'Preparação de escolas como possíveis abrigos temporários.'),
((SELECT id FROM orgs WHERE nome_curto = 'SEMED'), 'Resposta', 'Cessão de escolas como abrigo temporário e apoio na alimentação (merenda).'),

-- SECURB
((SELECT id FROM orgs WHERE nome_curto = 'SECURB'), 'Prevenção', 'Limpeza urbana regular para evitar obstrução de canais.'),
((SELECT id FROM orgs WHERE nome_curto = 'SECURB'), 'Preparação', 'Escala de plantão de equipes de limpeza.'),
((SELECT id FROM orgs WHERE nome_curto = 'SECURB'), 'Resposta', 'Limpeza de vias afetadas e sistemas de drenagem urbana.'),

-- SEDES
((SELECT id FROM orgs WHERE nome_curto = 'SEDES'), 'Prevenção', 'Patrulhamento preventivo e apoio em notificações.'),
((SELECT id FROM orgs WHERE nome_curto = 'SEDES'), 'Preparação', 'Isolamento de áreas em risco iminente.'),
((SELECT id FROM orgs WHERE nome_curto = 'SEDES'), 'Resposta', 'Patrulhamento de abrigos, isolamento de áreas de risco e apoio à PM.'),

-- CBMES
((SELECT id FROM orgs WHERE nome_curto = 'CBMES'), 'Prevenção', 'Vistorias técnicas e pareceres de segurança.'),
((SELECT id FROM orgs WHERE nome_curto = 'CBMES'), 'Preparação', 'Simulados e prontidão de resgate.'),
((SELECT id FROM orgs WHERE nome_curto = 'CBMES'), 'Resposta', 'Busca, salvamento, resgate e combate a incêndios.'),

-- REMER
((SELECT id FROM orgs WHERE nome_curto = 'REMER'), 'Prevenção', 'Manutenção de equipamentos de radioamador.'),
((SELECT id FROM orgs WHERE nome_curto = 'REMER'), 'Preparação', 'Testes de comunicação e simulados de rede.'),
((SELECT id FROM orgs WHERE nome_curto = 'REMER'), 'Resposta', 'Comunicação alternativa via radioamadores em caso de falha de telefonia (Decreto nº 022/2023).');

-- Nova Tabela de Vinculos (Usuario - Orgao)
CREATE TABLE usuario_orgao (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  orgao_id UUID REFERENCES orgaos(id) ON DELETE CASCADE,
  UNIQUE(usuario_id, orgao_id)
);
