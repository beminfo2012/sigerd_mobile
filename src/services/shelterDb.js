import { initDB, triggerSync } from './db';
import { supabase } from './supabase';

/**
 * Shelter Service Layer (IDB Version)
 * Cloud-First: When online, pulls from Supabase and merges with local data.
 */

// --- HELPERS ---

const generateId = (prefix) => {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).substring(2, 6);
    return `${prefix}-${ts}-${rand}`;
};

const getOperacaoId = () => {
    return localStorage.getItem('operacao_id') || null;
};


// Cloud-first sync: debounced per session to avoid repeated pulls
let _lastShelterPull = 0;
let _activePullPromise = null;
const PULL_DEBOUNCE_MS = 30000; // 30s between pulls

/**
 * Pull all shelter-related data from Supabase and merge into local IndexedDB.
 * Returns a shared Promise if a pull is currently active to prevent race conditions.
 */
const _performPull = async () => {
    const modules = [
        { table: 'shelters', store: 'shelters', key: 'shelter_id' },
        { table: 'shelter_occupants', store: 'occupants', key: 'occupant_id' },
        { table: 'shelter_donations', store: 'donations', key: 'donation_id' },
        { table: 'shelter_inventory', store: 'inventory', key: 'inventory_id' },
        { table: 'shelter_distributions', store: 'distributions', key: 'distribution_id' }
    ];

    const db = await initDB();

    for (const mod of modules) {
        try {
            const { data, error } = await supabase.from(mod.table).select('*');
            if (error) {
                console.error(`[Shelter] Error pulling ${mod.table}:`, error);
                continue;
            }
            if (!data) continue;

            const tx = db.transaction(mod.store, 'readwrite');
            const store = tx.objectStore(mod.store);
            const allLocal = await store.getAll();

            const cloudIds = new Set(data.map(d => d.id));
            const localBySupabaseId = new Map();
            const localByKey = new Map();

            for (const local of allLocal) {
                if (local.supabase_id) localBySupabaseId.set(local.supabase_id, local);
                if (mod.key && local[mod.key]) localByKey.set(local[mod.key], local);
                
                // Apenas deleta itens locais se a nuvem retornou dados (evita wipe-out por falta de token RLS)
                if (data.length > 0 && local.synced && local.supabase_id && !cloudIds.has(local.supabase_id)) {
                    await store.delete(local.id);
                }
            }

            for (const item of data) {
                const localMatch = localBySupabaseId.get(item.id) || (mod.key && item[mod.key] ? localByKey.get(item[mod.key]) : null);
                if (localMatch && localMatch.synced === false) continue;

                const toStore = { ...item, supabase_id: item.id, synced: true };
                if (localMatch && localMatch.id !== undefined) {
                    toStore.id = localMatch.id;
                    // Preserve operacao_id if it exists locally but not in cloud
                    if (localMatch.operacao_id && !item.operacao_id) {
                        toStore.operacao_id = localMatch.operacao_id;
                    }
                }

                if (['shelter_donations', 'shelter_inventory', 'shelter_distributions'].includes(mod.table) && toStore.observations) {
                    if (toStore.observations.includes('[HUB:SOLIDARY]')) {
                        toStore.shelter_id = 'SOLIDARY';
                        toStore.observations = toStore.observations.replace('[HUB:SOLIDARY]', '').trim();
                    } else if (toStore.observations.includes('[HUB:CENTRAL]')) {
                        toStore.shelter_id = 'CENTRAL';
                        toStore.observations = toStore.observations.replace('[HUB:CENTRAL]', '').trim();
                    }
                }
                await store.put(toStore);
            }
            await tx.done;
        } catch (e) {
            console.error(`[Shelter] Critical error pulling ${mod.table}:`, e);
        }
    }
    console.log('[Shelter] Cloud pull complete.');
};

const safePullShelterModuleFromCloud = async () => {
    if (!navigator.onLine) return;
    const now = Date.now();

    if (_activePullPromise) {
        console.log('[Shelter] Waiting for active pull to complete...');
        return _activePullPromise;
    }

    if (now - _lastShelterPull < PULL_DEBOUNCE_MS) {
        console.log('[Shelter] Skipping pull (debounce)');
        return;
    }
    
    _lastShelterPull = now;
    _activePullPromise = _performPull().finally(() => {
        _activePullPromise = null;
    });

    return _activePullPromise;
};

// --- SHELTERS ---

