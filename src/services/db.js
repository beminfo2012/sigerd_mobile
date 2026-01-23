import { openDB } from 'idb'
import { supabase } from './supabase'

const DB_NAME = 'defesa-civil-db'
const DB_VERSION = 11


let dbPromise = null;

export const initDB = async () => {
    if (dbPromise) return dbPromise;

    dbPromise = openDB(DB_NAME, DB_VERSION, {
        async upgrade(db, oldVersion, newVersion, transaction) {
            // Helper to ensure index exists safely during manual upgrades or version bumps
            const ensureSyncedIndex = (storeName) => {
                if (db.objectStoreNames.contains(storeName)) {
                    const store = transaction.objectStore(storeName);
                    if (!store.indexNames.contains('synced')) {
                        store.createIndex('synced', 'synced', { unique: false });
                    }
                }
            };

            // Core Stores
            if (!db.objectStoreNames.contains('vistorias')) {
                const store = db.createObjectStore('vistorias', { keyPath: 'id', autoIncrement: true });
                store.createIndex('synced', 'synced', { unique: false });
            } else {
                ensureSyncedIndex('vistorias');
            }

            if (!db.objectStoreNames.contains('interdicoes')) {
                const store = db.createObjectStore('interdicoes', { keyPath: 'id', autoIncrement: true });
                store.createIndex('synced', 'synced', { unique: false });
            } else {
                ensureSyncedIndex('interdicoes');
            }

            // GeoRescue / Cache
            if (!db.objectStoreNames.contains('installations')) {
                const installationStore = db.createObjectStore('installations', { keyPath: 'id' });
                installationStore.createIndex('installation_number', 'installation_number', { unique: true });
                installationStore.createIndex('uc_core', 'uc_core', { unique: false });
            }
            if (!db.objectStoreNames.contains('remote_vistorias_cache')) {
                db.createObjectStore('remote_vistorias_cache', { keyPath: 'id' });
            }

            // Humanitarian / Shelter Module
            const shelterStores = ['shelters', 'occupants', 'donations', 'inventory', 'distributions'];
            shelterStores.forEach(name => {
                if (!db.objectStoreNames.contains(name)) {
                    const store = db.createObjectStore(name, { keyPath: 'id', autoIncrement: true });
                    store.createIndex('synced', 'synced', { unique: false });
                } else {
                    ensureSyncedIndex(name);
                }
            });

            // Emergency Contracts
            if (!db.objectStoreNames.contains('emergency_contracts')) {
                const contractStore = db.createObjectStore('emergency_contracts', { keyPath: 'id', autoIncrement: true });
                contractStore.createIndex('contract_id', 'contract_id', { unique: true });
                contractStore.createIndex('synced', 'synced', { unique: false });
            } else {
                ensureSyncedIndex('emergency_contracts');
            }
        },
    });
    return dbPromise;
}


// Helper to convert base64 to blob
const base64ToBlob = (base64) => {
    try {
        const parts = base64.split(';base64,')
        const contentType = parts[0].split(':')[1]
        const raw = window.atob(parts[1])
        const rawLength = raw.length
        const uInt8Array = new Uint8Array(rawLength)
        for (let i = 0; i < rawLength; ++i) {
            uInt8Array[i] = raw.charCodeAt(i)
        }
        return new Blob([uInt8Array], { type: contentType })
    } catch (e) {
        console.error('Base64 conversion error:', e)
        return null
    }
}

export const saveVistoriaOffline = async (data) => {
    const db = await initDB()

    const localId = await db.put('vistorias', {
        ...data,
        createdAt: data.createdAt || data.created_at || new Date().toISOString(),
        synced: false
    })

    // 2. Try to sync with Supabase immediately if online
    if (navigator.onLine) {
        const item = await db.get('vistorias', localId)
        await syncSingleItem('vistorias', item, db)
    }

    return localId
}

