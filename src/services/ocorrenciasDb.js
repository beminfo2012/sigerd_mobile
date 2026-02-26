import { initDB, syncSingleItem } from './db'
import { supabase } from './supabase'

/**
 * Operational Occurrences Database Service
 * Handles CRUD and Sync for the dedicated 'ocorrencias_operacionais' table.
 */
// ... (Initial state remains same)
export const INITIAL_OCORRENCIA_STATE = {
    ocorrencia_id_format: '', // format: 001/2026
    agente: '',              // Responsável Técnico
    matricula: '',
    solicitante: '',
    cpf: '',
    telefone: '',
    temSolicitanteEspecifico: false,
    endereco: '',
    bairro: '',
    unidade_consumidora: '',
    data_ocorrencia: new Date().toLocaleDateString('pt-BR'),
    horario_ocorrencia: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    lat: null,
    lng: null,
    accuracy: null,
    gps_timestamp: null,
    mortos: 0,
    feridos: 0,
    enfermos: 0,
    desalojados: 0,
    desabrigados: 0,
    desaparecidos: 0,
    outros_afetados: 0,
    tem_danos_humanos: false,
    categoriaRisco: '',
    nivelRisco: '',
    subtiposRisco: [],
    checklistRespostas: {},
    descricao_danos: '',
    observacoes: '',
    fotos: [],               // Photos array [ { id, data, legenda } ]
    assinaturaAgente: null,
    assinaturaAssistido: null,
    temApoioTecnico: false,
    apoioTecnico: {
        nome: '',
        crea: '',
        matricula: '',
        assinatura: null
    },
    status: 'Pendente',
    synced: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
};

/**
 * Delete Ocorrencia local (soft delete)
 */
export const deleteOcorrenciaLocal = async (id) => {
    const db = await initDB();
    const record = await db.get('ocorrencias_operacionais', parseInt(id));
    if (record) {
        if (navigator.onLine && record.synced && record.ocorrencia_id) {
            try {
                const { error } = await supabase
                    .from('ocorrencias_operacionais')
                    .delete()
                    .eq('ocorrencia_id', record.ocorrencia_id);
                if (error) console.error('Error deleting from supabase:', error);
            } catch (err) {
                console.error('Failed to delete occurrence remotely:', err);
            }
        }
        await db.delete('ocorrencias_operacionais', parseInt(id));
    }
};

/**
 * Save Ocorrencia locally (IndexedDB)
 */
export const saveOcorrenciaLocal = async (data) => {
    const db = await initDB();
    const toSave = {
        ...data,
        ocorrencia_id: data.ocorrencia_id || crypto.randomUUID(),
        updated_at: new Date().toISOString(),
        synced: false
    };
    const id = await db.put('ocorrencias_operacionais', toSave);

    if (navigator.onLine) {
        triggerOcorrenciaSync(id).catch(err => console.error('Sync failed:', err));
    }
    return id;
};

/**
 * Get all local occurrences
 */
export const getOcorrenciasLocal = async () => {
    const db = await initDB();
    const records = await db.getAll('ocorrencias_operacionais');

    // Custom deduplication by ocorrencia_id_format / ocorrencia_id to avoid local double entries
    const dedupMap = new Map();
    records.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) // Sort ascending so newest overrides oldest in Map
        .forEach(r => {
            const key = r.ocorrencia_id_format || r.ocorrencia_id || r.id;
            dedupMap.set(key, r);
        });

    const finalRecords = Array.from(dedupMap.values());
    return finalRecords.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};

/**
 * Get single occurrence
 */
export const getOcorrenciaById = async (id) => {
    const db = await initDB();
    return await db.get('ocorrencias_operacionais', parseInt(id));
};

/**
 * Sync single occurrence to Supabase using centralized syncSingleItem
 */
export const triggerOcorrenciaSync = async (id) => {
    const db = await initDB();
    const record = await db.get('ocorrencias_operacionais', parseInt(id));
    if (!record) return false;

    try {
        const success = await syncSingleItem('ocorrencias_operacionais', record, db);
        return success;
    } catch (err) {
        console.error('Ocorrencia Sync Error:', err);
        return false;
    }
};

/**
 * Sync all pending occurrences
 */
export const syncAllOcorrencias = async () => {
    const db = await initDB();
    const records = await db.getAll('ocorrencias_operacionais');
    const pending = records.filter(r => !r.synced);

    for (const r of pending) {
        await triggerOcorrenciaSync(r.id);
    }
};
