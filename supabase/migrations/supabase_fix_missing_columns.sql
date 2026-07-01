-- Add missing columns to ocorrencias_operacionais
ALTER TABLE IF EXISTS public.ocorrencias_operacionais 
ADD COLUMN IF NOT EXISTS medidas_tomadas TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS unidade_consumidora TEXT,
ADD COLUMN IF NOT EXISTS informacoes_complementares TEXT;

-- Ensure RLS allows delete for interdicoes (already seems to, but just in case)
-- This migration is mainly for the missing columns in ocorrencias.
