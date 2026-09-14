/* Firebase messaging service worker.
 *
 * Handles notifications that arrive while the POS is closed or in the
 * background. It is a separate worker from the PWA's own sw.js: Firebase
 * requires this exact filename at the site root, and the two do not conflict.
 *
 * Config is inlined rather than imported because a service worker cannot read
 * import.meta.env. These values are public by design -- a Firebase web config
 * ships in the bundle either way.
 */
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: '__FIREBASE_API_KEY__',
  authDomain: '__FIREBASE_AUTH_DOMAIN__',
  projectId: '__FIREBASE_PROJECT_ID__',
  storageBucket: '__FIREBASE_STORAGE_BUCKET__',
  messagingSenderId: '__FIREBASE_MESSAGING_SENDER_ID__',
  appId: '__FIREBASE_APP_ID__',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Alltech POS'
  self.registration.showNotification(title, {
    body: payload.notification?.body || '',
    icon: '/logo192.png',
    badge: '/logo192.png',
    // Same tag, so a second report replaces the first rather than stacking
    // three days of unread sales summaries on the lock screen.
    tag: payload.data?.kind || 'alltech',
    data: payload.data || {},
  })
  // The home-screen icon badge, not the small in-notification icon above --
  // a manager glancing at the phone should see something arrived without
  // having to open the notification shade. Feature-detected: iOS Safari has
  // no Badging API, and a report should not fail to notify over that.
  if ('setAppBadge' in self) self.setAppBadge().catch(() => {})
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if ('clearAppBadge' in self) self.clearAppBadge().catch(() => {})

  // Open the report itself, not just the app. A notification body is
  // truncated by the operating system, so tapping it has to lead somewhere
  // that shows the whole thing.
  const id = event.notification.data && event.notification.data.insight_id
  const target = id ? '/insights/' + id : '/insights'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          // Navigate the existing window rather than opening a second copy of
          // the POS beside the one already on the counter.
          if ('navigate' in client) client.navigate(target)
          return client.focus()
        }
      }
      return self.clients.openWindow(target)
    }),
  )
})
