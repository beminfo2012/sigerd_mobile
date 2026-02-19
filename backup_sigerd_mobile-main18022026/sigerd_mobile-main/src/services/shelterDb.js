import { initDB, triggerSync } from './db';

/**
 * Shelter Service Layer (IDB Version)
 * Replaces Dexie.js with native IDB from the main app.
 */

// --- HELPERS ---

const generateId = (prefix) => {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).substring(2, 6);
    return `${prefix}-${ts}-${rand}`;
};

// --- SHELTERS ---

export const getShelters = async () => {
    const db = await initDB();
    const all = await db.getAll('shelters');
    return all.filter(s => s.status !== 'deleted');
};

export const getShelterById = async (id) => {
    const db = await initDB();
    // Try to find by primary key (id) first
    let shelter = await db.get('shelters', parseInt(id));
    if (!shelter) {
        // Fallback: try by search index if id is string or not found
        shelter = await db.getFromIndex('shelters', 'shelter_id', id);
    }
    return shelter;
};

export const addShelter = async (shelterData) => {
    const db = await initDB();
    const newShelter = {
        ...shelterData,
        shelter_id: generateId('ABR'),
        status: shelterData.status || 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        synced: false // Pending Sync
    };
    const id = await db.add('shelters', newShelter);
    triggerSync();
    return id;
};

export const updateShelter = async (id, changes) => {
    const db = await initDB();
    const tx = db.transaction('shelters', 'readwrite');
    const store = tx.objectStore('shelters');
    const shelter = await store.get(parseInt(id));

    if (shelter) {
        const updated = { ...shelter, ...changes, updated_at: new Date().toISOString(), synced: false };
        await store.put(updated);
        triggerSync();
    }
    await tx.done;
};

export const deleteShelter = async (id) => {
    const db = await initDB();
    const tx = db.transaction('shelters', 'readwrite');
    const store = tx.objectStore('shelters');
    const shelter = await store.get(parseInt(id));

    if (shelter) {
        const updated = { ...shelter, status: 'deleted', updated_at: new Date().toISOString(), synced: false };
        await store.put(updated);
        triggerSync();
    }
    await tx.done;
};

// --- OCCUPANTS ---

export const getOccupants = async (shelterId) => {
    const db = await initDB();
    // Assuming we want all occupants, potentially filtered by shelterId
    if (shelterId) {
        return db.getAllFromIndex('occupants', 'shelter_id', String(shelterId));
    }
    return db.getAll('occupants');
};

export const addOccupant = async (occupantData) => {
    const db = await initDB();
    const newOccupant = {
        ...occupantData,
        occupant_id: generateId('OCP'),
        is_family_head: occupantData.is_family_head || false,
        entry_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        synced: false
    };

    // Auto-update stats? 
    // Ideally user calls this explicitly, but let's replicate Dexie logic if possible
    // Dexie version didn't auto-update stats on Add, only on Exit found in 'exitOccupant'

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
    const db = await initDB();
    let items;
    if (shelterId && shelterId !== 'CENTRAL') {
        items = await db.getAllFromIndex('donations', 'shelter_id', String(shelterId));
    } else if (shelterId === 'CENTRAL') {
        const all = await db.getAll('donations');
        items = all.filter(d => d.shelter_id === 'CENTRAL');
    } else {
        items = await db.getAll('donations');
    }
    return (items || []).filter(d => d.status !== 'deleted');
};

export const addDonation = async (donationData) => {
    // --- VALIDATION: prevent empty records ---
    if (!donationData.item_description || !donationData.item_description.trim()) {
        throw new Error('Descrição do item é obrigatória. Não é possível salvar doação sem descrição.');
    }
    const qty = parseFloat(donationData.quantity);
    if (!qty || qty <= 0 || isNaN(qty)) {
        throw new Error('Quantidade deve ser maior que zero.');
    }

    const db = await initDB();
    const newDonation = {
        ...donationData,
        donation_id: generateId('DOA'),
        // If no shelter selected, it goes to CENTRAL
        shelter_id: donationData.shelter_id || 'CENTRAL',
        donation_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
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
        existingItem = allInv.find(i =>
            String(i.shelter_id) === String(shelterIdStr) &&
            i.item_name.toLowerCase() === newDonation.item_description.toLowerCase() &&
            i.status !== 'deleted'
        );
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
            item_id: generateId('INV'),
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

export const getInventory = async (shelterId) => {
    const db = await initDB();
    let items;
    if (shelterId && shelterId !== 'CENTRAL') {
        items = await db.getAllFromIndex('inventory', 'shelter_id', String(shelterId));
    } else if (shelterId === 'CENTRAL') {
        const all = await db.getAll('inventory');
        items = all.filter(i => i.shelter_id === 'CENTRAL');
    } else {
        items = await db.getAll('inventory');
    }
    // Filter out soft-deleted items
    return (items || []).filter(i => i.status !== 'deleted');
};

export const getGlobalInventory = async () => {
    const db = await initDB();
    const all = await db.getAll('inventory');
    return all.filter(i => i.status !== 'deleted');
};

export const transferStock = async (itemId, fromShelterId, toShelterId, quantity) => {
    const db = await initDB();
    const tx = db.transaction(['inventory', 'distributions'], 'readwrite');
    const invStore = tx.objectStore('inventory');
    const distStore = tx.objectStore('distributions');

    // 1. Get Source Item
    const sourceItem = await invStore.get(parseInt(itemId));
    if (!sourceItem) throw new Error('Item de origem não encontrado.');

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
        String(i.shelter_id) === String(toShelterId) &&
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
            id: undefined, // Clear ID to auto-generate
            item_id: generateId('INV'),
            shelter_id: toShelterId,
            quantity: parseFloat(quantity),
            updated_at: new Date().toISOString(),
            synced: false
        };
        await invStore.add(newItem);
    }

    // 4. Record Transfer (as Distribution from Source)
    const transferRecord = {
        distribution_id: generateId('TRF'),
        shelter_id: fromShelterId, // "Distributed from"
        destination_shelter_id: toShelterId, // "To"
        item_name: sourceItem.item_name,
        quantity: quantity,
        unit: sourceItem.unit,
        recipient_name: `TRANSFERÊNCIA -> ${toShelterId}`,
        distribution_date: new Date().toISOString(),
        type: 'transfer',
        created_at: new Date().toISOString(),
        synced: false
    };
    await distStore.add(transferRecord);

    await tx.done;
    triggerSync();
    return true;
};

