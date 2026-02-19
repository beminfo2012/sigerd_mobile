import { openDB } from 'idb'
import { supabase } from './supabase'

const DB_NAME = 'defesa-civil-db'
const DB_VERSION = 19;

let dbPromise = null;

export const initDB = async () => {
    if (dbPromise) return dbPromise;

    dbPromise = openDB(DB_NAME, DB_VERSION, {
        async upgrade(db, oldVersion, newVersion, transaction) {
            const ensureIndices = (storeName, indices = ['synced', 'supabase_id']) => {
                if (db.objectStoreNames.contains(storeName)) {
                    const store = transaction.objectStore(storeName);
                    indices.forEach(idx => {
                        if (!store.indexNames.contains(idx)) {
                            store.createIndex(idx, idx, { unique: false });
                        }
                    });
                }
            };

            const storeConfigs = [
                { name: 'vistorias', auto: true },
                { name: 'interdicoes', auto: true },
                { name: 'shelters', auto: true },
                { name: 'occupants', auto: true, extra: ['shelter_id'] },
                { name: 'donations', auto: true, extra: ['shelter_id'] },
                { name: 'inventory', auto: true, extra: ['shelter_id', 'item_id'] },
                { name: 'distributions', auto: true, extra: ['shelter_id'] },
                { name: 'audit_log', auto: true, extra: ['entity_type', 'entity_id', 'timestamp'] },
                { name: 'emergency_contracts', auto: true, extra: ['contract_id'] },
                { name: 'manual_readings', auto: true, extra: ['date'] },
                { name: 's2id_records', auto: true, extra: ['status', 'created_at'] },
                { name: 'despachos', auto: true, extra: ['despacho_id', 'vistoria_id', 'created_at'] }
            ];

            storeConfigs.forEach(cfg => {
                if (!db.objectStoreNames.contains(cfg.name)) {
                    const store = db.createObjectStore(cfg.name, { keyPath: 'id', autoIncrement: cfg.auto });
                    store.createIndex('synced', 'synced', { unique: false });
                    store.createIndex('supabase_id', 'supabase_id', { unique: false });
                    if (cfg.extra) {
                        cfg.extra.forEach(idx => store.createIndex(idx, idx, { unique: false }));
                    }
                } else {
                    ensureIndices(cfg.name, ['synced', 'supabase_id', ...(cfg.extra || [])]);
                }
            });

            // Special case for installations which doesn't have synced/supabase_id typically
            if (!db.objectStoreNames.contains('installations')) {
                const installationStore = db.createObjectStore('installations', { keyPath: 'id' });
                installationStore.createIndex('installation_number', 'installation_number', { unique: true });
                installationStore.createIndex('uc_core', 'uc_core', { unique: false });
            }
            if (!db.objectStoreNames.contains('remote_vistorias_cache')) {
                db.createObjectStore('remote_vistorias_cache', { keyPath: 'id' });
            }
        },
    });
    return dbPromise;
}

