import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { toast } from 'sonner'

/** How often to ask whether a new build exists.
 *
 * A PWA on a counter is opened in the morning and never navigated again, so
 * the service worker's own check -- which happens on navigation -- never
 * fires. Without this, a deploy reached the shop whenever someone happened to
 * force-close the app, which could be days.
 *
 * A minute is cheap: the request is conditional and answers 304 almost always.
 */
const CHECK_INTERVAL_MS = 60_000

let currentRegistration: ServiceWorkerRegistration | null = null

/** Ask the browser to check for a new deployed build right now.
 *
 * Exported standalone, not returned from the hook, so a refresh button
 * anywhere in the tree can trigger a check without needing this module's
 * internal state passed down to it. */
export function checkForUpdate() {
  if (currentRegistration && navigator.onLine) void currentRegistration.update()
}

export function useAppUpdate() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return
      currentRegistration = registration

      // On a phone the PWA is opened for a minute and force-closed, not left
      // running -- so the periodic interval below rarely got the chance to
      // fire even once before the app was gone again, and a deploy could sit
      // unnoticed for days with nothing on screen to say code had changed.
      // Checking immediately on registration, and again whenever the app is
      // brought back to the foreground, catches it the moment someone
      // actually has the app open, rather than waiting on a timer that a
      // short-lived tab may never survive to see fire.
      if (navigator.onLine) void registration.update()
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && navigator.onLine) {
          void registration.update()
        }
      })

      setInterval(() => {
        // Skipped while offline: update() on a dead connection just logs an
        // error every minute and achieves nothing.
        if (navigator.onLine) void registration.update()
      }, CHECK_INTERVAL_MS)
    },
  })

  useEffect(() => {
    if (!needRefresh) return
    toast('A new version of the app is available', {
      description: 'Reload to update.',
      duration: Infinity,
      action: {
        label: 'Reload',
        onClick: () => {
          // Let updateServiceWorker do the reload: it waits for the new worker
          // to actually take control first. Reloading on a short timer instead
          // races that handover and can cut it short, leaving the same worker
          // waiting and the same prompt on the next load -- a loop.
          //
          // The fallback is generous and exists only for the case where no
          // worker was waiting, so nothing would have happened at all.
          void updateServiceWorker(true)
          window.setTimeout(() => {
            if (!document.hidden) window.location.reload()
          }, 5000)
        },
      },
      onDismiss: () => setNeedRefresh(false),
    })
  }, [needRefresh, setNeedRefresh, updateServiceWorker])
}
