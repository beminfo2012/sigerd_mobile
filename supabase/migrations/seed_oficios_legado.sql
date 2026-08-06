INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2014, 1, '001/2014', 'OF/PMSMJ/COMPDEC/N° 001/2014',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2014-01-15', 'Ministério Público Estadual',
            'Ministério Público Estadual', 'Acervo histórico COMPDEC (2014): Ministério Público Estadual',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_001_2014.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_001_2014.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2014, 2, '002/2014', 'OF/PMSMJ/COMPDEC/N° 002/2014',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2014-01-15', 'Evandro Sperandio',
            'Evandro Sperandio', 'Acervo histórico COMPDEC (2014): Evandro Sperandio',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_002_2014.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_002_2014.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2014, 3, '003/2014', 'OF/PMSMJ/COMPDEC/N° 003/2014',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2014-01-15', 'Arno Holz',
            'Arno Holz', 'Acervo histórico COMPDEC (2014): Arno Holz',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_003_2014.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_003_2014.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2014, 4, '004/2014', 'OF/PMSMJ/COMPDEC/N° 004/2014',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2014-01-15', 'ACE',
            'ACE', 'Acervo histórico COMPDEC (2014): ACE',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_004_2014.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_004_2014.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2014, 5, '005/2014', 'OF/PMSMJ/COMPDEC/N° 005/2014',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2014-01-15', 'Valmir Jacob',
            'Valmir Jacob', 'Acervo histórico COMPDEC (2014): Valmir Jacob',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_005_2014.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_005_2014.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2014, 6, '006/2014', 'OF/PMSMJ/COMPDEC/N° 006/2014',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2014-01-15', 'Alexsandra Ribeiro',
            'Alexsandra Ribeiro', 'Acervo histórico COMPDEC (2014): Alexsandra Ribeiro',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_006_2014.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_006_2014.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2014, 7, '007/2014', 'OF/PMSMJ/COMPDEC/N° 007/2014',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2014-01-15', 'Of. resposta Hudson Rogério Barcelos corte árvore setembro 2014',
            'Of. resposta Hudson Rogério Barcelos corte árvore setembro 2014', 'Acervo histórico COMPDEC (2014): Of. resposta Hudson Rogério Barcelos corte árvore setembro 2014',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_007_2014.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_007_2014.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2014, 8, '008/2014', 'OF/PMSMJ/COMPDEC/N° 008/2014',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2014-01-15', 'Of. resposta Lecindo Herzog corte árvore 02-10-2014',
            'Of. resposta Lecindo Herzog corte árvore 02-10-2014', 'Acervo histórico COMPDEC (2014): Of. resposta Lecindo Herzog corte árvore 02-10-2014',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_008_2014.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_008_2014.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2014, 9, '009/2014', 'OF/PMSMJ/COMPDEC/N° 009/2014',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2014-01-15', 'Of. resposta  Promotoria de  Justiça. 15-10-2014',
            'Of. resposta  Promotoria de  Justiça. 15-10-2014', 'Acervo histórico COMPDEC (2014): Of. resposta  Promotoria de  Justiça. 15-10-2014',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_009_2014.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_009_2014.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2014, 10, '010/2014', 'OF/PMSMJ/COMPDEC/N° 010/2014',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2014-01-15', 'Of. resposta Reinaldo Schwambach corte árvore 23-10-2014',
            'Of. resposta Reinaldo Schwambach corte árvore 23-10-2014', 'Acervo histórico COMPDEC (2014): Of. resposta Reinaldo Schwambach corte árvore 23-10-2014',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_010_2014.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_010_2014.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2014, 11, '011/2014', 'OF/PMSMJ/COMPDEC/N° 011/2014',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2014-01-15', 'Of. resposta corte de arvore Dagmar Algusto Hell 24-10-2014',
            'Of. resposta corte de arvore Dagmar Algusto Hell 24-10-2014', 'Acervo histórico COMPDEC (2014): Of. resposta corte de arvore Dagmar Algusto Hell 24-10-2014',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_011_2014.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_011_2014.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2014, 12, '012/2014', 'OF/PMSMJ/COMPDEC/N° 012/2014',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2014-01-15', 'Of. resposta corte de arvores Ervelisia Zaager 24-10-2014',
            'Of. resposta corte de arvores Ervelisia Zaager 24-10-2014', 'Acervo histórico COMPDEC (2014): Of. resposta corte de arvores Ervelisia Zaager 24-10-2014',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_012_2014.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_012_2014.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2014, 13, '013/2014', 'OF/PMSMJ/COMPDEC/N° 013/2014',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2014-01-15', 'Of. resposta Anonimo Corte de eucaliptos Espindulas 19-11-2014',
            'Of. resposta Anonimo Corte de eucaliptos Espindulas 19-11-2014', 'Acervo histórico COMPDEC (2014): Of. resposta Anonimo Corte de eucaliptos Espindulas 19-11-2014',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_013_2014.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_013_2014.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2014, 14, '014/2014', 'OF/PMSMJ/COMPDEC/N° 014/2014',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2014-01-15', 'Of. Resposta Daniel Dettmann Eucalipto 19-11-2014',
            'Of. Resposta Daniel Dettmann Eucalipto 19-11-2014', 'Acervo histórico COMPDEC (2014): Of. Resposta Daniel Dettmann Eucalipto 19-11-2014',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_014_2014.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_014_2014.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2014, 15, '015/2014', 'OF/PMSMJ/COMPDEC/N° 015/2014',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2014-01-15', 'Of. Retirada de arvore COMDEC São Luís 20-11-2014',
            'Of. Retirada de arvore COMDEC São Luís 20-11-2014', 'Acervo histórico COMPDEC (2014): Of. Retirada de arvore COMDEC São Luís 20-11-2014',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_015_2014.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_015_2014.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2014, 16, '016/2014', 'OF/PMSMJ/COMPDEC/N° 016/2014',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2014-01-15', 'Of. resposta  Corte de eucaliptos COOPEAVI 28-11-2014 - Cópia',
            'Of. resposta  Corte de eucaliptos COOPEAVI 28-11-2014 - Cópia', 'Acervo histórico COMPDEC (2014): Of. resposta  Corte de eucaliptos COOPEAVI 28-11-2014 - Cópia',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_016_2014.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_016_2014.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2014, 17, '017/2014', 'OF/PMSMJ/COMPDEC/N° 017/2014',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2014-01-15', 'Resposta processo n 11820',
            'Resposta processo n 11820', 'Acervo histórico COMPDEC (2014): Resposta processo n 11820',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_017_2014.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_017_2014.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2014, 18, '018/2014', 'OF/PMSMJ/COMPDEC/N° 018/2014',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2014-01-15', 'Sr. Arlindo Roepke- retirada de bambuzal Rio Possmozer 08-12-2014',
            'Sr. Arlindo Roepke- retirada de bambuzal Rio Possmozer 08-12-2014', 'Acervo histórico COMPDEC (2014): Sr. Arlindo Roepke- retirada de bambuzal Rio Possmozer 08-12-2014',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_018_2014.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_018_2014.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2014, 19, '019/2014', 'OF/PMSMJ/COMPDEC/N° 019/2014',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2014-01-15', 'Promotoria de Justiça Geral de Santa Maria de Jetibá-ES 11-12-2014',
            'Promotoria de Justiça Geral de Santa Maria de Jetibá-ES 11-12-2014', 'Acervo histórico COMPDEC (2014): Promotoria de Justiça Geral de Santa Maria de Jetibá-ES 11-12-2014',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_019_2014.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_019_2014.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2014, 20, '020/2014', 'OF/PMSMJ/COMPDEC/N° 020/2014',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2014-01-15', 'Autorização de corte de árvore',
            'Autorização de corte de árvore', 'Acervo histórico COMPDEC (2014): Autorização de corte de árvore',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_020_2014.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_020_2014.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2014, 21, '021/2014', 'OF/PMSMJ/COMPDEC/N° 021/2014',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2014-01-15', 'Conflito Eucalipto x Rede Elétrica',
            'Conflito Eucalipto x Rede Elétrica', 'Acervo histórico COMPDEC (2014): Conflito Eucalipto x Rede Elétrica',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_021_2014.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_021_2014.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2014, 22, '022/2014', 'OF/PMSMJ/COMPDEC/N° 022/2014',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2014-01-15', 'Resposta processo Nº 013700-2014 Sandra Puffal dos Reis Berger 23-12-2014',
            'Resposta processo Nº 013700-2014 Sandra Puffal dos Reis Berger 23-12-2014', 'Acervo histórico COMPDEC (2014): Resposta processo Nº 013700-2014 Sandra Puffal dos Reis Berger 23-12-2014',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_022_2014.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2014/OF_022_2014.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2015, 1, '001/2015', 'OF/PMSMJ/COMPDEC/N° 001/2015',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2015-01-15', 'Resposta ao processo 000408-15',
            'Resposta ao processo 000408-15', 'Acervo histórico COMPDEC (2015): Resposta ao processo 000408-15',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2015/OF_001_2015.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2015/OF_001_2015.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2015, 2, '002/2015', 'OF/PMSMJ/COMPDEC/N° 002/2015',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2015-01-15', 'Resposta ao processo 000206-15',
            'Resposta ao processo 000206-15', 'Acervo histórico COMPDEC (2015): Resposta ao processo 000206-15',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2015/OF_002_2015.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2015/OF_002_2015.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2015, 3, '003/2015', 'OF/PMSMJ/COMPDEC/N° 003/2015',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2015-01-15', 'CESAN - 01-04-2015',
            'CESAN - 01-04-2015', 'Acervo histórico COMPDEC (2015): CESAN - 01-04-2015',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2015/OF_003_2015.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2015/OF_003_2015.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2015, 4, '004/2015', 'OF/PMSMJ/COMPDEC/N° 004/2015',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2015-01-15', 'SECOBRAS E SERVIÇOS URBANOS , MANUTENÇÃO 01-04-2015',
            'SECOBRAS E SERVIÇOS URBANOS , MANUTENÇÃO 01-04-2015', 'Acervo histórico COMPDEC (2015): SECOBRAS E SERVIÇOS URBANOS , MANUTENÇÃO 01-04-2015',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2015/OF_004_2015.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2015/OF_004_2015.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2015, 5, '005/2015', 'OF/PMSMJ/COMPDEC/N° 005/2015',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2015-01-15', 'Resposta Nº 247-2014 Promotoria de Justiça SMJ 07-05-2015',
            'Resposta Nº 247-2014 Promotoria de Justiça SMJ 07-05-2015', 'Acervo histórico COMPDEC (2015): Resposta Nº 247-2014 Promotoria de Justiça SMJ 07-05-2015',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2015/OF_005_2015.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2015/OF_005_2015.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2015, 6, '006/2015', 'OF/PMSMJ/COMPDEC/N° 006/2015',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2015-01-15', 'CESAN - 07-05-2015',
            'CESAN - 07-05-2015', 'Acervo histórico COMPDEC (2015): CESAN - 07-05-2015',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2015/OF_006_2015.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2015/OF_006_2015.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2015, 7, '007/2015', 'OF/PMSMJ/COMPDEC/N° 007/2015',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2015-01-15', 'Prefeito Passarela de acesso Pedestre - 08-05-2015',
            'Prefeito Passarela de acesso Pedestre - 08-05-2015', 'Acervo histórico COMPDEC (2015): Prefeito Passarela de acesso Pedestre - 08-05-2015',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2015/OF_007_2015.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2015/OF_007_2015.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2015, 8, '008/2015', 'OF/PMSMJ/COMPDEC/N° 008/2015',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2015-01-15', 'Autorização de corte de árvore Jocimar Tesch 02-06-2015',
            'Autorização de corte de árvore Jocimar Tesch 02-06-2015', 'Acervo histórico COMPDEC (2015): Autorização de corte de árvore Jocimar Tesch 02-06-2015',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2015/OF_008_2015.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2015/OF_008_2015.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2015, 9, '009/2015', 'OF/PMSMJ/COMPDEC/N° 009/2015',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2015-01-15', 'Autorização corte Emilson Luiz Pego 02 -06-2015',
            'Autorização corte Emilson Luiz Pego 02 -06-2015', 'Acervo histórico COMPDEC (2015): Autorização corte Emilson Luiz Pego 02 -06-2015',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2015/OF_009_2015.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2015/OF_009_2015.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2015, 10, '010/2015', 'OF/PMSMJ/COMPDEC/N° 010/2015',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2015-01-15', 'Autorização de corte de árvore Belmiro Ponath 02-06-2015',
            'Autorização de corte de árvore Belmiro Ponath 02-06-2015', 'Acervo histórico COMPDEC (2015): Autorização de corte de árvore Belmiro Ponath 02-06-2015',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2015/OF_010_2015.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2015/OF_010_2015.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2017, 2, '002/2017', 'OF/PMSMJ/COMPDEC/N° 002/2017',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2017-01-15', 'CMA',
            'CMA', 'Acervo histórico COMPDEC (2017): CMA',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2017/OF_002_2017.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2017/OF_002_2017.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2017, 3, '003/2017', 'OF/PMSMJ/COMPDEC/N° 003/2017',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2017-01-15', 'CESAN - 01-04-2015',
            'CESAN - 01-04-2015', 'Acervo histórico COMPDEC (2017): CESAN - 01-04-2015',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2017/OF_003_2017.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2017/OF_003_2017.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2017, 4, '004/2017', 'OF/PMSMJ/COMPDEC/N° 004/2017',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2017-01-15', 'Bombeiros Voluntários',
            'Bombeiros Voluntários', 'Acervo histórico COMPDEC (2017): Bombeiros Voluntários',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2017/OF_004_2017.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2017/OF_004_2017.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2017, 5, '005/2017', 'OF/PMSMJ/COMPDEC/N° 005/2017',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2017-01-15', 'EDP Escelsa',
            'EDP Escelsa', 'Acervo histórico COMPDEC (2017): EDP Escelsa',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2017/OF_005_2017.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2017/OF_005_2017.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2017, 6, '006/2017', 'OF/PMSMJ/COMPDEC/N° 006/2017',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2017-01-15', 'SEAG',
            'SEAG', 'Acervo histórico COMPDEC (2017): SEAG',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2017/OF_006_2017.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2017/OF_006_2017.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2017, 7, '007/2017', 'OF/PMSMJ/COMPDEC/N° 007/2017',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2017-01-15', 'INCAPER',
            'INCAPER', 'Acervo histórico COMPDEC (2017): INCAPER',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2017/OF_007_2017.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2017/OF_007_2017.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2017, 8, '008/2017', 'OF/PMSMJ/COMPDEC/N° 008/2017',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2017-01-15', 'Bombeiros Voluntários',
            'Bombeiros Voluntários', 'Acervo histórico COMPDEC (2017): Bombeiros Voluntários',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2017/OF_008_2017.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2017/OF_008_2017.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2017, 9, '009/2017', 'OF/PMSMJ/COMPDEC/N° 009/2017',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2017-01-15', 'EDP',
            'EDP', 'Acervo histórico COMPDEC (2017): EDP',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2017/OF_009_2017.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2017/OF_009_2017.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2018, 1, '001/2018', 'OF/PMSMJ/COMPDEC/N° 001/2018',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2018-01-15', 'OFICIO PARA O S2ID 2018',
            'OFICIO PARA O S2ID 2018', 'Acervo histórico COMPDEC (2018): OFICIO PARA O S2ID 2018',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_001_2018.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_001_2018.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2018, 2, '002/2018', 'OF/PMSMJ/COMPDEC/N° 002/2018',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2018-01-15', 'Solicitação do kit estiágem - Cópia',
            'Solicitação do kit estiágem - Cópia', 'Acervo histórico COMPDEC (2018): Solicitação do kit estiágem - Cópia',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_002_2018.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_002_2018.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2018, 3, '003/2018', 'OF/PMSMJ/COMPDEC/N° 003/2018',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2018-01-15', 'Substituição de membros do Comitê Hidríco',
            'Substituição de membros do Comitê Hidríco', 'Acervo histórico COMPDEC (2018): Substituição de membros do Comitê Hidríco',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_003_2018.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_003_2018.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2018, 4, '004/2018', 'OF/PMSMJ/COMPDEC/N° 004/2018',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2018-01-15', 'Antonio Francisco Marins de Albuquerque',
            'Antonio Francisco Marins de Albuquerque', 'Acervo histórico COMPDEC (2018): Antonio Francisco Marins de Albuquerque',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_004_2018.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_004_2018.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2018, 5, '005/2018', 'OF/PMSMJ/COMPDEC/N° 005/2018',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2018-01-15', 'OFICIO PARA O S2ID 2018',
            'OFICIO PARA O S2ID 2018', 'Acervo histórico COMPDEC (2018): OFICIO PARA O S2ID 2018',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_005_2018.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_005_2018.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2018, 6, '006/2018', 'OF/PMSMJ/COMPDEC/N° 006/2018',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2018-01-15', 'OFICIO PARA CANCELAMENTO DE USUÁRIO O S2ID 2018',
            'OFICIO PARA CANCELAMENTO DE USUÁRIO O S2ID 2018', 'Acervo histórico COMPDEC (2018): OFICIO PARA CANCELAMENTO DE USUÁRIO O S2ID 2018',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_006_2018.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_006_2018.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2018, 7, '007/2018', 'OF/PMSMJ/COMPDEC/N° 007/2018',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2018-01-15', 'Encaminha Relatorio de vistoria APAE',
            'Encaminha Relatorio de vistoria APAE', 'Acervo histórico COMPDEC (2018): Encaminha Relatorio de vistoria APAE',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_007_2018.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_007_2018.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2018, 8, '008/2018', 'OF/PMSMJ/COMPDEC/N° 008/2018',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2018-01-15', 'Encaminha Relatório - Lecindo Herzog',
            'Encaminha Relatório - Lecindo Herzog', 'Acervo histórico COMPDEC (2018): Encaminha Relatório - Lecindo Herzog',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_008_2018.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_008_2018.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2018, 9, '009/2018', 'OF/PMSMJ/COMPDEC/N° 009/2018',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2018-01-15', 'Substituição de membros no CMA',
            'Substituição de membros no CMA', 'Acervo histórico COMPDEC (2018): Substituição de membros no CMA',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_009_2018.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_009_2018.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2018, 10, '010/2018', 'OF/PMSMJ/COMPDEC/N° 010/2018',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2018-01-15', 'Substituição de membros no Conselho de Segurança',
            'Substituição de membros no Conselho de Segurança', 'Acervo histórico COMPDEC (2018): Substituição de membros no Conselho de Segurança',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_010_2018.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_010_2018.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2018, 11, '011/2018', 'OF/PMSMJ/COMPDEC/N° 011/2018',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2018-01-15', 'revoga auto de interdição - Valter Braz Maggione',
            'revoga auto de interdição - Valter Braz Maggione', 'Acervo histórico COMPDEC (2018): revoga auto de interdição - Valter Braz Maggione',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_011_2018.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_011_2018.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2018, 12, '012/2018', 'OF/PMSMJ/COMPDEC/N° 012/2018',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2018-01-15', 'APAE',
            'APAE', 'Acervo histórico COMPDEC (2018): APAE',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_012_2018.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_012_2018.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2018, 13, '013/2018', 'OF/PMSMJ/COMPDEC/N° 013/2018',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2018-01-15', 'Encaminha Relatório - Lindolfo Henke',
            'Encaminha Relatório - Lindolfo Henke', 'Acervo histórico COMPDEC (2018): Encaminha Relatório - Lindolfo Henke',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_013_2018.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_013_2018.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2018, 14, '014/2018', 'OF/PMSMJ/COMPDEC/N° 014/2018',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2018-01-15', 'Conselho Tutelar',
            'Conselho Tutelar', 'Acervo histórico COMPDEC (2018): Conselho Tutelar',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_014_2018.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_014_2018.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2018, 15, '015/2018', 'OF/PMSMJ/COMPDEC/N° 015/2018',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2018-01-15', 'Comunica parecer - Martin Schulz',
            'Comunica parecer - Martin Schulz', 'Acervo histórico COMPDEC (2018): Comunica parecer - Martin Schulz',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_015_2018.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_015_2018.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2018, 16, '016/2018', 'OF/PMSMJ/COMPDEC/N° 016/2018',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2018-01-15', 'Comunica parecer - Alzira Fleger',
            'Comunica parecer - Alzira Fleger', 'Acervo histórico COMPDEC (2018): Comunica parecer - Alzira Fleger',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_016_2018.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_016_2018.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2018, 17, '017/2018', 'OF/PMSMJ/COMPDEC/N° 017/2018',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2018-01-15', 'Comunica parecer - Alvis Storch',
            'Comunica parecer - Alvis Storch', 'Acervo histórico COMPDEC (2018): Comunica parecer - Alvis Storch',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_017_2018.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_017_2018.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2018, 18, '018/2018', 'OF/PMSMJ/COMPDEC/N° 018/2018',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2018-01-15', 'Solicita treinamento de incêndio',
            'Solicita treinamento de incêndio', 'Acervo histórico COMPDEC (2018): Solicita treinamento de incêndio',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_018_2018.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_018_2018.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2018, 19, '019/2018', 'OF/PMSMJ/COMPDEC/N° 019/2018',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2018-01-15', 'Encaminha Relatório - Ageni Bullerjahn',
            'Encaminha Relatório - Ageni Bullerjahn', 'Acervo histórico COMPDEC (2018): Encaminha Relatório - Ageni Bullerjahn',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_019_2018.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_019_2018.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2018, 20, '020/2018', 'OF/PMSMJ/COMPDEC/N° 020/2018',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2018-01-15', 'Circular - Plano de Contingência',
            'Circular - Plano de Contingência', 'Acervo histórico COMPDEC (2018): Circular - Plano de Contingência',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_020_2018.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_020_2018.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2018, 21, '021/2018', 'OF/PMSMJ/COMPDEC/N° 021/2018',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2018-01-15', 'Bombeiros Voluntários',
            'Bombeiros Voluntários', 'Acervo histórico COMPDEC (2018): Bombeiros Voluntários',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_021_2018.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_021_2018.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2018, 22, '022/2018', 'OF/PMSMJ/COMPDEC/N° 022/2018',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2018-01-15', 'Comunica Parecer - Rofrigo Max Berger',
            'Comunica Parecer - Rofrigo Max Berger', 'Acervo histórico COMPDEC (2018): Comunica Parecer - Rofrigo Max Berger',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_022_2018.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_022_2018.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2018, 23, '023/2018', 'OF/PMSMJ/COMPDEC/N° 023/2018',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2018-01-15', 'PAD Geladeiras',
            'PAD Geladeiras', 'Acervo histórico COMPDEC (2018): PAD Geladeiras',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_023_2018.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_023_2018.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2018, 24, '024/2018', 'OF/PMSMJ/COMPDEC/N° 024/2018',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2018-01-15', 'Parceria PM Ambiental',
            'Parceria PM Ambiental', 'Acervo histórico COMPDEC (2018): Parceria PM Ambiental',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_024_2018.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_024_2018.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2018, 25, '025/2018', 'OF/PMSMJ/COMPDEC/N° 025/2018',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2018-01-15', 'Resposta Ministério Publico',
            'Resposta Ministério Publico', 'Acervo histórico COMPDEC (2018): Resposta Ministério Publico',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_025_2018.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_025_2018.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2018, 26, '026/2018', 'OF/PMSMJ/COMPDEC/N° 026/2018',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2018-01-15', 'Juliana Maria Sperandio schultz',
            'Juliana Maria Sperandio schultz', 'Acervo histórico COMPDEC (2018): Juliana Maria Sperandio schultz',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_026_2018.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_026_2018.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2018, 27, '027/2018', 'OF/PMSMJ/COMPDEC/N° 027/2018',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2018-01-15', 'Leomar Marquadt',
            'Leomar Marquadt', 'Acervo histórico COMPDEC (2018): Leomar Marquadt',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_027_2018.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_027_2018.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2018, 28, '028/2018', 'OF/PMSMJ/COMPDEC/N° 028/2018',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2018-01-15', 'Joimar Holz',
            'Joimar Holz', 'Acervo histórico COMPDEC (2018): Joimar Holz',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_028_2018.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_028_2018.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2018, 29, '029/2018', 'OF/PMSMJ/COMPDEC/N° 029/2018',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2018-01-15', 'Decreto área de risco',
            'Decreto área de risco', 'Acervo histórico COMPDEC (2018): Decreto área de risco',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_029_2018.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_029_2018.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2018, 30, '030/2018', 'OF/PMSMJ/COMPDEC/N° 030/2018',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2018-01-15', 'Corte de Arvore ETA',
            'Corte de Arvore ETA', 'Acervo histórico COMPDEC (2018): Corte de Arvore ETA',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_030_2018.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_030_2018.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2018, 31, '031/2018', 'OF/PMSMJ/COMPDEC/N° 031/2018',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2018-01-15', 'Antenor Neitzel',
            'Antenor Neitzel', 'Acervo histórico COMPDEC (2018): Antenor Neitzel',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_031_2018.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_031_2018.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2018, 32, '032/2018', 'OF/PMSMJ/COMPDEC/N° 032/2018',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2018-01-15', 'Alberto Buteske',
            'Alberto Buteske', 'Acervo histórico COMPDEC (2018): Alberto Buteske',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_032_2018.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_032_2018.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2018, 33, '033/2018', 'OF/PMSMJ/COMPDEC/N° 033/2018',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2018-01-15', 'CAPS',
            'CAPS', 'Acervo histórico COMPDEC (2018): CAPS',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_033_2018.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2018/OF_033_2018.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 1, '001/2019', 'OF/PMSMJ/COMPDEC/N° 001/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'IDAF',
            'IDAF', 'Acervo histórico COMPDEC (2019): IDAF',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_001_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_001_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 2, '002/2019', 'OF/PMSMJ/COMPDEC/N° 002/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'Adriana A. Almeida Carvalho',
            'Adriana A. Almeida Carvalho', 'Acervo histórico COMPDEC (2019): Adriana A. Almeida Carvalho',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_002_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_002_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 3, '003/2019', 'OF/PMSMJ/COMPDEC/N° 003/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'Leomar Marquadt',
            'Leomar Marquadt', 'Acervo histórico COMPDEC (2019): Leomar Marquadt',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_003_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_003_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 4, '004/2019', 'OF/PMSMJ/COMPDEC/N° 004/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'Marcelo Ponath',
            'Marcelo Ponath', 'Acervo histórico COMPDEC (2019): Marcelo Ponath',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_004_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_004_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 5, '005/2019', 'OF/PMSMJ/COMPDEC/N° 005/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'Leomar Marquardt',
            'Leomar Marquardt', 'Acervo histórico COMPDEC (2019): Leomar Marquardt',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_005_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_005_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 6, '006/2019', 'OF/PMSMJ/COMPDEC/N° 006/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'Rainerio Antonio de Souza',
            'Rainerio Antonio de Souza', 'Acervo histórico COMPDEC (2019): Rainerio Antonio de Souza',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_006_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_006_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 7, '007/2019', 'OF/PMSMJ/COMPDEC/N° 007/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'Antonio Vieira Nunes',
            'Antonio Vieira Nunes', 'Acervo histórico COMPDEC (2019): Antonio Vieira Nunes',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_007_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_007_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 8, '008/2019', 'OF/PMSMJ/COMPDEC/N° 008/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'Ralatório Prestação de contas',
            'Ralatório Prestação de contas', 'Acervo histórico COMPDEC (2019): Ralatório Prestação de contas',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_008_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_008_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 9, '009/2019', 'OF/PMSMJ/COMPDEC/N° 009/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'Flotelio Foesch',
            'Flotelio Foesch', 'Acervo histórico COMPDEC (2019): Flotelio Foesch',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_009_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_009_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 10, '010/2019', 'OF/PMSMJ/COMPDEC/N° 010/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'Embarcação',
            'Embarcação', 'Acervo histórico COMPDEC (2019): Embarcação',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_010_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_010_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 11, '011/2019', 'OF/PMSMJ/COMPDEC/N° 011/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'Rogerio Kalk',
            'Rogerio Kalk', 'Acervo histórico COMPDEC (2019): Rogerio Kalk',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_011_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_011_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 12, '012/2019', 'OF/PMSMJ/COMPDEC/N° 012/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'Interesse em compor o Conselho Gestor do FUNMPDEC',
            'Interesse em compor o Conselho Gestor do FUNMPDEC', 'Acervo histórico COMPDEC (2019): Interesse em compor o Conselho Gestor do FUNMPDEC',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_012_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_012_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 13, '013/2019', 'OF/PMSMJ/COMPDEC/N° 013/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'José Elmo Davel',
            'José Elmo Davel', 'Acervo histórico COMPDEC (2019): José Elmo Davel',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_013_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_013_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 14, '014/2019', 'OF/PMSMJ/COMPDEC/N° 014/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'Juliana Sperandio Schulz',
            'Juliana Sperandio Schulz', 'Acervo histórico COMPDEC (2019): Juliana Sperandio Schulz',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_014_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_014_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 15, '015/2019', 'OF/PMSMJ/COMPDEC/N° 015/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'N de L Romanha Comercial ME - Notificação',
            'N de L Romanha Comercial ME - Notificação', 'Acervo histórico COMPDEC (2019): N de L Romanha Comercial ME - Notificação',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_015_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_015_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 16, '016/2019', 'OF/PMSMJ/COMPDEC/N° 016/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'Lindaura',
            'Lindaura', 'Acervo histórico COMPDEC (2019): Lindaura',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_016_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_016_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 17, '017/2019', 'OF/PMSMJ/COMPDEC/N° 017/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'Plano de Emergência de Barragem',
            'Plano de Emergência de Barragem', 'Acervo histórico COMPDEC (2019): Plano de Emergência de Barragem',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_017_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_017_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 18, '018/2019', 'OF/PMSMJ/COMPDEC/N° 018/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'Vistoria tecnica',
            'Vistoria tecnica', 'Acervo histórico COMPDEC (2019): Vistoria tecnica',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_018_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_018_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 19, '019/2019', 'OF/PMSMJ/COMPDEC/N° 019/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'Convite SCO',
            'Convite SCO', 'Acervo histórico COMPDEC (2019): Convite SCO',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_019_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_019_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 20, '020/2019', 'OF/PMSMJ/COMPDEC/N° 020/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'recebimento dos barcos bombeiros',
            'recebimento dos barcos bombeiros', 'Acervo histórico COMPDEC (2019): recebimento dos barcos bombeiros',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_020_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_020_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 21, '021/2019', 'OF/PMSMJ/COMPDEC/N° 021/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'Rejeição parcial de contas',
            'Rejeição parcial de contas', 'Acervo histórico COMPDEC (2019): Rejeição parcial de contas',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_021_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_021_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 22, '022/2019', 'OF/PMSMJ/COMPDEC/N° 022/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'Cleomar Fehelberg Schultz',
            'Cleomar Fehelberg Schultz', 'Acervo histórico COMPDEC (2019): Cleomar Fehelberg Schultz',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_022_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_022_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 23, '023/2019', 'OF/PMSMJ/COMPDEC/N° 023/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'Nelcelina Espíndula - Doação de mobiliário',
            'Nelcelina Espíndula - Doação de mobiliário', 'Acervo histórico COMPDEC (2019): Nelcelina Espíndula - Doação de mobiliário',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_023_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_023_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 24, '024/2019', 'OF/PMSMJ/COMPDEC/N° 024/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'Nelcelina Espíndula - Solicitação de Informações',
            'Nelcelina Espíndula - Solicitação de Informações', 'Acervo histórico COMPDEC (2019): Nelcelina Espíndula - Solicitação de Informações',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_024_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_024_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 25, '025/2019', 'OF/PMSMJ/COMPDEC/N° 025/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'Egnaldo Andreatta - Solicitação de Informações',
            'Egnaldo Andreatta - Solicitação de Informações', 'Acervo histórico COMPDEC (2019): Egnaldo Andreatta - Solicitação de Informações',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_025_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_025_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 26, '026/2019', 'OF/PMSMJ/COMPDEC/N° 026/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'Sigrid Stuhr - Solicitação de Informações',
            'Sigrid Stuhr - Solicitação de Informações', 'Acervo histórico COMPDEC (2019): Sigrid Stuhr - Solicitação de Informações',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_026_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_026_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 27, '027/2019', 'OF/PMSMJ/COMPDEC/N° 027/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'Enoc Joaquim da Silva - Solicitações de Informações',
            'Enoc Joaquim da Silva - Solicitações de Informações', 'Acervo histórico COMPDEC (2019): Enoc Joaquim da Silva - Solicitações de Informações',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_027_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_027_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 28, '028/2019', 'OF/PMSMJ/COMPDEC/N° 028/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'Adequações no sistema E&L',
            'Adequações no sistema E&L', 'Acervo histórico COMPDEC (2019): Adequações no sistema E&L',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_028_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_028_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 29, '029/2019', 'OF/PMSMJ/COMPDEC/N° 029/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'Bombeiros Volun. Adqueção Prest.Cont',
            'Bombeiros Volun. Adqueção Prest.Cont', 'Acervo histórico COMPDEC (2019): Bombeiros Volun. Adqueção Prest.Cont',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_029_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_029_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 30, '030/2019', 'OF/PMSMJ/COMPDEC/N° 030/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'Bombeiros Volun. Isenção de tarifas bancárias',
            'Bombeiros Volun. Isenção de tarifas bancárias', 'Acervo histórico COMPDEC (2019): Bombeiros Volun. Isenção de tarifas bancárias',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_030_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_030_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 31, '031/2019', 'OF/PMSMJ/COMPDEC/N° 031/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'Aluguel Arquivo',
            'Aluguel Arquivo', 'Acervo histórico COMPDEC (2019): Aluguel Arquivo',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_031_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_031_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 32, '032/2019', 'OF/PMSMJ/COMPDEC/N° 032/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'Bombeiros Volun.  solicitação de corte de árvore',
            'Bombeiros Volun.  solicitação de corte de árvore', 'Acervo histórico COMPDEC (2019): Bombeiros Volun.  solicitação de corte de árvore',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_032_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_032_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 33, '033/2019', 'OF/PMSMJ/COMPDEC/N° 033/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'Bombeiros Volun. Resposta Embarcação',
            'Bombeiros Volun. Resposta Embarcação', 'Acervo histórico COMPDEC (2019): Bombeiros Volun. Resposta Embarcação',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_033_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_033_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 34, '034/2019', 'OF/PMSMJ/COMPDEC/N° 034/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'Verca Construtora',
            'Verca Construtora', 'Acervo histórico COMPDEC (2019): Verca Construtora',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_034_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_034_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 35, '035/2019', 'OF/PMSMJ/COMPDEC/N° 035/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'Seldiro Holz',
            'Seldiro Holz', 'Acervo histórico COMPDEC (2019): Seldiro Holz',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_035_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_035_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 36, '036/2019', 'OF/PMSMJ/COMPDEC/N° 036/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'Nilson Kurt',
            'Nilson Kurt', 'Acervo histórico COMPDEC (2019): Nilson Kurt',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_036_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_036_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 37, '037/2019', 'OF/PMSMJ/COMPDEC/N° 037/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'Bruno Plaster',
            'Bruno Plaster', 'Acervo histórico COMPDEC (2019): Bruno Plaster',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_037_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_037_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 38, '038/2019', 'OF/PMSMJ/COMPDEC/N° 038/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'Leocinio Holz',
            'Leocinio Holz', 'Acervo histórico COMPDEC (2019): Leocinio Holz',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_038_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_038_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 39, '039/2019', 'OF/PMSMJ/COMPDEC/N° 039/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'Altair Booner Jastrow',
            'Altair Booner Jastrow', 'Acervo histórico COMPDEC (2019): Altair Booner Jastrow',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_039_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_039_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 40, '040/2019', 'OF/PMSMJ/COMPDEC/N° 040/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'Claudinéia Olivera Guimarães',
            'Claudinéia Olivera Guimarães', 'Acervo histórico COMPDEC (2019): Claudinéia Olivera Guimarães',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_040_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_040_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 41, '041/2019', 'OF/PMSMJ/COMPDEC/N° 041/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'Janeta Jacob',
            'Janeta Jacob', 'Acervo histórico COMPDEC (2019): Janeta Jacob',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_041_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_041_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2019, 42, '042/2019', 'OF/PMSMJ/COMPDEC/N° 042/2019',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2019-01-15', 'Waldemiro Groner',
            'Waldemiro Groner', 'Acervo histórico COMPDEC (2019): Waldemiro Groner',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_042_2019.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2019/OF_042_2019.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2020, 1, '001/2020', 'OF/PMSMJ/COMPDEC/N° 001/2020',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2020-01-15', 'CEPDEC - Cel. BM André Có Silva',
            'CEPDEC - Cel. BM André Có Silva', 'Acervo histórico COMPDEC (2020): CEPDEC - Cel. BM André Có Silva',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2020/OF_001_2020.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2020/OF_001_2020.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2020, 2, '002/2020', 'OF/PMSMJ/COMPDEC/N° 002/2020',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2020-01-15', 'Waldemiro Kampim',
            'Waldemiro Kampim', 'Acervo histórico COMPDEC (2020): Waldemiro Kampim',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2020/OF_002_2020.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2020/OF_002_2020.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2020, 3, '003/2020', 'OF/PMSMJ/COMPDEC/N° 003/2020',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2020-01-15', 'Helmar Beling',
            'Helmar Beling', 'Acervo histórico COMPDEC (2020): Helmar Beling',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2020/OF_003_2020.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2020/OF_003_2020.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2020, 4, '004/2020', 'OF/PMSMJ/COMPDEC/N° 004/2020',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2020-01-15', 'CENAD',
            'CENAD', 'Acervo histórico COMPDEC (2020): CENAD',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2020/OF_004_2020.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2020/OF_004_2020.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2020, 5, '005/2020', 'OF/PMSMJ/COMPDEC/N° 005/2020',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2020-01-15', 'CEPDEC - Doação de VTR',
            'CEPDEC - Doação de VTR', 'Acervo histórico COMPDEC (2020): CEPDEC - Doação de VTR',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2020/OF_005_2020.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2020/OF_005_2020.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2020, 6, '006/2020', 'OF/PMSMJ/COMPDEC/N° 006/2020',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2020-01-15', 'Carlos Schultz',
            'Carlos Schultz', 'Acervo histórico COMPDEC (2020): Carlos Schultz',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2020/OF_006_2020.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2020/OF_006_2020.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2020, 8, '008/2020', 'OF/PMSMJ/COMPDEC/N° 008/2020',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2020-01-15', 'SAMU',
            'SAMU', 'Acervo histórico COMPDEC (2020): SAMU',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2020/OF_008_2020.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2020/OF_008_2020.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2020, 9, '009/2020', 'OF/PMSMJ/COMPDEC/N° 009/2020',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2020-01-15', 'Verne Holz',
            'Verne Holz', 'Acervo histórico COMPDEC (2020): Verne Holz',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2020/OF_009_2020.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2020/OF_009_2020.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2020, 10, '010/2020', 'OF/PMSMJ/COMPDEC/N° 010/2020',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2020-01-15', 'SECMAM - Denuncia Eucaliptos',
            'SECMAM - Denuncia Eucaliptos', 'Acervo histórico COMPDEC (2020): SECMAM - Denuncia Eucaliptos',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2020/OF_010_2020.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2020/OF_010_2020.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2020, 11, '011/2020', 'OF/PMSMJ/COMPDEC/N° 011/2020',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2020-01-15', 'CEPDEC - Doação de Rádios',
            'CEPDEC - Doação de Rádios', 'Acervo histórico COMPDEC (2020): CEPDEC - Doação de Rádios',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2020/OF_011_2020.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2020/OF_011_2020.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2020, 12, '012/2020', 'OF/PMSMJ/COMPDEC/N° 012/2020',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2020-01-15', 'Francisco Doring',
            'Francisco Doring', 'Acervo histórico COMPDEC (2020): Francisco Doring',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2020/OF_012_2020.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2020/OF_012_2020.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2020, 13, '013/2020', 'OF/PMSMJ/COMPDEC/N° 013/2020',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2020-01-15', 'Cleide Fabiano',
            'Cleide Fabiano', 'Acervo histórico COMPDEC (2020): Cleide Fabiano',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2020/OF_013_2020.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2020/OF_013_2020.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2020, 14, '014/2020', 'OF/PMSMJ/COMPDEC/N° 014/2020',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2020-01-15', 'Delfino Plaster',
            'Delfino Plaster', 'Acervo histórico COMPDEC (2020): Delfino Plaster',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2020/OF_014_2020.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2020/OF_014_2020.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2021, 1, '001/2021', 'OF/PMSMJ/COMPDEC/N° 001/2021',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2021-01-15', 'CEPDEC - Cel. BM André Có Silva',
            'CEPDEC - Cel. BM André Có Silva', 'Acervo histórico COMPDEC (2021): CEPDEC - Cel. BM André Có Silva',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_001_2021.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_001_2021.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2021, 2, '002/2021', 'OF/PMSMJ/COMPDEC/N° 002/2021',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2021-01-15', 'SECMAM - Denuncia - sindjetibá',
            'SECMAM - Denuncia - sindjetibá', 'Acervo histórico COMPDEC (2021): SECMAM - Denuncia - sindjetibá',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_002_2021.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_002_2021.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2021, 3, '003/2021', 'OF/PMSMJ/COMPDEC/N° 003/2021',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2021-01-15', 'Marinha',
            'Marinha', 'Acervo histórico COMPDEC (2021): Marinha',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_003_2021.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_003_2021.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2021, 4, '004/2021', 'OF/PMSMJ/COMPDEC/N° 004/2021',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2021-01-15', 'Cesan Hidrantes',
            'Cesan Hidrantes', 'Acervo histórico COMPDEC (2021): Cesan Hidrantes',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_004_2021.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_004_2021.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2021, 5, '005/2021', 'OF/PMSMJ/COMPDEC/N° 005/2021',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2021-01-15', 'Vanderleia Costa',
            'Vanderleia Costa', 'Acervo histórico COMPDEC (2021): Vanderleia Costa',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_005_2021.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_005_2021.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2021, 6, '006/2021', 'OF/PMSMJ/COMPDEC/N° 006/2021',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2021-01-15', 'Valter Furlani',
            'Valter Furlani', 'Acervo histórico COMPDEC (2021): Valter Furlani',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_006_2021.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_006_2021.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2021, 7, '007/2021', 'OF/PMSMJ/COMPDEC/N° 007/2021',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2021-01-15', 'Compdec Itaguaçu',
            'Compdec Itaguaçu', 'Acervo histórico COMPDEC (2021): Compdec Itaguaçu',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_007_2021.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_007_2021.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2021, 8, '008/2021', 'OF/PMSMJ/COMPDEC/N° 008/2021',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2021-01-15', 'Compdec Santa Teresa',
            'Compdec Santa Teresa', 'Acervo histórico COMPDEC (2021): Compdec Santa Teresa',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_008_2021.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_008_2021.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2021, 9, '009/2021', 'OF/PMSMJ/COMPDEC/N° 009/2021',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2021-01-15', 'Compdec Afonso Claudio',
            'Compdec Afonso Claudio', 'Acervo histórico COMPDEC (2021): Compdec Afonso Claudio',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_009_2021.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_009_2021.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2021, 10, '010/2021', 'OF/PMSMJ/COMPDEC/N° 010/2021',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2021-01-15', 'Bombeiros Voluntários',
            'Bombeiros Voluntários', 'Acervo histórico COMPDEC (2021): Bombeiros Voluntários',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_010_2021.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_010_2021.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2021, 11, '011/2021', 'OF/PMSMJ/COMPDEC/N° 011/2021',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2021-01-15', 'Bombeiros Voluntários',
            'Bombeiros Voluntários', 'Acervo histórico COMPDEC (2021): Bombeiros Voluntários',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_011_2021.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_011_2021.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2021, 12, '012/2021', 'OF/PMSMJ/COMPDEC/N° 012/2021',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2021-01-15', 'Compdec Santa Leopoldina',
            'Compdec Santa Leopoldina', 'Acervo histórico COMPDEC (2021): Compdec Santa Leopoldina',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_012_2021.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_012_2021.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2021, 13, '013/2021', 'OF/PMSMJ/COMPDEC/N° 013/2021',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2021-01-15', 'CEPDEC - Resposta a CI 058 (Veículo)',
            'CEPDEC - Resposta a CI 058 (Veículo)', 'Acervo histórico COMPDEC (2021): CEPDEC - Resposta a CI 058 (Veículo)',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_013_2021.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_013_2021.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2021, 14, '014/2021', 'OF/PMSMJ/COMPDEC/N° 014/2021',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2021-01-15', 'Câmara Municipal de Santa Maria de Jetibá',
            'Câmara Municipal de Santa Maria de Jetibá', 'Acervo histórico COMPDEC (2021): Câmara Municipal de Santa Maria de Jetibá',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_014_2021.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_014_2021.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2021, 15, '015/2021', 'OF/PMSMJ/COMPDEC/N° 015/2021',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2021-01-15', 'Thalia Barth',
            'Thalia Barth', 'Acervo histórico COMPDEC (2021): Thalia Barth',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_015_2021.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_015_2021.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2021, 16, '016/2021', 'OF/PMSMJ/COMPDEC/N° 016/2021',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2021-01-15', 'SICOOB',
            'SICOOB', 'Acervo histórico COMPDEC (2021): SICOOB',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_016_2021.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_016_2021.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2021, 17, '017/2021', 'OF/PMSMJ/COMPDEC/N° 017/2021',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2021-01-15', 'CEPDEC - Encaminha documentação e solicita prorrogação',
            'CEPDEC - Encaminha documentação e solicita prorrogação', 'Acervo histórico COMPDEC (2021): CEPDEC - Encaminha documentação e solicita prorrogação',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_017_2021.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_017_2021.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2021, 18, '018/2021', 'OF/PMSMJ/COMPDEC/N° 018/2021',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2021-01-15', 'Bombeiros Voluntários',
            'Bombeiros Voluntários', 'Acervo histórico COMPDEC (2021): Bombeiros Voluntários',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_018_2021.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_018_2021.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2021, 19, '019/2021', 'OF/PMSMJ/COMPDEC/N° 019/2021',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2021-01-15', 'CEPDEC - Encaminha documentação',
            'CEPDEC - Encaminha documentação', 'Acervo histórico COMPDEC (2021): CEPDEC - Encaminha documentação',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_019_2021.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_019_2021.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2021, 20, '020/2021', 'OF/PMSMJ/COMPDEC/N° 020/2021',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2021-01-15', 'Seven',
            'Seven', 'Acervo histórico COMPDEC (2021): Seven',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_020_2021.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_020_2021.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2021, 21, '021/2021', 'OF/PMSMJ/COMPDEC/N° 021/2021',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2021-01-15', 'Escola Graça Aranha',
            'Escola Graça Aranha', 'Acervo histórico COMPDEC (2021): Escola Graça Aranha',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_021_2021.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_021_2021.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2021, 22, '022/2021', 'OF/PMSMJ/COMPDEC/N° 022/2021',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2021-01-15', 'Escola Vila de Jetibá',
            'Escola Vila de Jetibá', 'Acervo histórico COMPDEC (2021): Escola Vila de Jetibá',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_022_2021.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_022_2021.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2021, 23, '023/2021', 'OF/PMSMJ/COMPDEC/N° 023/2021',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2021-01-15', 'Igreja Luterana - São Luis',
            'Igreja Luterana - São Luis', 'Acervo histórico COMPDEC (2021): Igreja Luterana - São Luis',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_023_2021.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_023_2021.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2021, 24, '024/2021', 'OF/PMSMJ/COMPDEC/N° 024/2021',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2021-01-15', 'Associação Comercial de Santa Maria de Jetibá',
            'Associação Comercial de Santa Maria de Jetibá', 'Acervo histórico COMPDEC (2021): Associação Comercial de Santa Maria de Jetibá',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_024_2021.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2021/OF_024_2021.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 1, '001/2022', 'OF/PMSMJ/COMPDEC/N° 001/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'CEPDEC - Maj. BM Rodrigo Rigoni de Souza - Copia',
            'CEPDEC - Maj. BM Rodrigo Rigoni de Souza - Copia', 'Acervo histórico COMPDEC (2022): CEPDEC - Maj. BM Rodrigo Rigoni de Souza - Copia',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_001_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_001_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 2, '002/2022', 'OF/PMSMJ/COMPDEC/N° 002/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Secretaria de Obras',
            'Secretaria de Obras', 'Acervo histórico COMPDEC (2022): Secretaria de Obras',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_002_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_002_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 3, '003/2022', 'OF/PMSMJ/COMPDEC/N° 003/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Secgab - Horas extras',
            'Secgab - Horas extras', 'Acervo histórico COMPDEC (2022): Secgab - Horas extras',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_003_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_003_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 4, '004/2022', 'OF/PMSMJ/COMPDEC/N° 004/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Secgab - Horas extras mês de dezembro',
            'Secgab - Horas extras mês de dezembro', 'Acervo histórico COMPDEC (2022): Secgab - Horas extras mês de dezembro',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_004_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_004_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 5, '005/2022', 'OF/PMSMJ/COMPDEC/N° 005/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Secman',
            'Secman', 'Acervo histórico COMPDEC (2022): Secman',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_005_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_005_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 6, '006/2022', 'OF/PMSMJ/COMPDEC/N° 006/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'SECPLA - Inclusão de elemento de despesa',
            'SECPLA - Inclusão de elemento de despesa', 'Acervo histórico COMPDEC (2022): SECPLA - Inclusão de elemento de despesa',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_006_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_006_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 7, '007/2022', 'OF/PMSMJ/COMPDEC/N° 007/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Secretaria de Obras - Alfalto cedendo Córrego do Ouro',
            'Secretaria de Obras - Alfalto cedendo Córrego do Ouro', 'Acervo histórico COMPDEC (2022): Secretaria de Obras - Alfalto cedendo Córrego do Ouro',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_007_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_007_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 8, '008/2022', 'OF/PMSMJ/COMPDEC/N° 008/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Notificação de risco - Joimar Holz',
            'Notificação de risco - Joimar Holz', 'Acervo histórico COMPDEC (2022): Notificação de risco - Joimar Holz',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_008_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_008_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 9, '009/2022', 'OF/PMSMJ/COMPDEC/N° 009/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Secgab - Comprovante de vacinção',
            'Secgab - Comprovante de vacinção', 'Acervo histórico COMPDEC (2022): Secgab - Comprovante de vacinção',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_009_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_009_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 10, '010/2022', 'OF/PMSMJ/COMPDEC/N° 010/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Secgab - Horas extras',
            'Secgab - Horas extras', 'Acervo histórico COMPDEC (2022): Secgab - Horas extras',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_010_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_010_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 11, '011/2022', 'OF/PMSMJ/COMPDEC/N° 011/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Secgab - Substituição na representação no CMDCA - Copia',
            'Secgab - Substituição na representação no CMDCA - Copia', 'Acervo histórico COMPDEC (2022): Secgab - Substituição na representação no CMDCA - Copia',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_011_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_011_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 12, '012/2022', 'OF/PMSMJ/COMPDEC/N° 012/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Secgab - Solicitação de reparo ao DER',
            'Secgab - Solicitação de reparo ao DER', 'Acervo histórico COMPDEC (2022): Secgab - Solicitação de reparo ao DER',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_012_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_012_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 13, '013/2022', 'OF/PMSMJ/COMPDEC/N° 013/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Secgab - Informa férias de servidor',
            'Secgab - Informa férias de servidor', 'Acervo histórico COMPDEC (2022): Secgab - Informa férias de servidor',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_013_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_013_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 14, '014/2022', 'OF/PMSMJ/COMPDEC/N° 014/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Secretaria de Obras - afundamento no asfalto',
            'Secretaria de Obras - afundamento no asfalto', 'Acervo histórico COMPDEC (2022): Secretaria de Obras - afundamento no asfalto',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_014_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_014_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 15, '015/2022', 'OF/PMSMJ/COMPDEC/N° 015/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Secgab - Informa situação de risco',
            'Secgab - Informa situação de risco', 'Acervo histórico COMPDEC (2022): Secgab - Informa situação de risco',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_015_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_015_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 16, '016/2022', 'OF/PMSMJ/COMPDEC/N° 016/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Wagner Ricardo Guimarães',
            'Wagner Ricardo Guimarães', 'Acervo histórico COMPDEC (2022): Wagner Ricardo Guimarães',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_016_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_016_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 17, '017/2022', 'OF/PMSMJ/COMPDEC/N° 017/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Secgab - Horas mês de abril',
            'Secgab - Horas mês de abril', 'Acervo histórico COMPDEC (2022): Secgab - Horas mês de abril',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_017_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_017_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 18, '018/2022', 'OF/PMSMJ/COMPDEC/N° 018/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Ademar Menegussi',
            'Ademar Menegussi', 'Acervo histórico COMPDEC (2022): Ademar Menegussi',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_018_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_018_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 19, '019/2022', 'OF/PMSMJ/COMPDEC/N° 019/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Secretaria de Turismo',
            'Secretaria de Turismo', 'Acervo histórico COMPDEC (2022): Secretaria de Turismo',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_019_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_019_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 20, '020/2022', 'OF/PMSMJ/COMPDEC/N° 020/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Securb - Informa situação do talude no Belém',
            'Securb - Informa situação do talude no Belém', 'Acervo histórico COMPDEC (2022): Securb - Informa situação do talude no Belém',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_020_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_020_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 21, '021/2022', 'OF/PMSMJ/COMPDEC/N° 021/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Diones Henrique Vitorio',
            'Diones Henrique Vitorio', 'Acervo histórico COMPDEC (2022): Diones Henrique Vitorio',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_021_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_021_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 22, '022/2022', 'OF/PMSMJ/COMPDEC/N° 022/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Secgab - Horas mês de maio',
            'Secgab - Horas mês de maio', 'Acervo histórico COMPDEC (2022): Secgab - Horas mês de maio',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_022_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_022_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 23, '023/2022', 'OF/PMSMJ/COMPDEC/N° 023/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Lurdes Anna Kunsch Foeger',
            'Lurdes Anna Kunsch Foeger', 'Acervo histórico COMPDEC (2022): Lurdes Anna Kunsch Foeger',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_023_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_023_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 24, '024/2022', 'OF/PMSMJ/COMPDEC/N° 024/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Secgab - aumento de velocidade de internet',
            'Secgab - aumento de velocidade de internet', 'Acervo histórico COMPDEC (2022): Secgab - aumento de velocidade de internet',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_024_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_024_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 25, '025/2022', 'OF/PMSMJ/COMPDEC/N° 025/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'REPDEC -Ten. Luiza Helena Souza dos Santos',
            'REPDEC -Ten. Luiza Helena Souza dos Santos', 'Acervo histórico COMPDEC (2022): REPDEC -Ten. Luiza Helena Souza dos Santos',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_025_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_025_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 26, '026/2022', 'OF/PMSMJ/COMPDEC/N° 026/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Secgab - Horas mês de junho',
            'Secgab - Horas mês de junho', 'Acervo histórico COMPDEC (2022): Secgab - Horas mês de junho',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_026_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_026_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 27, '027/2022', 'OF/PMSMJ/COMPDEC/N° 027/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Eliana Schawambach',
            'Eliana Schawambach', 'Acervo histórico COMPDEC (2022): Eliana Schawambach',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_027_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_027_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 28, '028/2022', 'OF/PMSMJ/COMPDEC/N° 028/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Bombeiros Voluntários',
            'Bombeiros Voluntários', 'Acervo histórico COMPDEC (2022): Bombeiros Voluntários',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_028_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_028_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 29, '029/2022', 'OF/PMSMJ/COMPDEC/N° 029/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Prefeito',
            'Prefeito', 'Acervo histórico COMPDEC (2022): Prefeito',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_029_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_029_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 30, '030/2022', 'OF/PMSMJ/COMPDEC/N° 030/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Bombeiros Voluntários',
            'Bombeiros Voluntários', 'Acervo histórico COMPDEC (2022): Bombeiros Voluntários',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_030_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_030_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 31, '031/2022', 'OF/PMSMJ/COMPDEC/N° 031/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Secgab - Horas mês de julho',
            'Secgab - Horas mês de julho', 'Acervo histórico COMPDEC (2022): Secgab - Horas mês de julho',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_031_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_031_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 32, '032/2022', 'OF/PMSMJ/COMPDEC/N° 032/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Secgab - Interdição da Ponte em Rio Bonito',
            'Secgab - Interdição da Ponte em Rio Bonito', 'Acervo histórico COMPDEC (2022): Secgab - Interdição da Ponte em Rio Bonito',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_032_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_032_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 33, '033/2022', 'OF/PMSMJ/COMPDEC/N° 033/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Silvia Maria Chafilla',
            'Silvia Maria Chafilla', 'Acervo histórico COMPDEC (2022): Silvia Maria Chafilla',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_033_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_033_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 34, '034/2022', 'OF/PMSMJ/COMPDEC/N° 034/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Creas - Andrea Barbosa',
            'Creas - Andrea Barbosa', 'Acervo histórico COMPDEC (2022): Creas - Andrea Barbosa',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_034_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_034_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 35, '035/2022', 'OF/PMSMJ/COMPDEC/N° 035/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Secgab - Horas mês de agosto',
            'Secgab - Horas mês de agosto', 'Acervo histórico COMPDEC (2022): Secgab - Horas mês de agosto',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_035_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_035_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 36, '036/2022', 'OF/PMSMJ/COMPDEC/N° 036/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Secgab - Informa situação de risco Morro do Bento',
            'Secgab - Informa situação de risco Morro do Bento', 'Acervo histórico COMPDEC (2022): Secgab - Informa situação de risco Morro do Bento',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_036_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_036_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 37, '037/2022', 'OF/PMSMJ/COMPDEC/N° 037/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Secgab - Horas mês de setembro - Copia',
            'Secgab - Horas mês de setembro - Copia', 'Acervo histórico COMPDEC (2022): Secgab - Horas mês de setembro - Copia',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_037_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_037_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 38, '038/2022', 'OF/PMSMJ/COMPDEC/N° 038/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Secgab - Horas mês de outubro',
            'Secgab - Horas mês de outubro', 'Acervo histórico COMPDEC (2022): Secgab - Horas mês de outubro',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_038_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_038_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 39, '039/2022', 'OF/PMSMJ/COMPDEC/N° 039/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Secretarias - Período Chuvoso',
            'Secretarias - Período Chuvoso', 'Acervo histórico COMPDEC (2022): Secretarias - Período Chuvoso',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_039_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_039_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 40, '040/2022', 'OF/PMSMJ/COMPDEC/N° 040/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Securb - Resposta CI 280',
            'Securb - Resposta CI 280', 'Acervo histórico COMPDEC (2022): Securb - Resposta CI 280',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_040_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_040_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 41, '041/2022', 'OF/PMSMJ/COMPDEC/N° 041/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Rede Rádio',
            'Rede Rádio', 'Acervo histórico COMPDEC (2022): Rede Rádio',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_041_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_041_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 42, '042/2022', 'OF/PMSMJ/COMPDEC/N° 042/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'IBREJETIBÁ - Orientação preventiva',
            'IBREJETIBÁ - Orientação preventiva', 'Acervo histórico COMPDEC (2022): IBREJETIBÁ - Orientação preventiva',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_042_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_042_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 43, '043/2022', 'OF/PMSMJ/COMPDEC/N° 043/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Assembleia de Deus',
            'Assembleia de Deus', 'Acervo histórico COMPDEC (2022): Assembleia de Deus',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_043_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_043_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 45, '045/2022', 'OF/PMSMJ/COMPDEC/N° 045/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Secretaria de Acão Social',
            'Secretaria de Acão Social', 'Acervo histórico COMPDEC (2022): Secretaria de Acão Social',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_045_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_045_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 46, '046/2022', 'OF/PMSMJ/COMPDEC/N° 046/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'FUNMPDEC',
            'FUNMPDEC', 'Acervo histórico COMPDEC (2022): FUNMPDEC',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_046_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_046_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 47, '047/2022', 'OF/PMSMJ/COMPDEC/N° 047/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Secretaria de Meio Ambiente',
            'Secretaria de Meio Ambiente', 'Acervo histórico COMPDEC (2022): Secretaria de Meio Ambiente',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_047_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_047_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 48, '048/2022', 'OF/PMSMJ/COMPDEC/N° 048/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Secretaria de Obras',
            'Secretaria de Obras', 'Acervo histórico COMPDEC (2022): Secretaria de Obras',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_048_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_048_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 49, '049/2022', 'OF/PMSMJ/COMPDEC/N° 049/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Secgab - Horas mês de setembro - Copia - Cópia',
            'Secgab - Horas mês de setembro - Copia - Cópia', 'Acervo histórico COMPDEC (2022): Secgab - Horas mês de setembro - Copia - Cópia',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_049_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_049_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 50, '050/2022', 'OF/PMSMJ/COMPDEC/N° 050/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Secgab - Horas mês de novembro',
            'Secgab - Horas mês de novembro', 'Acervo histórico COMPDEC (2022): Secgab - Horas mês de novembro',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_050_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_050_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 51, '051/2022', 'OF/PMSMJ/COMPDEC/N° 051/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Secgab - Diárias',
            'Secgab - Diárias', 'Acervo histórico COMPDEC (2022): Secgab - Diárias',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_051_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_051_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 52, '052/2022', 'OF/PMSMJ/COMPDEC/N° 052/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Secgab - Férias',
            'Secgab - Férias', 'Acervo histórico COMPDEC (2022): Secgab - Férias',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_052_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_052_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 53, '053/2022', 'OF/PMSMJ/COMPDEC/N° 053/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Bombeiros Voluntários',
            'Bombeiros Voluntários', 'Acervo histórico COMPDEC (2022): Bombeiros Voluntários',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_053_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_053_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 54, '054/2022', 'OF/PMSMJ/COMPDEC/N° 054/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'NUPDEC',
            'NUPDEC', 'Acervo histórico COMPDEC (2022): NUPDEC',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_054_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_054_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 55, '055/2022', 'OF/PMSMJ/COMPDEC/N° 055/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Sectur',
            'Sectur', 'Acervo histórico COMPDEC (2022): Sectur',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_055_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_055_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 56, '056/2022', 'OF/PMSMJ/COMPDEC/N° 056/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Rádio Pomerana',
            'Rádio Pomerana', 'Acervo histórico COMPDEC (2022): Rádio Pomerana',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_056_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_056_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 58, '058/2022', 'OF/PMSMJ/COMPDEC/N° 058/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Siegmanud Berger',
            'Siegmanud Berger', 'Acervo histórico COMPDEC (2022): Siegmanud Berger',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_058_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_058_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 59, '059/2022', 'OF/PMSMJ/COMPDEC/N° 059/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Secretaria de Saude - Areas de risco',
            'Secretaria de Saude - Areas de risco', 'Acervo histórico COMPDEC (2022): Secretaria de Saude - Areas de risco',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_059_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_059_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 60, '060/2022', 'OF/PMSMJ/COMPDEC/N° 060/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'REPDEC',
            'REPDEC', 'Acervo histórico COMPDEC (2022): REPDEC',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_060_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_060_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 61, '061/2022', 'OF/PMSMJ/COMPDEC/N° 061/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Bombeiros Militares',
            'Bombeiros Militares', 'Acervo histórico COMPDEC (2022): Bombeiros Militares',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_061_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_061_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 62, '062/2022', 'OF/PMSMJ/COMPDEC/N° 062/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Tifor',
            'Tifor', 'Acervo histórico COMPDEC (2022): Tifor',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_062_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_062_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2022, 63, '063/2022', 'OF/PMSMJ/COMPDEC/N° 063/2022',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2022-01-15', 'Securb',
            'Securb', 'Acervo histórico COMPDEC (2022): Securb',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_063_2022.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2022/OF_063_2022.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 1, '001/2023', 'OF/PMSMJ/COMPDEC/N° 001/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', 'Secgab - Horas mês de dezembro',
            'Secgab - Horas mês de dezembro', 'Acervo histórico COMPDEC (2023): Secgab - Horas mês de dezembro',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_001_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_001_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 2, '002/2023', 'OF/PMSMJ/COMPDEC/N° 002/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', 'Secretaria de Fazenda - lavantamento do superavit',
            'Secretaria de Fazenda - lavantamento do superavit', 'Acervo histórico COMPDEC (2023): Secretaria de Fazenda - lavantamento do superavit',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_002_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_002_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 3, '003/2023', 'OF/PMSMJ/COMPDEC/N° 003/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', 'CEPDEC -Cel BM Aureo Buzatto - SMJ',
            'CEPDEC -Cel BM Aureo Buzatto - SMJ', 'Acervo histórico COMPDEC (2023): CEPDEC -Cel BM Aureo Buzatto - SMJ',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_003_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_003_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 4, '004/2023', 'OF/PMSMJ/COMPDEC/N° 004/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', 'Secgab - Horas mês de janeiro',
            'Secgab - Horas mês de janeiro', 'Acervo histórico COMPDEC (2023): Secgab - Horas mês de janeiro',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_004_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_004_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 5, '005/2023', 'OF/PMSMJ/COMPDEC/N° 005/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', 'Secgab - Horas mês de fevereiro',
            'Secgab - Horas mês de fevereiro', 'Acervo histórico COMPDEC (2023): Secgab - Horas mês de fevereiro',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_005_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_005_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 6, '006/2023', 'OF/PMSMJ/COMPDEC/N° 006/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', 'Setdas - informa condição de risco',
            'Setdas - informa condição de risco', 'Acervo histórico COMPDEC (2023): Setdas - informa condição de risco',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_006_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_006_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 7, '007/2023', 'OF/PMSMJ/COMPDEC/N° 007/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', 'Sedes - Pluviometros',
            'Sedes - Pluviometros', 'Acervo histórico COMPDEC (2023): Sedes - Pluviometros',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_007_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_007_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 8, '008/2023', 'OF/PMSMJ/COMPDEC/N° 008/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', 'Securb- Torre de Rádio',
            'Securb- Torre de Rádio', 'Acervo histórico COMPDEC (2023): Securb- Torre de Rádio',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_008_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_008_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 9, '009/2023', 'OF/PMSMJ/COMPDEC/N° 009/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', 'NUPDEC - Bombeiros Voluntários',
            'NUPDEC - Bombeiros Voluntários', 'Acervo histórico COMPDEC (2023): NUPDEC - Bombeiros Voluntários',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_009_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_009_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 10, '010/2023', 'OF/PMSMJ/COMPDEC/N° 010/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', 'Securb- Vistoria em Rio Possmoser',
            'Securb- Vistoria em Rio Possmoser', 'Acervo histórico COMPDEC (2023): Securb- Vistoria em Rio Possmoser',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_010_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_010_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 11, '011/2023', 'OF/PMSMJ/COMPDEC/N° 011/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', '2023 - Securb - Lixeira',
            '2023 - Securb - Lixeira', 'Acervo histórico COMPDEC (2023): 2023 - Securb - Lixeira',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_011_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_011_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 12, '012/2023', 'OF/PMSMJ/COMPDEC/N° 012/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', '2023 - Secedu- Lei Lucas',
            '2023 - Secedu- Lei Lucas', 'Acervo histórico COMPDEC (2023): 2023 - Secedu- Lei Lucas',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_012_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_012_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 13, '013/2023', 'OF/PMSMJ/COMPDEC/N° 013/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', '2023 - Bombeiros Voluntários',
            '2023 - Bombeiros Voluntários', 'Acervo histórico COMPDEC (2023): 2023 - Bombeiros Voluntários',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_013_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_013_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 14, '014/2023', 'OF/PMSMJ/COMPDEC/N° 014/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', '2023 - Secman - Corte Arvores',
            '2023 - Secman - Corte Arvores', 'Acervo histórico COMPDEC (2023): 2023 - Secman - Corte Arvores',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_014_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_014_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 15, '015/2023', 'OF/PMSMJ/COMPDEC/N° 015/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', '2023 - IDAF',
            '2023 - IDAF', 'Acervo histórico COMPDEC (2023): 2023 - IDAF',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_015_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_015_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 16, '016/2023', 'OF/PMSMJ/COMPDEC/N° 016/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', '2023 - Secadm- Ponto Eletronico',
            '2023 - Secadm- Ponto Eletronico', 'Acervo histórico COMPDEC (2023): 2023 - Secadm- Ponto Eletronico',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_016_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_016_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 17, '017/2023', 'OF/PMSMJ/COMPDEC/N° 017/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', '2023- Atomizadores',
            '2023- Atomizadores', 'Acervo histórico COMPDEC (2023): 2023- Atomizadores',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_017_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_017_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 18, '018/2023', 'OF/PMSMJ/COMPDEC/N° 018/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', 'BARCO- Bombeiros Voluntários',
            'BARCO- Bombeiros Voluntários', 'Acervo histórico COMPDEC (2023): BARCO- Bombeiros Voluntários',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_018_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_018_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 19, '019/2023', 'OF/PMSMJ/COMPDEC/N° 019/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', 'SETDAS - Evaldo Schneider',
            'SETDAS - Evaldo Schneider', 'Acervo histórico COMPDEC (2023): SETDAS - Evaldo Schneider',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_019_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_019_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 20, '020/2023', 'OF/PMSMJ/COMPDEC/N° 020/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', '2023 - Securb -Ouvidoria',
            '2023 - Securb -Ouvidoria', 'Acervo histórico COMPDEC (2023): 2023 - Securb -Ouvidoria',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_020_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_020_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 21, '021/2023', 'OF/PMSMJ/COMPDEC/N° 021/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', '2023- GRAE - Prefeito',
            '2023- GRAE - Prefeito', 'Acervo histórico COMPDEC (2023): 2023- GRAE - Prefeito',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_021_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_021_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 22, '022/2023', 'OF/PMSMJ/COMPDEC/N° 022/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', '2023- Limpeza de Rio',
            '2023- Limpeza de Rio', 'Acervo histórico COMPDEC (2023): 2023- Limpeza de Rio',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_022_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_022_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 23, '023/2023', 'OF/PMSMJ/COMPDEC/N° 023/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', '2023- Decreto Aviária',
            '2023- Decreto Aviária', 'Acervo histórico COMPDEC (2023): 2023- Decreto Aviária',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_023_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_023_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 24, '024/2023', 'OF/PMSMJ/COMPDEC/N° 024/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', '2023- Conselho Tutelar',
            '2023- Conselho Tutelar', 'Acervo histórico COMPDEC (2023): 2023- Conselho Tutelar',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_024_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_024_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 25, '025/2023', 'OF/PMSMJ/COMPDEC/N° 025/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', '2023- Comissão de Respostas a Desastres',
            '2023- Comissão de Respostas a Desastres', 'Acervo histórico COMPDEC (2023): 2023- Comissão de Respostas a Desastres',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_025_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_025_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 26, '026/2023', 'OF/PMSMJ/COMPDEC/N° 026/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', '2023- Curso IFES',
            '2023- Curso IFES', 'Acervo histórico COMPDEC (2023): 2023- Curso IFES',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_026_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_026_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 27, '027/2023', 'OF/PMSMJ/COMPDEC/N° 027/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', '2023- Adesão a ATA',
            '2023- Adesão a ATA', 'Acervo histórico COMPDEC (2023): 2023- Adesão a ATA',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_027_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_027_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 28, '028/2023', 'OF/PMSMJ/COMPDEC/N° 028/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', '2023 - CESAN TAMPA BOEIRO',
            '2023 - CESAN TAMPA BOEIRO', 'Acervo histórico COMPDEC (2023): 2023 - CESAN TAMPA BOEIRO',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_028_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_028_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 29, '029/2023', 'OF/PMSMJ/COMPDEC/N° 029/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', 'SETDAS - Maria do Carmo',
            'SETDAS - Maria do Carmo', 'Acervo histórico COMPDEC (2023): SETDAS - Maria do Carmo',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_029_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_029_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 30, '030/2023', 'OF/PMSMJ/COMPDEC/N° 030/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', 'SETDAS - Hilário Brau',
            'SETDAS - Hilário Brau', 'Acervo histórico COMPDEC (2023): SETDAS - Hilário Brau',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_030_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_030_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 31, '031/2023', 'OF/PMSMJ/COMPDEC/N° 031/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', 'SEDES',
            'SEDES', 'Acervo histórico COMPDEC (2023): SEDES',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_031_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_031_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 32, '032/2023', 'OF/PMSMJ/COMPDEC/N° 032/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', 'Câmara de Vereadores',
            'Câmara de Vereadores', 'Acervo histórico COMPDEC (2023): Câmara de Vereadores',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_032_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_032_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 33, '033/2023', 'OF/PMSMJ/COMPDEC/N° 033/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', 'SEDES',
            'SEDES', 'Acervo histórico COMPDEC (2023): SEDES',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_033_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_033_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 34, '034/2023', 'OF/PMSMJ/COMPDEC/N° 034/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', '2023- Transferência Veículo',
            '2023- Transferência Veículo', 'Acervo histórico COMPDEC (2023): 2023- Transferência Veículo',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_034_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_034_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 35, '035/2023', 'OF/PMSMJ/COMPDEC/N° 035/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', '2023-RH',
            '2023-RH', 'Acervo histórico COMPDEC (2023): 2023-RH',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_035_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_035_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 36, '036/2023', 'OF/PMSMJ/COMPDEC/N° 036/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', '2023- Adesão a ATA',
            '2023- Adesão a ATA', 'Acervo histórico COMPDEC (2023): 2023- Adesão a ATA',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_036_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_036_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 37, '037/2023', 'OF/PMSMJ/COMPDEC/N° 037/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', '2023- GRAE',
            '2023- GRAE', 'Acervo histórico COMPDEC (2023): 2023- GRAE',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_037_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_037_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 38, '038/2023', 'OF/PMSMJ/COMPDEC/N° 038/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', '2023- Cessão de Servidores',
            '2023- Cessão de Servidores', 'Acervo histórico COMPDEC (2023): 2023- Cessão de Servidores',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_038_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_038_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 39, '039/2023', 'OF/PMSMJ/COMPDEC/N° 039/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', '2023- Corte de Árvores',
            '2023- Corte de Árvores', 'Acervo histórico COMPDEC (2023): 2023- Corte de Árvores',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_039_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_039_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 40, '040/2023', 'OF/PMSMJ/COMPDEC/N° 040/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', '2023- Redutor de Velocidade',
            '2023- Redutor de Velocidade', 'Acervo histórico COMPDEC (2023): 2023- Redutor de Velocidade',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_040_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_040_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 41, '041/2023', 'OF/PMSMJ/COMPDEC/N° 041/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', '2023- Securb - Cópia',
            '2023- Securb - Cópia', 'Acervo histórico COMPDEC (2023): 2023- Securb - Cópia',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_041_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_041_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 42, '042/2023', 'OF/PMSMJ/COMPDEC/N° 042/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', '2023- 24 de Junho - Paralisação de Obra',
            '2023- 24 de Junho - Paralisação de Obra', 'Acervo histórico COMPDEC (2023): 2023- 24 de Junho - Paralisação de Obra',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_042_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_042_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 43, '043/2023', 'OF/PMSMJ/COMPDEC/N° 043/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', '2023-MIDR',
            '2023-MIDR', 'Acervo histórico COMPDEC (2023): 2023-MIDR',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_043_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_043_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 44, '044/2023', 'OF/PMSMJ/COMPDEC/N° 044/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', '2023 - Secadm- Ponto Eletronico',
            '2023 - Secadm- Ponto Eletronico', 'Acervo histórico COMPDEC (2023): 2023 - Secadm- Ponto Eletronico',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_044_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_044_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 45, '045/2023', 'OF/PMSMJ/COMPDEC/N° 045/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', '2023 - Secobr -Muro 24 de junho - Cópia',
            '2023 - Secobr -Muro 24 de junho - Cópia', 'Acervo histórico COMPDEC (2023): 2023 - Secobr -Muro 24 de junho - Cópia',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_045_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_045_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 46, '046/2023', 'OF/PMSMJ/COMPDEC/N° 046/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', '2023 - Secedu - Ações preventivas',
            '2023 - Secedu - Ações preventivas', 'Acervo histórico COMPDEC (2023): 2023 - Secedu - Ações preventivas',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_046_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_046_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 47, '047/2023', 'OF/PMSMJ/COMPDEC/N° 047/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', '2023 - Secobr',
            '2023 - Secobr', 'Acervo histórico COMPDEC (2023): 2023 - Secobr',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_047_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_047_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 48, '048/2023', 'OF/PMSMJ/COMPDEC/N° 048/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', '2023 - Vereador Rogério',
            '2023 - Vereador Rogério', 'Acervo histórico COMPDEC (2023): 2023 - Vereador Rogério',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_048_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_048_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 49, '049/2023', 'OF/PMSMJ/COMPDEC/N° 049/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', '2023 - Vereador Ana Paula',
            '2023 - Vereador Ana Paula', 'Acervo histórico COMPDEC (2023): 2023 - Vereador Ana Paula',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_049_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_049_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 50, '050/2023', 'OF/PMSMJ/COMPDEC/N° 050/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', '2023- Securb',
            '2023- Securb', 'Acervo histórico COMPDEC (2023): 2023- Securb',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_050_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_050_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 51, '051/2023', 'OF/PMSMJ/COMPDEC/N° 051/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', 'IDAP',
            'IDAP', 'Acervo histórico COMPDEC (2023): IDAP',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_051_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_051_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 52, '052/2023', 'OF/PMSMJ/COMPDEC/N° 052/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', '2023 - Reunião deolinda limpeza de rio',
            '2023 - Reunião deolinda limpeza de rio', 'Acervo histórico COMPDEC (2023): 2023 - Reunião deolinda limpeza de rio',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_052_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_052_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 53, '053/2023', 'OF/PMSMJ/COMPDEC/N° 053/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', '2023 - Minuta resposta à Cepdec- veículo Toro',
            '2023 - Minuta resposta à Cepdec- veículo Toro', 'Acervo histórico COMPDEC (2023): 2023 - Minuta resposta à Cepdec- veículo Toro',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_053_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_053_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 54, '054/2023', 'OF/PMSMJ/COMPDEC/N° 054/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', 'Receita Federal',
            'Receita Federal', 'Acervo histórico COMPDEC (2023): Receita Federal',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_054_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_054_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2023, 55, '055/2023', 'OF/PMSMJ/COMPDEC/N° 055/2023',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2023-01-15', '2023 - Secmam',
            '2023 - Secmam', 'Acervo histórico COMPDEC (2023): 2023 - Secmam',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_055_2023.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2023/OF_055_2023.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2024, 1, '001/2024', 'OF/PMSMJ/COMPDEC/N° 001/2024',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2024-01-15', 'Secobr - Asfalto Rio das Pedras',
            'Secobr - Asfalto Rio das Pedras', 'Acervo histórico COMPDEC (2024): Secobr - Asfalto Rio das Pedras',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_001_2024.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_001_2024.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2024, 2, '002/2024', 'OF/PMSMJ/COMPDEC/N° 002/2024',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2024-01-15', 'Sedes - Impressora colorida',
            'Sedes - Impressora colorida', 'Acervo histórico COMPDEC (2024): Sedes - Impressora colorida',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_002_2024.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_002_2024.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2024, 3, '003/2024', 'OF/PMSMJ/COMPDEC/N° 003/2024',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2024-01-15', 'Sedes -Combate à Dengue',
            'Sedes -Combate à Dengue', 'Acervo histórico COMPDEC (2024): Sedes -Combate à Dengue',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_003_2024.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_003_2024.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2024, 4, '004/2024', 'OF/PMSMJ/COMPDEC/N° 004/2024',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2024-01-15', 'Sedes -Auxílio Uniforme',
            'Sedes -Auxílio Uniforme', 'Acervo histórico COMPDEC (2024): Sedes -Auxílio Uniforme',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_004_2024.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_004_2024.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2024, 5, '005/2024', 'OF/PMSMJ/COMPDEC/N° 005/2024',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2024-01-15', 'Securb - Cx Descarga',
            'Securb - Cx Descarga', 'Acervo histórico COMPDEC (2024): Securb - Cx Descarga',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_005_2024.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_005_2024.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2024, 6, '006/2024', 'OF/PMSMJ/COMPDEC/N° 006/2024',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2024-01-15', 'Sedes -Caixas Secas',
            'Sedes -Caixas Secas', 'Acervo histórico COMPDEC (2024): Sedes -Caixas Secas',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_006_2024.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_006_2024.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2024, 8, '008/2024', 'OF/PMSMJ/COMPDEC/N° 008/2024',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2024-01-15', 'Jardel Rosa',
            'Jardel Rosa', 'Acervo histórico COMPDEC (2024): Jardel Rosa',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_008_2024.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_008_2024.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2024, 9, '009/2024', 'OF/PMSMJ/COMPDEC/N° 009/2024',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2024-01-15', 'Sedes - Carro pipa',
            'Sedes - Carro pipa', 'Acervo histórico COMPDEC (2024): Sedes - Carro pipa',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_009_2024.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_009_2024.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2024, 10, '010/2024', 'OF/PMSMJ/COMPDEC/N° 010/2024',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2024-01-15', 'Sedes - Balsa Inflável',
            'Sedes - Balsa Inflável', 'Acervo histórico COMPDEC (2024): Sedes - Balsa Inflável',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_010_2024.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_010_2024.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2024, 11, '011/2024', 'OF/PMSMJ/COMPDEC/N° 011/2024',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2024-01-15', 'Cepdec - Resposta ao questionário',
            'Cepdec - Resposta ao questionário', 'Acervo histórico COMPDEC (2024): Cepdec - Resposta ao questionário',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_011_2024.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_011_2024.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2024, 12, '012/2024', 'OF/PMSMJ/COMPDEC/N° 012/2024',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2024-01-15', 'Secint - Estrada Torre',
            'Secint - Estrada Torre', 'Acervo histórico COMPDEC (2024): Secint - Estrada Torre',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_012_2024.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_012_2024.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2024, 13, '013/2024', 'OF/PMSMJ/COMPDEC/N° 013/2024',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2024-01-15', 'Secadm - Concurso Público',
            'Secadm - Concurso Público', 'Acervo histórico COMPDEC (2024): Secadm - Concurso Público',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_013_2024.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_013_2024.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2024, 14, '014/2024', 'OF/PMSMJ/COMPDEC/N° 014/2024',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2024-01-15', 'Elton Gomes',
            'Elton Gomes', 'Acervo histórico COMPDEC (2024): Elton Gomes',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_014_2024.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_014_2024.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2024, 15, '015/2024', 'OF/PMSMJ/COMPDEC/N° 015/2024',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2024-01-15', 'Secman',
            'Secman', 'Acervo histórico COMPDEC (2024): Secman',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_015_2024.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_015_2024.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2024, 16, '016/2024', 'OF/PMSMJ/COMPDEC/N° 016/2024',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2024-01-15', 'Edicy Querino Cardoso',
            'Edicy Querino Cardoso', 'Acervo histórico COMPDEC (2024): Edicy Querino Cardoso',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_016_2024.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_016_2024.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2024, 17, '017/2024', 'OF/PMSMJ/COMPDEC/N° 017/2024',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2024-01-15', 'Secobr',
            'Secobr', 'Acervo histórico COMPDEC (2024): Secobr',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_017_2024.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_017_2024.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2024, 18, '018/2024', 'OF/PMSMJ/COMPDEC/N° 018/2024',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2024-01-15', 'Prefeito',
            'Prefeito', 'Acervo histórico COMPDEC (2024): Prefeito',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_018_2024.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_018_2024.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2024, 19, '019/2024', 'OF/PMSMJ/COMPDEC/N° 019/2024',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2024-01-15', 'Cesan',
            'Cesan', 'Acervo histórico COMPDEC (2024): Cesan',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_019_2024.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_019_2024.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2024, 20, '020/2024', 'OF/PMSMJ/COMPDEC/N° 020/2024',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2024-01-15', 'Marilete Stein',
            'Marilete Stein', 'Acervo histórico COMPDEC (2024): Marilete Stein',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_020_2024.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_020_2024.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2024, 21, '021/2024', 'OF/PMSMJ/COMPDEC/N° 021/2024',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2024-01-15', 'Securb - Limpeza de Bueiros',
            'Securb - Limpeza de Bueiros', 'Acervo histórico COMPDEC (2024): Securb - Limpeza de Bueiros',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_021_2024.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_021_2024.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2024, 22, '022/2024', 'OF/PMSMJ/COMPDEC/N° 022/2024',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2024-01-15', 'Bombeiros Voluntários',
            'Bombeiros Voluntários', 'Acervo histórico COMPDEC (2024): Bombeiros Voluntários',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_022_2024.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_022_2024.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2024, 23, '023/2024', 'OF/PMSMJ/COMPDEC/N° 023/2024',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2024-01-15', 'AFI',
            'AFI', 'Acervo histórico COMPDEC (2024): AFI',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_023_2024.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_023_2024.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2024, 24, '024/2024', 'OF/PMSMJ/COMPDEC/N° 024/2024',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2024-01-15', 'Renovação do aluguel BM',
            'Renovação do aluguel BM', 'Acervo histórico COMPDEC (2024): Renovação do aluguel BM',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_024_2024.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_024_2024.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2024, 25, '025/2024', 'OF/PMSMJ/COMPDEC/N° 025/2024',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2024-01-15', 'Avaliação Estrutural',
            'Avaliação Estrutural', 'Acervo histórico COMPDEC (2024): Avaliação Estrutural',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_025_2024.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_025_2024.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2024, 26, '026/2024', 'OF/PMSMJ/COMPDEC/N° 026/2024',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2024-01-15', 'Securb - Disponibilização de Vassoura',
            'Securb - Disponibilização de Vassoura', 'Acervo histórico COMPDEC (2024): Securb - Disponibilização de Vassoura',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_026_2024.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_026_2024.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2024, 27, '027/2024', 'OF/PMSMJ/COMPDEC/N° 027/2024',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2024-01-15', 'Informações equipe de Transição',
            'Informações equipe de Transição', 'Acervo histórico COMPDEC (2024): Informações equipe de Transição',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_027_2024.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_027_2024.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2024, 28, '028/2024', 'OF/PMSMJ/COMPDEC/N° 028/2024',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2024-01-15', 'Secint -Imagens Drone',
            'Secint -Imagens Drone', 'Acervo histórico COMPDEC (2024): Secint -Imagens Drone',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_028_2024.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_028_2024.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2024, 29, '029/2024', 'OF/PMSMJ/COMPDEC/N° 029/2024',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2024-01-15', 'Sedes - Bens móveis e imóveis',
            'Sedes - Bens móveis e imóveis', 'Acervo histórico COMPDEC (2024): Sedes - Bens móveis e imóveis',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_029_2024.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_029_2024.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2024, 30, '030/2024', 'OF/PMSMJ/COMPDEC/N° 030/2024',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2024-01-15', 'RH',
            'RH', 'Acervo histórico COMPDEC (2024): RH',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_030_2024.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_030_2024.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2024, 31, '031/2024', 'OF/PMSMJ/COMPDEC/N° 031/2024',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2024-01-15', 'Secobr - Calçamento Rua Gustavo Berger',
            'Secobr - Calçamento Rua Gustavo Berger', 'Acervo histórico COMPDEC (2024): Secobr - Calçamento Rua Gustavo Berger',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_031_2024.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_031_2024.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2024, 32, '032/2024', 'OF/PMSMJ/COMPDEC/N° 032/2024',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2024-01-15', 'Sedes - Faxineira',
            'Sedes - Faxineira', 'Acervo histórico COMPDEC (2024): Sedes - Faxineira',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_032_2024.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_032_2024.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2024, 33, '033/2024', 'OF/PMSMJ/COMPDEC/N° 033/2024',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2024-01-15', 'OFICIO_CADASTRO_S2ID - Copia',
            'OFICIO_CADASTRO_S2ID - Copia', 'Acervo histórico COMPDEC (2024): OFICIO_CADASTRO_S2ID - Copia',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_033_2024.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_033_2024.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2024, 34, '034/2024', 'OF/PMSMJ/COMPDEC/N° 034/2024',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2024-01-15', 'CEPDEC',
            'CEPDEC', 'Acervo histórico COMPDEC (2024): CEPDEC',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_034_2024.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2024/OF_034_2024.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2025, 1, '001/2025', 'OF/PMSMJ/COMPDEC/N° 001/2025',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2025-01-15', 'Secint - desobstrução de vias',
            'Secint - desobstrução de vias', 'Acervo histórico COMPDEC (2025): Secint - desobstrução de vias',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_001_2025.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_001_2025.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2025, 2, '002/2025', 'OF/PMSMJ/COMPDEC/N° 002/2025',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2025-01-15', 'Secint - desobstrução de vias Rio Nove',
            'Secint - desobstrução de vias Rio Nove', 'Acervo histórico COMPDEC (2025): Secint - desobstrução de vias Rio Nove',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_002_2025.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_002_2025.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2025, 3, '003/2025', 'OF/PMSMJ/COMPDEC/N° 003/2025',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2025-01-15', 'Securb - Reparo na ponte de Rio Possmoser',
            'Securb - Reparo na ponte de Rio Possmoser', 'Acervo histórico COMPDEC (2025): Securb - Reparo na ponte de Rio Possmoser',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_003_2025.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_003_2025.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2025, 4, '004/2025', 'OF/PMSMJ/COMPDEC/N° 004/2025',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2025-01-15', 'Secint - desobstrução de vias Alto Santa Maria',
            'Secint - desobstrução de vias Alto Santa Maria', 'Acervo histórico COMPDEC (2025): Secint - desobstrução de vias Alto Santa Maria',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_004_2025.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_004_2025.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2025, 5, '005/2025', 'OF/PMSMJ/COMPDEC/N° 005/2025',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2025-01-15', 'Prefeito Municipal - Solicitação de reparo ao DER',
            'Prefeito Municipal - Solicitação de reparo ao DER', 'Acervo histórico COMPDEC (2025): Prefeito Municipal - Solicitação de reparo ao DER',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_005_2025.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_005_2025.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2025, 6, '006/2025', 'OF/PMSMJ/COMPDEC/N° 006/2025',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2025-01-15', 'Prefeito Municipal - Horas extras - Janeiro.docx',
            'Prefeito Municipal - Horas extras - Janeiro.docx', 'Acervo histórico COMPDEC (2025): Prefeito Municipal - Horas extras - Janeiro.docx',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_006_2025.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_006_2025.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2025, 7, '007/2025', 'OF/PMSMJ/COMPDEC/N° 007/2025',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2025-01-15', 'Secobr - manutenção em ponte de alto são sebastião',
            'Secobr - manutenção em ponte de alto são sebastião', 'Acervo histórico COMPDEC (2025): Secobr - manutenção em ponte de alto são sebastião',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_007_2025.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_007_2025.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2025, 8, '008/2025', 'OF/PMSMJ/COMPDEC/N° 008/2025',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2025-01-15', 'SEAG -  Solicitação de reparo a SEAG',
            'SEAG -  Solicitação de reparo a SEAG', 'Acervo histórico COMPDEC (2025): SEAG -  Solicitação de reparo a SEAG',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_008_2025.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_008_2025.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2025, 9, '009/2025', 'OF/PMSMJ/COMPDEC/N° 009/2025',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2025-01-15', 'Vereador Sigmar Shwanz -  Solicitação de Veículo Pipa',
            'Vereador Sigmar Shwanz -  Solicitação de Veículo Pipa', 'Acervo histórico COMPDEC (2025): Vereador Sigmar Shwanz -  Solicitação de Veículo Pipa',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_009_2025.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_009_2025.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2025, 10, '010/2025', 'OF/PMSMJ/COMPDEC/N° 010/2025',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2025-01-15', 'DER - Asfalto Barragem',
            'DER - Asfalto Barragem', 'Acervo histórico COMPDEC (2025): DER - Asfalto Barragem',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_010_2025.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_010_2025.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2025, 11, '011/2025', 'OF/PMSMJ/COMPDEC/N° 011/2025',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2025-01-15', 'Sedes Nobreak',
            'Sedes Nobreak', 'Acervo histórico COMPDEC (2025): Sedes Nobreak',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_011_2025.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_011_2025.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2025, 12, '012/2025', 'OF/PMSMJ/COMPDEC/N° 012/2025',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2025-01-15', 'Secobr - Avaliação de Risco em Ponte',
            'Secobr - Avaliação de Risco em Ponte', 'Acervo histórico COMPDEC (2025): Secobr - Avaliação de Risco em Ponte',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_012_2025.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_012_2025.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2025, 13, '013/2025', 'OF/PMSMJ/COMPDEC/N° 013/2025',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2025-01-15', 'DER - Asfalto Barragem',
            'DER - Asfalto Barragem', 'Acervo histórico COMPDEC (2025): DER - Asfalto Barragem',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_013_2025.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_013_2025.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2025, 14, '014/2025', 'OF/PMSMJ/COMPDEC/N° 014/2025',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2025-01-15', 'Seriços Urbanos - Solicitação de materiais para reparo na defesa Civil',
            'Seriços Urbanos - Solicitação de materiais para reparo na defesa Civil', 'Acervo histórico COMPDEC (2025): Seriços Urbanos - Solicitação de materiais para reparo na defesa Civil',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_014_2025.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_014_2025.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2025, 15, '015/2025', 'OF/PMSMJ/COMPDEC/N° 015/2025',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2025-01-15', 'SEDES - Justificativa Adicional de Sobreaviso',
            'SEDES - Justificativa Adicional de Sobreaviso', 'Acervo histórico COMPDEC (2025): SEDES - Justificativa Adicional de Sobreaviso',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_015_2025.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_015_2025.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2025, 16, '016/2025', 'OF/PMSMJ/COMPDEC/N° 016/2025',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2025-01-15', 'SECEDU - Solicitação de materiais para reparo na defesa Civil',
            'SECEDU - Solicitação de materiais para reparo na defesa Civil', 'Acervo histórico COMPDEC (2025): SECEDU - Solicitação de materiais para reparo na defesa Civil',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_016_2025.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_016_2025.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2025, 17, '017/2025', 'OF/PMSMJ/COMPDEC/N° 017/2025',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2025-01-15', 'SECURB - Solicitação de contentor de lixo',
            'SECURB - Solicitação de contentor de lixo', 'Acervo histórico COMPDEC (2025): SECURB - Solicitação de contentor de lixo',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_017_2025.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_017_2025.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2025, 18, '018/2025', 'OF/PMSMJ/COMPDEC/N° 018/2025',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2025-01-15', 'Estacoes meteorologicas - assinado',
            'Estacoes meteorologicas - assinado', 'Acervo histórico COMPDEC (2025): Estacoes meteorologicas - assinado',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_018_2025.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_018_2025.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2025, 19, '019/2025', 'OF/PMSMJ/COMPDEC/N° 019/2025',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2025-01-15', 'Tiago Wutke - pedido de demolição',
            'Tiago Wutke - pedido de demolição', 'Acervo histórico COMPDEC (2025): Tiago Wutke - pedido de demolição',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_019_2025.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_019_2025.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2025, 20, '020/2025', 'OF/PMSMJ/COMPDEC/N° 020/2025',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2025-01-15', 'SECSAU - Solicitação de Dados para o Fundo Cidades',
            'SECSAU - Solicitação de Dados para o Fundo Cidades', 'Acervo histórico COMPDEC (2025): SECSAU - Solicitação de Dados para o Fundo Cidades',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_020_2025.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_020_2025.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2025, 21, '021/2025', 'OF/PMSMJ/COMPDEC/N° 021/2025',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2025-01-15', 'CEPDEC - Relatório de atividades desempenhadas pela Compdec',
            'CEPDEC - Relatório de atividades desempenhadas pela Compdec', 'Acervo histórico COMPDEC (2025): CEPDEC - Relatório de atividades desempenhadas pela Compdec',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_021_2025.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_021_2025.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2025, 22, '022/2025', 'OF/PMSMJ/COMPDEC/N° 022/2025',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2025-01-15', 'Secint - Enrocamento Vila dos Italianos',
            'Secint - Enrocamento Vila dos Italianos', 'Acervo histórico COMPDEC (2025): Secint - Enrocamento Vila dos Italianos',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_022_2025.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_022_2025.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2025, 23, '023/2025', 'OF/PMSMJ/COMPDEC/N° 023/2025',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2025-01-15', 'MInuta de lei sobreaviso da defesa civil',
            'MInuta de lei sobreaviso da defesa civil', 'Acervo histórico COMPDEC (2025): MInuta de lei sobreaviso da defesa civil',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_023_2025.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_023_2025.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2025, 24, '024/2025', 'OF/PMSMJ/COMPDEC/N° 024/2025',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2025-01-15', 'EDP',
            'EDP', 'Acervo histórico COMPDEC (2025): EDP',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_024_2025.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_024_2025.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2025, 25, '025/2025', 'OF/PMSMJ/COMPDEC/N° 025/2025',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2025-01-15', '2025 SECADM - Solicitação de Materiais de informática',
            '2025 SECADM - Solicitação de Materiais de informática', 'Acervo histórico COMPDEC (2025): 2025 SECADM - Solicitação de Materiais de informática',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_025_2025.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_025_2025.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2025, 26, '026/2025', 'OF/PMSMJ/COMPDEC/N° 026/2025',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2025-01-15', '2025 - MPES',
            '2025 - MPES', 'Acervo histórico COMPDEC (2025): 2025 - MPES',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_026_2025.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_026_2025.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2025, 27, '027/2025', 'OF/PMSMJ/COMPDEC/N° 027/2025',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2025-01-15', 'Prefeito Municipal',
            'Prefeito Municipal', 'Acervo histórico COMPDEC (2025): Prefeito Municipal',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_027_2025.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_027_2025.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2025, 28, '028/2025', 'OF/PMSMJ/COMPDEC/N° 028/2025',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2025-01-15', '2025 - DPES - Plano de Contingência',
            '2025 - DPES - Plano de Contingência', 'Acervo histórico COMPDEC (2025): 2025 - DPES - Plano de Contingência',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_028_2025.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_028_2025.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2025, 29, '029/2025', 'OF/PMSMJ/COMPDEC/N° 029/2025',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2025-01-15', '2025 - SEDES - Medidas preventivas para periodos de chuva',
            '2025 - SEDES - Medidas preventivas para periodos de chuva', 'Acervo histórico COMPDEC (2025): 2025 - SEDES - Medidas preventivas para periodos de chuva',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_029_2025.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_029_2025.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2025, 30, '030/2025', 'OF/PMSMJ/COMPDEC/N° 030/2025',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2025-01-15', 'Secint - retirada de barreira Simone Schiefelbain',
            'Secint - retirada de barreira Simone Schiefelbain', 'Acervo histórico COMPDEC (2025): Secint - retirada de barreira Simone Schiefelbain',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_030_2025.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_030_2025.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2025, 31, '031/2025', 'OF/PMSMJ/COMPDEC/N° 031/2025',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2025-01-15', 'SECADM - Solicitação de férias - Marcelo Dias',
            'SECADM - Solicitação de férias - Marcelo Dias', 'Acervo histórico COMPDEC (2025): SECADM - Solicitação de férias - Marcelo Dias',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_031_2025.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_031_2025.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2025, 32, '032/2025', 'OF/PMSMJ/COMPDEC/N° 032/2025',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2025-01-15', 'Prefeito Municipal - Comissão Fomento',
            'Prefeito Municipal - Comissão Fomento', 'Acervo histórico COMPDEC (2025): Prefeito Municipal - Comissão Fomento',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_032_2025.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_032_2025.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2025, 33, '033/2025', 'OF/PMSMJ/COMPDEC/N° 033/2025',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2025-01-15', 'SEDES - Minuta projeto de lei',
            'SEDES - Minuta projeto de lei', 'Acervo histórico COMPDEC (2025): SEDES - Minuta projeto de lei',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_033_2025.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_033_2025.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2025, 34, '034/2025', 'OF/PMSMJ/COMPDEC/N° 034/2025',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2025-01-15', 'SEDES - Comissão municipal de gestão de risco e desastres',
            'SEDES - Comissão municipal de gestão de risco e desastres', 'Acervo histórico COMPDEC (2025): SEDES - Comissão municipal de gestão de risco e desastres',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_034_2025.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_034_2025.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2025, 35, '035/2025', 'OF/PMSMJ/COMPDEC/N° 035/2025',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2025-01-15', 'SEDES - Atualização do Plano de Contigência',
            'SEDES - Atualização do Plano de Contigência', 'Acervo histórico COMPDEC (2025): SEDES - Atualização do Plano de Contigência',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_035_2025.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2025/OF_035_2025.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2026, 1, '001/2026', 'OF/PMSMJ/COMPDEC/N° 001/2026',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2026-01-15', 'SEDES - Minuta projeto de lei',
            'SEDES - Minuta projeto de lei', 'Acervo histórico COMPDEC (2026): SEDES - Minuta projeto de lei',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2026/OF_001_2026.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2026/OF_001_2026.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2026, 2, '002/2026', 'OF/PMSMJ/COMPDEC/N° 002/2026',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2026-01-15', 'SEDES - Comissão municipal de gestão de risco e desastres',
            'SEDES - Comissão municipal de gestão de risco e desastres', 'Acervo histórico COMPDEC (2026): SEDES - Comissão municipal de gestão de risco e desastres',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2026/OF_002_2026.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2026/OF_002_2026.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2026, 3, '003/2026', 'OF/PMSMJ/COMPDEC/N° 003/2026',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2026-01-15', 'COMPDEC - Igreja católica de São Luiz',
            'COMPDEC - Igreja católica de São Luiz', 'Acervo histórico COMPDEC (2026): COMPDEC - Igreja católica de São Luiz',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2026/OF_003_2026.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2026/OF_003_2026.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2026, 4, '004/2026', 'OF/PMSMJ/COMPDEC/N° 004/2026',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2026-01-15', 'COMPDEC -Cesan - rodovia ES-368',
            'COMPDEC -Cesan - rodovia ES-368', 'Acervo histórico COMPDEC (2026): COMPDEC -Cesan - rodovia ES-368',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2026/OF_004_2026.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2026/OF_004_2026.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2026, 5, '005/2026', 'OF/PMSMJ/COMPDEC/N° 005/2026',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2026-01-15', 'COMPDEC -Cesan - rodovia ES-264',
            'COMPDEC -Cesan - rodovia ES-264', 'Acervo histórico COMPDEC (2026): COMPDEC -Cesan - rodovia ES-264',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2026/OF_005_2026.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2026/OF_005_2026.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2026, 6, '006/2026', 'OF/PMSMJ/COMPDEC/N° 006/2026',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2026-01-15', 'Prefeito Municipal - Horas extras - Fevereiro - Março.docx',
            'Prefeito Municipal - Horas extras - Fevereiro - Março.docx', 'Acervo histórico COMPDEC (2026): Prefeito Municipal - Horas extras - Fevereiro - Março.docx',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2026/OF_006_2026.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2026/OF_006_2026.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2026, 7, '007/2026', 'OF/PMSMJ/COMPDEC/N° 007/2026',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2026-01-15', 'Prefeito Municipal - Minuta projeto de decreto - PLACON',
            'Prefeito Municipal - Minuta projeto de decreto - PLACON', 'Acervo histórico COMPDEC (2026): Prefeito Municipal - Minuta projeto de decreto - PLACON',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2026/OF_007_2026.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2026/OF_007_2026.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2026, 8, '008/2026', 'OF/PMSMJ/COMPDEC/N° 008/2026',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2026-01-15', 'COMPDEC - Construtora Verca',
            'COMPDEC - Construtora Verca', 'Acervo histórico COMPDEC (2026): COMPDEC - Construtora Verca',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2026/OF_008_2026.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2026/OF_008_2026.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2026, 9, '009/2026', 'OF/PMSMJ/COMPDEC/N° 009/2026',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2026-01-15', 'COMPDEC - ALERTA PREVENTIVO',
            'COMPDEC - ALERTA PREVENTIVO', 'Acervo histórico COMPDEC (2026): COMPDEC - ALERTA PREVENTIVO',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2026/OF_009_2026.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2026/OF_009_2026.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2026, 10, '010/2026', 'OF/PMSMJ/COMPDEC/N° 010/2026',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2026-01-15', 'COMPDEC - Comissão Municipal de Gestão de Riscos e Desastres',
            'COMPDEC - Comissão Municipal de Gestão de Riscos e Desastres', 'Acervo histórico COMPDEC (2026): COMPDEC - Comissão Municipal de Gestão de Riscos e Desastres',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2026/OF_010_2026.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2026/OF_010_2026.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2026, 11, '011/2026', 'OF/PMSMJ/COMPDEC/N° 011/2026',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2026-01-15', 'COMPDEC - Solicitação de Retificacao',
            'COMPDEC - Solicitação de Retificacao', 'Acervo histórico COMPDEC (2026): COMPDEC - Solicitação de Retificacao',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2026/OF_011_2026.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2026/OF_011_2026.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2026, 12, '012/2026', 'OF/PMSMJ/COMPDEC/N° 012/2026',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2026-01-15', 'COMPDEC - Incaper',
            'COMPDEC - Incaper', 'Acervo histórico COMPDEC (2026): COMPDEC - Incaper',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2026/OF_012_2026.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2026/OF_012_2026.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2026, 13, '013/2026', 'OF/PMSMJ/COMPDEC/N° 013/2026',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2026-01-15', 'COMPDEC - Construtora Verca',
            'COMPDEC - Construtora Verca', 'Acervo histórico COMPDEC (2026): COMPDEC - Construtora Verca',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2026/OF_013_2026.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2026/OF_013_2026.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2026, 14, '014/2026', 'OF/PMSMJ/COMPDEC/N° 014/2026',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2026-01-15', 'COMPDEC - Prefeito Municipal - Rede Clima Municipal',
            'COMPDEC - Prefeito Municipal - Rede Clima Municipal', 'Acervo histórico COMPDEC (2026): COMPDEC - Prefeito Municipal - Rede Clima Municipal',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2026/OF_014_2026.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2026/OF_014_2026.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2026, 15, '015/2026', 'OF/PMSMJ/COMPDEC/N° 015/2026',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2026-01-15', 'COMPDEC - Santa Leopoldina - Ponte Rio Bonito',
            'COMPDEC - Santa Leopoldina - Ponte Rio Bonito', 'Acervo histórico COMPDEC (2026): COMPDEC - Santa Leopoldina - Ponte Rio Bonito',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2026/OF_015_2026.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2026/OF_015_2026.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2026, 16, '016/2026', 'OF/PMSMJ/COMPDEC/N° 016/2026',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2026-01-15', 'COMPDEC - Cenários de El Niño no Espírito Santo e riscos associados',
            'COMPDEC - Cenários de El Niño no Espírito Santo e riscos associados', 'Acervo histórico COMPDEC (2026): COMPDEC - Cenários de El Niño no Espírito Santo e riscos associados',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2026/OF_016_2026.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2026/OF_016_2026.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'PMSMJ/COMPDEC', 2026, 17, '017/2026', 'OF/PMSMJ/COMPDEC/N° 017/2026',
            'LEGADO_ARQUIVO_FISICO', 'EMITIDO', '2026-01-15', 'COMPDEC - Prefeito Municipal - Regulamentação Regime de Plantão Extra e de Sobreaviso',
            'COMPDEC - Prefeito Municipal - Regulamentação Regime de Plantão Extra e de Sobreaviso', 'Acervo histórico COMPDEC (2026): COMPDEC - Prefeito Municipal - Regulamentação Regime de Plantão Extra e de Sobreaviso',
            'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2026/OF_017_2026.pdf', 'https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2026/OF_017_2026.pdf', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;