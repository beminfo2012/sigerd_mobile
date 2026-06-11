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
        identificacao_evento: {
            secretaria_orgao: '',
            responsavel_preenchimento: '',
            cargo_funcao: '',
            telefone: '',
            email: '',
            data_preenchimento: '',
            municipio_uf: 'Santa Maria de Jetibá / ES',
            area_afetada_localidade: '',
            decreto_municipal: ''
        },
        danos_humanos: {
            mortos_confirmados: { total: 0, homens: 0, mulheres: 0, criancas: 0 },
            desaparecidos: { total: 0, homens: 0, mulheres: 0, criancas: 0 },
            feridos_graves: { total: 0, homens: 0, mulheres: 0, criancas: 0 },
            feridos_leves: { total: 0, homens: 0, mulheres: 0, criancas: 0 },
            enfermos: { total: 0, homens: 0, mulheres: 0, criancas: 0 },
            desabrigados: { total: 0, homens: 0, mulheres: 0, criancas: 0 },
            desalojados: { total: 0, homens: 0, mulheres: 0, criancas: 0 },
            deslocados_temporariamente: { total: 0, homens: 0, mulheres: 0, criancas: 0 },
            diretamente_afetados: { total: 0, homens: 0, mulheres: 0, criancas: 0 },
            descricao: ''
        },
        danos_materiais: {
            residencias_urbanas: { destruidas: 0, danificadas: 0, total: 0, prejuizo: 0 },
            residencias_rurais: { destruidas: 0, danificadas: 0, total: 0, prejuizo: 0 },
            escolas_creches: { destruidas: 0, danificadas: 0, total: 0, prejuizo: 0 },
            unidades_saude: { destruidas: 0, danificadas: 0, total: 0, prejuizo: 0 },
            edificacoes_publicas: { destruidas: 0, danificadas: 0, total: 0, prejuizo: 0 },
            templos_culto: { destruidas: 0, danificadas: 0, total: 0, prejuizo: 0 },
            comercio: { destruidas: 0, danificadas: 0, total: 0, prejuizo: 0 },
            industria: { destruidas: 0, danificadas: 0, total: 0, prejuizo: 0 }
        },
        danos_infraestrutura: {
            estradas_rodovias: { qtd: 0, extensao_area: 0, prejuizo: 0, unidade: 'km' },
            pontes_viadutos: { qtd: 0, extensao_area: 0, prejuizo: 0, unidade: 'unidade(s)' },
            bueiros_galerias: { qtd: 0, extensao_area: 0, prejuizo: 0, unidade: 'unidade(s)' },
            abastecimento_agua: { qtd: 0, extensao_area: 0, prejuizo: 0, unidade: 'km' },
            rede_esgoto: { qtd: 0, extensao_area: 0, prejuizo: 0, unidade: 'km' },
            drenagem_urbana: { qtd: 0, extensao_area: 0, prejuizo: 0, unidade: 'km' },
            rede_eletrica: { qtd: 0, extensao_area: 0, prejuizo: 0, unidade: 'km / postes' },
            comunicacoes_telefonia: { qtd: 0, extensao_area: 0, prejuizo: 0, unidade: 'km' },
            muros_arrimo: { qtd: 0, extensao_area: 0, prejuizo: 0, unidade: 'm' },
            drenagem_canais: { qtd: 0, extensao_area: 0, prejuizo: 0, unidade: 'm' }
        },
        danos_agricolas: {
            nao_se_aplica: true,
            itens: [] // array of { cultura_produto: '', area: 0, produtores: 0, animais: 0, perda: 0, prejuizo: 0 }
        },
        danos_ambientais: {
            vegetacao_nativa: { quantidade: 0, prejuizo: 0, unidade: 'hectares (ha)' },
            contaminacao_agua: { quantidade: 0, prejuizo: 0, unidade: 'km de curso d\'água' },
            erosao_app: { quantidade: 0, prejuizo: 0, unidade: 'm²' },
            animais_silvestres: { quantidade: 0, prejuizo: 0, unidade: 'indivíduos' },
            descricao: ''
        },
        prejuizos_economicos_consolidados: {
            edificacoes: { danos: 0, prejuizos: 0 },
            infraestrutura: { danos: 0, prejuizos: 0 },
            agricola: { danos: 0, prejuizos: 0 },
            comercial_industrial: { danos: 0, prejuizos: 0 },
            meio_ambiente: { danos: 0, prejuizos: 0 }
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
            saude: { consideracoes: '', mortos: 0, feridos: 0, enfermos: 0, inst_danificadas: 0, inst_destruidas: 0, inst_valor: 0, prejuizo_medico: 0, prejuizo_epidemiologica: 0, prejuizo_sanitaria: 0, prejuizo_pragas: 0, prejuizo_total: 0, observacoes: '' },
            obras: { consideracoes: '', pontes_danificadas: 0, valor_pontes: 0, bueiros_obstruidos: 0, valor_bueiros: 0, pavimentacao_m2: 0, valor_pavimentacao: 0, prejuizo_total: 0, observacoes: '' }, // Obras Gerais
            educacao: { consideracoes: '', inst_danificadas: 0, inst_destruidas: 0, inst_valor: 0, prejuizo_ensino: 0, prejuizo_total: 0, observacoes: '' },
            social: { consideracoes: '', cestas_basicas: 0, custo_cestas: 0, kits_higiene: 0, custo_kits: 0, colchoes_entregues: 0, custo_colchoes: 0, familias_desabrigadas: 0, familias_desalojadas: 0, prejuizo_total: 0, observacoes: '' },
            agricultura: { consideracoes: '', inst_danificadas: 0, inst_destruidas: 0, inst_valor: 0, prejuizo_agricultura: 0, prejuizo_pecuaria: 0, prejuizo_total: 0, observacoes: '' },
            administracao: { consideracoes: '', inst_danificadas: 0, inst_destruidas: 0, inst_valor: 0, prejuizo_total: 0, observacoes: '' },
            cdl: { consideracoes: '', prejuizo_comercio: 0, prejuizo_servicos: 0, prejuizo_total: 0, observacoes: '' },
            cesan: { consideracoes: '', inst_danificadas: 0, inst_destruidas: 0, inst_valor: 0, prejuizo_abastecimento: 0, prejuizo_esgoto: 0, prejuizo_total: 0, observacoes: '' },
            defesa_social: { consideracoes: '', inst_danificadas: 0, inst_destruidas: 0, inst_valor: 0, prejuizo_seguranca: 0, prejuizo_total: 0, observacoes: '' },
            esporte_turismo: { consideracoes: '', inst_danificadas: 0, inst_destruidas: 0, inst_valor: 0, prejuizo_total: 0, observacoes: '' },
            interior: { consideracoes: '', ponte_madeira: 0, valor_ponte_madeira: 0, ponte_concreto: 0, valor_ponte_concreto: 0, bueiros: 0, valor_bueiros: 0, galerias: 0, valor_galerias: 0, estradas_vicinais: 0, valor_estradas: 0, inst_danificadas: 0, total_valor: 0, prejuizo_total: 0, observacoes: '' },
            servicos_urbanos: { consideracoes: '', inst_prestadoras: 0, valor_inst_prestadoras: 0, inst_comunitarias: 0, valor_inst_comunitarias: 0, infra_urbana: 0, valor_infra_urbana: 0, prejuizo_limpeza: 0, prejuizo_total: 0, observacoes: '' },
            transportes: { consideracoes: '', inst_danificadas: 0, inst_destruidas: 0, inst_valor: 0, prejuizo_transportes: 0, prejuizo_combustiveis: 0, prejuizo_total: 0, observacoes: '' },
            cultura: { consideracoes: '', inst_danificadas: 0, inst_destruidas: 0, inst_valor: 0, prejuizo_total: 0, observacoes: '' },
            meio_ambiente: { consideracoes: '', inst_danificadas: 0, inst_destruidas: 0, inst_valor: 0, prejuizo_total: 0, observacoes: '' },
            defesa_civil: { consideracoes: '', inst_danificadas: 0, inst_destruidas: 0, inst_valor: 0, prejuizo_total: 0, observacoes: '' }
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
            transportes: { preenchido: false, data: null, usuario: '', responsavel: '', cargo: '', assinatura_url: null },
            cultura: { preenchido: false, data: null, usuario: '', responsavel: '', cargo: '', assinatura_url: null },
            meio_ambiente: { preenchido: false, data: null, usuario: '', responsavel: '', cargo: '', assinatura_url: null },
            defesa_civil: { preenchido: false, data: null, usuario: '', responsavel: '', cargo: '', assinatura_url: null }
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
        },
        fluxo_aprovacao: {
            etapa1: { concluida: false, data: '', ator: '' },
            etapa2: { concluida: false, data: '', ator: '' },
            etapa3: { concluida: false, data: '', ator: '' },
            etapa4: { concluida: false, data: '', ator: '' },
            etapa5: { concluida: false, data: '', ator: '' }
        },
        historico_acoes: [],
        observacoes_complementares: ''
    }
};

