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
  errors?: number;
  updatedAt: string;
}

function getStorageKey(date: string, difficulty: CrucigramaDifficulty): string {
  return `${getActiveProgressStorageKey('crucigrama', date)}_${difficulty}`;
}

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

export function clearActiveCrucigrama(date: string, difficulty: CrucigramaDifficulty): void {
  try {
    const key = getStorageKey(date, difficulty);
    localStorage.removeItem(key);
  } catch (err) {
    console.warn('[CrucigramaStorage] Error clearing active game state:', err);
  }
}
