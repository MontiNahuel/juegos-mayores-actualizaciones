/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { qrcode } from 'vite-plugin-qrcode'
import { defineConfig, loadEnv } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.VITE_BACKEND_URL || env.VITE_API_URL || 'http://localhost:8084'

  return {
    plugins: [
      react(),
      tailwindcss(),
      legacy(),
      qrcode()
    ],
    server: {
      port: 5174,
      host: true,
      allowedHosts: true,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/usuario': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/progreso': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/assets/narrative': {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
    }
  }
})
