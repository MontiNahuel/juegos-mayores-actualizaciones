// Cambiar esta URL actualiza todas las conexiones con el backend.
// Por defecto apunta a producción, pero permite override mediante variable de entorno VITE_API_URL.
export const API_URL = (import.meta as any).env?.VITE_API_URL?.replace(/\/+$/, '') || 'https://cognijuegos.asistodo.com.ar';
