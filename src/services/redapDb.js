import { initDB, triggerSync, syncPendingData } from './db'
import { supabase } from './supabase'

/**
 * REDAP Database Service
 * Handles CRUD for REDAP records with auto-save and sync support.
 */

// Initial state for a new REDAP record
export const INITIAL_REDAP_STATE = {
    status: 'draft',
    tipo_registro: 'redap', // 'redap' ou 'ocorrencia'
    id_ocorrencia: null, // ID amigável/sequencial se necessário
    redap_id: null, // Global UUID for sync
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
            protocolo_redap: '',
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
/**
 * Merges two S2ID data objects, prioritizing non-empty values and merging sectoral data.
 */
export const mergeRedapData = (local, remote) => {
    if (!local) return remote;
    if (!remote) return local;

    // Helper: Best value wins (Non-empty string wins, Non-zero or larger number wins)
    const bestValue = (l, r) => {
        if (typeof l === 'string' && typeof r === 'string') {
            return (l.trim().length > 0) ? l : r;
        }
        if (typeof l === 'number' && typeof r === 'number') {
            return Math.max(l || 0, r || 0);
        }
        // Fallback: prioritize non-null/non-empty
        if (l === null || l === undefined || l === '') return r;
        if (r === null || r === undefined || r === '') return l;
        return l;
    };

    // Deep merge helper for submissoes_setoriais (True wins, Data wins)
    const mergeSubmissoes = (locSub = {}, remSub = {}) => {
        const merged = { ...remSub, ...locSub };
        const allKeys = new Set([...Object.keys(locSub), ...Object.keys(remSub)]);

        allKeys.forEach(key => {
            const l = locSub[key] || {};
            const r = remSub[key] || {};
            merged[key] = {
                ...r,
                ...l,
                preenchido: l.preenchido || r.preenchido, // TRUE WINS
                data: bestValue(l.data, r.data),
                usuario: bestValue(l.usuario, r.usuario),
                responsavel: bestValue(l.responsavel, r.responsavel),
                cargo: bestValue(l.cargo, r.cargo),
                assinatura_url: bestValue(l.assinatura_url, r.assinatura_url)
            };
        });
        return merged;
    };

    // Deep merge helper for numeric setorial fields (Highest value wins)
    const mergeSetorial = (locSet = {}, remSet = {}) => {
        const merged = { ...remSet, ...locSet };
        const sectors = new Set([...Object.keys(locSet), ...Object.keys(remSet)]);

        sectors.forEach(s => {
            const l = locSet[s] || {};
            const r = remSet[s] || {};
            const keys = new Set([...Object.keys(l), ...Object.keys(r)]);
            merged[s] = { ...r, ...l };

            keys.forEach(field => {
                merged[s][field] = bestValue(l[field], r[field]);
            });
        });
        return merged;
    };

    return {
        ...remote,
        ...local,
        status: (local.status === 'submitted' || remote.status === 'submitted') ? 'submitted' : bestValue(local.status, remote.status),
        data: {
            ...remote.data,
            ...local.data,
            setorial: mergeSetorial(local.data?.setorial, remote.data?.setorial),
            submissoes_setoriais: mergeSubmissoes(local.data?.submissoes_setoriais, remote.data?.submissoes_setoriais),
            metadata_oficial: {
                ...(remote.data?.metadata_oficial || {}),
                ...(local.data?.metadata_oficial || {})
            },
            evidencias: [
                ...(remote.data?.evidencias || []),
                ...(local.data?.evidencias || [])
            ].filter((v, i, a) => a.findIndex(t => t.url === v.url) === i)
        }
    };
};

/**
 * DEEP REPAIR: Merges and unifies duplicate records.
 */
export const deepRepairRedapDuplicates = async () => {
    const db = await initDB();
    const all = await db.getAll('redap_records');

    const groups = {};
    all.forEach(r => {
        if (r.status === 'deleted' && !Object.values(r.data.submissoes_setoriais || {}).some(s => s.preenchido)) return;
        const identity = `${r.data.tipificacao.cobrade}_${r.data.tipificacao.denominacao}`.toLowerCase().trim();
        if (!groups[identity]) groups[identity] = [];
        groups[identity].push(r);
    });

    let repairCount = 0;
    for (const identity in groups) {
        const records = groups[identity];
        if (records.length <= 1) continue;

        const target = records.find(r => r.status !== 'deleted') || records[0];
        let master = target;

        for (const r of records) {
            if (r.id === target.id) continue;
            master = mergeRedapData(master, r);
            if (r.id !== target.id) {
                const toDel = { ...r, status: 'deleted', synced: false, updated_at: new Date().toISOString() };
                await db.put('redap_records', toDel);
            }
        }

        master.status = 'submitted';
        master.synced = false;
        master.updated_at = new Date().toISOString();
        await db.put('redap_records', master);
        repairCount++;
    }

    if (navigator.onLine) triggerSync();
    return repairCount;
};

/**
 * GLOBAL FORCE RESCUE: Merges ALL records containing data into the first active one.
 */
export const forceRescueAllOrphanData = async () => {
    const db = await initDB();
    const all = await db.getAll('redap_records');

    const activeRecords = all.filter(r => r.status !== 'deleted');
    if (activeRecords.length === 0) throw new Error("Nenhum registro ativo encontrado.");

    const target = activeRecords.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];
    const sources = all.filter(r => {
        if (r.id === target.id) return false;
        return Object.values(r.data?.submissoes_setoriais || {}).some(s => s.preenchido);
    });

    if (sources.length === 0) return 0;

    let master = target;
    for (const src of sources) {
        master = mergeRedapData(master, src);
        const toDel = { ...src, status: 'deleted', synced: false, updated_at: new Date().toISOString() };
        await db.put('redap_records', toDel);
    }

    master.synced = false;
    master.updated_at = new Date().toISOString();
    await db.put('redap_records', master);

    if (navigator.onLine) triggerSync();
    return sources.length;
};

