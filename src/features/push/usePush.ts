import { useCallback, useEffect, useState } from 'react'
import { getToken, onMessage } from 'firebase/messaging'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { getMessagingIfSupported, pushConfigured } from '@/lib/firebase'
import { useAuth } from '@/features/auth/useAuth'

export type PushState = 'unsupported' | 'default' | 'granted' | 'denied' | 'registering'

/** Push notification registration.
 *
 * Only managers receive anything -- the reports are revenue and profit -- so
 * the control is only offered to them. The server filters by role as well;
 * this just avoids asking someone to enable notifications they will never get.
 */
/** Firebase's worker gets its own scope.
 *
 * Registered at '/' it competes with the PWA's own service worker, which also
 * claims '/'. The later registration takes control and the PWA's updated
 * worker is left permanently "waiting" -- so the app asks to reload, reloads,
 * finds the same waiting worker, and asks again. That is the loop.
 *
 * This is the scope the Firebase SDK uses when it registers the worker itself,
 * so it is also what Firebase expects to find.
 */
const FCM_SCOPE = '/firebase-cloud-messaging-push-scope'

async function registerMessagingWorker(): Promise<ServiceWorkerRegistration> {
  await removeRootScopedMessagingWorker()
  return navigator.serviceWorker.register('/firebase-messaging-sw.js', {
    scope: FCM_SCOPE,
  })
}

/** Remove a messaging worker previously registered at the root scope.
 *
 * A service worker registration outlives the code that created it, so devices
 * that already registered this worker at '/' keep that registration after a
 * deploy and stay stuck in the reload loop. Shipping the scope fix alone would
 * only help devices that had never installed it.
 */
async function removeRootScopedMessagingWorker(): Promise<void> {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(
      registrations
        .filter((r) => {
          const script = r.active?.scriptURL ?? r.installing?.scriptURL ?? r.waiting?.scriptURL ?? ''
          if (!script.includes('firebase-messaging-sw.js')) return false
          // Only the wrongly-scoped one. The correctly-scoped registration is
          // the one being kept.
          return !r.scope.includes('firebase-cloud-messaging-push-scope')
        })
        .map((r) => r.unregister()),
    )
  } catch {
    // Not being able to tidy up is not a reason to fail registration.
  }
}

export function usePush() {
  const role = useAuth((s) => s.role)
  const session = useAuth((s) => s.session)
  const [state, setState] = useState<PushState>('default')

  const eligible = role === 'manager' && pushConfigured()

  // Unconditionally, and before anything else: a device stuck in the reload
  // loop may not be a manager, may have push unconfigured, and still has the
  // wrongly-scoped worker holding the PWA's update hostage.
  useEffect(() => {
    if ('serviceWorker' in navigator) void removeRootScopedMessagingWorker()
  }, [])

  useEffect(() => {
    if (!eligible) { setState('unsupported'); return }
    if (typeof Notification === 'undefined') { setState('unsupported'); return }
    // Browser permission being "granted" only means this device was allowed
    // to ask before -- not that the backend has a current token for it. That
    // distinction was missing entirely: this used to set 'granted' straight
    // from Notification.permission, so a device showed "Notifications are on"
    // whenever permission had ever been granted, even on a load where the
    // silent re-registration below never reached the server (nothing was
    // registered, nothing was delivered, and there was no sign of it in the
    // UI). Registered/confirmed is now only set once that call succeeds.
    if (Notification.permission === 'granted') {
      setState('registering')
    } else {
      setState(Notification.permission as PushState)
    }
  }, [eligible])

  const register = useCallback(async () => {
    if (!eligible) return
    setState('registering')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState(permission as PushState)
        // A denial is sticky: the browser will not ask again, and only the
        // person can undo it in site settings. Say so rather than letting them
        // tap a button that silently does nothing.
        if (permission === 'denied') {
          toast.error('Notifications are blocked. Allow them in your browser settings for this site.')
        }
        return
      }

      const messaging = await getMessagingIfSupported()
      if (!messaging) { setState('unsupported'); return }

      const registration = await registerMessagingWorker()

      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration,
      })
      if (!token) { setState('default'); return }

      await api('/api/push/register/', { method: 'POST', json: { token } })
      setState('granted')
      toast.success('Notifications on for this device')
    } catch (error) {
      setState('default')
      toast.error(error instanceof Error ? error.message : 'Could not turn on notifications')
    }
  }, [eligible])

  // Re-register silently when permission is already granted. The FCM token
  // rotates, and a stale one is not an error anywhere -- the push simply never
  // arrives, which is the worst way for this to fail.
  useEffect(() => {
    if (!eligible || !session) return
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return

    let cancelled = false
    ;(async () => {
      try {
        const messaging = await getMessagingIfSupported()
        if (!messaging || cancelled) return
        const registration = await registerMessagingWorker()
        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        })
        if (token && !cancelled) {
          await api('/api/push/register/', { method: 'POST', json: { token } })
          if (!cancelled) setState('granted')
          return
        }
        // No token and no exception: the state above was left at
        // 'registering' pending this, and needs to resolve either way, or the
        // "Turn on notifications" button never comes back for someone to
        // retry -- the UI would just sit forever implying it was still
        // working.
        if (!cancelled) setState('default')
      } catch {
        // Silent on purpose: this runs on every load and a transient failure
        // is not something to interrupt a sale with. But it still has to
        // resolve out of 'registering', or a failure here looked identical to
        // one still in progress and the retry button never reappeared.
        if (!cancelled) setState('default')
      }
    })()
    return () => { cancelled = true }
  }, [eligible, session])

  // Foreground messages do not raise a system notification on their own --
  // FCM only does that for a message that arrives while the tab is closed or
  // backgrounded. This raises the same real notification (and app badge) for
  // a report that lands while the POS happens to be open, through the same
  // service worker and the same notificationclick handler that background
  // messages use, rather than a separate in-app toast that would double up
  // with it and behave differently (no tray entry, no badge, nothing to tap
  // from outside the app).
  useEffect(() => {
    if (!eligible) return
    let unsubscribe: (() => void) | undefined
    ;(async () => {
      const messaging = await getMessagingIfSupported()
      if (!messaging) return
      unsubscribe = onMessage(messaging, (payload) => {
        const title = payload.notification?.title ?? 'Alltech POS'
        const body = payload.notification?.body

        void (async () => {
          try {
            const registration = await navigator.serviceWorker.getRegistration(FCM_SCOPE)
            await registration?.showNotification(title, {
              body,
              icon: '/logo192.png',
              badge: '/logo192.png',
              tag: payload.data?.kind || 'alltech',
              data: payload.data || {},
            })
            if ('setAppBadge' in navigator) await navigator.setAppBadge()
          } catch {
            // Nothing else surfaces this arrived -- there is no toast
            // fallback by design -- but a transient failure here still
            // should not throw past the SDK's own message handler.
          }
        })()
      })
    })()
    return () => unsubscribe?.()
  }, [eligible])

  return { state, register, eligible }
}
