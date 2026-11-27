-- =====================================================================
-- SIGERD Mobile - Ocorrências Operacionais: Período (Data/Hora Inicial e Final)
-- e alinhamento completo de campos entre formulário e relatório
-- =====================================================================

ALTER TABLE public.ocorrencias_operacionais ADD COLUMN IF NOT EXISTS data_fim_ocorrencia text NULL;
ALTER TABLE public.ocorrencias_operacionais ADD COLUMN IF NOT EXISTS horario_fim_ocorrencia text NULL;
ALTER TABLE public.ocorrencias_operacionais ADD COLUMN IF NOT EXISTS complemento text NULL;
ALTER TABLE public.ocorrencias_operacionais ADD COLUMN IF NOT EXISTS situacao_observada text NULL;
ALTER TABLE public.ocorrencias_operacionais ADD COLUMN IF NOT EXISTS area_estimada text NULL;
ALTER TABLE public.ocorrencias_operacionais ADD COLUMN IF NOT EXISTS referencias_normativas jsonb NULL;
