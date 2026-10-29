/* Muestra cómo terminó el desafío y permite seguir navegando. */
import { useId } from 'react';
import type { DayChallenge } from '../CALENDAR/types';
import { ModalBase } from './ModalBase';
import { GamePerformance, type GamePerformanceProps } from './GamePerformance';

type Juego = 'wordle' | 'sudoku' | 'sopa_letras' | 'crucigrama';
type Palabra = string | { word: string; clue?: string; direction?: string; number?: number };

interface CompletedModalProps {
  gameId: Juego;
  challenge?: Partial<DayChallenge>;
  dateStr?: string;
  stars?: number;
  performance?: GamePerformanceProps;
  isGameOver?: boolean;
  onRestart?: () => void;
  onClose: () => void;
  closeLabel?: string;
}

const textos: Record<Juego, { titulo: string; descripcion: string }> = {
  wordle: { titulo: '¡Palabra descubierta!', descripcion: '¡Excelente! Completaste la palabra del día.' },
  sudoku: { titulo: '¡Desafío completado!', descripcion: '¡Excelente trabajo! Ejercitaste tu concentración y completaste el tablero de hoy.' },
  sopa_letras: { titulo: '¡Sopa de letras completada!', descripcion: '¡Excelente! Encontraste todas las palabras del desafío.' },
  crucigrama: { titulo: '¡Crucigrama completado!', descripcion: '¡Excelente! Resolviste todas las palabras del crucigrama.' },
};

// Muestra cómo terminó el desafío y permite seguir navegando.
export function CompletedModal({ gameId, challenge, dateStr, stars, performance, isGameOver: gameOver = false, onRestart, onClose, closeLabel = 'Volver al calendario' }: CompletedModalProps) {
  const titleId = useId();
  const isGameOver = gameOver || (performance !== undefined && performance.remainingLives <= 0);
  const config = challenge?.config;
  const registro = challenge?.completedData;
  const estrellas = Math.max(0, Math.min(3, stars ?? challenge?.stars ?? registro?.stars ?? 3));
  const palabra = registro?.word ?? config?.solution;
  const intentos = challenge?.attempts ?? registro?.attempts;
  const segundos = registro?.gameData?.timeTaken ?? config?.timeTaken;
  const puntaje = challenge?.score ?? registro?.score;
  const palabras: Palabra[] = config?.words ?? registro?.guesses ?? [];
  const detalles = [
    ...(gameId === 'wordle' && palabra ? [{ etiqueta: isGameOver ? 'La palabra era' : 'Palabra descubierta', valor: palabra }] : []),
    ...(gameId === 'wordle' && intentos != null ? [{ etiqueta: 'Intentos', valor: String(intentos) }] : []),
    ...(config?.theme ? [{ etiqueta: 'Tema', valor: config.theme }] : []),
    ...(puntaje != null ? [{ etiqueta: 'Puntos', valor: puntaje }] : []),
    ...(typeof segundos === 'number' && Number.isFinite(segundos) ? [{ etiqueta: 'Tiempo', valor: `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}` }] : []),
  ];
  const boton = 'min-h-12 w-full rounded-xl px-4 py-3 text-sm font-bold transition-colors';

  return (
    <ModalBase isOpen onClose={onClose} labelledBy={titleId}>
      <div className="space-y-4 p-5 text-center text-slate-700 sm:p-6">
        <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-3xl ${isGameOver ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'}`} aria-hidden="true">
          {isGameOver ? '💔' : '✓'}
        </div>
        <div>
          <h2 id={titleId} className="text-xl font-extrabold text-[#294C6B]">{isGameOver ? (gameId === 'wordle' ? '¡Buen intento!' : '¡Sin vidas restantes!') : textos[gameId].titulo}</h2>
          {(dateStr ?? challenge?.dateStr) && <p className="mt-1 text-sm text-slate-500">{dateStr ?? challenge?.dateStr}</p>}
        </div>
        <p className="text-sm leading-relaxed">{isGameOver ? (gameId === 'wordle' ? 'El ejercicio diario mantiene tu mente ágil. ¡Podés volver a intentarlo!' : 'Partida finalizada. Podés volver a jugar desde cero.') : textos[gameId].descripcion}</p>
        {performance ? (
          <GamePerformance {...performance} remainingLives={isGameOver ? 0 : performance.remainingLives} />
        ) : !isGameOver && <div className="flex justify-center gap-1 text-3xl" aria-label={`${estrellas} de 3 estrellas`}>{[0, 1, 2].map(/* Prepara el resultado de cada elemento. */ i => <span key={i} aria-hidden="true" className={i < estrellas ? 'text-amber-400' : 'text-slate-200'}>★</span>)}</div>}
        {(!isGameOver || gameId === 'wordle') && detalles.length > 0 && (
          <dl className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
            {detalles.map(/* Prepara el resultado de cada elemento. */ ({ etiqueta, valor }) => <div key={etiqueta} className="flex flex-wrap justify-between gap-x-3 gap-y-1"><dt>{etiqueta}</dt><dd className="min-w-0 break-words font-bold text-[#294C6B]">{valor}</dd></div>)}
          </dl>
        )}
        {!isGameOver && gameId !== 'wordle' && palabras.length > 0 && (
          <ul className="space-y-2 text-left text-sm">
            {palabras.map(/* Prepara el resultado de cada elemento. */ (item, i) => <li key={i} className="break-words rounded-xl border border-slate-200 p-3"><strong>{typeof item === 'string' ? item : `${item.number ? `${item.number}. ` : ''}${item.word}`}</strong>{typeof item !== 'string' && item.clue && <p className="mt-1 text-slate-500">{item.clue}</p>}</li>)}
          </ul>
        )}
        <div className="flex flex-col gap-2">
          {(isGameOver || gameId === 'wordle') && onRestart && <button type="button" onClick={onRestart} className={`${boton} bg-slate-100 hover:bg-slate-200`}>Jugar de nuevo</button>}
          <button type="button" onClick={onClose} className={`${boton} bg-[#294C6B] text-white hover:bg-[#1E364D]`}>{closeLabel}</button>
        </div>
      </div>
    </ModalBase>
  );
}