export const getShelters = async () => {
    await safePullShelterModuleFromCloud();
    const db = await initDB();
    const all = await db.getAll('shelters');

    // Deduplicate to avoid local double entries from sync overlaps or repeated seeds
    const dedupMap = new Map();
    all.sort((a, b) => {
        // Process WORST items first, BEST items LAST so they overwrite in the Map.
        // Best = has supabase_id, is synced
        const scoreA = (a.supabase_id ? 2 : 0) + (a.synced ? 1 : 0);
        const scoreB = (b.supabase_id ? 2 : 0) + (b.synced ? 1 : 0);
        if (scoreA !== scoreB) return scoreA - scoreB;
        // Fallback to date sorting
        return new Date(a.created_at) - new Date(b.created_at);
    }).forEach(s => {
        // We deduplicate by name to eliminate ghost "seeded" shelters. 
        // Real shelters with the same name shouldn't exist in the same region database.
        const cleanName = s.name ? s.name.trim().toLowerCase() : (s.shelter_id || s.id);
        dedupMap.set(cleanName, s);
    });

    return Array.from(dedupMap.values()).filter(s => s.status !== 'deleted');
};

export const getShelterById = async (id) => {
    if (!id) return null;
    await safePullShelterModuleFromCloud();
    const db = await initDB();

    // 1. Try numeric local ID
    if (!isNaN(parseInt(id)) && String(id).length < 5) {
        const shelter = await db.get('shelters', parseInt(id));
        if (shelter) return shelter;
    }

    // 2. Try Business ID (ABR-...)
    const shelterByBusId = await db.getFromIndex('shelters', 'shelter_id', String(id));
    if (shelterByBusId) return shelterByBusId;

    // 3. Try Supabase UUID
    const shelterBySupId = await db.getFromIndex('shelters', 'supabase_id', String(id));
    if (shelterBySupId) return shelterBySupId;

    return null;
};

export const addShelter = async (shelterData) => {
    const db = await initDB();
    const newShelter = {
        ...shelterData,
        operacao_id: getOperacaoId(),
        shelter_id: generateId('ABR'),
        status: shelterData.status || 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        synced: false // Pending Sync
    };
    const id = await db.add('shelters', newShelter);
    
    // Log activation history
    await db.add('shelter_history', {
        shelter_id: newShelter.shelter_id,
        operacao_id: newShelter.operacao_id,
        activation_date: new Date().toISOString(),
        inactivation_date: null,
        status: newShelter.status,
        created_at: new Date().toISOString(),
        synced: false
    });

    triggerSync();
    return id;
};

export const updateShelter = async (id, changes) => {
    const shelter = await getShelterById(id);
    if (shelter) {
        const db = await initDB();
        const tx = db.transaction(['shelters', 'shelter_history'], 'readwrite');
        const store = tx.objectStore('shelters');
        // If activating, tie the shelter's primary operacao_id to the current active operation
        if (changes.status === 'active' && !changes.operacao_id) {
            changes.operacao_id = getOperacaoId();
        }

        const updated = { ...shelter, ...changes, updated_at: new Date().toISOString(), synced: false };
        await store.put(updated);

        // Record history if status changed
        if (changes.status && changes.status !== shelter.status) {
            const historyStore = tx.objectStore('shelter_history');
            if (changes.status === 'inactive') {
                // Inactivation
                await historyStore.add({
                    shelter_id: updated.shelter_id || updated.supabase_id || id,
                    operacao_id: getOperacaoId(),
                    activation_date: shelter.created_at || new Date().toISOString(), // Fallback
                    inactivation_date: new Date().toISOString(),
                    status: 'inactive',
                    created_at: new Date().toISOString(),
                    synced: false
                });
            } else if (changes.status === 'active') {
                // Reactivation
                await historyStore.add({
                    shelter_id: updated.shelter_id || updated.supabase_id || id,
                    operacao_id: getOperacaoId(),
                    activation_date: new Date().toISOString(),
                    inactivation_date: null,
                    status: 'active',
                    created_at: new Date().toISOString(),
                    synced: false
                });
            }
        }

        await tx.done;
        triggerSync();
    }
};

export const deleteShelter = async (id) => {
    const shelter = await getShelterById(id);
    if (shelter) {
        const db = await initDB();
        const tx = db.transaction('shelters', 'readwrite');
        const store = tx.objectStore('shelters');
        const updated = { ...shelter, status: 'deleted', updated_at: new Date().toISOString(), synced: false };
        await store.put(updated);
        await tx.done;
        triggerSync();
    }
};

// --- OCCUPANTS ---

// Helper to ensure we have a Business ID for relational lookups
const resolveToBusinessShelterId = async (id) => {
    if (!id) return null;
    if (String(id).startsWith('ABR-')) return String(id);
    const s = await getShelterById(id);
    return s ? (s.supabase_id || s.shelter_id || String(s.id)) : String(id);
};

export const getOccupants = async (shelterId) => {
    await safePullShelterModuleFromCloud();
    const db = await initDB();
    let all = [];
    if (shelterId) {
        const bid = await resolveToBusinessShelterId(shelterId);
        all = await db.getAllFromIndex('occupants', 'shelter_id', bid);
    } else {
        all = await db.getAll('occupants');
    }

    // Deduplicate
    const dedupMap = new Map();
    all.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        .forEach(o => {
            const key = o.occupant_id || o.supabase_id || o.id;
            dedupMap.set(key, o);
        });
    return Array.from(dedupMap.values());
};

