export type ClassicGameId = 'wordle' | 'sudoku' | 'crucigrama' | 'sopa_letras';
export interface TimeGrade {
  grade: string;
  tiempo_max_segundos: number;
  puntos: number;
  estrellas: number;
  titulo?: string;
  descripcion?: string;
}
export interface ClassicResult {
  grade: string;
  score: number;
  stars: number;
  timeTakenSeconds?: number;
  awardedPoints?: number;
}
export interface ScoringConfig {
  puntosPorCalificacion: Record<string, number>;
  escalasTiempoPorJuego: Partial<Record<ClassicGameId, TimeGrade[]>>;
}

export const DEFAULT_GRADE_POINTS = { S: 100, A: 90, B: 75, C: 50, D: 25, F: 0 };
const limits = { sudoku: [180, 300, 480, 720], crucigrama: [240, 420, 600, 900], sopa_letras: [120, 240, 360, 600] };
export const DEFAULT_TIME_GRADES = Object.fromEntries(Object.entries(limits).map(([game, times]) => [game,
  [...times, 999999].map((limit, i) => ({ grade: ['S', 'A', 'B', 'C', 'D'][i], tiempo_max_segundos: limit,
    puntos: [100, 90, 75, 50, 25][i], estrellas: [3, 3, 2, 1, 1][i] })),
])) as ScoringConfig['escalasTiempoPorJuego'];

export function getClassicResult(game: ClassicGameId, attempts: number, seconds: number, config: ScoringConfig): ClassicResult {
  if (game === 'wordle') {
    const grade = attempts <= 2 ? 'S' : attempts <= 4 ? 'B' : 'C';
    return { grade, score: config.puntosPorCalificacion[grade] ?? DEFAULT_GRADE_POINTS[grade], stars: grade === 'S' ? 3 : grade === 'B' ? 2 : 1 };
  }
  const scales = [...(config.escalasTiempoPorJuego[game]?.length ? config.escalasTiempoPorJuego[game]! : DEFAULT_TIME_GRADES[game]!)].sort((a, b) => a.tiempo_max_segundos - b.tiempo_max_segundos);
  const scale = scales.find(item => seconds <= item.tiempo_max_segundos) ?? scales[scales.length - 1];
  return { grade: scale.grade, score: scale.puntos, stars: scale.estrellas, timeTakenSeconds: seconds };
}
