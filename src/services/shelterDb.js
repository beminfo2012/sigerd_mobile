import { initDB } from './db';

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
    return db.add('shelters', newShelter);
};

export const updateShelter = async (id, changes) => {
    const db = await initDB();
    const tx = db.transaction('shelters', 'readwrite');
    const store = tx.objectStore('shelters');
    const shelter = await store.get(parseInt(id));

    if (shelter) {
        const updated = { ...shelter, ...changes, updated_at: new Date().toISOString(), synced: false };
        await store.put(updated);
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

    return db.add('occupants', newOccupant);
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
};

// --- INVENTORY & DONATIONS ---

export const getDonations = async (shelterId) => {
    const db = await initDB();
    if (shelterId) {
        return db.getAllFromIndex('donations', 'shelter_id', String(shelterId));
    }
    return db.getAll('donations');
};

export const addDonation = async (donationData) => {
    const db = await initDB();
    const newDonation = {
        ...donationData,
        donation_id: generateId('DOA'),
        donation_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        synced: false
    };
    return db.add('donations', newDonation);
};

export const getInventory = async (shelterId) => {
    const db = await initDB();
    if (shelterId) {
        return db.getAllFromIndex('inventory', 'shelter_id', String(shelterId));
    }
    return db.getAll('inventory');
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
    // Attempt by ID explicitly
    if (distribution.inventory_id) {
        item = await invStore.get(distribution.inventory_id);
    }

    // If not found (maybe passed item_name for global lookup?)
    // Dexie version had a fallback search by name used for synced records
    if (!item && distribution.item_name) {
        const allItems = await invStore.getAll(); // Expensive but safe for small inventory
        // Filter manually for now as multiple indexes are tricky in raw IDB without cursor
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
    return newDist;
};

// --- COMPATIBILITY EXPORT ---
// Map the old Dexie 'db' usage to null or crash to force refactor?
// Better to export explicit functions.
