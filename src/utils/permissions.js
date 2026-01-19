import { supabase } from './supabase'

/**
 * Check if the current logged-in user is an administrator
 * @returns {Promise<boolean>} True if user is admin, false otherwise
 */
export const isAdmin = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return false

        // Special case: Explicitly allow the requested admin email
        if (user.email === 'bruno_pagel@hotmail.com') return true

        const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (error) {
            console.error('Error checking admin status:', error)
            return false
        }

        return data?.role === 'Admin'
    } catch (error) {
        console.error('Error in isAdmin:', error)
        return false
    }
}

/**
 * Check if user has a specific role
 * @param {string} requiredRole - The role to check for
 * @returns {Promise<boolean>} True if user has the role
 */
export const hasRole = async (requiredRole) => {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return false

        const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (error) return false

        return data?.role === requiredRole
    } catch (error) {
        console.error('Error in hasRole:', error)
        return false
    }
}

/**
 * Get current user's role
 * @returns {Promise<string|null>} User's role or null
 */
export const getCurrentUserRole = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null

        const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (error) return null

        return data?.role || null
    } catch (error) {
        console.error('Error in getCurrentUserRole:', error)
        return null
    }
}

/**
 * Check if user can manage other users
 * @returns {Promise<boolean>} True if user can manage users
 */
export const canManageUsers = async () => {
    return await isAdmin()
}
