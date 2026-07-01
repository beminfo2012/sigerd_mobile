import { supabase } from './supabase';

/**
 * Busca o mapeamento DER-ES existente no banco.
 */
export const getMapeamentosDerEs = async () => {
    const { data, error } = await supabase
        .from('mrcr_mapeamento_deres')
        .select('*');
    if (error) throw error;
    return data;
};

/**
 * Busca as tipologias ativas com suas composições
 */
export const getTipologiasComposicoes = async () => {
    const { data, error } = await supabase
        .from('mrcr_tipologias')
        .select(`
            *,
            composicoes:mrcr_composicoes(*)
        `)
        .eq('ativo', true);
    if (error) throw error;
    return data;
};

/**
 * Salva a importação do DER-ES atualizando as composições e o histórico.
 */
export const importarDerEs = async ({ fonte, mesReferencia, composicoesAtualizadas, usuarioNome }) => {
    // 1. Atualizar mrcr_composicoes
    for (const item of composicoesAtualizadas) {
        // item = { tipologia_id, composicao, custo_unitario }
        
        // Verifica se a tipologia já tem registro em mrcr_composicoes
        const { data: compExistente } = await supabase
            .from('mrcr_composicoes')
            .select('id')
            .eq('tipologia_id', item.tipologia_id)
            .single();

        const updateData = {};
        if (fonte === 'DER_ES_ROD') {
            updateData.composicoes_deres_rod = item.composicao;
            updateData.custo_unitario_deres_rod = item.custo_unitario;
        } else {
            updateData.composicoes_deres_edif = item.composicao;
            updateData.custo_unitario_deres_edif = item.custo_unitario;
        }
        updateData.mes_referencia_deres = mesReferencia;
        updateData.updated_at = new Date().toISOString();

        if (compExistente) {
            await supabase
                .from('mrcr_composicoes')
                .update(updateData)
                .eq('id', compExistente.id);
        } else {
            await supabase
                .from('mrcr_composicoes')
                .insert({
                    tipologia_id: item.tipologia_id,
                    ...updateData
                });
        }

        // 2. Registrar no histórico de preços
        await supabase
            .from('mrcr_historico_precos')
            .insert({
                tipologia_id: item.tipologia_id,
                fonte,
                custo_unitario: item.custo_unitario, // Campo genérico opcional
                custo_unitario_deres_rod: fonte === 'DER_ES_ROD' ? item.custo_unitario : null,
                custo_unitario_deres_edif: fonte === 'DER_ES_EDIF' ? item.custo_unitario : null,
                mes_referencia: mesReferencia
            });
    }

    // 3. Registrar o log da atualização
    const { data: log, error: logError } = await supabase
        .from('mrcr_atualizacoes_log')
        .insert({
            fonte,
            mes_referencia: mesReferencia,
            importado_por: usuarioNome,
            composicoes_atualizadas: composicoesAtualizadas.length,
            status: 'SUCESSO'
        })
        .select()
        .single();

    if (logError) throw logError;
    return log;
};

/**
 * Busca o log da última atualização DER-ES
 */
export const getUltimaAtualizacaoDerEs = async () => {
    const { data, error } = await supabase
        .from('mrcr_atualizacoes_log')
        .select('*')
        .in('fonte', ['DER_ES_ROD', 'DER_ES_EDIF'])
        .eq('status', 'SUCESSO')
        .order('data_import', { ascending: false })
        .limit(1)
        .maybeSingle();
        
    if (error) throw error;
    return data;
};
