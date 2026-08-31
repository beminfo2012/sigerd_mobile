-- SUPABASE MIGRATION - ADD MISSING FIELDS FOR VISTORIAS
-- Adiciona os campos de categoria_risco, subtipos_risco e medidas_tomadas

ALTER TABLE IF EXISTS public.vistorias
ADD COLUMN IF NOT EXISTS categoria_risco TEXT,
ADD COLUMN IF NOT EXISTS subtipos_risco JSONB DEFAULT '[]'::JSONB,
ADD COLUMN IF NOT EXISTS medidas_tomadas JSONB DEFAULT '[]'::JSONB;