export const getPendingSyncCount = async () => {
    const db = await initDB()

    const stores = ['vistorias', 'interdicoes', 'shelters', 'occupants', 'donations', 'inventory', 'distributions'];
    let detail = {
        total: 0,
        vistorias: 0,
        interdicoes: 0,
        shelters: 0,
        occupants: 0,
        donations: 0,
        inventory: 0,
        distributions: 0
    };

    for (const storeName of stores) {
        try {
            // [PERFORMANCE FIX] Use count from index instead of getAll().length
            // This is significantly faster for large databases
            const pending = await db.countFromIndex(storeName, 'synced', 0).catch(async () => {
                // Fallback for older versions or undefined synced (where 0 is used for false)
                const items = await db.getAll(storeName).catch(() => []);
                return items.filter(v => v.synced === false || v.synced === undefined || v.synced === 0).length;
            });

            detail[storeName] = pending;
            detail.total += pending;
        } catch (e) {
            console.warn(`Sync count failed for ${storeName}:`, e);
        }
    }

    return detail;
}

export const syncPendingData = async () => {
    const db = await initDB()
    const stores = ['vistorias', 'interdicoes', 'shelters', 'occupants', 'donations', 'inventory', 'distributions'];
    let syncedCount = 0

    for (const storeName of stores) {
        try {
            const allItems = await db.getAll(storeName)
            const pendingItems = allItems.filter(v => v.synced === false || v.synced === undefined || v.synced === 0)

            for (const item of pendingItems) {
                const success = await syncSingleItem(storeName, item, db)
                if (success) syncedCount++
            }
        } catch (e) {
            console.error(`Sync loop failed for ${storeName}:`, e);
        }
    }

    return { success: true, count: syncedCount }
}

