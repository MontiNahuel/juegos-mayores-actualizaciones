import { API_URL } from '../../../config/api';
import { getSessionUser } from '../../AUTH/sessionStore';
import { NARRATIVE_GUEST_CREDENTIAL_PATH } from './narrativeEndpoints';

const GUEST_KEY = 'cognijuegos_narrative_guest_v1';
const OPERATOR_KEY = 'asistodo_operador_session';
interface GuestSession { credential: string; expiresAt: number }
let pendingGuest: Promise<string> | null = null;
let memoryGuest: GuestSession | null = null;

export class ErrorServidorNarrativo extends Error {
  constructor(public status: number, message: string) { super(message); }
}

function readStorage(storage: Storage, key: string): string | null {
  try { return storage.getItem(key); } catch { return null; }
}

export function narrativeAdminHeaders(): Record<string, string> {
  for (const storage of [localStorage, sessionStorage]) {
    try {
      const session = JSON.parse(readStorage(storage, OPERATOR_KEY) || 'null');
      if (typeof session?.token === 'string' && session.token) {
        return { Authorization: `Bearer ${session.token}` };
      }
    } catch { /* Una sesión incompleta no constituye una credencial. */ }
  }
  return {};
}

function savedGuest(): GuestSession | null {
  try {
    const value = JSON.parse(readStorage(localStorage, GUEST_KEY) || 'null');
    if (typeof value?.credential === 'string' && typeof value.expiresAt === 'number') return value;
  } catch { /* Se puede seguir con una credencial en memoria si el storage no está disponible. */ }
  return memoryGuest;
}

async function guestCredential(): Promise<string> {
  const previous = savedGuest();
  if (previous?.credential && previous.expiresAt > Date.now() + 60_000) return previous.credential;
  if (pendingGuest) return pendingGuest;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  pendingGuest = (async () => {
    const response = await fetch(`${API_URL}${NARRATIVE_GUEST_CREDENTIAL_PATH}`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: previous?.credential ? { 'x-guest-credential': previous.credential } : {},
      signal: controller.signal,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new ErrorServidorNarrativo(response.status, data?.detail || 'No se pudo obtener la credencial de invitado.');
    if (typeof data?.credential !== 'string' || !data.credential || !Number.isFinite(data.expires_in_days) || data.expires_in_days <= 0) {
      throw new Error('El servidor no devolvió una credencial de invitado válida.');
    }
    memoryGuest = { credential: data.credential, expiresAt: Date.now() + data.expires_in_days * 86_400_000 };
    try { localStorage.setItem(GUEST_KEY, JSON.stringify(memoryGuest)); } catch { /* La sesión en memoria sigue disponible. */ }
    return memoryGuest.credential;
  })();
  try { return await pendingGuest; }
  finally { clearTimeout(timeout); pendingGuest = null; }
}

export async function narrativeGameHeaders(): Promise<Record<string, string>> {
  // Si hay sesión autenticada en memoria, la cookie HttpOnly viaja en las peticiones.
  if (getSessionUser() !== null) return {};
  return { 'x-guest-credential': await guestCredential() };
}
