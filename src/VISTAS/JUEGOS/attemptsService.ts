/* Guarda los avances por jugador y los sincroniza con el servidor cuando hay cuenta. */
/**
 * attemptsService.ts
 * Servicio centralizado para la persistencia de partidas (en tiempo real y resultado final).
 * 
 * Reglas de aislamiento de datos:
 * 1. Usuario con sesión iniciada: Guarda en localStorage con prefijo `_user_${uid}_` y sincroniza con el backend (MongoDB).
 * 2. Usuario sin cuenta (Invitado / Guest): Guarda exclusivamente en localStorage con prefijo `_guest_`.
 *    NUNCA llama al backend para no ensuciar la base de datos con partidas anónimas.
 *    Cuando en el futuro se implemente el registro (sign up), el progreso del invitado se volcará a la cuenta creada.
 *    Al iniciar sesión (login normal con código existente), NO se vuelca el progreso del invitado.
 */

import { API_URL } from '../../config/api';
const escrituras = new Map<string, Promise<unknown>>();
// Guarda en orden con los datos de este paso.
function guardarEnOrden(clave: string, enviar: () => Promise<unknown>): Promise<unknown> {
  const anterior = escrituras.get(clave) ?? Promise.resolve();
  const siguiente = anterior.catch(/* Maneja el fallo de esta operación. */ () => {}).then(enviar);
  escrituras.set(clave, siguiente);
  void siguiente.finally(/* Libera el trabajo pendiente tanto si terminó bien como si falló. */ () => { if (escrituras.get(clave) === siguiente) escrituras.delete(clave); }).catch(/* Maneja el fallo de esta operación. */ () => {});
  return siguiente;
}

export interface ActiveGameProgress {
  gameId: string;
  date: string; // Formato: 'YYYY-MM-DD'
  day?: number;
  word?: string;
  guesses: any[];
  gameData?: Record<string, any>;
  currentInput?: string;
  status: 'in_progress' | 'won' | 'lost' | 'completed' | 'failed';
  attempts: number;
  stars: number;
  score: number;
  grade?: string;
  timeTakenSeconds?: number;
  awardedPoints?: number;
  synced?: boolean;
  updatedAt: string;
}

export interface SaveProgressPayload {
  gameId: string;
  date: string;
  day?: number;
  word?: string;
  guesses: any[];
  gameData?: Record<string, any>;
  currentInput?: string;
  status: 'in_progress' | 'won' | 'lost' | 'completed' | 'failed';
  attempts: number;
  stars?: number;
  score?: number;
  grade?: string;
  timeTakenSeconds?: number;
}

/**
 * Obtiene el ID del usuario con sesión activa en este momento.
 * Devuelve null si no hay sesión (modo invitado / sin cuenta).
 */
export function getCurrentUserId(): number | null {
  try {
    const userRaw = localStorage.getItem('usuario') || localStorage.getItem('user');
    if (!userRaw) return null;
    const parsed = JSON.parse(userRaw);
    if (!parsed || parsed.id == null) return null;
    const uid = typeof parsed.id === 'number' ? parsed.id : parseInt(parsed.id, 10);
    return isNaN(uid) ? null : uid;
  } catch {
    return null;
  }
}

/**
 * Clave de almacenamiento en localStorage para una partida en curso o reciente.
 * Aislada estrictamente entre usuarios autenticados e invitados.
 */
