import { getPerformanceRank, type GamePerformanceProps, type PerformanceRank } from './gamePerformanceRank';
export type { GamePerformanceProps } from './gamePerformanceRank';

const ranks: Record<PerformanceRank, { label: string; description: string; color: string }> = {
  S: { label: '¡Impecable!', description: 'Completaste el juego sin perder vidas.', color: 'border-amber-200 bg-amber-50 text-amber-800' },
  B: { label: '¡Bien hecho!', description: 'Completaste el juego con vidas restantes.', color: 'border-teal-200 bg-teal-50 text-teal-800' },
  D: { label: '¡Hasta el final!', description: 'Completaste el juego con una vida restante.', color: 'border-orange-200 bg-orange-50 text-orange-800' },
  F: { label: 'Sin vidas restantes', description: 'Llegaste a cero vidas. ¡Podés volver a intentarlo!', color: 'border-rose-200 bg-rose-50 text-rose-800' },
};

/** Resumen compartido para los resultados de cualquier juego con vidas. */
export function GamePerformance({ remainingLives, initialLives = 4, livesLost }: GamePerformanceProps) {
  const rank = getPerformanceRank({ remainingLives, initialLives, livesLost });
  const presentation = ranks[rank];

  return (
    <section aria-label="Rendimiento de la partida" className={`rounded-2xl border p-4 ${presentation.color}`}>
      <p className="text-xs font-bold uppercase tracking-widest">Tu rendimiento</p>
      <p aria-label={`Rango ${rank}`} className="my-2 text-6xl font-black leading-none">{rank}</p>
      <p className="font-bold">{presentation.label}</p>
      <p className="mt-1 text-sm leading-relaxed">{presentation.description}</p>
      <p className="mt-3 text-sm font-semibold">Vidas restantes: {remainingLives} de {initialLives}</p>
    </section>
  );
}