const syncSingleItem = async (storeName, item, db) => {
    try {
        let processedPhotos = []
        // Upload Photos
        if (item.fotos && item.fotos.length > 0) {
            console.log(`[Sync] Uploading ${item.fotos.length} photos for ${storeName}/${item.id}...`);
            processedPhotos = await Promise.all(item.fotos.map(async (foto) => {
                if (foto.data && foto.data.startsWith('data:image')) {
                    const blob = base64ToBlob(foto.data)
                    if (blob) {
                        // Correct folder mapping for different types
                        const folderMap = {
                            'vistorias': 'vistorias',
                            'interdicoes': 'interdicoes',
                            'shelters': 'shelters',
                            'occupants': 'occupants',
                            'donations': 'donations'
                        };
                        const folder = folderMap[storeName] || 'general'

                        const id = storeName === 'vistorias'
                            ? (item.vistoriaId || item.vistoria_id || item.id)
                            : (item.interdicaoId || item.interdicao_id || item.id || item.occupant_id || item.donation_id)
                        const fileName = `${id}/${foto.id}.jpg`
                        const { error: uploadError } = await supabase.storage
                            .from(folder)
                            .upload(fileName, blob, { upsert: true })

                        if (!uploadError) {
                            const { data: urlData } = supabase.storage
                                .from(folder)
                                .getPublicUrl(fileName)
                            return { ...foto, data: urlData.publicUrl }
                        }
                    }
                }
                return foto
            }))
        }

        const tableMap = {
            'shelters': 'shelters',
            'occupants': 'shelter_occupants',
            'donations': 'shelter_donations',
            'inventory': 'shelter_inventory',
            'distributions': 'shelter_distributions'
        };

        const table = tableMap[storeName] || storeName
        let payload = {}

        if (storeName === 'vistorias') {
            let officialId = item.vistoriaId || item.vistoria_id
            const currentYear = new Date().getFullYear();

            // [FIX] Robust Numeric Max ID Fetching
            // Fetch multiple records to find the TRUE numeric maximum, avoiding string sorting issues
            const { data: recentData, error: maxError } = await supabase
                .from('vistorias')
                .select('vistoria_id')
                .filter('vistoria_id', 'like', `%/${currentYear}`)
                .order('created_at', { ascending: false })
                .limit(50);

            if (maxError) {
                console.error(`[Sync] Error fetching max sequence for vistorias:`, maxError);
            }

            let maxNum = 0;
            // Scan remote recent records
            if (recentData && recentData.length > 0) {
                recentData.forEach(r => {
                    if (r.vistoria_id && r.vistoria_id.includes('/')) {
                        const num = parseInt(r.vistoria_id.split('/')[0]);
                        if (!isNaN(num)) maxNum = Math.max(maxNum, num);
                    }
                });
            }

            // [FIX] Safety check local data too (including unsynced and already synced)
            const localItems = await db.getAll('vistorias');
            localItems.forEach(vi => {
                const vid = vi.vistoriaId || vi.vistoria_id;
                if (vid && vid.includes(`/${currentYear}`)) {
                    const n = parseInt(vid.split('/')[0]);
                    if (!isNaN(n)) maxNum = Math.max(maxNum, n);
                }
            });

            // If we are assigning a NEW ID (was null), use max+1
            if (!officialId) {
                officialId = `${(maxNum + 1).toString().padStart(3, '0')}/${currentYear}`;
                console.log(`[Sync] Assigned NEW Vistoria ID: ${officialId} (Max found was ${maxNum})`);
            } else {
                console.log(`[Sync] Keeping existing Vistoria ID: ${officialId}`);
            }

            payload = {
                vistoria_id: officialId,
                processo: item.processo || '',
                agente: item.agente || '',
                matricula: item.matricula || '',
                solicitante: item.solicitante || '',
                cpf: item.cpf || '',
                telefone: item.telefone || '',
                endereco: item.endereco || '',
                bairro: item.bairro || '',
                latitude: item.latitude ? parseFloat(item.latitude) : null,
                longitude: item.longitude ? parseFloat(item.longitude) : null,
                coordenadas: item.coordenadas || (item.latitude && item.longitude ? `${item.latitude},${item.longitude}` : ''),
                data_hora: item.dataHora || item.data_hora || new Date().toISOString(),
                tipo_info: item.tipo_info || item.tipoInfo || item.categoriaRisco || 'Vistoria Geral',
                categoria_risco: item.categoriaRisco || item.categoria_risco || 'Outros',
                subtipos_risco: Array.isArray(item.subtiposRisco) ? item.subtiposRisco : (Array.isArray(item.subtipos_risco) ? item.subtipos_risco : []),
                nivel_risco: item.nivelRisco || item.nivel_risco || 'Baixo',
                situacao_observada: item.situacaoObservada || item.situacao_observada || 'Estabilizado',
                populacao_estimada: item.populacaoEstimada || item.populacao_estimada || '',
                grupos_vulneraveis: Array.isArray(item.gruposVulneraveis) ? item.gruposVulneraveis : (Array.isArray(item.grupos_vulneraveis) ? item.grupos_vulneraveis : []),
                observacoes: item.observacoes || '',
                medidas_tomadas: Array.isArray(item.medidasTomadas) ? item.medidasTomadas : (Array.isArray(item.medidas_tomadas) ? item.medidas_tomadas : []),
                encaminhamentos: Array.isArray(item.encaminhamentos) ? item.encaminhamentos : (Array.isArray(item.encaminhamentos) ? item.encaminhamentos : []),
                fotos: processedPhotos,
                documentos: Array.isArray(item.documentos) ? item.documentos : (Array.isArray(item.documentos) ? item.documentos : []),
                assinatura_agente: item.assinaturaAgente || item.assinatura_agente || null,
                checklist_respostas: item.checklistRespostas || item.checklist_respostas || {},
                apoio_tecnico: item.apoioTecnico || item.apoio_tecnico || null,
                created_at: item.createdAt || item.created_at || new Date().toISOString()
            }
        } else if (storeName === 'interdicoes') {
            let officialId = item.interdicaoId || item.interdicao_id

            if (!officialId) {
                const currentYear = new Date().getFullYear();
                const { data: maxData } = await supabase
                    .from('interdicoes')
                    .select('interdicao_id')
                    .filter('interdicao_id', 'like', `%/${currentYear}`)
                    .order('interdicao_id', { ascending: false })
                    .limit(1);

                let maxNum = 0;
                if (maxData && maxData.length > 0) {
                    const lastId = maxData[0].interdicao_id;
                    const num = parseInt(lastId.split('/')[0]);
                    if (!isNaN(num)) maxNum = num;
                }
                officialId = `${(maxNum + 1).toString().padStart(2, '0')}/${currentYear}`;
                console.log(`[Sync] Assigned new Interdicao ID: ${officialId}`);
            }

            payload = {
                interdicao_id: officialId,
                data_hora: item.dataHora || item.data_hora,
                tipo_info: item.tipo_info || item.tipoInfo || item.riscoTipo || 'Interdição',
                municipio: item.municipio,
                bairro: item.bairro,
                endereco: item.endereco,
                tipo_alvo: item.tipoAlvo,
                tipo_alvo_especificar: item.tipoAlvoEspecificar,
                latitude: item.latitude,
                longitude: item.longitude,
                coordenadas: item.coordenadas,
                responsavel_nome: item.responsavelNome,
                responsavel_cpf: item.responsavelCpf,
                responsavel_telefone: item.responsavelTelefone,
                responsavel_email: item.responsavelEmail,
                risco_tipo: item.riscoTipo,
                risco_grau: item.riscoGrau,
                situacao_observada: item.situacaoObservada,
                medida_tipo: item.medidaTipo,
                medida_prazo: item.medidaPrazo,
                medida_prazo_data: item.medidaPrazoData,
                evacuacao_necessaria: item.evacuacaoNecessaria,
                fotos: processedPhotos,
                relatorio_tecnico: item.relatorioTecnico,
                recomendacoes: item.recomendacoes,
                orgaos_acionados: item.orgaosAcionados,
                assinatura_agente: item.assinaturaAgente || item.assinatura_agente,
                apoio_tecnico: item.apoioTecnico || item.apoio_tecnico || null
            }
        } else {
            // Generic payload for shelter module tables (they already match Supabase schema)
            payload = { ...item };
            delete payload.id; // Remove local IDBK key
            delete payload.synced; // Remove sync flag
            delete payload.supabase_id; // Clean up mapping field if any

            // ID MAPPING: Fix foreign keys for humanitarian module
            // We must map local integer shelter_id/inventory_id to Supabase UUIDs
            if (payload.shelter_id && !isNaN(parseInt(payload.shelter_id))) {
                const shelter = await db.get('shelters', parseInt(payload.shelter_id));
                if (shelter && shelter.supabase_id) {
                    payload.shelter_id = shelter.supabase_id;
                }
            }
            if (payload.inventory_id && !isNaN(parseInt(payload.inventory_id))) {
                const inv = await db.get('inventory', parseInt(payload.inventory_id));
                if (inv && inv.supabase_id) {
                    payload.inventory_id = inv.supabase_id;
                }
            }
        }

        console.log(`[Sync] Upserting to Supabase table '${table}'...`, payload);
        const { data: syncedItems, error } = await supabase.from(table).upsert([payload], {
            onConflict: storeName === 'vistorias' ? 'vistoria_id' :
                storeName === 'interdicoes' ? 'interdicao_id' :
                    storeName === 'shelters' ? 'shelter_id' :
                        storeName === 'occupants' ? 'occupant_id' :
                            storeName === 'donations' ? 'donation_id' :
                                storeName === 'inventory' ? 'inventory_id' :
                                    storeName === 'distributions' ? 'distribution_id' :
                                        undefined
        }).select()

        if (error) {
            console.error(`[Sync] Supabase Upsert Error (${table}):`, error)
            return false
        }

        const tx = db.transaction(storeName, 'readwrite')
        const store = tx.objectStore(storeName)
        const record = await store.get(item.id)
        if (record) {
            record.synced = true

            // Capture official Supabase UUID for relations
            if (syncedItems && syncedItems[0]) {
                record.supabase_id = syncedItems[0].id;
            }

            // Update the local record with the official ID assigned by the server if applicable
            if (storeName === 'vistorias') {
                const officialId = syncedItems?.[0]?.vistoria_id || payload.vistoria_id;
                record.vistoriaId = officialId;
                record.vistoria_id = officialId;
            } else if (storeName === 'interdicoes') {
                const officialId = syncedItems?.[0]?.interdicao_id || payload.interdicao_id;
                record.interdicaoId = officialId;
                record.interdicao_id = officialId;
            }
            await store.put(record)
        }
        await tx.done
        console.log(`[Sync] Successfully synced ${storeName} item: ${officialId || item.id}`);
        return true
    } catch (e) {
        console.error(`[Sync] Critical failure for ${storeName}:`, e)
        return false
    }
}

