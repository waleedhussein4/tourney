import { defineConfig } from 'vite'
import { resolve } from 'path'
import path from 'path'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname("./src")

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        team: resolve(__dirname, 'pages/team/team.html'),
        tournament: resolve(__dirname, 'pages/tournament/tournament.html'),
        tournaments: resolve(__dirname, 'pages/tournaments/tournaments.html')
      }
    }
  }
})
