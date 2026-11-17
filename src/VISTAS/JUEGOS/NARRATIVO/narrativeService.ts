/* Consulta la API narrativa; conserva saldos confirmados y nunca ejecuta reglas de juego. */
import { API_URL } from '../../../config/api';
import { getSessionUser } from '../../AUTH/sessionStore';
import type { EstadoGrafoApi, EstadoPartida, HistorialPartidaApi, PersonajeApi, SetupPartida } from './narrativeTypes';

const GUEST_KEY = 'cognijuegos_narrative_guest_v1';
const NARRATIVE_GUEST_CREDENTIAL_PATH = '/api/auth/guest-credential';
interface GuestSession { credential: string; expiresAt: number }
let credencialPendiente: Promise<string> | null = null;
let invitadoEnMemoria: GuestSession | null = null;

/** Busca la credencial persistida y recurre a la memoria si el almacenamiento falla. */
function leerInvitado(): GuestSession | null {
  try {
    const value = JSON.parse(localStorage.getItem(GUEST_KEY) || 'null');
    if (typeof value?.credential === 'string' && typeof value.expiresAt === 'number') return value;
  } catch { /* Se puede seguir con una credencial en memoria si el storage no está disponible. */ }
  return invitadoEnMemoria;
}

/** Reutiliza o renueva la credencial y comparte una única solicitud entre llamadas simultáneas. */
async function obtenerCredencialInvitado(): Promise<string> {
  const previous = leerInvitado();
  if (previous?.credential && previous.expiresAt > Date.now() + 60_000) return previous.credential;
  if (credencialPendiente) return credencialPendiente;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  credencialPendiente = (async () => {
    const response = await fetch(`${API_URL}${NARRATIVE_GUEST_CREDENTIAL_PATH}`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: previous?.credential ? { 'x-guest-credential': previous.credential } : {},
      signal: controller.signal,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.detail || 'No se pudo obtener la credencial de invitado.');
    if (typeof data?.credential !== 'string' || !data.credential || !Number.isFinite(data.expires_in_days) || data.expires_in_days <= 0) {
      throw new Error('El servidor no devolvió una credencial de invitado válida.');
    }
    invitadoEnMemoria = { credential: data.credential, expiresAt: Date.now() + data.expires_in_days * 86_400_000 };
    try { localStorage.setItem(GUEST_KEY, JSON.stringify(invitadoEnMemoria)); } catch { /* La sesión en memoria sigue disponible. */ }
    return invitadoEnMemoria.credential;
  })();
  try { return await credencialPendiente; }
  finally { clearTimeout(timeout); credencialPendiente = null; }
}

// Envía un GET o POST autenticado; un fallo conserva la partida y permite recuperarla.
async function request<T>(path: string, date: string, datos?: object): Promise<T> {
  const headers: Record<string, string> = getSessionUser() ? {} : { 'x-guest-credential': await obtenerCredencialInvitado() };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const query = datos ? '' : `?date=${encodeURIComponent(date)}`;
    const response = await fetch(`${API_URL}/api/narrative/${path}${query}`, {
      method: datos ? 'POST' : 'GET', credentials: 'include', signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: datos ? JSON.stringify({ date, ...datos }) : undefined,
    });
    // Un proxy puede devolver HTML en un error: conservamos el código HTTP legible.
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.detail || `Error ${response.status}.`);
    }
    return await response.json() as T;
  } finally { clearTimeout(timeout); }
}