// Global sync trigger for immediate use (with Debounce to prevent overload)
let syncTimeout = null;
export const triggerSync = async () => {
    if (syncTimeout) clearTimeout(syncTimeout);

    return new Promise((resolve) => {
        syncTimeout = setTimeout(async () => {
            if (navigator.onLine) {
                const result = await syncPendingData();
                resolve(result);
            } else {
                resolve({ success: false, reason: 'offline' });
            }
        }, 2000); // 2 second debounce
    });
}

export const getPendingVistorias = async () => {
    const db = await initDB()
    return db.getAllFromIndex('vistorias', 'synced', false)
}

export const deleteVistoriaLocal = async (id) => {
    const db = await initDB()
    // Find internal id if external id is provided
    let localId = id
    if (typeof id === 'string') {
        const all = await db.getAll('vistorias')
        const found = all.find(v => v.id === id || v.vistoria_id === id || v.supabase_id === id)
        if (found) localId = found.id
    }
    await db.delete('vistorias', localId)
}

export const deleteInterdicaoLocal = async (id) => {
    const db = await initDB()
    let localId = id
    if (typeof id === 'string') {
        const all = await db.getAll('interdicoes')
        const found = all.find(i => i.id === id || i.interdicao_id === id || i.supabase_id === id)
        if (found) localId = found.id
    }
    await db.delete('interdicoes', localId)
}

