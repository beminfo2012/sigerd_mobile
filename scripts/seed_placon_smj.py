# seed_placon_smj.py
# Executar: python seed_placon_smj.py
# Requer: psycopg2, UUID do tenant de Santa Maria de Jetibá

import psycopg2, uuid, os

TENANT_ID = os.environ.get("TENANT_SMJ_ID", "00000000-0000-0000-0000-000000000001")  # UUID do tenant SMJ
DSN = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/sigerd")

conn = psycopg2.connect(DSN)
cur = conn.cursor()

# Ativa RLS para o tenant correto (se suportado pelo Postgres)
try:
    cur.execute(f"SET app.tenant_id = '{TENANT_ID}'")
except Exception as e:
    conn.rollback()
    print("Aviso: Variável app.tenant_id não configurada no Postgres, prosseguindo...")

# -----------------------------------------------------------------------
# ÓRGÃOS
# -----------------------------------------------------------------------
orgaos = [
    ("compdec",    "COMPDEC",          "Coordenadoria Municipal de Proteção e Defesa Civil",    "#b91c1c", "ShieldAlert", 1,
     "Responsável pela coordenação geral das atividades e articulação do sistema municipal de Proteção e Defesa Civil. Em conjunto com a Secretaria de Gabinete e Secretaria Jurídica, fica responsável pela confecção dos Decretos de Situação de Emergência ou Estado de Calamidade Pública, acionando a CEPDEC quando necessário."),

    ("secobr",     "SECOBR",           "Secretaria de Obras e Infraestrutura",                   "#1e40af", "Wrench",      2,
     "Responsável por manter esquema de plantão 24 horas durante o período de anormalidade, organizando equipe de servidores para auxiliar na execução de medidas estruturais de reabilitação do cenário afetado."),

    ("saude",      "Saúde",            "Secretaria Municipal de Saúde",                          "#0f766e", "HeartPulse",  3,
     "Responsável pela assistência pré-hospitalar e ações básicas de saúde pública nos abrigos, controle de endemias, vacinação quando necessário e prontidão do Pronto Atendimento Municipal, com leitos para emergências e equipe mínima disponível."),

    ("setdas",     "Assistência Social","Secretaria de Trabalho, Desenvolvimento e Ação Social", "#7c3aed", "Users",       4,
     "Por meio da Gerência de Proteção Social Especial, realiza a triagem socioeconômica e o cadastramento das famílias afetadas, a gerência dos abrigos temporários e a coordenação das campanhas de arrecadação e distribuição de alimentos e roupas."),

    ("educacao",   "Educação",         "Secretaria Municipal de Educação",                       "#b45309", "School",      5,
     "Responsável por dispor a estrutura da rede de ensino para que, emergencialmente, sirvam de abrigos temporários, disponibilizando servidores, veículos e outros materiais necessários ao atendimento da população atingida."),

    ("securb",     "SECURB",           "Secretaria Municipal de Serviços Urbanos",               "#0e7490", "Truck",       6,
     "Responsável pelo gerenciamento e execução da limpeza dos espaços públicos, organização do meio urbano e limpeza das margens dos canais fluviais do município."),

    ("secint",     "Interior",         "Secretaria de Interior",                                 "#4d7c0f", "MapPin",      7,
     "Responsável pela manutenção da trafegabilidade das estradas rurais, de modo a permitir o trânsito de pessoas e ações de apoio aos afetados pelo desastre na zona rural do município."),

    ("seagro",     "Agropecuária",     "Secretaria de Agropecuária",                             "#a16207", "Sprout",      8,
     "Responsável por acompanhar a atividade de agricultura do município atingido pelo desastre e avaliar possíveis danos e prejuízos no desenvolvimento do setor agrícola e agrário."),

    ("semam",      "Meio Ambiente",    "Secretaria de Meio Ambiente",                            "#15803d", "Leaf",        9,
     "Responsável por atuar em locais de interesse à conservação ambiental que sofreram danos ou estão em risco de sofrer. Vistoria vazamentos e acidentes com materiais que possam causar danos às pessoas e ao meio ambiente."),

    ("fazenda",    "Fazenda",          "Secretaria de Fazenda",                                  "#6b21a8", "DollarSign",  10,
     "Responsável pelo suporte financeiro e orçamentário às ações de resposta, centralizando as autorizações para aquisição de materiais necessários e por fornecer alimentação para o pessoal operacional envolvido no evento."),

    ("comunicacao","Comunicação",      "Gerência de Comunicação e Jornalismo",                   "#1d4ed8", "Radio",       11,
     "Responsável pela divulgação de informações e orientações atualizadas do evento, orientada pelo Coordenador da COMPDEC."),

    ("gcm",        "Guarda Civil",     "Guarda Civil Municipal",                                 "#374151", "Siren",       12,
     "Realiza patrulhamento ostensivo e monitoramento em áreas de risco, orienta a população sobre autoproteção e atua na garantia da ordem pública, isolamento de áreas de risco iminente e proteção de pessoas e bens durante eventos adversos."),

    ("bombeiros",  "Bombeiros",        "Corpo de Bombeiros Militar do ES (6º BBM)",              "#dc2626", "Flame",       13,
     "Atua como força de execução especializada nas ações de resposta a desastres, priorizando atendimentos de urgência e emergência em situações de desastres em massa, incluindo busca, salvamento e resgate."),

    ("scbv",       "SCBV-SMJ",         "Sociedade Civil de Bombeiros Voluntários",               "#b45309", "Flame",       14,
     "Reconhecida como Núcleo de Proteção e Defesa Civil – NUPDEC. Atua em resgates, corte de árvores em risco e auxília nas demais ações operacionais da Defesa Civil."),

    ("pm",         "Polícia Militar",  "Polícia Militar (8ª Cia Independente)",                  "#1e3a8a", "Shield",      15,
     "Responsável por intensificar o policiamento ostensivo e repressivo, manter a ordem e a segurança nos abrigos e áreas sinistradas, evitando saques e violações dos patrimônios públicos e privados."),

    ("remer",      "REMER",            "Rede Municipal de Emergência de Radioamadores",          "#854d0e", "RadioTower",  16,
     "Prove ou suplementa as comunicações quando os meios normais forem insuficientes, ineficazes ou impedidos nas ações de prevenção, ocorrência de desastre, emergência ou calamidade pública. (Decreto Municipal nº 022/2023)"),

    ("defesa_animal","Defesa Animal",  "Defesa Civil Animal",                                    "#0f766e", "PawPrint",   17,
     "Realiza o resgate, atendimento e encaminhamento de animais domésticos e silvestres em situação de emergência, risco ou desastre. (Lei Municipal nº 2.732/2023)"),
]