export const pullRedapFromCloud = async () => {
    if (!navigator.onLine) return null;

    console.log('[S2ID] Starting cloud pull...');

    try {
        const { data, error } = await supabase
            .from('redap_records')
            .select('*');

        if (error) {
            console.error('[S2ID] Cloud pull error:', error);
            return null;
        }

        if (!data || data.length === 0) {
            console.log('[S2ID] No remote records found.');
            return [];
        }

        console.log(`[S2ID] Downloaded ${data.length} records. Syncing to IndexedDB...`);

        const db = await initDB();
        const allLocal = await db.getAll('redap_records');
        const localByS2idId = new Map();
        const localBySupabaseId = new Map();

        allLocal.forEach(l => {
            if (l.s2id_id) localByS2idId.set(l.s2id_id, l);
            if (l.supabase_id) localBySupabaseId.set(l.supabase_id, l);
        });

        const tx = db.transaction('redap_records', 'readwrite');
        const store = tx.objectStore('redap_records');

        for (const remote of data) {
            const localMatch =
                (remote.s2id_id ? localByS2idId.get(remote.s2id_id) : null) ||
                localBySupabaseId.get(remote.id) ||
                null;

            let toStore;
            if (localMatch) {
                if (localMatch.synced === false) {
                    toStore = mergeS2idData(localMatch, remote);
                    toStore.synced = false;
                } else {
                    toStore = {
                        ...remote,
                        id: localMatch.id,
                        supabase_id: remote.id,
                        s2id_id: remote.s2id_id || localMatch.s2id_id,
                        synced: true
                    };
                }
            } else {
                toStore = {
                    ...remote,
                    supabase_id: remote.id,
                    synced: true
                };
            }

            delete toStore.id_local;
            store.put(toStore);
        }

        await tx.done;
        console.log(`[S2ID] Cloud pull complete. Processed ${data.length} records.`);
        return data;
    } catch (err) {
        console.error('[REDAP] Cloud pull failed:', err);
        return null;
    }
};


/**
 * NUCLEAR OPTION: Rebuilds REDAP storage from scratch.
 * 1. Backs up DRAFTS.
 * 2. WIPES the store.
 * 3. Downloads ALL from Supabase (Raw).
 * 4. Restores DRAFTS.
 * 5. Inserts ALL downloaded.
 */
