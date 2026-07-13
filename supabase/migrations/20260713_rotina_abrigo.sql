-- Migration: Rotina de Funcionamento do Abrigo
BEGIN;

CREATE TYPE categoria_rotina_abrigo AS ENUM (
    'alimentacao', 'higiene', 'descanso', 'administrativo',
    'saude', 'recreacao', 'religioso', 'seguranca'
);

CREATE TYPE padrao_recorrencia_rotina AS ENUM ('horario_fixo', 'intervalo_horas');

CREATE TYPE status_execucao_rotina AS ENUM ('pendente', 'realizada', 'nao_realizada');

CREATE TABLE catalogo_rotina_padrao_abrigo (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo                  VARCHAR(40) NOT NULL UNIQUE,
    atividade               VARCHAR(120) NOT NULL,
    categoria               categoria_rotina_abrigo NOT NULL,
    horario_sugerido_inicio TIME NOT NULL,
    horario_sugerido_fim    TIME NULL,
    padrao_recorrencia      padrao_recorrencia_rotina NOT NULL DEFAULT 'horario_fixo',
    intervalo_horas         INTEGER NULL,
    descricao               TEXT NULL,
    ordem_padrao            INTEGER NOT NULL DEFAULT 0
);

INSERT INTO catalogo_rotina_padrao_abrigo (codigo, atividade, categoria, horario_sugerido_inicio, horario_sugerido_fim, padrao_recorrencia, intervalo_horas, descricao, ordem_padrao) VALUES
    ('abertura_abrigo', 'Abertura do Abrigo', 'administrativo', '06:00', NULL, 'horario_fixo', NULL, 'Liberação de entrada e saída de abrigados.', 10),
    ('alvorada', 'Alvorada (despertar)', 'descanso', '07:00', NULL, 'horario_fixo', NULL, 'Horário sugerido de despertar coletivo.', 20),
    ('cafe_manha', 'Café da Manhã', 'alimentacao', '07:30', '08:00', 'horario_fixo', NULL, NULL, 30),
    ('lactario', 'Lactário (amamentação)', 'saude', '02:00', NULL, 'intervalo_horas', 3, 'Horários de apoio à amamentação, a cada 3 horas.', 40),
    ('espaco_recreativo_manha', 'Espaço Recreativo (manhã)', 'recreacao', '08:00', '11:00', 'horario_fixo', NULL, NULL, 50),
    ('almoco', 'Almoço', 'alimentacao', '12:00', '13:00', 'horario_fixo', NULL, NULL, 60),
    ('espaco_recreativo_tarde', 'Espaço Recreativo (tarde)', 'recreacao', '14:00', '17:00', 'horario_fixo', NULL, NULL, 70),
    ('jantar', 'Jantar', 'alimentacao', '18:00', '19:00', 'horario_fixo', NULL, NULL, 80),
    ('fechamento_abrigo', 'Fechamento do Abrigo', 'administrativo', '23:00', NULL, 'horario_fixo', NULL, 'Após este horário, acesso restrito.', 90),
    ('limpeza_dormitorios', 'Limpeza dos Dormitórios e Áreas Comuns', 'higiene', '09:00', '10:00', 'horario_fixo', NULL, 'Compartilhada com abrigados.', 100),
    ('banho', 'Horário de Banho', 'higiene', '17:00', '18:00', 'horario_fixo', NULL, NULL, 110);

CREATE TABLE abrigo_rotina_item (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    abrigo_id           UUID NOT NULL REFERENCES shelters(id) ON DELETE CASCADE,
    atividade           VARCHAR(120) NOT NULL,
    categoria           categoria_rotina_abrigo NOT NULL,
    horario_inicio      TIME NOT NULL,
    horario_fim         TIME NULL,
    padrao_recorrencia  padrao_recorrencia_rotina NOT NULL DEFAULT 'horario_fixo',
    intervalo_horas     INTEGER NULL,
    dias_semana         SMALLINT[] NULL,
    observacao          TEXT NULL,
    responsavel_id      UUID NULL REFERENCES auth.users(id),
    ordem               INTEGER NOT NULL DEFAULT 0,
    ativo               BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rotina_abrigo ON abrigo_rotina_item (abrigo_id, horario_inicio);

CREATE TABLE abrigo_rotina_execucao (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rotina_item_id          UUID NOT NULL REFERENCES abrigo_rotina_item(id) ON DELETE CASCADE,
    data_referencia         DATE NOT NULL,
    status                  status_execucao_rotina NOT NULL DEFAULT 'pendente',
    usuario_id              UUID NULL REFERENCES auth.users(id),
    data_hora_confirmacao   TIMESTAMPTZ NULL,
    observacao              TEXT NULL,
    operacao_id             UUID NULL REFERENCES operacao_assistencia_humanitaria(id) ON DELETE SET NULL,
    UNIQUE(rotina_item_id, data_referencia)
);

CREATE INDEX idx_rotina_execucao ON abrigo_rotina_execucao (rotina_item_id, data_referencia);

CREATE TABLE abrigo_regra_convivencia (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    abrigo_id   UUID NOT NULL REFERENCES shelters(id) ON DELETE CASCADE,
    texto_regra TEXT NOT NULL,
    ordem       INTEGER NOT NULL DEFAULT 0,
    ativo       BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_regra_convivencia_abrigo ON abrigo_regra_convivencia (abrigo_id);

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

CREATE OR REPLACE FUNCTION fn_touch_rotina_abrigo() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_touch_rotina_abrigo
    BEFORE UPDATE ON abrigo_rotina_item
    FOR EACH ROW EXECUTE FUNCTION fn_touch_rotina_abrigo();

-- RLS Policies
ALTER TABLE catalogo_rotina_padrao_abrigo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leitura para autenticados" ON catalogo_rotina_padrao_abrigo FOR SELECT TO authenticated USING (true);

ALTER TABLE abrigo_rotina_item ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para autenticados" ON abrigo_rotina_item FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE abrigo_rotina_execucao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para autenticados" ON abrigo_rotina_execucao FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE abrigo_regra_convivencia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para autenticados" ON abrigo_regra_convivencia FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE catalogo_regra_convivencia_padrao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leitura para autenticados" ON catalogo_regra_convivencia_padrao FOR SELECT TO authenticated USING (true);

COMMIT;