orgao_ids = {}
for (slug, nome_curto, nome_completo, cor, icone, ordem, descricao) in orgaos:
    oid = str(uuid.uuid4())
    orgao_ids[slug] = oid
    cur.execute("""
        INSERT INTO placon_orgaos
            (id, tenant_id, nome_curto, nome_completo, cor_hex, icone, descricao, ordem)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
    """, (oid, TENANT_ID, nome_curto, nome_completo, cor, icone, descricao, ordem))

# -----------------------------------------------------------------------
# ATRIBUIÇÕES — dados literais do documento PLACON 2026
# Formato: (slug_orgao, fase, [lista de ações])
# -----------------------------------------------------------------------
atribuicoes = [
  ("compdec","prevencao",[
    "Ampliar e aperfeiçoar o sistema de monitoramento, alerta e alarme",
    "Fomentar o mapeamento de áreas de risco de desastres",
    "Coordenar as ações desempenhadas pelos setores envolvidos no plano, em conjunto com o Gabinete do Prefeito",
    "Ampliar a abrangência e fortalecer o plano municipal de contingência",
  ]),
  ("compdec","preparacao",[
    "Manter os representantes deste plano informados quanto à possibilidade de desastres no município",
    "Manter atualizado o Plano de Contingência e os contatos dos Pontos Focais",
  ]),
  ("compdec","resposta",[
    "Deslocar-se ao local sinistrado para apoiar e coordenar o incidente, montando o Gabinete de Gestão de Crise junto ao Prefeito",
    "Manter o levantamento da população desabrigada, danos materiais e prejuízos socioeconômicos",
    "Implementar o Comando Unificado na resposta a situações críticas",
    "Estudar a necessidade de declaração de Situação de Emergência ou Estado de Calamidade Pública",
    "Acionar a CEPDEC para agilizar o auxílio ao município por meio de apoio logístico e material, se necessário",
  ]),

  ("secobr","prevencao",[
    "Elaborar plano de ação para emprego de recursos humanos e logísticos em situação de emergência",
    "Fiscalizar ocupação irregular de encostas, morros e margens de curso hídrico",
    "Implementar obras de contenção nas áreas reconhecidamente de risco do município",
    "Apoiar a elaboração de Planos Municipais de Redução de Risco e de Macrodrenagem/PDAP",
  ]),
  ("secobr","preparacao",[
    "Acionar a equipe para sobreaviso em caso de intervenção imediata, vistoriando acessos prioritários",
    "Realizar vistoria em estruturas quando solicitado pela Defesa Civil Municipal",
  ]),
  ("secobr","resposta",[
    "Encaminhar grupo de especialistas ao local atingido para reparar ou atenuar os danos",
    "Disponibilizar recursos para execução de obras emergenciais identificadas pela Defesa Civil",
    "Colocar pessoal e equipamentos à disposição da Defesa Civil para apoio nas ações emergenciais",
  ]),

  ("saude","prevencao",[
    "Orientar as Unidades de Saúde a usarem os mapas de risco de deslizamento e inundação da COMPDEC",
  ]),
  ("saude","preparacao",[
    "Participar da comissão intersetorial de planejamento e redução de riscos de desastres",
    "Capacitar recursos humanos e prever recursos físicos, tecnológicos e financeiros para o atendimento aos desastres",
    "Identificar e cadastrar grupos vulneráveis residentes em área de risco, com atenção a doenças crônicas",
  ]),
  ("saude","resposta",[
    "Executar as ações definidas no Plano de Preparação e Resposta da COMPDEC",
    "Gerenciar, com outros setores, as ações de prevenção e promoção da saúde nos abrigos",
    "Manter registro consolidado e atualizado sobre danos humanos e materiais de interesse sanitário",
    "Emitir declaração de nascidos vivos e declaração de óbitos",
    "Colocar em estado de prontidão o Pronto Atendimento Municipal, com leitos para emergências e equipe mínima disponível",
  ]),

  ("setdas","prevencao",[
    "Articular, em parceria com a Defesa Civil, oficinas e seminários com temas preventivos para chuva e estiagem",
  ]),
  ("setdas","preparacao",[
    "Designar técnico de referência como articulador das ações locais, com prioridade a grupos vulneráveis",
    "Manter equipe em alerta para suporte técnico em situações de anormalidade",
    "Orientar a estruturação de Abrigos Temporários (ambiente físico, recursos materiais e trabalho social)",
  ]),
  ("setdas","resposta",[
    "Realizar a triagem socioeconômica e o cadastramento das famílias afetadas pelo desastre",
    "Viabilizar e executar doações humanitárias de itens em estoque próprio ou de doações",
    "Gerenciar Abrigos Temporários, assegurando recursos materiais, humanos e trabalho social",
    "Providenciar o relatório da situação dos desabrigados e das pessoas atingidas",
    "Em conjunto com Esporte e Cultura, promover atividades de lazer e cidadania nos abrigos",
  ]),

  ("educacao","prevencao",[
    "Estabelecer programas especiais de ensino para alunos afetados, evitando prejuízo educacional",
  ]),
  ("educacao","preparacao",[
    "Levantar as escolas que podem servir como abrigo temporário, conforme proximidade da comunidade vulnerável",
    "Elaborar escala de voluntários para alimentação, manutenção e higiene nos ambientes de abrigo",
  ]),
  ("educacao","resposta",[
    "Disponibilizar estrutura física e humana para apoio às comunidades afetadas",
    "Repassar à Defesa Civil a relação de escolas, endereços e contato do responsável local",
    "Coordenar a preparação de alimentação dos desabrigados pelas serventes das escolas e voluntárias",
  ]),

  ("securb","prevencao",[
    "Apoiar a elaboração e atualização do PDAP e de projetos de obras de prevenção a chuvas intensas",
    "Manter limpos os sistemas de drenagem das vias, evitando alagamentos",
  ]),
  ("securb","preparacao",[
    "Organizar equipe para sinalização e segurança física de via ou acesso danificado em área urbana",
  ]),
  ("securb","resposta",[
    "Realizar a limpeza das vias definidas como estratégicas pela Defesa Civil",
    "Disponibilizar recursos, pessoal e equipamentos para obras emergenciais",
    "Realizar limpeza das margens dos canais fluviais após o evento",
  ]),

  ("secint","prevencao",[
    "Manter as estradas rurais trafegáveis para permitir acesso aos serviços urbanos e ações preventivas",
  ]),
  ("secint","preparacao",[
    "Realizar levantamento de pontos críticos nas estradas rurais que possam ser agravados por chuvas",
  ]),
  ("secint","resposta",[
    "Manter a trafegabilidade das estradas rurais para permitir o trânsito de pessoas e ações de apoio",
    "Disponibilizar maquinário e servidores para as ações de resposta ao evento quando não houver pontos críticos urgentes",
  ]),

  ("seagro","prevencao",[
    "Mapear áreas agrícolas suscetíveis a danos por eventos adversos e orientar produtores rurais",
  ]),
  ("seagro","preparacao",[
    "Articular, com a Defesa Civil, o levantamento de produtores rurais em áreas de risco",
  ]),
  ("seagro","resposta",[
    "Acompanhar a atividade de agricultura do município atingido pelo desastre",
    "Avaliar possíveis danos e prejuízos no desenvolvimento do setor agrícola e agrário",
  ]),

  ("semam","prevencao",[
    "Identificar e monitorar locais de interesse ambiental com risco de dano em eventos adversos",
    "Apoiar o mapeamento de áreas de risco com sobreposição de fragilidade ambiental",
  ]),
  ("semam","preparacao",[
    "Capacitar equipe para atuação em cenários com risco de contaminação ambiental",
  ]),
  ("semam","resposta",[
    "Atuar em locais de interesse à conservação ambiental que sofreram danos ou estão em risco",
    "Vistoriar vazamentos e acidentes com materiais que possam causar danos às pessoas e ao meio ambiente",
    "Disponibilizar profissionais para auxílio técnico nas áreas necessitadas",
  ]),

  ("fazenda","prevencao",[
    "Garantir dotação orçamentária para ações de prevenção a desastres",
  ]),
  ("fazenda","preparacao",[
    "Manter recursos orçamentários reservados para resposta emergencial",
  ]),
  ("fazenda","resposta",[
    "Prover suporte financeiro e orçamentário às ações de resposta",
    "Centralizar as autorizações para aquisição de todos os materiais necessários",
    "Fornecer alimentação para o pessoal operacional envolvido no evento",
    "Recepcionar eventuais doações em dinheiro",
  ]),

  ("comunicacao","prevencao",[
    "Desenvolver campanhas preventivas de comunicação junto à população em período pré-chuvoso",
  ]),
  ("comunicacao","preparacao",[
    "Preparar templates de comunicados oficiais para os diferentes níveis de ativação do plano",
    "Manter canais institucionais (redes sociais, WhatsApp, site) prontos para uso emergencial",
  ]),
  ("comunicacao","resposta",[
    "Divulgar informações e orientações atualizadas do evento, orientada pelo Coordenador da COMPDEC",
    "Atuar como Oficial de Informação Pública no Sistema de Comando de Operações (SCO)",
    "Monitorar redes sociais e combater desinformação e fake news durante o evento",
  ]),

  ("gcm","prevencao",[
    "Realizar patrulhamento preventivo e monitoramento ostensivo em áreas de risco mapeadas",
    "Apoiar a COMPDEC na orientação à população sobre autoproteção e evacuação preventiva",
  ]),
  ("gcm","preparacao",[
    "Manter equipes armadas em regime de prontidão e sobreaviso para atuação integrada em cenários de desastre",
  ]),
  ("gcm","resposta",[
    "Atuar na garantia da ordem pública e proteção de pessoas e bens em áreas afetadas",
    "Realizar o isolamento de áreas de risco iminente, apoiando evacuação e salvamento",
    "Prestar apoio logístico e de segurança às equipes de resposta",
  ]),

  ("bombeiros","prevencao",[
    "Apoiar os órgãos municipais e estaduais na implementação de ações preventivas de redução de risco",
    "Realizar vistorias e avaliações técnicas em áreas suscetíveis a desastres",
  ]),
  ("bombeiros","preparacao",[
    "Manter a prontidão operacional de unidades e equipes especializadas",
    "Participar de exercícios simulados e treinamentos conjuntos",
  ]),
  ("bombeiros","resposta",[
    "Atuar de forma descentralizada por meio das Organizações Bombeiro Militar (OBM)",
    "Priorizar atendimentos de urgência e emergência em cenários de grande magnitude",
    "Integrar o Comando Unificado das operações, quando instituído",
  ]),

  ("scbv","prevencao",[
    "Realizar ações de prevenção e capacitação comunitária integradas à COMPDEC",
  ]),
  ("scbv","preparacao",[
    "Manter equipe em prontidão para acionamento pelo Sistema Municipal de Defesa Civil",
  ]),
  ("scbv","resposta",[
    "Atuar em resgates de pessoas ilhadas e presas em desabamentos e deslizamentos",
    "Realizar corte de árvores que ofereçam risco de queda ou caídas em vias e residências",
    "Auxiliar nas demais ações operacionais da Defesa Civil",
  ]),

  ("pm","prevencao",[
    "Realizar policiamento ostensivo preventivo em áreas de risco e aglomerações",
  ]),
  ("pm","preparacao",[
    "Manter patrulhamento intensificado durante períodos de alerta meteorológico",
  ]),
  ("pm","resposta",[
    "Intensificar o policiamento ostensivo e repressivo na área afetada",
    "Manter a ordem e a segurança nos abrigos e áreas sinistradas",
    "Evitar saques e violações dos patrimônios públicos e privados",
  ]),

  ("remer","prevencao",[
    "Fomentar o radioamadorismo e fortalecer o vínculo dos radioamadores com a COMPDEC",
    "Divulgar a localização dos Pontos de Apoio Comunitários cadastrados junto à população",
  ]),
  ("remer","preparacao",[
    "Manter os integrantes atualizados com boas práticas de Rádio Emergência",
    "Preparar lista 'Go Kit' com equipamentos básicos para instalação de estação base (HF e VHF/UHF)",
  ]),
  ("remer","resposta",[
    "Disponibilizar radioamadores e equipamentos para estações base e avançadas da COMPDEC",
    "Providenciar o registro de todas as mensagens (QSO) recebidas e emitidas",
    "Atuar como elo de comunicação entre população afetada e órgãos de resposta",
  ]),

  ("defesa_animal","prevencao",[
    "Mapear localidades com concentração de animais domésticos em áreas de risco",
  ]),
  ("defesa_animal","preparacao",[
    "Identificar pontos de apoio para acolhimento de animais em situações de evacuação",
  ]),
  ("defesa_animal","resposta",[
    "Realizar o resgate, atendimento e encaminhamento de animais domésticos e silvestres em situação de emergência, risco ou desastre",
    "Promover articulação institucional para proteção da fauna e cumprimento das medidas legais cabíveis",
  ]),
]