const base64ToBlob = (base64) => {
    try {
        const parts = base64.split(';base64,')
        if (parts.length < 2) return null;
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

export const saveManualReading = async (volume, date, period = '1h') => {
    const db = await initDB()
    const reading = {
        station_id: 'MANUAL_SEDE',
        volume: parseFloat(volume),
        date: date || new Date().toISOString(),
        period: period,
        created_at: new Date().toISOString(),
        synced: false
    }
    const id = await db.put('manual_readings', reading)
    return id
}

export const getManualReadings = async () => {
    const db = await initDB()
    const all = await db.getAll('manual_readings')
    return all.sort((a, b) => new Date(b.date) - new Date(a.date))
}

export const deleteManualReading = async (id) => {
    const db = await initDB()
    await db.delete('manual_readings', id)
}

export const saveVistoriaOffline = async (data) => {
    const db = await initDB()
    const localId = await db.put('vistorias', {
        ...data,
        createdAt: data.createdAt || data.created_at || new Date().toISOString(),
        synced: false
    })
    if (navigator.onLine) {
        const item = await db.get('vistorias', localId)
        await syncSingleItem('vistorias', item, db)
    }
    return localId
}

export const getPendingSyncCount = async () => {
    const db = await initDB()
    const stores = ['vistorias', 'interdicoes', 'shelters', 'occupants', 'donations', 'inventory', 'distributions', 's2id_records', 'emergency_contracts', 'manual_readings', 'despachos'];
    let detail = {
        total: 0,
        photosTotal: 0,
        vistorias: 0,
        interdicoes: 0,
        shelters: 0,
        occupants: 0,
        donations: 0,
        inventory: 0,
        distributions: 0,
        s2id_records: 0,
        emergency_contracts: 0,
        manual_readings: 0,
        despachos: 0
    };

    for (const storeName of stores) {
        try {
            const allItems = await db.getAll(storeName).catch(() => []);
            const pendingItems = allItems.filter(v => v.synced === false || v.synced === undefined || v.synced === 0);
            detail[storeName] = pendingItems.length;
            detail.total += pendingItems.length;
            pendingItems.forEach(item => {
                if (item.fotos && Array.isArray(item.fotos)) {
                    const pendingPhotos = item.fotos.filter(f => f.data && (f.data.startsWith('data:image') || f.data.length > 500)).length;
                    detail.photosTotal += pendingPhotos;
                }
            });
        } catch (e) {
            console.warn(`Sync count failed for ${storeName}:`, e);
        }
    }
    return detail;
}

const resolveSupabaseId = async (storeName, id) => {
    if (!id) return null;
    const dbInstance = await initDB();
    if (typeof id === 'string' && id.length === 36 && id.includes('-')) return id;
    if (!isNaN(parseInt(id))) {
        const record = await dbInstance.get(storeName, parseInt(id));
        if (record && record.supabase_id) return record.supabase_id;
    }
    if (typeof id === 'string') {
        const indexMap = { 'shelters': 'shelter_id', 'occupants': 'occupant_id', 'inventory': 'item_id', 's2id_records': 's2id_id' };
        const indexName = indexMap[storeName];
        if (indexName) {
            const record = await dbInstance.getFromIndex(storeName, indexName, id);
            if (record && record.supabase_id) return record.supabase_id;
        }
    }
    return null;
};

export const syncPendingData = async () => {
    const db = await initDB()
    const stores = ['vistorias', 'interdicoes', 'shelters', 'occupants', 'donations', 'inventory', 'distributions', 's2id_records', 'emergency_contracts', 'manual_readings', 'despachos'];
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
        let signatureAgenteUrl = null
        let processedApoio = null

        if (item.fotos && item.fotos.length > 0) {
            processedPhotos = await Promise.all(item.fotos.map(async (foto) => {
                if (foto.data && (foto.data.startsWith('data:image') || foto.data.length > 500)) {
                    const base64Data = foto.data.startsWith('data:image') ? foto.data : `data:image/jpeg;base64,${foto.data}`;
                    const blob = base64ToBlob(base64Data)
                    if (blob) {
                        const folderMap = { 'vistorias': 'vistorias', 'interdicoes': 'interdicoes', 'shelters': 'shelters', 'occupants': 'occupants', 'donations': 'donations', 's2id_records': 's2id_evidencias' };
                        const folder = folderMap[storeName] || 'general'
                        const idValue = storeName === 'vistorias' ? (item.vistoriaId || item.vistoria_id || item.id) : (item.interdicaoId || item.interdicao_id || item.id || item.occupant_id || item.donation_id || item.s2id_id)
                        const fileName = `${idValue}/${foto.id || Date.now()}.jpg`
                        const { error: uploadError } = await supabase.storage.from(folder).upload(fileName, blob, { upsert: true })
                        if (!uploadError) {
                            const { data: urlData } = supabase.storage.from(folder).getPublicUrl(fileName)
                            return { ...foto, data: urlData.publicUrl }
                        }
                    }
                }
                return (foto.data && foto.data.startsWith('http')) ? foto : { ...foto, data: null, error: 'Upload failed' };
            }))
        }

        // Handle S2ID evidence photos (different structure)
        if (storeName === 's2id_records' && item.data?.evidencias && Array.isArray(item.data.evidencias)) {
            const processedEvidencias = await Promise.all(item.data.evidencias.map(async (ev, index) => {
                if (ev.url && (ev.url.startsWith('data:image') || ev.url.length > 500)) {
                    const blob = base64ToBlob(ev.url);
                    if (blob) {
                        const folder = 's2id_evidencias';
                        const idValue = item.s2id_id || item.id;
                        const fileName = `${idValue}/evidence_${index}_${Date.now()}.jpg`;
                        const { error: uploadError } = await supabase.storage.from(folder).upload(fileName, blob, { upsert: true });
                        if (!uploadError) {
                            const { data: urlData } = supabase.storage.from(folder).getPublicUrl(fileName);
                            return { ...ev, url: urlData.publicUrl };
                        }
                    }
                }
                return ev;
            }));
            item.data.evidencias = processedEvidencias;
        }

        const tableMap = { 'shelters': 'shelters', 'occupants': 'shelter_occupants', 'donations': 'shelter_donations', 'inventory': 'shelter_inventory', 'distributions': 'shelter_distributions', 's2id_records': 's2id_records' };
        const table = tableMap[storeName] || storeName
        let payload = {}

        if (storeName === 'vistorias') {
            let officialId = item.vistoriaId || item.vistoria_id
            const currentYear = new Date().getFullYear();
            const { data: recentData } = await supabase.from('vistorias').select('vistoria_id').filter('vistoria_id', 'like', `%/${currentYear}`).order('created_at', { ascending: false }).limit(50);
            let maxNum = 0;
            if (recentData) {
                recentData.forEach(r => {
                    if (r.vistoria_id && r.vistoria_id.includes('/')) {
                        const num = parseInt(r.vistoria_id.split('/')[0]);
                        if (!isNaN(num)) maxNum = Math.max(maxNum, num);
                    }
                });
            }
            const localItems = await db.getAll('vistorias');
            localItems.forEach(vi => {
                const vid = vi.vistoriaId || vi.vistoria_id;
                if (vid && vid.includes(`/${currentYear}`)) {
                    const n = parseInt(vid.split('/')[0]);
                    if (!isNaN(n)) maxNum = Math.max(maxNum, n);
                }
            });
            if (!officialId) officialId = `${(maxNum + 1).toString().padStart(3, '0')}/${currentYear}`;

            let signatureAgenteStr = item.assinatura_agente !== undefined ? item.assinatura_agente : (item.assinaturaAgente !== undefined ? item.assinaturaAgente : null);
            let supportSignatureStr = item.apoio_tecnico?.assinatura !== undefined ? item.apoio_tecnico.assinatura : (item.apoioTecnico?.assinatura !== undefined ? item.apoioTecnico.assinatura : null);

            const uploadSign = async (base64, type) => {
                if (base64 && base64.startsWith('data:image')) {
                    const blob = base64ToBlob(base64);
                    if (blob) {
                        const fileName = `${officialId}/signature_${type}.png`;
                        const { error: uploadError } = await supabase.storage.from('vistorias').upload(fileName, blob, { upsert: true });
                        if (!uploadError) {
                            const { data: urlData } = supabase.storage.from('vistorias').getPublicUrl(fileName);
                            return urlData.publicUrl;
                        }
                    }
                }
                return (base64 && base64.startsWith('http')) ? base64 : null;
            };

            signatureAgenteUrl = await uploadSign(signatureAgenteStr, 'agente');
            const signatureApoioUrl = await uploadSign(supportSignatureStr, 'apoio');
            let apoio = item.apoio_tecnico !== undefined ? item.apoio_tecnico : item.apoioTecnico;
            if (typeof apoio === 'string') { try { apoio = JSON.parse(apoio); } catch (e) { } }
            processedApoio = apoio ? { ...apoio, assinatura: signatureApoioUrl } : null;

            payload = {
                vistoria_id: officialId, processo: item.processo || '', agente: item.agente || '', matricula: item.matricula || '', solicitante: item.solicitante || '', cpf: item.cpf || '', telefone: item.telefone || '', endereco: item.endereco || '', bairro: item.bairro || '',
                latitude: item.latitude ? parseFloat(item.latitude) : null, longitude: item.longitude ? parseFloat(item.longitude) : null, coordenadas: item.coordenadas || (item.latitude && item.longitude ? `${item.latitude},${item.longitude}` : ''), data_hora: item.dataHora || item.data_hora || new Date().toISOString(),
                tipo_info: item.tipo_info || item.tipoInfo || item.categoriaRisco || 'Vistoria Geral', categoria_risco: item.categoriaRisco || item.categoria_risco || 'Outros', subtipos_risco: Array.isArray(item.subtiposRisco) ? item.subtiposRisco : (Array.isArray(item.subtipos_risco) ? item.subtipos_risco : []),
                nivel_risco: item.nivelRisco || item.nivel_risco || 'Baixo', situacao_observada: item.situacaoObservada || item.situacao_observada || 'Estabilizado', populacao_estimada: item.populacaoEstimada || item.populacao_estimada || '', grupos_vulneraveis: Array.isArray(item.gruposVulneraveis) ? item.gruposVulneraveis : (Array.isArray(item.grupos_vulneraveis) ? item.grupos_vulneraveis : []),
                observacoes: item.observacoes || '', medidas_tomadas: Array.isArray(item.medidasTomadas) ? item.medidasTomadas : (Array.isArray(item.medidas_tomadas) ? item.medidas_tomadas : []), encaminhamentos: Array.isArray(item.encaminhamentos) ? item.encaminhamentos : (Array.isArray(item.encaminhamentos) ? item.encaminhamentos : []), fotos: processedPhotos, documentos: Array.isArray(item.documentos) ? item.documentos : (Array.isArray(item.documentos) ? item.documentos : []), assinatura_agente: signatureAgenteUrl, checklist_respostas: item.checklistRespostas || item.checklist_respostas || {}, apoio_tecnico: processedApoio, created_at: item.createdAt || item.created_at || new Date().toISOString()
            }
        } else if (storeName === 'interdicoes') {
            let officialId = item.interdicaoId || item.interdicao_id
            if (!officialId) {
                const currentYear = new Date().getFullYear();
                const { data: maxData } = await supabase.from('interdicoes').select('interdicao_id').filter('interdicao_id', 'like', `%/${currentYear}`).order('interdicao_id', { ascending: false }).limit(1);
                let maxNum = 0;
                if (maxData && maxData.length > 0) {
                    const num = parseInt(maxData[0].interdicao_id.split('/')[0]);
                    if (!isNaN(num)) maxNum = num;
                }
                officialId = `${(maxNum + 1).toString().padStart(2, '0')}/${currentYear}`;
            }
            payload = {
                interdicao_id: officialId, data_hora: item.dataHora || item.data_hora, tipo_info: item.tipo_info || item.tipoInfo || item.riscoTipo || 'Interdição', municipio: item.municipio, bairro: item.bairro, endereco: item.endereco, tipo_alvo: item.tipoAlvo, tipo_alvo_especificar: item.tipoAlvoEspecificar,
                latitude: item.latitude, longitude: item.longitude, coordenadas: item.coordenadas, responsavel_nome: item.responsavelNome, responsavel_cpf: item.responsavelCpf, responsavel_telefone: item.responsavelTelefone, responsavel_email: item.responsavelEmail, risco_tipo: item.riscoTipo, risco_grau: item.riscoGrau, situacao_observada: item.situacaoObservada,
                medida_tipo: item.medidaTipo, medida_prazo: item.medidaPrazo, medida_prazo_data: item.medidaPrazoData, evacuacao_necessaria: item.evacuacaoNecessaria, fotos: processedPhotos, relatorio_tecnico: item.relatorioTecnico, recomendacoes: item.recomendacoes, orgaos_acionados: item.orgaosAcionados, assinatura_agente: item.assinaturaAgente || item.assinatura_agente, apoio_tecnico: item.apoioTecnico || item.apoio_tecnico || null
            }
        } else if (storeName === 's2id_records') {
            // STRICT CLEANING for s2id_records to avoid schema errors
            payload = {
                s2id_id: item.s2id_id || crypto.randomUUID(),
                id_local: item.id,
                status: item.status,
                data: item.data,
                created_at: item.created_at,
                updated_at: item.updated_at
            };
        } else if (storeName === 'shelters') {
            payload = {
                shelter_id: item.shelter_id,
                name: item.name,
                address: item.address,
                capacity: item.capacity,
                status: item.status,
                contact_info: item.contact_info,
                latitude: item.latitude,
                longitude: item.longitude,
                id_local: item.id
            };
        } else if (storeName === 'occupants') {
            payload = {
                occupant_id: item.occupant_id,
                shelter_id: await resolveToSupabaseShelterId(item.shelter_id),
                name: item.name,
                document: item.document,
                age: item.age,
                entry_date: item.entry_date,
                exit_date: item.exit_date,
                status: item.status,
                id_local: item.id
            };
        } else if (storeName === 'donations') {
            payload = { ...item, shelter_id: await resolveToSupabaseShelterId(item.shelter_id), id_local: item.id };
            delete payload.id; delete payload.synced;
        } else {
            const { id, synced, id_local, supabase_id, ...recordPayload } = item;
            payload = { ...recordPayload, id_local: item.id };
        }

        const { data: syncedItems, error } = await supabase.from(table).upsert([payload], {
            onConflict: storeName === 'vistorias' ? 'vistoria_id' : storeName === 'interdicoes' ? 'interdicao_id' : storeName === 'shelters' ? 'shelter_id' : storeName === 'occupants' ? 'occupant_id' : storeName === 'donations' ? 'donation_id' : storeName === 'inventory' ? 'item_id' : storeName === 'distributions' ? 'distribution_id' : storeName === 's2id_records' ? 's2id_id' : undefined
        }).select()

        if (error) {
            console.error(`[Sync] Upsert failed for ${storeName}:`, error);
            console.error(`[Sync] Payload suspected for ${storeName}:`, JSON.stringify(payload).length, "bytes");
            return false;
        }

        const tx = db.transaction(storeName, 'readwrite')
        const store = tx.objectStore(storeName)
        const record = await store.get(item.id)
        if (record) {
            record.synced = true
            if (syncedItems && syncedItems[0]) record.supabase_id = syncedItems[0].id;
            if (storeName === 'vistorias') {
                const offId = syncedItems?.[0]?.vistoria_id || payload.vistoria_id;
                record.vistoriaId = offId; record.vistoria_id = offId;
                record.assinatura_agente = signatureAgenteUrl; record.apoio_tecnico = processedApoio;
            } else if (storeName === 'interdicoes') {
                const offId = syncedItems?.[0]?.interdicao_id || payload.interdicao_id;
                record.interdicaoId = offId; record.interdicao_id = offId;
            } else if (storeName === 's2id_records') {
                // Ensure s2id_id generated/prescreened is saved back
                record.s2id_id = payload.s2id_id;
            }
            await store.put(record)
        }
        await tx.done
        return true
    } catch (e) {
        console.error(`[Sync] Critical failure for ${storeName}:`, e)
        return false
    }
}

export const pullAllData = async () => {
    if (!navigator.onLine) return { success: false, reason: 'offline' };
    const db = await initDB();
    const modules = [
        { table: 'vistorias', store: 'vistorias', key: 'vistoria_id' },
        { table: 'interdicoes', store: 'interdicoes', key: 'interdicao_id' },
        { table: 's2id_records', store: 's2id_records', key: 's2id_id' },
        { table: 'shelters', store: 'shelters', key: 'shelter_id' },
        { table: 'shelter_occupants', store: 'occupants', key: 'occupant_id' },
        { table: 'shelter_donations', store: 'donations', key: 'donation_id' },
        { table: 'shelter_inventory', store: 'inventory', key: 'item_id' },
        { table: 'shelter_distributions', store: 'distributions', key: 'distribution_id' },
        { table: 'emergency_contracts', store: 'emergency_contracts', key: 'contract_id' },
        { table: 'manual_readings', store: 'manual_readings', key: null },
        { table: 'despachos', store: 'despachos', key: 'despacho_id' }
    ];
    let totalPulled = 0;
    for (const mod of modules) {
        try {
            const { data, error } = await supabase.from(mod.table).select('*');
            if (!error && data) {
                const tx = db.transaction(mod.store, 'readwrite');
                const store = tx.objectStore(mod.store);
                const allLocal = await store.getAll();
                const localBySupId = new Map(allLocal.filter(l => l.supabase_id).map(l => [l.supabase_id, l]));
                const localByKey = new Map(mod.key ? allLocal.filter(l => l[mod.key]).map(l => [l[mod.key], l]) : []);

                for (const item of data) {
                    const localMatch = localBySupId.get(item.id) || (mod.key && item[mod.key] ? localByKey.get(item[mod.key]) : null);
                    if (localMatch && localMatch.synced === false) continue;

                    // Deep copy to avoid mutating source
                    const toStore = { ...item, id: localMatch ? localMatch.id : undefined, supabase_id: item.id, synced: true };

                    // CRITICAL: Resolve foreign keys from Supabase UUIDs to Local Business IDs
                    // This ensures that relations (e.g. occupant -> shelter) work across devices
                    if (mod.store === 'occupants' || mod.store === 'donations' || mod.store === 'inventory' || mod.store === 'distributions') {
                        if (item.shelter_id && item.shelter_id.length === 36) {
                            // It's a Supabase UUID, try to find the local business ID (ABR-...)
                            const sStore = db.transaction('shelters', 'readonly').objectStore('shelters');
                            const shelterRecord = await sStore.index('supabase_id').get(item.shelter_id);
                            if (shelterRecord && shelterRecord.shelter_id) {
                                toStore.shelter_id = shelterRecord.shelter_id;
                            }
                        }
                    }

                    if (mod.store === 'distributions' && item.inventory_id && item.inventory_id.length === 36) {
                        const iStore = db.transaction('inventory', 'readonly').objectStore('inventory');
                        const invRecord = await iStore.index('supabase_id').get(item.inventory_id);
                        if (invRecord && invRecord.item_id) {
                            toStore.inventory_id = invRecord.item_id;
                        }
                    }

                    await store.put(toStore);
                    totalPulled++;
                }
                await tx.done;
            }
        } catch (e) { }
    }
    return { success: true, count: totalPulled };
};

let syncTimeout = null;
export const triggerSync = async () => {
    if (syncTimeout) clearTimeout(syncTimeout);
    return new Promise((resolve) => {
        syncTimeout = setTimeout(async () => {
            if (navigator.onLine) resolve(await syncPendingData());
            else resolve({ success: false, reason: 'offline' });
        }, 2000);
    });
}

export const getPendingVistorias = async () => {
    const db = await initDB()
    return db.getAllFromIndex('vistorias', 'synced', false)
}

export const deleteVistoriaLocal = async (id) => {
    const db = await initDB()
    const all = await db.getAll('vistorias')
    const found = all.find(v => v.id === id || v.vistoria_id === id || v.supabase_id === id)
    if (found) {
        await db.delete('vistorias', found.id)
        if (found.vistoria_id || found.vistoriaId) {
            const vid = found.vistoria_id || found.vistoriaId
            const tx = db.transaction('remote_vistorias_cache', 'readwrite')
            const store = tx.objectStore('remote_vistorias_cache')
            const cacheItems = await store.getAll()
            const target = cacheItems.find(v => (v.vistoria_id || v.vistoriaId) === vid)
            if (target) await store.delete(target.id)
            await tx.done
        }
    }
}

export const deleteInterdicaoLocal = async (id) => {
    const db = await initDB()
    const all = await db.getAll('interdicoes')
    const found = all.find(i => i.id === id || i.interdicao_id === id || i.supabase_id === id)
    if (found) await db.delete('interdicoes', found.id)
}

export const getAllVistoriasLocal = async () => {
    const db = await initDB(); const all = await db.getAll('vistorias');
    return all.map(v => ({ ...v, tipo_info: v.tipo_info || v.tipoInfo || v.categoriaRisco || 'Vistoria Geral' }));
}

export const getLightweightVistoriasLocal = async () => {
    const db = await initDB(); const tx = db.transaction('vistorias', 'readonly'); const store = tx.objectStore('vistorias');
    let cursor = await store.openCursor(); const items = [];
    while (cursor) {
        const v = cursor.value;
        items.push({ id: v.id, vistoria_id: v.vistoria_id || v.vistoriaId, supabase_id: v.supabase_id, created_at: v.created_at || v.createdAt, solicitante: v.solicitante, endereco: v.endereco, bairro: v.bairro, nivelRisco: v.nivelRisco || v.nivel_risco, categoriaRisco: v.categoriaRisco || v.categoria_risco, tipo_info: v.tipo_info || v.tipoInfo || v.categoriaRisco || 'Vistoria Geral', synced: v.synced });
        cursor = await cursor.continue();
    }
    return items;
}

export const getVistoriaFull = async (id) => {
    const db = await initDB(); const tx = db.transaction(['vistorias', 'remote_vistorias_cache'], 'readonly');
    const vStore = tx.objectStore('vistorias'); let item = await vStore.get(id);
    if (!item) { const all = await vStore.getAll(); item = all.find(v => v.id === id || v.vistoria_id === id || v.supabase_id === id); }
    if (!item) {
        const cStore = tx.objectStore('remote_vistorias_cache'); item = await cStore.get(id);
        if (!item) { const allCache = await cStore.getAll(); item = allCache.find(v => v.id === id || v.vistoria_id === id || v.id === parseInt(id)); }
    }
    await tx.done; return item;
}

export const getAllInterdicoesLocal = async () => {
    const db = await initDB(); const all = await db.getAll('interdicoes');
    return all.map(i => ({ ...i, tipo_info: i.tipo_info || i.tipoInfo || i.riscoTipo || 'Interdição' }));
}

export const saveInterdicaoOffline = async (data) => {
    const db = await initDB(); const localId = await db.put('interdicoes', { ...data, createdAt: data.createdAt || new Date().toISOString(), synced: false });
    if (navigator.onLine) { const item = await db.get('interdicoes', localId); await syncSingleItem('interdicoes', item, db); }
    return localId;
}

export const clearLocalData = async () => {
    const db = await initDB(); const stores = [];
    if (db.objectStoreNames.contains('vistorias')) stores.push('vistorias');
    if (db.objectStoreNames.contains('interdicoes')) stores.push('interdicoes');
    if (stores.length > 0) { const tx = db.transaction(stores, 'readwrite'); for (const s of stores) await tx.objectStore(s).clear(); await tx.done; }
}

export const resetDatabase = async () => {
    const db = await initDB(); db.close();
    return new Promise((resolve, reject) => {
        const req = indexedDB.deleteDatabase(DB_NAME); req.onsuccess = () => resolve(); req.onerror = () => reject();
        req.onblocked = () => { window.location.reload(); resolve(); }
    });
}

export const importInstallations = async (data, onProgress) => {
    const db = await initDB(); { const tx = db.transaction('installations', 'readwrite'); await tx.objectStore('installations').clear(); await tx.done; }
    const CHUNK_SIZE = 1000; const total = data.length; let processed = 0;
    for (let i = 0; i < total; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE); const tx = db.transaction('installations', 'readwrite'); const store = tx.objectStore('installations');
        for (const item of chunk) {
            const fullUC = item["Código Unidade Consumidora"] || item["CODIGO UNIDADE CONSUMIDORA"] || "";
            let ucCore = ""; if (fullUC) { const parts = fullUC.split('.'); if (parts.length >= 4) ucCore = parts[2] + parts[3]; }
            const cleanFullUC = fullUC.replace(/\D/g, '');
            const doc = { ...item, id: item.id || (item["Instalação"] || Math.random().toString(36).substr(2, 9)), installation_number: item["Instalação"] ? String(item["Instalação"]) : String(item.installation_number || ''), full_uc: fullUC, clean_full_uc: cleanFullUC, uc_core: ucCore, name: item.name || item.NOME || item.NOME_BAIRRO || '', address: item.address || item.LOGRADOURO || item.NOME_LOGRADOURO || '', lat: parseFloat(item.LATITUDE || item.Latitude || item.lat || item.pee_lat || item.client_lat || 0), lng: parseFloat(item.LONGITUDE || item.Longitude || item.lng || item.pee_lng || item.client_lng || 0) };
            store.put(doc);
        }
        await tx.done; processed += chunk.length; if (onProgress) onProgress(processed, total);
        await new Promise(r => setTimeout(r, 10));
    }
}

