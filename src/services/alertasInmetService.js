import { supabase } from './supabase';

/**
 * Busca alertas do INMET cadastrados no banco de dados.
 * @param {Object} filters Filtros de busca (status, limitDate, limit)
 */
export const getAlertasInmet = async (filters = {}) => {
    try {
        let query = supabase.from('alertas_inmet').select('*').order('inicio', { ascending: false });

        const nowIso = new Date().toISOString();

        if (filters.status === 'ATIVO') {
            // Um alerta está ativo se a hora atual está entre inicio e fim
            query = query.gte('fim', nowIso).lte('inicio', nowIso);
        } else if (filters.status === 'HISTORICO') {
            // Histórico completo (ou expirados)
            query = query.lt('fim', nowIso);
        }

        if (filters.limitDate) {
            // Busca alertas que estavam ativos durante o período solicitado
            // Ou seja: fim >= limitDate E inicio <= agora
            const limitIso = new Date(filters.limitDate).toISOString();
            query = query.gte('fim', limitIso).lte('inicio', nowIso);
        }

        if (filters.limit) {
            query = query.limit(filters.limit);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('[alertasInmetService] Erro ao buscar alertas do INMET:', error);
        return [];
    }
};

/**
 * Salva ou atualiza alertas do INMET no banco de dados.
 * @param {Array} alerts Lista de alertas retornada da API do INMET
 */
export const saveAlertasInmet = async (alerts = []) => {
    if (!alerts || alerts.length === 0) return { success: true, count: 0 };
    
    try {
        const upsertData = alerts.map(a => ({
            id: String(a.id),
            tipo: a.tipo || a.descricao || 'Meteorológico',
            severidade: a.severidade || 'ALERTA',
            inicio: a.inicio,
            fim: a.fim,
            riscos: a.riscos || '',
            instrucoes: a.instrucoes || '',
            msg: a.msg || '',
            descricao: a.descricao || a.tipo || '',
            atualizado_em: new Date().toISOString()
        }));

        const { data, error } = await supabase
            .from('alertas_inmet')
            .upsert(upsertData, { onConflict: 'id' });

        if (error) throw error;
        return { success: true, count: upsertData.length };
    } catch (error) {
        console.error('[alertasInmetService] Erro ao salvar alertas do INMET:', error);
        return { success: false, error: error.message };
    }
};
