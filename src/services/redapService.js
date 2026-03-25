import { supabase } from './supabase';
import { initDB, triggerSync } from './db';

/**
 * REDAP Service (V2 Architecture)
 */

export const REDAP_SECTORS = {
    'Redap_Saude': 'Saúde',
    'Redap_Educacao': 'Educação',
    'Redap_Obras': 'Obras',
    'Redap_Agropecuaria': 'Agropecuária',
    'Redap_Social': 'Assistência Social',
    'Redap_Interior': 'Interior',
    'Redap_Administracao': 'Administração',
    'Redap_CDL': 'CDL',
    'Redap_Cesan': 'Cesan',
    'Redap_Cultura': 'Cultura',
    'Redap_DefesaSocial': 'Defesa Social',
    'Redap_EsporteTurismo': 'Esporte e Turismo',
    'Redap_MeioAmbiente': 'Meio Ambiente',
    'Redap_ServicosUrbanos': 'Serviços Urbanos',
    'Redap_Transportes': 'Transportes',
    'Redap_Geral': 'Defesa Civil',
    'Admin': 'Defesa Civil'
};

// Mapeamento extraído dos modelos oficiais em Relatórios_Fide para os 13 setores
export const REDAP_ITEM_MAPPING = {
    'Cultura': {
        'Dano Material': {
            items: ['Museus e Espaços Culturais', 'Bibliotecas Municipais', 'Teatros', 'Bens Tombados / Patrimônio Histórico', 'Auditórios e Centros de Convenções'],
            extraFields: [
                { name: 'qtd_danificada', label: 'Qtd. Danificada', type: 'number' }
            ]
        }
    },
    'Saúde': {
        'Dano Material': {
            items: ['Hospitais', 'Unidades Básicas de Saúde (UBS)', 'Pronto Atendimento (PA)', 'Farmácias Públicas', 'Laboratórios de Análises', 'Equipamentos Médicos / Hospitalares', 'Ambulâncias e Veículos de Emergência', 'Centros de Vacinação', 'Sedes da Vigilância Sanitária/Epidemiológica'],
            extraFields: [
                { name: 'qtd_danificada', label: 'Qtd. Danificada', type: 'number' },
                { name: 'qtd_destruida', label: 'Qtd. Destruída', type: 'number' }
            ]
        },
        'Prejuízo Econômico': {
            items: ['Assistência Médica e Atendimento de Emergência', 'Vigilância Epidemiológica e Sanitária', 'Controle de Pragas e Vetores (Zoonoses)', 'Distribuição de Medicamentos'],
            extraFields: [
                { name: 'populacao_atendida', label: 'População Impactada', type: 'number' }
            ]
        },
        'Dano Humano': {
            items: ['Mortos por causas diretas', 'Feridos em tratamento', 'Enfermos (Surtos/Contaminação)'],
            extraFields: [
                { name: 'mortos', label: 'Mortos', type: 'number' },
                { name: 'feridos', label: 'Feridos', type: 'number' },
                { name: 'enfermos', label: 'Enfermos', type: 'number' }
            ]
        }
    },
    'Educação': {
        'Dano Material': {
            items: ['Escolas Municipais de Ensino Fundamental', 'Centros Municipais de Ed. Infantil (CMEI)', 'Bibliotecas Públicas', 'Quadras Poliesportivas Escolares', 'Equipamentos Didáticos e Laboratórios', 'Ônibus e Veículos do Transporte Escolar', 'Móveis e Utensílios de Escola'],
            extraFields: [
                { name: 'qtd_danificada', label: 'Qtd. Danificada', type: 'number' },
                { name: 'qtd_destruida', label: 'Qtd. Destruída', type: 'number' }
            ]
        },
        'Prejuízo Econômico': {
            items: ['Interrupção das Aulas (Ensino Regular)', 'Limpeza e Recuperação de Prédios Escolares', 'Contratação Emergencial de Espaço para Aulas'],
            extraFields: [
                { name: 'alunos_sem_aula', label: 'Alunos Sem Aula', type: 'number' }
            ]
        }
    },
    'Agropecuária': {
        'Dano Material': {
            items: ['Prédios da Secretaria de Agricultura', 'Galpões de Armazenamento de Insumos', 'Máquinas e Implementos Agrícolas', 'Sistemas de Irrigação Pública', 'Cercas e Estruturas de Apoio Rural'],
            extraFields: [
                { name: 'qtd_danificada', label: 'Qtd. Danificada', type: 'number' }
            ]
        },
        'Prejuízo Econômico': {
            items: ['Lavouras Temporárias (Agricultura)', 'Lavouras Permanentes (Cultura Perene)', 'Pecuária de Corte e Leite', 'Produção de Pequenos Animais (Avicultura/Suinocultura)', 'Piscicultura e Tanques de Peixe', 'Mel e Silvicultura'],
            extraFields: [
                { name: 'area_afetada_ha', label: 'Área Afetada (HA)', type: 'number' },
                { name: 'produtores_atingidos', label: 'Produtores Atingidos', type: 'number' },
                { name: 'perda_estimada_ton', label: 'Perda Est. (Toneladas)', type: 'number' }
            ]
        }
    },
    'Interior': {
        'Dano Material': {
            items: ['Pontes de Madeira', 'Pontes de Concreto / Alvenaria', 'Pontilhões e Passarelas Rurais', 'Bueiros e Galerias de Drenagem', 'Muros de Arrimo e Contenções Rurais', 'Estradas Vicinais (Cascalhadas)', 'Estradas de Chão / Leito Natural'],
            extraFields: [
                { name: 'qtd_danificada', label: 'Qtd. Danificada', type: 'number' },
                { name: 'qtd_destruida', label: 'Qtd. Destruída', type: 'number' },
                { name: 'extensao_km', label: 'Extensão Afetada (KM)', type: 'number' }
            ]
        }
    },
    'Obras': {
        'Dano Material': {
            items: ['Prédios Administrativos Municipais', 'Celas e Unidades de Segurança Pública', 'Muros de Contenção em Vias Urbanas', 'Pavimentação Asfáltica / Paralelepípedo', 'Calçadas e Passeios Públicos', 'Sistemas de Galerias Pluviais', 'Escadarias e Acessos Urbanos'],
            extraFields: [
                { name: 'qtd_danificada', label: 'Qtd. Danificada', type: 'number' },
                { name: 'qtd_destruida', label: 'Qtd. Destruída', type: 'number' },
                { name: 'area_afetada_m2', label: 'Área Afetada (m²)', type: 'number' }
            ]
        }
    },
    'Meio Ambiente': {
        'Dano Material': {
            items: ['Sedes de Unidades de Conservação (UC)', 'Viveiros de Mudas Municipais', 'Ecopontos e Centrais de Compostagem', 'Centros de Educação Ambiental'],
            extraFields: [
                { name: 'qtd_danificada', label: 'Qtd. Danificada', type: 'number' }
            ]
        },
        'Dano Ambiental': {
            items: ['Poluição ou Contaminação de Corpos Hídricos', 'Poluição do Ar por Emissões/Queimadas', 'Contaminação do Solo por Resíduos/Químicos', 'Assoreamento de Canais e Rios', 'Impacto na Fauna Silvestre', 'Incêndios em Parques, APAs ou APPs'],
            extraFields: [
                { name: 'populacao_atingida_perc', label: '% População Atingida', type: 'number' },
                { name: 'area_atingida_ha', label: 'Área Atingida (HA)', type: 'number' },
                { name: 'recursos_hidricos_comprometidos', label: 'Recursos Hídricos Comprometidos?', type: 'boolean' }
            ]
        }
    },
    'Assistência Social': {
        'Dano Material': {
            items: ['Centros de Referência de Assist. Social (CRAS)', 'Centros de Ref. Especializado de Assist. Social (CREAS)', 'Conselho Tutelar', 'Albergues e Abrigos Públicos', 'Banco de Alimentos'],
            extraFields: [
                { name: 'qtd_danificada', label: 'Qtd. Danificada', type: 'number' }
            ]
        },
        'Dano Humano': {
            items: ['Famílias em Situação de Risco', 'Pessoas Desabrigadas (Alojadas)', 'Pessoas Desalojadas (Casa de Parentes)', 'Pessoas Desaparecidas', 'Impacto Social na Comunidade'],
            extraFields: [
                { name: 'desabrigados', label: 'Desabrigados', type: 'number' },
                { name: 'desalojados', label: 'Desalojados', type: 'number' },
                { name: 'desaparecidos', label: 'Desaparecidos', type: 'number' },
                { name: 'familias_atingidas', label: 'Famílias Atingidas', type: 'number' }
            ]
        }
    },
    'Serviços Urbanos': {
        'Dano Material': {
            items: ['Postes e Rede de Iluminação Pública', 'Rede de Drenagem e Bocas de Lobo', 'Mercados e Feiras Públicas', 'Cemitérios Municipais', 'Abrigos de Lixo e Contentores'],
            extraFields: [
                { name: 'qtd_danificada', label: 'Qtd. Danificada', type: 'number' },
                { name: 'qtd_destruida', label: 'Qtd. Destruída', type: 'number' }
            ]
        },
        'Prejuízo Econômico': {
            items: ['Sistema de Limpeza Urbana e Coleta de Resíduos', 'Esgoto de Águas Pluviais', 'Serviços de Manutenção Viária Urbana', 'Remoção de Lama e Entulhos'],
            extraFields: [
                { name: 'custo_limpeza_est', label: 'Custo Est. Limpeza (R$)', type: 'number' }
            ]
        }
    },
    'Administração': {
        'Dano Material': {
            items: ['Prefeitura Municipal (Sede)', 'Secretarias Administrativas', 'Almoxarifado Central', 'Bens Móveis e Utensílios de Escritório', 'Equipamentos de T.I. e Servidores'],
            extraFields: [
                { name: 'qtd_danificada', label: 'Qtd. Danificada', type: 'number' },
                { name: 'qtd_destruida', label: 'Qtd. Destruída', type: 'number' }
            ]
        }
    },
    'Defesa Social': {
        'Dano Material': {
            items: ['Postos da Guarda Municipal', 'Postos Policiais Atendidos', 'Centro de Videomonitoramento', 'Viaturas da Segurança Pública', 'Rádios e Comunicadores'],
            extraFields: [
                { name: 'qtd_danificada', label: 'Qtd. Danificada', type: 'number' },
                { name: 'dispositivos_afetados', label: 'Qtd. Câmeras/Disp.', type: 'number' }
            ]
        },
        'Prejuízo Econômico': {
            items: ['Serviços de Segurança Pública e Trânsito', 'Gasto com Segurança Emergencial'],
            extraFields: [
                { name: 'populacao_desprotegida', label: 'População Sem Monitoramento', type: 'number' }
            ]
        }
    },
    'Esporte e Turismo': {
        'Dano Material': {
            items: ['Estádios de Futebol Municipais', 'Ginásios e Quadras Poliesportivas', 'Campos Comunitários', 'Centros de Eventos e Turísticos', 'Museus e Prédios Históricos Públicos'],
            extraFields: [
                { name: 'qtd_danificada', label: 'Qtd. Danificada', type: 'number' },
                { name: 'qtd_destruida', label: 'Qtd. Destruída', type: 'number' }
            ]
        }
    },
    'Cesan': {
        'Dano Material': {
            items: ['Estações de Tratamento de Água (ETA)', 'Estações de Tratamento de Esgoto (ETE)', 'Abastecimento de Água Potável (Redes)', 'Esgoto de Águas Pluviais / Sanitário', 'Reservatórios e Adutoras', 'Poços Artesianos Públicos'],
            extraFields: [
                { name: 'qtd_danificada', label: 'Qtd. Danificada', type: 'number' },
                { name: 'extensao_rede_afetada', label: 'Rede Afetada (M)', type: 'number' }
            ]
        },
        'Prejuízo Econômico': {
            items: ['Serviço de Abastecimento de Água Interrompido', 'Serviço de Esgotamento Cocomprometido'],
            extraFields: [
                { name: 'economias_afetadas', label: 'Qtd. Ligações Atendidas', type: 'number' }
            ]
        }
    },
    'Transportes': {
        'Dano Material': {
            items: ['Maquinário Pesado (Patrolas, Tratores, Escavadeiras)', 'Caminhões de Carga e Frota de Serviço', 'Oficinas e Pátios de Manutenção', 'Garagens Públicas'],
            extraFields: [
                { name: 'qtd_danificada', label: 'Qtd. Danificada', type: 'number' },
                { name: 'veiculos_destruidos', label: 'Qtd. Destruída', type: 'number' }
            ]
        },
        'Prejuízo Econômico': {
            items: ['Sistema de Transportes Locais e Regionais', 'Distribuição de Combustíveis Municipais', 'Custo Extra de Fretes/Logística'],
            extraFields: [
                { name: 'servico_interrompido_dias', label: 'Dias de Interrupção', type: 'number' }
            ]
        }
    },
    'CDL': {
        'Dano Material': {
            items: ['Instalações Comerciais Físicas (Lojas)', 'Depósitos de Comércio Local', 'Mobiliário e Vitrines'],
            extraFields: [
                { name: 'comercios_afetados', label: 'Qtd. Comércios Afetados', type: 'number' }
            ]
        },
        'Prejuízo Econômico': {
            items: ['Prejuízos Econômicos Privados (Sinistro)', 'Perda de Estoque de Mercadorias', 'Lucros Cessantes da Atividade Comercial'],
            extraFields: [
                { name: 'valor_prejuizo_privado', label: 'Prejuízo Est. (R$)', type: 'number' }
            ]
        }
    },
    'Defesa Civil': {
        'Dano Material': {
            items: ['Todas as Categorias de Infraestrutura Pública', 'Equipamentos de Resgate e Salvamento', 'Abrigos de Emergência Logística'],
            extraFields: [
                { name: 'qtd_danificada', label: 'Qtd. Danificada', type: 'number' },
                { name: 'qtd_destruida', label: 'Qtd. Destruída', type: 'number' }
            ]
        },
        'Prejuízo Econômico': {
            items: ['Serviços de Socorro e Resposta', 'Assistência Humanitária Emergencial', 'Serviços de Limpeza de Escombros', 'Restabelecimento de Serviços Essenciais'],
            extraFields: [
                { name: 'custo_total_est', label: 'Custo Total Est. (R$)', type: 'number' }
            ]
        },
        'Dano Humano': {
            items: ['Total de Mortos no Evento', 'Total de Feridos e Enfermos', 'Total de Desabrigados e Desalojados'],
            extraFields: [
                { name: 'mortos', label: 'Mortos', type: 'number' },
                { name: 'feridos', label: 'Feridos', type: 'number' },
                { name: 'desabrigados', label: 'Desabrigados', type: 'number' },
                { name: 'desalojados', label: 'Desalojados', type: 'number' }
            ]
        }
    }
};

