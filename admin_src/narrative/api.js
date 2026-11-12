import { API_URL } from '../../src/config/api';
import { narrativeAdminHeaders } from '../../src/VISTAS/JUEGOS/NARRATIVO/narrativeAuth';

/** Transporte del editor de King's Court, compartido por sus pestañas. */
export function fetchNarrativeAdmin(path, options = {}) {
  const headers = new Headers(narrativeAdminHeaders());
  new Headers(options.headers).forEach((value, key) => headers.set(key, value));
  // No fijar Content-Type: el navegador añade el boundary de las imágenes multipart.
  return fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'same-origin',
    headers,
  });
}
