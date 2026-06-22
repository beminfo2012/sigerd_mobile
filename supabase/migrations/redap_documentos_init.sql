-- ============================================================
-- MIGRAÇÃO: Módulo de Gestão Documental REDAP
-- Tabela: redap_documentos
-- ============================================================

CREATE TABLE IF NOT EXISTS redap_documentos (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id           UUID NOT NULL, -- FK lógica para eventos_desastre
    tipo                VARCHAR(80) NOT NULL,
    nome_personalizado  VARCHAR(150) NOT NULL,
    arquivo_url         TEXT,
    numero_documento    VARCHAR(80),
    data_documento      DATE,
    observacao          TEXT,
    usuario_id          UUID, -- Removida a FK para auth.users para evitar problemas de restrição
    data_upload         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status_documento    VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
    dispensado_motivo   TEXT,
    criado_em           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    atualizado_em       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    CONSTRAINT chk_redap_doc_status CHECK (status_documento IN ('PENDENTE', 'ANEXADO', 'DISPENSADO'))
);

CREATE INDEX IF NOT EXISTS idx_redap_documentos_evento ON redap_documentos (evento_id);
CREATE INDEX IF NOT EXISTS idx_redap_documentos_tipo ON redap_documentos (tipo, status_documento);

-- Storage bucket para arquivos dos documentos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('redap-documentos', 'redap-documentos', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- RLS (Liberação total controlada no frontend)
-- ============================================================
ALTER TABLE redap_documentos ENABLE ROW LEVEL SECURITY;

-- Limpa as políticas individuais anteriores
DROP POLICY IF EXISTS "redap_documentos_select" ON redap_documentos;
DROP POLICY IF EXISTS "redap_documentos_insert" ON redap_documentos;
DROP POLICY IF EXISTS "redap_documentos_update" ON redap_documentos;
DROP POLICY IF EXISTS "redap_documentos_delete" ON redap_documentos;

-- Cria uma política única permissiva para quem tem o app
DROP POLICY IF EXISTS "redap_doc_full_access" ON redap_documentos;
CREATE POLICY "redap_doc_full_access" ON redap_documentos FOR ALL USING (true) WITH CHECK (true);

-- Storage RLS para o bucket redap-documentos
DROP POLICY IF EXISTS "redap_doc_upload" ON storage.objects;
CREATE POLICY "redap_doc_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'redap-documentos');

DROP POLICY IF EXISTS "redap_doc_read" ON storage.objects;
CREATE POLICY "redap_doc_read" ON storage.objects FOR SELECT USING (bucket_id = 'redap-documentos');

DROP POLICY IF EXISTS "redap_doc_delete" ON storage.objects;
CREATE POLICY "redap_doc_delete" ON storage.objects FOR DELETE USING (bucket_id = 'redap-documentos');

DROP POLICY IF EXISTS "redap_doc_update" ON storage.objects;
CREATE POLICY "redap_doc_update" ON storage.objects FOR UPDATE USING (bucket_id = 'redap-documentos');

SELECT 'redap_documentos e Storage criados com sucesso!' AS resultado;