export function getActiveProgressStorageKey(gameId: string, date: string): string {
  const uid = getCurrentUserId();
  return uid != null
    ? `game_active_progress_user_${uid}_${gameId}_${date}`
    : `game_active_progress_guest_${gameId}_${date}`;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/**
 * Clave de almacenamiento en localStorage para el registro de días completados de un juego.
 * Aislada estrictamente por usuario y por mes (YYYY_MM) para evitar que los días completados
 * de un mes se propaguen a los demás meses (ej: día 1 y 9 en Octubre vs Agosto vs Septiembre).
 */
export function getCompletedDaysStorageKey(gameId: string, year?: number, month?: number): string {
  const uid = getCurrentUserId();
  const base = uid != null
    ? `${gameId}_completed_days_user_${uid}`
    : `${gameId}_completed_days_guest`;
  return year != null && month != null ? `${base}_${year}_${month}` : base;
}

/**
 * Limpia registros obsoletos y sin prefijo que pudieran haber quedado de versiones anteriores
 * para evitar contaminación cruzada entre sesiones.
 */
export function cleanupLegacyGameStorage(): void {
  try {
    localStorage.removeItem('wordle_completed_days');
    localStorage.removeItem('wordle_completed_days_v2');

    // Migración automática de datos obsoletos sin mes (jugados en Octubre 2026) a la clave mensual aislada
    const legacyGuestKey = 'wordle_completed_days_guest';
    const legacyGuestData = localStorage.getItem(legacyGuestKey);
    if (legacyGuestData) {
      const targetOctKey = 'wordle_completed_days_guest_2026_10';
      if (!localStorage.getItem(targetOctKey)) {
        localStorage.setItem(targetOctKey, legacyGuestData);
      }
      localStorage.removeItem(legacyGuestKey);
    }

    // Migración de claves huérfanas de usuario sin sufijo de año y mes
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('wordle_completed_days_user_') && !key.match(/_\d{4}_\d{1,2}$/)) {
        const data = localStorage.getItem(key);
        if (data) {
          const targetKey = `${key}_2026_10`;
          if (!localStorage.getItem(targetKey)) {
            localStorage.setItem(targetKey, data);
          }
        }
        localStorage.removeItem(key);
      }
    }

    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        key.startsWith('game_active_progress_') &&
        !key.includes('_guest_') &&
        !key.includes('_user_')
      ) {
        toRemove.push(key);
      }
    }
    toRemove.forEach(/* Aplica este paso a cada elemento. */ (k) => localStorage.removeItem(k));
  } catch {}
}

/**
 * Obtiene el progreso guardado de una partida.
 * - Si es invitado: lee exclusivamente de localStorage (cero llamadas de red).
 * - Si es usuario logueado: lee de localStorage y recurre al backend si no existe en local.
 */
function cacheCompleted(progress: ActiveGameProgress): void {
  try {
    localStorage.setItem(getActiveProgressStorageKey(progress.gameId, progress.date), JSON.stringify(progress));
    const [year, month, day] = progress.date.split('-').map(Number);
    const key = getCompletedDaysStorageKey(progress.gameId, year, month);
    const completed = JSON.parse(localStorage.getItem(key) || '{}');
    completed[day] = { ...progress, dateKey: progress.date, day, dateStr: day + ' de ' + MONTH_NAMES[month - 1], completedAt: progress.updatedAt };
    localStorage.setItem(key, JSON.stringify(completed));
  } catch { /* El guardado remoto puede continuar aunque no haya espacio local. */ }
}

function alreadyCompleted(gameId: string, date: string): boolean {
  try {
    const [year, month, day] = date.split('-').map(Number);
    return Boolean(JSON.parse(localStorage.getItem(getCompletedDaysStorageKey(gameId, year, month)) || '{}')[day]);
  } catch { return false; }
}

export async function getActiveGameProgress(
  gameId: string,
  date: string
): Promise<ActiveGameProgress | null> {
  const storageKey = getActiveProgressStorageKey(gameId, date);

  // 1. Prioridad: LocalStorage con clave aislada
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const saved = JSON.parse(raw) as ActiveGameProgress;
      if (saved.status === 'won' || saved.status === 'completed') cacheCompleted(saved);
      return saved;
    }
  } catch (err) {
    console.warn('[attemptsService] Error al leer progreso local:', err);
  }

  // 2. Si no tiene cuenta (es invitado), jamás consultar al backend. Terminar aquí.
  const uid = getCurrentUserId();
  if (uid == null) {
    return null;
  }

  // 3. Usuario autenticado: consultar al backend si no estaba en local
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // Intenta la consulta usando la dirección de servidor indicada.
    const tryFetch = async (url: string) => {
      const res = await fetch(url, { headers });
      if (!res.ok) return null;
      return await res.json();
    };

    const url = `/api/games/attempts/date/${date}?user_id=${uid}&game_id=${gameId}`;
    const data = await tryFetch(`${API_URL}${url}`);

    if (data && data.date) {
      const progress: ActiveGameProgress = {
        gameId: data.game_id || gameId,
        grade: data.grade,
        timeTakenSeconds: data.time_taken_seconds ?? data.game_data?.elapsedSeconds ?? data.game_data?.timeTaken,
        synced: true,
        date: data.date,
        word: data.word,
        guesses: data.guesses || [],
        gameData: data.game_data,
        currentInput: data.game_data?.currentInput || '',
        status: data.status,
        attempts: data.attempts || (data.guesses?.length || 0),
        stars: data.stars || 0,
        score: data.score || 0,
        updatedAt: data.updated_at || new Date().toISOString(),
      };

      if (progress.status === 'won' || progress.status === 'completed') cacheCompleted(progress);
      // Guardar en local bajo la clave del usuario para lecturas rápidas
      try {
        localStorage.setItem(storageKey, JSON.stringify(progress));
      } catch {}

      return progress;
    }
  } catch (err) {
    console.warn('[attemptsService] No se pudo recuperar progreso del servidor:', err);
  }

  return null;
}

