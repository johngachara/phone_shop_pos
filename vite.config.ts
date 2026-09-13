import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'
import fs from 'node:fs'

/** Substitute the Firebase config into the messaging service worker.
 *
 * A service worker cannot read import.meta.env, and Firebase requires this
 * file at a fixed path with the config inline. Keeping placeholders in the
 * source and filling them at build time means the values live in one place
 * (the environment) rather than being committed twice.
 *
 * Every value here is public: a Firebase web config ships in the bundle by
 * design, and push is authorised by the server, not by these.
 */
function firebaseServiceWorker(env: Record<string, string>): import('vite').Plugin {
  const fill = (source: string, env: Record<string, string | undefined>) =>
    source
      .replace('__FIREBASE_API_KEY__', env.VITE_FIREBASE_API_KEY ?? '')
      .replace('__FIREBASE_AUTH_DOMAIN__', env.VITE_FIREBASE_AUTH_DOMAIN ?? '')
      .replace('__FIREBASE_PROJECT_ID__', env.VITE_FIREBASE_PROJECT_ID ?? '')
      .replace('__FIREBASE_STORAGE_BUCKET__', env.VITE_FIREBASE_STORAGE_BUCKET ?? '')
      .replace('__FIREBASE_MESSAGING_SENDER_ID__', env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '')
      .replace('__FIREBASE_APP_ID__', env.VITE_FIREBASE_APP_ID ?? '')

  return {
    name: 'firebase-messaging-sw',
    apply: 'build',
    closeBundle() {
      const target = path.resolve(__dirname, 'build/firebase-messaging-sw.js')
      if (!fs.existsSync(target)) return
      fs.writeFileSync(target, fill(fs.readFileSync(target, 'utf8'), env))
      // Loud rather than silent: an unsubstituted worker registers fine and
      // then never delivers anything, which is close to impossible to debug
      // from the outside.
      if (fs.readFileSync(target, 'utf8').includes('__FIREBASE_')) {
        throw new Error('Firebase service worker still contains placeholders; VITE_FIREBASE_* are not set')
      }
    },
  }
}

// loadEnv, not process.env: Vite reads .env files into import.meta.env and does
// not put VITE_* on process.env, so reading process.env here silently produced
// an empty config and a worker that registered and delivered nothing.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    firebaseServiceWorker(env),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        // The API must never be served from the service worker: a cached
        // stock figure shown at the counter is worse than no figure at all.
        navigateFallbackDenylist: [/^\/api/],
      },
      manifest: {
        name: 'Alltech POS',
        short_name: 'Alltech',
        description: 'Point of sale for Alltech, Nyeri',
        // Android draws the splash from background_color and the icon, so
        // these have to match the app's own canvas or the launch flashes a
        // different colour before the first paint.
        theme_color: '#141821',
        background_color: '#141821',
        // Fullscreen, with standalone as the fallback for browsers that do not
        // honour it. On a counter this is the right trade: the phone's status
        // bar is not useful mid-sale, and leaving a strip of it above the app
        // makes the POS look like a web page someone bookmarked.
        display: 'fullscreen',
        display_override: ['fullscreen', 'standalone'],
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        categories: ['business', 'productivity'],
        icons: [
          { src: 'logo192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'logo512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          // Separate maskable entry with its own padding. Sharing one icon for
          // both means Android's circular crop shaves the mark's edges.
          { src: 'logo-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: { port: 3000 },
  build: { outDir: 'build' },
  }
})
