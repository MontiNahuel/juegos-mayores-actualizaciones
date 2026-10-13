// @ts-ignore
import sudoku from 'sudoku';
import { SudokuGrid } from './types';

/**
 * Convierte el array plano de 81 valores (0-8 o null) de la librería 'sudoku'
 * a una matriz 9x9 con números del 1 al 9 (y 0 para celdas vacías).
 */
function rawArrayToGrid(raw: (number | null)[]): SudokuGrid {
  const grid: SudokuGrid = [];
  for (let r = 0; r < 9; r++) {
    const row: number[] = [];
    for (let c = 0; c < 9; c++) {
      const val = raw[r * 9 + c];
      row.push(val !== null && val !== undefined ? val + 1 : 0);
    }
    grid.push(row);
  }
  return grid;
}

/**
 * Genera el puzzle del día con solución única usando la librería 'sudoku'.
 * Implementa persistencia local por fecha (dateKey) para que durante todo el día
 * el usuario juegue exactamente el mismo tablero aunque recargue la pantalla.
 */
export function generateDailyPuzzle(dateKey: string): { initialBoard: SudokuGrid; solution: SudokuGrid } {
  const cacheKey = `sudoku_daily_puzzle_${dateKey}`;
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed.initialBoard && parsed.solution) {
        return parsed;
      }
    } catch {
      // Si falla la lectura, se vuelve a generar
    }
  }

  // Generación matemática con solución única de la librería
  const rawPuzzle = sudoku.makepuzzle();
  const rawSolution = sudoku.solvepuzzle(rawPuzzle);

  const result = {
    initialBoard: rawArrayToGrid(rawPuzzle),
    solution: rawArrayToGrid(rawSolution),
  };

  try {
    localStorage.setItem(cacheKey, JSON.stringify(result));
  } catch {
    // Manejo silencioso si localStorage está lleno
  }

  return result;
}

/**
 * REGLAS ESTRICTAS DEL SUDOKU (Fila, Columna y Bloque 3x3)
 * Comprueba si un número ya existe en su fila, columna o bloque 3x3
 */
export function hasConflict(grid: number[][], row: number, col: number, num: number): boolean {
  if (num === 0) return false;

  // 1. Fila
  for (let c = 0; c < 9; c++) {
    if (c !== col && grid[row][c] === num) return true;
  }

  // 2. Columna
  for (let r = 0; r < 9; r++) {
    if (r !== row && grid[r][col] === num) return true;
  }

  // 3. Bloque 3x3
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const curR = startRow + r;
      const curC = startCol + c;
      if ((curR !== row || curC !== col) && grid[curR][curC] === num) {
        return true;
      }
    }
  }

  return false;
}
