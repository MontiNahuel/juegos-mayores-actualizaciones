import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { getActiveProgressStorageKey, saveActiveGameProgress, saveFinalGameAttempt } from './attemptsService';

const partida = { gameId: 'wordle', date: '2026-10-30', guesses: ['CASAS'], attempts: 1,
  status: 'in_progress' as const, gameData: { lives: 4 } };

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('usuario', JSON.stringify({ id: 7 }));
  localStorage.setItem('token', 'sesion-de-prueba');
  vi.stubGlobal('fetch', vi.fn());
});
afterEach(() => { localStorage.clear(); vi.unstubAllGlobals(); });

it('avisa si el servidor rechaza el guardado de una recarga y permite reintentar solo la partida', async () => {
  vi.mocked(fetch).mockResolvedValueOnce(new Response('{}', { status: 500 }));
  await expect(saveActiveGameProgress(partida, true)).rejects.toThrow('No se pudo guardar');
  const cache = JSON.parse(localStorage.getItem(getActiveProgressStorageKey('wordle', partida.date))!);
  expect(cache).toMatchObject({ guesses: ['CASAS'], gameData: { lives: 4 } });
  vi.mocked(fetch).mockResolvedValueOnce(new Response('{}'));
  await expect(saveActiveGameProgress(partida, true)).resolves.toBeUndefined();
  expect(fetch).toHaveBeenCalledTimes(2);
  for (const [url] of vi.mocked(fetch).mock.calls) expect(String(url)).toContain('/api/games/attempts');
});

it('conserva el guardado local normal cuando no hay conexión', async () => {
  vi.mocked(fetch).mockRejectedValue(new Error('Sin conexión'));
  await expect(saveActiveGameProgress(partida)).resolves.toBeUndefined();
  expect(localStorage.getItem(getActiveProgressStorageKey('wordle', partida.date))).toBeTruthy();
});

it('usa la calificación y el saldo confirmados sin sumar puntos por anticipado', async () => {
  localStorage.setItem('usuario', JSON.stringify({ id: 7, puntos: 1000, racha: 2 }));
  let resolve!: (value: Response) => void;
  vi.mocked(fetch).mockReturnValue(new Promise<Response>(r => { resolve = r; }));
  const request = saveFinalGameAttempt({ ...partida, status: 'won', grade: 'S', score: 100, stars: 3, timeTakenSeconds: 180 });
  expect(JSON.parse(localStorage.getItem('usuario')!).puntos).toBe(1000);
  resolve(new Response(JSON.stringify({ grade: 'A', score: 90, stars: 3, puntos_ganados: 90, puntos_totales_usuario: 1090 })));
  const result = await request;
  expect(result).toMatchObject({ grade: 'A', score: 90, synced: true, awardedPoints: 90 });
  const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string);
  expect(body).toMatchObject({ grade: 'S', time_taken_seconds: 180, status: 'completed' });
  expect(body).not.toHaveProperty('score');
  expect(JSON.parse(localStorage.getItem('usuario')!)).toMatchObject({ puntos: 1090, racha: 2 });
});

it('reintentar un día completado no borra la victoria del servidor ni duplica el saldo', async () => {
  localStorage.setItem('usuario', JSON.stringify({ id: 7, puntos: 1000 }));
  vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ grade: 'S', score: 100, stars: 3, puntos_ganados: 100, puntos_totales_usuario: 1100 })));
  await saveFinalGameAttempt({ ...partida, status: 'won', grade: 'S' });
  await saveActiveGameProgress({ ...partida, status: 'in_progress', guesses: [] });
  expect(fetch).toHaveBeenCalledTimes(1);
  vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ grade: 'B', score: 75, stars: 2, puntos_ganados: 0, puntos_totales_usuario: 1100 })));
  const result = await saveFinalGameAttempt({ ...partida, status: 'won', grade: 'B' });
  expect(result.awardedPoints).toBe(0);
  expect(JSON.parse(localStorage.getItem('usuario')!).puntos).toBe(1100);
});

it('si falla confirmar la victoria conserva el resultado pendiente sin acreditar puntos', async () => {
  localStorage.setItem('usuario', JSON.stringify({ id: 7, puntos: 1000 }));
  vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 500 }));
  await expect(saveFinalGameAttempt({ ...partida, status: 'won', grade: 'S', score: 100 })).rejects.toThrow('No se pudo confirmar');
  expect(JSON.parse(localStorage.getItem(getActiveProgressStorageKey(partida.gameId, partida.date))!)).toMatchObject({ status: 'won', grade: 'S', synced: false });
  expect(JSON.parse(localStorage.getItem('usuario')!).puntos).toBe(1000);
});
