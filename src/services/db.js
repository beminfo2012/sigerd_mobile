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

export const saveVistoriaOffline = async (data) => {
    const db = await initDB()

    // Save to IndexedDB first (offline support)
    const localId = await db.add('vistorias', {
        ...data,
        createdAt: new Date().toISOString(),
        synced: false
    })

    // Try to sync with Supabase immediately if online
    try {
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
                fotos: data.fotos,
                documentos: data.documentos
            }])
            .select()

        if (!error) {
            // Mark as synced in IndexedDB
            const tx = db.transaction('vistorias', 'readwrite')
            const store = tx.objectStore('vistorias')
            const record = await store.get(localId)
            if (record) {
                record.synced = true
                await store.put(record)
            }
            await tx.done
            console.log('Vistoria synced to Supabase:', supabaseData)
        } else {
            console.warn('Supabase sync failed, will retry later:', error)
        }
    } catch (error) {
        console.warn('Offline mode - Supabase not available:', error)
    }

    return localId
}

export const getPendingVistorias = async () => {
    const db = await initDB()
    return db.getAllFromIndex('vistorias', 'synced', false)
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
