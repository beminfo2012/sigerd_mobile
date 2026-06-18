-- ============================================================
-- MIGRAÇÃO: Adiciona documento anexo ao termo de voluntariado
-- ============================================================

ALTER TABLE voluntarios
ADD COLUMN IF NOT EXISTS documento_termo_url TEXT;
