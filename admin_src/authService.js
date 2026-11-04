/* Núcleo único de sesión, SSO y autenticación del panel administrador. */

export const OPERADOR_STORAGE_KEY = 'asistodo_operador_session';

const RUTAS_CON_TOKEN = [
  '/api/narrative/admin',
  '/api/challenges/admin',
  '/api/economy',
  '/api/admin',
  '/usuario',
];

function almacenes() {
  return [localStorage, sessionStorage];
}

export function decodificarJWT(token) {
  try {
    if (!token || typeof token !== 'string') return null;
    const partes = token.split('.');
    if (partes.length !== 3) return null;
    const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function leerSesion() {
  for (const almacen of almacenes()) {
    try {
      const raw = almacen.getItem(OPERADOR_STORAGE_KEY);
      if (!raw) continue;
      const sesion = JSON.parse(raw);
      if (sesion && typeof sesion === 'object') return sesion;
    } catch {}
  }
  return null;
}

export function sesionValida(sesion) {
  if (!sesion) return false;
  const rol = Number(sesion.tipoUsuario ?? sesion.tipo_usuario ?? sesion.rol);
  const token = sesion.token;
  if (rol !== 2) return false;
  if (typeof token !== 'string' || token.split('.').length !== 3 || token.startsWith('op_local_')) {
    return false;
  }
  const payload = decodificarJWT(token);
  if (payload?.exp && payload.exp * 1000 <= Date.now()) return false;
  return true;
}

export function obtenerSesionValida() {
  const sesion = leerSesion();
  if (sesionValida(sesion)) return sesion;
  if (sesion) limpiarSesion();
  return null;
}

export function guardarSesion({ user, email, token }) {
  const sesion = {
    user: user || email || 'Administrador',
    email: email || '',
    token: token || '',
    tipoUsuario: 2,
    loginTime: new Date().toISOString(),
  };
  localStorage.setItem(OPERADOR_STORAGE_KEY, JSON.stringify(sesion));
  return sesion;
}

export function limpiarSesion() {
  try {
    localStorage.removeItem(OPERADOR_STORAGE_KEY);
    sessionStorage.removeItem(OPERADOR_STORAGE_KEY);
  } catch {}
}

export function getToken() {
  return obtenerSesionValida()?.token || '';
}

export function getAuthHeaders(extra = {}) {
  const headers = { 'Content-Type': 'application/json', ...extra };
  const token = getToken();
  if (token && !headers.Authorization) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function normalizarEmail(usuario) {
  const limpio = usuario.trim().toLowerCase();
  if (limpio.includes('@')) return limpio;
  return limpio === 'admin' ? 'admin@sistemas.com' : `${limpio}@sistemas.com`;
}

export async function loginSistemas(usuario, password) {
  const usuarioLimpio = (usuario || '').trim().toLowerCase();
  const passwordLimpio = (password || '').trim();
  if (!usuarioLimpio || !passwordLimpio) {
    throw new Error('Por favor completá todos los campos.');
  }

  limpiarSesion();

  const email = normalizarEmail(usuarioLimpio);
  const response = await fetch('/api/auth/login-sistemas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: passwordLimpio }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success || !data.token) {
    throw new Error(data.detail || data.message || 'Usuario o clave de operador incorrectos.');
  }

  const rol = Number(data.user?.tipoUsuario ?? data.user?.tipo_usuario);
  if (rol !== 2) {
    limpiarSesion();
    throw new Error('Acceso denegado: esta cuenta no posee rol de operador de sistemas.');
  }

  return guardarSesion({
    user: data.user?.name || data.user?.email || usuarioLimpio,
    email: data.user?.email || email,
    token: data.token,
  });
}

export async function canjearTicketSSO(ticket) {
  if (!ticket || typeof ticket !== 'string') {
    throw new Error('Ticket no proporcionado o inválido.');
  }

  const response = await fetch('/api/auth/sso/canjear-ticket', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticket: ticket.trim() }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success || !data.token) {
    throw new Error(data.detail || data.message || 'Error al canjear el ticket de acceso SSO.');
  }

  return guardarSesion({
    user: data.user?.name || data.user?.email || 'Administrador',
    email: data.user?.email || '',
    token: data.token,
  });
}

export async function solicitarTicketRetorno(servicioDestino = 'autenticador') {
  const token = getToken();
  if (!token) throw new Error('No hay sesión activa para solicitar retorno.');

  const response = await fetch('/api/auth/sso/crear-ticket-retorno', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ servicioDestino }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success || !data.ticket) {
    throw new Error(data.detail || data.message || 'Error al generar ticket de retorno.');
  }
  return data;
}

export function irAlMenuDeJuegos() {
  window.location.assign('/menu');
}

export function instalarInterceptorAdmin() {
  if (typeof window === 'undefined' || window.__adminFetchInstalado) return;
  window.__adminFetchInstalado = true;

  const fetchOriginal = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof Request
          ? input.url
          : String(input);

    if (RUTAS_CON_TOKEN.some((prefijo) => url.includes(prefijo))) {
      const token = getToken();
      if (token) {
        const headers = new Headers(init.headers || (input instanceof Request ? input.headers : {}));
        if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
        init = { ...init, headers };
      }
    }

    return fetchOriginal(input, init);
  };
}
