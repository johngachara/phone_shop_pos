import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
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
        description: 'Alltech Nyeri point of sale',
        theme_color: '#141110',
        background_color: '#141110',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'logo192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'logo512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: { port: 3000 },
  build: { outDir: 'build' },
})
