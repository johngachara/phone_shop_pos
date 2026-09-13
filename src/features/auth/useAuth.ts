import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { readClaims, supabase, type AlltechRole } from '@/lib/supabase'

const PASSKEY_KEY = 'alltech-passkey-verified'

/** How long one passkey check covers.
 *
 * A passkey is the second factor, not a per-request check. Re-prompting on
 * every page load made a reload -- or the PWA being restarted by the system,
 * which happens on its own -- throw the till back to the login screen mid-shift.
 *
 * Twelve hours covers a shop day, so it is asked for once when someone starts
 * and again the next morning. Bound to the user id, so signing in as someone
 * else never inherits it.
 */
const PASSKEY_VALID_MS = 12 * 60 * 60 * 1000

function rememberPasskey(userId: string) {
  try {
    localStorage.setItem(PASSKEY_KEY, JSON.stringify({
      userId, expiresAt: Date.now() + PASSKEY_VALID_MS,
    }))
  } catch {
    // Private mode and some locked-down Android browsers throw. Not being able
    // to remember it means an extra prompt, not a broken sign-in.
  }
}

function forgetPasskey() {
  try {
    localStorage.removeItem(PASSKEY_KEY)
  } catch { /* see above */ }
}

function passkeyStillValid(userId: string | undefined): boolean {
  if (!userId) return false
  try {
    const raw = localStorage.getItem(PASSKEY_KEY)
    if (!raw) return false
    const stored = JSON.parse(raw) as { userId?: string; expiresAt?: number }
    // Both checks matter: the wrong user must not inherit it, and an expired
    // record must not be treated as a pass.
    return stored.userId === userId && typeof stored.expiresAt === 'number'
      && stored.expiresAt > Date.now()
  } catch {
    return false
  }
}

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
      // Restored from storage rather than reset, so a reload does not send the
      // till back to the login screen. Still false for a signed-out state, and
      // the record is bound to the user id so another account cannot inherit it.
      passkeyVerified: session ? passkeyStillValid(session.user?.id) : false,
    })
  },

  setPasskeyVerified: (value) => {
    const userId = useAuth.getState().session?.user?.id
    if (value && userId) {
      rememberPasskey(userId)
    } else if (!value) {
      forgetPasskey()
    }
    set({ passkeyVerified: value })
  },

  signOut: async () => {
    // Cleared on the way out, so the next person at this device is asked for
    // their own passkey rather than walking straight in.
    forgetPasskey()
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

  // Supabase refreshes the access token on a timer. Browsers throttle timers in
  // background tabs and stop them outright when a phone sleeps, so a POS left
  // on a counter overnight wakes with an expired token and a refresh that never
  // ran -- which is why an expired session meant signing in by hand.
  //
  // Coming back to the foreground restarts the timer and forces an immediate
  // check, so the session recovers on its own before anyone taps anything.
  const onVisibility = () => {
    if (document.visibilityState === 'visible') {
      supabase.auth.startAutoRefresh()
      // getSession refreshes when the token is expired or close to it.
      void supabase.auth.getSession().then(({ data }) => {
        useAuth.getState().setSession(data.session)
      })
    } else {
      // Nothing useful happens while hidden, and the timer would be throttled
      // into uselessness anyway.
      supabase.auth.stopAutoRefresh()
    }
  }

  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('online', onVisibility)
  onVisibility()

  const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
    const store = useAuth.getState()

    // A genuine sign-in clears any remembered check first -- it may belong to
    // whoever used this device before. A token refresh is not a sign-in and
    // must leave it alone, or the session would drop to the passkey screen
    // every hour when the token rotates.
    if (event === 'SIGNED_IN' && session?.user?.id) {
      const remembered = passkeyStillValid(session.user.id)
      if (!remembered) forgetPasskey()
    }
    if (event === 'SIGNED_OUT') forgetPasskey()

    // TOKEN_REFRESHED carries a new access token for the same person. It must
    // update the session and change nothing else -- treating it as a sign-in
    // would drop the till to the passkey screen every hour.
    store.setSession(session)
  })

  return () => {
    document.removeEventListener('visibilitychange', onVisibility)
    window.removeEventListener('online', onVisibility)
    sub.subscription.unsubscribe()
  }
}
