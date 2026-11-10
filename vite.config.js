import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Firebase SDK apna alag lazy chunk hai (~514 kB min, ~155 kB gzip).
    chunkSizeWarningLimit: 600,
  },
})