export const getAllVistoriasLocal = async () => {
    const db = await initDB()
    const all = await db.getAll('vistorias')
    // Ensure normalization for display mapping
    return all.map(v => ({
        ...v,
        tipo_info: v.tipo_info || v.tipoInfo || v.categoriaRisco || 'Vistoria Geral'
    }))
}

export const getAllInterdicoesLocal = async () => {
    const db = await initDB()
    const all = await db.getAll('interdicoes')
    return all.map(i => ({
        ...i,
        tipo_info: i.tipo_info || i.tipoInfo || i.riscoTipo || 'Interdição'
    }))
}

export const saveInterdicaoOffline = async (data) => {
    const db = await initDB()
    // Use .put instead of .add
    const localId = await db.put('interdicoes', {
        ...data,
        createdAt: data.createdAt || new Date().toISOString(),
        synced: false
    })

    if (navigator.onLine) {
        const item = await db.get('interdicoes', localId)
        await syncSingleItem('interdicoes', item, db)
    }

    return localId
}

export const clearLocalData = async () => {
    const db = await initDB()
    const stores = []
    if (db.objectStoreNames.contains('vistorias')) stores.push('vistorias')
    if (db.objectStoreNames.contains('interdicoes')) stores.push('interdicoes')

    if (stores.length > 0) {
        const tx = db.transaction(stores, 'readwrite')
        for (const s of stores) {
            await tx.objectStore(s).clear()
        }
        await tx.done
    }
}

export const resetDatabase = async () => {
    const db = await initDB()
    db.close()

    return new Promise((resolve, reject) => {
        const req = indexedDB.deleteDatabase(DB_NAME)
        req.onsuccess = () => resolve()
        req.onerror = () => reject()
        req.onblocked = () => {
            console.warn('DB delete blocked, reloading page...')
            window.location.reload()
            resolve()
        }
    })
}

