/* Muestra las vidas y los puntos disponibles en la tienda. */
import { IconHeart } from '../../GameHeader/LivesBadge';
import { StarIcon } from '../../Icons/Icons';

// Muestra las vidas y los puntos disponibles en la tienda.
export function SaldoTienda({ puntos, vidas }: { puntos: number; vidas: number }) {
  return <div className="grid min-w-0 grid-cols-2 divide-x divide-slate-200 rounded-2xl border border-slate-200 bg-slate-50 px-2 py-3 text-sm font-extrabold" aria-label="Saldo disponible">
    <div className="flex min-w-0 flex-wrap items-center justify-center gap-1.5 px-1 text-green-800">
      <StarIcon size={18} className="shrink-0 text-amber-500" /><span className="[overflow-wrap:anywhere]">{puntos} puntos</span>
    </div>
    <div className={`flex min-w-0 flex-wrap items-center justify-center gap-1.5 px-1 ${vidas > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
      <IconHeart size={18} filled={vidas > 0} /><span className="[overflow-wrap:anywhere]">{vidas} {vidas === 1 ? 'vida' : 'vidas'}</span>
    </div>
  </div>;
}
