-- SUPABASE MIGRATION - NEW FIELDS FOR VISTORIAS
-- Run this in your Supabase SQL Editor

-- Add residencias_em_risco and area_afetada columns to vistorias table
ALTER TABLE IF EXISTS public.vistorias
ADD COLUMN IF NOT EXISTS residencias_em_risco INTEGER,
ADD COLUMN IF NOT EXISTS area_afetada NUMERIC;
