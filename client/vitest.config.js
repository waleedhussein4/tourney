import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Separate from vite.config.js's build config: component tests run in jsdom,
// not the browser, and need a setup file for jest-dom matchers and MSW. Kept
// as its own file (rather than merged into vite.config.js) so the server
// suite's `vitest.config.js` and this one stay two independent, unambiguous
// entry points — `vitest run` picks up whichever config lives in the cwd it's
// invoked from.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.jsx'],
    css: false,
    restoreMocks: true,
  },
})
