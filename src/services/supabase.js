import { createClient } from '@supabase/supabase-js'

// Main project (sigerd_mobile) - for vistorias, auth, etc.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// GeoRescue project - for electrical installations
// GeoRescue project - for electrical installations
const georescueUrl = import.meta.env.VITE_GEORESCUE_URL
const georescueKey = import.meta.env.VITE_GEORESCUE_ANON_KEY

export const georescue = createClient(georescueUrl, georescueKey)
