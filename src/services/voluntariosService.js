import { supabase } from './supabase';

// ==========================================
// VOLUNTARIOS
// ==========================================

export const getVoluntarios = async () => {
    try {
        const { data, error } = await supabase
            .from('voluntarios')
            .select(`
                *,
                voluntario_area(
                    nivel_experiencia,
                    areas_atuacao(id, nome)
                ),
                disponibilidade(*)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Erro ao buscar voluntários:', error);
        throw error;
    }
};

export const getVoluntarioById = async (id) => {
    try {
        const { data, error } = await supabase
            .from('voluntarios')
            .select(`
                *,
                voluntario_area(
                    nivel_experiencia,
                    areas_atuacao(id, nome)
                ),
                disponibilidade(*)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao buscar voluntário:', error);
        throw error;
    }
};

export const saveVoluntario = async (voluntarioData, areasData, disponibilidadeData) => {
    try {
        let voluntarioId = voluntarioData.id;

        // 1. Salvar dados principais
        if (voluntarioId) {
            const { error } = await supabase
                .from('voluntarios')
                .update({ ...voluntarioData, updated_at: new Date().toISOString() })
                .eq('id', voluntarioId);
            if (error) throw error;
        } else {
            const { data, error } = await supabase
                .from('voluntarios')
                .insert([voluntarioData])
                .select()
                .single();
            if (error) throw error;
            voluntarioId = data.id;
        }

        // 2. Salvar áreas de atuação (remover antigas e inserir novas para simplificar)
        if (areasData && areasData.length > 0) {
            await supabase.from('voluntario_area').delete().eq('voluntario_id', voluntarioId);
            const areasToInsert = areasData.map(area => ({
                voluntario_id: voluntarioId,
                area_id: area.area_id,
                nivel_experiencia: area.nivel_experiencia
            }));
            const { error: areaError } = await supabase.from('voluntario_area').insert(areasToInsert);
            if (areaError) throw areaError;
        }

        // 3. Salvar disponibilidade
        if (disponibilidadeData) {
            const { data: existingDisp } = await supabase.from('disponibilidade').select('id').eq('voluntario_id', voluntarioId).single();
            
            if (existingDisp) {
                const { error: dispError } = await supabase
                    .from('disponibilidade')
                    .update({ ...disponibilidadeData, updated_at: new Date().toISOString() })
                    .eq('voluntario_id', voluntarioId);
                if (dispError) throw dispError;
            } else {
                const { error: dispError } = await supabase
                    .from('disponibilidade')
                    .insert([{ ...disponibilidadeData, voluntario_id: voluntarioId }]);
                if (dispError) throw dispError;
            }
        }

        return voluntarioId;
    } catch (error) {
        console.error('Erro ao salvar voluntário:', error);
        throw error;
    }
};

export const deleteVoluntario = async (id) => {
    try {
        const { error } = await supabase
            .from('voluntarios')
            .delete()
            .eq('id', id);
        if (error) throw error;
    } catch (error) {
        console.error('Erro ao deletar voluntário:', error);
        throw error;
    }
};

// ==========================================
// AREAS DE ATUACAO (Taxonomia)
// ==========================================

export const getAreasAtuacao = async () => {
    try {
        const { data, error } = await supabase
            .from('areas_atuacao')
            .select('*')
            .order('nome', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Erro ao buscar áreas de atuação:', error);
        throw error;
    }
};

export const saveAreaAtuacao = async (area) => {
    try {
        if (area.id) {
            const { data, error } = await supabase
                .from('areas_atuacao')
                .update({ nome: area.nome, descricao: area.descricao, updated_at: new Date().toISOString() })
                .eq('id', area.id)
                .select()
                .single();
            if (error) throw error;
            return data;
        } else {
            const { data, error } = await supabase
                .from('areas_atuacao')
                .insert([{ nome: area.nome, descricao: area.descricao }])
                .select()
                .single();
            if (error) throw error;
            return data;
        }
    } catch (error) {
        console.error('Erro ao salvar área de atuação:', error);
        throw error;
    }
};

export const deleteAreaAtuacao = async (id) => {
    try {
        const { error } = await supabase
            .from('areas_atuacao')
            .delete()
            .eq('id', id);
        if (error) throw error;
    } catch (error) {
        console.error('Erro ao deletar área de atuação:', error);
        throw error;
    }
};
