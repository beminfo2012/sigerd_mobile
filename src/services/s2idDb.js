import { initDB, triggerSync, syncPendingData } from './db'
import { supabase } from './supabase'

/**
 * S2ID Database Service
 * Handles CRUD for S2id records with auto-save and sync support.
 */

// Initial state for a new S2id record
export const INITIAL_S2ID_STATE = {
    status: 'draft',
    tipo_registro: 's2id', // 's2id' ou 'ocorrencia'
    id_ocorrencia: null, // ID amigável/sequencial se necessário
    s2id_id: null, // Global UUID for sync
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
        // Campos específicos por Secretaria (Mapping dos 12 templates .docx)
        setorial: {
            saude: { introducao: '', consideracoes: '', mortos: 0, feridos: 0, enfermos: 0, inst_danificadas: 0, inst_destruidas: 0, inst_valor: 0, prejuizo_medico: 0, prejuizo_epidemiologica: 0, prejuizo_sanitaria: 0, prejuizo_pragas: 0, prejuizo_total: 0, observacoes: '' },
            obras: { introducao: '', consideracoes: '', pontes_danificadas: 0, valor_pontes: 0, bueiros_obstruidos: 0, valor_bueiros: 0, pavimentacao_m2: 0, valor_pavimentacao: 0, prejuizo_total: 0, observacoes: '' }, // Obras Gerais
            educacao: { introducao: '', consideracoes: '', inst_danificadas: 0, inst_destruidas: 0, inst_valor: 0, prejuizo_ensino: 0, prejuizo_total: 0, observacoes: '' },
            social: { introducao: '', consideracoes: '', cestas_basicas: 0, custo_cestas: 0, kits_higiene: 0, custo_kits: 0, colchoes_entregues: 0, custo_colchoes: 0, familias_desabrigadas: 0, familias_desalojadas: 0, prejuizo_total: 0, observacoes: '' },
            agricultura: { introducao: '', consideracoes: '', inst_danificadas: 0, inst_destruidas: 0, inst_valor: 0, prejuizo_agricultura: 0, prejuizo_pecuaria: 0, prejuizo_total: 0, observacoes: '' },
            administracao: { introducao: '', consideracoes: '', inst_danificadas: 0, inst_destruidas: 0, inst_valor: 0, prejuizo_total: 0, observacoes: '' },
            cdl: { introducao: '', consideracoes: '', prejuizo_comercio: 0, prejuizo_servicos: 0, prejuizo_total: 0, observacoes: '' },
            cesan: { introducao: '', consideracoes: '', inst_danificadas: 0, inst_destruidas: 0, inst_valor: 0, prejuizo_abastecimento: 0, prejuizo_esgoto: 0, prejuizo_total: 0, observacoes: '' },
            defesa_social: { introducao: '', consideracoes: '', inst_danificadas: 0, inst_destruidas: 0, inst_valor: 0, prejuizo_seguranca: 0, prejuizo_total: 0, observacoes: '' },
            esporte_turismo: { introducao: '', consideracoes: '', inst_danificadas: 0, inst_destruidas: 0, inst_valor: 0, prejuizo_total: 0, observacoes: '' },
            interior: { introducao: '', consideracoes: '', ponte_madeira: 0, valor_ponte_madeira: 0, ponte_concreto: 0, valor_ponte_concreto: 0, bueiros: 0, valor_bueiros: 0, galerias: 0, valor_galerias: 0, estradas_vicinais: 0, valor_estradas: 0, inst_danificadas: 0, total_valor: 0, prejuizo_total: 0, observacoes: '' },
            servicos_urbanos: { introducao: '', consideracoes: '', inst_prestadoras: 0, valor_inst_prestadoras: 0, inst_comunitarias: 0, valor_inst_comunitarias: 0, infra_urbana: 0, valor_infra_urbana: 0, prejuizo_limpeza: 0, prejuizo_total: 0, observacoes: '' },
            transportes: { introducao: '', consideracoes: '', inst_danificadas: 0, inst_destruidas: 0, inst_valor: 0, prejuizo_transportes: 0, prejuizo_combustiveis: 0, prejuizo_total: 0, observacoes: '' }
        },
        // Controle de quem já preencheu
        submissoes_setoriais: {
            saude: { preenchido: false, data: null, usuario: '', responsavel: '', cargo: '', assinatura_url: null },
            obras: { preenchido: false, data: null, usuario: '', responsavel: '', cargo: '', assinatura_url: null },
            educacao: { preenchido: false, data: null, usuario: '', responsavel: '', cargo: '', assinatura_url: null },
            social: { preenchido: false, data: null, usuario: '', responsavel: '', cargo: '', assinatura_url: null },
            agricultura: { preenchido: false, data: null, usuario: '', responsavel: '', cargo: '', assinatura_url: null },
            administracao: { preenchido: false, data: null, usuario: '', responsavel: '', cargo: '', assinatura_url: null },
            cdl: { preenchido: false, data: null, usuario: '', responsavel: '', cargo: '', assinatura_url: null },
            cesan: { preenchido: false, data: null, usuario: '', responsavel: '', cargo: '', assinatura_url: null },
            defesa_social: { preenchido: false, data: null, usuario: '', responsavel: '', cargo: '', assinatura_url: null },
            esporte_turismo: { preenchido: false, data: null, usuario: '', responsavel: '', cargo: '', assinatura_url: null },
            interior: { preenchido: false, data: null, usuario: '', responsavel: '', cargo: '', assinatura_url: null },
            servicos_urbanos: { preenchido: false, data: null, usuario: '', responsavel: '', cargo: '', assinatura_url: null },
            transportes: { preenchido: false, data: null, usuario: '', responsavel: '', cargo: '', assinatura_url: null }
        },
        evidencias: [], // Array de { url, lat, lng, timestamp, sector }
        metadata_oficial: {
            nome_prefeito: 'Kleber Medici Costa', // Valor padrão para SMJ
            decreto_numero: '',
            decreto_data: '',
            decreto_vigencia: '180',
            protocolo_s2id: '',
            diario_oficial_info: '',
            justificativa_federal: '',
            reconhecimento_reconsideracao: false,
            processo_anterior_numero: '',
            beneficios_pretendidos: '',
            parecer_numero: '',
            // Campos para Portaria 260/2022
            rcl_anual: 0,
            intensidade: '', // Nível I, II ou III
            capacidade_resposta: '', // Local, Local+Estadual, etc
            plano_acionado: false,
            necessita_apoio: false
        },
        localizacao: {
            lat: null,
            lng: null,
            accuracy: null,
            timestamp: null
        },
        assinatura: { // Assinatura Global (Defesa Civil)
            responsavel: '',
            cargo: '',
            data_url: null,
            data_assinatura: null
        }
    }
};

