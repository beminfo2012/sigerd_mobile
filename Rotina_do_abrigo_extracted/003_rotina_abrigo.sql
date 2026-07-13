-- =====================================================================
-- Migração: Rotina de Funcionamento e Regras de Convivência do Abrigo
-- SIGERD — PostgreSQL
-- =====================================================================
-- Base doutrinária: a doutrina de abrigos humanitários (ex.: Manual de
-- Instalação de Abrigos Temporários, item "Rotina do Abrigo") exige que
-- todo abrigo estabeleça uma rotina de funcionamento com horários fixos
-- para cada atividade (alvorada, refeições, abertura/fechamento, lactário,
-- espaço recreativo etc.), definida pela administração considerando o
-- contexto cultural da comunidade, e que as regras sejam claras, válidas
-- para todos e afixadas em local de fácil visibilidade.
-- =====================================================================

BEGIN;

CREATE TYPE categoria_rotina_abrigo AS ENUM (
    'alimentacao', 'higiene', 'descanso', 'administrativo',
    'saude', 'recreacao', 'religioso', 'seguranca'
);

CREATE TYPE padrao_recorrencia_rotina AS ENUM ('horario_fixo', 'intervalo_horas');

-- ---------------------------------------------------------------------
-- 1. Catálogo padrão (modelo sugerido pela doutrina) — mestre, único no
--    SIGERD, usado para "aplicar modelo padrão" em qualquer abrigo novo,
--    que depois é ajustado ao contexto local.
-- ---------------------------------------------------------------------
CREATE TABLE catalogo_rotina_padrao_abrigo (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo                  VARCHAR(40) NOT NULL UNIQUE,
    atividade               VARCHAR(120) NOT NULL,
    categoria               categoria_rotina_abrigo NOT NULL,
    horario_sugerido_inicio TIME NOT NULL,
    horario_sugerido_fim    TIME NULL,
    padrao_recorrencia      padrao_recorrencia_rotina NOT NULL DEFAULT 'horario_fixo',
    intervalo_horas         INTEGER NULL,  -- ex.: lactário a cada 3h
    descricao               TEXT NULL,
    ordem_padrao            INTEGER NOT NULL DEFAULT 0
);

-- Seed — modelo sugerido pela doutrina (ajustável pela Defesa Civil)
INSERT INTO catalogo_rotina_padrao_abrigo
    (codigo, atividade, categoria, horario_sugerido_inicio, horario_sugerido_fim, padrao_recorrencia, intervalo_horas, descricao, ordem_padrao)
VALUES
    ('abertura_abrigo', 'Abertura do Abrigo', 'administrativo', '06:00', NULL, 'horario_fixo', NULL,
     'Liberação de entrada e saída de abrigados.', 10),
    ('alvorada', 'Alvorada (despertar)', 'descanso', '07:00', NULL, 'horario_fixo', NULL,
     'Horário sugerido de despertar coletivo.', 20),
    ('cafe_manha', 'Café da Manhã', 'alimentacao', '07:30', '08:00', 'horario_fixo', NULL, NULL, 30),
    ('lactario', 'Lactário (amamentação)', 'saude', '02:00', NULL, 'intervalo_horas', 3,
     'Horários de apoio à amamentação, a cada 3 horas.', 40),
    ('espaco_recreativo_manha', 'Espaço Recreativo (manhã)', 'recreacao', '08:00', '11:00', 'horario_fixo', NULL, NULL, 50),
    ('almoco', 'Almoço', 'alimentacao', '12:00', '13:00', 'horario_fixo', NULL, NULL, 60),
    ('espaco_recreativo_tarde', 'Espaço Recreativo (tarde)', 'recreacao', '14:00', '17:00', 'horario_fixo', NULL, NULL, 70),
    ('jantar', 'Jantar', 'alimentacao', '18:00', '19:00', 'horario_fixo', NULL, NULL, 80),
    ('fechamento_abrigo', 'Fechamento do Abrigo', 'administrativo', '23:00', NULL, 'horario_fixo', NULL,
     'Após este horário, acesso restrito — abrigados com chegada tardia (ex.: trabalho) devem avisar previamente a administração.', 90),
    ('limpeza_dormitorios', 'Limpeza dos Dormitórios e Áreas Comuns', 'higiene', '09:00', '10:00', 'horario_fixo', NULL,
     'Atividade preferencialmente compartilhada com os abrigados, respeitando condições físicas/psíquicas de cada um.', 100),
    ('banho', 'Horário de Banho', 'higiene', '17:00', '18:00', 'horario_fixo', NULL, NULL, 110);