/**
 * Guarda el progreso en tiempo real de una partida en curso.
 * - Si es invitado: guarda sólo en localStorage.
 * - Si tiene cuenta: guarda en localStorage y sincroniza en segundo plano con MongoDB.
 */
export async function saveActiveGameProgress(payload: SaveProgressPayload, confirmarServidor = false): Promise<void> {
  const progress: ActiveGameProgress = {
    gameId: payload.gameId,
    date: payload.date,
    day: payload.day,
    word: payload.word,
    guesses: payload.guesses,
    gameData: payload.gameData,
    grade: payload.grade,
    timeTakenSeconds: payload.timeTakenSeconds,
    currentInput: payload.currentInput || '',
    status: payload.status,
    attempts: payload.attempts,
    stars: payload.stars || 0,
    score: payload.score || 0,
    updatedAt: new Date().toISOString(),
  };

  const storageKey = getActiveProgressStorageKey(payload.gameId, payload.date);

  // 1. Guardado local instantáneo en la clave aislada
  try {
    localStorage.setItem(storageKey, JSON.stringify(progress));
  } catch (err) {
    console.error('[attemptsService] Error al guardar progreso local:', err);
  }

  // 2. Si es invitado (sin cuenta), NO llamar al backend para no ensuciar la base de datos
  const uid = getCurrentUserId();
  if (uid == null) {
    return;
  }

  // Los reintentos locales no deben convertir una victoria ya premiada en otra partida nueva.
  if (alreadyCompleted(payload.gameId, payload.date)) return;

  // 3. Sincronización asíncrona con el backend (sólo usuario autenticado)
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const body = {
      user_id: uid,
      game_id: payload.gameId,
      date: payload.date,
      mode: 'daily',
      time_taken_seconds: payload.timeTakenSeconds,
      status: payload.status === 'won' || payload.status === 'completed' ? 'completed' : payload.status === 'lost' || payload.status === 'failed' ? 'failed' : 'in_progress',
      word: payload.word,
      attempts: payload.attempts,
      stars: payload.stars || 0,
      score: payload.score || 0,
      guesses: payload.guesses,
      game_data: { ...payload.gameData, currentInput: payload.currentInput || '' },
      remaining_attempts: payload.gameData?.lives ?? Math.max(0, 6 - payload.attempts),
    };

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // Sincroniza el avance con el servidor sin bloquear la partida.
    const sendBackend = async (url: string) => {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        keepalive: true,
      });
      if (!res.ok) throw new Error('No se pudo guardar la partida en el servidor.');
    };

    await guardarEnOrden(storageKey, /* Completa este paso con los datos recibidos por la operación. */ () => sendBackend(`${API_URL}/api/games/attempts`));
  } catch (error) {
    if (confirmarServidor) throw error;
    // Modo offline seguro
  }
}

/**
 * Guarda el resultado final de una partida (victoria o derrota).
 * - Si es invitado: guarda en localStorage (progreso y días completados). CERO llamadas al backend.
 * - Si tiene cuenta: guarda en localStorage, actualiza puntos en sesión y sincroniza con MongoDB.
 */
