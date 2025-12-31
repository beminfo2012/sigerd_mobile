import { openDB } from 'idb'
import { supabase } from './supabase'

const DB_NAME = 'defesa-civil-db'
const DB_VERSION = 1

export const initDB = async () => {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            // Store for Electrical Installations (GeoRescue)
            if (!db.objectStoreNames.contains('installations')) {
                const store = db.createObjectStore('installations', { keyPath: 'id' })
                store.createIndex('installation_number', 'installation_number', { unique: false })
            }

            // Store for Vistorias (Offline Sync)
            if (!db.objectStoreNames.contains('vistorias')) {
                const store = db.createObjectStore('vistorias', { keyPath: 'id', autoIncrement: true })
                store.createIndex('synced', 'synced', { unique: false })
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
        try {
            let processedPhotos = []

            // Upload Photos to Storage
            if (data.fotos && data.fotos.length > 0) {
                processedPhotos = await Promise.all(data.fotos.map(async (foto) => {
                    if (foto.data && foto.data.startsWith('data:image')) {
                        const blob = base64ToBlob(foto.data)
                        if (blob) {
                            const fileName = `${data.vistoriaId}/${foto.id}.jpg`
                            const { error: uploadError } = await supabase.storage
                                .from('vistorias')
                                .upload(fileName, blob, { upsert: true })

                            if (!uploadError) {
                                const { data: urlData } = supabase.storage
                                    .from('vistorias')
                                    .getPublicUrl(fileName)
                                return { ...foto, data: urlData.publicUrl }
                            }
                        }
                    }
                    return foto // Return original if upload fails or not base64
                }))
            }

            // Insert into Database with URLs
            const { data: supabaseData, error } = await supabase
                .from('vistorias')
                .insert([{
                    vistoria_id: data.vistoriaId,
                    processo: data.processo,
                    agente: data.agente,
                    matricula: data.matricula,
                    solicitante: data.solicitante,
                    cpf: data.cpf,
                    telefone: data.telefone,
                    endereco: data.endereco,
                    coordenadas: data.coordenadas,
                    data_hora: data.dataHora,
                    tipo_info: data.tipoInfo,
                    observacoes: data.observacoes,
                    fotos: processedPhotos, // URLs now
                    documentos: data.documentos // TODO: Handle docs likely
                }])
                .select()

            if (!error) {
                // Mark as synced in IndexedDB
                const tx = db.transaction('vistorias', 'readwrite')
                const store = tx.objectStore('vistorias')
                const record = await store.get(localId)
                if (record) {
                    record.synced = true
                    // Optionally update local record photos to URLs to save space? 
                    // No, keep base64 for offline viewing reliability until re-fetch logic is robust.
                    await store.put(record)
                }
                await tx.done
                console.log('Vistoria synced to Supabase (with Storage):', supabaseData)
            } else {
                console.warn('Supabase sync failed, will retry later:', error)
            }
        } catch (error) {
            console.warn('Offline mode - Supabase not available:', error)
        }
    }

    return localId
}

export const getPendingSyncCount = async () => {
    const db = await initDB()
    try {
        return await db.countFromIndex('vistorias', 'synced', 0) // synced=false usually stored as 0 or false
    } catch (e) {
        // Fallback for different idb versions or data types
        const all = await db.getAllFromIndex('vistorias', 'synced', false)
        return all.length
    }
}

export const syncPendingData = async () => {
    const db = await initDB()
    const pending = await db.getAllFromIndex('vistorias', 'synced', false)

    if (pending.length === 0) return { success: true, count: 0 }

    let syncedCount = 0
    for (const item of pending) {
        try {
            let processedPhotos = []
            // Upload Photos
            if (item.fotos && item.fotos.length > 0) {
                processedPhotos = await Promise.all(item.fotos.map(async (foto) => {
                    if (foto.data && foto.data.startsWith('data:image')) {
                        const blob = base64ToBlob(foto.data)
                        if (blob) {
                            const fileName = `${item.vistoriaId}/${foto.id}.jpg`
                            const { error: uploadError } = await supabase.storage
                                .from('vistorias')
                                .upload(fileName, blob, { upsert: true })

                            if (!uploadError) {
                                const { data: urlData } = supabase.storage
                                    .from('vistorias')
                                    .getPublicUrl(fileName)
                                return { ...foto, data: urlData.publicUrl }
                            }
                        }
                    }
                    return foto
                }))
            }

            // Sync to Supabase
            const { error } = await supabase
                .from('vistorias')
                .insert([{
                    vistoria_id: item.vistoriaId,
                    processo: item.processo,
                    agente: item.agente,
                    matricula: item.matricula,
                    solicitante: item.solicitante,
                    cpf: item.cpf,
                    telefone: item.telefone,
                    endereco: item.endereco,
                    coordenadas: item.coordenadas,
                    data_hora: item.dataHora,
                    tipo_info: item.tipoInfo,
                    observacoes: item.observacoes,
                    fotos: processedPhotos,
                    documentos: item.documentos
                }])

            if (!error) {
                const tx = db.transaction('vistorias', 'readwrite')
                const store = tx.objectStore('vistorias')
                const record = await store.get(item.id)
                if (record) {
                    record.synced = true
                    await store.put(record)
                }
                await tx.done
                syncedCount++
            }
        } catch (e) {
            console.error('Individual sync error:', e)
        }
    }

    return { success: true, count: syncedCount }
}

export const getPendingVistorias = async () => {
    const db = await initDB()
    return db.getAllFromIndex('vistorias', 'synced', false)
}

export const getAllVistoriasLocal = async () => {
    const db = await initDB()
    return db.getAll('vistorias')
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
        // Map fields if necessary specific to EDP report
        // Assuming CSV columns match what we want or we map here
        // We ensure 'installation_number' exists for indexing
        if (item.installation_number || item.numero_instalacao || item.instalacao) {
            const doc = {
                ...item,
                installation_number: item.installation_number || item.numero_instalacao || item.instalacao
            }
            store.put(doc)
        }
    }

    await tx.done
}

export const searchInstallations = async (query) => {
    const db = await initDB()
    // For large datasets, getAll() and filtering in JS might be slow but 20k is manageable.
    // Ideally use index for exact match.

    if (!query) return []

    // Try exact index match first
    const exactMatch = await db.getFromIndex('installations', 'installation_number', query)
    if (exactMatch) return [exactMatch]

    // Fallback search (names, addresses) - limitation of IndexedDB: 
    // basic exact match is fast, string search needs cursor or GetAll
    // We'll limit results
    const all = await db.getAll('installations')
    const lowerQuery = query.toLowerCase()

    return all.filter(item => {
        return Object.values(item).some(val =>
            String(val).toLowerCase().includes(lowerQuery)
        )
    }).slice(0, 50) // Limit to 50 results
}

export const getInstallationsCount = async () => {
    const db = await initDB()
    return db.count('installations')
}
