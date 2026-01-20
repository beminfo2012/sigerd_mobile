import { createClient } from '@supabase/supabase-js'

// Main project (sigerd_mobile) - for vistorias, auth, etc.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://flsppiyjmcrjqulosrqs.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsc3BwaXlqbWNyanF1bG9zcnFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMDM2NTksImV4cCI6MjA4MjY3OTY1OX0.TmRPTae3ptQILfAvEvdVnKwnqIdI0FgFQ7jh1vev-gs'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// GeoRescue project - for electrical installations
const georescueUrl = import.meta.env.VITE_GEORESCUE_URL || 'https://miijkslcxxlxnbpxzlub.supabase.co'
const georescueKey = import.meta.env.VITE_GEORESCUE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1paWprc2xjeHhseG5icHh6bHViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0NjE0OTMsImV4cCI6MjA1MTAzNzQ5M30.Hy0Jjk5lQzFHIQoZTQQQbqQFWPxAHnVpSrJGhqCjqtQ'

export const georescue = createClient(georescueUrl, georescueKey)
