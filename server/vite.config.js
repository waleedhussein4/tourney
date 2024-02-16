import { defineConfig } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'

const root = resolve(__dirname, 'src')
const outDir = resolve(__dirname, 'dist')

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve('index.html'),
        team: resolve('team/index.html'),
        tournament: resolve('tournament/index.html'),
        tournaments: resolve('tournaments/index.html'),
        host: resolve('host/index.html'),
        signin: resolve('signin/index.html'),
        signup: resolve('signup/index.html')
      }
    }
  }
})
