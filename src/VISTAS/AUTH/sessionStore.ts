/* Mantiene la sesión autenticada únicamente en memoria y la sincroniza mediante cookies HttpOnly. */
import { API_URL } from '../../config/api';

export interface SessionUser {
  id?: number | string;
  name: string;
  email?: string;
  tipoUsuario?: number;
  tipo_usuario?: number;
  rol?: number;
  racha?: number;
  puntos?: number;
  nombre?: string;
  codigoAcceso?: string;
  vidas?: number;
}

export interface SessionStreakInfo {
  racha: number;
  rachaUltimaFecha: string | null;
  rachaHoyIngresada: boolean;
}

export interface AuthSessionResponse {
  user: SessionUser;
  streak: SessionStreakInfo;
}

const LEGACY_AUTH_KEYS = [
  'usuario',
  'user',
  'token',
  'asistodo_guest_economy',
] as const;

let currentUser: SessionUser | null = null;
let inFlightSession: Promise<AuthSessionResponse | null> | null = null;
const listeners = new Set<(user: SessionUser | null) => void>();

/** Elimina restos heredados de sesión o economía simulada en el almacenamiento local del navegador. */
export function clearLegacyAuthStorage(): void {
  for (const key of LEGACY_AUTH_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {}
    try {
      sessionStorage.removeItem(key);
    } catch {}
  }
}

/** Devuelve el usuario autenticado actual en memoria, o null si está en modo invitado. */
export function getSessionUser(): SessionUser | null {
  return currentUser;
}

/** Actualiza el usuario autenticado en memoria y notifica a los suscriptores de UI. */
export function setSessionUser(user: SessionUser | null): void {
  currentUser = user;
  listeners.forEach((listener) => {
    try {
      listener(currentUser);
    } catch {}
  });
}

/** Suscribe un componente al estado de sesión en memoria y devuelve la función para desuscribirse. */
export function subscribeSessionUser(listener: (user: SessionUser | null) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Consulta GET /api/auth/session enviando la cookie HttpOnly para hidratar la sesión y la racha diaria.
 * Deduplica llamadas simultáneas y limpia la sesión en memoria si la cookie no existe o expiró (401/403).
 */
export async function fetchAuthSession(): Promise<AuthSessionResponse | null> {
  if (inFlightSession) return inFlightSession;

  inFlightSession = (async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/session`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setSessionUser(null);
        }
        return null;
      }

      const data = await res.json().catch(() => null);
      if (!data?.authenticated || !data?.user || typeof data.user !== 'object') {
        setSessionUser(null);
        return null;
      }

      const user = data.user as SessionUser;
      setSessionUser(user);
      return {
        user,
        streak: {
          racha: typeof data.racha === 'number' ? data.racha : 0,
          rachaUltimaFecha: typeof data.racha_ultima_fecha === 'string' ? data.racha_ultima_fecha : null,
          rachaHoyIngresada: Boolean(data.racha_hoy_ingresada),
        },
      };
    } catch {
      return null;
    } finally {
      inFlightSession = null;
    }
  })();

  return inFlightSession;
}

/** Cierra la sesión en el servidor (borra cookie HttpOnly) y limpia la identidad en memoria. */
export async function logoutAuthSession(): Promise<void> {
  try {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // Aun sin red, limpiamos el estado local en memoria para permitir cambiar de cuenta.
  }
  clearLegacyAuthStorage();
  setSessionUser(null);
}
