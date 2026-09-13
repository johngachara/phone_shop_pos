/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

/** Typed environment. Anything missing here is a build error rather than
 *  `undefined` at runtime, which for VITE_SUPABASE_URL would surface as an
 *  unexplained failure to sign in. */
interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_TURNSTILE_SITE_KEY: string
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_FIREBASE_VAPID_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
