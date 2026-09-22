import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { CONTACT_EMAIL } from '../server/src/config/plans.js'

// Fills the `%CONTACT_EMAIL%` placeholder in index.html's noscript block at
// build time, reading the address from the one file allowed to name it
// (server/src/config/plans.js — see scripts/check-regressions.sh) instead of
// hardcoding it into a tracked file.
const injectContactEmail = {
  name: 'inject-contact-email',
  transformIndexHtml: (html) => html.replace(/%CONTACT_EMAIL%/g, CONTACT_EMAIL),
}

// The client always talks to a relative `/api` path. In development Vite proxies
// that to the local API server; in production the client and API are same-origin
// on the same Cloudflare Worker. Result: no CORS anywhere.
export default defineConfig({
  plugins: [react(), injectContactEmail],
  build: {
    rollupOptions: {
      output: {
        // Sentry and React Query are large and rarely change alongside the app
        // code that imports them — splitting them out keeps the main chunk
        // small and lets browsers cache them independently of app updates.
        manualChunks: {
          sentry: ['@sentry/react'],
          'react-query': ['@tanstack/react-query'],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_TARGET || 'http://localhost:2000',
        changeOrigin: true,
      },
    },
  },
  // `vite preview` serves the built bundle, which is the only way to exercise
  // the split chunks locally — the dev server does not produce them. It needs
  // the same proxy, or the built client has no API to talk to.
  preview: {
    port: 4173,
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_TARGET || 'http://localhost:2000',
        changeOrigin: true,
      },
    },
  },
})
