import { initDB, triggerSync } from './db';

/**
 * Shelter Service Layer (IDB Version)
 * Replaces Dexie.js with native IDB from the main app.
 */

// --- HELPERS ---

const generateId = (prefix) => {
    return `${prefix}-${Math.floor(Math.random() * 900) + 100}`;
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
    if (shelterId && shelterId !== 'CENTRAL') {
        return db.getAllFromIndex('donations', 'shelter_id', String(shelterId));
    }
    // For CENTRAL or global view
    if (shelterId === 'CENTRAL') {
        const all = await db.getAll('donations');
        return all.filter(d => d.shelter_id === 'CENTRAL');
    }
    return db.getAll('donations');
};

export const addDonation = async (donationData) => {
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

    const tx = db.transaction(['donations', 'inventory'], 'readwrite');
    const donStore = tx.objectStore('donations');
    const invStore = tx.objectStore('inventory');

    await donStore.add(newDonation);

    // Update Inventory
    const shelterIdStr = newDonation.shelter_id;
    let existingItem;

    if (shelterIdStr) {
        // Safe to get all and filter? For MVP yes.
        const allInv = await invStore.getAll();
        existingItem = allInv.find(i =>
            String(i.shelter_id) === String(shelterIdStr) &&
            i.item_name.toLowerCase() === newDonation.item_description.toLowerCase()
        );
    }

    if (existingItem) {
        // Update quantity
        const updatedItem = {
            ...existingItem,
            quantity: parseFloat(existingItem.quantity) + parseFloat(newDonation.quantity),
            updated_at: new Date().toISOString(),
            synced: false
        };
        await invStore.put(updatedItem);
    } else {
        // Create new inventory item
        const newItem = {
            item_id: generateId('INV'),
            shelter_id: shelterIdStr,
            item_name: newDonation.item_description,
            category: newDonation.donation_type, // Map donation type to category
            quantity: parseFloat(newDonation.quantity),
            unit: newDonation.unit,
            min_quantity: 5, // Default
            updated_at: new Date().toISOString(),
            synced: false
        };
        await invStore.add(newItem);
    }

    await tx.done;
    triggerSync();
    return newDonation;
};

export const getInventory = async (shelterId) => {
    const db = await initDB();
    if (shelterId && shelterId !== 'CENTRAL') {
        return db.getAllFromIndex('inventory', 'shelter_id', String(shelterId));
    }
    if (shelterId === 'CENTRAL') {
        // Filter manually for now
        const all = await db.getAll('inventory');
        return all.filter(i => i.shelter_id === 'CENTRAL');
    }
    return db.getAll('inventory');
};

export const getGlobalInventory = async () => {
    const db = await initDB();
    return db.getAll('inventory');
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
    if (shelterId) {
        return db.getAllFromIndex('distributions', 'shelter_id', String(shelterId));
    }
    return db.getAll('distributions');
};

export const addDistribution = async (distribution) => {
    const db = await initDB();
    const tx = db.transaction(['inventory', 'distributions'], 'readwrite');
    const invStore = tx.objectStore('inventory');
    const distStore = tx.objectStore('distributions');

    // 1. Find Inventory Item
    let item;
    if (distribution.inventory_id) {
        item = await invStore.get(distribution.inventory_id);
    }

    if (!item && distribution.item_name) {
        const allItems = await invStore.getAll();
        item = allItems.find(i => i.item_name === distribution.item_name);
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

    await tx.done;
    triggerSync();
    return newDist;
};

// --- DATA CLEARANCE (Admin features) ---

export const clearInventory = async (shelterId) => {
    const db = await initDB();
    const tx = db.transaction('inventory', 'readwrite');
    const store = tx.objectStore('inventory');

    // We can't deleteByIndex directly in simple IDB wrapper without iterating
    // But since this is a rare admin action, iterating is fine
    const allItems = await store.getAll();
    const itemsToDelete = shelterId
        ? allItems.filter(i => String(i.shelter_id) === String(shelterId))
        : allItems;

    for (const item of itemsToDelete) {
        await store.delete(item.id); // Assuming 'id' is keyPath
    }

    await tx.done;
    return true;
};

export const clearReports = async () => {
    const db = await initDB();
    const tx = db.transaction(['distributions', 'donations'], 'readwrite');

    await tx.objectStore('distributions').clear();
    await tx.objectStore('donations').clear();

    await tx.done;
    return true;
};
