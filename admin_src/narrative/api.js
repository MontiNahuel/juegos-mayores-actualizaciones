/* Transporta las peticiones del editor con la sesión del operador. */
import { API_URL } from '../../src/config/api';
const OPERATOR_KEY = 'asistodo_operador_session';

/** Recupera el token del operador cuando se accede a los catálogos administrativos. */
function narrativeAdminHeaders() {
  for (const storage of [localStorage, sessionStorage]) {
    try {
      const session = JSON.parse(storage.getItem(OPERATOR_KEY) || 'null');
      if (typeof session?.token === 'string' && session.token) {
        return { Authorization: `Bearer ${session.token}` };
      }
    } catch { /* Una sesión incompleta no constituye una credencial. */ }
  }
  return {};
}



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
