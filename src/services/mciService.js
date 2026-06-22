import { supabase } from './supabase';

/**
 * Busca recursos do MCI cadastrados no banco de dados.
 * @param {Object} filters Filtros de busca (categoria, status, secretaria_id, disponivel_apenas)
 */
export const getMciRecursos = async (filters = {}) => {
    try {
        let query = supabase.from('mci_recursos').select('*').order('nome');

        if (filters.categoria && filters.categoria !== 'TODAS') {
            query = query.eq('categoria', filters.categoria);
        }
        if (filters.status && filters.status !== 'TODOS') {
            query = query.eq('status', filters.status);
        }
        if (filters.secretaria_id && filters.secretaria_id !== 'TODAS') {
            query = query.eq('secretaria_id', filters.secretaria_id);
        }
        if (filters.disponivel_apenas) {
            query = query.eq('status', 'DISPONIVEL');
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('[mciService] Erro ao buscar recursos:', error);
        throw error;
    }
};

/**
 * Busca um recurso específico pelo ID.
 */
export const getMciRecursoById = async (id) => {
    try {
        const { data, error } = await supabase
            .from('mci_recursos')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('[mciService] Erro ao buscar recurso por ID:', error);
        throw error;
    }
};

/**
 * Cria um novo recurso no MCI.
 */
export const createMciRecurso = async (recursoData, userId) => {
    try {
        const { data, error } = await supabase
            .from('mci_recursos')
            .insert([{
                ...recursoData,
                ultima_atualizacao: new Date().toISOString(),
                atualizado_by: userId
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('[mciService] Erro ao criar recurso:', error);
        throw error;
    }
};

/**
 * Atualiza um recurso existente e sua data de última modificação.
 */
export const updateMciRecurso = async (id, recursoData, userId) => {
    try {
        const { data, error } = await supabase
            .from('mci_recursos')
            .update({
                ...recursoData,
                ultima_atualizacao: new Date().toISOString(),
                atualizado_by: userId,
                atualizado_em: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('[mciService] Erro ao atualizar recurso:', error);
        throw error;
    }
};

/**
 * Exclui um recurso do MCI.
 */
export const deleteMciRecurso = async (id) => {
    try {
        const { error } = await supabase
            .from('mci_recursos')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('[mciService] Erro ao deletar recurso:', error);
        throw error;
    }
};

/**
 * Confirma a validade/existência de um recurso (renovando a regra dos 90 dias).
 */
export const confirmarValidadeRecurso = async (id, userId) => {
    try {
        const { data, error } = await supabase
            .from('mci_recursos')
            .update({
                ultima_atualizacao: new Date().toISOString(),
                atualizado_by: userId,
                atualizado_em: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('[mciService] Erro ao renovar validade do recurso:', error);
        throw error;
    }
};

/**
 * Cria uma requisição/solicitação emergencial para um recurso da MCI vinculada a um evento ativo.
 */
export const criarMciRequisicao = async (requisicaoData, userId) => {
    try {
        // Inserir a requisição
        const { data: requisicao, error: reqError } = await supabase
            .from('mci_requisicoes')
            .insert([{
                recurso_id: requisicaoData.recurso_id,
                evento_id: requisicaoData.evento_id,
                justificativa: requisicaoData.justificativa,
                solicitado_por: userId,
                status: 'SOLICITADO'
            }])
            .select()
            .single();

        if (reqError) throw reqError;

        // Atualiza o status do recurso para indicar que está sob requisição / em uso
        const { error: recError } = await supabase
            .from('mci_recursos')
            .update({
                status: 'EM_USO',
                atualizado_by: userId,
                atualizado_em: new Date().toISOString()
            })
            .eq('id', requisicaoData.recurso_id);

        if (recError) throw recError;

        return requisicao;
    } catch (error) {
        console.error('[mciService] Erro ao criar requisição de recurso:', error);
        throw error;
    }
};

/**
 * Atualiza o status de uma requisição de recurso (Aprovar, Rejeitar, Finalizar).
 */
export const atualizarMciRequisicaoStatus = async (id, status, recursoId, userId) => {
    try {
        const { data: requisicao, error: reqError } = await supabase
            .from('mci_requisicoes')
            .update({
                status,
                atualizado_em: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (reqError) throw reqError;

        // Se a requisição foi finalizada ou rejeitada, o recurso volta a ficar "DISPONIVEL"
        if (status === 'FINALIZADO' || status === 'REJEITADO') {
            await supabase
                .from('mci_recursos')
                .update({
                    status: 'DISPONIVEL',
                    atualizado_by: userId,
                    atualizado_em: new Date().toISOString()
                })
                .eq('id', recursoId);
        } else if (status === 'APROVADO') {
            await supabase
                .from('mci_recursos')
                .update({
                    status: 'EM_USO',
                    atualizado_by: userId,
                    atualizado_em: new Date().toISOString()
                })
                .eq('id', recursoId);
        }

        return requisicao;
    } catch (error) {
        console.error('[mciService] Erro ao atualizar status de requisição:', error);
        throw error;
    }
};

/**
 * Busca todas as requisições ativas.
 */
export const getMciRequisicoes = async () => {
    try {
        const { data, error } = await supabase
            .from('mci_requisicoes')
            .select(`
                *,
                recurso:mci_recursos(*)
            `)
            .order('criado_em', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('[mciService] Erro ao buscar requisições:', error);
        throw error;
    }
};

/**
 * Busca histórico de alterações (log de auditoria) de um recurso específico.
 */
export const getMciLogs = async (recursoId) => {
    try {
        const { data, error } = await supabase
            .from('mci_log_auditoria')
            .select('*')
            .eq('recurso_id', recursoId)
            .order('criado_em', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('[mciService] Erro ao buscar logs de auditoria:', error);
        throw error;
    }
};