// Obtiene personajes, cartas y recursos de preparación del desafío.
export const obtenerSetup = (date: string) => request<SetupPartida>('partida/setup', date);
// Restaura la respuesta del servidor sin convertirla en otro modelo de partida.
export const obtenerEstadoPartida = (date: string) => request<EstadoPartida>('v2/partida/estado', date);
// Recupera los personajes y afinidades de la corte guardada.
export const obtenerCortePartida = (date: string) => request<{ corte: { personaje: PersonajeApi; afinidad?: number }[]; afinidad?: Record<string, number> }>('partida/corte', date);
// Reinicia la prueba en el servidor.
export const reiniciarPartida = (date: string) => request('partida/reiniciar', date, {});
// Confirma la selección inicial y recibe el primer draft.
export const iniciarPartida = (date: string, corte: string[], cartas: string[]) =>
  request<EstadoPartida>('v2/partida/iniciar', date, { corte_elegida_ids: corte, cartas_iniciales_ids: cartas });
// Confirma la carta mensual y recibe la escena siguiente.
export const elegirCartaMensual = (date: string, carta_id: string) =>
  request<EstadoPartida>('v2/partida/elegir-carta-mes', date, { carta_id });

// Envía una opción y consulta los saldos sólo cuando el grafo final no los incluye.
export async function avanzarNodo(date: string, opcion_id: string, grafoAnterior: string): Promise<EstadoPartida> {
  const grafo = await request<EstadoGrafoApi>('v2/partida/avanzar-nodo', date, { opcion_id });
  if (grafo.grafo_id !== grafoAnterior) return obtenerEstadoPartida(date);
  // Los impactos explican el resultado. No permiten reconstruir ni sumar el saldo.
  const faltanRecursos = grafo.nodo_actual.es_final && grafo.nodo_actual.impactos_recursos.length > 0 && !grafo.recursos;
  const faltaAfinidad = grafo.nodo_actual.es_final && grafo.nodo_actual.impactos_afinidad.length > 0 && !grafo.afinidad;
  const estado = faltanRecursos || faltaAfinidad ? await obtenerEstadoPartida(date) : {};
  if ((faltanRecursos && !estado.recursos) || (faltaAfinidad && !estado.afinidad))
    throw new Error('El servidor no confirmó el estado después de la decisión.');
  return { ...estado, grafo_actual: grafo, fase_actual: grafo.fase_actual, status: grafo.status,
    recursos: grafo.recursos ?? estado.recursos, afinidad: grafo.afinidad ?? estado.afinidad,
    finalizacion: grafo.finalizacion ?? estado.finalizacion,
    conversacion_actual: grafo.conversacion_actual ?? estado.conversacion_actual };
}

// Continúa una escena pendiente sin volver a presentar el desenlace que ya se leyó.
function sinResultadoLeido(estado: EstadoPartida): EstadoPartida {
  return { ...estado, resultado_actual: null,
    grafo_actual: estado.grafo_actual?.nodo_actual.es_final ? null : estado.grafo_actual };
}

// Sólo avanza el mes desde BALANCE_MES; tras un timeout consulta antes de permitir otro intento.
export async function continuarTurno(date: string): Promise<EstadoPartida> {
  const estado = await obtenerEstadoPartida(date);
  if (estado.finalizacion || estado.grafo_actual?.finalizacion) return estado;
  if (estado.fase_actual?.toUpperCase() !== 'BALANCE_MES') return sinResultadoLeido(estado);
  try { return await request<EstadoPartida>('v2/partida/avanzar-mes', date, {}); }
  catch (error) {
    try {
      const actual = await obtenerEstadoPartida(date);
      if (actual.mes_actual !== estado.mes_actual || actual.fase_actual !== estado.fase_actual || actual.finalizacion)
        return actual.fase_actual?.toUpperCase() === 'BALANCE_MES' ? actual : sinResultadoLeido(actual);
    } catch { /* Conserva el error original si tampoco puede recuperar el estado. */ }
    throw error;
  }
}

// Reúne la crónica confirmada, sin descargar catálogos del editor administrativo.
export async function obtenerEstadisticasPartida(date: string) {
  const [estado, historial, corte] = await Promise.all([
    obtenerEstadoPartida(date), request<HistorialPartidaApi>('partida/historial', date), obtenerCortePartida(date),
  ]);
  return { estado, historial, corte };
}
