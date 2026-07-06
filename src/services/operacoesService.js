import { supabase } from './supabase';

export const operacoesService = {
  // Retorna a operação ativa de um município
  async getOperacaoAtiva(municipioId) {
    const { data, error } = await supabase
      .from('operacao_assistencia_humanitaria')
      .select('*')
      .eq('municipio_id', municipioId)
      .eq('status', 'em_andamento')
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is the code for 0 rows returned
      console.error('Erro ao buscar operação ativa:', error);
      throw error;
    }
    return data;
  },

  // Cria uma nova operação
  async criarOperacao(operacaoData) {
    // 1. Verifica se já existe uma operação ativa
    const ativa = await this.getOperacaoAtiva(operacaoData.municipio_id);
    if (ativa) {
      throw new Error('Já existe uma operação ativa para este município.');
    }

    // 2. Insere a nova operação
    const { data, error } = await supabase
      .from('operacao_assistencia_humanitaria')
      .insert([{
        ...operacaoData,
        status: 'em_andamento',
        data_hora_inicio: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar operação:', error);
      throw error;
    }

    // 3. Registra no diário
    await this.addRegistroDiario(
      data.id,
      'Operação iniciada.',
      'automatico',
      operacaoData.coordenador_responsavel_id
    );

    return data;
  },

  // Encerra uma operação
  async encerrarOperacao(operacaoId, parecerFinal, usuarioId) {
    const { data, error } = await supabase
      .from('operacao_assistencia_humanitaria')
      .update({
        status: 'encerrada',
        data_hora_encerramento: new Date().toISOString(),
        usuario_encerramento_id: usuarioId,
        parecer_final: parecerFinal
      })
      .eq('id', operacaoId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao encerrar operação:', error);
      throw error;
    }

    // Registra no diário
    await this.addRegistroDiario(
      operacaoId,
      'Operação encerrada.',
      'automatico',
      usuarioId
    );

    return data;
  },

  // Reabre uma operação
  async reabrirOperacao(operacaoId, justificativa, usuarioId) {
    // Busca a operação para verificar município
    const { data: op } = await supabase
      .from('operacao_assistencia_humanitaria')
      .select('municipio_id')
      .eq('id', operacaoId)
      .single();

    if (op) {
      const ativa = await this.getOperacaoAtiva(op.municipio_id);
      if (ativa) {
        throw new Error('Não é possível reabrir. Já existe uma operação ativa para este município.');
      }
    }

    const { data, error } = await supabase
      .from('operacao_assistencia_humanitaria')
      .update({
        status: 'reaberta'
      })
      .eq('id', operacaoId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao reabrir operação:', error);
      throw error;
    }

    // Registra no diário
    await this.addRegistroDiario(
      operacaoId,
      `Operação reaberta. Justificativa: ${justificativa}`,
      'automatico',
      usuarioId
    );

    return data;
  },

  // Adiciona registro no diário
  async addRegistroDiario(operacaoId, descricao, origem = 'manual', usuarioId = null, entidadeRef = null, entidadeRefId = null) {
    const { data, error } = await supabase
      .from('operacao_diario')
      .insert([{
        operacao_id: operacaoId,
        descricao,
        origem,
        usuario_id: usuarioId,
        entidade_referencia: entidadeRef,
        entidade_referencia_id: entidadeRefId
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar registro no diário:', error);
      throw error;
    }

    return data;
  },

  // Busca diário da operação
  async getDiarioOperacao(operacaoId) {
    const { data, error } = await supabase
      .from('operacao_diario')
      .select('*, profiles(nome)')
      .eq('operacao_id', operacaoId)
      .order('data_hora', { ascending: true });

    if (error) {
      console.error('Erro ao buscar diário:', error);
      throw error;
    }

    return data;
  },

  // Busca histórico de operações
  async getHistoricoOperacoes(municipioId, ano = null) {
    let query = supabase
      .from('operacao_assistencia_humanitaria')
      .select('*')
      .eq('municipio_id', municipioId)
      .in('status', ['encerrada'])
      .order('data_hora_inicio', { ascending: false });
    
    if (ano) {
      query = query.gte('data_hora_inicio', `${ano}-01-01T00:00:00Z`).lte('data_hora_inicio', `${ano}-12-31T23:59:59Z`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar histórico de operações:', error);
      throw error;
    }

    return data;
  },

  // Calcula o resumo operacional
  async calcularResumoOperacional(operacaoId) {
    // Idealmente seria feito via RPC (Stored Procedure) no Supabase, 
    // mas faremos agregações no client side por simplicidade ou usaremos múltiplas queries.
    
    try {
      // 1. Operação
      const { data: op } = await supabase
        .from('operacao_assistencia_humanitaria')
        .select('*')
        .eq('id', operacaoId)
        .single();

      // 2. Abrigos
      const { data: abrigos } = await supabase
        .from('shelters')
        .select('id, capacity, current_occupancy')
        .eq('operacao_id', operacaoId);

      // 3. Abrigos Ocupação
      const { data: ocupacoes } = await supabase
        .from('shelter_occupants')
        .select('id, status')
        .eq('operacao_id', operacaoId);

      // 4. Estoque
      const { data: estoque } = await supabase
        .from('shelter_inventory')
        .select('id')
        .eq('operacao_id', operacaoId);
      
      // Construir o resumo (simplificado)
      const resumo = {
        operacao: op,
        estatisticas: {
          abrigosUtilizados: abrigos?.length || 0,
          pessoasAcolhidas: ocupacoes?.filter(o => o.status === 'active')?.length || ocupacoes?.length || 0,
          itensEstoque: estoque?.length || 0
        }
      };

      return resumo;
    } catch (e) {
      console.error('Erro ao calcular resumo operacional', e);
      return null;
    }
  },

  // Reabre uma operação encerrada
  async reabrirOperacao(operacaoId) {
    const { data, error } = await supabase
      .from('operacao_assistencia_humanitaria')
      .update({
        status: 'em_andamento',
        data_hora_encerramento: null
      })
      .eq('id', operacaoId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao reabrir operação:', error);
      throw error;
    }

    return data;
  },

  // Exclui uma operação e todo o seu histórico (diário em cascata)
  async excluirOperacao(operacaoId) {
    const { error } = await supabase
      .from('operacao_assistencia_humanitaria')
      .delete()
      .eq('id', operacaoId);

    if (error) {
      console.error('Erro ao excluir operação:', error);
      throw error;
    }

    return true;
  }
};
