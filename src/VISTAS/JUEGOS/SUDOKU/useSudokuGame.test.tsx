import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSudokuGame } from './useSudokuGame';
import { getActiveProgressStorageKey } from '../attemptsService';

vi.mock('../../../context/PlayerEconomyContext', () => ({
  usePlayerEconomy: () => ({
    abrirComprarPista: vi.fn(),
    puntosPorCalificacion: { S: 100, A: 90, B: 75, C: 50, F: 0 },
    escalasTiempoPorJuego: {},
  }),
}));

function buildValidSolution() {
  return Array.from({ length: 9 }, (_, r) =>
    Array.from({ length: 9 }, (_, c) => ((r * 3 + Math.floor(r / 3) + c) % 9) + 1),
  );
}

function setupSavedBoard(date: string, emptyCoords: Array<[number, number]>) {
  const solution = buildValidSolution();
  const emptySet = new Set(emptyCoords.map(([r, c]) => `${r}-${c}`));
  const cells = solution.map((row, r) =>
    row.map((value, c) => {
      const isEmpty = emptySet.has(`${r}-${c}`);
      return {
        row: r,
        col: c,
        value: isEmpty ? 0 : value,
        initial: !isEmpty,
        error: false,
        notes: [],
      };
    }),
  );

  localStorage.setItem(
    getActiveProgressStorageKey('sudoku', date),
    JSON.stringify({
      gameId: 'sudoku',
      date,
      status: 'in_progress',
      guesses: [],
      attempts: 0,
      gameData: { difficultyLevel: 1, cells, solution, errors: 0 },
    }),
  );
}

describe('useSudokuGame', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    localStorage.clear();
  });

  it('no marca en rojo una jugada correcta cuando otra celda de la misma fila/bloque tiene ese número con error temporal', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const date = '2026-11-16';
    // En la solución: (0,0) = 1 y (0,1) = 2 (misma fila y mismo bloque 3x3)
    setupSavedBoard(date, [
      [0, 0],
      [0, 1],
      [0, 2],
    ]);

    const wrapper = ({ children }: { children: ReactNode }) => (
      <MemoryRouter initialEntries={[{ pathname: '/juegos/sudoku/jugar', state: { challenge: { dateKey: date } } }]}>
        {children}
      </MemoryRouter>
    );

    const { result } = renderHook(useSudokuGame, { wrapper });
    await waitFor(() => expect(result.current.progressReady).toBe(true));

    // 1) Ingresa un 2 incorrecto en (0,0): queda en rojo esperando desaparecer.
    act(() => result.current.selectCell(0, 0));
    act(() => result.current.inputNumber(2));

    expect(result.current.cells[0][0]).toMatchObject({ value: 2, error: true });
    expect(result.current.errors).toBe(1);

    // 2) Antes de que pase 1 segundo, coloca el 2 correcto en (0,1).
    act(() => result.current.selectCell(0, 1));
    act(() => result.current.inputNumber(2));

    expect(result.current.cells[0][1]).toMatchObject({ value: 2, error: false });
    expect(result.current.errors).toBe(1);

    // 3) Al pasar 1 segundo, desaparece sólo la celda errónea y la correcta permanece intacta.
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.cells[0][0]).toMatchObject({ value: 0, error: false });
    expect(result.current.cells[0][1]).toMatchObject({ value: 2, error: false });
  });

  it('permite corregir la misma celda antes de que venza el temporizador del error anterior', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const date = '2026-11-17';
    setupSavedBoard(date, [
      [0, 0],
      [0, 1],
    ]);

    const wrapper = ({ children }: { children: ReactNode }) => (
      <MemoryRouter initialEntries={[{ pathname: '/juegos/sudoku/jugar', state: { challenge: { dateKey: date } } }]}>
        {children}
      </MemoryRouter>
    );

    const { result } = renderHook(useSudokuGame, { wrapper });
    await waitFor(() => expect(result.current.progressReady).toBe(true));

    // Primero ingresa 2 (incorrecto) en (0,0), y antes de 1s lo corrige a 1 (correcto).
    act(() => result.current.selectCell(0, 0));
    act(() => result.current.inputNumber(2));
    expect(result.current.cells[0][0]).toMatchObject({ value: 2, error: true });

    act(() => result.current.inputNumber(1));
    expect(result.current.cells[0][0]).toMatchObject({ value: 1, error: false });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.cells[0][0]).toMatchObject({ value: 1, error: false });
  });
});
