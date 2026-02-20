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
/**
 * Merges two S2ID data objects, prioritizing non-empty values and merging sectoral data.
 */
const mergeS2idData = (local, remote) => {
    if (!local) return remote;
    if (!remote) return local;

    // Deep merge helper for submissoes_setoriais (True wins)
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
                data: l.data || r.data,
                usuario: l.usuario || r.usuario
            };
        });
        return merged;
    };

    // Deep merge helper for numeric setorial fields (Highest value/Non-zero wins)
    const mergeSetorial = (locSet = {}, remSet = {}) => {
        const merged = { ...remSet, ...locSet };
        const sectors = new Set([...Object.keys(locSet), ...Object.keys(remSet)]);

        sectors.forEach(s => {
            const l = locSet[s] || {};
            const r = remSet[s] || {};
            merged[s] = { ...r, ...l };

            // Merge numeric fields: if one is non-zero and other is 0, take non-zero
            Object.keys(merged[s]).forEach(field => {
                if (typeof l[field] === 'number' && typeof r[field] === 'number') {
                    merged[s][field] = l[field] > 0 ? l[field] : r[field];
                }
            });
        });
        return merged;
    };

    return {
        ...remote,
        ...local,
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
export const deepRepairS2idDuplicates = async () => {
    const db = await initDB();
    const all = await db.getAll('s2id_records');

    // Group records by their "Identity" (Title + COBRADE)
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

        console.log(`[S2ID] Repairing duplicate group: ${identity} (${records.length} records)`);

        // Take the first active record as target, or the most recent if none are active
        const target = records.find(r => r.status !== 'deleted') || records[0];
        let master = target;

        for (const r of records) {
            if (r.id === target.id) continue;
            master = mergeS2idData(master, r);

            // Mark the duplicate for deletion
            if (r.id !== target.id) {
                const toDel = { ...r, status: 'deleted', synced: false, updated_at: new Date().toISOString() };
                await db.put('s2id_records', toDel);
            }
        }

        // Save master 
        master.status = 'submitted'; // Force active
        master.synced = false;
        master.updated_at = new Date().toISOString();
        await db.put('s2id_records', master);
        repairCount++;
    }

    if (navigator.onLine) triggerSync();
    return repairCount;
};

export const pullS2idFromCloud = async () => {
    if (!navigator.onLine) return null;

    try {
        const { data, error } = await supabase
            .from('s2id_records')
            .select('*');

        if (error) {
            console.error('[S2ID] Cloud pull error:', error);
            return null;
        }

        if (!data || data.length === 0) return [];

        const db = await initDB();
        const tx = db.transaction('s2id_records', 'readwrite');
        const store = tx.objectStore('s2id_records');
        const allLocal = await store.getAll();

        const localByS2idId = new Map();
        const localBySupabaseId = new Map();
        for (const local of allLocal) {
            if (local.s2id_id) localByS2idId.set(local.s2id_id, local);
            if (local.supabase_id) localBySupabaseId.set(local.supabase_id, local);
        }

        for (const remote of data) {
            const localMatch =
                (remote.s2id_id ? localByS2idId.get(remote.s2id_id) : null) ||
                localBySupabaseId.get(remote.id) ||
                null;

            // NEW: If local is dirty (unsynced), we MERGE instead of skipping.
            // This ensures sectoral updates from other devices get in.
            let toStore;
            if (localMatch && localMatch.synced === false) {
                console.log(`[S2ID] Merging local unsynced record ${remote.s2id_id}`);
                toStore = mergeS2idData(localMatch, remote);
                toStore.synced = false; // Keep it dirty so it pushes the merged version back up
            } else {
                toStore = {
                    ...remote,
                    id: localMatch ? localMatch.id : undefined,
                    supabase_id: remote.id,
                    s2id_id: remote.s2id_id || localMatch?.s2id_id,
                    synced: true
                };
            }

            delete toStore.id_local;
            await store.put(toStore);
        }

        await tx.done;
        return data;
    } catch (err) {
        console.error('[S2ID] Cloud pull failed:', err);
        return null;
    }
};