const COBRADES = [
    { code: '1.2.1.0.0', label: 'Inundações' },
    { code: '1.2.2.0.0', label: 'Enxurradas' },
    { code: '1.2.3.0.0', label: 'Alagamentos' },
    { code: '1.3.2.1.1', label: 'Deslizamentos' },
    { code: '1.3.2.1.2', label: 'Corridas de Solo / Lama' },
    { code: '1.4.1.1.0', label: 'Vendaval / Ciclone' },
    { code: '1.4.1.2.1', label: 'Granizo' },
    { code: '13214', label: 'Tempestade Local/Convectiva – Chuvas Intensas' }
];

export const getCobrades = () => COBRADES;

/**
 * EVENTS (Disasters)
 */
export const getActiveEvents = async () => {
    // Online check first
    if (navigator.onLine) {
        const { data, error } = await supabase
            .from('redap_eventos')
            .select('*')
            .order('data_inicio', { ascending: false });
        
        if (!error && data) {
            const db = await initDB();
            const tx = db.transaction('redap_eventos', 'readwrite');
            for (const ev of data) {
                await tx.store.put({ ...ev, synced: true });
            }
            await tx.done;
            return data;
        }
    }
    
    // Fallback to local
    const db = await initDB();
    return db.getAllFromIndex('redap_eventos', 'data_inicio');
};

