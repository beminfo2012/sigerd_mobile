import { supabase } from './supabase';

export const plantaBaixaService = {
  async getCatalogo() {
    const { data, error } = await supabase
      .from('catalogo_area_doutrina_abrigo')
      .select('*')
      .eq('ativo', true)
      .order('ordem_padrao', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async getPlantaAtiva(abrigoId) {
    const { data: planta, error: plantaError } = await supabase
      .from('abrigo_planta_baixa')
      .select('*')
      .eq('abrigo_id', abrigoId)
      .eq('ativo', true)
      .single();

    if (plantaError && plantaError.code !== 'PGRST116') {
      throw plantaError;
    }

    if (!planta) return null;

    // Obter áreas vinculadas
    const { data: vinculadas, error: vincError } = await supabase
      .from('abrigo_planta_area_vinculada')
      .select(`
        *,
        area_doutrina:catalogo_area_doutrina_abrigo(*)
      `)
      .eq('abrigo_planta_id', planta.id)
      .order('ordem', { ascending: true });

    if (vincError) throw vincError;

    // Gerar URL assinada ou pública
    const { data: urlData } = supabase.storage
      .from('shelters')
      .getPublicUrl(planta.caminho_storage);

    return {
      ...planta,
      url_visualizacao: urlData.publicUrl,
      areas_vinculadas: vinculadas || []
    };
  },

  async getHistoricoPlantas(abrigoId) {
    const { data, error } = await supabase
      .from('abrigo_planta_baixa')
      .select('*')
      .eq('abrigo_id', abrigoId)
      .eq('ativo', false)
      .order('versao', { ascending: false });

    if (error) throw error;
    
    // Gerar URLs para as plantas do histórico
    return data.map(p => {
      const { data: urlData } = supabase.storage
        .from('shelters')
        .getPublicUrl(p.caminho_storage);
      return { ...p, url_visualizacao: urlData.publicUrl };
    });
  },

  async uploadPlanta(abrigoId, arquivo, usuarioId) {
    // 1. Inativar plantas anteriores
    await supabase
      .from('abrigo_planta_baixa')
      .update({ ativo: false })
      .eq('abrigo_id', abrigoId)
      .eq('ativo', true);

    // 2. Upload para Storage
    const extensao = arquivo.name.split('.').pop();
    const nomeUnico = `planta_${Date.now()}.${extensao}`;
    const caminho = `${abrigoId}/plantas/${nomeUnico}`;

    const { error: uploadError } = await supabase.storage
      .from('shelters')
      .upload(caminho, arquivo);

    if (uploadError) throw uploadError;

    // 3. Buscar versão anterior
    const { count } = await supabase
      .from('abrigo_planta_baixa')
      .select('*', { count: 'exact', head: true })
      .eq('abrigo_id', abrigoId);

    const versao = (count || 0) + 1;

    // 4. Salvar registro
    const { data, error } = await supabase
      .from('abrigo_planta_baixa')
      .insert({
        abrigo_id: abrigoId,
        nome_arquivo_original: arquivo.name,
        caminho_storage: caminho,
        versao: versao,
        usuario_upload_id: usuarioId || null
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async atualizarAreasVinculadas(plantaId, areas) {
    // 1. Deletar as atuais
    await supabase
      .from('abrigo_planta_area_vinculada')
      .delete()
      .eq('abrigo_planta_id', plantaId);

    if (!areas || areas.length === 0) return true;

    // 2. Inserir novas
    const payload = areas.map(a => ({
      ...a,
      abrigo_planta_id: plantaId
    }));

    const { error } = await supabase
      .from('abrigo_planta_area_vinculada')
      .insert(payload);

    if (error) throw error;
    return true;
  }
};
