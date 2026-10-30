// Lee partidas locales antiguas de Sudoku y permite limpiar una partida al reiniciar.
import { getActiveProgressStorageKey } from '../attemptsService';
import { SudokuCell, SudokuGrid, DifficultyLevel } from './types';

export interface SudokuSavedProgress {
  date: string;
  difficultyLevel: DifficultyLevel;
  cells: SudokuCell[][];
  solution: SudokuGrid;
  lives: number;
  errors: number;
  status: 'in_progress' | 'won' | 'completed';
  updatedAt: string;
}

/**
 * Obtiene la partida en curso guardada para una fecha específica.
 * Devuelve null si no existe, si está corrupta o si ya fue completada.
 */
export function getSudokuLocalProgress(dateKey: string): SudokuSavedProgress | null {
  try {
    const key = getActiveProgressStorageKey('sudoku', dateKey);
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const progress = JSON.parse(raw);
    const parsed = progress.gameData?.cells ? { ...progress.gameData, status: progress.status, date: dateKey } : progress;
    if (
      parsed &&
      parsed.status === 'in_progress' &&
      Array.isArray(parsed.cells) &&
      parsed.cells.length === 9 &&
      parsed.difficultyLevel
    ) {
      return parsed as SudokuSavedProgress;
    }
  } catch (err) {
    console.warn('[sudokuStorage] Error al leer progreso local:', err);
  }
  return null;
}

/**
 * Limpia la partida guardada en localStorage (al ganar, al perder o al reiniciar).
 */
export function clearSudokuLocalProgress(dateKey: string): void {
  try {
    const key = getActiveProgressStorageKey('sudoku', dateKey);
    localStorage.removeItem(key);
  } catch (err) {
    console.error('[sudokuStorage] Error al borrar progreso local:', err);
  }
}
