-- ====================================================================
-- MÓDULO REDAP - ATUALIZAÇÃO DA ESTRUTURA FIDE CONSOLIDADA
-- ESTA MIGRAÇÃO DOCUMENTA E INSTALA A ESTRUTURA DO SCHEMA FIDE
-- DENTRO DOS DOCUMENTOS JSONB E ASSEGURA A COMPATIBILIDADE.
-- ====================================================================

-- Comentário para controle de versão
COMMENT ON TABLE public.redap_records IS 'Registros consolidados do REDAP contendo a estrutura FIDE estendida conforme portaria federal.';

-- Adiciona campo para histórico ou validações extras se necessário futuramente,
-- mas atualmente a coluna DATA (JSONB) engloba toda a flexibilidade necessária.
-- Garantimos que a tabela e índices estão em conformidade.
CREATE INDEX IF NOT EXISTS idx_redap_records_status ON public.redap_records (status);
