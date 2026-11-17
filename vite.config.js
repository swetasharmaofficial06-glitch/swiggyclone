import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * PWA + web build config.
 *
 * - PWA: manifest + service worker (auto-update) + offline app shell.
 * - Images ko precache nahi karte (8 MB+ hain) — runtime `StaleWhileRevalidate`
 *   se cache hote hain, isliye pehla load fast rehta hai.
 * - Service worker registration `src/main.jsx` mein hai, taaki Capacitor
 *   native shell mein register na ho (double-cache issue).
 */
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'Foodie Hub — Order Food Online',
        short_name: 'Foodie Hub',
        description:
          'Apne favourite restaurants se food order karo — live tracking, coupons aur saved addresses ke saath.',
        lang: 'en-IN',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        theme_color: '#fc8019',
        background_color: '#0e1014',
        categories: ['food', 'shopping', 'lifestyle'],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          { name: 'My Orders', short_name: 'Orders', url: '/orders' },
          { name: 'Saved Addresses', short_name: 'Addresses', url: '/addresses' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        navigateFallback: '/index.html',
        // Firebase Auth handler aur domain verification files ko SPA fallback se bachao.
        navigateFallbackDenylist: [/^\/__\//, /^\/\.well-known\//],
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'foodiehub-images',
              expiration: {
                maxEntries: 150,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  build: {
    // Firebase SDK apna alag lazy chunk hai (~650 kB min, ~195 kB gzip).
    chunkSizeWarningLimit: 700,
  },
})
