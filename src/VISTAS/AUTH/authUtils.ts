/* Ayuda a leer, guardar y limpiar las sesiones de administración en memoria (sin localStorage). */
import {
  clearLegacyAuthStorage,
  getSessionUser,
  setSessionUser,
  type SessionUser,
} from './sessionStore';

export interface AdminSession {
  user: string;
  email: string;
  tipoUsuario: number;
}

/**
 * Obtiene la sesión de administrador desde la sesión activa en memoria.
 */
export function obtenerSesionAdmin(): AdminSession | null {
  const user = getSessionUser();
  if (!user) return null;

  const tipo = Number(user.tipoUsuario ?? user.tipo_usuario ?? user.rol ?? 1);
  if (tipo !== 2) return null;

  return {
    user: String(user.name || user.nombre || 'Administrador'),
    email: String(user.email || ''),
    tipoUsuario: 2,
  };
}

/**
 * Verifica de forma síncrona si el usuario actual es administrador (rol 2).
 */
export function esUsuarioAdmin(): boolean {
  return obtenerSesionAdmin() !== null;
}

/**
 * Guarda la sesión de administrador únicamente en memoria (el token viaja en cookie HttpOnly).
 */
export function guardarSesionAdmin(user: SessionUser): void {
  clearLegacyAuthStorage();
  setSessionUser({
    ...user,
    tipoUsuario: 2,
  });
}

/**
 * Limpia completamente la sesión en memoria y elimina claves heredadas de almacenamiento local.
 */
export function limpiarTodasLasSesiones(): void {
  clearLegacyAuthStorage();
  setSessionUser(null);
}
