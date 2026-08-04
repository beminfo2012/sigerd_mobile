-- =====================================================================
-- SCRIPT DE CARGA DE DADOS OFICIAIS (SEED) — PLACON 2026
-- Santa Maria de Jetibá (SMJ) - SIGERD
-- Cole e execute no Editor SQL do Supabase
-- =====================================================================

DO $$
DECLARE
    v_tenant_id UUID := '00000000-0000-0000-0000-000000000001';
    
    -- UUIDs estáticos para integridade referencial dos 17 órgãos
    id_compdec        UUID := 'a0000000-0000-0000-0000-000000000001';
    id_secobr         UUID := 'a0000000-0000-0000-0000-000000000002';
    id_saude          UUID := 'a0000000-0000-0000-0000-000000000003';
    id_setdas         UUID := 'a0000000-0000-0000-0000-000000000004';
    id_educacao       UUID := 'a0000000-0000-0000-0000-000000000005';
    id_securb         UUID := 'a0000000-0000-0000-0000-000000000006';
    id_secint         UUID := 'a0000000-0000-0000-0000-000000000007';
    id_seagro         UUID := 'a0000000-0000-0000-0000-000000000008';
    id_semam          UUID := 'a0000000-0000-0000-0000-000000000009';
    id_fazenda        UUID := 'a0000000-0000-0000-0000-000000000010';
    id_comunicacao    UUID := 'a0000000-0000-0000-0000-000000000011';
    id_gcm            UUID := 'a0000000-0000-0000-0000-000000000012';
    id_bombeiros      UUID := 'a0000000-0000-0000-0000-000000000013';
    id_scbv           UUID := 'a0000000-0000-0000-0000-000000000014';
    id_pm             UUID := 'a0000000-0000-0000-0000-000000000015';
    id_remer          UUID := 'a0000000-0000-0000-0000-000000000016';
    id_defesa_animal  UUID := 'a0000000-0000-0000-0000-000000000017';
