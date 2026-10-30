/* Maneja la carga de meses y los datos del calendario de desafíos. */
import { useState, useEffect, useCallback, useRef } from 'react';
import type { DayChallenge } from './types';
import {
  MONTH_NAMES,
  type ServerTodayInfo,
  fetchServerToday,
  fetchChallengeDateRange,
  getCalendarMonthData,
  getTodayChallengeData,
} from './calendarService';

interface UseGameCalendarOptions {
  gameId: string;
  difficulty?: string;
  year?: number;
  month?: number;
  todayDay?: number;
}

// Maneja la carga de meses y los datos del calendario de desafíos.
export function useGameCalendar({
  gameId,
  difficulty = 'standard',
  year: propYear,
  month: propMonth,
  todayDay: propTodayDay,
}: UseGameCalendarOptions) {
  const [challenges, setChallenges] = useState<DayChallenge[]>([]);
  const [todayChallenge, setTodayChallenge] = useState<DayChallenge | null>(null);
  const [serverToday, setServerToday] = useState<ServerTodayInfo | null>(null);
  const [minDate, setMinDate] = useState<string | null>(null);

  const [viewYear, setViewYear] = useState<number>(propYear || 2026);
  const [viewMonth, setViewMonth] = useState<number>(propMonth || 10);
  const [loading, setLoading] = useState<boolean>(true);

  // Referencia para evitar dobles peticiones innecesarias
  const serverTodayRef = useRef<ServerTodayInfo | null>(null);

  // 1. Inicialización: sincronizar fecha del servidor y límites de fecha en MongoDB
  useEffect(/* Sincroniza este efecto cuando cambian los datos de los que depende. */ () => {
    let isMounted = true;

    // Busca la fecha del servidor y prepara el primer mes del calendario.
    async function init() {
      try {
        const [todayInfo, rangeInfo] = await Promise.all([
          fetchServerToday(gameId, difficulty),
          fetchChallengeDateRange(gameId),
        ]);

        if (!isMounted) return;

        // Si se forzó un propTodayDay, adaptamos el serverToday
        if (propTodayDay) {
          todayInfo.day = propTodayDay;
        }

        serverTodayRef.current = todayInfo;
        setServerToday(todayInfo);
        setMinDate(rangeInfo.minDate);

        const initialYear = propYear || todayInfo.year;
        const initialMonth = propMonth || todayInfo.month;
        setViewYear(initialYear);
        setViewMonth(initialMonth);

        // Cargar datos del mes inicial
        setLoading(true);
        const [monthResult, heroToday] = await Promise.all([
          getCalendarMonthData(gameId, initialYear, initialMonth, todayInfo, difficulty),
          getTodayChallengeData(gameId, todayInfo),
        ]);

        if (!isMounted) return;
        setChallenges(monthResult.challenges);
        setTodayChallenge(heroToday);
      } catch (err) {
        console.error('[useGameCalendar] Error inicializando calendario:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    init();

    return /* Libera los recursos de este efecto cuando deja de usarse. */ () => {
      isMounted = false;
    };
  }, [gameId, difficulty, propYear, propMonth, propTodayDay]);

  // 2. Cargar datos cuando cambia el mes visualizado (navegación mensual)
  const loadMonth = useCallback(
    async (y: number, m: number) => {
      const activeServerToday = serverTodayRef.current || {
        year: 2026,
        month: 10,
        day: 13,
        dateKey: '2026-10-13',
      };

      setLoading(true);
      try {
        const monthResult = await getCalendarMonthData(gameId, y, m, activeServerToday, difficulty);
        setChallenges(monthResult.challenges);
        // Si el mes visualizado es el actual, refrescar también todayChallenge
        if (y === activeServerToday.year && m === activeServerToday.month) {
          setTodayChallenge(monthResult.todayChallenge);
        }
      } catch (err) {
        console.error('[useGameCalendar] Error al cargar mes:', err);
      } finally {
        setLoading(false);
      }
    },
    [gameId, difficulty]
  );

  // 3. Cálculo de límites y condiciones de navegación
  const minYear = minDate ? parseInt(minDate.split('-')[0], 10) : 2026;
  const minMonth = minDate ? parseInt(minDate.split('-')[1], 10) : 8; // Agosto 2026 como fallback seguro
  const currentViewIdx = viewYear * 12 + viewMonth;
  const minIdx = minYear * 12 + minMonth;
  const canGoPrev = currentViewIdx > minIdx;

  const maxYear = serverToday ? serverToday.year : 2026;
  const maxMonth = serverToday ? serverToday.month : 10;
  const maxIdx = maxYear * 12 + maxMonth;
  const canGoNext = currentViewIdx < maxIdx;

  // 4. Métodos de navegación
  const goToPreviousMonth = useCallback(() => {
    if (!canGoPrev) return;
    let nextY = viewYear;
    let nextM = viewMonth - 1;
    if (nextM < 1) {
      nextM = 12;
      nextY -= 1;
    }
    setViewYear(nextY);
    setViewMonth(nextM);
    loadMonth(nextY, nextM);
  }, [canGoPrev, viewYear, viewMonth, loadMonth]);

  // Mueve el calendario al mes siguiente.
  const goToNextMonth = useCallback(() => {
    if (!canGoNext) return;
    let nextY = viewYear;
    let nextM = viewMonth + 1;
    if (nextM > 12) {
      nextM = 1;
      nextY += 1;
    }
    setViewYear(nextY);
    setViewMonth(nextM);
    loadMonth(nextY, nextM);
  }, [canGoNext, viewYear, viewMonth, loadMonth]);

  // Vuelve a cargar los datos que se están mostrando.
  const reload = useCallback(() => {
    loadMonth(viewYear, viewMonth);
  }, [loadMonth, viewYear, viewMonth]);

  const monthName = MONTH_NAMES[viewMonth - 1] || 'Octubre';

  const fallbackToday: DayChallenge = {
    day: serverToday?.day || 13,
    dateStr: `${serverToday?.day || 13} de ${MONTH_NAMES[(serverToday?.month || 10) - 1]}`,
    dayName: 'Hoy',
    dateKey: serverToday?.dateKey || '2026-10-13',
    status: 'pending',
    isToday: true,
  };

  return {
    challenges,
    todayChallenge: todayChallenge || fallbackToday,
    loading,
    reload,
    year: viewYear,
    month: viewMonth,
    todayDay: serverToday?.day || 13,
    monthName,
    canGoPrev,
    canGoNext,
    goToPreviousMonth,
    goToNextMonth,
  };
}