// GeoRescue Logic
export const importInstallations = async (data, onProgress) => {
    const db = await initDB()

    // 1. Clear existing store first (single transaction)
    {
        const tx = db.transaction('installations', 'readwrite')
        await tx.objectStore('installations').clear()
        await tx.done
    }

    // 2. Process in chunks to avoid blocking the main thread and crashing IDB
    const CHUNK_SIZE = 1000
    const total = data.length
    let processed = 0

    for (let i = 0; i < total; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE)
        const tx = db.transaction('installations', 'readwrite')
        const store = tx.objectStore('installations')

        for (const item of chunk) {
            // Fix: Case sensitivity for UC codes
            const fullUC = item["Código Unidade Consumidora"] || item["CODIGO UNIDADE CONSUMIDORA"] || ""
            let ucCore = ""

            if (fullUC) {
                const parts = fullUC.split('.')
                if (parts.length >= 4) {
                    ucCore = parts[2] + parts[3]
                }
            }

            // Fix: Clean number for searching
            // Remove . and - from full UC to allow searching "0002..."
            const cleanFullUC = fullUC.replace(/\D/g, '')

            const doc = {
                ...item,
                id: item.id || (item["Instalação"] || Math.random().toString(36).substr(2, 9)),
                installation_number: item["Instalação"] ? String(item["Instalação"]) : String(item.installation_number || ''),
                full_uc: fullUC,
                clean_full_uc: cleanFullUC, // New field for search
                uc_core: ucCore,
                name: item.name || item.NOME || item.NOME_BAIRRO || '',
                address: item.address || item.LOGRADOURO || item.NOME_LOGRADOURO || '',
                // Fix: Flexible Latitude/Longitude keys
                lat: parseFloat(item.LATITUDE || item.Latitude || item.lat || item.pee_lat || item.client_lat || 0),
                lng: parseFloat(item.LONGITUDE || item.Longitude || item.lng || item.pee_lng || item.client_lng || 0)
            }
            store.put(doc)
        }
        await tx.done
        processed += chunk.length
        if (onProgress) onProgress(processed, total)

        // Small yield to UI
        await new Promise(r => setTimeout(r, 10))
    }
}

export const searchInstallations = async (query) => {
    const db = await initDB()
    if (!query) return []

    const cleanQuery = query.replace(/\D/g, '') // Remove dots, dashes, etc.

    // 1. If length is 6, search in uc_core index
    if (cleanQuery.length === 6) {
        const matches = await db.getAllFromIndex('installations', 'uc_core', cleanQuery)
        if (matches && matches.length > 0) return matches
    }

    // 2. If length is large, try to extract core and search
    if (cleanQuery.length >= 10) {
        // Pattern: 000221764205414 (extracted digits from 0.002.217.642.054-14)
        // Core digits: index 4 to 10 (217642)
        const core = cleanQuery.substring(4, 10)
        const matches = await db.getAllFromIndex('installations', 'uc_core', core)
        if (matches && matches.length > 0) return matches
    }

    // 3. Exact index match for old installation number
    const exactMatch = await db.getFromIndex('installations', 'installation_number', query)
    if (exactMatch) return [exactMatch]

    // 4. Exact index match for installation_number but as string if query is numeric
    if (/^\d+$/.test(query)) {
        const numMatch = await db.getFromIndex('installations', 'installation_number', query)
        if (numMatch) return [numMatch]
    }

    // 5. Fallback search (names, addresses, full UC)
    const all = await db.getAll('installations')
    const lowerQuery = query.toLowerCase()

    return all.filter(item => {
        return (
            (item.name && item.name.toLowerCase().includes(lowerQuery)) ||
            (item.address && item.address.toLowerCase().includes(lowerQuery)) ||
            (item.full_uc && item.full_uc.includes(query)) ||
            (item.clean_full_uc && item.clean_full_uc.includes(cleanQuery)) || // Search by raw numbers
            (item.installation_number && String(item.installation_number).includes(query)) ||
            (item.uc_core && item.uc_core === cleanQuery)
        )
    }).slice(0, 50)
}

export const getInstallationsCount = async () => {
    const db = await initDB()
    return db.count('installations')
}

// Remote Vistorias Cache Helpers
export const getRemoteVistoriasCache = async () => {
    const db = await initDB()
    return db.getAll('remote_vistorias_cache')
}

export const saveRemoteVistoriasCache = async (data) => {
    const db = await initDB()
    const tx = db.transaction('remote_vistorias_cache', 'readwrite')
    const store = tx.objectStore('remote_vistorias_cache')
    for (const item of data) {
        await store.put(item)
    }
    await tx.done
}
// --- EMERGENCY CONTRACTS ---