/**
 * Pull S2ID records from Supabase and merge into local IndexedDB.
 * Returns merged array of all records.
 */
const pullS2idFromCloud = async () => {
    if (!navigator.onLine) return null;

    try {
        const { data, error } = await supabase
            .from('s2id_records')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('[S2ID] Cloud pull error:', error);
            return null;
        }

        if (!data || data.length === 0) return [];

        // Merge into local IndexedDB
        const db = await initDB();
        const tx = db.transaction('s2id_records', 'readwrite');
        const store = tx.objectStore('s2id_records');
        const allLocal = await store.getAll();

        // Build lookup maps
        const localByS2idId = new Map();
        const localBySupabaseId = new Map();
        for (const local of allLocal) {
            if (local.s2id_id) localByS2idId.set(local.s2id_id, local);
            if (local.supabase_id) localBySupabaseId.set(local.supabase_id, local);
        }

        for (const remote of data) {
            // Find local match by s2id_id (Business UUID) or supabase_id (DB UUID)
            const localMatch =
                localByS2idId.get(remote.s2id_id) ||
                localBySupabaseId.get(remote.id) ||
                null;

            // Skip if local has unsynced changes (local wins in conflict)
            if (localMatch && localMatch.synced === false) {
                continue;
            }

            const toStore = {
                ...remote,
                id: localMatch ? localMatch.id : undefined,
                supabase_id: remote.id,
                s2id_id: remote.s2id_id || localMatch?.s2id_id, // Ensure Business ID is preserved
                synced: true
            };
            delete toStore.id_local;

            await store.put(toStore);
        }

        await tx.done;
        console.log(`[S2ID] Merged ${data.length} records from cloud.`);
        return data;
    } catch (err) {
        console.error('[S2ID] Cloud pull failed:', err);
        return null;
    }
};

/**
 * Get the most recent draft S2id record
 */
export const getLatestDraftS2id = async () => {
    // Try cloud-first merge
    await pullS2idFromCloud();

    const db = await initDB();
    const records = await db.getAll('s2id_records');
    const drafts = records
        .filter(r => r.status === 'draft')
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    return drafts.length > 0 ? drafts[0] : null;
};

/**
 * Save or Update a S2id record locally (IndexedDB)
 */
export const saveS2idLocal = async (record) => {
    const db = await initDB();
    const toSave = {
        ...record,
        s2id_id: record.s2id_id || crypto.randomUUID(),
        updated_at: new Date().toISOString(),
        synced: false
    };
    const id = await db.put('s2id_records', toSave);

    // Trigger background sync if online
    if (navigator.onLine) {
        triggerSync().catch(err => console.error('Auto-sync failed:', err));
    }

    return id;
};

/**
 * Get all S2id records (Cloud-First: pulls from Supabase, merges, then returns local)
 */
export const getS2idRecords = async () => {
    // Pull from cloud and merge into local DB
    await pullS2idFromCloud();

    const db = await initDB();
    const records = await db.getAll('s2id_records');
    return records.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
};

/**
 * Get single S2id record by ID (with cloud fallback)
 */
export const getS2idById = async (id) => {
    const db = await initDB();
    let record = await db.get('s2id_records', parseInt(id));

    // If not found locally, try pulling from cloud
    if (!record && navigator.onLine) {
        await pullS2idFromCloud();
        record = await db.get('s2id_records', parseInt(id));
    }

    return record;
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
 * Sync all pending S2id records
 */
export const syncAllS2id = async () => {
    if (navigator.onLine) {
        await syncPendingData();
    }
};