export const rebuildRedapStorage = async () => {
    console.log('[REDAP] Starting REBUILD...');
    if (!navigator.onLine) throw new Error("Offline: Cannot rebuild.");

    const db = await initDB();

    // 1. Backup Drafts
    const all = await db.getAll('redap_records');
    const drafts = all.filter(r => r.synced === false || r.status === 'draft');
    console.log(`[REDAP] Backing up ${drafts.length} drafts.`);

    // 2. Clear Store
    const txClear = db.transaction('redap_records', 'readwrite');
    await txClear.objectStore('redap_records').clear();
    await txClear.done;
    console.log('[REDAP] Store cleared.');

    // 3. Download RAW (No ordering, just data)
    const { data: remoteData, error } = await supabase.from('redap_records').select('*');
    if (error) throw error;
    if (!remoteData) throw new Error("Supabase returned null data");

    console.log(`[REDAP] Downloaded ${remoteData.length} records.`);

    // 4. Insert Everything
    const txInsert = db.transaction('redap_records', 'readwrite');
    const store = txInsert.objectStore('redap_records');

    // Restore drafts first
    for (const draft of drafts) {
        // Keep their IDs to maintain state? Yes.
        await store.put(draft);
    }

    // Insert Remote
    for (const remote of remoteData) {
        const draftMatch = drafts.find(d => d.redap_id === remote.redap_id || d.supabase_id === remote.id);

        let toStore;
        if (draftMatch) {
            console.log(`[REDAP] Rebuild: Merging draft ${remote.redap_id}`);
            toStore = mergeRedapData(draftMatch, remote);
            toStore.synced = false; // Keep it as a draft so it can sync back
        } else {
            toStore = {
                ...remote,
                supabase_id: remote.id,
                synced: true
            };
        }
        await store.put(toStore);
    }

    await txInsert.done;
    return remoteData.length;
};

/**
 * Get the most recent draft REDAP record
 */
export const getLatestDraftRedap = async () => {
    // Try cloud-first merge
    await pullRedapFromCloud();

    const db = await initDB();
    const records = await db.getAll('redap_records');
    const drafts = records
        .filter(r => r.status === 'draft')
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    return drafts.length > 0 ? drafts[0] : null;
};

/**
 * Save or Update a REDAP record locally (IndexedDB)
 */
export const saveRedapLocal = async (record) => {
    const db = await initDB();
    const toSave = {
        ...record,
        redap_id: record.redap_id || crypto.randomUUID(),
        updated_at: new Date().toISOString(),
        synced: false
    };
    const id = await db.put('redap_records', toSave);

    // Trigger background sync if online
    if (navigator.onLine) {
        triggerSync().catch(err => console.error('Auto-sync failed:', err));
    }

    return id;
};

/**
 * Get all REDAP records (Cloud-First: pulls from Supabase, merges, then returns local)
 */
export const getRedapRecords = async () => {
    // Pull from cloud and merge into local DB
    await pullRedapFromCloud();

    const db = await initDB();
    const records = await db.getAll('redap_records');
    return records.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
};

/**
 * Get single REDAP record by ID (with cloud fallback)
 */
export const getRedapById = async (id) => {
    const db = await initDB();

    // Support both numeric local ID and UUID redap_id
    let record = null;
    if (!isNaN(parseInt(id))) {
        record = await db.get('redap_records', parseInt(id));
    }

    if (!record) {
        const all = await db.getAll('redap_records');
        record = all.find(r => r.redap_id === id || r.supabase_id === id);
    }

    // If not found locally, try pulling from cloud
    if (!record && navigator.onLine) {
        await pullRedapFromCloud();
        // Retry search
        if (!isNaN(parseInt(id))) {
            record = await db.get('redap_records', parseInt(id));
        }
        if (!record) {
            const all = await db.getAll('redap_records');
            record = all.find(r => r.redap_id === id || r.supabase_id === id);
        }
    }

    return record;
};

/**
 * Delete REDAP record (soft delete)
 */
export const deleteRedapLocal = async (id) => {
    const db = await initDB();
    const record = await db.get('redap_records', parseInt(id));
    if (record) {
        record.status = 'deleted';
        record.deleted_at = new Date().toISOString();
        record.synced = false;
        await db.put('redap_records', record);

        if (navigator.onLine) {
            triggerSync();
        }
    }
};

/**
 * Sync all pending REDAP records
 */
export const syncAllRedap = async () => {
    if (navigator.onLine) {
        await syncPendingData();
    }
};