export const addOccupant = async (occupantData) => {
    const db = await initDB();
    const bid = await resolveToBusinessShelterId(occupantData.shelter_id);
    const newOccupant = {
        ...occupantData,
        operacao_id: getOperacaoId(),
        shelter_id: bid,
        occupant_id: generateId('OCP'),
        is_family_head: occupantData.is_family_head || false,
        entry_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        synced: false
    };

    const id = await db.add('occupants', newOccupant);
    triggerSync();
    return id;
};

export const exitOccupant = async (occupantId, shelterId) => {
    const db = await initDB();

    // 1. Update Occupant
    const tx = db.transaction(['occupants', 'shelters'], 'readwrite');
    const occupantStore = tx.objectStore('occupants');
    const shelterStore = tx.objectStore('shelters');

    // Find occupant (could be by id or occupant_id key)
    // We assume occupantId passed here is the internal ID for simplicity, or handle both
    let occupant = await occupantStore.get(occupantId);

    // If not found by primary key, search index?
    // It's safer to always pass primary key ID from UI

    if (occupant && occupant.status !== 'exited') {
        const updatedOccupant = {
            ...occupant,
            status: 'exited',
            exit_date: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            synced: false
        }
        await occupantStore.put(updatedOccupant);

        // 2. Update Shelter Capacity
        if (shelterId) {
            const shelter = await shelterStore.get(parseInt(shelterId));
            if (shelter) {
                const updatedShelter = {
                    ...shelter,
                    current_occupancy: Math.max(0, (shelter.current_occupancy || 0) - 1),
                    updated_at: new Date().toISOString(),
                    synced: false
                };
                await shelterStore.put(updatedShelter);
            }
        }
    }
    await tx.done;
    triggerSync();
};

// --- INVENTORY & DONATIONS ---

// --- INVENTORY & DONATIONS ---

export const getDonations = async (shelterId) => {
    await safePullShelterModuleFromCloud();
    const db = await initDB();
    const all = await db.getAll('donations');
    let items;
    if (shelterId && shelterId !== 'CENTRAL' && shelterId !== 'SOLIDARY') {
        const bid = await resolveToBusinessShelterId(shelterId);
        items = all.filter(d => String(d.shelter_id) === String(bid));
    } else if (shelterId === 'SOLIDARY') {
        // Use filter instead of index to avoid IDB index mismatches after sync
        items = all.filter(d => d.shelter_id === 'SOLIDARY');
    } else if (shelterId === 'CENTRAL') {
        items = all.filter(d => (!d.shelter_id || d.shelter_id === 'CENTRAL' || d.shelter_id === 'null') && d.shelter_id !== 'SOLIDARY');
    } else {
        items = all.filter(d => d.shelter_id !== 'SOLIDARY');
    }
    return (items || []).filter(d => d.status !== 'deleted');
};

export const addDonation = async (donationData) => {
    console.log('[ShelterDB][Verificação] Iniciando addDonation com payload:', donationData);
    // --- VALIDATION: prevent empty records ---
    if (!donationData.item_description || !donationData.item_description.trim()) {
        throw new Error('Descrição do item é obrigatória. Não é possível salvar doação sem descrição.');
    }
    const qty = parseFloat(donationData.quantity);
    if (!qty || qty <= 0 || isNaN(qty)) {
        throw new Error('Quantidade deve ser maior que zero.');
    }

    const db = await initDB();
    const bid = await resolveToBusinessShelterId(donationData.shelter_id || 'CENTRAL');
    const newDonation = {
        ...donationData,
        operacao_id: getOperacaoId(),
        donation_id: generateId('DOA'),
        status: 'received',
        shelter_id: bid,
        donation_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        synced: false
    };

    const tx = db.transaction(['donations', 'inventory', 'audit_log'], 'readwrite');
    const donStore = tx.objectStore('donations');
    const invStore = tx.objectStore('inventory');
    const auditStore = tx.objectStore('audit_log');

    await donStore.add(newDonation);

    // Update Inventory
    const shelterIdStr = newDonation.shelter_id;
    let existingItem;

    if (shelterIdStr) {
        const allInv = await invStore.getAll();
        existingItem = allInv.find(i => {
            const isCentral = shelterIdStr === 'CENTRAL';
            const iIsCentral = !i.shelter_id || i.shelter_id === 'CENTRAL' || String(i.shelter_id) === 'null';
            const shelterMatch = isCentral ? iIsCentral : String(i.shelter_id) === String(shelterIdStr);
            
            return shelterMatch &&
                i.item_name.toLowerCase() === newDonation.item_description.toLowerCase() &&
                i.status !== 'deleted';
        });
    }

    if (existingItem) {
        const updatedItem = {
            ...existingItem,
            quantity: parseFloat(existingItem.quantity) + qty,
            updated_at: new Date().toISOString(),
            synced: false
        };
        await invStore.put(updatedItem);
    } else {
        const newItem = {
            inventory_id: generateId('INV'),
            operacao_id: getOperacaoId(),
            shelter_id: shelterIdStr,
            item_name: newDonation.item_description,
            category: newDonation.donation_type,
            quantity: qty,
            unit: newDonation.unit,
            min_quantity: 5,
            status: 'active',
            updated_at: new Date().toISOString(),
            synced: false
        };
        await invStore.add(newItem);
    }

    // Audit log
    await auditStore.add({
        action: 'DONATION_RECEIVED',
        entity_type: 'donation',
        entity_id: newDonation.donation_id,
        details: `${newDonation.item_description}: ${qty} ${newDonation.unit} -> ${shelterIdStr}`,
        timestamp: new Date().toISOString()
    });

    await tx.done;
    triggerSync();
    return newDonation;
};