export const getContracts = async () => {
    const db = await initDB();
    const all = await db.getAll('emergency_contracts');
    const active = all.filter(c => c.status !== 'deleted');

    // Fallback: Smart Seed (Check and add missing seed items)
    const seedData = [
        { contract_id: 'CTR-SEED-001', contract_number: '2025-1V6400', object_description: 'Filtros', start_date: '2025-06-19', end_date: '2026-06-18', total_value: 18250.00, status: 'active', synced: true },
        { contract_id: 'CTR-SEED-002', contract_number: '2025-XVC15', object_description: 'Cestas Básicas', start_date: '2025-06-02', end_date: '2026-06-01', total_value: 210600.00, status: 'active', synced: true },
        { contract_id: 'CTR-SEED-003', contract_number: '2025-9J0PF', object_description: 'Cestas de Limpeza', start_date: '2025-06-02', end_date: '2026-06-01', total_value: 31122.00, status: 'active', synced: true },
        { contract_id: 'CTR-SEED-004', contract_number: '2025-VW0H6', object_description: 'Colchões', start_date: '2025-06-02', end_date: '2026-06-05', total_value: 41660.00, status: 'active', synced: true },
        { contract_id: 'CTR-SEED-005', contract_number: '2025-LXCTX', object_description: 'Mantas', start_date: '2025-06-10', end_date: '2026-06-09', total_value: 12975.00, status: 'active', synced: true },
        { contract_id: 'CTR-SEED-006', contract_number: '2025-LXSOQ', object_description: 'Higiene e Limpeza', start_date: '2025-08-15', end_date: '2026-08-15', total_value: 1138.00, status: 'active', synced: true },
        { contract_id: 'CTR-SEED-007', contract_number: '2025-L1F26', object_description: 'Marmitas', start_date: '2025-09-25', end_date: '2026-09-24', total_value: 2756.80, status: 'active', synced: true }
    ];

    const missingItems = seedData.filter(seed =>
        !active.some(existing => existing.contract_number === seed.contract_number)
    );

    // Data Fix: If Filtros (2025-1V6400) exists but has the wrong value (18.25), update it
    const filtros = active.find(c => c.contract_number === '2025-1V6400');
    if (filtros && (filtros.total_value === 18.25 || filtros.total_value < 100)) {
        const tx = db.transaction('emergency_contracts', 'readwrite');
        const updated = { ...filtros, total_value: 18250.00, synced: false };
        await tx.store.put(updated);
        await tx.done;
        // Update local list for immediate return
        const idx = active.findIndex(c => c.contract_number === '2025-1V6400');
        active[idx] = updated;
    }

    if (missingItems.length > 0) {
        const tx = db.transaction('emergency_contracts', 'readwrite');
        for (const item of missingItems) {
            await tx.store.put(item);
            active.push(item); // Update local list for immediate return
        }
        await tx.done;
    }

    return active;
}

export const addContract = async (contractData) => {
    const db = await initDB();
    const newContract = {
        ...contractData,
        contract_id: contractData.contract_id || `CTR-${Date.now()}`,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        synced: false
    };
    const id = await db.add('emergency_contracts', newContract);
    triggerSync();
    return id;
}

export const getContract = async (id) => {
    const db = await initDB();
    // Support numeric ID (manual) or string ID (seeded/uuid)
    return db.getAll('emergency_contracts').then(all =>
        all.find(c => c.id == id || c.contract_id === id)
    );
}

export const updateContract = async (id, updates) => {
    const db = await initDB();
    const tx = db.transaction('emergency_contracts', 'readwrite');
    const store = tx.objectStore('emergency_contracts');

    // Find record by multiple possible IDs
    const all = await store.getAll();
    const record = all.find(c => c.id == id || c.contract_id === id);

    if (record) {
        const updatedRecord = { ...record, ...updates, synced: false, updated_at: new Date().toISOString() };
        await store.put(updatedRecord);
        await tx.done;
        triggerSync();
        return true;
    }
    return false;
}

export const deleteContract = async (id) => {
    const db = await initDB();
    // Support both ID types
    let contract = null;
    if (typeof id === 'number') {
        contract = await db.get('emergency_contracts', id);
    } else {
        const all = await db.getAll('emergency_contracts');
        contract = all.find(c => c.contract_id === id);
    }

    if (contract) {
        contract.status = 'deleted';
        contract.synced = false;
        await db.put('emergency_contracts', contract);
        triggerSync();
    }
}
