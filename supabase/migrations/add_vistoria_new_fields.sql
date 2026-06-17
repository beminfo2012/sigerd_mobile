-- ============================================================
-- MIGRAÇÃO: Adicionar novas colunas à tabela `vistorias`
-- Data: 2026-06-17
-- Motivo: Sincronização com novos campos do VistoriaForm.jsx
-- ============================================================

-- 1. avaliacao_arborea (JSONB) — Avaliação específica para risco arbóreo
--    Campos: parte_afetada, porte_arvore, frequencia_ocupacao_alvo
ALTER TABLE vistorias
ADD COLUMN IF NOT EXISTS avaliacao_arborea JSONB DEFAULT NULL;

-- 2. encaminhamentos (JSONB[]) — Lista de órgãos para encaminhamento
--    Exemplo: ["Secretaria de Obras", "Bombeiros: Urgente"]
ALTER TABLE vistorias
ADD COLUMN IF NOT EXISTS encaminhamentos JSONB DEFAULT '[]'::JSONB;

-- 3. cargo (TEXT) — Cargo do agente responsável pela vistoria
ALTER TABLE vistorias
ADD COLUMN IF NOT EXISTS cargo TEXT DEFAULT '';

-- 4. documentos (JSONB) — Documentos anexados à vistoria
ALTER TABLE vistorias
ADD COLUMN IF NOT EXISTS documentos JSONB DEFAULT '[]'::JSONB;

-- ============================================================
-- VERIFICAÇÃO: confirme as colunas após executar
-- ============================================================
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'vistorias'
-- ORDER BY ordinal_position;
