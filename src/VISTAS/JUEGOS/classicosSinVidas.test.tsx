import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useSudokuGame } from './SUDOKU/useSudokuGame';
import { useGameLives } from './PUZZLES/useGameLives';
import { getActiveProgressStorageKey } from './attemptsService';

const m = vi.hoisted(() => ({ pista: vi.fn(), gastar: vi.fn() }));
vi.mock('../../context/PlayerEconomyContext', () => ({ usePlayerEconomy: () => ({ abrirComprarPista: m.pista, gastarPuntos: m.gastar }) }));
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
  expect(m.gastar).not.toHaveBeenCalled();
  const saved = JSON.parse(localStorage.getItem(getActiveProgressStorageKey('sudoku', date))!);
  expect(saved.status).toBe('in_progress');
  expect(saved.gameData).not.toHaveProperty('lives');
});

it('conserva el contador y la recarga en el hook reservado para Puzzles', () => {
  const failed = vi.fn();
  const { result } = renderHook(() => useGameLives('puzzle', '2026-10-30', failed));
  expect(result.current.lives).toBe(4);
  act(() => { for (let i = 0; i < 4; i++) result.current.consumeLife(); });
  expect(result.current.lives).toBe(0);
  expect(result.current.modal.props.isOpen).toBe(true);
  act(() => result.current.modal.props.onClose());
  expect(failed).toHaveBeenCalledOnce();
});
