export const RISK_TYPES = [
    {
        id: 'geologico',
        label: 'Geológico',
        ico: '⛰️',
        subs: [
            'Instabilidade de talude',
            'Movimento de massa',
            'Erosão em ravina/voçoroca',
            'Queda de bloco/rochoso',
            'Recalque de terreno'
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
            'Inundação gradual',
            'Enxurrada',
            'Erosão marginal (solapamento)',
            'Transbordamento de calha'
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
            'Trincas e fissuras em alvenaria',
            'Corrosão de armaduras',
            'Recalque de fundação',
            'Risco de queda de telhado/cobertura',
            'Fadiga de materiais',
            'Obras irregulares adjacentes'
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
            'Contaminação de solo/água',
            'Descarte irregular de resíduos',
            'Desmatamento em APP',
            'Queimada ilegal'
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
            'Foco de vetores (dengue, etc.)',
            'Esgoto a céu aberto',
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
            'Vazamento de produtos químicos',
            'Risco em barragem',
            'Rompiemento de tubulação pressurizada',
            'Rádio-atividade (improvável, mas possível)'
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
            'Situação atípica não listada'
        ],
        medidas: [
            'Adotar medida cautelar imediata de isolamento',
            'Contatar Defesa Civil para reavaliação conjunta'
        ]
    }
];
