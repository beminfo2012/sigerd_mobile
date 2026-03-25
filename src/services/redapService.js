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
    'Redap_DefesaSocial': 'Defesa Social',
    'Redap_EsporteTurismo': 'Esporte e Turismo',
    'Redap_ServicosUrbanos': 'Serviços Urbanos',
    'Redap_Transportes': 'Transportes',
    'Redap_Geral': 'Defesa Civil',
    'Admin': 'Defesa Civil'
};

// Mapeamento extraído dos modelos oficiais em Relatórios_Fide
export const REDAP_ITEM_MAPPING = {
    'Saúde': {
        'Dano Material': {
            items: ['Instalações públicas de saúde (Hospital, Unidade Básica, Pronto Atendimento)', 'Equipamentos médicos', 'Ambulâncias e Veículos'],
            extraFields: [
                { name: 'qtd_danificada', label: 'Qtd. Danificada', type: 'number' },
                { name: 'qtd_destruida', label: 'Qtd. Destruída', type: 'number' }
            ]
        },
        'Prejuízo Econômico': {
            items: ['Assistência médica / Saúde pública', 'Vigilância Epidemiológica', 'Vigilância Sanitária', 'Control de pragas e vetores'],
            extraFields: [
                { name: 'servico_interrompido', label: 'Serviço Interrompido?', type: 'boolean' }
            ]
        },
        'Dano Humano': {
            items: ['Mortes, Feridos, Enfermos'],
            extraFields: [
                { name: 'mortos', label: 'Mortos', type: 'number' },
                { name: 'feridos', label: 'Feridos', type: 'number' },
                { name: 'enfermos', label: 'Enfermos', type: 'number' }
            ]
        }
    },
    'Educação': {
        'Dano Material': {
            items: ['Instalações públicas de ensino (Escola, Creche)', 'Equipamentos educacionais', 'Transporte Escolar'],
            extraFields: [
                { name: 'qtd_danificada', label: 'Qtd. Danificada', type: 'number' },
                { name: 'qtd_destruida', label: 'Qtd. Destruída', type: 'number' }
            ]
        },
        'Prejuízo Econômico': {
            items: ['Interrupção do Ensino Público', 'Limpeza e Sanitização de Prédios Escolares']
        }
    },
    'Agropecuária': {
        'Dano Material': {
            items: ['Instalações públicas prestadoras de serviço (Secretaria, Galpões)', 'Estrutura Rural Pública'],
            extraFields: [
                { name: 'qtd_danificada', label: 'Qtd. Danificada', type: 'number' }
            ]
        },
        'Prejuízo Econômico': {
            items: ['Agricultura (Lavoura, Cultivo)', 'Pecuária (Criação, Rebanho)', 'Armazenamento e Silos'],
            extraFields: [
                { name: 'area_afetada', label: 'Área Afetada (HA)', type: 'number' },
                { name: 'producao_perdida', label: 'Produção Perdida (Ton/L)', type: 'number' }
            ]
        }
    },
    'Interior': {
        'Dano Material': {
            items: ['Ponte de Madeira', 'Ponte de Concreto', 'Bueiros', 'Galerias de Drenagem', 'Estradas Vicinais (KM afetados)'],
            extraFields: [
                { name: 'qtd_danificada', label: 'Qtd. Danificada', type: 'number' },
                { name: 'qtd_destruida', label: 'Qtd. Destruída', type: 'number' },
                { name: 'extensao_km', label: 'Extensão em KM (se estrada)', type: 'number' }
            ]
        }
    },
    'Meio Ambiente': {
        'Dano Material': {
            items: ['Instalações públicas de uso comunitário (Praças, Parques)', 'Obras de infraestrutura pública urbana'],
            extraFields: [
                { name: 'qtd_danificada', label: 'Qtd. Danificada', type: 'number' }
            ]
        },
        'Dano Ambiental': {
            items: ['Poluição da Água', 'Contaminação do Solo', 'Impacto na Fauna/Flora', 'Incêndio em APP/APA'],
            extraFields: [
                { name: 'populacao_atingida_perc', label: '% População Atingida', type: 'number' },
                { name: 'area_atingida_ha', label: 'Área Atingida (Hectares)', type: 'number' },
                { name: 'servico_ecossistemico', label: 'Perda de Serviço Ecossistêmico', type: 'text' }
            ]
        }
    },
    'Serviços Urbanos': {
        'Dano Material': {
            items: ['Instalações de uso comunitário', 'Obras de infraestrutura pública urbana', 'Rede de Drenagem Urbana'],
            extraFields: [
                { name: 'qtd_danificada', label: 'Qtd. Danificada', type: 'number' },
                { name: 'qtd_destruida', label: 'Qtd. Destruída', type: 'number' }
            ]
        },
        'Prejuízo Econômico': {
            items: ['Sistema de limpeza urbana e coleta de lixo', 'Manutenção de vias urbanas']
        }
    },
    'Assistência Social': {
        'Dano Material': {
            items: ['Centros de Referência (CRAS/CREAS)', 'Abrigos Institucionais']
        },
        'Dano Humano': {
            items: ['Impacto Social'],
            extraFields: [
                { name: 'desabrigados', label: 'Desabrigados', type: 'number' },
                { name: 'desalojados', label: 'Desalojados', type: 'number' },
                { name: 'desaparecidos', label: 'Desaparecidos', type: 'number' }
            ]
        }
    },
    'Defesa Civil': {
        'Dano Material': {
            items: ['Todas as Categorias'],
            extraFields: [
                { name: 'qtd_danificada', label: 'Qtd. Danificada', type: 'number' },
                { name: 'qtd_destruida', label: 'Qtd. Destruída', type: 'number' }
            ]
        },
        'Prejuízo Econômico': {
            items: ['Custo de Resposta e Socorro', 'Custo de Reabilitação do Cenário']
        },
        'Dano Humano': {
            items: ['Impacto Humano'],
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
