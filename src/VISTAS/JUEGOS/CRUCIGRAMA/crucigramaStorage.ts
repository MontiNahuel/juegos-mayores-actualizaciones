/* Guarda el crucigrama en el navegador para retomarlo por fecha y dificultad. */
import { getActiveProgressStorageKey } from '../attemptsService';

export type CrucigramaDifficulty = 'facil' | 'dificil';

export interface ActiveCrucigramaState {
  date: string;
  difficulty: CrucigramaDifficulty;
  userGrid: string[][]; // Matriz de letras ingresadas por el usuario (grid_size x grid_size)
  selectedRow: number;
  selectedCol: number;
  selectedDirection: 'H' | 'V';
  elapsedSeconds: number;
  lives?: number;
  failedWordIds?: string[];
  errors?: number;
  updatedAt: string;
}

// Arma la clave que separa la partida por jugador, fecha y dificultad.
function getStorageKey(date: string, difficulty: CrucigramaDifficulty): string {
  return `${getActiveProgressStorageKey('crucigrama', date)}_${difficulty}`;
}

// Guarda las letras y la selección para seguir el crucigrama al volver.
export function saveActiveCrucigrama(
  date: string,
  difficulty: CrucigramaDifficulty,
  state: Omit<ActiveCrucigramaState, 'date' | 'difficulty' | 'updatedAt'>
): void {
  try {
    const key = getStorageKey(date, difficulty);
    const payload: ActiveCrucigramaState = {
      date,
      difficulty,
      ...state,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (err) {
    console.warn('[CrucigramaStorage] Error saving active game state:', err);
  }
}

// Recupera el crucigrama guardado para esa fecha y dificultad.
export function loadActiveCrucigrama(
  date: string,
  difficulty: CrucigramaDifficulty
): ActiveCrucigramaState | null {
  try {
    const key = getStorageKey(date, difficulty);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.userGrid && Array.isArray(parsed.userGrid)) {
      return parsed as ActiveCrucigramaState;
    }
    return null;
  } catch (err) {
    console.warn('[CrucigramaStorage] Error loading active game state:', err);
    return null;
  }
}

// Borra el guardado de ese crucigrama.
export function clearActiveCrucigrama(date: string, difficulty: CrucigramaDifficulty): void {
  try {
    const key = getStorageKey(date, difficulty);
    localStorage.removeItem(key);
  } catch (err) {
    console.warn('[CrucigramaStorage] Error clearing active game state:', err);
  }
}
