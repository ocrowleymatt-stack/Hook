import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/queue': 'http://localhost:3001',
      '/job': 'http://localhost:3001',
      '/system': 'http://localhost:3001'
    }
  }
})
