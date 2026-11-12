import { CompletedModal } from '../COMPONENTS/MODALS/CompletedModal';
import { act, cleanup, render, screen, waitFor, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useClassicChallenge } from './useClassicChallenge';
import { DEFAULT_GRADE_POINTS, DEFAULT_TIME_GRADES } from './classicScoring';
import { getActiveProgressStorageKey, getActiveGameProgress, saveFinalGameAttempt } from './attemptsService';
import { getSessionUser, setSessionUser } from '../AUTH/sessionStore';

vi.mock('../../context/PlayerEconomyContext', () => ({ usePlayerEconomy: () => ({ puntosPorCalificacion: DEFAULT_GRADE_POINTS, escalasTiempoPorJuego: DEFAULT_TIME_GRADES }) }));
beforeEach(() => {
  localStorage.clear();
  setSessionUser(null);
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-30T10:00:00Z'));
  vi.stubGlobal('fetch', vi.fn());
});
afterEach(() => {
  cleanup();
  setSessionUser(null);
  vi.useRealTimers();
  vi.unstubAllGlobals();
  localStorage.clear();
});

it('restaura el tiempo, pausa al salir y usa el total para calificar', async () => {
  const { result, rerender } = renderHook(({ running }) => useClassicChallenge('sudoku', '2026-10-30', running), { initialProps: { running: false } });
  act(() => result.current.restore({ gameId: 'sudoku', date: '2026-10-30', status: 'in_progress', guesses: [], attempts: 0, stars: 0, score: 0, updatedAt: '', gameData: { elapsedSeconds: 150 } }));
  rerender({ running: true });
  act(() => vi.advanceTimersByTime(31000));
  expect(result.current.seconds).toBe(181);
  rerender({ running: false });
  act(() => vi.advanceTimersByTime(60000));
  expect(result.current.seconds).toBe(181);
  await act(async () => result.current.complete({ status: 'won', attempts: 0, guesses: [], gameData: { cells: [[1]] } }));
  expect(result.current.completion.result).toMatchObject({ grade: 'A', score: 90, timeTakenSeconds: 181 });
  const saved = JSON.parse(localStorage.getItem(getActiveProgressStorageKey('sudoku', '2026-10-30'))!);
  expect(saved).toMatchObject({ grade: 'A', score: 90, timeTakenSeconds: 181 });
  expect(fetch).not.toHaveBeenCalled();
});

it('guarda el tiempo al salir sin borrar el tablero', () => {
  const date = '2026-10-30';
  const key = getActiveProgressStorageKey('sopa_letras', date);
  localStorage.setItem(key, JSON.stringify({ gameId: 'sopa_letras', date, status: 'in_progress', guesses: ['CASA'], attempts: 1, gameData: { errors: 1 } }));
  const { unmount } = renderHook(() => useClassicChallenge('sopa_letras', date, true));
  act(() => vi.advanceTimersByTime(9000)); unmount();
  expect(JSON.parse(localStorage.getItem(key)!)).toMatchObject({ guesses: ['CASA'], timeTakenSeconds: 9, gameData: { errors: 1, elapsedSeconds: 9 } });
});

it('reiniciar mientras se confirma una victoria no mezcla el resultado con la partida nueva', async () => {
  setSessionUser({ id: 7, name: 'Test', puntos: 0 });
  let resolver!: (res: Response) => void;
  vi.mocked(fetch).mockReturnValue(new Promise<Response>(resolve => { resolver = resolve; }));
  const { result } = renderHook(() => useClassicChallenge('wordle', '2026-10-30', true));
  act(() => result.current.complete({ status: 'won', attempts: 1, guesses: ['HOGAR'] }));
  expect(result.current.completion.saving).toBe(true);
  act(() => result.current.reset());
  await act(async () => {
    resolver(new Response(JSON.stringify({ grade: 'S', score: 100, stars: 3, puntos_ganados: 100, puntos_totales_usuario: 100 })));
    await Promise.resolve();
  });
  expect(result.current.completion.result).toBeNull();
  expect(result.current.completion.saving).toBe(false);
  expect(getSessionUser()?.puntos).toBe(100);
});

it('confirma los puntos pendientes al abrir un resultado guardado desde el calendario', async () => {
  vi.useRealTimers();
  setSessionUser({ id: 7, name: 'Test', puntos: 1000 });
  vi.mocked(fetch).mockResolvedValueOnce(new Response('{}', { status: 500 }));
  const payload = { gameId: 'sudoku', date: '2026-10-30', status: 'won' as const, attempts: 0, guesses: [], grade: 'A', stars: 3, score: 90, timeTakenSeconds: 181 };
  await expect(saveFinalGameAttempt(payload)).rejects.toThrow();
  const saved = await getActiveGameProgress(payload.gameId, payload.date);
  vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ grade: 'A', score: 90, stars: 3, puntos_ganados: 90, puntos_totales_usuario: 1090 })));
  render(<CompletedModal gameId="sudoku" challenge={{ dateKey: payload.date, completedData: saved }} onClose={() => {}} />);
  await waitFor(() => expect(getSessionUser()?.puntos).toBe(1090));
  expect(screen.getByText('90 puntos')).toBeTruthy();
  expect(fetch).toHaveBeenCalledTimes(2);
});

it('muestra el total acreditado con bonus al abrir un día histórico', () => {
  render(<CompletedModal gameId="sopa_letras" challenge={{ dateKey: '2026-10-05', completedData: { grade: 'S', score: 100, stars: 3, awardedPoints: 110 } }} onClose={() => {}} />);
  expect(screen.getByText('110 puntos')).toBeTruthy();
});

it('en un replay sin puntos nuevos muestra la base del desafío', () => {
  render(<CompletedModal gameId="sopa_letras" challenge={{ dateKey: '2026-10-05', completedData: { grade: 'S', score: 100, stars: 3, awardedPoints: 0 } }} onClose={() => {}} />);
  expect(screen.getByText('100 puntos')).toBeTruthy();
});
