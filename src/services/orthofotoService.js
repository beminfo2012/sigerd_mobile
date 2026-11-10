import { supabase } from './supabase';

export const ORTOFOTOS_API_URL = 'https://orto-smj.vercel.app/api/layers';
export const ORTOFOTOS_API_KEY = '7f32cd5f-98a7-ae07-a93a-20752a63e762';

const STORAGE_PREFS_KEY = 'sigerd_orthofotos_preferences';
const STORAGE_CACHE_KEY = 'sigerd_orthofotos_api_cache';
const STORAGE_CUSTOM_KEY = 'sigerd_orthofotos_custom';

const BUCKET = 'orthofotos';
const STORAGE_PATH_PREFIX = 'global/';
const TABLE = 'sigerd_orthofotos';

/**
 * Lê as preferências do usuário salvas localmente (ativo e opacidade de cada camada)
 */
export const getOrthofotoPreferences = () => {
    try {
        const raw = localStorage.getItem(STORAGE_PREFS_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};

/**
 * Salva as preferências de uma camada (ativo e/ou opacidade)
 */
export const saveOrthofotoPreference = (id, updates) => {
    try {
        const current = getOrthofotoPreferences();
        current[id] = { ...current[id], ...updates };
        localStorage.setItem(STORAGE_PREFS_KEY, JSON.stringify(current));
        window.dispatchEvent(new CustomEvent('orthofotos-updated'));
        return current[id];
    } catch (e) {
        console.error('[orthofotoService] Erro ao salvar preferências:', e);
    }
};

/**
 * Busca o catálogo da API oficial de ortofotos (https://orto-smj.vercel.app/api/layers)
 */
export const fetchOrtofotosFromApi = async () => {
    try {
        const res = await fetch(ORTOFOTOS_API_URL, {
            headers: {
                'x-api-key': ORTOFOTOS_API_KEY
            }
        });

        if (!res.ok) {
            throw new Error(`API de Ortofotos retornou status ${res.status}`);
        }

        const json = await res.json();
        if (json && Array.isArray(json.data)) {
            localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(json.data));
            return json.data;
        }
        return [];
    } catch (err) {
        console.warn('[orthofotoService] Falha ao consultar API remota de ortofotos, tentando cache local:', err);
        try {
            const cached = localStorage.getItem(STORAGE_CACHE_KEY);
            if (cached) return JSON.parse(cached);
        } catch {}
        return [];
    }
};

/**
 * Lista todas as orthofotos mesclando API oficial, preferências locais e camadas personalizadas
 * @returns {Promise<Array>}
 */
export const listOrthofotos = async () => {
    const prefs = getOrthofotoPreferences();
    let apiLayers = [];

    try {
        apiLayers = await fetchOrtofotosFromApi();
    } catch (e) {
        console.warn('[orthofotoService] Erro ao listar da API:', e);
    }

    // Se a API estiver sem retorno e não houver cache
    if (apiLayers.length === 0) {
        try {
            const cached = localStorage.getItem(STORAGE_CACHE_KEY);
            if (cached) apiLayers = JSON.parse(cached);
        } catch {}
    }

    // Formata camadas da API oficial
    const formattedApiLayers = apiLayers.map(layer => {
        const pref = prefs[layer.id] || {};
        return {
            id: layer.id,
            nome: layer.nome,
            descricao: layer.descricao || (layer.ano_captura ? `Captura aérea: ${layer.ano_captura}` : ''),
            url: layer.tms_url,
            tipo: 'TILES',
            ano_captura: layer.ano_captura,
            gsd_cm: layer.gsd_cm,
            bounds: layer.bbox || null,
            ativo: pref.ativo !== undefined ? pref.ativo : true,
            opacidade: pref.opacidade !== undefined ? pref.opacidade : 0.75,
            isApiLayer: true,
            created_at: layer.criado_em
        };
    });

    // Camadas customizadas locais
    let customLayers = [];
    try {
        const rawCustom = localStorage.getItem(STORAGE_CUSTOM_KEY);
        if (rawCustom) customLayers = JSON.parse(rawCustom);
    } catch {}

    // Opcionalmente tenta consultar supabase se existir
    let supabaseLayers = [];
    try {
        const { data, error } = await supabase
            .from(TABLE)
            .select('*')
            .order('created_at', { ascending: false });
        if (!error && data) {
            supabaseLayers = data.map(o => ({
                ...o,
                bounds: o.bounds ? (typeof o.bounds === 'string' ? JSON.parse(o.bounds) : o.bounds) : null
            }));
        }
    } catch {}

    return [...formattedApiLayers, ...customLayers, ...supabaseLayers];
};

/**
 * Atualiza os metadados ou preferências de uma orthofoto.
 * @param {string} id 
 * @param {object} updates 
 */
export const updateOrthofoto = async (id, updates) => {
    // 1. Se for camada da API Oficial, salva preferências localmente
    saveOrthofotoPreference(id, updates);

    // 2. Atualiza camadas customizadas locais se pertencer a elas
    try {
        const rawCustom = localStorage.getItem(STORAGE_CUSTOM_KEY);
        if (rawCustom) {
            const list = JSON.parse(rawCustom);
            const idx = list.findIndex(l => l.id === id);
            if (idx >= 0) {
                list[idx] = { ...list[idx], ...updates };
                localStorage.setItem(STORAGE_CUSTOM_KEY, JSON.stringify(list));
                window.dispatchEvent(new CustomEvent('orthofotos-updated'));
                return list[idx];
            }
        }
    } catch {}

    // 3. Atualiza no Supabase se existir
    try {
        const payload = { ...updates };
        if (payload.bounds && typeof payload.bounds !== 'string') {
            payload.bounds = JSON.stringify(payload.bounds);
        }
        const { data } = await supabase
            .from(TABLE)
            .update(payload)
            .eq('id', id)
            .select()
            .single();
        if (data) {
            return { ...data, bounds: data.bounds ? JSON.parse(data.bounds) : null };
        }
    } catch {}

    return { id, ...updates };
};

/**
 * Remove uma orthofoto customizada ou desativa camada da API
 * @param {object} orthofoto 
 */
export const deleteOrthofoto = async (orthofoto) => {
    if (orthofoto.isApiLayer) {
        // Para camadas da API, removemos suas preferências e marcamos como inativa
        saveOrthofotoPreference(orthofoto.id, { ativo: false });
        return true;
    }

    // Camada customizada local
    try {
        const rawCustom = localStorage.getItem(STORAGE_CUSTOM_KEY);
        if (rawCustom) {
            const list = JSON.parse(rawCustom).filter(l => l.id !== orthofoto.id);
            localStorage.setItem(STORAGE_CUSTOM_KEY, JSON.stringify(list));
            window.dispatchEvent(new CustomEvent('orthofotos-updated'));
            return true;
        }
    } catch {}

    // Supabase
    try {
        if (orthofoto.storage_path) {
            await supabase.storage.from(BUCKET).remove([orthofoto.storage_path]);
        }
        await supabase.from(TABLE).delete().eq('id', orthofoto.id);
    } catch {}

    return true;
};

/**
 * Registra uma camada de tiles (XYZ) externa personalizada.
 */
export const registerTilesLayer = async (metadata = {}) => {
    const newLayer = {
        id: 'custom_' + Date.now(),
        nome: metadata.nome,
        descricao: metadata.descricao || '',
        url: metadata.url,
        tipo: 'TILES',
        bounds: metadata.bounds || null,
        opacidade: metadata.opacidade ?? 0.75,
        ativo: true,
        created_at: new Date().toISOString()
    };

    try {
        const rawCustom = localStorage.getItem(STORAGE_CUSTOM_KEY);
        const list = rawCustom ? JSON.parse(rawCustom) : [];
        list.push(newLayer);
        localStorage.setItem(STORAGE_CUSTOM_KEY, JSON.stringify(list));
        window.dispatchEvent(new CustomEvent('orthofotos-updated'));
    } catch (e) {
        console.error('Erro ao salvar camada personalizada:', e);
    }

    return newLayer;
};

/**
 * Upload de arquivo no Supabase (mantido para retrocompatibilidade)
 */
export const uploadOrthofoto = async (file, metadata = {}) => {
    return registerTilesLayer({
        nome: metadata.nome || file.name,
        descricao: metadata.descricao || '',
        url: '',
        bounds: metadata.bounds,
        opacidade: metadata.opacidade
    });
};

export const uploadFileToStorage = async (file) => {
    const fileName = `${STORAGE_PATH_PREFIX}${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    try {
        const { error } = await supabase.storage.from(BUCKET).upload(fileName, file, { cacheControl: '3600', upsert: false });
        if (error) throw error;
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
        return { publicUrl: data.publicUrl, storagePath: fileName };
    } catch {
        return { publicUrl: '', storagePath: fileName };
    }
};

export const deleteFileFromStorage = async (storagePath) => {
    if (!storagePath) return;
    try {
        await supabase.storage.from(BUCKET).remove([storagePath]);
    } catch {}
};