-- ---------------------------------------------------------------------
-- 2. Rotina efetiva de cada abrigo — copiada do catálogo e depois
--    ajustada pela administração ao contexto cultural local, ou criada
--    do zero.
-- ---------------------------------------------------------------------
CREATE TABLE abrigo_rotina_item (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    abrigo_id           UUID NOT NULL REFERENCES abrigos(id),
    atividade           VARCHAR(120) NOT NULL,
    categoria           categoria_rotina_abrigo NOT NULL,
    horario_inicio      TIME NOT NULL,
    horario_fim         TIME NULL,
    padrao_recorrencia  padrao_recorrencia_rotina NOT NULL DEFAULT 'horario_fixo',
    intervalo_horas     INTEGER NULL,
    dias_semana         SMALLINT[] NULL,  -- NULL = todos os dias; ex.: {0,6} = dom/sáb (cultos, por ex.)
    observacao          TEXT NULL,
    responsavel_id      UUID NULL REFERENCES usuarios(id),  -- quem coordena a atividade, se aplicável
    ordem               INTEGER NOT NULL DEFAULT 0,
    ativo               BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rotina_abrigo ON abrigo_rotina_item (abrigo_id, horario_inicio);

-- ---------------------------------------------------------------------
-- 3. Regras de convivência — devem ser claras, válidas para todos e
--    afixadas em local visível (mesmo mural/impresso da rotina).
-- ---------------------------------------------------------------------
CREATE TABLE abrigo_regra_convivencia (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    abrigo_id   UUID NOT NULL REFERENCES abrigos(id),
    texto_regra TEXT NOT NULL,
    ordem       INTEGER NOT NULL DEFAULT 0,
    ativo       BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_regra_convivencia_abrigo ON abrigo_regra_convivencia (abrigo_id);

-- Seed opcional de regras-base sugeridas pela doutrina (itens 20 e 30
-- do manual — controle de acesso, proibição de bebida alcoólica/armas,
-- respeito ao horário de fechamento). Usadas como sugestão inicial ao
-- aplicar o modelo padrão; o texto pode ser editado livremente.
CREATE TABLE catalogo_regra_convivencia_padrao (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    texto_regra TEXT NOT NULL,
    ordem_padrao INTEGER NOT NULL DEFAULT 0
);

INSERT INTO catalogo_regra_convivencia_padrao (texto_regra, ordem_padrao) VALUES
('É proibida a entrada de bebidas alcoólicas, armas, objetos cortantes e entorpecentes no abrigo.', 10),
('O acesso e a saída de pessoas devem ocorrer exclusivamente pelo ponto de controle designado.', 20),
('Após o horário de fechamento, o acesso é restrito; avise a administração com antecedência em caso de chegada tardia por motivo de trabalho.', 30),
('Respeite os horários e locais destinados a cada atividade (refeições, banho, descanso e recreação).', 40),
('Mantenha a organização e a limpeza dos espaços comuns; a colaboração de todos é fundamental.', 50),
('Toda manifestação religiosa deve ser previamente combinada com a administração, respeitando a diversidade de crenças no abrigo.', 60);

-- ---------------------------------------------------------------------
-- 4. Trigger updated_at
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_touch_rotina_abrigo() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_touch_rotina_abrigo
    BEFORE UPDATE ON abrigo_rotina_item
    FOR EACH ROW EXECUTE FUNCTION fn_touch_rotina_abrigo();

COMMIT;

-- =====================================================================
-- Rollback:
-- BEGIN;
-- DROP TRIGGER IF EXISTS trg_touch_rotina_abrigo ON abrigo_rotina_item;
-- DROP FUNCTION IF EXISTS fn_touch_rotina_abrigo();
-- DROP TABLE IF EXISTS catalogo_regra_convivencia_padrao;
-- DROP TABLE IF EXISTS abrigo_regra_convivencia;
-- DROP TABLE IF EXISTS abrigo_rotina_item;
-- DROP TABLE IF EXISTS catalogo_rotina_padrao_abrigo;
-- DROP TYPE IF EXISTS padrao_recorrencia_rotina;
-- DROP TYPE IF EXISTS categoria_rotina_abrigo;
-- COMMIT;
-- =====================================================================
