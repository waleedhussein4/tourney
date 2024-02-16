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
        team: resolve(root, 'pages/team/team.html'),
        tournament: resolve(root, 'pages/tournament/tournament.html'),
        tournaments: resolve(root, 'pages/tournaments/tournaments.html'),
        host: resolve(root, 'pages/host/host.html'),
        signin: resolve(root, 'pages/signin/signin.html'),
        signup: resolve(root, 'pages/signup/signup.html')
      }
    }
  }
})
