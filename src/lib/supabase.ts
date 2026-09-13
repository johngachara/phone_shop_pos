import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // Loud at boot rather than as a confusing "invalid login" later.
  throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set')
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export type AlltechRole = 'employee' | 'manager'

export interface AlltechClaims {
  is_alltech: boolean
  role: AlltechRole | null
}

/** Read this app's claims out of the token.
 *
 * Namespaced under app_metadata.alltech because the Supabase project is shared
 * with another application that already uses a top-level app_metadata.role.
 * Reading the top-level key here would treat their "it_manager" as one of ours. */
export function readClaims(appMetadata: Record<string, unknown> | undefined): AlltechClaims {
  const section = (appMetadata?.alltech ?? {}) as Record<string, unknown>
  const role = section.role
  return {
    is_alltech: section.is_alltech === true,
    role: role === 'employee' || role === 'manager' ? role : null,
  }
}