export const getInventory = async (shelterId, forceLocal = false) => {
    if (!forceLocal) await safePullShelterModuleFromCloud();
    const db = await initDB();
    const all = await db.getAll('inventory');
    let items;
    if (shelterId && shelterId !== 'CENTRAL' && shelterId !== 'SOLIDARY') {
        const bid = await resolveToBusinessShelterId(shelterId);
        items = all.filter(i => String(i.shelter_id) === String(bid));
    } else if (shelterId === 'SOLIDARY') {
        items = all.filter(i => i.shelter_id === 'SOLIDARY');
    } else if (shelterId === 'CENTRAL') {
        items = all.filter(i => (!i.shelter_id || i.shelter_id === 'CENTRAL' || i.shelter_id === 'null') && i.shelter_id !== 'SOLIDARY');
    } else {
        items = all.filter(i => i.shelter_id !== 'SOLIDARY');
    }
    return (items || []).filter(i => i.status !== 'deleted' && parseFloat(i.quantity || 0) > 0);
};

export const getGlobalInventory = async () => {
    const db = await initDB();
    const all = await db.getAll('inventory');
    return all.filter(i => i.status !== 'deleted' && i.shelter_id !== 'SOLIDARY' && parseFloat(i.quantity || 0) > 0);
};

export const transferStock = async (itemId, fromShelterId, toShelterId, quantity) => {
    console.log(`[ShelterDB][Verificação] Iniciando transferStock: itemId=${itemId}, from=${fromShelterId}, to=${toShelterId}, qty=${quantity}`);
    
    // Resolve IDs BEFORE opening the transaction to prevent TransactionInactiveError
    const destBusinessId = await resolveToBusinessShelterId(toShelterId);
    const sourceBusinessId = (fromShelterId === 'CENTRAL' || fromShelterId === 'SOLIDARY') 
        ? fromShelterId 
        : await resolveToBusinessShelterId(fromShelterId);

    const db = await initDB();
    const tx = db.transaction(['inventory', 'distributions'], 'readwrite');
    const invStore = tx.objectStore('inventory');
    const distStore = tx.objectStore('distributions');

    // 1. Get Source Item
    let sourceItem;
    const isNumeric = /^\d+$/.test(String(itemId));
    if (isNumeric) {
        sourceItem = await invStore.get(parseInt(itemId));
    }
    if (!sourceItem) {
        const allItems = await invStore.getAll();
        sourceItem = allItems.find(i => String(i.inventory_id) === String(itemId) || String(i.id) === String(itemId));
    }
    if (!sourceItem || sourceItem.status === 'deleted') throw new Error('Item de origem não encontrado.');

    if (parseFloat(sourceItem.quantity) < parseFloat(quantity)) {
        throw new Error('Estoque insuficiente na origem.');
    }

    // 2. Decrement Source
    const updatedSource = {
        ...sourceItem,
        quantity: parseFloat(sourceItem.quantity) - parseFloat(quantity),
        updated_at: new Date().toISOString(),
        synced: false
    };
    await invStore.put(updatedSource);

    // 3. Increment/Create Destination
    const allInv = await invStore.getAll();
    let destItem = allInv.find(i =>
        String(i.shelter_id) === String(destBusinessId) &&
        i.item_name.toLowerCase() === sourceItem.item_name.toLowerCase()
    );

    if (destItem) {
        const updatedDest = {
            ...destItem,
            quantity: parseFloat(destItem.quantity) + parseFloat(quantity),
            updated_at: new Date().toISOString(),
            synced: false
        };
        await invStore.put(updatedDest);
    } else {
        const newItem = {
            ...sourceItem,
            inventory_id: generateId('INV'),
            shelter_id: destBusinessId,
            quantity: parseFloat(quantity),
            updated_at: new Date().toISOString(),
            synced: false
        };
        delete newItem.id; // Remover ID para forçar auto-generate do IDB
        delete newItem.supabase_id; // Remover identidade da nuvem para não clonar o item da origem
        await invStore.add(newItem);
    }

    // 4. Record Transfer
    const transferRecord = {
        distribution_id: generateId('TRF'),
        operacao_id: getOperacaoId(),
        type: 'transfer',
        inventory_id: sourceItem.id,
        item_name: sourceItem.item_name,
        quantity: quantity,
        unit: sourceItem.unit,
        shelter_id: sourceBusinessId,
        destination_shelter_id: destBusinessId,
        recipient_name: `TRANSFERÊNCIA -> ${destBusinessId}`,
        distribution_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        status: 'active',
        observations: `[HUB:${sourceBusinessId || 'CENTRAL'}]`,
        synced: false
    };
    await distStore.add(transferRecord);

    await tx.done;
    triggerSync();
    return true;
};

