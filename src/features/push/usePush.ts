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
export function usePush() {
  const role = useAuth((s) => s.role)
  const session = useAuth((s) => s.session)
  const [state, setState] = useState<PushState>('default')

  const eligible = role === 'manager' && pushConfigured()

  useEffect(() => {
    if (!eligible) { setState('unsupported'); return }
    if (typeof Notification === 'undefined') { setState('unsupported'); return }
    setState(Notification.permission as PushState)
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

      // Firebase needs its own worker, registered explicitly. Left to itself it
      // looks for /firebase-messaging-sw.js at the root and silently fails if
      // the PWA's own worker got there first.
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')

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
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        })
        if (token && !cancelled) {
          await api('/api/push/register/', { method: 'POST', json: { token } })
        }
      } catch {
        // Silent on purpose: this runs on every load and a transient failure
        // is not something to interrupt a sale with.
      }
    })()
    return () => { cancelled = true }
  }, [eligible, session])

  // Foreground messages do not raise a system notification, so nothing would
  // appear at all while the POS is the active tab.
  useEffect(() => {
    if (!eligible) return
    let unsubscribe: (() => void) | undefined
    ;(async () => {
      const messaging = await getMessagingIfSupported()
      if (!messaging) return
      unsubscribe = onMessage(messaging, (payload) => {
        const id = payload.data?.insight_id
        toast(payload.notification?.title ?? 'Alltech POS', {
          description: payload.notification?.body,
          duration: 10_000,
          action: id
            ? { label: 'Open', onClick: () => { window.location.href = `/insights/${id}` } }
            : undefined,
        })
      })
    })()
    return () => unsubscribe?.()
  }, [eligible])

  return { state, register, eligible }
}
