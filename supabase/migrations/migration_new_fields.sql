-- SUPABASE MIGRATION - NEW FIELDS FOR SYNC
-- Run this in your Supabase SQL Editor

-- 1. Ocorrencias: Add subtipo_risco_outros and informacoes_complementares
ALTER TABLE IF EXISTS ocorrencias 
ADD COLUMN IF NOT EXISTS subtipo_risco_outros TEXT,
ADD COLUMN IF NOT EXISTS informacoes_complementares TEXT;

-- 2. Vistorias: Add informacoes_complementares
ALTER TABLE IF EXISTS vistorias
ADD COLUMN IF NOT EXISTS informacoes_complementares TEXT;

-- 3. Interdicoes: Add informacoes_complementares
ALTER TABLE IF EXISTS interdicoes
ADD COLUMN IF NOT EXISTS informacoes_complementares TEXT;

-- 4. Ensure RLS is still active (optional if already set)
-- No changes needed to RLS policies as they usually cover all columns by default.