/**
 * NUCLEAR OPTION: Rebuilds S2ID storage from scratch.
 * 1. Backs up DRAFTS.
 * 2. WIPES the store.
 * 3. Downloads ALL from Supabase (Raw).
 * 4. Restores DRAFTS.
 * 5. Inserts ALL downloaded.
 */
export const rebuildS2idStorage = async () => {
    console.log('[S2ID] Starting REBUILD...');
    if (!navigator.onLine) throw new Error("Offline: Cannot rebuild.");

    const db = await initDB();

    // 1. Backup Drafts
    const all = await db.getAll('s2id_records');
    const drafts = all.filter(r => r.synced === false || r.status === 'draft');
    console.log(`[S2ID] Backing up ${drafts.length} drafts.`);

    // 2. Clear Store
    const txClear = db.transaction('s2id_records', 'readwrite');
    await txClear.objectStore('s2id_records').clear();
    await txClear.done;
    console.log('[S2ID] Store cleared.');

    // 3. Download RAW (No ordering, just data)
    const { data: remoteData, error } = await supabase.from('s2id_records').select('*');
    if (error) throw error;
    if (!remoteData) throw new Error("Supabase returned null data");

    console.log(`[S2ID] Downloaded ${remoteData.length} records.`);

    // 4. Insert Everything
    const txInsert = db.transaction('s2id_records', 'readwrite');
    const store = txInsert.objectStore('s2id_records');

    // Restore drafts first
    for (const draft of drafts) {
        // Keep their IDs to maintain state? Yes.
        await store.put(draft);
    }

    // Insert Remote
    for (const remote of remoteData) {
        const draftMatch = drafts.find(d => d.s2id_id === remote.s2id_id || d.supabase_id === remote.id);

        let toStore;
        if (draftMatch) {
            console.log(`[S2ID] Rebuild: Merging draft ${remote.s2id_id}`);
            toStore = mergeS2idData(draftMatch, remote);
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

    // Support both numeric local ID and UUID s2id_id
    let record = null;
    if (!isNaN(parseInt(id))) {
        record = await db.get('s2id_records', parseInt(id));
    }

    if (!record) {
        const all = await db.getAll('s2id_records');
        record = all.find(r => r.s2id_id === id || r.supabase_id === id);
    }

    // If not found locally, try pulling from cloud
    if (!record && navigator.onLine) {
        await pullS2idFromCloud();
        // Retry search
        if (!isNaN(parseInt(id))) {
            record = await db.get('s2id_records', parseInt(id));
        }
        if (!record) {
            const all = await db.getAll('s2id_records');
            record = all.find(r => r.s2id_id === id || r.supabase_id === id);
        }
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

/**
 * RESCUE: Finds deleted records with data and merges them into the active one.
 */
export const rescueDeletedS2idData = async () => {
    const db = await initDB();
    const all = await db.getAll('s2id_records');

    // 1. Find orphans (deleted but filled)
    const orphans = all.filter(r => r.status === 'deleted' && Object.values(r.data.submissoes_setoriais || {}).some(s => s.preenchido));
    if (orphans.length === 0) return 0;

    // 2. Find target (most recent active)
    const active = all
        .filter(r => r.status !== 'deleted')
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    if (active.length === 0) throw new Error("Nenhum registro ativo encontrado para receber os dados.");

    const target = active[0];
    let merged = target;

    for (const orphan of orphans) {
        console.log(`[S2ID] Rescuing data from orphan ${orphan.s2id_id} into ${target.s2id_id}`);
        merged = mergeS2idData(merged, orphan);
    }

    // Preserve target's core identity but update with rescued data
    merged.status = target.status;
    merged.id = target.id;
    merged.s2id_id = target.s2id_id;
    merged.supabase_id = target.supabase_id;
    merged.synced = false;
    merged.updated_at = new Date().toISOString();

    await db.put('s2id_records', merged);

    // Background sync
    if (navigator.onLine) triggerSync();

    return orphans.length;
};
