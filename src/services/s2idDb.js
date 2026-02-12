import { initDB } from './db'
import { supabase } from './supabase'

/**
 * S2ID Database Service
 * Handles CRUD for S2id records with auto-save and sync support.
 */

// Initial state for a new S2id record
export const INITIAL_S2ID_STATE = {
    status: 'draft',
    synced: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    data: {
        tipificacao: {
            cobrade: '',
            denominacao: ''
        },
        data_ocorrencia: {
            dia: '',
            mes: '',
            ano: '',
            horario: ''
        },
        danos_humanos: {
            mortos: 0,
            feridos: 0,
            enfermos: 0,
            desabrigados: 0,
            desalojados: 0,
            desaparecidos: 0,
            outros_afetados: 0,
            descricao: ''
        },
        danos_materiais: {
            unidades_habitacionais: { danificadas: 0, destruidas: 0, valor: 0 },
            instalacoes_saude: { danificadas: 0, destruidas: 0, valor: 0 },
            instalacoes_ensino: { danificadas: 0, destruidas: 0, valor: 0 },
            prestadoras_servicos: { danificadas: 0, destruidas: 0, valor: 0 },
            uso_comunitario: { danificadas: 0, destruidas: 0, valor: 0 },
            infraestrutura_publica: { danificadas: 0, destruidas: 0, valor: 0 }
        },
        danos_ambientais: {
            contaminacao_agua: { sim: false, populacao: '' },
            contaminacao_ar: { sim: false, populacao: '' },
            contaminacao_solo: { sim: false, populacao: '' },
            exaurimento_hidrico: { sim: false, populacao: '' },
            incendios: { sim: false, area: '' },
            descricao: ''
        },
        prejuizos_publicos: {
            assistencia_medica: 0,
            abastecimento_agua: 0,
            esgoto_sanitario: 0,
            limpeza_urbana: 0,
            desinfestacao: 0,
            energia_eletrica: 0,
            telecomunicacoes: 0,
            transportes: 0,
            combustiveis: 0,
            seguranca_publica: 0,
            ensino: 0
        },
        prejuizos_privados: {
            agricultura: 0,
            pecuaria: 0,
            industria: 0,
            comercio: 0,
            servicos: 0
        },
        // Campos específicos por Secretaria
        setorial: {
            saude: { unidades_afetadas: '', medicamentos_perda: '', atendimentos_extra: '', observacoes: '' },
            obras: { pontes_danificadas: '', bueiros_obstruidos: '', pavimentacao_m2: '', maquinario_horas: '' },
            educacao: { escolas_afetadas: '', alunos_sem_aula: '', danos_material_didatico: '', transporte_escolar_parado: '' },
            social: { cestas_basicas: '', kits_higiene: '', colchoes_entregues: '', familias_desabrigadas: '' },
            agricultura: { safra_perda_percentual: '', area_cultivo_afetada: '', estradas_rurais_obstruidas: '', rebanho_atingido: '' }
        },
        evidencias: [], // Array de { url, lat, lng, timestamp }
        assinatura: {
            responsavel: '',
            cargo: '',
            data_url: null,
            data_assinatura: null
        }
    }
};

/**
 * Save or Update a S2id record locally (IndexedDB)
 */
export const saveS2idLocal = async (record) => {
    const db = await initDB();
    const toSave = {
        ...record,
        updated_at: new Date().toISOString(),
        synced: false
    };
    const id = await db.put('s2id_records', toSave);

    // Trigger background sync if online
    if (navigator.onLine) {
        triggerS2idSync(id).catch(err => console.error('Auto-sync failed:', err));
    }

    return id;
};

/**
 * Get all local S2id records
 */
export const getS2idRecords = async () => {
    const db = await initDB();
    const records = await db.getAll('s2id_records');
    return records.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
};

/**
 * Get single S2id record by ID
 */
export const getS2idById = async (id) => {
    const db = await initDB();
    return await db.get('s2id_records', parseInt(id));
};

/**
 * Delete S2id record (soft delete)
 */
export const deleteS2idLocal = async (id) => {
    const db = await initDB();
    const record = await db.get('s2id_records', parseInt(id));
    if (record) {
        record.status = 'deleted';
        record.deleted_at = new Date().toISOString();
        record.synced = false;
        await db.put('s2id_records', record);

        if (navigator.onLine) {
            triggerS2idSync(id);
        }
    }
};

/**
 * Sync single S2id record to Supabase
 */
export const triggerS2idSync = async (id) => {
    const db = await initDB();
    const record = await db.get('s2id_records', parseInt(id));
    if (!record) return;

    try {
        const payload = {
            ...record,
            id_local: record.id
        };
        delete payload.id;
        delete payload.synced;

        const { data, error } = await supabase
            .from('s2id_records')
            .upsert(payload, { onConflict: 'id_local' })
            .select()
            .single();

        if (!error) {
            record.synced = true;
            record.supabase_id = data.id;
            await db.put('s2id_records', record);
            return true;
        }
        throw error;
    } catch (err) {
        console.error('S2id Sync Error:', err);
        return false;
    }
};

/**
 * Sync all pending S2id records
 */
export const syncAllS2id = async () => {
    const db = await initDB();
    const records = await db.getAll('s2id_records');
    const pending = records.filter(r => !r.synced);

    for (const r of pending) {
        await triggerS2idSync(r.id);
    }
};