export const searchInstallations = async (query) => {
    const db = await initDB(); if (!query) return [];
    const cleanQuery = query.replace(/\D/g, '');
    if (cleanQuery.length === 6) { const m = await db.getAllFromIndex('installations', 'uc_core', cleanQuery); if (m?.length > 0) return m; }
    if (cleanQuery.length >= 10) { const core = cleanQuery.substring(4, 10); const m = await db.getAllFromIndex('installations', 'uc_core', core); if (m?.length > 0) return m; }
    const exact = await db.getFromIndex('installations', 'installation_number', query); if (exact) return [exact];
    const all = await db.getAll('installations'); const lower = query.toLowerCase();
    return all.filter(item => (item.name?.toLowerCase().includes(lower) || item.address?.toLowerCase().includes(lower) || item.full_uc?.includes(query) || item.clean_full_uc?.includes(cleanQuery) || String(item.installation_number).includes(query) || item.uc_core === cleanQuery)).slice(0, 50);
}

export const getInstallationsCount = async () => { const db = await initDB(); return db.count('installations'); }

export const saveDespachoOffline = async (data) => {
    const db = await initDB(); const id = await db.put('despachos', { ...data, createdAt: new Date().toISOString(), synced: false }); return id;
}

export const getNextDespachoId = async () => {
    const db = await initDB(); const currentYear = new Date().getFullYear(); const all = await db.getAll('despachos'); let maxNum = 0;
    all.forEach(d => { if (d.despacho_id?.includes(`/${currentYear}`)) { const num = parseInt(d.despacho_id.split('/')[0]); if (!isNaN(num) && num > maxNum) maxNum = num; } });
    return `${(maxNum + 1).toString().padStart(3, '0')}/${currentYear}`;
}
export const getRemoteVistoriasCache = async () => { const db = await initDB(); return db.getAll('remote_vistorias_cache'); }
export const saveRemoteVistoriasCache = async (data) => {
    const db = await initDB(); const tx = db.transaction('remote_vistorias_cache', 'readwrite'); const store = tx.objectStore('remote_vistorias_cache');
    await store.clear(); for (const item of data) await store.put(item); await tx.done;
}