export async function saveFinalGameAttempt(payload: SaveProgressPayload): Promise<ActiveGameProgress> {
  const won = payload.status === 'won' || payload.status === 'completed';
  const uid = getCurrentUserId();
  const progress: ActiveGameProgress = { ...payload, status: won ? 'won' : 'lost',
    stars: payload.stars ?? (won ? 3 : 0), score: payload.score ?? 0,
    synced: uid === null, updatedAt: new Date().toISOString() };
  const storageKey = getActiveProgressStorageKey(payload.gameId, payload.date);
  if (won) cacheCompleted(progress);
  else localStorage.setItem(storageKey, JSON.stringify(progress));
  if (uid === null) return progress;

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const response = await guardarEnOrden(storageKey, async () => {
    const res = await fetch(API_URL + '/api/games/attempts', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: JSON.stringify({ user_id: uid, game_id: payload.gameId, date: payload.date,
        mode: 'daily', status: won ? 'completed' : 'failed', word: payload.word,
        attempts: payload.attempts, grade: payload.grade, stars: payload.stars,
        time_taken_seconds: payload.timeTakenSeconds, guesses: payload.guesses, game_data: payload.gameData }),
    });
    if (!res.ok) throw new Error('No se pudo confirmar el resultado.');
    return res.json();
  }) as { grade?: string; stars: number; score: number; puntos_ganados?: number; puntos_totales_usuario?: number };
  if (!Number.isFinite(response.score) || !Number.isFinite(response.stars)) throw new Error('Resultado inválido del servidor.');
  const confirmed = { ...progress, grade: response.grade ?? progress.grade, stars: response.stars,
    score: response.score, awardedPoints: response.puntos_ganados, synced: true };
  if (getCurrentUserId() === uid) {
    if (won) cacheCompleted(confirmed);
    else localStorage.setItem(storageKey, JSON.stringify(confirmed));
    if (Number.isFinite(response.puntos_totales_usuario)) {
      for (const key of ['usuario', 'user']) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) localStorage.setItem(key, JSON.stringify({ ...JSON.parse(raw), puntos: response.puntos_totales_usuario }));
        } catch { /* La cabecera se actualiza mediante el evento. */ }
      }
      window.dispatchEvent(new CustomEvent('user_progress_updated', { detail: { economiaConfirmada: true, puntos: response.puntos_totales_usuario } }));
    } else window.dispatchEvent(new Event('user_progress_updated'));
  }
  return confirmed;
}

/**
 * Borra el progreso de una partida específica (por ejemplo al reiniciar).
 */
export function clearActiveGameProgress(gameId: string, date: string): void {
  try {
    localStorage.removeItem(getActiveProgressStorageKey(gameId, date));
    localStorage.removeItem(`game_active_progress_${gameId}_${date}`);
  } catch {}
}

/**
 * Vuelca el progreso acumulado como invitado a la nueva cuenta del usuario recién registrado.
 * NOTA: Esta función se utilizará ÚNICAMENTE en el flujo de registro nuevo (sign up) futuro,
 * NO en el flujo de inicio de sesión tradicional (login de usuario existente).
 */
export async function migrateGuestProgressToNewUser(newUserId: number): Promise<void> {
  try {
    const guestKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('game_active_progress_guest_')) {
        guestKeys.push(k);
      }
    }

    for (const gk of guestKeys) {
      const dataRaw = localStorage.getItem(gk);
      if (dataRaw) {
        const data = JSON.parse(dataRaw);
        const userKey = gk.replace('_guest_', `_user_${newUserId}_`);
        localStorage.setItem(userKey, JSON.stringify(data));
        localStorage.removeItem(gk);
      }
    }

    const monthlyKeysToMigrate: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.includes('_completed_days_guest')) {
        monthlyKeysToMigrate.push(k);
      }
    }
    monthlyKeysToMigrate.forEach(/* Aplica este paso a cada elemento. */ (k) => {
      const raw = localStorage.getItem(k);
      if (raw) {
        const userK = k.replace('_guest', `_user_${newUserId}`);
        localStorage.setItem(userK, raw);
        localStorage.removeItem(k);
      }
    });
  } catch (err) {
    console.error('[attemptsService] Error al migrar progreso de invitado a nuevo usuario:', err);
  }
}
