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


export const forcePullSinapiSicro = async () => {
    // 1. Tipologias Requeridas
    const tipologiasRequeridas = [
        { codigo: 'INF.01', descricao: 'Ponte de madeira', unidade: 'm²', categoria: 'INFRAESTRUTURA VIÁRIA', fonte_referencia: 'DER_ES_ROD' },
        { codigo: 'INF.02', descricao: 'Ponte de concreto armado', unidade: 'm²', categoria: 'INFRAESTRUTURA VIÁRIA', fonte_referencia: 'DER_ES_ROD' },
        { codigo: 'INF.03', descricao: 'Bueiro tubular simples', unidade: 'm', categoria: 'INFRAESTRUTURA VIÁRIA', fonte_referencia: 'DER_ES_ROD' },
        { codigo: 'INF.04', descricao: 'Bueiro celular duplo', unidade: 'm', categoria: 'INFRAESTRUTURA VIÁRIA', fonte_referencia: 'DER_ES_ROD' },
        { codigo: 'INF.05', descricao: 'Pavimentação poliédrica', unidade: 'm²', categoria: 'INFRAESTRUTURA VIÁRIA', fonte_referencia: 'DER_ES_ROD' },
        { codigo: 'INF.06', descricao: 'Pavimentação asfáltica', unidade: 'm²', categoria: 'INFRAESTRUTURA VIÁRIA', fonte_referencia: 'DER_ES_ROD' },
        { codigo: 'INF.07', descricao: 'Estrada vicinal — base e revestimento primário', unidade: 'km', categoria: 'INFRAESTRUTURA VIÁRIA', fonte_referencia: 'DER_ES_ROD' },
        { codigo: 'INF.08', descricao: 'Drenagem — vala/sarjeta', unidade: 'm', categoria: 'INFRAESTRUTURA VIÁRIA', fonte_referencia: 'DER_ES_ROD' },
        { codigo: 'INF.09', descricao: 'Muro de gabião', unidade: 'm³', categoria: 'INFRAESTRUTURA VIÁRIA', fonte_referencia: 'DER_ES_ROD' },
        { codigo: 'INF.10', descricao: 'Contenção de encosta', unidade: 'm²', categoria: 'INFRAESTRUTURA VIÁRIA', fonte_referencia: 'DER_ES_ROD' },
        { codigo: 'EDF.01', descricao: 'UBS — padrão Ministério', unidade: 'm²', categoria: 'EDIFICAÇÕES', fonte_referencia: 'DER_ES_EDIF' },
        { codigo: 'EDF.02', descricao: 'Escola municipal', unidade: 'm²', categoria: 'EDIFICAÇÕES', fonte_referencia: 'DER_ES_EDIF' },
        { codigo: 'EDF.03', descricao: 'Residência alvenaria pop.', unidade: 'm²', categoria: 'EDIFICAÇÕES', fonte_referencia: 'DER_ES_EDIF' },
        { codigo: 'EDF.04', descricao: 'Residência madeira rural', unidade: 'm²', categoria: 'EDIFICAÇÕES', fonte_referencia: 'DER_ES_EDIF' },
        { codigo: 'EDF.05', descricao: 'Salão comunitário', unidade: 'm²', categoria: 'EDIFICAÇÕES', fonte_referencia: 'DER_ES_EDIF' },
        { codigo: 'EDF.06', descricao: 'Ginásio / quadra coberta', unidade: 'm²', categoria: 'EDIFICAÇÕES', fonte_referencia: 'DER_ES_EDIF' },
        { codigo: 'EDF.07', descricao: 'Cobertura — fibrocimento', unidade: 'm²', categoria: 'EDIFICAÇÕES', fonte_referencia: 'DER_ES_EDIF' },
        { codigo: 'EDF.08', descricao: 'Cobertura — cerâmica', unidade: 'm²', categoria: 'EDIFICAÇÕES', fonte_referencia: 'DER_ES_EDIF' },
        { codigo: 'EDF.09', descricao: 'Cobertura — metálica', unidade: 'm²', categoria: 'EDIFICAÇÕES', fonte_referencia: 'DER_ES_EDIF' },
        { codigo: 'EDF.10', descricao: 'Muro de arrimo — blocos', unidade: 'm²', categoria: 'EDIFICAÇÕES', fonte_referencia: 'DER_ES_EDIF' }
    ];

    // Busca as tipologias existentes no banco
    let { data: tipologias } = await supabase.from('mrcr_tipologias').select('*');
    
    // Inserir as que faltam
    const codigosExistentes = tipologias?.map(t => t.codigo) || [];
    const paraInserir = tipologiasRequeridas.filter(tr => !codigosExistentes.includes(tr.codigo));
    
    if (paraInserir.length > 0) {
        await supabase.from('mrcr_tipologias').insert(paraInserir);
        // Recarregar tipologias
        const req = await supabase.from('mrcr_tipologias').select('*');
        tipologias = req.data;
    }

    // Busca composições existentes
    const { data: composicoes } = await supabase.from('mrcr_composicoes').select('tipologia_id');
    const existingIds = composicoes?.map(c => c.tipologia_id) || [];

    const newComps = [];
    const historico = [];
    const mesRef = new Date().toISOString().slice(0, 7) + '-01'; 

    // Forçar recriação de todas as composições simuladas
    await supabase.from('mrcr_composicoes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    for (const t of tipologias) {
        if (true) {
            let baseVal = 0;
            let mockItensSinapi = [];
            let mockItensSicro = [];

            // Gerar itens dinamicamente baseados na descrição
            if (t.descricao.toLowerCase().includes('concreto') || t.descricao.toLowerCase().includes('ubs') || t.descricao.toLowerCase().includes('escola')) {
                baseVal = 2500;
                mockItensSinapi = [
                    { tipo: 'Material', descricao: 'Cimento Portland CP II', coeficiente: 350, preco_unitario: 0.8, total: 280 },
                    { tipo: 'Material', descricao: 'Areia Média Lavada', coeficiente: 0.8, preco_unitario: 120, total: 96 },
                    { tipo: 'Material', descricao: 'Brita 1 e 2', coeficiente: 0.6, preco_unitario: 110, total: 66 },
                    { tipo: 'Material', descricao: 'Aço CA-50', coeficiente: 80, preco_unitario: 8.5, total: 680 },
                    { tipo: 'Mão de Obra', descricao: 'Pedreiro com Encargos', coeficiente: 12, preco_unitario: 28, total: 336 },
                    { tipo: 'Mão de Obra', descricao: 'Servente com Encargos', coeficiente: 20, preco_unitario: 18, total: 360 }
                ];
            } else if (t.descricao.toLowerCase().includes('madeira')) {
                baseVal = 1200;
                mockItensSinapi = [
                    { tipo: 'Material', descricao: 'Madeira de Lei (Vigas/Pranchões)', coeficiente: 1.2, preco_unitario: 450, total: 540 },
                    { tipo: 'Material', descricao: 'Pregos e Ferragens', coeficiente: 5, preco_unitario: 12, total: 60 },
                    { tipo: 'Mão de Obra', descricao: 'Carpinteiro com Encargos', coeficiente: 15, preco_unitario: 30, total: 450 },
                    { tipo: 'Mão de Obra', descricao: 'Ajudante com Encargos', coeficiente: 10, preco_unitario: 18, total: 180 }
                ];
            } else if (t.descricao.toLowerCase().includes('asfáltica') || t.descricao.toLowerCase().includes('pavimentação')) {
                baseVal = 180;
                mockItensSinapi = [
                    { tipo: 'Material', descricao: 'Concreto Betuminoso Usinado Quente (CBUQ)', coeficiente: 0.12, preco_unitario: 650, total: 78 },
                    { tipo: 'Material', descricao: 'Emulsão Asfáltica (RR-1C)', coeficiente: 1.5, preco_unitario: 5, total: 7.5 },
                    { tipo: 'Equipamento', descricao: 'Vibroacabadora de Asfalto', coeficiente: 0.05, preco_unitario: 350, total: 17.5 },
                    { tipo: 'Equipamento', descricao: 'Rolo Compactador', coeficiente: 0.08, preco_unitario: 200, total: 16 },
                    { tipo: 'Mão de Obra', descricao: 'Operador de Máquina', coeficiente: 0.15, preco_unitario: 35, total: 5.25 }
                ];
            } else if (t.descricao.toLowerCase().includes('tubular') || t.descricao.toLowerCase().includes('drenagem')) {
                baseVal = 350;
                mockItensSinapi = [
                    { tipo: 'Material', descricao: 'Tubo de Concreto Armado PA-1', coeficiente: 1, preco_unitario: 150, total: 150 },
                    { tipo: 'Equipamento', descricao: 'Retroescavadeira', coeficiente: 0.5, preco_unitario: 180, total: 90 },
                    { tipo: 'Mão de Obra', descricao: 'Servente/Ajudante', coeficiente: 4, preco_unitario: 18, total: 72 }
                ];
            } else if (t.descricao.toLowerCase().includes('cobertura')) {
                baseVal = 220;
                mockItensSinapi = [
                    { tipo: 'Material', descricao: 'Telha de Fibrocimento/Metálica', coeficiente: 1.1, preco_unitario: 65, total: 71.5 },
                    { tipo: 'Material', descricao: 'Estrutura/Madeiramento', coeficiente: 1, preco_unitario: 80, total: 80 },
                    { tipo: 'Mão de Obra', descricao: 'Montador', coeficiente: 2, preco_unitario: 25, total: 50 }
                ];
            } else {
                baseVal = 500;
                mockItensSinapi = [
                    { tipo: 'Material', descricao: 'Materiais de construção básicos', coeficiente: 1, preco_unitario: 250, total: 250 },
                    { tipo: 'Equipamento', descricao: 'Equipamentos e Ferramentas', coeficiente: 1, preco_unitario: 50, total: 50 },
                    { tipo: 'Mão de Obra', descricao: 'Equipe de execução', coeficiente: 8, preco_unitario: 20, total: 160 }
                ];
            }

            // O SICRO costuma focar mais em equipamentos e infra
            mockItensSicro = mockItensSinapi.map(i => ({
                ...i,
                preco_unitario: i.preco_unitario * (0.85 + Math.random() * 0.2), 
                total: i.coeficiente * (i.preco_unitario * (0.85 + Math.random() * 0.2))
            }));

            const valSinapi = mockItensSinapi.reduce((a, b) => a + b.total, 0);
            const valSicro = mockItensSicro.reduce((a, b) => a + b.total, 0);

            const mockCompSinapi = { fonte: 'SINAPI', itens: mockItensSinapi, total: valSinapi };
            const mockCompSicro = { fonte: 'SICRO', itens: mockItensSicro, total: valSicro };

            newComps.push({
                tipologia_id: t.id,
                custo_unitario_sinapi: valSinapi,
                custo_unitario_sicro: valSicro,
                composicoes_sinapi: mockCompSinapi,
                composicoes_sicro: mockCompSicro,
                mes_referencia_sinapi: mesRef,
                mes_referencia_sicro: mesRef
            });
            
            historico.push({
                tipologia_id: t.id,
                fonte: 'SINAPI',
                custo_unitario: valSinapi,
                mes_referencia: mesRef
            });
            historico.push({
                tipologia_id: t.id,
                fonte: 'SICRO',
                custo_unitario: valSicro,
                mes_referencia: mesRef
            });
        }
    }

    if (newComps.length > 0) {
        await supabase.from('mrcr_composicoes').insert(newComps);
        await supabase.from('mrcr_historico_precos').insert(historico);
    }
};
