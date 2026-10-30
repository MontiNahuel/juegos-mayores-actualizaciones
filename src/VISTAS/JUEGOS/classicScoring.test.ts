import { expect, it } from 'vitest';
import { DEFAULT_GRADE_POINTS, DEFAULT_TIME_GRADES, getClassicResult } from './classicScoring';
const config = { puntosPorCalificacion: DEFAULT_GRADE_POINTS, escalasTiempoPorJuego: DEFAULT_TIME_GRADES };
it.each([
  ['sudoku', 180, 'S', 100], ['sudoku', 181, 'A', 90], ['sudoku', 301, 'B', 75], ['sudoku', 481, 'C', 50], ['sudoku', 721, 'D', 25],
  ['crucigrama', 240, 'S', 100], ['crucigrama', 241, 'A', 90], ['crucigrama', 421, 'B', 75], ['crucigrama', 601, 'C', 50], ['crucigrama', 901, 'D', 25],
  ['sopa_letras', 120, 'S', 100], ['sopa_letras', 121, 'A', 90], ['sopa_letras', 241, 'B', 75], ['sopa_letras', 361, 'C', 50], ['sopa_letras', 601, 'D', 25],
] as const)('%s: %s segundos da %s y %s puntos', (game, seconds, grade, score) => {
  expect(getClassicResult(game, 0, seconds, config)).toMatchObject({ grade, score, timeTakenSeconds: seconds });
});
it.each([[1, 'S', 100], [2, 'S', 100], [3, 'B', 75], [4, 'B', 75], [5, 'C', 50], [8, 'C', 50]] as const)('Wordle con %s intentos', (attempts, grade, score) => {
  expect(getClassicResult('wordle', attempts, 10000, config)).toMatchObject({ grade, score });
});
it('respeta escalas y puntos configurados por el back', () => {
  expect(getClassicResult('sudoku', 0, 20, { ...config, escalasTiempoPorJuego: { sudoku: [{ grade: 'A', tiempo_max_segundos: 30, puntos: 42, estrellas: 2 }] } })).toMatchObject({ grade: 'A', score: 42, stars: 2 });
  expect(getClassicResult('wordle', 1, 0, { ...config, puntosPorCalificacion: { S: 130 } }).score).toBe(130);
});
