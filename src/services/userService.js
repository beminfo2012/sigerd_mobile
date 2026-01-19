import { supabase } from './supabase'
import { isAdmin } from '../utils/permissions'

/**
 * List all users in the system
 * @returns {Promise<{data: Array, error: any}>} List of users or error
 */
export const listUsers = async () => {
    try {
        // Check admin permission
        const admin = await isAdmin()
        if (!admin) {
            return { data: null, error: { message: 'Acesso negado. Apenas administradores podem listar usuários.' } }
        }

        const { data, error } = await supabase
            .from('profiles')
            .select(`
                id,
                full_name,
                matricula,
                role,
                is_active,
                created_at,
                updated_at
            `)
            .order('created_at', { ascending: false })

        if (error) throw error

        // Get email from auth.users for each profile
        const usersWithEmail = await Promise.all(
            (data || []).map(async (profile) => {
                const { data: { user } } = await supabase.auth.admin.getUserById(profile.id)
                return {
                    ...profile,
                    email: user?.email || 'N/A'
                }
            })
        )

        return { data: usersWithEmail, error: null }
    } catch (error) {
        console.error('Error listing users:', error)
        return { data: null, error }
    }
}

/**
 * Create a new user in the system
 * @param {Object} userData - User data
 * @param {string} userData.email - User email
 * @param {string} userData.password - User password
 * @param {string} userData.full_name - User full name
 * @param {string} userData.role - User role (Admin/Operador/Visualizador)
 * @param {string} [userData.matricula] - User matricula (optional)
 * @returns {Promise<{data: any, error: any}>} Created user or error
 */
export const createUser = async (userData) => {
    try {
        // Check admin permission
        const admin = await isAdmin()
        if (!admin) {
            return { data: null, error: { message: 'Acesso negado. Apenas administradores podem criar usuários.' } }
        }

        const { email, password, full_name, role, matricula } = userData

        // Validate required fields
        if (!email || !password || !full_name || !role) {
            return { data: null, error: { message: 'Email, senha, nome e perfil são obrigatórios.' } }
        }

        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name,
                    role
                }
            }
        })

        if (authError) throw authError

        if (!authData.user) {
            throw new Error('Falha ao criar usuário')
        }

        // Get current user for created_by field
        const { data: { user: currentUser } } = await supabase.auth.getUser()

        // Create/update profile
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: authData.user.id,
                full_name,
                matricula: matricula || null,
                role,
                is_active: true,
                created_by: currentUser?.id,
                updated_at: new Date().toISOString()
            })
            .select()
            .single()

        if (profileError) throw profileError

        return { data: { ...profileData, email }, error: null }
    } catch (error) {
        console.error('Error creating user:', error)
        return { data: null, error }
    }
}

/**
 * Update an existing user
 * @param {string} userId - User ID to update
 * @param {Object} updates - Fields to update
 * @returns {Promise<{data: any, error: any}>} Updated user or error
 */
export const updateUser = async (userId, updates) => {
    try {
        // Check admin permission
        const admin = await isAdmin()
        if (!admin) {
            return { data: null, error: { message: 'Acesso negado. Apenas administradores podem editar usuários.' } }
        }

        // Don't allow updating id or created_by
        const { id, created_by, ...safeUpdates } = updates

        const { data, error } = await supabase
            .from('profiles')
            .update({
                ...safeUpdates,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single()

        if (error) throw error

        return { data, error: null }
    } catch (error) {
        console.error('Error updating user:', error)
        return { data: null, error }
    }
}

/**
 * Deactivate a user (soft delete)
 * @param {string} userId - User ID to deactivate
 * @returns {Promise<{data: any, error: any}>} Result or error
 */
export const deactivateUser = async (userId) => {
    try {
        // Check admin permission
        const admin = await isAdmin()
        if (!admin) {
            return { data: null, error: { message: 'Acesso negado. Apenas administradores podem desativar usuários.' } }
        }

        // Don't allow deactivating yourself
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (currentUser?.id === userId) {
            return { data: null, error: { message: 'Você não pode desativar sua própria conta.' } }
        }

        const { data, error } = await supabase
            .from('profiles')
            .update({
                is_active: false,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single()

        if (error) throw error

        return { data, error: null }
    } catch (error) {
        console.error('Error deactivating user:', error)
        return { data: null, error }
    }
}

/**
 * Reactivate a user
 * @param {string} userId - User ID to reactivate
 * @returns {Promise<{data: any, error: any}>} Result or error
 */
export const reactivateUser = async (userId) => {
    try {
        // Check admin permission
        const admin = await isAdmin()
        if (!admin) {
            return { data: null, error: { message: 'Acesso negado. Apenas administradores podem reativar usuários.' } }
        }

        const { data, error } = await supabase
            .from('profiles')
            .update({
                is_active: true,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single()

        if (error) throw error

        return { data, error: null }
    } catch (error) {
        console.error('Error reactivating user:', error)
        return { data: null, error }
    }
}

/**
 * Update user password (admin only)
 * @param {string} userId - User ID
 * @param {string} newPassword - New password
 * @returns {Promise<{data: any, error: any}>} Result or error
 */
export const updateUserPassword = async (userId, newPassword) => {
    try {
        // Check admin permission
        const admin = await isAdmin()
        if (!admin) {
            return { data: null, error: { message: 'Acesso negado. Apenas administradores podem alterar senhas.' } }
        }

        const { data, error } = await supabase.auth.admin.updateUserById(
            userId,
            { password: newPassword }
        )

        if (error) throw error

        return { data, error: null }
    } catch (error) {
        console.error('Error updating password:', error)
        return { data: null, error }
    }
}