export const createEvent = async (event) => {
    const db = await initDB();
    const newEvent = {
        ...event,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        synced: false
    };
    await db.put('redap_eventos', newEvent);
    triggerSync();
    return newEvent;
};

/**
 * REGISTRATIONS (Sector Damages)
 */
export const saveRegistration = async (reg) => {
    const db = await initDB();
    const toSave = {
        ...reg,
        id: reg.id || crypto.randomUUID(),
        updated_at: new Date().toISOString(),
        synced: false
    };
    await db.put('redap_registros', toSave);
    triggerSync();
    return toSave.id;
};

export const getRegistrationsByEvent = async (eventId) => {
    if (navigator.onLine) {
        try {
            const { data, error } = await supabase
                .from('redap_registros')
                .select('*')
                .eq('evento_id', eventId)
                .order('created_at', { ascending: false });
            
            if (!error && data) {
                const db = await initDB();
                const tx = db.transaction('redap_registros', 'readwrite');
                for (const r of data) {
                    await tx.store.put({ ...r, synced: true });
                }
                await tx.done;
                return data;
            }
        } catch (e) {
            console.error('Supabase fetch failed:', e);
        }
    }
    
    const db = await initDB();
    const all = await db.getAll('redap_registros');
    return all.filter(r => r.evento_id === eventId);
};

export const updateRegistrationStatus = async (id, status) => {
    const db = await initDB();
    const record = await db.get('redap_registros', id);
    
    if (record) {
        record.status_validacao = status;
        record.synced = false;
        record.updated_at = new Date().toISOString();
        await db.put('redap_registros', record);
        triggerSync();
        return true;
    }
    return false;
};
