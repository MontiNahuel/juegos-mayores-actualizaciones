/**
 * calendarService.ts
 * Servicio centralizado para la comunicación con la API de Desafíos Diarios
 * y sincronización de fechas en vivo con el backend.
 */

import type { DayChallenge, CompletedRecord } from './types';
import { API_URL } from '../../../config/api';
import {
  getCurrentUserId,
  getActiveProgressStorageKey,
  getCompletedDaysStorageKey,
  cleanupLegacyGameStorage,
} from '../../JUEGOS/attemptsService';

export const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export interface ServerTodayInfo {
  year: number;
  month: number;
  day: number;
  dateKey: string;
  config?: any;
}

/**
 * Cliente HTTP unificado usando la URL configurada para el backend.
 */
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Consulta el desafío de hoy al backend para sincronizar la fecha real del servidor en vivo.
 */
export async function fetchServerToday(gameId: string = 'wordle'): Promise<ServerTodayInfo> {
  const data = await apiFetch<any>(`/api/challenges/today?game_id=${gameId}`);
  if (data && data.date) {
    const [y, m, d] = data.date.split('-').map((v: string) => parseInt(v, 10));
    return {
      year: y,
      month: m,
      day: d,
      dateKey: data.date,
      config: data.config,
    };
  }

  // Fallback si no hay conexión con el backend: fecha del dispositivo
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const dateKey = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return { year: y, month: m, day: d, dateKey };
}

/**
 * Consulta el rango dinámico de fechas disponibles en base de datos para un juego.
 * Permite limitar de forma elástica la navegación hacia atrás sin editar código frontend.
 */
export async function fetchChallengeDateRange(gameId: string = 'wordle'): Promise<{
  minDate: string | null;
  maxDate: string | null;
}> {
  const data = await apiFetch<any>(`/api/challenges/range?game_id=${gameId}`);
  return {
    minDate: data?.min_date || null,
    maxDate: data?.max_date || null,
  };
}

/**
 * Consulta los desafíos de un mes al backend.
 */
export async function fetchMonthChallenges(gameId: string, year: number, month: number) {
  return await apiFetch<any>(`/api/challenges/month?year=${year}&month=${month}&game_id=${gameId}`);
}

/**
 * Consulta los intentos del usuario autenticado para un mes específico.
 */
export async function fetchUserMonthAttempts(
  gameId: string,
  year: number,
  month: number,
  userId: number
) {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  return await apiFetch<any>(
    `/api/games/attempts?game_id=${gameId}&year=${year}&month=${month}&user_id=${userId}`,
    { headers }
  );
}

/**
 * Obtiene el objeto DayChallenge representativo del día de HOY.
 */
export async function getTodayChallengeData(
  gameId: string,
  serverToday: ServerTodayInfo
): Promise<DayChallenge> {
  const compKey = getCompletedDaysStorageKey(gameId, serverToday.year, serverToday.month);
  let comp: CompletedRecord | undefined;
  try {
    const storedLocal = localStorage.getItem(compKey);
    if (storedLocal) {
      const map = JSON.parse(storedLocal);
      comp = map[serverToday.day];
    }
  } catch {}

  // Revisar partidas activas in_progress
  try {
    const activeKey = getActiveProgressStorageKey(gameId, serverToday.dateKey);
    const activeRaw = localStorage.getItem(activeKey);
    if (activeRaw) {
      const activeData = JSON.parse(activeRaw);
      if (activeData.status === 'in_progress') comp = undefined;
    }
  } catch {}

  const todayMonthName = MONTH_NAMES[serverToday.month - 1] || 'Octubre';
  const dayName = DAY_NAMES[new Date(serverToday.year, serverToday.month - 1, serverToday.day).getDay()];

  return {
    day: serverToday.day,
    dateStr: `${serverToday.day} de ${todayMonthName}`,
    dayName,
    dateKey: serverToday.dateKey,
    config: serverToday.config,
    status: comp ? 'completed' : 'pending',
    attempts: comp?.attempts,
    stars: comp?.stars,
    score: comp?.score,
    isToday: true,
    completedData: comp,
  };
}

/**
 * Función orquestadora que consolida toda la información mensual del calendario:
 * 1. Utiliza la fecha real de "HOY" del servidor para discriminar días pasados, presente y futuros.
 * 2. Consulta los retos del mes solicitado al backend.
 * 3. Recupera los intentos completados locales (invitados) y en la nube (usuarios).
 * 4. Valida partidas activas in_progress.
 * 5. Genera la lista de días con estados (completed, pending, locked).
 */
