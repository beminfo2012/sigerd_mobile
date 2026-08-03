import { openDB } from 'idb';

const DB_NAME = 'sigerd_camera_storage';
const STORE_NAME = 'temp_photos';
const LOCAL_STORAGE_KEY = 'sigerd_camera_temp_photos_backup';

/**
 * Inicializa o banco IndexedDB para armazenamento temporário de fotos da câmera
 */
const initCameraDB = async () => {
    try {
        return await openDB(DB_NAME, 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            }
        });
    } catch (err) {
        console.warn('Falha ao inicializar IndexedDB para câmera:', err);
        return null;
    }
};

/**
 * Salva a lista de fotos capturadas temporariamente
 * @param {Array<{id: string, dataUrl: string, timestamp: number}>} photos 
 */
export const saveCameraTempPhotos = async (photos) => {
    if (!photos) return;
    
    // Tentativa 1: IndexedDB
    try {
        const db = await initCameraDB();
        if (db) {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            await tx.store.clear();
            for (const photo of photos) {
                await tx.store.put(photo);
            }
            await tx.done;
        }
    } catch (e) {
        console.warn('Erro ao salvar no IndexedDB da câmera, usando fallback:', e);
    }

    // Backup em LocalStorage (salva meta/dataUrl com tratamento de cota)
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(photos));
    } catch (e) {
        console.warn('LocalStorage quota excedida para fotos temporárias:', e);
    }
};

/**
 * Recupera as fotos temporárias salvas de uma sessão anterior/recarregamento
 * @returns {Promise<Array<{id: string, dataUrl: string, timestamp: number}>>}
 */
export const getCameraTempPhotos = async () => {
    let photos = [];
    try {
        const db = await initCameraDB();
        if (db) {
            photos = await db.getAll(STORE_NAME);
        }
    } catch (e) {
        console.warn('Erro ao ler do IndexedDB da câmera:', e);
    }

    if (!photos || photos.length === 0) {
        try {
            const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (raw) {
                photos = JSON.parse(raw);
            }
        } catch (e) {
            console.warn('Erro ao ler LocalStorage da câmera:', e);
        }
    }

    return photos || [];
};

/**
 * Remove uma foto temporária por ID
 * @param {string} photoId 
 */
export const removeCameraTempPhoto = async (photoId) => {
    try {
        const db = await initCameraDB();
        if (db) {
            await db.delete(STORE_NAME, photoId);
        }
    } catch (e) {
        console.warn('Erro ao deletar foto temporária do IndexedDB:', e);
    }

    try {
        const current = await getCameraTempPhotos();
        const updated = current.filter(p => p.id !== photoId);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
};

/**
 * Limpa o armazenamento temporário de fotos da câmera
 */
export const clearCameraTempPhotos = async () => {
    try {
        const db = await initCameraDB();
        if (db) {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            await tx.store.clear();
            await tx.done;
        }
    } catch (e) {
        console.warn('Erro ao limpar IndexedDB da câmera:', e);
    }

    try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {}
};
