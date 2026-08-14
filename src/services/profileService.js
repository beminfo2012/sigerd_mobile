import { supabase } from './supabase'
import { isAdmin } from '../utils/permissions'

/**
 * Lista todas as definições de perfis da tabela role_definitions.
 */
export const listProfiles = async () => {
    try {
        const { data, error } = await supabase
            .from('role_definitions')
            .select('*')
            .order('label', { ascending: true })
        if (error) throw error
        return { data: data || [], error: null }
    } catch (error) {
        console.error('[profileService] listProfiles:', error)
        return { data: [], error }
    }
}

/**
 * Busca um perfil pelo role_key (ex: 'Agente de Defesa Civil').
 */
export const getProfileByKey = async (roleKey) => {
    try {
        const { data, error } = await supabase
            .from('role_definitions')
            .select('*')
            .eq('role_key', roleKey)
            .single()
        if (error && error.code !== 'PGRST116') throw error
        return { data: data || null, error: null }
    } catch (error) {
        console.error('[profileService] getProfileByKey:', error)
        return { data: null, error }
    }
}

/**
 * Cria ou atualiza a definição de um perfil (upsert por role_key).
 */
export const saveProfile = async (profileData) => {
    try {
        const admin = await isAdmin()
        if (!admin) return { data: null, error: { message: 'Acesso negado.' } }

        const { role_key, label, description, permissions, is_system, is_active } = profileData

        const { data, error } = await supabase
            .from('role_definitions')
            .upsert(
                {
                    role_key,
                    label,
                    description: description || null,
                    permissions: permissions || {},
                    is_system: is_system || false,
                    is_active: is_active !== false,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'role_key' }
            )
            .select()
            .single()

        if (error) throw error
        return { data, error: null }
    } catch (error) {
        console.error('[profileService] saveProfile:', error)
        return { data: null, error }
    }
}

/**
 * Exclui a definição de um perfil pelo ID.
 * Perfis de sistema (is_system=true) não podem ser excluídos.
 */
export const deleteProfile = async (id) => {
    try {
        const admin = await isAdmin()
        if (!admin) return { error: { message: 'Acesso negado.' } }

        // Verifica se é perfil de sistema
        const { data: existing } = await supabase
            .from('role_definitions')
            .select('is_system, label')
            .eq('id', id)
            .single()

        if (existing?.is_system) {
            return { error: { message: `O perfil "${existing.label}" é um perfil de sistema e não pode ser excluído.` } }
        }

        const { error } = await supabase
            .from('role_definitions')
            .delete()
            .eq('id', id)

        if (error) throw error
        return { error: null }
    } catch (error) {
        console.error('[profileService] deleteProfile:', error)
        return { error }
    }
}

/**
 * Retorna a contagem de usuários por perfil (role_key).
 */
export const getUserCountByRole = async () => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('role')
        if (error) throw error
        const counts = {}
        ;(data || []).forEach(p => {
            counts[p.role] = (counts[p.role] || 0) + 1
        })
        return { data: counts, error: null }
    } catch (error) {
        console.error('[profileService] getUserCountByRole:', error)
        return { data: {}, error }
    }
}
