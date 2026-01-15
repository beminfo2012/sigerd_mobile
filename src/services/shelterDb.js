import Dexie from 'dexie';

/**
 * Isolated Dexie Database for Shelter Management
 * This keeps shelter data separate from the main app's vistorias database
 * to avoid schema versioning conflicts during development.
 */
export const db = new Dexie('sigerd-abrigos-v2');

db.version(1).stores({
    shelters: '++id, shelter_id, name, status, synced',
    occupants: '++id, occupant_id, shelter_id, full_name, family_group, status, is_family_head, synced',
    donations: '++id, donation_id, shelter_id, donation_type, donation_date, synced',
    inventory: '++id, inventory_id, shelter_id, item_name, category, synced',
    distributions: '++id, distribution_id, shelter_id, inventory_id, distribution_date, synced',
    families: '++id, shelter_id, responsible_id, synced'
});

// Helper functions for data management
export const addShelter = async (shelter) => {
    return await db.shelters.add({
        ...shelter,
        shelter_id: `ABR-${Math.floor(Math.random() * 900) + 100}`,
        status: shelter.status || 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        synced: 0
    });
};

export const addOccupant = async (occupant) => {
    return await db.occupants.add({
        ...occupant,
        occupant_id: `OCP-${Math.floor(Math.random() * 900) + 100}`,
        is_family_head: occupant.is_family_head || false,
        entry_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        synced: 0
    });
};

export const addDonation = async (donation) => {
    return await db.donations.add({
        ...donation,
        donation_id: `DOA-${Math.floor(Math.random() * 900) + 100}`,
        donation_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        synced: 0
    });
};

export const addDistribution = async (distribution) => {
    const item = await db.inventory.get(distribution.inventory_id);
    if (!item) {
        // Find by name if ID fails (for synced records)
        const itemsByName = await db.inventory.where('item_name').equals(distribution.item_name).toArray();
        if (itemsByName.length === 0) throw new Error('Item não encontrado');
        distribution.inventory_id = itemsByName[0].id;
    }

    const currentItem = await db.inventory.get(distribution.inventory_id);
    if (currentItem.quantity < distribution.quantity) {
        throw new Error('Estoque insuficiente');
    }

    // Update inventory
    await db.inventory.update(distribution.inventory_id, {
        quantity: currentItem.quantity - parseFloat(distribution.quantity),
        updated_at: new Date().toISOString(),
        synced: 0
    });

    return await db.distributions.add({
        ...distribution,
        distribution_id: `DIST-${Math.floor(Math.random() * 900) + 100}`,
        distribution_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        synced: 0
    });
};

export const exitOccupant = async (occupantId, shelterId) => {
    const occupant = await db.occupants.get(occupantId);
    if (!occupant || occupant.status === 'exited') return;

    await db.occupants.update(occupantId, {
        status: 'exited',
        exit_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        synced: 0
    });

    const shelter = await db.shelters.get(parseInt(shelterId));
    if (shelter) {
        await db.shelters.update(parseInt(shelterId), {
            current_occupancy: Math.max(0, (shelter.current_occupancy || 0) - 1),
            updated_at: new Date().toISOString(),
            synced: 0
        });
    }
};

export default db;