export const getDistributions = async (shelterId) => {
    const db = await initDB();
    const all = await db.getAll('distributions');
    let items;
    if (shelterId && shelterId !== 'CENTRAL' && shelterId !== 'SOLIDARY') {
        const bid = await resolveToBusinessShelterId(shelterId);
        items = all.filter(d => String(d.shelter_id) === String(bid));
    } else if (shelterId === 'SOLIDARY') {
        // Use filter instead of index to avoid IDB index mismatches after sync
        items = all.filter(d => d.shelter_id === 'SOLIDARY');
    } else if (shelterId === 'CENTRAL') {
        items = all.filter(d => (!d.shelter_id || d.shelter_id === 'CENTRAL' || d.shelter_id === 'null') && d.shelter_id !== 'SOLIDARY');
    } else {
        items = all.filter(d => d.shelter_id !== 'SOLIDARY');
    }
    return (items || []).filter(d => d.status !== 'deleted');
};

export const getShelterTransfers = async (shelterId) => {
    const db = await initDB();
    const all = await db.getAll('distributions');
    const bid = await resolveToBusinessShelterId(shelterId);
    
    // Saídas realizadas pelo abrigo
    const outgoing = all.filter(d => d.status !== 'deleted' && String(d.shelter_id) === String(bid));
    
    // Entradas recebidas de outros abrigos/central
    const incoming = all.filter(d => {
        if (d.status === 'deleted') return false;
        const isTransfer = d.type === 'transfer' || (d.recipient_name && d.recipient_name.includes('TRANSFERÊNCIA ->'));
        if (!isTransfer) return false;
        const destId = d.destination_shelter_id || (d.recipient_name ? d.recipient_name.replace('TRANSFERÊNCIA ->', '').trim() : '');
        return String(destId) === String(bid) || String(destId) === String(shelterId);
    });
    
    return { outgoing, incoming };
};

export const addDistribution = async (distribution) => {
    console.log('[ShelterDB][Verificação] Iniciando addDistribution com payload:', distribution);
    const db = await initDB();
    const tx = db.transaction(['inventory', 'distributions', 'audit_log'], 'readwrite');
    const invStore = tx.objectStore('inventory');
    const distStore = tx.objectStore('distributions');
    const auditStore = tx.objectStore('audit_log');

    // 1. Find Inventory Item
    let item;
    if (distribution.inventory_id) {
        // Try numeric local IDB key first (autoIncrement id)
        const isNumeric = /^\d+$/.test(String(distribution.inventory_id));
        if (isNumeric) {
            item = await invStore.get(parseInt(distribution.inventory_id));
        }
        // Fallback: try as string key (e.g. INV-xxx business id or UUID)
        if (!item) {
            const allItems = await invStore.getAll();
            item = allItems.find(i => String(i.inventory_id) === String(distribution.inventory_id) && i.status !== 'deleted');
        }
    }

    if (!item && distribution.item_name) {
        const allItems = await invStore.getAll();
        // Filter by shelter_id if provided, to avoid picking items from a different hub
        const shelterId = distribution.shelter_id;
        item = allItems.find(i => {
            const nameMatch = i.item_name.toLowerCase() === distribution.item_name.toLowerCase() && i.status !== 'deleted';
            if (!nameMatch) return false;
            // If distribution has a shelter_id, only match from the same shelter/hub
            if (shelterId) return String(i.shelter_id) === String(shelterId);
            return true;
        });
        if (item) distribution.inventory_id = item.id;
    }

    if (!item) throw new Error('Item não encontrado no estoque');

    if (parseFloat(item.quantity) < parseFloat(distribution.quantity)) {
        throw new Error('Estoque insuficiente');
    }

    // 2. Update Inventory
    console.log(`[DEBUG] addDistribution BEFORE update: item.quantity = ${item.quantity}, distribution.quantity = ${distribution.quantity}`);
    
    const updatedItem = {
        ...item,
        quantity: parseFloat(item.quantity) - parseFloat(distribution.quantity),
        updated_at: new Date().toISOString(),
        synced: false
    };
    
    console.log(`[DEBUG] addDistribution AFTER update: updatedItem.quantity = ${updatedItem.quantity}`);
    
    await invStore.put(updatedItem);

    // 3. Add Distribution
    const distributionRecord = {
        ...distribution,
        operacao_id: getOperacaoId(),
        distribution_id: generateId('DST'),
        distribution_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        status: 'active',
        synced: false
    };
    await distStore.add(distributionRecord);

    // 4. Audit log
    await auditStore.add({
        action: 'DISTRIBUTION',
        entity_type: 'distribution',
        entity_id: distributionRecord.distribution_id,
        details: `${distribution.item_name}: -${distribution.quantity} ${distribution.unit || ''} -> ${distribution.recipient_name || distribution.shelter_id || 'N/A'}`,
        timestamp: new Date().toISOString()
    });

    await tx.done;
    triggerSync();
    return distributionRecord;
};

