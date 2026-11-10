import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// null tant que le fichier .env.local n'est pas rempli (voir .env.example)
export const supabase = url && anonKey ? createClient(url, anonKey) : null
