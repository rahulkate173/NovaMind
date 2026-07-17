import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy /api/tutor and /api/doubt to the Express backend (port 3000)
      '/api/tutor': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/api/doubt': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // Proxy dashboard task/quiz cache to Express backend (port 3000)
      '/api/dashboard': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // Proxy remaining /api/* and /health to the FastAPI backend (port 8000)
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // Proxy /auth/google* and /auth/me to Express backend (port 3000)
      '/auth/google': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/auth/me': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