// --- DATA CLEARANCE (Admin features) ---

export const clearInventory = async (shelterId) => {
    const db = await initDB();
    const tx = db.transaction(['inventory', 'audit_log'], 'readwrite');
    const store = tx.objectStore('inventory');
    const auditStore = tx.objectStore('audit_log');

    const allItems = await store.getAll();
    const itemsToSoftDelete = shelterId
        ? allItems.filter(i => String(i.shelter_id) === String(shelterId) && i.status !== 'deleted')
        : allItems.filter(i => i.status !== 'deleted');

    for (const item of itemsToSoftDelete) {
        const updated = {
            ...item,
            status: 'deleted',
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            synced: false
        };
        await store.put(updated);
    }

    // Audit log
    await auditStore.add({
        action: 'CLEAR_INVENTORY',
        entity_type: 'inventory',
        entity_id: shelterId || 'ALL',
        details: `Soft-deleted ${itemsToSoftDelete.length} items from ${shelterId || 'ALL'}`,
        timestamp: new Date().toISOString()
    });

    await tx.done;
    return true;
};

export const clearReports = async () => {
    const db = await initDB();
    const tx = db.transaction(['distributions', 'donations', 'audit_log'], 'readwrite');

    // Soft delete donations
    const donStore = tx.objectStore('donations');
    const allDonations = await donStore.getAll();
    for (const d of allDonations) {
        if (d.status !== 'deleted') {
            await donStore.put({ ...d, status: 'deleted', deleted_at: new Date().toISOString(), synced: false });
        }
    }

    // Soft delete distributions
    const distStore = tx.objectStore('distributions');
    const allDist = await distStore.getAll();
    for (const d of allDist) {
        if (d.status !== 'deleted') {
            await distStore.put({ ...d, status: 'deleted', deleted_at: new Date().toISOString(), synced: false });
        }
    }

    // Audit log
    const auditStore = tx.objectStore('audit_log');
    await auditStore.add({
        action: 'CLEAR_REPORTS',
        entity_type: 'reports',
        entity_id: 'ALL',
        details: `Soft-deleted ${allDonations.length} donations and ${allDist.length} distributions`,
        timestamp: new Date().toISOString()
    });

    await tx.done;
    return true;
};

// --- NEW: Individual Item Management ---

export const updateInventoryItem = async (id, changes) => {
    const db = await initDB();
    const tx = db.transaction(['inventory', 'audit_log'], 'readwrite');
    const store = tx.objectStore('inventory');
    const auditStore = tx.objectStore('audit_log');

    const item = await store.get(parseInt(id));
    if (!item || item.status === 'deleted') throw new Error('Item não encontrado.');

    const oldQty = item.quantity;
    const updated = {
        ...item,
        ...changes,
        updated_at: new Date().toISOString(),
        synced: false
    };
    await store.put(updated);

    await auditStore.add({
        action: 'INVENTORY_EDIT',
        entity_type: 'inventory',
        entity_id: item.inventory_id || String(id),
        details: `${item.item_name}: qty ${oldQty} -> ${changes.quantity || oldQty}`,
        timestamp: new Date().toISOString()
    });

    await tx.done;
    triggerSync();
    return updated;
};

export const deleteDonation = async (id) => {
    const db = await initDB();
    const tx = db.transaction(['donations', 'audit_log', 'inventory'], 'readwrite');
    const store = tx.objectStore('donations');
    const auditStore = tx.objectStore('audit_log');
    const invStore = tx.objectStore('inventory');

    const item = await store.get(parseInt(id));
    if (!item) throw new Error('Doação não encontrada.');

    const updated = {
        ...item,
        status: 'deleted',
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        synced: false
    };

    await store.put(updated);

    // Subtrair quantidade do estoque
    const allInv = await invStore.getAll();
    const inventoryItem = allInv.find(i => 
        i.status !== 'deleted' && 
        String(i.shelter_id) === String(item.shelter_id) && 
        i.item_name.toLowerCase() === (item.item_description || '').toLowerCase()
    );
    if (inventoryItem) {
        inventoryItem.quantity = Math.max(0, parseFloat(inventoryItem.quantity || 0) - parseFloat(item.quantity || 0));
        inventoryItem.updated_at = new Date().toISOString();
        inventoryItem.synced = false;
        await invStore.put(inventoryItem);
    }

    await auditStore.add({
        action: 'DONATION_DELETE',
        user_id: 'local',
        details: `Deleted donation: ${item.item_description}`,
        timestamp: new Date().toISOString()
    });

    await tx.done;
    triggerSync();
    return updated;
};

