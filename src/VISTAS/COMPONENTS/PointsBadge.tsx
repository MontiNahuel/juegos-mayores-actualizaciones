import { StarIcon } from './Icons/Icons';

/** Saldo y costos comparten la misma ficha de puntos que la barra de navegación. */
export function PointsBadge({ points, unit }: { points: number; unit?: 'pts' | 'puntos' }) {
  return <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#8FD5CA] bg-[#E8F8F5] px-2.5 py-1 text-xs font-extrabold text-[#17695F]" aria-label={`${points} puntos`}>
    <StarIcon size={14} />
    <span>{points}{unit ? ` ${unit}` : ''}</span>
  </span>;
}
