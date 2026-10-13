// @ts-ignore
import sudoku from 'sudoku';
import { SudokuGrid, DifficultyLevel } from './types';

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
 * Genera el puzzle del día con solución única según el nivel de dificultad numérico:
 * - Nivel 1 (Fácil / Bajo): ~43 pistas (revela +18 números de la solución)
 * - Nivel 2 (Medio): ~35 pistas (revela +10 números de la solución)
 * - Nivel 3 (Alto / Difícil): ~25 pistas (tablero base generado por la librería)
 */
export function generateDailyPuzzle(
  dateKey: string,
  level: DifficultyLevel = 1
): { initialBoard: SudokuGrid; solution: SudokuGrid } {
  const cacheKey = `sudoku_daily_puzzle_${dateKey}_lvl_${level}`;
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed.initialBoard && parsed.solution) {
        return parsed;
      }
    } catch {}
  }

  // Generación matemática con solución única de la librería
  const rawPuzzle: (number | null)[] = sudoku.makepuzzle();
  const rawSolution: (number | null)[] = sudoku.solvepuzzle(rawPuzzle);

  // Cuántas pistas adicionales revelar según el nivel 1, 2 o 3
  const extraCluesToReveal = level === 1 ? 18 : level === 2 ? 10 : 0;

  if (extraCluesToReveal > 0) {
    const emptyIndices: number[] = [];
    rawPuzzle.forEach((val, idx) => {
      if (val === null) emptyIndices.push(idx);
    });

    // Desordenar determinista o aleatoriamente para revelar de forma balanceada
    for (let i = emptyIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [emptyIndices[i], emptyIndices[j]] = [emptyIndices[j], emptyIndices[i]];
    }

    const indicesToFill = emptyIndices.slice(0, extraCluesToReveal);
    indicesToFill.forEach(idx => {
      rawPuzzle[idx] = rawSolution[idx];
    });
  }

  const result = {
    initialBoard: rawArrayToGrid(rawPuzzle),
    solution: rawArrayToGrid(rawSolution),
  };

  try {
    localStorage.setItem(cacheKey, JSON.stringify(result));
  } catch {}

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
