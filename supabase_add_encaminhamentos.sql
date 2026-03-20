-- Adiciona a coluna 'encaminhamentos' que está faltando na tabela ocorrencias_operacionais
-- Isso resolve o erro "Could not find the 'encaminhamentos' column"

ALTER TABLE public.ocorrencias_operacionais 
ADD COLUMN IF NOT EXISTS encaminhamentos TEXT[] DEFAULT '{}';

-- Garante que outras colunas que podem ser usadas também existam
ALTER TABLE public.ocorrencias_operacionais 
ADD COLUMN IF NOT EXISTS unidade_consumidora TEXT,
ADD COLUMN IF NOT EXISTS informacoes_complementares TEXT;

-- O Supabase atualizará o cache do esquema automaticamente após rodar este DDL.
