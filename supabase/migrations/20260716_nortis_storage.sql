-- Habilita o bucket de arquivos PDF do NORTIS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('nortis_arquivos', 'nortis_arquivos', true, 52428800, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de RLS para o bucket nortis_arquivos
-- Leitura pública (todos podem ler e baixar os PDFs)
CREATE POLICY "Leitura Pública de PDFs NORTIS"
ON storage.objects FOR SELECT
USING (bucket_id = 'nortis_arquivos');

-- Inserção por usuários autenticados (tenant ou auth.role() = 'authenticated')
CREATE POLICY "Upload de PDFs NORTIS"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'nortis_arquivos'
    AND auth.role() = 'authenticated'
);

-- Atualização e exclusão pelos criadores (ou admin, mas aqui simplificamos)
CREATE POLICY "Alteração de PDFs NORTIS"
ON storage.objects FOR UPDATE
USING (bucket_id = 'nortis_arquivos' AND auth.role() = 'authenticated');

CREATE POLICY "Exclusão de PDFs NORTIS"
ON storage.objects FOR DELETE
USING (bucket_id = 'nortis_arquivos' AND auth.role() = 'authenticated');
