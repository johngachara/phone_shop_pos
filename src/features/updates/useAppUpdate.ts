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

export function useAppUpdate() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return
      setInterval(() => {
        // Skipped while offline: update() on a dead connection just logs an
        // error every minute and achieves nothing.
        if (navigator.onLine) void registration.update()
      }, CHECK_INTERVAL_MS)
    },
  })

  useEffect(() => {
    if (!needRefresh) return
    toast('A new version is ready', {
      description: 'Reload when you are between customers.',
      duration: Infinity,
      action: {
        label: 'Reload',
        onClick: () => { void updateServiceWorker(true) },
      },
      onDismiss: () => setNeedRefresh(false),
    })
  }, [needRefresh, setNeedRefresh, updateServiceWorker])
}
