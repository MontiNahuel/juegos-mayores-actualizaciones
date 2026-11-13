import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { getCalendarMonthData } from './calendarService';
import { setSessionUser } from '../../AUTH/sessionStore';

const SERVER_TODAY = { year: 2026, month: 10, day: 30, dateKey: '2026-10-30' };

function mockMonth(attempt: Record<string, unknown>) {
  vi.mocked(fetch)
    .mockResolvedValueOnce(new Response(JSON.stringify({ attempts: [attempt] })))
    .mockResolvedValueOnce(new Response(JSON.stringify({ challenges: [] })));
}

beforeEach(() => {
  localStorage.clear();
  setSessionUser({ id: 7, name: 'Test', puntos: 0 });
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  setSessionUser(null);
  vi.unstubAllGlobals();
  localStorage.clear();
});

it('suma el bonus por racha a los puntos acreditados de un día completado', async () => {
  mockMonth({ date: '2026-10-05', status: 'completed', attempts: 1, stars: 3, score: 100, grade: 'S', bonus_racha_puntos: 10, time_taken_seconds: 46 });

  const { challenges } = await getCalendarMonthData('sopa_letras', 2026, 10, SERVER_TODAY);

  expect(challenges.find((item) => item.day === 5)?.completedData?.awardedPoints).toBe(110);
});

it('deja los puntos acreditados sin definir si el intento no tuvo bonus', async () => {
  mockMonth({ date: '2026-10-05', status: 'completed', attempts: 1, stars: 3, score: 100, grade: 'S' });

  const { challenges } = await getCalendarMonthData('sopa_letras', 2026, 10, SERVER_TODAY);

  expect(challenges.find((item) => item.day === 5)?.completedData?.awardedPoints).toBeUndefined();
});

it('expone el sello del intento completado en el día', async () => {
  mockMonth({ date: '2026-10-05', status: 'completed', attempts: 1, stars: 3, score: 100, grade: 'S' });

  const { challenges } = await getCalendarMonthData('sopa_letras', 2026, 10, SERVER_TODAY);

  const day = challenges.find((item) => item.day === 5);
  expect(day?.status).toBe('completed');
  expect(day?.grade).toBe('S');
});

it('muestra el sello F de una partida perdida sin bloquear el día', async () => {
  mockMonth({ date: '2026-10-05', status: 'failed', attempts: 1, stars: 0, score: 0, grade: 'F' });

  const { challenges } = await getCalendarMonthData('sopa_letras', 2026, 10, SERVER_TODAY);

  const day = challenges.find((item) => item.day === 5);
  expect(day?.status).toBe('pending');
  expect(day?.grade).toBe('F');
  expect(day?.completedData).toBeUndefined();
});
