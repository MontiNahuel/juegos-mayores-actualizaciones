/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { qrcode } from 'vite-plugin-qrcode'
import { defineConfig } from 'vite'
import { API_URL } from './src/config/api.ts'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    legacy(),
    qrcode()
  ],
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: API_URL || 'http://127.0.0.1:8087',
        changeOrigin: true,
      },
      '/assets/narrative': {
        target: API_URL || 'http://127.0.0.1:8087',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  }
})
