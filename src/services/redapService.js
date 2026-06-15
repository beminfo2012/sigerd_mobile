import { supabase } from './supabase';
import { initDB, triggerSync, syncSingleItem } from './db';

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
        try {
            const { data, error } = await supabase
                .from('eventos_desastre')
                .select('*')
                .order('data_hora_evento', { ascending: false });
            
            if (!error && data) {
                const db = await initDB();
                const tx = db.transaction('eventos_desastre', 'readwrite');
                for (const ev of data) {
                    await tx.store.put({ ...ev, synced: true });
                }
                await tx.done;
                
                // Map keys for compatibility
                return data.map(ev => ({
                    ...ev,
                    nome_evento: ev.nome_evento || ev.cobrade_tipo || 'Desastre Sem Nome',
                    cobrade: `${ev.cobrade_codigo} - ${ev.cobrade_tipo || ''}`,
                    data_inicio: ev.data_hora_evento,
                    status_evento: ev.status_geral
                }));
            }
        } catch (e) {
            console.error('Supabase fetch failed for eventos_desastre:', e);
        }
    }
    
    // Fallback to local
    const db = await initDB();
    const local = await db.getAll('eventos_desastre');
    // Sort local
    local.sort((a, b) => new Date(b.data_hora_evento) - new Date(a.data_hora_evento));
    return local.map(ev => ({
        ...ev,
        nome_evento: ev.nome_evento || ev.cobrade_tipo || 'Desastre Sem Nome',
        cobrade: `${ev.cobrade_codigo} - ${ev.cobrade_tipo || ''}`,
        data_inicio: ev.data_hora_evento,
        status_evento: ev.status_geral
    }));
};

export const createEvent = async (event) => {
    const db = await initDB();
    
    // Extrai cobrade_codigo e cobrade_tipo do cobrade (ex: "1.2.1.0.0 - Inundações")
    const parts = event.cobrade ? event.cobrade.split(' - ') : [];
    const cobrade_codigo = parts[0] || '1.2.1.0.0';
    const cobrade_tipo = parts[1] || 'Inundações';
    
    const newEvent = {
        id: crypto.randomUUID(),
        nome_evento: event.nome_evento,
        cobrade_codigo,
        cobrade_grupo: 'Desastres Naturais',
        cobrade_subgrupo: 'Meteorológicos/Hidrológicos',
        cobrade_tipo,
        data_hora_evento: event.data_inicio || new Date().toISOString(),
        municipio_uf: 'Santa Maria de Jetibá / ES',
        area_afetada_localidade: 'Área Urbana e Rural',
        decreto_municipal_emergencia: null,
        status_geral: 'RASCUNHO',
        data_emissao: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        synced: false
    };
    
    await db.put('eventos_desastre', newEvent);
    triggerSync();
    
    // Inicia fluxo de aprovação padrão (Etapas 1 a 5)
    await initFluxoAprovacao(newEvent.id);
    
    return {
        ...newEvent,
        nome_evento: newEvent.nome_evento,
        cobrade: `${newEvent.cobrade_codigo} - ${newEvent.cobrade_tipo}`,
        data_inicio: newEvent.data_hora_evento,
        status_evento: newEvent.status_geral
    };
};

