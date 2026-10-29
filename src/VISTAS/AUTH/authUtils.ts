export const OPERADOR_STORAGE_KEY = 'asistodo_operador_session';

export interface AdminSession {
  user: string;
  email: string;
  token: string;
  tipoUsuario: number;
}

/**
 * Decodifica de forma segura el payload de un token JWT.
 */
export function decodificarJWT(token: string): any | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const partes = token.split('.');
    if (partes.length !== 3) return null;
    const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonStr);
  } catch {
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64));
    } catch {
      return null;
    }
  }
}

/**
 * Obtiene la sesión de administrador si existe y es válida.
 */
export function obtenerSesionAdmin(): AdminSession | null {
  try {
    // 1. Revisar sesión en asistodo_operador_session
    const sesionRaw =
      localStorage.getItem(OPERADOR_STORAGE_KEY) ||
      sessionStorage.getItem(OPERADOR_STORAGE_KEY);
    if (sesionRaw) {
      try {
        const parsed = JSON.parse(sesionRaw);
        const tipo = Number(parsed.tipoUsuario ?? parsed.tipo_usuario ?? parsed.rol);
        const token = parsed.token;
        if (tipo === 2 && token && typeof token === 'string') {
          const payload = decodificarJWT(token);
          if (!payload || !payload.exp || payload.exp * 1000 > Date.now()) {
            return {
              user: parsed.user || payload?.name || 'Administrador',
              email: parsed.email || payload?.email || '',
              token,
              tipoUsuario: 2,
            };
          }
        }
      } catch {}
    }

    // 2. Revisar sesión en usuario/user y token de CogniJuegos
    const userRaw = localStorage.getItem('usuario') || localStorage.getItem('user');
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    let tipoUser = 1;
    let nombre = 'Administrador';
    let email = '';

    if (userRaw) {
      try {
        const u = JSON.parse(userRaw);
        tipoUser = Number(u.tipoUsuario ?? u.tipo_usuario ?? u.rol ?? 1);
        nombre = u.name || u.nombre || nombre;
        email = u.email || '';
      } catch {}
    }

    let tipoToken = 0;
    if (token && typeof token === 'string') {
      const payload = decodificarJWT(token);
      if (payload) {
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          // Token expirado
          return null;
        }
        tipoToken = Number(payload.tipoUsuario ?? payload.tipo_usuario ?? payload.rol ?? 0);
        nombre = payload.name || nombre;
        email = payload.email || email;
      }
    }

    if (tipoUser === 2 || tipoToken === 2) {
      return {
        user: nombre,
        email: email,
        token: token || '',
        tipoUsuario: 2,
      };
    }
  } catch (err) {
    console.error('Error al verificar sesión de administración:', err);
  }
  return null;
}

/**
 * Verifica de forma síncrona si el usuario actual es administrador (rol 2).
 */
export function esUsuarioAdmin(): boolean {
  return obtenerSesionAdmin() !== null;
}

/**
 * Guarda la sesión de administrador tanto en el almacén de usuario como en asistodo_operador_session.
 */
export function guardarSesionAdmin(user: any, token: string): void {
  const sessionUser = {
    ...user,
    tipoUsuario: 2,
  };
  localStorage.setItem('usuario', JSON.stringify(sessionUser));
  localStorage.setItem('user', JSON.stringify(sessionUser));
  if (token) {
    localStorage.setItem('token', token);
  }

  const operadorSession: AdminSession = {
    user: user.name || user.email || 'Administrador',
    email: user.email || '',
    token: token || '',
    tipoUsuario: 2,
  };
  localStorage.setItem(OPERADOR_STORAGE_KEY, JSON.stringify(operadorSession));

  window.dispatchEvent(new Event('user_progress_updated'));
}

/**
 * Cierra completamente la sesión en el navegador.
 */
export function limpiarTodasLasSesiones(): void {
  localStorage.removeItem('usuario');
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  localStorage.removeItem(OPERADOR_STORAGE_KEY);
  sessionStorage.removeItem('token');
  sessionStorage.removeItem(OPERADOR_STORAGE_KEY);
  window.dispatchEvent(new Event('user_progress_updated'));
}

