import { supabase } from './supabase';

/**
 * ===================================================================
 * CONECTA ESTADUAL - PRODUCTION DATA SERVICE
 * ===================================================================
 * Reads municipal data from the shared SIGERD Supabase and manages
 * state-level control records (analysis, support decisions, etc.)
 * ===================================================================
 */

// ── MUNICIPAL DATA (READ from s2id_records) ──────────────────────

/**
 * Fetch all S2ID occurrence records from the municipal system.
 * These are created by municipalities via SIGERD Mobile.
 */
export const fetchMunicipalOccurrences = async () => {
    const { data, error } = await supabase
        .from('s2id_records')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[Conecta] Error fetching s2id_records:', error);
        throw error;
    }

    // Transform S2ID records into the format our Dashboard/Table expects
    return (data || []).map(transformS2idRecord);
};

/**
 * Fetch a single S2ID record by its UUID
 */
export const fetchOccurrenceById = async (s2idId) => {
    const { data, error } = await supabase
        .from('s2id_records')
        .select('*')
        .eq('s2id_id', s2idId)
        .single();

    if (error) throw error;
    return data ? transformS2idRecord(data) : null;
};

/**
 * Transform a raw s2id_record into a normalized occurrence object
 * for use in the Dashboard, Tables, and Detail views.
 */
const transformS2idRecord = (record) => {
    const d = record.data || {};
    const danos = d.danos_humanos || {};
    const meta = d.metadata_oficial || {};

    // Calculate total affected
    const mortos = parseInt(danos.mortos || 0);
    const feridos = parseInt(danos.feridos || 0);
    const enfermos = parseInt(danos.enfermos || 0);
    const desabrigados = parseInt(danos.desabrigados || 0);
    const desalojados = parseInt(danos.desalojados || 0);
    const desaparecidos = parseInt(danos.desaparecidos || 0);
    const afetados = parseInt(danos.afetados || 0) || (mortos + feridos + enfermos + desabrigados + desalojados + desaparecidos);

    // Calculate total losses
    const pub = d.prejuizos_publicos || {};
    const priv = d.prejuizos_privados || {};
    const totalPublico = Object.values(pub).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
    const totalPrivado = Object.values(priv).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);

    // Determine gravity based on data
    let gravidade = 'Baixo';
    if (mortos > 0 || desaparecidos > 0) gravidade = 'Crítica';
    else if (desabrigados > 50 || afetados > 5000) gravidade = 'Alta';
    else if (desabrigados > 10 || afetados > 1000) gravidade = 'Média';

    const plano = meta.plano_contingencia || false;
    const decreto = !!meta.decreto_numero;
    const apoio = meta.necessita_apoio || false;

    // Visibility criteria for the State
    const visivel_estado = (
        gravidade === 'Alta' ||
        gravidade === 'Crítica' ||
        plano ||
        apoio ||
        decreto
    );

    return {
        id: record.s2id_id || record.id,
        id_local: record.id_local,
        tipo_registro: record.tipo_registro || 's2id',
        municipio: meta.nome_municipio || 'Santa Maria de Jetibá',
        tipo: d.tipificacao?.denominacao || d.tipificacao?.cobrade || 'Não classificado',
        cobrade: d.tipificacao?.cobrade || '',
        lat: d.localizacao?.lat || null,
        lng: d.localizacao?.lng || null,
        gravidade,
        data_evento: formatDate(d.data_ocorrencia),
        status: record.status || 'draft',
        visivel_estado,
        synced: record.synced,
        created_at: record.created_at,
        updated_at: record.updated_at,

        // Human damages
        afetados,
        mortos,
        feridos,
        enfermos,
        desabrigados,
        desalojados,
        desaparecidos,

        // Financial losses
        prejuizo_publico: totalPublico,
        prejuizo_privado: totalPrivado,
        prejuizo_total: totalPublico + totalPrivado,

        // Institutional
        plano: meta.plano_contingencia || false,
        decreto: !!meta.decreto_numero,
        decreto_numero: meta.decreto_numero || '',
        decreto_data: meta.decreto_data || '',
        apoio: meta.necessita_apoio || false,

        // Raw data for detail view
        _raw: record
    };
};

/**
 * Format the S2ID date object { dia, mes, ano } into a readable string
 */
