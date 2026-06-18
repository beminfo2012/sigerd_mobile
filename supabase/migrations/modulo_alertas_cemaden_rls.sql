-- ============================================================
-- MIGRAÇÃO: Políticas de Segurança (RLS) para Alertas CEMADEN
-- ============================================================

-- Habilitar RLS nas tabelas
ALTER TABLE alertas_cemaden ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas_cemaden_versoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas_cemaden_precipitacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas_cemaden_log ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir leitura pública de alertas" ON alertas_cemaden;
DROP POLICY IF EXISTS "Permitir escrita de alertas" ON alertas_cemaden;

DROP POLICY IF EXISTS "Permitir leitura pública de versoes" ON alertas_cemaden_versoes;
DROP POLICY IF EXISTS "Permitir escrita de versoes" ON alertas_cemaden_versoes;

DROP POLICY IF EXISTS "Permitir leitura pública de precipitacao" ON alertas_cemaden_precipitacao;
DROP POLICY IF EXISTS "Permitir escrita de precipitacao" ON alertas_cemaden_precipitacao;

DROP POLICY IF EXISTS "Permitir leitura pública de log" ON alertas_cemaden_log;
DROP POLICY IF EXISTS "Permitir escrita de log" ON alertas_cemaden_log;

-- Políticas para alertas_cemaden
CREATE POLICY "Permitir leitura pública de alertas" ON alertas_cemaden FOR SELECT USING (true);
CREATE POLICY "Permitir escrita de alertas" ON alertas_cemaden FOR ALL USING (true) WITH CHECK (true);

-- Políticas para alertas_cemaden_versoes
CREATE POLICY "Permitir leitura pública de versoes" ON alertas_cemaden_versoes FOR SELECT USING (true);
CREATE POLICY "Permitir escrita de versoes" ON alertas_cemaden_versoes FOR ALL USING (true) WITH CHECK (true);

-- Políticas para alertas_cemaden_precipitacao
CREATE POLICY "Permitir leitura pública de precipitacao" ON alertas_cemaden_precipitacao FOR SELECT USING (true);
CREATE POLICY "Permitir escrita de precipitacao" ON alertas_cemaden_precipitacao FOR ALL USING (true) WITH CHECK (true);

-- Políticas para alertas_cemaden_log
CREATE POLICY "Permitir leitura pública de log" ON alertas_cemaden_log FOR SELECT USING (true);
CREATE POLICY "Permitir escrita de log" ON alertas_cemaden_log FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- STORAGE BUCKET: alertas_cemaden
-- ============================================================

-- 1. Cria o bucket se ele não existir e define como público
INSERT INTO storage.buckets (id, name, public) 
VALUES ('alertas_cemaden', 'alertas_cemaden', true) 
ON CONFLICT (id) DO NOTHING;

-- 2. Permite que qualquer pessoa acesse e faça upload (ajuste conforme segurança desejada no futuro)
CREATE POLICY "Permitir acesso publico bucket alertas_cemaden" 
ON storage.objects FOR ALL 
USING (bucket_id = 'alertas_cemaden') 
WITH CHECK (bucket_id = 'alertas_cemaden');
