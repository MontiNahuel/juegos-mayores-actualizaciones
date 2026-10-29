export interface GamePerformanceProps {
  remainingLives: number;
  initialLives?: number;
  /** Vidas perdidas durante toda la partida, incluso si después se recargaron. */
  livesLost?: number;
}

export type PerformanceRank = 'S' | 'B' | 'D' | 'F';

export function getPerformanceRank({ remainingLives, initialLives = 4, livesLost }: GamePerformanceProps): PerformanceRank {
  if (remainingLives <= 0) return 'F';
  if (remainingLives === initialLives && (livesLost === undefined || livesLost === 0)) return 'S';
  if (remainingLives === 1) return 'D';
  return 'B';
}