BEGIN

    -- 1. Limpeza de dados antigos do PLACON no tenant
    DELETE FROM placon_atribuicoes WHERE tenant_id = v_tenant_id;
    DELETE FROM placon_contatos WHERE tenant_id = v_tenant_id;
    DELETE FROM placon_assinaturas WHERE tenant_id = v_tenant_id;
    DELETE FROM placon_recursos WHERE tenant_id = v_tenant_id;
    DELETE FROM placon_versoes WHERE tenant_id = v_tenant_id;
    DELETE FROM placon_orgaos WHERE tenant_id = v_tenant_id;

    -- 2. Inserção dos 17 Órgãos e Secretarias no placon_orgaos
    INSERT INTO placon_orgaos (id, tenant_id, nome_curto, nome_completo, cor_hex, icone, descricao, ordem, ativo) VALUES
    (id_compdec, v_tenant_id, 'COMPDEC', 'Coordenadoria Municipal de Proteção e Defesa Civil', '#b91c1c', 'ShieldAlert', 'Responsável pela coordenação geral das atividades e articulação do sistema municipal de Proteção e Defesa Civil.', 1, true),
    (id_secobr, v_tenant_id, 'SECOBR', 'Secretaria de Obras e Infraestrutura', '#1e40af', 'Wrench', 'Responsável por manter esquema de plantão 24 horas durante o período de anormalidade e obras de engenharia.', 2, true),
    (id_saude, v_tenant_id, 'Saúde', 'Secretaria Municipal de Saúde', '#0f766e', 'HeartPulse', 'Responsável pela assistência pré-hospitalar, ações de saúde pública nos abrigos e prontidão do Pronto Atendimento.', 3, true),
    (id_setdas, v_tenant_id, 'Assistência Social', 'Secretaria de Trabalho, Desenvolvimento e Ação Social', '#7c3aed', 'Users', 'Triagem socioeconômica, cadastramento das famílias afetadas e gerência dos abrigos temporários.', 4, true),
    (id_educacao, v_tenant_id, 'Educação', 'Secretaria Municipal de Educação', '#b45309', 'School', 'Disponibilização de estruturas escolares para abrigos emergenciais e coordenação da merenda.', 5, true),
    (id_securb, v_tenant_id, 'SECURB', 'Secretaria Municipal de Serviços Urbanos', '#0e7490', 'Truck', 'Gerenciamento e execução da limpeza urbana, remoção de entulhos e limpeza de canais fluviais.', 6, true),
    (id_secint, v_tenant_id, 'Interior', 'Secretaria de Interior', '#4d7c0f', 'MapPin', 'Manutenção da trafegabilidade das estradas rurais para trânsito e socorro na zona rural.', 7, true),
    (id_seagro, v_tenant_id, 'Agropecuária', 'Secretaria de Agropecuária', '#a16207', 'Sprout', 'Acompanhamento do setor agrícola e avaliação de perdas na produção rural.', 8, true),
    (id_semam, v_tenant_id, 'Meio Ambiente', 'Secretaria de Meio Ambiente', '#15803d', 'Leaf', 'Vistoria e prevenção de danos ambientais, contaminações e preservação dos recursos naturais.', 9, true),
    (id_fazenda, v_tenant_id, 'Fazenda', 'Secretaria de Fazenda', '#6b21a8', 'DollarSign', 'Suporte financeiro e orçamentário emergencial, aquisições rápidas e alimentação das equipes.', 10, true),
    (id_comunicacao, v_tenant_id, 'Comunicação', 'Gerência de Comunicação e Jornalismo', '#1d4ed8', 'Radio', 'Divulgação oficial de boletins e orientações públicas orientadas pela COMPDEC.', 11, true),
    (id_gcm, v_tenant_id, 'Guarda Civil', 'Guarda Civil Municipal', '#374151', 'Siren', 'Patrulhamento ostensivo, monitoramento de áreas de risco, isolamento e ordem pública.', 12, true),
    (id_bombeiros, v_tenant_id, 'Bombeiros', 'Corpo de Bombeiros Militar do ES (6º BBM)', '#dc2626', 'Flame', 'Operações de busca, salvamento, resgate especializado e combate a acidentes em massa.', 13, true),
    (id_scbv, v_tenant_id, 'SCBV-SMJ', 'Sociedade Civil de Bombeiros Voluntários', '#b45309', 'Flame', 'Atuação em resgates, corte de árvores em risco e suporte às ações operacionais da COMPDEC.', 14, true),
    (id_pm, v_tenant_id, 'Polícia Militar', 'Polícia Militar (8ª Cia Independente)', '#1e3a8a', 'Shield', 'Policiamento ostensivo, segurança nos abrigos e proteção do patrimônio público e privado.', 15, true),
    (id_remer, v_tenant_id, 'REMER', 'Rede Municipal de Emergência de Radioamadores', '#854d0e', 'RadioTower', 'Rede complementar de rádio telecomunicação durante quedas de sistemas convencionais.', 16, true),
    (id_defesa_animal, v_tenant_id, 'Defesa Animal', 'Defesa Civil Animal', '#0f766e', 'PawPrint', 'Resgate, acolhimento e atendimento veterinário de animais domésticos e silvestres em risco.', 17, true);

    -- 3. Inserção de Contatos e Assinaturas Oficiais (placon_contatos e placon_assinaturas)
    -- COMPDEC
    INSERT INTO placon_contatos (tenant_id, orgao_id, nome, cargo, telefone, email, is_responsavel_principal) VALUES
    (v_tenant_id, id_compdec, 'Bruno Augusto Vieira Pagel', 'Coordenador Municipal de Proteção e Defesa Civil', '(27) 3263-4350 R. 1138', 'defesacivil@pmsmj.es.gov.br', true);
    INSERT INTO placon_assinaturas (tenant_id, orgao_id, nome, cargo, telefone, email, identificacao_assinatura_edocs, ordem) VALUES
    (v_tenant_id, id_compdec, 'Bruno Augusto Vieira Pagel', 'Coordenador Municipal de Proteção e Defesa Civil', '(27) 3263-4350 R. 1138', 'defesacivil@pmsmj.es.gov.br', 'EDOCS-2026-COMPDEC-01', 1);

    -- SECOBR
    INSERT INTO placon_contatos (tenant_id, orgao_id, nome, cargo, telefone, email, is_responsavel_principal) VALUES
    (v_tenant_id, id_secobr, 'Bruno Augusto Vieira Pagel', 'Secretário de Obras e Infraestrutura', '(27) 3263-4350 R. 1029', 'obras@pmsmj.es.gov.br', true);
    INSERT INTO placon_assinaturas (tenant_id, orgao_id, nome, cargo, telefone, email, identificacao_assinatura_edocs, ordem) VALUES
    (v_tenant_id, id_secobr, 'Bruno Augusto Vieira Pagel', 'Secretário de Obras e Infraestrutura', '(27) 3263-4350 R. 1029', 'obras@pmsmj.es.gov.br', 'EDOCS-2026-SECOBR-01', 1);

    -- SAÚDE
    INSERT INTO placon_contatos (tenant_id, orgao_id, nome, cargo, telefone, email, is_responsavel_principal) VALUES
    (v_tenant_id, id_saude, 'Carlos Alberto Jarske', 'Secretário de Saúde', '(27) 3263-4350 R. 1033', 'saude@pmsmj.es.gov.br', true);
    INSERT INTO placon_assinaturas (tenant_id, orgao_id, nome, cargo, telefone, email, identificacao_assinatura_edocs, ordem) VALUES
    (v_tenant_id, id_saude, 'Carlos Alberto Jarske', 'Secretário de Saúde', '(27) 3263-4350 R. 1033', 'saude@pmsmj.es.gov.br', 'EDOCS-2026-SAUDE-01', 1);

    -- SETDAS
    INSERT INTO placon_contatos (tenant_id, orgao_id, nome, cargo, telefone, email, is_responsavel_principal) VALUES
    (v_tenant_id, id_setdas, 'Sarianna Gava Woelffel Pienegonda', 'Secretária de Ação Social', '(27) 3263-4350 R. 1057', 'acaosocial@pmsmj.es.gov.br', true);
    INSERT INTO placon_assinaturas (tenant_id, orgao_id, nome, cargo, telefone, email, identificacao_assinatura_edocs, ordem) VALUES
    (v_tenant_id, id_setdas, 'Sarianna Gava Woelffel Pienegonda', 'Secretária de Ação Social', '(27) 3263-4350 R. 1057', 'acaosocial@pmsmj.es.gov.br', 'EDOCS-2026-SETDAS-01', 1);

    -- EDUCAÇÃO
    INSERT INTO placon_contatos (tenant_id, orgao_id, nome, cargo, telefone, email, is_responsavel_principal) VALUES
    (v_tenant_id, id_educacao, 'Marcileide Stuhr', 'Secretária de Educação', '(27) 3263-4350 R. 1079', 'educacao@pmsmj.es.gov.br', true);
    INSERT INTO placon_assinaturas (tenant_id, orgao_id, nome, cargo, telefone, email, identificacao_assinatura_edocs, ordem) VALUES
    (v_tenant_id, id_educacao, 'Marcileide Stuhr', 'Secretária de Educação', '(27) 3263-4350 R. 1079', 'educacao@pmsmj.es.gov.br', 'EDOCS-2026-SEDU-01', 1);

    -- SECURB
    INSERT INTO placon_contatos (tenant_id, orgao_id, nome, cargo, telefone, email, is_responsavel_principal) VALUES
    (v_tenant_id, id_securb, 'Alessandro Oliveira de Souza', 'Secretário de Serviços Urbanos', '(27) 3263-4350 R. 1049', 'servicosurbanos@pmsmj.es.gov.br', true);
    INSERT INTO placon_assinaturas (tenant_id, orgao_id, nome, cargo, telefone, email, identificacao_assinatura_edocs, ordem) VALUES
    (v_tenant_id, id_securb, 'Alessandro Oliveira de Souza', 'Secretário de Serviços Urbanos', '(27) 3263-4350 R. 1049', 'servicosurbanos@pmsmj.es.gov.br', 'EDOCS-2026-SECURB-01', 1);

    -- INTERIOR
    INSERT INTO placon_contatos (tenant_id, orgao_id, nome, cargo, telefone, email, is_responsavel_principal) VALUES
    (v_tenant_id, id_secint, 'Adriano Haese', 'Secretário de Interior', '(27) 3263-4350 R. 1085', 'interior@pmsmj.es.gov.br', true);
    INSERT INTO placon_assinaturas (tenant_id, orgao_id, nome, cargo, telefone, email, identificacao_assinatura_edocs, ordem) VALUES
    (v_tenant_id, id_secint, 'Adriano Haese', 'Secretário de Interior', '(27) 3263-4350 R. 1085', 'interior@pmsmj.es.gov.br', 'EDOCS-2026-SECINT-01', 1);

    -- SEAGRO
    INSERT INTO placon_contatos (tenant_id, orgao_id, nome, cargo, telefone, email, is_responsavel_principal) VALUES
    (v_tenant_id, id_seagro, 'Vanderlei Marquez', 'Secretário de Agropecuária', '(27) 3263-4350 R. 1017', 'agropecuaria@pmsmj.es.gov.br', true);
    INSERT INTO placon_assinaturas (tenant_id, orgao_id, nome, cargo, telefone, email, identificacao_assinatura_edocs, ordem) VALUES
    (v_tenant_id, id_seagro, 'Vanderlei Marquez', 'Secretário de Agropecuária', '(27) 3263-4350 R. 1017', 'agropecuaria@pmsmj.es.gov.br', 'EDOCS-2026-SEAGRO-01', 1);

    -- SEMAM
    INSERT INTO placon_contatos (tenant_id, orgao_id, nome, cargo, telefone, email, is_responsavel_principal) VALUES
    (v_tenant_id, id_semam, 'Leonardo Novelli Faian', 'Subsecretário de Meio Ambiente', '(27) 3263-4350 R. 1025', 'meioambiente@pmsmj.es.gov.br', true);
    INSERT INTO placon_assinaturas (tenant_id, orgao_id, nome, cargo, telefone, email, identificacao_assinatura_edocs, ordem) VALUES
    (v_tenant_id, id_semam, 'Leonardo Novelli Faian', 'Subsecretário de Meio Ambiente', '(27) 3263-4350 R. 1025', 'meioambiente@pmsmj.es.gov.br', 'EDOCS-2026-SEMAM-01', 1);

    -- FAZENDA
    INSERT INTO placon_contatos (tenant_id, orgao_id, nome, cargo, telefone, email, is_responsavel_principal) VALUES
    (v_tenant_id, id_fazenda, 'Valdecir Jacob', 'Secretário de Fazenda', '(27) 3263-4350 R. 1015', 'financas@pmsmj.es.gov.br', true);
    INSERT INTO placon_assinaturas (tenant_id, orgao_id, nome, cargo, telefone, email, identificacao_assinatura_edocs, ordem) VALUES
    (v_tenant_id, id_fazenda, 'Valdecir Jacob', 'Secretário de Fazenda', '(27) 3263-4350 R. 1015', 'financas@pmsmj.es.gov.br', 'EDOCS-2026-FAZENDA-01', 1);

    -- COMUNICAÇÃO
    INSERT INTO placon_contatos (tenant_id, orgao_id, nome, cargo, telefone, email, is_responsavel_principal) VALUES
    (v_tenant_id, id_comunicacao, 'Nicolas Vargas Teixeira', 'Gerente de Comunicação', '(27) 3263-4350 R. 1004', 'gabinete@pmsmj.es.gov.br', true);
    INSERT INTO placon_assinaturas (tenant_id, orgao_id, nome, cargo, telefone, email, identificacao_assinatura_edocs, ordem) VALUES
    (v_tenant_id, id_comunicacao, 'Nicolas Vargas Teixeira', 'Gerente de Comunicação', '(27) 3263-4350 R. 1004', 'gabinete@pmsmj.es.gov.br', 'EDOCS-2026-SECOM-01', 1);

    -- GCM
    INSERT INTO placon_contatos (tenant_id, orgao_id, nome, cargo, telefone, email, is_responsavel_principal) VALUES
    (v_tenant_id, id_gcm, 'Central de Operações GCM', 'Plantão 24h', '(27) 3263-4350', 'gcm@pmsmj.es.gov.br', true);
    INSERT INTO placon_assinaturas (tenant_id, orgao_id, nome, cargo, telefone, email, identificacao_assinatura_edocs, ordem) VALUES
    (v_tenant_id, id_gcm, 'Central de Operações GCM', 'Plantão 24h', '(27) 3263-4350', 'gcm@pmsmj.es.gov.br', 'EDOCS-2026-GCM-01', 1);

    -- BOMBEIROS MILITARES
    INSERT INTO placon_contatos (tenant_id, orgao_id, nome, cargo, telefone, email, is_responsavel_principal) VALUES
    (v_tenant_id, id_bombeiros, 'Fábio Silva Ferreira', 'Comandante (1ª Cia 6º BBM)', '(27) 3194-3768', '1cia.6bbm@bombeiros.es.gov.br', true);
    INSERT INTO placon_assinaturas (tenant_id, orgao_id, nome, cargo, telefone, email, identificacao_assinatura_edocs, ordem) VALUES
    (v_tenant_id, id_bombeiros, 'Fábio Silva Ferreira', 'Comandante (1ª Cia 6º BBM)', '(27) 3194-3768', '1cia.6bbm@bombeiros.es.gov.br', 'EDOCS-2026-CBMES-01', 1);

    -- BOMBEIROS VOLUNTÁRIOS SCBV
    INSERT INTO placon_contatos (tenant_id, orgao_id, nome, cargo, telefone, email, is_responsavel_principal) VALUES
    (v_tenant_id, id_scbv, 'Alexandre Fortunato Ribeiro', 'Presidente SCBV-SMJ', '(27) 99916-2725', 'scbvsmj@gmail.com', true);
    INSERT INTO placon_assinaturas (tenant_id, orgao_id, nome, cargo, telefone, email, identificacao_assinatura_edocs, ordem) VALUES
    (v_tenant_id, id_scbv, 'Alexandre Fortunato Ribeiro', 'Presidente SCBV-SMJ', '(27) 99916-2725', 'scbvsmj@gmail.com', 'EDOCS-2026-SCBV-01', 1);

    -- POLÍCIA MILITAR
    INSERT INTO placon_contatos (tenant_id, orgao_id, nome, cargo, telefone, email, is_responsavel_principal) VALUES
    (v_tenant_id, id_pm, 'Thales Gustavo Pereira Matias Vaz', 'Comandante (8ª Cia Independente)', '(27) 3259-9000', 'chefep3.8ciaind@pm.es.gov.br', true);
    INSERT INTO placon_assinaturas (tenant_id, orgao_id, nome, cargo, telefone, email, identificacao_assinatura_edocs, ordem) VALUES
    (v_tenant_id, id_pm, 'Thales Gustavo Pereira Matias Vaz', 'Comandante (8ª Cia Independente)', '(27) 3259-9000', 'chefep3.8ciaind@pm.es.gov.br', 'EDOCS-2026-PMES-01', 1);

    -- REMER
    INSERT INTO placon_contatos (tenant_id, orgao_id, nome, cargo, telefone, email, is_responsavel_principal) VALUES
    (v_tenant_id, id_remer, 'Cleverson Altierry Callott', 'Representante da REMER', '(27) 99838-8889', 'cleversonaltierry@hotmail.com', true);
    INSERT INTO placon_assinaturas (tenant_id, orgao_id, nome, cargo, telefone, email, identificacao_assinatura_edocs, ordem) VALUES
    (v_tenant_id, id_remer, 'Cleverson Altierry Callott', 'Representante da REMER', '(27) 99838-8889', 'cleversonaltierry@hotmail.com', 'EDOCS-2026-REMER-01', 1);

    -- 4. Inserção de Atribuições Operacionais do PLACON nas 3 Fases (placon_atribuicoes)
    -- COMPDEC
    INSERT INTO placon_atribuicoes (tenant_id, orgao_id, fase, texto, ordem) VALUES
    (v_tenant_id, id_compdec, 'prevencao', 'Ampliar e aperfeiçoar o sistema de monitoramento, alerta e alarme', 1),
    (v_tenant_id, id_compdec, 'prevencao', 'Fomentar o mapeamento de áreas de risco de desastres', 2),
    (v_tenant_id, id_compdec, 'prevencao', 'Coordenar as ações desempenhadas pelos setores envolvidos no plano, em conjunto com o Gabinete do Prefeito', 3),
    (v_tenant_id, id_compdec, 'preparacao', 'Manter os representantes deste plano informados quanto à possibilidade de desastres no município', 1),
    (v_tenant_id, id_compdec, 'preparacao', 'Manter atualizado o Plano de Contingência e os contatos dos Pontos Focais', 2),
    (v_tenant_id, id_compdec, 'resposta', 'Deslocar-se ao local sinistrado para apoiar e coordenar o incidente, montando o Gabinete de Gestão de Crise junto ao Prefeito', 1),
    (v_tenant_id, id_compdec, 'resposta', 'Manter o levantamento da população desabrigada, danos materiais e prejuízos socioeconômicos', 2),
    (v_tenant_id, id_compdec, 'resposta', 'Implementar o Comando Unificado na resposta a situações críticas', 3);

    -- SECOBR
    INSERT INTO placon_atribuicoes (tenant_id, orgao_id, fase, texto, ordem) VALUES
    (v_tenant_id, id_secobr, 'prevencao', 'Elaborar plano de ação para emprego de recursos humanos e logísticos em situação de emergência', 1),
    (v_tenant_id, id_secobr, 'prevencao', 'Fiscalizar ocupação irregular de encostas, morros e margens de curso hídrico', 2),
    (v_tenant_id, id_secobr, 'preparacao', 'Acionar a equipe para sobreaviso em caso de intervenção imediata, vistoriando acessos prioritários', 1),
    (v_tenant_id, id_secobr, 'resposta', 'Encaminhar grupo de especialistas ao local atingido para reparar ou atenuar os danos', 1),
    (v_tenant_id, id_secobr, 'resposta', 'Disponibilizar recursos para execução de obras emergenciais identificadas pela Defesa Civil', 2);

    -- SAÚDE
    INSERT INTO placon_atribuicoes (tenant_id, orgao_id, fase, texto, ordem) VALUES
    (v_tenant_id, id_saude, 'prevencao', 'Orientar as Unidades de Saúde a usarem os mapas de risco de deslizamento e inundação da COMPDEC', 1),
    (v_tenant_id, id_saude, 'preparacao', 'Identificar e cadastrar grupos vulneráveis residentes em área de risco, com atenção a doenças crônicas', 1),
    (v_tenant_id, id_saude, 'resposta', 'Gerenciar, com outros setores, as ações de prevenção e promoção da saúde nos abrigos', 1),
    (v_tenant_id, id_saude, 'resposta', 'Colocar em estado de prontidão o Pronto Atendimento Municipal, com leitos para emergências e equipe mínima disponível', 2);

    -- SETDAS
    INSERT INTO placon_atribuicoes (tenant_id, orgao_id, fase, texto, ordem) VALUES
    (v_tenant_id, id_setdas, 'prevencao', 'Articular, em parceria com a Defesa Civil, oficinas e seminários com temas preventivos para chuva e estiagem', 1),
    (v_tenant_id, id_setdas, 'preparacao', 'Orientar a estruturação de Abrigos Temporários (ambiente físico, recursos materiais e trabalho social)', 1),
    (v_tenant_id, id_setdas, 'resposta', 'Realizar a triagem socioeconômica e o cadastramento das famílias afetadas pelo desastre', 1),
    (v_tenant_id, id_setdas, 'resposta', 'Viabilizar e executar doações humanitárias de itens em estoque próprio ou de doações', 2),
    (v_tenant_id, id_setdas, 'resposta', 'Gerenciar Abrigos Temporários, assegurando recursos materiais, humanos e trabalho social', 3);

    -- 5. Inserção de Versão Inicial Registrada do Plano (placon_versoes)
    INSERT INTO placon_versoes (tenant_id, numero_versao, data_alteracao, descricao) VALUES
    (v_tenant_id, '2026.1', '2026-01-01', 'Versão oficial digitalizada no SIGERD a partir do Plano Municipal de Contingência 2026 de Santa Maria de Jetibá/ES.');

END $$;