const formatDate = (dateObj) => {
    if (!dateObj) return 'N/A';
    if (typeof dateObj === 'string') return dateObj;
    const { dia, mes, ano } = dateObj;
    if (dia && mes && ano) return `${dia}/${mes}/${ano}`;
    return 'N/A';
};


// ── STATE CONTROL (separate table: estado_controle) ──────────────

/**
 * Fetch the state-level analysis/control record for a given occurrence.
 * If none exists, returns null (the state hasn't analyzed it yet).
 */
export const fetchStateControl = async (occurrenceId) => {
    const { data, error } = await supabase
        .from('estado_controle')
        .select('*')
        .eq('s2id_id', occurrenceId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        console.error('[Conecta] Error fetching state control:', error);
    }
    return data || null;
};

/**
 * Update or create the state's analysis/control for an occurrence.
 * This is the core action of Conecta Estadual.
 */
export const updateStateStatus = async (occurrenceId, status, notes = '') => {
    const payload = {
        s2id_id: occurrenceId,
        status_estadual: status,
        notas: notes,
        analista: 'Coordenador Estadual', // TODO: from auth
        updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('estado_controle')
        .upsert(payload, { onConflict: 's2id_id' })
        .select()
        .single();

    if (error) {
        console.error('[Conecta] Error updating state control:', error);
        throw error;
    }
    return data;
};

/**
 * Fetch all state control records (for dashboard statistics).
 */
export const fetchAllStateControls = async () => {
    const { data, error } = await supabase
        .from('estado_controle')
        .select('*')
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('[Conecta] Error fetching all state controls:', error);
        return [];
    }
    return data || [];
};


// ── DASHBOARD KPIs ──────────────────────────────────────────────

/**
 * Calculate real-time KPIs from municipal + state data.
 */
export const fetchDashboardKPIs = async () => {
    try {
        const [occurrences, controls] = await Promise.all([
            fetchMunicipalOccurrences(),
            fetchAllStateControls()
        ]);

        const controlMap = {};
        controls.forEach(c => { controlMap[c.s2id_id] = c; });

        const activeOccurrences = occurrences.length;
        const withPlan = occurrences.filter(o => o.plano).length;
        const withDecree = occurrences.filter(o => o.decreto).length;
        const needingSupport = occurrences.filter(o => o.apoio).length;

        const pending = occurrences.filter(o => {
            const ctrl = controlMap[o.id];
            return !ctrl || ctrl.status_estadual === 'Em análise';
        }).length;

        const approved = controls.filter(c => c.status_estadual === 'Apoio aprovado').length;

        const totalAffected = occurrences.reduce((sum, o) => sum + o.afetados, 0);
        const totalDisplaced = occurrences.reduce((sum, o) => sum + o.desalojados + o.desabrigados, 0);
        const totalLosses = occurrences.reduce((sum, o) => sum + o.prejuizo_total, 0);

        return {
            activeOccurrences,
            withPlan,
            withDecree,
            needingSupport,
            pending,
            approved,
            totalAffected,
            totalDisplaced,
            totalLosses,
            occurrences,
            controls: controlMap
        };
    } catch (error) {
        console.error('[Conecta] KPI calculation error:', error);
        throw error;
    }
};


// ── REALTIME SUBSCRIPTION ──────────────────────────────────────

/**
 * Subscribe to real-time changes on s2id_records.
 * When a municipality creates/updates a record, the dashboard refreshes.
 */
export const subscribeToOccurrences = (callback) => {
    const channel = supabase
        .channel('s2id_realtime')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 's2id_records' },
            (payload) => {
                console.log('[Conecta] Real-time update:', payload.eventType);
                callback(payload);
            }
        )
        .subscribe();

    // Return unsubscribe function
    return () => supabase.removeChannel(channel);
};


// ── SHELTER DATA (read-only for state overview) ─────────────────

/**
 * Fetch shelter statistics for state-level overview.
 */
export const fetchShelterStats = async () => {
    const { data, error } = await supabase
        .from('shelters')
        .select('*');

    if (error) {
        console.warn('[Conecta] Shelter data not available:', error.message);
        return { total: 0, active: 0, totalOccupants: 0 };
    }

    const shelters = data || [];
    return {
        total: shelters.length,
        active: shelters.filter(s => s.status === 'active').length,
        totalOccupants: shelters.reduce((sum, s) => sum + (parseInt(s.current_occupancy) || 0), 0),
        totalCapacity: shelters.reduce((sum, s) => sum + (parseInt(s.capacity) || 0), 0)
    };
};
