import { supabase } from './supabase';

export const nortisService = {
  async search(params) {
    let query = supabase.from('nortis_normas').select('*').order('ano', { ascending: false, nullsFirst: false });

    if (params.termo) {
      // Using ilike for MVP. Can be updated to use RPC for tsvector full-text search later
      query = query.or(`numero.ilike.%${params.termo}%,ementa.ilike.%${params.termo}%,texto_integral.ilike.%${params.termo}%`);
    }
    if (params.tipo) {
      query = query.eq('tipo', params.tipo);
    }
    if (params.ambito) {
      query = query.eq('ambito', params.ambito);
    }
    if (params.situacao) {
      query = query.eq('situacao', params.situacao);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase.from('nortis_normas').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async save(norma, file) {
    let filePath = norma.arquivo_pdf_path;

    if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('nortis_arquivos')
            .upload(fileName, file);
        
        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw new Error('Falha ao fazer upload do arquivo. O bucket nortis_arquivos existe?');
        }
        filePath = uploadData.path;
    }

    const payload = {
        ...norma,
        arquivo_pdf_path: filePath,
        atualizado_em: new Date().toISOString()
    };

    if (payload.id) {
        const { data, error } = await supabase.from('nortis_normas').update(payload).eq('id', payload.id).select();
        if (error) throw error;
        return data[0];
    } else {
        const { data, error } = await supabase.from('nortis_normas').insert([payload]).select();
        if (error) throw error;
        return data[0];
    }
  },

  async getTemas() {
      const { data, error } = await supabase.from('nortis_temas').select('*').order('nome');
      if (error) throw error;
      return data;
  },

  async delete(id) {
    const { error } = await supabase.from('nortis_normas').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
};
