import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const configuredUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

// Indica se as variáveis de ambiente estão configuradas corretamente
export const supabaseConfigured = Boolean(configuredUrl && supabaseAnonKey)

// O SDK recebe a raiz do projeto; aceita também a URL REST fornecida pelo painel.
const supabaseUrl = configuredUrl
  ? configuredUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
  : 'https://placeholder.supabase.co'

const anonKey = supabaseAnonKey ?? 'placeholder-key'

export const supabase = createClient<Database>(supabaseUrl, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
