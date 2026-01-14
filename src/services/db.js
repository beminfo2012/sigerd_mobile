import { openDB } from 'idb'
import { supabase } from './supabase'

const DB_NAME = 'defesa-civil-db'
const DB_VERSION = 8

export const initDB = async () => {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion) {
            // ... existing stores code ...
            if (!db.objectStoreNames.contains('installations')) {
                const store = db.createObjectStore('installations', { keyPath: 'id' })
                store.createIndex('installation_number', 'installation_number', { unique: false })
                store.createIndex('uc_core', 'uc_core', { unique: false })
            } else if (oldVersion < 7) {
                // Version 7 update: Re-import with improved key mapping and new search fields
                if (db.objectStoreNames.contains('installations')) {
                    db.deleteObjectStore('installations')
                }
                const store = db.createObjectStore('installations', { keyPath: 'id' })
                store.createIndex('installation_number', 'installation_number', { unique: false })
                store.createIndex('uc_core', 'uc_core', { unique: false })
            }

            if (!db.objectStoreNames.contains('vistorias')) {
                const store = db.createObjectStore('vistorias', { keyPath: 'id', autoIncrement: true })
                store.createIndex('synced', 'synced', { unique: false })
            }

            if (!db.objectStoreNames.contains('interdicoes')) {
                const store = db.createObjectStore('interdicoes', { keyPath: 'id', autoIncrement: true })
                store.createIndex('synced', 'synced', { unique: false })
            }

            // Store for Remote Vistorias Cache - Version 3 improvement: Use vistoria_id or id
            if (db.objectStoreNames.contains('remote_vistorias_cache')) {
                db.deleteObjectStore('remote_vistorias_cache')
            }
            // Use autoIncrement to avoid key errors, but we will manage unique records in api.js
            db.createObjectStore('remote_vistorias_cache', { keyPath: 'vistoria_id' })

            // Shelter Management Stores - Version 8
            if (!db.objectStoreNames.contains('shelters')) {
                const store = db.createObjectStore('shelters', { keyPath: 'id', autoIncrement: true })
                store.createIndex('synced', 'synced', { unique: false })
                store.createIndex('status', 'status', { unique: false })
            }

            if (!db.objectStoreNames.contains('shelter_occupants')) {
                const store = db.createObjectStore('shelter_occupants', { keyPath: 'id', autoIncrement: true })
                store.createIndex('synced', 'synced', { unique: false })
                store.createIndex('shelter_id', 'shelter_id', { unique: false })
            }

            if (!db.objectStoreNames.contains('shelter_donations')) {
                const store = db.createObjectStore('shelter_donations', { keyPath: 'id', autoIncrement: true })
                store.createIndex('synced', 'synced', { unique: false })
                store.createIndex('shelter_id', 'shelter_id', { unique: false })
            }

            if (!db.objectStoreNames.contains('shelter_inventory')) {
                const store = db.createObjectStore('shelter_inventory', { keyPath: 'id', autoIncrement: true })
                store.createIndex('synced', 'synced', { unique: false })
                store.createIndex('shelter_id', 'shelter_id', { unique: false })
            }

            if (!db.objectStoreNames.contains('shelter_distributions')) {
                const store = db.createObjectStore('shelter_distributions', { keyPath: 'id', autoIncrement: true })
                store.createIndex('synced', 'synced', { unique: false })
                store.createIndex('shelter_id', 'shelter_id', { unique: false })
            }
        },
    })
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

    // 1. Save to IndexedDB first (keep base64 for offline usage)
    const localId = await db.add('vistorias', {
        ...data,
        createdAt: new Date().toISOString(),
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

    // Using getAll and filter to catch undefined, false or 0 values reliably
    const vistorias = await db.getAll('vistorias').catch(() => [])
    const interdicoes = await db.getAll('interdicoes').catch(() => [])

    const p1 = vistorias.filter(v => v.synced === false || v.synced === undefined || v.synced === 0).length
    const p2 = interdicoes.filter(i => i.synced === false || i.synced === undefined || i.synced === 0).length

    return p1 + p2
}

export const syncPendingData = async () => {
    const db = await initDB()

    // Sync Vistorias - Robust filter to include undefined or legacy flags
    const allVistorias = await db.getAll('vistorias')
    const pendingVistorias = allVistorias.filter(v => v.synced === false || v.synced === undefined || v.synced === 0)

    let syncedCount = 0

    for (const item of pendingVistorias) {
        const success = await syncSingleItem('vistorias', item, db)
        if (success) syncedCount++
    }

    // Sync Interdições
    const allInterdicoes = await db.getAll('interdicoes')
    const pendingInterdicoes = allInterdicoes.filter(i => i.synced === false || i.synced === undefined || i.synced === 0)

    for (const item of pendingInterdicoes) {
        const success = await syncSingleItem('interdicoes', item, db)
        if (success) syncedCount++
    }

    return { success: true, count: syncedCount }
}

const syncSingleItem = async (type, item, db) => {
    try {
        let processedPhotos = []
        // Upload Photos
        if (item.fotos && item.fotos.length > 0) {
            processedPhotos = await Promise.all(item.fotos.map(async (foto) => {
                if (foto.data && foto.data.startsWith('data:image')) {
                    const blob = base64ToBlob(foto.data)
                    if (blob) {
                        const folder = type === 'vistorias' ? 'vistorias' : 'interdicoes'
                        const id = type === 'vistorias'
                            ? (item.vistoriaId || item.vistoria_id || item.id)
                            : (item.interdicaoId || item.interdicao_id || item.id)
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

        const table = type === 'vistorias' ? 'vistorias' : 'interdicoes'
        let payload = {}

        if (type === 'vistorias') {
            let officialId = item.vistoriaId || item.vistoria_id

            // If ID is missing (offline record), fetch next sequence from server
            if (!officialId) {
                const currentYear = new Date().getFullYear();
                const { data: maxData } = await supabase
                    .from('vistorias')
                    .select('vistoria_id')
                    .filter('vistoria_id', 'like', `%/${currentYear}`)
                    .order('vistoria_id', { ascending: false })
                    .limit(1);

                let maxNum = 0;
                if (maxData && maxData.length > 0) {
                    const lastId = maxData[0].vistoria_id;
                    const num = parseInt(lastId.split('/')[0]);
                    if (!isNaN(num)) maxNum = num;
                }
                officialId = `${(maxNum + 1).toString().padStart(3, '0')}/${currentYear}`;
                console.log(`[Sync] Assigned new Vistoria ID: ${officialId}`);
            }

            payload = {
                vistoria_id: officialId,
                processo: item.processo,
                agente: item.agente,
                matricula: item.matricula,
                solicitante: item.solicitante,
                cpf: item.cpf,
                telefone: item.telefone,
                endereco: item.endereco,
                bairro: item.bairro,
                latitude: parseFloat(item.latitude) || null,
                longitude: parseFloat(item.longitude) || null,
                coordenadas: item.coordenadas,
                data_hora: item.dataHora,
                categoria_risco: item.categoriaRisco,
                subtipos_risco: item.subtiposRisco,
                nivel_risco: item.nivelRisco,
                situacao_observada: item.situacaoObservada,
                populacao_estimada: item.populacaoEstimada,
                grupos_vulneraveis: item.gruposVulneraveis,
                observacoes: item.observacoes,
                medidas_tomadas: item.medidasTomadas,
                encaminhamentos: item.encaminhamentos,
                fotos: processedPhotos,
                documentos: item.documentos,
                assinatura_agente: item.assinaturaAgente || item.assinatura_agente,
                checklist_respostas: item.checklistRespostas || item.checklist_respostas,
                apoio_tecnico: item.apoioTecnico || item.apoio_tecnico || null
            }
        } else {
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
                data_hora: item.dataHora,
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
        }

        const { error } = await supabase.from(table).insert([payload])

        if (error) {
            console.error(`Supabase Insert Error (${table}):`, error)
            return false
        }

        const tx = db.transaction(type, 'readwrite')
        const store = tx.objectStore(type)
        const record = await store.get(item.id)
        if (record) {
            record.synced = true
            // Update the local record with the official ID assigned by the server
            if (type === 'vistorias') {
                record.vistoriaId = payload.vistoria_id;
                record.vistoria_id = payload.vistoria_id;
            } else {
                record.interdicaoId = payload.interdicao_id;
                record.interdicao_id = payload.interdicao_id;
            }
            await store.put(record)
        }
        await tx.done
        return true
    } catch (e) {
        console.error(`Sync error for ${type}:`, e)
        return false
    }
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
        const found = all.find(v => v.id === id || v.vistoria_id === id)
        if (found) localId = found.id
    }
    await db.delete('vistorias', localId)
}

export const deleteInterdicaoLocal = async (id) => {
    const db = await initDB()
    let localId = id
    if (typeof id === 'string') {
        const all = await db.getAll('interdicoes')
        const found = all.find(i => i.id === id || i.interdicao_id === id)
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
    const localId = await db.add('interdicoes', {
        ...data,
        createdAt: new Date().toISOString(),
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
export const importInstallations = async (data) => {
    const db = await initDB()
    const tx = db.transaction('installations', 'readwrite')
    const store = tx.objectStore('installations')

    // Clear existing to avoid duplicates on re-import
    await store.clear()

    // Batch add
    for (const item of data) {
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
