-- Migração de Remoção do Módulo Fissurômetro / Aberturas Patológicas
-- Remove tabelas de histórico e pontos de monitoramento de abertura

DROP TABLE IF EXISTS public.abertura_registro_fotografico CASCADE;
DROP TABLE IF EXISTS public.abertura_patologica CASCADE;