export const deleteDistribution = async (id) => {
    const db = await initDB();
    const isNumeric = /^\\d+$/.test(String(id));
    
    // Pré-busca do item fora da transação para resolver IDs sem bloquear
    let tempItem;
    if (isNumeric) {
        tempItem = await db.get('distributions', parseInt(id));
    }
    if (!tempItem) {
        const allDist = await db.getAll('distributions');
        tempItem = allDist.find(d => String(d.distribution_id) === String(id) || String(d.id) === String(id));
    }
    if (!tempItem) throw new Error('Distribuição não encontrada.');

    // Se for transferência, resolver o destino
    let destBusinessId = null;
    const isTransfer = tempItem.type === 'transfer' || (tempItem.recipient_name && tempItem.recipient_name.includes('TRANSFERÊNCIA ->'));
    if (isTransfer) {
        const destIdRaw = tempItem.destination_shelter_id || (tempItem.recipient_name ? tempItem.recipient_name.replace('TRANSFERÊNCIA ->', '').trim() : '');
        destBusinessId = await resolveToBusinessShelterId(destIdRaw);
    }

    const tx = db.transaction(['distributions', 'audit_log', 'inventory'], 'readwrite');
    const store = tx.objectStore('distributions');
    const auditStore = tx.objectStore('audit_log');
    const invStore = tx.objectStore('inventory');

    const item = await store.get(tempItem.id || parseInt(id));
    if (!item) throw new Error('Erro ao abrir item para exclusão.');

    const updated = {
        ...item,
        status: 'deleted',
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        synced: false
    };

    await store.put(updated);

    // Retornar quantidade para o estoque
    const allInv = await invStore.getAll();
    const inventoryItem = allInv.find(i => 
        i.status !== 'deleted' && 
        (String(i.inventory_id) === String(item.inventory_id) || 
        String(i.id) === String(item.inventory_id) || 
        (i.item_name.toLowerCase() === (item.item_name || '').toLowerCase() && String(i.shelter_id) === String(item.shelter_id)))
    );
    if (inventoryItem) {
        inventoryItem.quantity = parseFloat(inventoryItem.quantity || 0) + parseFloat(item.quantity || 0);
        inventoryItem.updated_at = new Date().toISOString();
        inventoryItem.synced = false;
        await invStore.put(inventoryItem);
    }

    // Se for transferência, retirar do destino também
    if (isTransfer && destBusinessId) {
        const destInventoryItem = allInv.find(i => 
            i.status !== 'deleted' && 
            String(i.shelter_id) === String(destBusinessId) &&
            i.item_name.toLowerCase() === (item.item_name || '').toLowerCase()
        );
        if (destInventoryItem) {
            destInventoryItem.quantity = parseFloat(destInventoryItem.quantity || 0) - parseFloat(item.quantity || 0);
            if (destInventoryItem.quantity < 0) destInventoryItem.quantity = 0;
            destInventoryItem.updated_at = new Date().toISOString();
            destInventoryItem.synced = false;
            await invStore.put(destInventoryItem);
        }
    }

    await auditStore.add({
        action: 'DISTRIBUTION_DELETE',
        user_id: 'local',
        details: `Deleted distribution: ${item.item_name} for ${item.recipient_name}`,
        timestamp: new Date().toISOString()
    });

    await tx.done;
    triggerSync();
    return updated;
};

export const deleteInventoryItem = async (id) => {
    const db = await initDB();
    const isNumeric = /^\\d+$/.test(String(id));
    let tempItem;
    if (isNumeric) {
        tempItem = await db.get('inventory', parseInt(id));
    }
    if (!tempItem) {
        const allInv = await db.getAll('inventory');
        tempItem = allInv.find(i => String(i.inventory_id) === String(id) || String(i.id) === String(id));
    }
    if (!tempItem) throw new Error('Item não encontrado.');

    const tx = db.transaction(['inventory', 'distributions', 'donations', 'audit_log'], 'readwrite');
    const store = tx.objectStore('inventory');
    const distStore = tx.objectStore('distributions');
    const donStore = tx.objectStore('donations');
    const auditStore = tx.objectStore('audit_log');

    const item = await store.get(tempItem.id);
    if (!item) throw new Error('Erro ao abrir item para exclusão.');

    // Verifica se há alguma distribuição utilizando este item
    const allDistributions = await distStore.getAll();
    const hasDistributions = allDistributions.some(d =>
        d.status !== 'deleted' &&
        (String(d.inventory_id) === String(item.id) ||
            String(d.inventory_id) === String(item.inventory_id) ||
            String(d.inventory_id) === String(item.item_id) ||
            (d.item_name && item.item_name && d.item_name.toLowerCase() === item.item_name.toLowerCase() && String(d.shelter_id) === String(item.shelter_id)))
    );

    if (hasDistributions) {
        throw new Error('Não é possível excluir: Este item já possui distribuições registradas.');
    }

    // Soft-delete do item de inventário
    const updated = {
        ...item,
        status: 'deleted',
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        synced: false
    };
    await store.put(updated);

    // Soft-delete das doações (Relatórios Gerais) que originaram este item
    const allDonations = await donStore.getAll();
    const matchingDonations = allDonations.filter(d =>
        d.status !== 'deleted' &&
        d.item_description && item.item_name &&
        d.item_description.toLowerCase() === item.item_name.toLowerCase() &&
        String(d.shelter_id) === String(item.shelter_id)
    );

    for (const d of matchingDonations) {
        await donStore.put({
            ...d,
            status: 'deleted',
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            synced: false
        });
    }

    await auditStore.add({
        action: 'INVENTORY_DELETE',
        entity_type: 'inventory',
        entity_id: item.inventory_id || item.item_id || String(id),
        details: `Deleted: ${item.item_name} e arquivou ${matchingDonations.length} doação(ões)`,
        timestamp: new Date().toISOString()
    });

    await tx.done;
    triggerSync();
    return true;
};

