import { supabase } from './supabase';

const BUCKET = 'vistorias_fotos';
const STORAGE_PATH_PREFIX = 'orthofotos/global/';
const TABLE = 'sigerd_orthofotos';

/**
 * Lista todas as orthofotos cadastradas no sistema.
 * @returns {Promise<Array>}
 */
export const listOrthofotos = async () => {
    try {
        const { data, error } = await supabase
            .from(TABLE)
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (e) {
        console.error('[orthofotoService] listOrthofotos failed:', e);
        return [];
    }
};

/**
 * Faz upload de um arquivo de orthofoto e salva os metadados no banco.
 * @param {File} file - Arquivo de imagem (PNG, JPG, TIFF) ou vetor (KML não aplica aqui)
 * @param {object} metadata - { nome, descricao, bounds } onde bounds = [[s,w],[n,e]]
 * @returns {Promise<object>} - Registro criado
 */
export const uploadOrthofoto = async (file, metadata = {}) => {
    const fileExt = file.name.split('.').pop().toLowerCase();
    const fileName = `${STORAGE_PATH_PREFIX}${Date.now()}_${file.name.replace(/\s+/g, '_')}`;

    // 1. Upload do arquivo no Storage
    const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (uploadError) throw uploadError;

    // 2. Obter URL pública
    const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // 3. Salvar metadados na tabela
    const record = {
        nome: metadata.nome || file.name,
        descricao: metadata.descricao || '',
        url: publicUrl,
        storage_path: fileName,
        tipo: fileExt === 'tif' || fileExt === 'tiff' ? 'TIFF' : fileExt.toUpperCase(),
        bounds: metadata.bounds ? JSON.stringify(metadata.bounds) : null,
        opacidade: metadata.opacidade ?? 0.7,
        ativo: true,
    };

    const { data, error: dbError } = await supabase
        .from(TABLE)
        .insert(record)
        .select()
        .single();

    if (dbError) throw dbError;

    return { ...data, bounds: data.bounds ? JSON.parse(data.bounds) : null };
};

/**
 * Registra uma camada de tiles (XYZ) externa diretamente no banco de dados.
 * @param {object} metadata - { nome, url, descricao, bounds, opacidade }
 * @returns {Promise<object>} - Registro criado
 */
export const registerTilesLayer = async (metadata = {}) => {
    const record = {
        nome: metadata.nome,
        descricao: metadata.descricao || '',
        url: metadata.url,
        storage_path: null,
        tipo: 'TILES',
        bounds: metadata.bounds ? JSON.stringify(metadata.bounds) : null,
        opacidade: metadata.opacidade ?? 0.7,
        ativo: true,
    };

    const { data, error: dbError } = await supabase
        .from(TABLE)
        .insert(record)
        .select()
        .single();

    if (dbError) throw dbError;

    return { ...data, bounds: data.bounds ? JSON.parse(data.bounds) : null };
};

/**
 * Atualiza os metadados de uma orthofoto (nome, descrição, bounds, opacidade, ativo).
 * @param {string} id 
 * @param {object} updates 
 */
export const updateOrthofoto = async (id, updates) => {
    const payload = { ...updates };
    if (payload.bounds && typeof payload.bounds !== 'string') {
        payload.bounds = JSON.stringify(payload.bounds);
    }

    const { data, error } = await supabase
        .from(TABLE)
        .update(payload)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return { ...data, bounds: data.bounds ? JSON.parse(data.bounds) : null };
};

/**
 * Remove uma orthofoto do storage e do banco de dados.
 * @param {object} orthofoto - Registro completo da orthofoto
 */
export const deleteOrthofoto = async (orthofoto) => {
    // 1. Remover do Storage
    if (orthofoto.storage_path) {
        const { error: storageError } = await supabase.storage
            .from(BUCKET)
            .remove([orthofoto.storage_path]);

        if (storageError) {
            console.warn('[orthofotoService] Storage removal failed:', storageError);
            // Continua mesmo com erro de storage para limpar o banco
        }
    }

    // 2. Remover do banco
    const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq('id', orthofoto.id);

    if (error) throw error;
    return true;
};
