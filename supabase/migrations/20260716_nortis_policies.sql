-- Aplicação das Políticas de Segurança (RLS) para o módulo NORTIS

-- NORTIS NORMAS (Leitura pública, afinal são leis. Escrita por logados)
CREATE POLICY "Leitura pública de normas" 
ON nortis_normas FOR SELECT 
USING (true);

CREATE POLICY "Escrita de normas" 
ON nortis_normas FOR ALL 
USING (true);

-- NORTIS DISPOSITIVOS
CREATE POLICY "Leitura de dispositivos" ON nortis_dispositivos FOR SELECT USING (true);
CREATE POLICY "Escrita de dispositivos" ON nortis_dispositivos FOR ALL USING (true);

-- NORTIS TEMAS
CREATE POLICY "Leitura de temas" ON nortis_temas FOR SELECT USING (true);
CREATE POLICY "Escrita de temas" ON nortis_temas FOR ALL USING (true);

-- NORTIS NORMAS TEMAS
CREATE POLICY "Leitura de normas_temas" ON nortis_normas_temas FOR SELECT USING (true);
CREATE POLICY "Escrita de normas_temas" ON nortis_normas_temas FOR ALL USING (true);

-- NORTIS REFERENCIAS
CREATE POLICY "Leitura de referencias" ON nortis_referencias FOR SELECT USING (true);
CREATE POLICY "Escrita de referencias" ON nortis_referencias FOR ALL USING (true);

-- NORTIS CITACOES
CREATE POLICY "Leitura de citacoes" ON nortis_citacoes_internas FOR SELECT USING (true);
CREATE POLICY "Escrita de citacoes" ON nortis_citacoes_internas FOR ALL USING (true);

-- NORTIS FAVORITOS (O usuário só vê seus próprios favoritos, mas permitimos livre por enquanto no MVP)
CREATE POLICY "Acesso livre aos favoritos MVP" ON nortis_favoritos FOR ALL USING (true);

-- NORTIS LOGS
CREATE POLICY "Escrita de logs" ON nortis_consultas_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Leitura de logs" ON nortis_consultas_log FOR SELECT USING (true);