/**
 * Pull REDAP records from Supabase and merge into local IndexedDB.
 * Returns merged array of all records.
 */
/**
 * Merges two REDAP data objects, prioritizing non-empty values and merging sectoral data.
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

    // Deep merge helper for structured forms
    const deepMerge = (l, r) => {
        if (l === null || l === undefined) return r;
        if (r === null || r === undefined) return l;
        if (typeof l !== 'object' || typeof r !== 'object') return bestValue(l, r);
        if (Array.isArray(l) || Array.isArray(r)) {
            return (l && l.length >= (r ? r.length : 0)) ? l : r;
        }
        const merged = { ...r, ...l };
        for (const key in merged) {
            merged[key] = deepMerge(l[key], r[key]);
        }
        return merged;
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
            tipificacao: deepMerge(local.data?.tipificacao, remote.data?.tipificacao),
            data_ocorrencia: deepMerge(local.data?.data_ocorrencia, remote.data?.data_ocorrencia),
            identificacao_evento: deepMerge(local.data?.identificacao_evento, remote.data?.identificacao_evento),
            danos_humanos: deepMerge(local.data?.danos_humanos, remote.data?.danos_humanos),
            danos_materiais: deepMerge(local.data?.danos_materiais, remote.data?.danos_materiais),
            danos_infraestrutura: deepMerge(local.data?.danos_infraestrutura, remote.data?.danos_infraestrutura),
            danos_agricolas: deepMerge(local.data?.danos_agricolas, remote.data?.danos_agricolas),
            danos_ambientais: deepMerge(local.data?.danos_ambientais, remote.data?.danos_ambientais),
            prejuizos_economicos_consolidados: deepMerge(local.data?.prejuizos_economicos_consolidados, remote.data?.prejuizos_economicos_consolidados),
            prejuizos_publicos: deepMerge(local.data?.prejuizos_publicos, remote.data?.prejuizos_publicos),
            prejuizos_privados: deepMerge(local.data?.prejuizos_privados, remote.data?.prejuizos_privados),
            setorial: mergeSetorial(local.data?.setorial, remote.data?.setorial),
            submissoes_setoriais: mergeSubmissoes(local.data?.submissoes_setoriais, remote.data?.submissoes_setoriais),
            metadata_oficial: deepMerge(local.data?.metadata_oficial, remote.data?.metadata_oficial),
            localizacao: deepMerge(local.data?.localizacao, remote.data?.localizacao),
            assinatura: deepMerge(local.data?.assinatura, remote.data?.assinatura),
            fluxo_aprovacao: deepMerge(local.data?.fluxo_aprovacao, remote.data?.fluxo_aprovacao),
            historico_acoes: deepMerge(local.data?.historico_acoes, remote.data?.historico_acoes),
            observacoes_complementares: bestValue(local.data?.observacoes_complementares, remote.data?.observacoes_complementares),
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

let _pullLock = false;
let _lastRedapPull = 0;
const REDAP_COOLDOWN = 30 * 1000; // 30 seconds cooldown

export const pullRedapFromCloud = async (force = false) => {
    if (!navigator.onLine) return null;

    const now = Date.now();
    if (!force && (now - _lastRedapPull < REDAP_COOLDOWN)) {
        console.log('[REDAP] Pull cooldown active. Skipping.');
        return null;
    }

    if (_pullLock) {
        console.log('[REDAP] Pull already in progress. Skipping.');
        return null;
    }
    _pullLock = true;

    console.log('[REDAP] Starting cloud pull...');
    const lastSync = localStorage.getItem('last_redap_sync');

    try {
        let query = supabase.from('redap_records').select('*');

        if (lastSync && !force) {
            console.log(`[REDAP] Incremental pull since ${lastSync}`);
            query = query.gt('updated_at', lastSync);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[S2ID] Cloud pull error:', error);
            return null;
        }

        if (!data || data.length === 0) {
            console.log('[REDAP] No new or updated records found.');
            _lastRedapPull = Date.now();
            return [];
        }

        console.log(`[REDAP] Downloaded ${data.length} records. Syncing to IndexedDB...`);

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
                    toStore = mergeRedapData(localMatch, remote);
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
        console.log(`[REDAP] Cloud pull complete. Processed ${data.length} records.`);
        _lastRedapPull = Date.now();
        localStorage.setItem('last_redap_sync', new Date().toISOString());
        return data;
    } catch (err) {
        console.error('[REDAP] Cloud pull failed:', err);
        return null;
    } finally {
        _pullLock = false;
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
    if (typeof id === 'number' || /^\d+$/.test(String(id))) {
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
        if (typeof id === 'number' || /^\d+$/.test(String(id))) {
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

/**
 * Consolidate event sector reports into a master FIDE redap_records entry
 */