export async function getCalendarMonthData(
  gameId: string,
  viewYear?: number,
  viewMonth?: number,
  serverTodayProp?: ServerTodayInfo
): Promise<{
  challenges: DayChallenge[];
  todayChallenge: DayChallenge;
  year: number;
  month: number;
  todayDay: number;
  monthName: string;
}> {
  // Limpieza preventiva de datos locales obsoletos
  cleanupLegacyGameStorage();

  // 1. Obtener la fecha de HOY en vivo desde el backend si no fue provista
  const serverToday = serverTodayProp || (await fetchServerToday(gameId));
  const year = viewYear || serverToday.year;
  const month = viewMonth || serverToday.month;
  const todayDay = serverToday.day;

  const monthName = MONTH_NAMES[month - 1] || 'Octubre';

  // 2. Obtener intentos completados locales (modo offline / invitado) aislados por mes
  const completedMap: Record<number, CompletedRecord> = {};
  try {
    const compKey = getCompletedDaysStorageKey(gameId, year, month);
    const storedLocal = localStorage.getItem(compKey);
    if (storedLocal) {
      Object.assign(completedMap, JSON.parse(storedLocal));
    }
  } catch {}

  // 3. Revisar partidas in_progress en local para no marcarlas como completadas
  try {
    for (let d = 1; d <= 31; d++) {
      const dateK = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const activeKey = getActiveProgressStorageKey(gameId, dateK);
      const activeRaw = localStorage.getItem(activeKey);
      if (activeRaw) {
        const activeData = JSON.parse(activeRaw);
        if (activeData.status === 'in_progress') {
          delete completedMap[d];
        }
      }
    }
  } catch {}

  // 4. Si el usuario está autenticado, consultar sus intentos al backend
  const uid = getCurrentUserId();
  if (uid != null) {
    const attemptsData = await fetchUserMonthAttempts(gameId, year, month, uid);
    if (attemptsData && Array.isArray(attemptsData.attempts)) {
      attemptsData.attempts.forEach((att: any) => {
        const dayNum = parseInt(att.date.split('-')[2], 10);
        if (dayNum) {
          if (att.status === 'completed' || att.status === 'won') {
            completedMap[dayNum] = {
              attempts: att.attempts,
              stars: att.stars,
              word: att.word,
              score: att.score,
              dateStr: `${dayNum} de ${monthName}`,
              completedAt: att.updated_at || att.created_at,
            };
          } else if (att.status === 'in_progress') {
            delete completedMap[dayNum];
          }
        }
      });
    }
  }

  // 5. Consultar los desafíos del mes
  const monthData = await fetchMonthChallenges(gameId, year, month);
  const apiChallenges: any[] = monthData?.challenges || [];

  // 6. Construir la lista de días del mes
  const daysInMonth = new Date(year, month, 0).getDate();
  const list: DayChallenge[] = [];

  const isCurrentMonth = year === serverToday.year && month === serverToday.month;
  const isPastMonth =
    year < serverToday.year || (year === serverToday.year && month < serverToday.month);

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const foundApi = apiChallenges.find((c: any) => c.date === dateKey);

    const dateObj = new Date(year, month - 1, d);
    const dayOfWeekIndex = dateObj.getDay();
    const dayName = DAY_NAMES[dayOfWeekIndex];
    const dateStr = `${d} de ${monthName}`;

    // Determinación dinámica de estado:
    // - Si el mes es pasado, TODOS sus días son pasados (pending o completed). Ninguno bloqueado.
    // - Si el mes es actual, los días previos a hoy son pasados, hoy es isToday, y los futuros locked.
    const isToday = isCurrentMonth && d === serverToday.day;
    const isPast = isPastMonth || (isCurrentMonth && d < serverToday.day);

    const comp = completedMap[d];

    let status: 'completed' | 'pending' | 'locked' = 'locked';
    if (comp) {
      status = 'completed';
    } else if (isPast || isToday) {
      status = 'pending';
    } else {
      status = 'locked';
    }

    list.push({
      day: d,
      dateStr,
      dayName,
      dateKey,
      config: foundApi?.config,
      status,
      attempts: comp?.attempts,
      stars: comp?.stars,
      score: comp?.score,
      isToday,
      completedData: comp,
    });
  }

  // Desafío de hoy (para la tarjeta Hero)
  let todayChallenge: DayChallenge;
  if (isCurrentMonth) {
    todayChallenge = list.find((c) => c.isToday) || (await getTodayChallengeData(gameId, serverToday));
  } else {
    todayChallenge = await getTodayChallengeData(gameId, serverToday);
  }

  return {
    challenges: list,
    todayChallenge,
    year,
    month,
    todayDay,
    monthName,
  };
}
