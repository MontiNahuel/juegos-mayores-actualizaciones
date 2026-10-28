// Cambiar esta URL o definir VITE_API_URL en .env actualiza todas las conexiones con el backend.
// Por defecto en entornos Web, una cadena vacía permite peticiones relativas (/api/...) transparentes a través del proxy de Vite.
export const API_URL = (import.meta as any).env?.VITE_API_URL?.replace(/\/+$/, '') || '';
