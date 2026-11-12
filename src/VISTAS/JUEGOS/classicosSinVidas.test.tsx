import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useSudokuGame } from './SUDOKU/useSudokuGame';
import { getActiveProgressStorageKey } from './attemptsService';

const m = vi.hoisted(() => ({ pista: vi.fn() }));
vi.mock('../../context/PlayerEconomyContext', () => ({ usePlayerEconomy: () => ({ abrirComprarPista: m.pista }) }));
beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); });
afterEach(() => { cleanup(); localStorage.clear(); });

it('Sudoku recupera partidas antiguas sin vidas y permite seguir jugando y comprar pistas', async () => {
  const date = '2026-10-30';
  const solution = Array.from({ length: 9 }, (_, r) => Array.from({ length: 9 }, (_, c) => (r * 3 + Math.floor(r / 3) + c) % 9 + 1));
  const cells = solution.map((row, r) => row.map((value, c) => ({ row: r, col: c, value: r === 0 && c === 0 ? 0 : value, initial: !(r === 0 && c === 0), error: false, notes: [] })));
  localStorage.setItem(getActiveProgressStorageKey('sudoku', date), JSON.stringify({
    gameId: 'sudoku', date, status: 'failed', guesses: [], attempts: 4,
    gameData: { difficultyLevel: 1, cells, solution, errors: 4, lives: 0 },
  }));
  const wrapper = ({ children }: any) => <MemoryRouter initialEntries={[{ pathname: '/juegos/sudoku/jugar', state: { challenge: { dateKey: date } } }]}>{children}</MemoryRouter>;
  const { result } = renderHook(useSudokuGame, { wrapper });
  await waitFor(() => expect(result.current.progressReady).toBe(true));
  act(() => result.current.selectCell(0, 0));
  for (let i = 0; i < 5; i++) act(() => result.current.inputNumber(9));
  expect(result.current.errors).toBe(9);
  act(() => result.current.useHint());
  expect(m.pista).toHaveBeenCalledOnce();
  const saved = JSON.parse(localStorage.getItem(getActiveProgressStorageKey('sudoku', date))!);
  expect(saved.status).toBe('in_progress');
  expect(saved.gameData).not.toHaveProperty('lives');
});

it('Sudoku marca error en celda incorrecta y la borra automáticamente tras 1 segundo', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  try {
    const date = '2026-10-31';
    const solution = Array.from({ length: 9 }, (_, r) => Array.from({ length: 9 }, (_, c) => ((r * 3 + Math.floor(r / 3) + c) % 9) + 1));
    const cells = solution.map((row, r) => row.map((value, c) => ({ row: r, col: c, value: r === 0 && c === 0 ? 0 : value, initial: !(r === 0 && c === 0), error: false, notes: [] })));
    localStorage.setItem(getActiveProgressStorageKey('sudoku', date), JSON.stringify({
      gameId: 'sudoku', date, status: 'in_progress', guesses: [], attempts: 0,
      gameData: { difficultyLevel: 1, cells, solution, errors: 0 },
    }));
    const wrapper = ({ children }: any) => <MemoryRouter initialEntries={[{ pathname: '/juegos/sudoku/jugar', state: { challenge: { dateKey: date } } }]}>{children}</MemoryRouter>;
    const { result } = renderHook(useSudokuGame, { wrapper });
    await waitFor(() => expect(result.current.progressReady).toBe(true));

    act(() => result.current.selectCell(0, 0));
    // Solución en (0,0) es 1. Ingresamos 9 (incorrecto).
    act(() => result.current.inputNumber(9));

    expect(result.current.cells[0][0].value).toBe(9);
    expect(result.current.cells[0][0].error).toBe(true);
    expect(result.current.errors).toBe(1);

    // Al transcurrir 1 segundo, se borra automáticamente
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.cells[0][0].value).toBe(0);
    expect(result.current.cells[0][0].error).toBe(false);
  } finally {
    vi.useRealTimers();
  }
});
