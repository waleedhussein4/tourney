import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The client always talks to a relative `/api` path. In development Vite proxies
// that to the local API server; in production the client and API are same-origin
// on Vercel. Result: no CORS anywhere.
export default defineConfig({
  plugins: [react()],
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
