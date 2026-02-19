import { supabase } from './supabase'

/**
 * Shelter Management API Service
 * Handles all API calls for the shelter management module
 */

// ============================================
// SHELTERS
// ============================================

export const getShelters = async () => {
    try {
        const { data, error } = await supabase
            .from('shelters')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        console.error('Error fetching shelters:', error)
        return { success: false, error: error.message }
    }
}

export const getShelterById = async (id) => {
    try {
        const { data, error } = await supabase
            .from('shelters')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        console.error('Error fetching shelter:', error)
        return { success: false, error: error.message }
    }
}

export const createShelter = async (shelterData) => {
    try {
        const { data: { user } } = await supabase.auth.getUser()

        const { data, error } = await supabase
            .from('shelters')
            .insert([{
                ...shelterData,
                created_by: user.id,
                synced: true
            }])
            .select()
            .single()

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        console.error('Error creating shelter:', error)
        return { success: false, error: error.message }
    }
}

export const updateShelter = async (id, shelterData) => {
    try {
        const { data, error } = await supabase
            .from('shelters')
            .update({
                ...shelterData,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        console.error('Error updating shelter:', error)
        return { success: false, error: error.message }
    }
}

// ============================================
// OCCUPANTS
// ============================================

export const getOccupants = async (shelterId) => {
    try {
        const query = supabase
            .from('shelter_occupants')
            .select('*')
            .order('created_at', { ascending: false })

        if (shelterId) {
            query.eq('shelter_id', shelterId)
        }

        const { data, error } = await query

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        console.error('Error fetching occupants:', error)
        return { success: false, error: error.message }
    }
}

export const createOccupant = async (occupantData) => {
    try {
        const { data: { user } } = await supabase.auth.getUser()

        const { data, error } = await supabase
            .from('shelter_occupants')
            .insert([{
                ...occupantData,
                created_by: user.id,
                synced: true
            }])
            .select()
            .single()

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        console.error('Error creating occupant:', error)
        return { success: false, error: error.message }
    }
}

export const updateOccupant = async (id, occupantData) => {
    try {
        const { data, error } = await supabase
            .from('shelter_occupants')
            .update({
                ...occupantData,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        console.error('Error updating occupant:', error)
        return { success: false, error: error.message }
    }
}

// ============================================
// DONATIONS
// ============================================

export const getDonations = async (shelterId) => {
    try {
        const query = supabase
            .from('shelter_donations')
            .select('*')
            .order('donation_date', { ascending: false })

        if (shelterId) {
            query.eq('shelter_id', shelterId)
        }

        const { data, error } = await query

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        console.error('Error fetching donations:', error)
        return { success: false, error: error.message }
    }
}

export const createDonation = async (donationData) => {
    try {
        const { data: { user } } = await supabase.auth.getUser()

        const { data, error } = await supabase
            .from('shelter_donations')
            .insert([{
                ...donationData,
                created_by: user.id,
                synced: true
            }])
            .select()
            .single()

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        console.error('Error creating donation:', error)
        return { success: false, error: error.message }
    }
}

// ============================================
// INVENTORY
// ============================================

export const getInventory = async (shelterId) => {
    try {
        const query = supabase
            .from('shelter_inventory')
            .select('*')
            .order('item_name', { ascending: true })

        if (shelterId) {
            query.eq('shelter_id', shelterId)
        }

        const { data, error } = await query

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        console.error('Error fetching inventory:', error)
        return { success: false, error: error.message }
    }
}

export const createInventoryItem = async (itemData) => {
    try {
        const { data: { user } } = await supabase.auth.getUser()

        const { data, error } = await supabase
            .from('shelter_inventory')
            .insert([{
                ...itemData,
                created_by: user.id,
                synced: true
            }])
            .select()
            .single()

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        console.error('Error creating inventory item:', error)
        return { success: false, error: error.message }
    }
}

export const updateInventoryItem = async (id, itemData) => {
    try {
        const { data, error } = await supabase
            .from('shelter_inventory')
            .update({
                ...itemData,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        console.error('Error updating inventory item:', error)
        return { success: false, error: error.message }
    }
}

// ============================================
// DISTRIBUTIONS
// ============================================

export const getDistributions = async (shelterId) => {
    try {
        const query = supabase
            .from('shelter_distributions')
            .select('*')
            .order('distribution_date', { ascending: false })

        if (shelterId) {
            query.eq('shelter_id', shelterId)
        }

        const { data, error } = await query

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        console.error('Error fetching distributions:', error)
        return { success: false, error: error.message }
    }
}

export const createDistribution = async (distributionData) => {
    try {
        const { data: { user } } = await supabase.auth.getUser()

        const { data, error } = await supabase
            .from('shelter_distributions')
            .insert([{
                ...distributionData,
                distributed_by: user.id,
                synced: true
            }])
            .select()
            .single()

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        console.error('Error creating distribution:', error)
        return { success: false, error: error.message }
    }
}

// ============================================
// STATISTICS
// ============================================

export const getShelterStats = async () => {
    try {
        // Get total shelters
        const { data: shelters, error: sheltersError } = await supabase
            .from('shelters')
            .select('id, status, current_occupancy')

        if (sheltersError) throw sheltersError

        // Get total active occupants
        const { data: occupants, error: occupantsError } = await supabase
            .from('shelter_occupants')
            .select('id')
            .eq('status', 'active')

        if (occupantsError) throw occupantsError

        // Get total donations
        const { data: donations, error: donationsError } = await supabase
            .from('shelter_donations')
            .select('id')

        if (donationsError) throw donationsError

        return {
            success: true,
            data: {
                totalShelters: shelters?.length || 0,
                activeShelters: shelters?.filter(s => s.status === 'active').length || 0,
                totalOccupants: occupants?.length || 0,
                totalDonations: donations?.length || 0,
                totalCapacity: shelters?.reduce((sum, s) => sum + (s.current_occupancy || 0), 0) || 0
            }
        }
    } catch (error) {
        console.error('Error fetching shelter stats:', error)
        return { success: false, error: error.message }
    }
}
