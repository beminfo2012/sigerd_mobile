import { openDB } from 'idb'
import { supabase } from './supabase'

const DB_NAME = 'defesa-civil-db'
const DB_VERSION = 3

export const initDB = async () => {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion) {
            // ... existing stores code ...
            if (!db.objectStoreNames.contains('installations')) {
                const store = db.createObjectStore('installations', { keyPath: 'id' })
                store.createIndex('installation_number', 'installation_number', { unique: false })
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
            payload = {
                vistoria_id: item.vistoriaId || item.vistoria_id || item.id,
                processo: item.processo,
                agente: item.agente,
                matricula: item.matricula,
                solicitante: item.solicitante,
                cpf: item.cpf,
                telefone: item.telefone,
                endereco_solicitante: item.enderecoSolicitante,
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
            payload = {
                interdicao_id: item.interdicaoId,
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
                assinatura_agente: item.assinaturaAgente || item.assinatura_agente
            }
        }

        const { error } = await supabase.from(table).insert([payload])

        if (error) {
            console.error(`Supabase Insert Error (${table}):`, error)
            // Temporary alert to see the error in production/user device
            alert(`Erro na sincronização (${table}): ${error.message} - ${error.details || ''}`)
            return false
        }

        const tx = db.transaction(type, 'readwrite')
        const store = tx.objectStore(type)
        const record = await store.get(item.id)
        if (record) {
            record.synced = true
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
