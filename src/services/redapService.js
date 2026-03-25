import { supabase } from './supabase';
import { initDB, triggerSync } from './db';

/**
 * REDAP Service (V2 Architecture)
 */

export const REDAP_SECTORS = {
    'Redap_Saude': 'Saúde',
    'Redap_Educacao': 'Educação',
    'Redap_Obras': 'Obras',
    'Redap_Agricultura': 'Agricultura',
    'Redap_Social': 'Social',
    'Redap_Interior': 'Interior',
    'Redap_Administracao': 'Administração',
    'Redap_CDL': 'CDL',
    'Redap_Cesan': 'Cesan',
    'Redap_DefesaSocial': 'Defesa Social',
    'Redap_EsporteTurismo': 'Esporte e Turismo',
    'Redap_ServicosUrbanos': 'Serviços Urbanos',
    'Redap_Transportes': 'Transportes',
    'Redap_Geral': 'Defesa Civil',
    'Admin': 'Defesa Civil',
    'Coordenador': 'Defesa Civil',
    'Coordenador de Proteção e Defesa Civil': 'Defesa Civil'
};

const COBRADES = [
    { code: '1.1.1.1.0', label: 'Incêndio Florestal' },
    { code: '1.1.3.1.1', label: 'Erosão de Margem Fluvial' },
    { code: '1.2.1.0.0', label: 'Inundações' },
    { code: '1.2.2.0.0', label: 'Enxurradas' },
    { code: '1.2.3.0.0', label: 'Alagamentos' },
    { code: '1.3.1.1.1', label: 'Queda, Tombamento ou Rolamento de Blocos' },
    { code: '1.3.2.1.1', label: 'Deslizamentos' },
    { code: '1.3.2.1.2', label: 'Corridas de Solo / Lama' },
    { code: '1.3.2.1.3', label: 'Rastejos' },
    { code: '1.4.1.1.0', label: 'Vendaval / Ciclone' },
    { code: '1.4.1.2.1', label: 'Granizo' }
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
