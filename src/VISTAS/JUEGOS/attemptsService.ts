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
export async function getActiveGameProgress(
  gameId: string,
  date: string
): Promise<ActiveGameProgress | null> {
  const storageKey = getActiveProgressStorageKey(gameId, date);

  // 1. Prioridad: LocalStorage con clave aislada
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      return JSON.parse(raw) as ActiveGameProgress;
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
export async function saveActiveGameProgress(payload: SaveProgressPayload): Promise<void> {
  const progress: ActiveGameProgress = {
    gameId: payload.gameId,
    date: payload.date,
    day: payload.day,
    word: payload.word,
    guesses: payload.guesses,
    gameData: payload.gameData,
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

  // 3. Sincronización asíncrona con el backend (sólo usuario autenticado)
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const body = {
      user_id: uid,
      game_id: payload.gameId,
      date: payload.date,
      mode: 'daily',
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
      await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
    };

    await guardarEnOrden(storageKey, /* Completa este paso con los datos recibidos por la operación. */ () => sendBackend(`${API_URL}/api/games/attempts`));
  } catch {
    // Modo offline seguro
  }
}

/**
 * Guarda el resultado final de una partida (victoria o derrota).
 * - Si es invitado: guarda en localStorage (progreso y días completados). CERO llamadas al backend.
 * - Si tiene cuenta: guarda en localStorage, actualiza puntos en sesión y sincroniza con MongoDB.
 */
export async function saveFinalGameAttempt(payload: SaveProgressPayload): Promise<void> {
  const isWon = payload.status === 'won' || payload.status === 'completed';
  const finalStatus = isWon ? 'completed' : 'failed';
  const dayNum = payload.day || parseInt(payload.date.split('-')[2], 10) || 9;
  const stars = payload.stars || (isWon ? (payload.attempts <= 3 ? 3 : payload.attempts <= 5 ? 2 : 1) : 0);
  const score = payload.score ?? (stars * 50);

  const progress: ActiveGameProgress = {
    gameId: payload.gameId,
    date: payload.date,
    day: dayNum,
    word: payload.word,
    guesses: payload.guesses,
    gameData: payload.gameData,
    currentInput: '',
    status: isWon ? 'won' : 'lost',
    attempts: payload.attempts,
    stars,
    score,
    updatedAt: new Date().toISOString(),
  };

  const storageKey = getActiveProgressStorageKey(payload.gameId, payload.date);

  // 1. Guardar estado activo final en localStorage aislado
  try {
    localStorage.setItem(storageKey, JSON.stringify(progress));
  } catch (err) {
    console.error('[attemptsService] Error al guardar intento final local:', err);
  }

  // 2. Si ganó, actualizar también el registro para el calendario del juego
  if (isWon) {
    try {
      const [yStr, mStr, dStr] = (payload.date || '').split('-');
      const year = parseInt(yStr, 10) || 2026;
      const month = parseInt(mStr, 10) || 10;
      const parsedDay = payload.day || parseInt(dStr, 10) || 1;
      const monthName = MONTH_NAMES[month - 1] || 'Octubre';

      const compKey = getCompletedDaysStorageKey(payload.gameId, year, month);
      const completedRaw = localStorage.getItem(compKey);
      const completedMap = completedRaw ? JSON.parse(completedRaw) : {};
      completedMap[parsedDay] = {
        day: parsedDay,
        year,
        month,
        dateKey: payload.date,
        attempts: payload.attempts,
        stars,
        word: payload.word || '',
        dateStr: `${parsedDay} de ${monthName}`,
        completedAt: new Date().toISOString(),
      };
      localStorage.setItem(compKey, JSON.stringify(completedMap));
    } catch (err) {
      console.warn('[attemptsService] Error al guardar día completado local:', err);
    }
  }

  // 3. Si NO tiene cuenta (invitado), NO tocar la base de datos ni sumar puntos a cuentas
  const uid = getCurrentUserId();
  if (uid == null) {
    return;
  }

  // 4. Si tiene cuenta, actualizar puntos del usuario en sesión local y notificar al header
  try {
    const userRaw = localStorage.getItem('usuario') || localStorage.getItem('user');
    if (userRaw && isWon && score > 0) {
      const user = JSON.parse(userRaw);
      user.puntos = (user.puntos || 0) + score;
      user.racha = (user.racha || 0) + 1;
      localStorage.setItem('usuario', JSON.stringify(user));
      window.dispatchEvent(new CustomEvent('user_progress_updated', { detail: { score, racha: user.racha } }));
    }
  } catch {}

  // 5. Enviar a MongoDB / Backend sólo para el usuario autenticado
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const body = {
      user_id: uid,
      game_id: payload.gameId,
      date: payload.date,
      mode: 'daily',
      status: finalStatus,
      word: payload.word,
      attempts: payload.attempts,
      stars,
      score,
      guesses: payload.guesses,
      game_data: { ...payload.gameData, currentInput: payload.currentInput || '' },
      remaining_attempts: 0,
    };

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // Sincroniza el avance con el servidor sin bloquear la partida.
    const sendBackend = async (url: string) => {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      return await res.json();
    };

    await guardarEnOrden(storageKey, /* Completa este paso con los datos recibidos por la operación. */ () => sendBackend(`${API_URL}/api/games/attempts`));
  } catch {
    // Modo offline seguro
  }
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