export const consolidateEventFide = async (eventId) => {
    const db = await initDB();
    
    // 1. Get Event Info
    let eventObj = await db.get('redap_eventos', eventId);
    if (!eventObj && navigator.onLine) {
        const { data, error } = await supabase.from('redap_eventos').select('*').eq('id', eventId).single();
        if (!error && data) {
            eventObj = data;
        }
    }
    if (!eventObj) throw new Error("Desastre não encontrado.");
    
    // 2. Get Approved Registrations (Sector damages)
    let regs = [];
    if (navigator.onLine) {
        const { data, error } = await supabase.from('redap_registros').select('*').eq('evento_id', eventId).eq('status_validacao', 'Aprovado');
        if (!error && data) {
            regs = data;
        }
    } else {
        const allRegs = await db.getAll('redap_registros');
        regs = allRegs.filter(r => r.evento_id === eventId && r.status_validacao === 'Aprovado');
    }
    
    if (regs.length === 0) {
        throw new Error("Nenhum lançamento setorial Aprovado para consolidar.");
    }
    
    // 3. Find if there's already a redap_records entry for this event
    const allRecords = await db.getAll('redap_records');
    let fideRecord = allRecords.find(r => r.redap_id === eventId || r.supabase_id === eventId);
    
    if (!fideRecord && navigator.onLine) {
        const { data, error } = await supabase.from('redap_records').select('*').eq('redap_id', eventId).maybeSingle();
        if (!error && data) {
            fideRecord = data;
        }
    }
    
    // 4. Initialize or Reset FIDE Data
    const baseData = JSON.parse(JSON.stringify(INITIAL_REDAP_STATE.data));
    
    // Set Event Metadata
    baseData.tipificacao.cobrade = eventObj.cobrade || '';
    baseData.tipificacao.denominacao = eventObj.nome_evento || '';
    
    const eventDate = new Date(eventObj.data_inicio);
    baseData.data_ocorrencia = {
        dia: String(eventDate.getDate()).padStart(2, '0'),
        mes: String(eventDate.getMonth() + 1).padStart(2, '0'),
        ano: String(eventDate.getFullYear()),
        horario: `${String(eventDate.getHours()).padStart(2, '0')}:${String(eventDate.getMinutes()).padStart(2, '0')}`
    };
    
    baseData.identificacao_evento.area_afetada_localidade = eventObj.bairros_afetados ? eventObj.bairros_afetados.join(', ') : '';
    
    if (fideRecord) {
        // Keep user-entered metadata, localizacao, assinatura, etc.
        baseData.metadata_oficial = { ...baseData.metadata_oficial, ...fideRecord.data?.metadata_oficial };
        baseData.localizacao = { ...baseData.localizacao, ...fideRecord.data?.localizacao };
        baseData.assinatura = { ...baseData.assinatura, ...fideRecord.data?.assinatura };
        baseData.fluxo_aprovacao = { ...baseData.fluxo_aprovacao, ...fideRecord.data?.fluxo_aprovacao };
        baseData.observacoes_complementares = fideRecord.data?.observacoes_complementares || '';
    }
    
    // Helper mapping functions:
    const mapSectorKey = (secName) => {
        const map = {
            'Saúde': 'saude',
            'Educação': 'educacao',
            'Agropecuária': 'agricultura',
            'Agricultura': 'agricultura',
            'Interior': 'interior',
            'Obras': 'obras',
            'Meio Ambiente': 'meio_ambiente',
            'Assistência Social': 'social',
            'Serviços Urbanos': 'servicos_urbanos',
            'Administração': 'administracao',
            'Defesa Social': 'defesa_social',
            'Esporte e Turismo': 'esporte_turismo',
            'Cesan': 'cesan',
            'Transportes': 'transportes',
            'CDL': 'cdl',
            'Cultura': 'cultura',
            'Defesa Civil': 'defesa_civil'
        };
        return map[secName] || secName.toLowerCase().replace(/ /g, '_');
    };
    
    // Process registrations
    regs.forEach(reg => {
        const secKey = mapSectorKey(reg.secretaria_responsavel);
        const p = reg.extra_parameters || {};
        const valor = Number(reg.valor_estimado) || 0;
        
        // 1. Sector level
        if (baseData.setorial[secKey]) {
            const sObj = baseData.setorial[secKey];
            
            // Sum up standard fields
            if (p.mortos) sObj.mortos = (sObj.mortos || 0) + Number(p.mortos);
            if (p.feridos) sObj.feridos = (sObj.feridos || 0) + Number(p.feridos);
            if (p.enfermos) sObj.enfermos = (sObj.enfermos || 0) + Number(p.enfermos);
            if (p.desabrigados) sObj.familias_desabrigadas = (sObj.familias_desabrigadas || 0) + Number(p.desabrigados);
            if (p.desalojados) sObj.familias_desalojadas = (sObj.familias_desalojadas || 0) + Number(p.desalojados);
            
            if (p.qtd_danificada) sObj.inst_danificadas = (sObj.inst_danificadas || 0) + Number(p.qtd_danificada);
            if (p.qtd_destruida) sObj.inst_destruidas = (sObj.inst_destruidas || 0) + Number(p.qtd_destruida);
            if (valor > 0) sObj.inst_valor = (sObj.inst_valor || 0) + valor;
            
            // Sector specific fields (dynamic attributes)
            Object.keys(p).forEach(key => {
                if (!['mortos', 'feridos', 'enfermos', 'qtd_danificada', 'qtd_destruida', 'desabrigados', 'desalojados'].includes(key)) {
                    if (typeof p[key] === 'number') {
                        sObj[key] = (sObj[key] || 0) + p[key];
                    } else if (typeof p[key] === 'string' && !isNaN(Number(p[key]))) {
                        sObj[key] = (sObj[key] || 0) + Number(p[key]);
                    } else {
                        sObj[key] = p[key]; // string / boolean
                    }
                }
            });
            sObj.prejuizo_total = (sObj.prejuizo_total || 0) + valor;
        }
        
        // Mark sector submission
        if (baseData.submissoes_setoriais[secKey]) {
            baseData.submissoes_setoriais[secKey] = {
                preenchido: true,
                data: reg.created_at || new Date().toISOString(),
                usuario: reg.responsavel_nome || '',
                responsavel: reg.responsavel_nome || '',
                cargo: reg.responsavel_cargo || '',
                assinatura_url: reg.assinatura_url || null
            };
        }
        
        // Collect evidences
        if (reg.fotos && reg.fotos.length > 0) {
            reg.fotos.forEach(f => {
                const photoUrl = f.url || f.data;
                if (photoUrl && !baseData.evidencias.some(e => e.url === photoUrl)) {
                    baseData.evidencias.push({
                        url: photoUrl,
                        lat: f.lat != null ? f.lat : (reg.latitude != null ? reg.latitude : null),
                        lng: f.lng != null ? f.lng : (reg.longitude != null ? reg.longitude : null),
                        timestamp: f.timestamp || reg.created_at || new Date().toISOString(),
                        sector: secKey
                    });
                }
            });
        }
        
        // 2. Global FIDE level
        const descLower = ((reg.instalacao_afetada || '') + ' ' + (reg.descricao_detalhada || '')).toLowerCase();
        
        if (reg.classificacao_dano === 'Dano Humano') {
            const dh = baseData.danos_humanos;
            if (p.mortos) dh.mortos_confirmados.total += Number(p.mortos);
            if (p.feridos) dh.feridos_graves.total += Number(p.feridos);
            if (p.enfermos) dh.enfermos.total += Number(p.enfermos);
            if (p.desabrigados) dh.desabrigados.total += Number(p.desabrigados);
            if (p.desalojados) dh.desalojados.total += Number(p.desalojados);
            if (p.desaparecidos) dh.desaparecidos.total += Number(p.desaparecidos);
            
            if (reg.descricao_detalhada) {
                dh.descricao = (dh.descricao ? dh.descricao + '; ' : '') + reg.descricao_detalhada;
            }
        } 
        else if (reg.classificacao_dano === 'Dano Material') {
            // Determine if infrastructure or building
            const isInfra = descLower.match(/(estrada|rodovia|vicinal|rua|pavimento|pavimentação|calçada|via|ponte|viaduto|pontilhão|passarela|bueiro|galeria|água|abastecimento|esgoto|drenagem|elétrica|poste|energia|comunicação|telefonia|internet|arrimo|contenção|canal)/);
            
            if (isInfra) {
                // Map to danos_infraestrutura
                let key = 'estradas_rodovias';
                if (descLower.match(/(ponte|viaduto|pontilhão|passarela)/)) key = 'pontes_viadutos';
                else if (descLower.match(/(bueiro|galeria)/)) key = 'bueiros_galerias';
                else if (descLower.match(/(água|abastecimento)/)) key = 'abastecimento_agua';
                else if (descLower.match(/esgoto/)) key = 'rede_esgoto';
                else if (descLower.match(/drenagem.*urbana/)) key = 'drenagem_urbana';
                else if (descLower.match(/(elétrica|poste|energia)/)) key = 'rede_eletrica';
                else if (descLower.match(/(comunicação|telefonia|internet)/)) key = 'comunicacoes_telefonia';
                else if (descLower.match(/(arrimo|contenção)/)) key = 'muros_arrimo';
                else if (descLower.match(/canal/)) key = 'drenagem_canais';
                
                const infraObj = baseData.danos_infraestrutura[key];
                infraObj.qtd += (Number(p.qtd_danificada) || 0) + (Number(p.qtd_destruida) || 0) || 1;
                if (p.extensao_km) infraObj.extensao_area += Number(p.extensao_km);
                else if (p.area_afetada_m2) infraObj.extensao_area += Number(p.area_afetada_m2);
                infraObj.prejuizo += valor;
            } else {
                // Map to danos_materiais (buildings)
                let key = 'edificacoes_publicas';
                if (descLower.match(/(casa|residência|lar|moradia)/)) {
                    key = secKey === 'interior' ? 'residencias_rurais' : 'residencias_urbanas';
                } else if (descLower.match(/(escola|creche|cmei|colégio)/)) key = 'escolas_creches';
                else if (descLower.match(/(hospital|posto de saúde|ubs|pa|clínica)/)) key = 'unidades_saude';
                else if (descLower.match(/(igreja|templo|capela|culto)/)) key = 'templos_culto';
                else if (descLower.match(/(loja|comércio|mercado)/)) key = 'comercio';
                else if (descLower.match(/(indústria|fábrica)/)) key = 'industria';
                
                const matObj = baseData.danos_materiais[key];
                matObj.danificadas += Number(p.qtd_danificada) || 0;
                matObj.destruidas += Number(p.qtd_destruida) || 0;
                matObj.total += (Number(p.qtd_danificada) || 0) + (Number(p.qtd_destruida) || 0) || 1;
                matObj.prejuizo += valor;
            }
        }
        else if (reg.classificacao_dano === 'Dano Ambiental' || secKey === 'meio_ambiente') {
            let key = 'vegetacao_nativa';
            if (descLower.match(/(água|rio|córrego|nascente|lago)/)) key = 'contaminacao_agua';
            else if (descLower.match(/(erosão|assoreamento|app)/)) key = 'erosao_app';
            else if (descLower.match(/(animal|fauna|silvestre)/)) key = 'animais_silvestres';
            
            const ambObj = baseData.danos_ambientais[key];
            ambObj.quantidade += Number(p.area_atingida_ha) || Number(p.quantidade) || 1;
            ambObj.prejuizo += valor;
            
            if (reg.descricao_detalhada) {
                baseData.danos_ambientais.descricao = (baseData.danos_ambientais.descricao ? baseData.danos_ambientais.descricao + '; ' : '') + reg.descricao_detalhada;
            }
        }
        else if (reg.classificacao_dano === 'Prejuízo Econômico') {
            // Map to public/private damage
            if (descLower.match(/(saúde|médica|ubs|hospital)/)) baseData.prejuizos_publicos.assistencia_medica += valor;
            else if (descLower.match(/(água|abastecimento)/)) baseData.prejuizos_publicos.abastecimento_agua += valor;
            else if (descLower.match(/esgoto/)) baseData.prejuizos_publicos.esgoto_sanitario += valor;
            else if (descLower.match(/(limpeza|entulho|desobstrução)/)) baseData.prejuizos_publicos.limpeza_urbana += valor;
            else if (descLower.match(/(desinfecção|desinfestação|praga)/)) baseData.prejuizos_publicos.desinfestacao += valor;
            else if (descLower.match(/(energia|eletricidade|postes)/)) baseData.prejuizos_publicos.energia_eletrica += valor;
            else if (descLower.match(/(telecomunicações|telefonia|internet)/)) baseData.prejuizos_publicos.telecomunicacoes += valor;
            else if (descLower.match(/(ensino|escola|educação)/)) baseData.prejuizos_publicos.ensino += valor;
            else if (descLower.match(/(segurança|polícia|guarda)/)) baseData.prejuizos_publicos.seguranca_publica += valor;
            else if (descLower.match(/(combustível|posto)/)) baseData.prejuizos_publicos.combustiveis += valor;
            else if (descLower.match(/(transporte|rodoviário)/)) baseData.prejuizos_publicos.transportes += valor;
            
            // Privados
            else if (descLower.match(/(agricultura|cultura|plantação|lavoura)/)) baseData.prejuizos_privados.agricultura += valor;
            else if (descLower.match(/(pecuária|gado|animais)/)) baseData.prejuizos_privados.pecuaria += valor;
            else if (descLower.match(/(indústria|fábrica)/)) baseData.prejuizos_privados.industria += valor;
            else if (descLower.match(/(loja|comércio|cdl)/)) baseData.prejuizos_privados.comercio += valor;
            else baseData.prejuizos_privados.servicos += valor;
        }
    });
    
    // 3. Populate Prejuízos Econômicos Consolidados
    const dm = baseData.danos_materiais;
    baseData.prejuizos_economicos_consolidados.edificacoes.danos = 
        (dm.residencias_urbanas.prejuizo || 0) + 
        (dm.residencias_rurais.prejuizo || 0) + 
        (dm.escolas_creches.prejuizo || 0) + 
        (dm.unidades_saude.prejuizo || 0) + 
        (dm.edificacoes_publicas.prejuizo || 0) + 
        (dm.templos_culto.prejuizo || 0);
    
    let infraTotal = 0;
    Object.values(baseData.danos_infraestrutura).forEach(val => {
        if (typeof val === 'object' && val.prejuizo) infraTotal += val.prejuizo;
    });
    baseData.prejuizos_economicos_consolidados.infraestrutura.danos = infraTotal;
    
    baseData.prejuizos_economicos_consolidados.comercial_industrial.danos = 
        (dm.comercio.prejuizo || 0) + 
        (dm.industria.prejuizo || 0);
        
    let envTotal = 0;
    Object.values(baseData.danos_ambientais).forEach(val => {
        if (typeof val === 'object' && val.prejuizo) envTotal += val.prejuizo;
    });
    baseData.prejuizos_economicos_consolidados.meio_ambiente.danos = envTotal;
    
    const consolidatedRecord = {
        ...(fideRecord || {}),
        id: fideRecord ? fideRecord.id : undefined,
        redap_id: eventId,
        status: fideRecord ? fideRecord.status : 'draft',
        data: baseData,
        updated_at: new Date().toISOString()
    };
    
    const savedId = await saveRedapLocal(consolidatedRecord);
    return savedId;
};