export const getAuditLog = async (entityType, limit = 50) => {
    const db = await initDB();
    const all = await db.getAll('audit_log');
    let filtered = all;
    if (entityType) {
        filtered = all.filter(e => e.entity_type === entityType);
    }
    return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
};

export const getDataConsistencyReport = async (shelterId) => {
    const db = await initDB();
    const sid = shelterId || 'CENTRAL';

    const allDonations = await db.getAll('donations');
    const donations = allDonations.filter(d =>
        (!d.shelter_id || String(d.shelter_id) === String(sid) || (sid === 'CENTRAL' && String(d.shelter_id) === 'null')) && d.status !== 'deleted'
    );

    const allDistributions = await db.getAll('distributions');
    const distributions = allDistributions.filter(d =>
        (!d.shelter_id || String(d.shelter_id) === String(sid) || (sid === 'CENTRAL' && String(d.shelter_id) === 'null')) && d.status !== 'deleted'
    );

    const allInventory = await db.getAll('inventory');
    const inventory = allInventory.filter(i =>
        (!i.shelter_id || String(i.shelter_id) === String(sid) || (sid === 'CENTRAL' && String(i.shelter_id) === 'null')) && i.status !== 'deleted'
    );

    const totalDonated = donations.reduce((acc, d) => acc + (parseFloat(d.quantity) || 0), 0);
    const totalDistributed = distributions.reduce((acc, d) => acc + (parseFloat(d.quantity) || 0), 0);
    const currentStock = inventory.reduce((acc, i) => acc + (parseFloat(i.quantity) || 0), 0);
    const expectedStock = totalDonated - totalDistributed;
    const divergence = Math.abs(currentStock - expectedStock);

    // Detect incomplete records
    const incompleteDonations = allDonations.filter(d =>
        d.status !== 'deleted' && (!d.item_description || !d.item_description.trim() || !d.quantity || parseFloat(d.quantity) <= 0)
    );

    return {
        totalDonated,
        totalDistributed,
        expectedStock,
        currentStock,
        divergence,
        isConsistent: divergence < 0.01,
        donationCount: donations.length,
        distributionCount: distributions.length,
        inventoryItemCount: inventory.length,
        incompleteDonations: incompleteDonations.length
    };
};

export const getItemMovementHistory = async (itemName, shelterId) => {
    const db = await initDB();
    const sid = shelterId || 'CENTRAL';
    const movements = [];

    // Donations for this item
    const allDonations = await db.getAll('donations');
    allDonations.filter(d =>
        String(d.shelter_id) === String(sid) &&
        d.item_description && d.item_description.toLowerCase() === itemName.toLowerCase() &&
        d.status !== 'deleted'
    ).forEach(d => {
        movements.push({
            type: 'entrada',
            date: d.donation_date || d.created_at,
            quantity: parseFloat(d.quantity) || 0,
            unit: d.unit,
            description: `Doação de ${d.donor_name || 'Anônimo'}`,
            icon: 'gift'
        });
    });

    // Distributions of this item
    const allDistributions = await db.getAll('distributions');
    allDistributions.filter(d =>
        String(d.shelter_id) === String(sid) &&
        d.item_name && d.item_name.toLowerCase() === itemName.toLowerCase() &&
        d.status !== 'deleted'
    ).forEach(d => {
        movements.push({
            type: 'saida',
            date: d.distribution_date || d.created_at,
            quantity: parseFloat(d.quantity) || 0,
            unit: d.unit,
            description: `Distribuição para ${d.recipient_name || 'N/A'}`,
            icon: 'truck'
        });
    });

    return movements.sort((a, b) => new Date(b.date) - new Date(a.date));
};
