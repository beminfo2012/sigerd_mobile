-- ============================================================
-- MIGRAÇÃO: Políticas de Segurança (RLS) para Voluntários
-- Data: 2026-06-17
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE areas_atuacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE voluntarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE voluntario_area ENABLE ROW LEVEL SECURITY;
ALTER TABLE disponibilidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE termos_adesao ENABLE ROW LEVEL SECURITY;
ALTER TABLE acionamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE acionamento_resposta ENABLE ROW LEVEL SECURITY;
ALTER TABLE missoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificacoes ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem para evitar duplicidade
DROP POLICY IF EXISTS "Permitir leitura pública de áreas" ON areas_atuacao;
DROP POLICY IF EXISTS "Permitir inserção e atualização de áreas" ON areas_atuacao;
DROP POLICY IF EXISTS "Permitir deletar áreas" ON areas_atuacao;

-- Políticas para areas_atuacao
CREATE POLICY "Permitir leitura pública de áreas" ON areas_atuacao FOR SELECT USING (true);
CREATE POLICY "Permitir inserção e atualização de áreas" ON areas_atuacao FOR ALL USING (true);

-- Políticas para voluntarios
CREATE POLICY "Permitir leitura pública de voluntarios" ON voluntarios FOR SELECT USING (true);
CREATE POLICY "Permitir escrita de voluntarios" ON voluntarios FOR ALL USING (true);

-- Políticas para voluntario_area
CREATE POLICY "Permitir leitura pública de voluntario_area" ON voluntario_area FOR SELECT USING (true);
CREATE POLICY "Permitir escrita de voluntario_area" ON voluntario_area FOR ALL USING (true);

-- Políticas para disponibilidade
CREATE POLICY "Permitir leitura pública de disponibilidade" ON disponibilidade FOR SELECT USING (true);
CREATE POLICY "Permitir escrita de disponibilidade" ON disponibilidade FOR ALL USING (true);

-- Políticas para termos_adesao
CREATE POLICY "Permitir leitura pública de termos_adesao" ON termos_adesao FOR SELECT USING (true);
CREATE POLICY "Permitir escrita de termos_adesao" ON termos_adesao FOR ALL USING (true);

-- Políticas para acionamentos
CREATE POLICY "Permitir leitura pública de acionamentos" ON acionamentos FOR SELECT USING (true);
CREATE POLICY "Permitir escrita de acionamentos" ON acionamentos FOR ALL USING (true);

-- Políticas para acionamento_resposta
CREATE POLICY "Permitir leitura pública de acionamento_resposta" ON acionamento_resposta FOR SELECT USING (true);
CREATE POLICY "Permitir escrita de acionamento_resposta" ON acionamento_resposta FOR ALL USING (true);

-- Políticas para missoes
CREATE POLICY "Permitir leitura pública de missoes" ON missoes FOR SELECT USING (true);
CREATE POLICY "Permitir escrita de missoes" ON missoes FOR ALL USING (true);

-- Políticas para certificacoes
CREATE POLICY "Permitir leitura pública de certificacoes" ON certificacoes FOR SELECT USING (true);
CREATE POLICY "Permitir escrita de certificacoes" ON certificacoes FOR ALL USING (true);
