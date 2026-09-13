import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getMessaging, isSupported, type Messaging } from 'firebase/messaging'

/** Firebase, for push notifications only.
 *
 * Not for auth and not for data -- Supabase owns identity and Postgres owns
 * the data. The previous POS used Firebase for sign-in and Firestore for
 * accessories; both are gone. This is the messaging SDK and nothing else.
 *
 * Every value here is public: a Firebase web config is designed to ship in a
 * bundle, and access is controlled by the project's rules and by the server,
 * not by hiding these.
 */
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

let app: FirebaseApp | null = null
let messaging: Messaging | null = null

export function pushConfigured(): boolean {
  return Boolean(config.projectId && config.apiKey && import.meta.env.VITE_FIREBASE_VAPID_KEY)
}

/** The messaging instance, or null where push cannot work.
 *
 * isSupported() matters: Safari on iOS only supports web push for an installed
 * home-screen app, and calling getMessaging() unsupported throws rather than
 * returning null. A till on an unsupported browser should lose notifications,
 * not the whole app.
 */
export async function getMessagingIfSupported(): Promise<Messaging | null> {
  if (!pushConfigured()) return null
  if (messaging) return messaging
  try {
    if (!(await isSupported())) return null
    app = app ?? initializeApp(config)
    messaging = getMessaging(app)
    return messaging
  } catch {
    return null
  }
}
