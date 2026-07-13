-- Migration: Abrigo de Animais
BEGIN;

CREATE TYPE tipo_ponto_apoio_animal AS ENUM (
    'area_interna', 'canil_municipal', 'ong', 'clinica_veterinaria', 'outro'
);

CREATE TYPE status_encaminhamento_animal AS ENUM (
    'encaminhado', 'no_local', 'devolvido_ao_tutor', 'obito'
);

CREATE TABLE ponto_apoio_animal (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome                        VARCHAR(120) NOT NULL,
    tipo                        tipo_ponto_apoio_animal NOT NULL,
    abrigo_humano_vinculado_id  UUID NULL REFERENCES shelters(id) ON DELETE SET NULL,
    endereco                    TEXT NOT NULL,
    latitude                    NUMERIC NULL,
    longitude                   NUMERIC NULL,
    capacidade_maxima           INTEGER NOT NULL DEFAULT 0,
    telefone_contato            VARCHAR(20) NULL,
    ativo                       BOOLEAN NOT NULL DEFAULT true,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE animal_estimacao (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_pessoa_id             UUID NOT NULL REFERENCES shelter_occupants(id) ON DELETE CASCADE,
    abrigo_humano_id            UUID NOT NULL REFERENCES shelters(id) ON DELETE CASCADE,
    nome                        VARCHAR(120) NOT NULL,
    especie                     VARCHAR(50) NOT NULL,
    raca                        VARCHAR(50) NULL,
    porte                       VARCHAR(20) NULL,
    idade_estimada_anos         NUMERIC NULL,
    sexo                        VARCHAR(20) NULL,
    castrado                    BOOLEAN NULL,
    vacinado_antirrabica        BOOLEAN NOT NULL DEFAULT false,
    data_ultima_vacina          DATE NULL,
    microchip_numero            VARCHAR(50) NULL,
    temperamento_observacoes    TEXT NULL,
    condicao_saude_observacoes  TEXT NULL,
    ativo                       BOOLEAN NOT NULL DEFAULT true,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE animal_encaminhamento (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    animal_id                   UUID NOT NULL REFERENCES animal_estimacao(id) ON DELETE CASCADE,
    ponto_apoio_id              UUID NOT NULL REFERENCES ponto_apoio_animal(id) ON DELETE CASCADE,
    status                      status_encaminhamento_animal NOT NULL DEFAULT 'encaminhado',
    distancia_km_no_momento     NUMERIC NULL,
    observacao                  TEXT NULL,
    data_encaminhamento         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_chegada_local          TIMESTAMPTZ NULL,
    data_devolucao_tutor        TIMESTAMPTZ NULL,
    usuario_responsavel_id      UUID NULL REFERENCES auth.users(id),
    ativo                       BOOLEAN NOT NULL DEFAULT true,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS (Row Level Security)
ALTER TABLE ponto_apoio_animal ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal_estimacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal_encaminhamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access to ponto_apoio_animal" ON ponto_apoio_animal FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to animal_estimacao" ON animal_estimacao FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to animal_encaminhamento" ON animal_encaminhamento FOR ALL TO authenticated USING (true);

COMMIT;