export const getContracts = async () => {
    const db = await initDB(); const all = await db.getAll('emergency_contracts'); const active = all.filter(c => c.status !== 'deleted');
    const seed = [
        { contract_id: 'CTR-SEED-001', contract_number: '2025-1V6400', object_description: 'Filtros', start_date: '2025-06-19', end_date: '2026-06-18', total_value: 18250.00, status: 'active', synced: true },
        { contract_id: 'CTR-SEED-002', contract_number: '2025-XVC15', object_description: 'Cestas Básicas', start_date: '2025-06-02', end_date: '2026-06-01', total_value: 210600.00, status: 'active', synced: true },
        { contract_id: 'CTR-SEED-003', contract_number: '2025-9J0PF', object_description: 'Cestas de Limpeza', start_date: '2025-06-02', end_date: '2026-06-01', total_value: 31122.00, status: 'active', synced: true },
        { contract_id: 'CTR-SEED-004', contract_number: '2025-VW0H6', object_description: 'Colchões', start_date: '2025-06-02', end_date: '2026-06-05', total_value: 41660.00, status: 'active', synced: true },
        { contract_id: 'CTR-SEED-005', contract_number: '2025-LXCTX', object_description: 'Mantas', start_date: '2025-06-10', end_date: '2026-06-09', total_value: 12975.00, status: 'active', synced: true },
        { contract_id: 'CTR-SEED-006', contract_number: '2025-LXSOQ', object_description: 'Higiene e Limpeza', start_date: '2025-08-15', end_date: '2026-08-15', total_value: 1138.00, status: 'active', synced: true },
        { contract_id: 'CTR-SEED-007', contract_number: '2025-L1F26', object_description: 'Marmitas', start_date: '2025-09-25', end_date: '2026-09-24', total_value: 2756.80, status: 'active', synced: true }
    ];
    const missing = seed.filter(s => !active.some(e => e.contract_number === s.contract_number));
    if (missing.length > 0) { const tx = db.transaction('emergency_contracts', 'readwrite'); for (const item of missing) { await tx.store.put(item); active.push(item); } await tx.done; }
    return active;
}

export const addContract = async (data) => {
    const db = await initDB(); const id = await db.add('emergency_contracts', { ...data, contract_id: data.contract_id || `CTR-${Date.now()}`, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), synced: false }); triggerSync(); return id;
}

export const getContract = async (id) => { const db = await initDB(); return db.getAll('emergency_contracts').then(all => all.find(c => c.id == id || c.contract_id === id)); }

export const updateContract = async (id, updates) => {
    const db = await initDB(); const tx = db.transaction('emergency_contracts', 'readwrite'); const store = tx.objectStore('emergency_contracts');
    const all = await store.getAll(); const record = all.find(c => c.id == id || c.contract_id === id);
    if (record) { await store.put({ ...record, ...updates, synced: false, updated_at: new Date().toISOString() }); await tx.done; triggerSync(); return true; }
    return false;
}

export const deleteContract = async (id) => {
    const db = await initDB(); let c = null; if (typeof id === 'number') c = await db.get('emergency_contracts', id); else { const all = await db.getAll('emergency_contracts'); c = all.find(item => item.contract_id === id); }
    if (c) { c.status = 'deleted'; c.synced = false; await db.put('emergency_contracts', c); triggerSync(); }
}
