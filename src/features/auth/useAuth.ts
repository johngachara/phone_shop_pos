import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { readClaims, supabase, type AlltechRole } from '@/lib/supabase'

/** Where a session is in the two-step sign-in.
 *
 * Supabase checking the password is not enough on its own: a passkey is the
 * second step, and `passkeyVerified` is what the router actually gates on. */
interface AuthState {
  session: Session | null
  role: AlltechRole | null
  isAlltech: boolean
  passkeyVerified: boolean
  loading: boolean
  setSession: (session: Session | null) => void
  setPasskeyVerified: (value: boolean) => void
  signOut: () => Promise<void>
}

export const useAuth = create<AuthState>((set) => ({
  session: null,
  role: null,
  isAlltech: false,
  passkeyVerified: false,
  loading: true,

  setSession: (session) => {
    const claims = readClaims(session?.user?.app_metadata)
    set({
      session,
      role: claims.role,
      isAlltech: claims.is_alltech,
      loading: false,
      // A new session always starts unverified. Without this, signing out and
      // back in as someone else would inherit the previous passkey step.
      ...(session ? {} : { passkeyVerified: false }),
    })
  },

  setPasskeyVerified: (value) => set({ passkeyVerified: value }),

  signOut: async () => {
    await supabase.auth.signOut()
    set({
      session: null, role: null, isAlltech: false,
      passkeyVerified: false, loading: false,
    })
  },
}))

export function initAuth() {
  supabase.auth.getSession().then(({ data }) => {
    useAuth.getState().setSession(data.session)
  })

  const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
    const store = useAuth.getState()
    store.setSession(session)
    // A token refresh is not a new sign-in and must not silently reset the
    // second factor; a genuine sign-in must.
    if (event === 'SIGNED_IN') store.setPasskeyVerified(false)
  })

  return () => sub.subscription.unsubscribe()
}
