export const RISK_TYPES = [
    {
        id: 'geologico',
        label: 'Geológico',
        ico: '⛰️',
        subs: [
            'Deslizamento Planar',
            'Deslizamento Rotacional',
            'Deslizamento em Cunha',
            'Rastejo',
            'Corrida de Massa / Fluxo de Detritos',
            'Queda / Rolamento de Blocos Rochosos',
            'Erosão Laminar',
            'Erosão em Sulco',
            'Ravina',
            'Voçoroca',
            'Subsidência (colapso de vazios subterrâneos)',
            'Recalque Diferencial do Solo'
        ],
        medidas: [
            'Executar drenagem superficial e captação de águas pluviais',
            'Evitar lançamento de efluentes na encosta',
            'Contratar laudo geotécnico por profissional habilitado',
            'Instalar tela ou contenção de encosta',
            'Remover sobrecarga do terreno',
            'Realizar retaludamento adequado',
            'Comunicar imediatamente surgência de novas trincas',
            'Impermeabilizar o solo exposto próximo à estrutura'
        ]
    },
    {
        id: 'hidrologico',
        label: 'Hidrológico',
        ico: '🌊',
        subs: [
            'Alagamento',
            'Inundação',
            'Enxurrada',
            'Transbordamento de Rio',
            'Transbordamento de Córrego',
            'Assoreamento',
            'Obstrução de Drenagem',
            'Rompimento de Galeria Pluvial',
            'Erosão Marginal',
            'Retorno de Esgoto',
            'Enchente Repentina',
            'Rompimento de Barragem / Açude',
            'Elevação do Lençol Frático'
        ],
        medidas: [
            'Desobstruir calhas, ralos e sistema de drenagem da edificação',
            'Instalar comportas de proteção temporária',
            'Remover materiais que impeçam o escoamento natural',
            "Não descartar lixo em cursos d'água",
            'Afastar bens móveis e eletrônicos para áreas elevadas',
            'Comunicar caso a erosão aproxime-se de fundações',
            'Evitar travessia de áreas alagadas em eventos extremos'
        ]
    },
    {
        id: 'estrutural',
        label: 'Estrutural',
        ico: '🏗️',
        subs: [
            'Risco de Desabamento',
            'Colapso Parcial',
            'Colapso Total',
            'Fissuras Estruturais',
            'Trincas',
            'Rachaduras',
            'Muro de Arrimo com Risco',
            'Laje com Risco',
            'Marquise com Risco',
            'Edificação Abandonada',
            'Estrutura Pós-Incêndio',
            'Estrutura Comprometida por Infiltração',
            'Fundação Aparente',
            'Pilar / Viga Comprometidos'
        ],
        medidas: [
            'Suspender imediatamente obras e sobrecargas na edificação',
            'Escorar a estrutura de forma emergencial com profissional capacitado',
            'Contratar Laudo Técnico Estrutural (ART/RRT)',
            'Remover elementos soltos com risco de queda (telhas, reboco)',
            'Isolar a área com risco de colapso',
            'Vedar infiltrações ativas na estrutura'
        ]
    },
    {
        id: 'incendio',
        label: 'Incêndio',
        ico: '🔥',
        subs: [
            'Incêndio Florestal',
            'Queimada Irregular',
            'Fiação exposta ou curto-circuito',
            'Armazenamento irregular de inflamáveis',
            'Ausência/falha de rotas de fuga',
            'Botijões de gás (GLP) em local confinado',
            'Risco em vegetação limítrofe'
        ],
        medidas: [
            'Revisar imediatamente a instalação elétrica com profissional habilitado',
            'Remover materiais inflamáveis armazenados indevidamente',
            'Instalar ou desobstruir rotas de fuga e saídas de emergência',
            'Reposicionar botijões de GLP para área externa e ventilada',
            'Realizar capina preventiva em vegetação adjacente à edificação',
            'Providenciar projeto de combate a incêndio junto ao CBMES'
        ]
    },
    {
        id: 'ambiental',
        label: 'Ambiental',
        ico: '🌿',
        subs: [
            'Queda de Árvore Inteira (Tombamento)',
            'Queda de Galho ou Ramo',
            'Fratura ou Quebra de Tronco',
            'Desenraizamento / Falha Radicular',
            'Galhos em Conflito com Rede Elétrica ou Via Pública',
            'Supressão Vegetal Irregular',
            'Contaminação do Solo',
            'Contaminação da Água',
            'Assoreamento Ambiental',
            'Risco Associado à Fauna',
            'Descarte irregular de resíduos'
        ],
        medidas: [
            'Cessar imediatamente o descarte irregular',
            'Providenciar recolhimento e destinação adequada de resíduos',
            'Instalar barreira de contenção para produtos químicos',
            'Apresentar licenciamento ambiental regular',
            'Acionar Secretaria Municipal de Meio Ambiente'
        ]
    },
    {
        id: 'saude',
        label: 'Saúde Pública',
        ico: '🏥',
        subs: [
            'Esgoto a céu aberto',
            'Infestação de vetores',
            'Contaminação biológica',
            'Acúmulo de lixo/entulho',
            'Animais peçonhentos'
        ],
        medidas: [
            'Limpar o terreno e remover entulhos',
            'Eliminar todos os recipientes com água parada',
            'Providenciar ligação regular à rede de esgoto ou fossa séptica',
            'Acionar Zoonoses para manejo de vetores/animais',
            "Manter tampas de caixas d'água vedadas"
        ]
    },
    {
        id: 'tecnologico',
        label: 'Tecnológico',
        ico: '⚙️',
        subs: [
            'Vazamento de Gás',
            'Vazamento de Produto Químico',
            'Derramamento de Combustível',
            'Derramamento de Óleo',
            'Explosão',
            'Incêndio Industrial',
            'Risco Elétrico',
            'Poste com Risco de Queda',
            'Fiação Exposta',
            'Acidente com Carga Perigosa',
            'Colapso de Infraestrutura Crítica',
            'Falha em Equipamento Industrial',
            'Contaminação Química'
        ],
        medidas: [
            'Isolar a área afetada imediatamente',
            'Apresentar Plano de Ação de Emergência (PAE)',
            'Garantir manutenção preventiva de equipamentos sob pressão',
            'Notificar órgão fiscalizador estadual (IEMA, etc.)'
        ]
    },
    {
        id: 'outro',
        label: 'Outro',
        ico: '📋',
        subs: [
            'Outro Risco (descrever)',
            'Situação Atípica',
            'Risco Não Classificado'
        ],
        medidas: [
            'Adotar medida cautelar imediata de isolamento',
            'Contatar Defesa Civil para reavaliação conjunta'
        ]
    }
];
