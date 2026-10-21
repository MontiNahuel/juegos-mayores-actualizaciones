// En producción detrás de Caddy (https://cognijuegos.asistodo.com.ar), VITE_API_URL=""
// hace que todas las peticiones usen rutas relativas (/api/*) hacia el mismo origen.
const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as unknown as { env?: Record<string, string> }).env : undefined;
export const API_URL: string = (metaEnv?.VITE_API_URL ?? '').replace(/\/+$/, '');

