import { initDB } from './db'
import { supabase } from './supabase'

/**
 * Shelter Offline Database Service
 * Handles offline storage and synchronization for shelter management
 */

// ============================================
// SAVE FUNCTIONS - Local Storage
// ============================================

export const saveShelterLocal = async (data) => {
    const db = await initDB()
    const localId = await db.add('shelters', {
        ...data,
        createdAt: new Date().toISOString(),
        synced: false
    })

    // Try to sync immediately if online
    if (navigator.onLine) {
        const item = await db.get('shelters', localId)
        await syncSingleShelter(item, db)
    }

    return localId
}

export const saveOccupantLocal = async (data) => {
    const db = await initDB()
    const localId = await db.add('shelter_occupants', {
        ...data,
        createdAt: new Date().toISOString(),
        synced: false
    })

    if (navigator.onLine) {
        const item = await db.get('shelter_occupants', localId)
        await syncSingleOccupant(item, db)
    }

    return localId
}

export const saveDonationLocal = async (data) => {
    const db = await initDB()
    const localId = await db.add('shelter_donations', {
        ...data,
        createdAt: new Date().toISOString(),
        synced: false
    })

    if (navigator.onLine) {
        const item = await db.get('shelter_donations', localId)
        await syncSingleDonation(item, db)
    }

    return localId
}

export const saveInventoryLocal = async (data) => {
    const db = await initDB()
    const localId = await db.add('shelter_inventory', {
        ...data,
        createdAt: new Date().toISOString(),
        synced: false
    })

    if (navigator.onLine) {
        const item = await db.get('shelter_inventory', localId)
        await syncSingleInventory(item, db)
    }

    return localId
}

export const saveDistributionLocal = async (data) => {
    const db = await initDB()
    const localId = await db.add('shelter_distributions', {
        ...data,
        createdAt: new Date().toISOString(),
        synced: false
    })

    if (navigator.onLine) {
        const item = await db.get('shelter_distributions', localId)
        await syncSingleDistribution(item, db)
    }

    return localId
}

// ============================================
// GET FUNCTIONS - Local Retrieval
// ============================================

export const getAllSheltersLocal = async () => {
    const db = await initDB()
    return db.getAll('shelters')
}

export const getAllOccupantsLocal = async (shelterId = null) => {
    const db = await initDB()
    const all = await db.getAll('shelter_occupants')
    if (shelterId) {
        return all.filter(o => o.shelter_id === shelterId)
    }
    return all
}

export const getAllDonationsLocal = async (shelterId = null) => {
    const db = await initDB()
    const all = await db.getAll('shelter_donations')
    if (shelterId) {
        return all.filter(d => d.shelter_id === shelterId)
    }
    return all
}

export const getAllInventoryLocal = async (shelterId = null) => {
    const db = await initDB()
    const all = await db.getAll('shelter_inventory')
    if (shelterId) {
        return all.filter(i => i.shelter_id === shelterId)
    }
    return all
}

export const getAllDistributionsLocal = async (shelterId = null) => {
    const db = await initDB()
    const all = await db.getAll('shelter_distributions')
    if (shelterId) {
        return all.filter(d => d.shelter_id === shelterId)
    }
    return all
}

// ============================================
// SYNC FUNCTIONS - Individual Items
// ============================================

const syncSingleShelter = async (item, db) => {
    try {
        const { data: { user } } = await supabase.auth.getUser()

        const payload = {
            shelter_id: item.shelter_id || item.shelterId,
            name: item.name,
            address: item.address,
            bairro: item.bairro,
            coordenadas: item.coordenadas,
            capacity: item.capacity,
            current_occupancy: item.current_occupancy || 0,
            responsible_name: item.responsible_name,
            responsible_phone: item.responsible_phone,
            status: item.status || 'active',
            observations: item.observations,
            created_by: user.id
        }

        const { error } = await supabase.from('shelters').insert([payload])

        if (error) {
            console.error('Supabase Insert Error (shelters):', error)
            return false
        }

        // Mark as synced
        const tx = db.transaction('shelters', 'readwrite')
        const store = tx.objectStore('shelters')
        const record = await store.get(item.id)
        if (record) {
            record.synced = true
            await store.put(record)
        }
        await tx.done
        return true
    } catch (e) {
        console.error('Sync error for shelter:', e)
        return false
    }
}

const syncSingleOccupant = async (item, db) => {
    try {
        const { data: { user } } = await supabase.auth.getUser()

        const payload = {
            occupant_id: item.occupant_id || item.occupantId,
            shelter_id: item.shelter_id,
            full_name: item.full_name,
            cpf: item.cpf,
            age: item.age,
            gender: item.gender,
            family_group: item.family_group,
            special_needs: item.special_needs,
            entry_date: item.entry_date,
            exit_date: item.exit_date,
            status: item.status || 'active',
            observations: item.observations,
            created_by: user.id
        }

        const { error } = await supabase.from('shelter_occupants').insert([payload])

        if (error) {
            console.error('Supabase Insert Error (occupants):', error)
            return false
        }

        const tx = db.transaction('shelter_occupants', 'readwrite')
        const store = tx.objectStore('shelter_occupants')
        const record = await store.get(item.id)
        if (record) {
            record.synced = true
            await store.put(record)
        }
        await tx.done
        return true
    } catch (e) {
        console.error('Sync error for occupant:', e)
        return false
    }
}