for (slug, fase, acoes) in atribuicoes:
    for ordem, texto in enumerate(acoes):
        cur.execute("""
            INSERT INTO placon_atribuicoes
                (id, tenant_id, orgao_id, fase, texto, ordem)
            VALUES (%s,%s,%s,%s,%s,%s)
        """, (str(uuid.uuid4()), TENANT_ID, orgao_ids[slug], fase, texto, ordem))

# -----------------------------------------------------------------------
# CONTATOS — extraídos da página de assinaturas do PLACON 2026
# -----------------------------------------------------------------------
contatos = [
    ("compdec",  "Bruno Augusto Vieira Pagel", "Coordenador Municipal de Proteção e Defesa Civil", "(27) 3263-4350 R. 1138", "defesacivil@pmsmj.es.gov.br", True),
    ("secobr",   "Bruno Augusto Vieira Pagel", "Secretário de Obras e Infraestrutura",             "(27) 3263-4350 R. 1029", "obras@pmsmj.es.gov.br",       True),
    ("saude",    "Carlos Alberto Jarske",      "Secretário de Saúde",                              "(27) 3263-4350 R. 1033", "saude@pmsmj.es.gov.br",       True),
    ("setdas",   "Sarianna Gava Woelffel Pienegonda", "Secretária de Ação Social",                 "(27) 3263-4350 R. 1057", "acaosocial@pmsmj.es.gov.br",  True),
    ("educacao", "Marcileide Stuhr",            "Secretária de Educação",                          "(27) 3263-4350 R. 1079", "educacao@pmsmj.es.gov.br",    True),
    ("securb",   "Alessandro Oliveira de Souza","Secretário de Serviços Urbanos",                  "(27) 3263-4350 R. 1049", "servicosurbanos@pmsmj.es.gov.br", True),
    ("secint",   "Adriano Haese",               "Secretário de Interior",                          "(27) 3263-4350 R. 1085", "interior@pmsmj.es.gov.br",    True),
    ("seagro",   "Vanderlei Marquez",           "Secretário de Agropecuária",                      "(27) 3263-4350 R. 1017", "agropecuaria@pmsmj.es.gov.br",True),
    ("semam",    "Leonardo Novelli Faian",      "Subsecretário de Meio Ambiente",                  "(27) 3263-4350 R. 1025", "meioambiente@pmsmj.es.gov.br",True),
    ("fazenda",  "Valdecir Jacob",              "Secretário de Fazenda",                           "(27) 3263-4350 R. 1015", "financas@pmsmj.es.gov.br",    True),
    ("comunicacao","Nicolas Vargas Teixeira",   "Gerente de Comunicação",                          "(27) 3263-4350 R. 1004", "gabinete@pmsmj.es.gov.br",    True),
    ("gcm",      "Central de Operações GCM",    "Plantão 24h",                                     "(27) 3263-4350",         None,                          True),
    ("bombeiros","Fábio Silva Ferreira",         "Comandante (1ª Cia 6º BBM)",                     "(27) 3194-3768",         "1cia.6bbm@bombeiros.es.gov.br",True),
    ("scbv",     "Alexandre Fortunato Ribeiro", "Presidente SCBV-SMJ",                             "(27) 99916-2725",        "scbvsmj@gmail.com",           True),
    ("pm",       "Thales Gustavo Pereira Matias Vaz","Comandante (8ª Cia Independente)",           "(27) 3259-9000",         "chefep3.8ciaind@pm.es.gov.br",True),
    ("remer",    "Cleverson Altierry Callott",  "Representante da REMER",                          "(27) 99838-8889",        "cleversonaltierry@hotmail.com",True),
]

for (slug, nome, cargo, tel, email, principal) in contatos:
    cur.execute("""
        INSERT INTO placon_contatos
            (id, tenant_id, orgao_id, nome, cargo, telefone, email, is_responsavel_principal)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
    """, (str(uuid.uuid4()), TENANT_ID, orgao_ids[slug], nome, cargo, tel, email, principal))

# -----------------------------------------------------------------------
# VERSÃO INICIAL DO PLANO
# -----------------------------------------------------------------------
cur.execute("""
    INSERT INTO placon_versoes
        (id, tenant_id, numero_versao, data_alteracao, descricao)
    VALUES (%s,%s,%s,%s,%s)
""", (str(uuid.uuid4()), TENANT_ID, "2026.1", "2026-01-01",
      "Versão inicial digitalizada no SIGERD a partir do esboço PLACON 2026 "
      "de Santa Maria de Jetibá. Elaborado pela COMPDEC."))

conn.commit()
cur.close()
conn.close()
print("Seed PLACON 2026 concluído com sucesso.")
