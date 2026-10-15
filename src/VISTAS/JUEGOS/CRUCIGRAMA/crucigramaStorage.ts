import { getActiveProgressStorageKey, getCurrentUserId } from '../attemptsService';

export interface ActiveCrucigramaState {
  date: string;
  userGrid: string[][]; // 7x7 matrix of user-entered letters
  selectedRow: number;
  selectedCol: number;
  selectedDirection: 'H' | 'V';
  elapsedSeconds: number;
  updatedAt: string;
}

export function saveActiveCrucigrama(date: string, state: Omit<ActiveCrucigramaState, 'date' | 'updatedAt'>): void {
  try {
    const key = getActiveProgressStorageKey('crucigrama', date);
    const payload: ActiveCrucigramaState = {
      date,
      ...state,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (err) {
    console.warn('[CrucigramaStorage] Error saving active game state:', err);
  }
}

export function loadActiveCrucigrama(date: string): ActiveCrucigramaState | null {
  try {
    const key = getActiveProgressStorageKey('crucigrama', date);
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

export function clearActiveCrucigrama(date: string): void {
  try {
    const key = getActiveProgressStorageKey('crucigrama', date);
    localStorage.removeItem(key);
  } catch (err) {
    console.warn('[CrucigramaStorage] Error clearing active game state:', err);
  }
}
