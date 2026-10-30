/* Guarda el Sudoku en el navegador para seguirlo después de recargar. */
/**
 * sudokuStorage.ts
 * Manejador de persistencia local (localStorage) para el estado en tiempo real de Sudoku.
 * 
 * Reglas de negocio:
 * 1. Partida activa (in_progress): se almacena exclusivamente en localStorage para evitar
 *    saturar la base de datos con decenas de llamadas HTTP por cada número o nota colocada.
 * 2. Derrota (sin vidas): NO se envía a la base de datos. Se limpia la clave local para
 *    permitir reintentos ilimitados sin penalizar el progreso del usuario.
 * 3. Victoria: se limpia la clave local y se sincroniza definitivamente con la base de datos.
 * 4. Aislamiento por usuario: utiliza getActiveProgressStorageKey para no mezclar partidas entre
 *    usuarios autenticados y modo invitado.
 */

import { getActiveProgressStorageKey } from '../attemptsService';
import { SudokuCell, SudokuGrid, DifficultyLevel } from './types';

export interface SudokuSavedProgress {
  date: string;
  difficultyLevel: DifficultyLevel;
  cells: SudokuCell[][];
  solution: SudokuGrid;
  lives: number;
  errors: number;
  hintsLeft: number;
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
 * Guarda el estado actual de la partida en localStorage de forma instantánea y sincrónica.
 */
export function saveSudokuLocalProgress(data: {
  date: string;
  difficultyLevel: DifficultyLevel;
  cells: SudokuCell[][];
  solution: SudokuGrid;
  lives: number;
  errors: number;
  hintsLeft: number;
}): void {
  try {
    const key = getActiveProgressStorageKey('sudoku', data.date);
    const payload: SudokuSavedProgress = {
      ...data,
      status: 'in_progress',
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (err) {
    console.error('[sudokuStorage] Error al guardar progreso local:', err);
  }
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
