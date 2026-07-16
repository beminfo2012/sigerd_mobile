-- Popula a base do NORTIS com as principais legislações e normas de Defesa Civil e Obras
CREATE EXTENSION IF NOT EXISTS unaccent;

DO $$ 
DECLARE
  v_tenant_id UUID := '00000000-0000-0000-0000-000000000000';
  v_system_user_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN

    SELECT id INTO v_system_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
    IF v_system_user_id IS NULL THEN
        v_system_user_id := '00000000-0000-0000-0000-000000000000';
    END IF;

    -- LEI FEDERAL 12.608/2012 (SINPDEC)
    INSERT INTO nortis_normas (tenant_id, tipo, numero, ano, ambito, orgao_emissor, ementa, texto_integral, situacao, url_fonte_oficial, criado_por)
    VALUES (
        v_tenant_id, 'lei', '12.608', 2012, 'federal', 'Presidência da República',
        'Institui a Política Nacional de Proteção e Defesa Civil - PNPDEC; dispõe sobre o Sistema Nacional de Proteção e Defesa Civil - SINPDEC e o Conselho Nacional de Proteção e Defesa Civil - CONPDEC.',
        'A PRESIDENTA DA REPÚBLICA Faço saber que o Congresso Nacional decreta e eu sanciono a seguinte Lei:
Art. 1º Fica instituída a Política Nacional de Proteção e Defesa Civil - PNPDEC.
Art. 2º É dever da União, dos Estados, do Distrito Federal e dos Municípios adotar as medidas necessárias à redução dos riscos de desastre.
Art. 3º A PNPDEC abrange as ações de prevenção, mitigação, preparação, resposta e recuperação voltadas à proteção e defesa civil.
Art. 4º São diretrizes da PNPDEC: I - atuação articulada entre a União, os Estados, o Distrito Federal e os Municípios para redução de desastres e apoio às comunidades atingidas; II - abordagem sistêmica das ações de prevenção, mitigação, preparação, resposta e recuperação; III - prioridade às ações preventivas relacionadas à minimização de desastres.',
        'vigente', 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12608.htm', v_system_user_id
    ) ON CONFLICT DO NOTHING;

    -- LEI FEDERAL 6.766/1979 (Parcelamento do Solo Urbano)
    INSERT INTO nortis_normas (tenant_id, tipo, numero, ano, ambito, orgao_emissor, ementa, texto_integral, situacao, url_fonte_oficial, criado_por)
    VALUES (
        v_tenant_id, 'lei', '6.766', 1979, 'federal', 'Presidência da República',
        'Dispõe sobre o Parcelamento do Solo Urbano e dá outras Providências.',
        'O PRESIDENTE DA REPÚBLICA, faço saber que o Congresso Nacional decreta e eu sanciono a seguinte Lei:
Art. 1º O parcelamento do solo para fins urbanos será regido por esta Lei.
Art. 2º O parcelamento do solo urbano poderá ser feito mediante loteamento ou desmembramento, observadas as disposições desta Lei e as das legislações estaduais e municipais pertinentes.
Art. 3º Somente será admitido o parcelamento do solo para fins urbanos em zonas urbanas, de expansão urbana ou de urbanização específica, assim definidas pelo plano diretor ou aprovadas por lei municipal.
Parágrafo único - Não será permitido o parcelamento do solo: I - em terrenos alagadiços e sujeitos a inundações, antes de tomadas as providências para assegurar o escoamento das águas; II - em terrenos que tenham sido aterrados com material nocivo à saúde pública, sem que sejam previamente saneados; III - em terrenos com declividade igual ou superior a 30% (trinta por cento), salvo se atendidas exigências específicas das autoridades competentes; IV - em terrenos onde as condições geológicas não aconselham a edificação.',
        'vigente', 'https://www.planalto.gov.br/ccivil_03/leis/l6766.htm', v_system_user_id
    ) ON CONFLICT DO NOTHING;

    -- LEI 14.133/2021 (Nova Lei de Licitações)
    INSERT INTO nortis_normas (tenant_id, tipo, numero, ano, ambito, orgao_emissor, ementa, texto_integral, situacao, url_fonte_oficial, criado_por)
    VALUES (
        v_tenant_id, 'lei', '14.133', 2021, 'federal', 'Presidência da República',
        'Lei de Licitações e Contratos Administrativos.',
        'Art. 75. É dispensável a licitação:
VIII - nos casos de emergência ou de calamidade pública, quando caracterizada urgência de atendimento de situação que possa ocasionar prejuízo ou comprometer a continuidade dos serviços públicos ou a segurança de pessoas, obras, serviços, equipamentos e outros bens, públicos ou particulares, e somente para aquisição dos bens necessários ao atendimento da situação emergencial ou calamitosa e para as parcelas de obras e serviços que possam ser concluídas no prazo máximo de 1 (um) ano, contado da data de ocorrência da emergência ou da calamidade, vedadas a prorrogação dos respectivos contratos e a recontratação de empresa já contratada com base no disposto neste inciso.',
        'vigente', 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm', v_system_user_id
    ) ON CONFLICT DO NOTHING;

    -- PORTARIA MDR 3.033/2020 (COBRADE)
    INSERT INTO nortis_normas (tenant_id, tipo, numero, ano, ambito, orgao_emissor, ementa, texto_integral, situacao, url_fonte_oficial, criado_por)
    VALUES (
        v_tenant_id, 'portaria', '3.033', 2020, 'federal', 'Ministério do Desenvolvimento Regional',
        'Aprova a Classificação e Codificação Brasileira de Desastres - COBRADE e estabelece diretrizes para o preenchimento do FIDE.',
        'O MINISTRO DE ESTADO DO DESENVOLVIMENTO REGIONAL, no uso das atribuições que lhe conferem o art. 87, parágrafo único, inciso II, da Constituição Federal.
Art. 1º Aprovar a Classificação e Codificação Brasileira de Desastres (Cobrade) e estabelecer diretrizes e formulário para a decretação e o reconhecimento federal de situação de emergência e estado de calamidade pública.
A Cobrade divide os desastres em: Naturais (N) e Tecnológicos (T).
Desastres Naturais são classificados em: 1. Geológicos (Deslizamentos, Corridas de Massa); 2. Hidrológicos (Alagamentos, Enchentes, Inundações); 3. Meteorológicos (Vendavais, Ciclones); 4. Climatológicos (Seca, Estiagem); 5. Biológicos (Epidemias).',
        'vigente', 'https://www.in.gov.br/en/web/dou/-/portaria-n-3.033-de-18-de-dezembro-de-2020-295133649', v_system_user_id
    ) ON CONFLICT DO NOTHING;

    -- PORTARIA MDR 260/2022 (Decretação SE/ECP)
    INSERT INTO nortis_normas (tenant_id, tipo, numero, ano, ambito, orgao_emissor, ementa, texto_integral, situacao, url_fonte_oficial, criado_por)
    VALUES (
        v_tenant_id, 'portaria', '260', 2022, 'federal', 'Ministério do Desenvolvimento Regional',
        'Estabelece procedimentos para o reconhecimento federal de Situação de Emergência ou de Estado de Calamidade Pública decretado por entes federados.',
        'Art. 1º Esta Portaria estabelece critérios e procedimentos para o reconhecimento federal de Situação de Emergência (SE) ou de Estado de Calamidade Pública (ECP) pelos Municípios, Estados e pelo Distrito Federal.
Art. 2º O reconhecimento da situação de emergência ou do estado de calamidade pública pelo Poder Executivo federal dar-se-á mediante requerimento do ente federativo afetado pelo desastre.',
        'vigente', 'https://www.in.gov.br/en/web/dou/-/portaria-n-260-de-2-de-fevereiro-de-2022-377759535', v_system_user_id
    ) ON CONFLICT DO NOTHING;

    -- NBR 15575 (Desempenho de Edificações Habitacionais)
    INSERT INTO nortis_normas (tenant_id, tipo, numero, ano, ambito, orgao_emissor, ementa, texto_integral, situacao, criado_por)
    VALUES (
        v_tenant_id, 'nbr', '15575', 2013, 'federal', 'ABNT',
        'Edificações habitacionais — Desempenho. Referência técnica primária para análise de vícios construtivos em vistorias.',
        'Esta Norma estabelece os requisitos e critérios de desempenho aplicáveis às edificações habitacionais, como um todo integrado, bem como a serem avaliados de forma isolada para um ou mais sistemas específicos.',
        'vigente', v_system_user_id
    ) ON CONFLICT DO NOTHING;

    -- SÚMULA TCU SOBRE CONTRATAÇÃO EMERGENCIAL
    INSERT INTO nortis_normas (tenant_id, tipo, numero, ano, ambito, orgao_emissor, ementa, texto_integral, situacao, criado_por)
    VALUES (
        v_tenant_id, 'sumula', '302', 2020, 'federal', 'Tribunal de Contas da União (TCU)',
        'Súmula referente à dispensa de licitação para contratação de emergência, exigindo justificativa clara do risco à segurança das pessoas ou bens.',
        'SÚMULA TCU 302: Nos casos de contratação por dispensa de licitação com fundamento na urgência, é indispensável a comprovação de que a situação emergencial não decorreu de falta de planejamento, desídia ou má gestão.',
        'vigente', v_system_user_id
    ) ON CONFLICT DO NOTHING;

END $$;
