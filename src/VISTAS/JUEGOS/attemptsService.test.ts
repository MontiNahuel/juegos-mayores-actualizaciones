import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { getActiveProgressStorageKey, saveActiveGameProgress } from './attemptsService';

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