const syncSingleDonation = async (item, db) => {
    try {
        const { data: { user } } = await supabase.auth.getUser()

        const payload = {
            donation_id: item.donation_id || item.donationId,
            shelter_id: item.shelter_id,
            donor_name: item.donor_name,
            donor_phone: item.donor_phone,
            donation_type: item.donation_type,
            item_description: item.item_description,
            quantity: item.quantity,
            unit: item.unit,
            donation_date: item.donation_date,
            observations: item.observations,
            created_by: user.id
        }

        const { error } = await supabase.from('shelter_donations').insert([payload])

        if (error) {
            console.error('Supabase Insert Error (donations):', error)
            return false
        }

        const tx = db.transaction('shelter_donations', 'readwrite')
        const store = tx.objectStore('shelter_donations')
        const record = await store.get(item.id)
        if (record) {
            record.synced = true
            await store.put(record)
        }
        await tx.done
        return true
    } catch (e) {
        console.error('Sync error for donation:', e)
        return false
    }
}

const syncSingleInventory = async (item, db) => {
    try {
        const { data: { user } } = await supabase.auth.getUser()

        const payload = {
            inventory_id: item.inventory_id || item.inventoryId,
            shelter_id: item.shelter_id,
            item_name: item.item_name,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
            expiration_date: item.expiration_date,
            location: item.location,
            minimum_stock: item.minimum_stock || 0,
            observations: item.observations,
            created_by: user.id
        }

        const { error } = await supabase.from('shelter_inventory').insert([payload])

        if (error) {
            console.error('Supabase Insert Error (inventory):', error)
            return false
        }

        const tx = db.transaction('shelter_inventory', 'readwrite')
        const store = tx.objectStore('shelter_inventory')
        const record = await store.get(item.id)
        if (record) {
            record.synced = true
            await store.put(record)
        }
        await tx.done
        return true
    } catch (e) {
        console.error('Sync error for inventory:', e)
        return false
    }
}

const syncSingleDistribution = async (item, db) => {
    try {
        const { data: { user } } = await supabase.auth.getUser()

        const payload = {
            distribution_id: item.distribution_id || item.distributionId,
            shelter_id: item.shelter_id,
            inventory_id: item.inventory_id,
            item_name: item.item_name,
            quantity: item.quantity,
            unit: item.unit,
            recipient_name: item.recipient_name,
            family_group: item.family_group,
            distribution_date: item.distribution_date,
            distributed_by: user.id,
            observations: item.observations
        }

        const { error } = await supabase.from('shelter_distributions').insert([payload])

        if (error) {
            console.error('Supabase Insert Error (distributions):', error)
            return false
        }

        const tx = db.transaction('shelter_distributions', 'readwrite')
        const store = tx.objectStore('shelter_distributions')
        const record = await store.get(item.id)
        if (record) {
            record.synced = true
            await store.put(record)
        }
        await tx.done
        return true
    } catch (e) {
        console.error('Sync error for distribution:', e)
        return false
    }
}

// ============================================
// BULK SYNC FUNCTION
// ============================================

export const syncShelterData = async () => {
    const db = await initDB()
    let syncedCount = 0

    // Sync shelters
    const allShelters = await db.getAll('shelters')
    const pendingShelters = allShelters.filter(s => s.synced === false || s.synced === undefined)
    for (const item of pendingShelters) {
        const success = await syncSingleShelter(item, db)
        if (success) syncedCount++
    }

    // Sync occupants
    const allOccupants = await db.getAll('shelter_occupants')
    const pendingOccupants = allOccupants.filter(o => o.synced === false || o.synced === undefined)
    for (const item of pendingOccupants) {
        const success = await syncSingleOccupant(item, db)
        if (success) syncedCount++
    }

    // Sync donations
    const allDonations = await db.getAll('shelter_donations')
    const pendingDonations = allDonations.filter(d => d.synced === false || d.synced === undefined)
    for (const item of pendingDonations) {
        const success = await syncSingleDonation(item, db)
        if (success) syncedCount++
    }

    // Sync inventory
    const allInventory = await db.getAll('shelter_inventory')
    const pendingInventory = allInventory.filter(i => i.synced === false || i.synced === undefined)
    for (const item of pendingInventory) {
        const success = await syncSingleInventory(item, db)
        if (success) syncedCount++
    }

    // Sync distributions
    const allDistributions = await db.getAll('shelter_distributions')
    const pendingDistributions = allDistributions.filter(d => d.synced === false || d.synced === undefined)
    for (const item of pendingDistributions) {
        const success = await syncSingleDistribution(item, db)
        if (success) syncedCount++
    }

    return { success: true, count: syncedCount }
}

// ============================================
// PENDING COUNT
// ============================================

export const getPendingShelterSyncCount = async () => {
    const db = await initDB()

    const shelters = await db.getAll('shelters').catch(() => [])
    const occupants = await db.getAll('shelter_occupants').catch(() => [])
    const donations = await db.getAll('shelter_donations').catch(() => [])
    const inventory = await db.getAll('shelter_inventory').catch(() => [])
    const distributions = await db.getAll('shelter_distributions').catch(() => [])

    const p1 = shelters.filter(s => s.synced === false || s.synced === undefined).length
    const p2 = occupants.filter(o => o.synced === false || o.synced === undefined).length
    const p3 = donations.filter(d => d.synced === false || d.synced === undefined).length
    const p4 = inventory.filter(i => i.synced === false || i.synced === undefined).length
    const p5 = distributions.filter(d => d.synced === false || d.synced === undefined).length

    return p1 + p2 + p3 + p4 + p5
}
