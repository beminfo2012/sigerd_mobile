import { supabase } from './supabase';
import localforage from 'localforage';

const LEGADO_FORAGE_KEY = 'sigerd_legado_pdfs';

/**
 * Busca o registro de PDF de uma vistoria legado.
 * @param {number} vistoriaId - ID numérico da vistoria no JSON legado
 */
export const getLegadoPdf = async (vistoriaId) => {
    // 1. Tentar buscar no Supabase
    try {
        const { data, error } = await supabase
            .from('laudos_legados_pdf')
            .select('*')
            .eq('vistoria_id', vistoriaId)
            .maybeSingle();
        
        if (!error && data) {
            return data;
        }
    } catch (e) {
        console.warn('Supabase legado fetch failed, trying local fallback:', e);
    }
    
    // 2. Fallback para LocalForage
    try {
        const localData = await localforage.getItem(LEGADO_FORAGE_KEY) || {};
        return localData[vistoriaId] || null;
    } catch (err) {
        console.error('Error fetching local legacy pdf:', err);
        return null;
    }
};

/**
 * Faz upload do arquivo PDF e salva a referência associada ao ID legado.
 * @param {number} vistoriaId - ID numérico da vistoria no JSON legado
 * @param {File} file - Arquivo PDF selecionado
 */
export const uploadLegadoPdf = async (vistoriaId, file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `legado/vistoria_${vistoriaId}_${Date.now()}.${fileExt}`;
    
    let publicUrl = '';
    let isBase64 = false;

    // 1. Upload do arquivo para o storage do Supabase (bucket vistorias_fotos)
    try {
        const { error: uploadError } = await supabase.storage
            .from('vistorias_fotos')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true
            });
            
        if (uploadError) throw uploadError;
        
        const { data } = supabase.storage
            .from('vistorias_fotos')
            .getPublicUrl(fileName);
            
        publicUrl = data.publicUrl;
    } catch (err) {
        console.error('Storage upload failed, falling back to base64 local storage:', err);
        
        // Conversão em base64 offline
        publicUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });
        isBase64 = true;
    }
    
    const record = {
        vistoria_id: vistoriaId,
        pdf_url: publicUrl,
        nome_arquivo: file.name,
        created_at: new Date().toISOString()
    };
    
    // 2. Registrar no banco remoto (se não for base64)
    if (!isBase64) {
        try {
            const { error } = await supabase
                .from('laudos_legados_pdf')
                .upsert(record, { onConflict: 'vistoria_id' });
                
            if (error) throw error;
        } catch (e) {
            console.warn('Failed to upsert to Supabase laudos_legados_pdf:', e);
        }
    }
    
    // 3. Salvar no cache local forage para acesso rápido e offline
    try {
        const localData = await localforage.getItem(LEGADO_FORAGE_KEY) || {};
        localData[vistoriaId] = record;
        await localforage.setItem(LEGADO_FORAGE_KEY, localData);
    } catch (err) {
        console.error('Error saving local legacy pdf:', err);
    }
    
    return record;
};