export const getDistributions = async (shelterId) => {
    const db = await initDB();
    let items;
    if (shelterId) {
        items = await db.getAllFromIndex('distributions', 'shelter_id', String(shelterId));
    } else {
        items = await db.getAll('distributions');
    }
    return (items || []).filter(d => d.status !== 'deleted');
};

export const addDistribution = async (distribution) => {
    const db = await initDB();
    const tx = db.transaction(['inventory', 'distributions', 'audit_log'], 'readwrite');
    const invStore = tx.objectStore('inventory');
    const distStore = tx.objectStore('distributions');
    const auditStore = tx.objectStore('audit_log');

    // 1. Find Inventory Item
    let item;
    if (distribution.inventory_id) {
        item = await invStore.get(distribution.inventory_id);
    }

    if (!item && distribution.item_name) {
        const allItems = await invStore.getAll();
        item = allItems.find(i => i.item_name === distribution.item_name && i.status !== 'deleted');
        if (item) distribution.inventory_id = item.id;
    }

    if (!item) throw new Error('Item não encontrado no estoque');

    if (parseFloat(item.quantity) < parseFloat(distribution.quantity)) {
        throw new Error('Estoque insuficiente');
    }

    // 2. Update Inventory
    const updatedItem = {
        ...item,
        quantity: parseFloat(item.quantity) - parseFloat(distribution.quantity),
        updated_at: new Date().toISOString(),
        synced: false
    };
    await invStore.put(updatedItem);

    // 3. Add Distribution
    const newDist = {
        ...distribution,
        distribution_id: generateId('DIST'),
        distribution_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        synced: false
    };
    await distStore.add(newDist);

    // 4. Audit log
    await auditStore.add({
        action: 'DISTRIBUTION',
        entity_type: 'distribution',
        entity_id: newDist.distribution_id,
        details: `${distribution.item_name}: -${distribution.quantity} ${distribution.unit || ''} -> ${distribution.recipient_name || distribution.shelter_id || 'N/A'}`,
        timestamp: new Date().toISOString()
    });

    await tx.done;
    triggerSync();
    return newDist;
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
        entity_id: item.item_id || String(id),
        details: `${item.item_name}: qty ${oldQty} -> ${changes.quantity || oldQty}`,
        timestamp: new Date().toISOString()
    });

    await tx.done;
    triggerSync();
    return updated;
};

export const deleteInventoryItem = async (id) => {
    const db = await initDB();
    const tx = db.transaction(['inventory', 'audit_log'], 'readwrite');
    const store = tx.objectStore('inventory');
    const auditStore = tx.objectStore('audit_log');

    const item = await store.get(parseInt(id));
    if (!item) throw new Error('Item não encontrado.');

    const updated = {
        ...item,
        status: 'deleted',
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        synced: false
    };
    await store.put(updated);

    await auditStore.add({
        action: 'INVENTORY_DELETE',
        entity_type: 'inventory',
        entity_id: item.item_id || String(id),
        details: `Soft-deleted: ${item.item_name} (${item.quantity} ${item.unit})`,
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
        String(d.shelter_id) === String(sid) && d.status !== 'deleted'
    );

    const allDistributions = await db.getAll('distributions');
    const distributions = allDistributions.filter(d =>
        String(d.shelter_id) === String(sid) && d.status !== 'deleted'
    );

    const allInventory = await db.getAll('inventory');
    const inventory = allInventory.filter(i =>
        String(i.shelter_id) === String(sid) && i.status !== 'deleted'
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
