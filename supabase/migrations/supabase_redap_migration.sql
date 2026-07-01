-- ==============================================================================
-- SCRIPT DE MIGRAÇÃO SUPABASE: S2ID -> REDAP
-- ==============================================================================
-- Este script realiza a transição completa da nomenclatura no banco de dados.
-- Execute este script no SQL Editor do seu projeto Supabase.

-- 1. Renomear a tabela principal de registros
ALTER TABLE public.s2id_records RENAME TO redap_records;

-- 2. Renomear a coluna de ID de sincronização (UUID)
-- O código agora espera 'redap_id' para evitar conflitos
ALTER TABLE public.redap_records RENAME COLUMN s2id_id TO redap_id;

-- 3. Atualizar as Roles dos usuários (Transição Gradual)
-- Converte 'S2id_Saude' em 'Redap_Saude', etc.
UPDATE public.profiles 
SET role = REPLACE(role, 'S2id_', 'Redap_') 
WHERE role LIKE 'S2id_%';

-- 4. (Opcional) Ajustar o Dashboard para o novo nome da tabela
-- As políticas RLS e triggers são preservadas automaticamente ao renomear a tabela.

-- FIM DA MIGRAÇÃO
