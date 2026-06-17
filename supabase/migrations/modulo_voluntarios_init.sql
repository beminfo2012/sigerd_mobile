-- ============================================================
-- MIGRAÇÃO: Criação do Módulo de Voluntários
-- Data: 2026-06-17
-- ============================================================

-- 1. areas_atuacao (Taxonomia de especialidades)
CREATE TABLE IF NOT EXISTS areas_atuacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL UNIQUE,
    descricao TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. voluntarios (Cadastro principal)
CREATE TABLE IF NOT EXISTS voluntarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_completo TEXT NOT NULL,
    cpf TEXT UNIQUE,
    rg TEXT,
    data_nascimento DATE,
    telefone TEXT NOT NULL,
    email TEXT,
    contato_emergencia TEXT,
    endereco TEXT,
    bairro TEXT,
    vinculo TEXT, -- voluntário independente, ONG, servidor, etc.
    veiculo_proprio TEXT,
    equipamentos_proprios TEXT,
    restricoes TEXT,
    status TEXT DEFAULT 'ativo', -- ativo, inativo, suspenso, em análise
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. voluntario_area (Relação Voluntário x Área de Atuação)
CREATE TABLE IF NOT EXISTS voluntario_area (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voluntario_id UUID REFERENCES voluntarios(id) ON DELETE CASCADE,
    area_id UUID REFERENCES areas_atuacao(id) ON DELETE CASCADE,
    nivel_experiencia TEXT DEFAULT 'básico', -- básico, intermediário, avançado, profissional habilitado
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(voluntario_id, area_id)
);

-- 4. disponibilidade (Janelas de disponibilidade)
CREATE TABLE IF NOT EXISTS disponibilidade (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voluntario_id UUID REFERENCES voluntarios(id) ON DELETE CASCADE,
    dias_semana JSONB DEFAULT '[]'::JSONB, -- ex: ["Segunda", "Sábado", "Domingo"]
    periodo TEXT, -- Manhã, Tarde, Noite, Integral
    raio_atuacao TEXT, -- Bairro, Município, Região
    status_tempo_real TEXT DEFAULT 'disponível', -- disponível, em missão, indisponível
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. termos_adesao (Controle de assinatura)
CREATE TABLE IF NOT EXISTS termos_adesao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voluntario_id UUID REFERENCES voluntarios(id) ON DELETE CASCADE,
    assinado BOOLEAN DEFAULT FALSE,
    data_assinatura TIMESTAMPTZ,
    arquivo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. acionamentos (Convocações disparadas)
CREATE TABLE IF NOT EXISTS acionamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo TEXT NOT NULL,
    descricao TEXT,
    evento_id UUID, -- Referência opcional a evento do REDAP
    data_criacao TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'aberto', -- aberto, em andamento, finalizado, cancelado
    coordenador_id UUID -- Referência ao usuário que criou (auth.users)
);

-- 7. acionamento_resposta (Respostas dos voluntários)
CREATE TABLE IF NOT EXISTS acionamento_resposta (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    acionamento_id UUID REFERENCES acionamentos(id) ON DELETE CASCADE,
    voluntario_id UUID REFERENCES voluntarios(id) ON DELETE CASCADE,
    resposta TEXT DEFAULT 'pendente', -- pendente, aceito, recusado
    data_resposta TIMESTAMPTZ,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(acionamento_id, voluntario_id)
);

-- 8. missoes (Registro consolidado de atuação)
CREATE TABLE IF NOT EXISTS missoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    acionamento_id UUID REFERENCES acionamentos(id),
    voluntario_id UUID REFERENCES voluntarios(id),
    data_inicio TIMESTAMPTZ,
    data_fim TIMESTAMPTZ,
    horas_trabalhadas NUMERIC(5,2),
    atividade_realizada TEXT,
    avaliacao_coordenador TEXT,
    evidencias JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. certificacoes (Capacitações)
CREATE TABLE IF NOT EXISTS certificacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voluntario_id UUID REFERENCES voluntarios(id) ON DELETE CASCADE,
    curso TEXT NOT NULL,
    instituicao TEXT,
    carga_horaria INTEGER,
    data_conclusao DATE,
    data_validade DATE,
    certificado_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir algumas áreas de atuação padrão
INSERT INTO areas_atuacao (nome) VALUES
('Resgate e salvamento'),
('Atendimento pré-hospitalar / saúde'),
('Psicologia e assistência social'),
('Engenharia, construção civil e operação de máquinas pesadas'),
('Eletricidade e manutenção predial'),
('Logística, transporte e condução de veículos'),
('Comunicação (rádioamadores, redes sociais, TI)'),
('Operação de drone'),
('Combate a incêndio (bombeiro civil)'),
('Cozinha e preparo de alimentação emergencial'),
('Tradução e Libras'),
('Manejo e resgate de animais'),
('Apoio administrativo e digitação de cadastros'),
('Mergulho / operações em ambiente aquático')
ON CONFLICT (nome) DO NOTHING;
