-- ============================================================
-- COLE ISSO DIRETAMENTE NO SQL EDITOR DO SUPABASE E CLIQUE EM RUN
-- ============================================================

-- Remove TODAS as policies das tabelas MCI de uma vez
DROP POLICY IF EXISTS "Permitir leitura geral de recursos" ON mci_recursos;
DROP POLICY IF EXISTS "Permitir inserção de recursos pela própria secretaria ou COMPDEC" ON mci_recursos;
DROP POLICY IF EXISTS "Permitir atualização de recursos pela própria secretaria ou COMPDEC" ON mci_recursos;
DROP POLICY IF EXISTS "Permitir exclusão de recursos pela própria secretaria ou COMPDEC" ON mci_recursos;
DROP POLICY IF EXISTS "Permitir leitura geral de requisicoes" ON mci_requisicoes;
DROP POLICY IF EXISTS "Permitir que apenas a COMPDEC crie requisições" ON mci_requisicoes;
DROP POLICY IF EXISTS "Permitir atualização de requisição pelos envolvidos" ON mci_requisicoes;
DROP POLICY IF EXISTS "Permitir leitura de logs de auditoria pela COMPDEC" ON mci_log_auditoria;
DROP POLICY IF EXISTS "mci_recursos_select" ON mci_recursos;
DROP POLICY IF EXISTS "mci_recursos_insert" ON mci_recursos;
DROP POLICY IF EXISTS "mci_recursos_update" ON mci_recursos;
DROP POLICY IF EXISTS "mci_recursos_delete" ON mci_recursos;
DROP POLICY IF EXISTS "mci_requisicoes_select" ON mci_requisicoes;
DROP POLICY IF EXISTS "mci_requisicoes_insert" ON mci_requisicoes;
DROP POLICY IF EXISTS "mci_requisicoes_update" ON mci_requisicoes;
DROP POLICY IF EXISTS "mci_log_auditoria_select" ON mci_log_auditoria;
DROP POLICY IF EXISTS "mci_log_auditoria_insert" ON mci_log_auditoria;
DROP POLICY IF EXISTS "mci_select_all" ON mci_recursos;
DROP POLICY IF EXISTS "mci_insert_authenticated" ON mci_recursos;
DROP POLICY IF EXISTS "mci_update_authenticated" ON mci_recursos;
DROP POLICY IF EXISTS "mci_delete_authenticated" ON mci_recursos;
DROP POLICY IF EXISTS "mci_req_select_all" ON mci_requisicoes;
DROP POLICY IF EXISTS "mci_req_insert_authenticated" ON mci_requisicoes;
DROP POLICY IF EXISTS "mci_req_update_authenticated" ON mci_requisicoes;
DROP POLICY IF EXISTS "mci_log_select_authenticated" ON mci_log_auditoria;
DROP POLICY IF EXISTS "mci_log_insert_authenticated" ON mci_log_auditoria;

-- Cria policies simples: qualquer usuário logado pode fazer tudo
CREATE POLICY "mci_full_access" ON mci_recursos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "mci_req_full_access" ON mci_requisicoes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "mci_log_full_access" ON mci_log_auditoria FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Verifica se funcionou:
SELECT tablename, policyname FROM pg_policies WHERE tablename IN ('mci_recursos','mci_requisicoes','mci_log_auditoria');
