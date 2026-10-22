/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { qrcode } from 'vite-plugin-qrcode'
import { defineConfig } from 'vite'
import { API_URL } from './src/config/api.ts'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync } from 'node:fs'

// Invalida la caché persistente al cambiar las ilustraciones, sin depender de recordar una versión manual.
const revisionAssets = createHash('sha256')
function incluirAssets(directorio: string) {
  for (const nombre of readdirSync(directorio).sort()) {
    const archivo = `${directorio}/${nombre}`
    if (statSync(archivo).isDirectory()) incluirAssets(archivo)
    else revisionAssets.update(archivo).update(readFileSync(archivo))
  }
}
incluirAssets('public/assets')
incluirAssets('src/assets')

// https://vitejs.dev/config/
export default defineConfig({
  define: { __ASSET_CACHE_REVISION__: JSON.stringify(revisionAssets.digest('hex').slice(0, 12)) },
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
        target: API_URL,
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