export const updateEventLocation = async (eventId, lat, lng) => {
    const db = await initDB();
    const local = await db.get('eventos_desastre', eventId);
    if (local) {
        local.latitude = lat;
        local.longitude = lng;
        local.updated_at = new Date().toISOString();
        local.synced = false;
        await db.put('eventos_desastre', local);
        
        if (navigator.onLine) {
            try {
                const { error } = await supabase
                    .from('eventos_desastre')
                    .update({ 
                        latitude: lat, 
                        longitude: lng, 
                        updated_at: new Date().toISOString() 
                    })
                    .eq('id', eventId);
                if (!error) {
                    local.synced = true;
                    await db.put('eventos_desastre', local);
                }
            } catch (e) {
                console.error('Error updating event location in Supabase:', e);
            }
        }
        triggerSync();
        
        // Registra histórico de ação
        try {
            await addHistoricoAcao({
                evento_id: eventId,
                ator: 'Defesa Civil',
                acao: `Localização geográfica do desastre atualizada para: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                tipo_acao: 'EDICAO'
            });
        } catch (hErr) {
            console.error('Error recording action history:', hErr);
        }
        
        return {
            ...local,
            nome_evento: local.nome_evento || local.cobrade_tipo || 'Desastre Sem Nome',
            cobrade: `${local.cobrade_codigo} - ${local.cobrade_tipo || ''}`,
            data_inicio: local.data_hora_evento,
            status_evento: local.status_geral
        };
    }
    return null;
};

export const deleteEvent = async (eventId) => {
    const db = await initDB();
    
    // 1. Delete from local IDB
    await db.delete('eventos_desastre', eventId);
    
    // Deleta registros locais associados
    const collections = ['redap_secoes', 'redap_fluxo_aprovacao', 'redap_historico_acoes', 'redap_assinaturas'];
    for (const storeName of collections) {
        const items = await db.getAll(storeName);
        for (const item of items) {
            if (item.evento_id === eventId) {
                await db.delete(storeName, item.id);
            }
        }
    }

    // 2. Delete from Supabase if online
    if (navigator.onLine) {
        try {
            await supabase.from('eventos_desastre').delete().eq('id', eventId);
            await supabase.from('redap_secoes').delete().eq('evento_id', eventId);
            await supabase.from('redap_fluxo_aprovacao').delete().eq('evento_id', eventId);
            await supabase.from('redap_historico_acoes').delete().eq('evento_id', eventId);
            await supabase.from('redap_assinaturas').delete().eq('evento_id', eventId);
        } catch (e) {
            console.error('Error deleting from Supabase:', e);
        }
    }
    
    return { success: true };
};

export const initFluxoAprovacao = async (eventoId) => {
    const db = await initDB();
    const etapas = [
        { etapa: 1, descricao_etapa: 'Preenchimento Setorial (Secretarias Municipais)', responsavel: 'Secretarias Municipais' },
        { etapa: 2, descricao_etapa: 'Consolidação e Parecer Técnico', responsavel: 'Defesa Civil' },
        { etapa: 3, descricao_etapa: 'Assinatura do Relatório Geral', responsavel: 'Coordenador Defesa Civil' },
        { etapa: 4, descricao_etapa: 'Assinatura de Homologação', responsavel: 'Prefeito Municipal' },
        { etapa: 5, descricao_etapa: 'Homologação e Registro do REDAP', responsavel: 'Defesa Civil Estadual' }
    ];
    
    for (const et of etapas) {
        const record = {
            id: crypto.randomUUID(),
            evento_id: eventoId,
            etapa: et.etapa,
            descricao_etapa: et.descricao_etapa,
            responsavel: et.responsavel,
            data_hora: new Date().toISOString(),
            status: et.etapa === 1 ? 'CONCLUIDA' : 'PENDENTE',
            synced: false
        };
        await db.put('redap_fluxo_aprovacao', record);
    }
    triggerSync();
};

/**
 * REDAP Sections
 */
export const getSecoesByEvento = async (eventoId) => {
    const db = await initDB();
    if (navigator.onLine) {
        try {
            const { data, error } = await supabase
                .from('redap_secoes')
                .select('*')
                .eq('evento_id', eventoId);
            
            if (!error && data) {
                const tx = db.transaction('redap_secoes', 'readwrite');
                const store = tx.objectStore('redap_secoes');
                const localSecoes = await store.getAll();
                const unsynced = localSecoes.filter(s => s.evento_id === eventoId && s.synced === false);

                for (const item of data) {
                    const isUnsynced = unsynced.some(u => u.id === item.id);
                    if (!isUnsynced) {
                        await store.put({ ...item, synced: true });
                    }
                }
                await tx.done;
            }
        } catch (e) {
            console.error('Error fetching secoes:', e);
        }
    }
    
    const local = await db.getAll('redap_secoes');
    return local.filter(s => s.evento_id === eventoId);
};

export const saveSecao = async (secaoData) => {
    const db = await initDB();
    const toSave = {
        ...secaoData,
        id: secaoData.id || crypto.randomUUID(),
        data_preenchimento: secaoData.data_preenchimento || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        synced: false
    };
    await db.put('redap_secoes', toSave);
    
    if (navigator.onLine) {
        try {
            await syncSingleItem('redap_secoes', toSave, db);
        } catch (e) {
            console.error('Immediate sync for saveSecao failed:', e);
            triggerSync();
        }
    } else {
        triggerSync();
    }
    
    // Registra histórico de ação
    await addHistoricoAcao({
        evento_id: toSave.evento_id,
        ator: toSave.responsavel_preenchimento || 'Usuário Setorial',
        acao: `Preenchimento/Atualização da Seção: ${toSave.secao}`,
        tipo_acao: toSave.status_secao === 'ENVIADO' ? 'ENVIO' : 'EDICAO'
    });
    
    return toSave.id;
};

/**
 * REDAP Fluxo de Aprovação
 */
export const getFluxoAprovacaoByEvento = async (eventoId) => {
    const db = await initDB();
    if (navigator.onLine) {
        try {
            const { data, error } = await supabase
                .from('redap_fluxo_aprovacao')
                .select('*')
                .eq('evento_id', eventoId)
                .order('etapa', { ascending: true });
            
            if (!error && data) {
                const tx = db.transaction('redap_fluxo_aprovacao', 'readwrite');
                const store = tx.objectStore('redap_fluxo_aprovacao');
                const localFluxo = await store.getAll();
                const unsynced = localFluxo.filter(f => f.evento_id === eventoId && f.synced === false);

                for (const item of data) {
                    const isUnsynced = unsynced.some(u => u.id === item.id);
                    if (!isUnsynced) {
                        await store.put({ ...item, synced: true });
                    }
                }
                await tx.done;
            }
        } catch (e) {
            console.error('Error fetching fluxo:', e);
        }
    }
    
    const local = await db.getAll('redap_fluxo_aprovacao');
    return local.filter(f => f.evento_id === eventoId).sort((a, b) => a.etapa - b.etapa);
};

export const updateFluxoEtapa = async (eventoId, etapaNumero, status, responsavelNome = '') => {
    const db = await initDB();
    const localFluxo = await db.getAll('redap_fluxo_aprovacao');
    const record = localFluxo.find(f => f.evento_id === eventoId && f.etapa === etapaNumero);
    
    if (record) {
        record.status = status;
        record.data_hora = new Date().toISOString();
        if (responsavelNome) record.responsavel = responsavelNome;
        record.synced = false;
        await db.put('redap_fluxo_aprovacao', record);
        
        if (navigator.onLine) {
            try {
                await syncSingleItem('redap_fluxo_aprovacao', record, db);
            } catch (e) {
                console.error('Immediate sync for updateFluxoEtapa failed:', e);
                triggerSync();
            }
        } else {
            triggerSync();
        }
        
        // Registra histórico de ação
        await addHistoricoAcao({
            evento_id: eventoId,
            ator: responsavelNome || 'Sistema',
            acao: `Alteração da Etapa ${etapaNumero} para: ${status}`,
            tipo_acao: 'ANALISE'
        });
        
        return true;
    }
    return false;
};

/**
 * REDAP Histórico de Ações
 */
export const getHistoricoAcoesByEvento = async (eventoId) => {
    const db = await initDB();
    if (navigator.onLine) {
        try {
            const { data, error } = await supabase
                .from('redap_historico_acoes')
                .select('*')
                .eq('evento_id', eventoId)
                .order('data_hora', { ascending: false });
            
            if (!error && data) {
                const tx = db.transaction('redap_historico_acoes', 'readwrite');
                const store = tx.objectStore('redap_historico_acoes');
                const localHist = await store.getAll();
                const unsynced = localHist.filter(h => h.evento_id === eventoId && h.synced === false);

                for (const item of data) {
                    const isUnsynced = unsynced.some(u => u.id === item.id);
                    if (!isUnsynced) {
                        await store.put({ ...item, synced: true });
                    }
                }
                await tx.done;
            }
        } catch (e) {
            console.error('Error fetching historico:', e);
        }
    }
    
    const local = await db.getAll('redap_historico_acoes');
    return local.filter(h => h.evento_id === eventoId).sort((a, b) => new Date(b.data_hora) - new Date(a.data_hora));
};

export const addHistoricoAcao = async (acaoData) => {
    const db = await initDB();
    const newAcao = {
        id: crypto.randomUUID(),
        evento_id: acaoData.evento_id,
        data_hora: new Date().toISOString(),
        ator: acaoData.ator || 'Sistema',
        acao: acaoData.acao || '',
        tipo_acao: acaoData.tipo_acao || 'EDICAO',
        synced: false
    };
    await db.put('redap_historico_acoes', newAcao);
    
    if (navigator.onLine) {
        try {
            await syncSingleItem('redap_historico_acoes', newAcao, db);
        } catch (e) {
            console.error('Immediate sync for addHistoricoAcao failed:', e);
            triggerSync();
        }
    } else {
        triggerSync();
    }
    return newAcao;
};

/**
 * REDAP Assinaturas
 */
export const getAssinaturasByEvento = async (eventoId) => {
    const db = await initDB();
    if (navigator.onLine) {
        try {
            const { data, error } = await supabase
                .from('redap_assinaturas')
                .select('*')
                .eq('evento_id', eventoId)
                .order('data_hora_assinatura', { ascending: true });
            
            if (!error && data) {
                const db = await initDB();
                const tx = db.transaction('redap_assinaturas', 'readwrite');
                const store = tx.objectStore('redap_assinaturas');
                const localAss = await store.getAll();
                const unsynced = localAss.filter(a => a.evento_id === eventoId && a.synced === false);

                for (const item of data) {
                    const isUnsynced = unsynced.some(u => u.id === item.id);
                    if (!isUnsynced) {
                        await store.put({ ...item, synced: true });
                    }
                }
                await tx.done;
            }
        } catch (e) {
            console.error('Error fetching assinaturas:', e);
        }
    }
    
    const local = await db.getAll('redap_assinaturas');
    return local.filter(a => a.evento_id === eventoId).sort((a, b) => new Date(a.data_hora_assinatura) - new Date(b.data_hora_assinatura));
};

export const addAssinatura = async (assinaturaData) => {
    const db = await initDB();
    const newAssinatura = {
        id: crypto.randomUUID(),
        evento_id: assinaturaData.evento_id,
        usuario_id: assinaturaData.usuario_id,
        nome: assinaturaData.nome,
        cargo_secretaria: assinaturaData.cargo_secretaria,
        data_hora_assinatura: new Date().toISOString(),
        hash_assinatura: assinaturaData.hash_assinatura || crypto.randomUUID().substring(0, 16),
        synced: false
    };
    await db.put('redap_assinaturas', newAssinatura);
    
    if (navigator.onLine) {
        try {
            await syncSingleItem('redap_assinaturas', newAssinatura, db);
        } catch (e) {
            console.error('Immediate sync for addAssinatura failed:', e);
            triggerSync();
        }
    } else {
        triggerSync();
    }
    
    // Registra histórico
    await addHistoricoAcao({
        evento_id: newAssinatura.evento_id,
        ator: newAssinatura.nome,
        acao: `Assinatura eletrônica registrada: ${newAssinatura.cargo_secretaria}`,
        tipo_acao: 'APROVACAO'
    });
    
    return newAssinatura;
};

/**
 * REGISTRATIONS (Sector Damages) - Legado, mantido para retrocompatibilidade
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
    const db = await initDB();
    const localAll = await db.getAll('redap_registros');
    let regs = localAll.filter(r => r.evento_id === eventId);

    if (navigator.onLine) {
        try {
            const { data: remoteData, error } = await supabase
                .from('redap_registros')
                .select('*')
                .eq('evento_id', eventId)
                .order('created_at', { ascending: false });
            
            if (!error && remoteData) {
                const tx = db.transaction('redap_registros', 'readwrite');
                for (const remote of remoteData) {
                    const local = regs.find(l => l.id === remote.id);
                    if (!local || local.synced) {
                        await tx.store.put({ ...remote, synced: true });
                    }
                }
                await tx.done;
                const updatedLocal = await db.getAll('redap_registros');
                regs = updatedLocal.filter(r => r.evento_id === eventId);
            }
        } catch (e) {
            console.error('Supabase fetch failed:', e);
        }
    }
    return regs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
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
