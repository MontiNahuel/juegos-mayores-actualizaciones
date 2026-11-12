/* Configura cómo se sirve y compila la aplicación con sus recursos. */
/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { qrcode } from 'vite-plugin-qrcode'
import { defineConfig, loadEnv } from 'vite'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'

// Invalida la caché persistente al cambiar las ilustraciones, sin depender de recordar una versión manual.
const revisionAssets = createHash('sha256')
// Recorre los recursos para calcular la revisión que invalida la caché de imágenes.
function incluirAssets(directorio: string) {
  if (!existsSync(directorio)) return
  for (const nombre of readdirSync(directorio).sort()) {
    const archivo = `${directorio}/${nombre}`
    if (statSync(archivo).isDirectory()) incluirAssets(archivo)
    else revisionAssets.update(archivo).update(readFileSync(archivo))
  }
}
incluirAssets('public/assets')
incluirAssets('src/assets')

// https://vitejs.dev/config/
export default defineConfig(/* Completa este paso con los datos recibidos por la operación. */ ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.VITE_BACKEND_URL || env.VITE_API_URL || 'http://localhost:8080'
  const narrativeBackendUrl = env.VITE_NARRATIVE_BACKEND_URL || backendUrl

  return {
    define: {
      __ASSET_CACHE_REVISION__: JSON.stringify(revisionAssets.digest('hex').slice(0, 12)),
    },
    plugins: [
      react(),
      tailwindcss(),
      legacy(),
      qrcode(),
    ],
    server: {
      port: 5174,
      host: true,
      allowedHosts: true,
      proxy: {
        '/api/narrative': {
          target: narrativeBackendUrl,
          changeOrigin: true,
        },
        '/api/auth/guest-credential': {
          target: narrativeBackendUrl,
          changeOrigin: true,
        },
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
        '^/admin(?:/|\\?|$)': {
          target: backendUrl,
          changeOrigin: true,
          // Deja que Vite atienda los archivos del panel sin enviarlos al servidor.
          bypass: (req) => {
            if (req.url && (req.url.startsWith('/admin_src') || req.url.includes('admin_src'))) {
              return req.url;
            }
          },
        },
        '/auth': {
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
          target: narrativeBackendUrl,
          changeOrigin: true,
          // Shared local artwork also serves menu previews without a running backend.
          bypass: (req) => {
            const assetPath = req.url?.split('?')[0];
            if (assetPath && existsSync(`public${assetPath}`)) return req.url;
          },
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
    },
  }
})
