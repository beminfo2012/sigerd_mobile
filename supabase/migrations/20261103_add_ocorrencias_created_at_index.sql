-- Migration: Otimização de Performance para Ocorrencias Operacionais
-- Corrige o problema de statement timeout ao ordenar por created_at

-- 1. Índice composto / descendente em created_at para ordenação rápida
CREATE INDEX IF NOT EXISTS idx_ocorrencias_operacionais_created_at_desc 
ON public.ocorrencias_operacionais (created_at DESC);

-- 2. Índice em data_ocorrencia e status para buscas frequentes
CREATE INDEX IF NOT EXISTS idx_ocorrencias_operacionais_data 
ON public.ocorrencias_operacionais (data_ocorrencia);

CREATE INDEX IF NOT EXISTS idx_ocorrencias_operacionais_status 
ON public.ocorrencias_operacionais (status);

-- 3. Atualizar estatísticas do PostgreSQL
ANALYZE public.ocorrencias_operacionais;

