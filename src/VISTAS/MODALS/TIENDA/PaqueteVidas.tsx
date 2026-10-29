import type { TiendaPaquete } from '../../../context/PlayerEconomyContext';
import { IconHeart } from '../../COMPONENTS/GameHeader/LivesBadge';

interface Props {
  paquete: TiendaPaquete;
  puntos: number;
  procesandoId: string | null;
  onCanjear: (paquete: TiendaPaquete) => void;
}

export function PaqueteVidas({ paquete, puntos, procesandoId, onCanjear }: Props) {
  const puedeComprar = puntos >= paquete.puntos;
  return <article className={`grid min-w-0 shrink-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-2xl border-2 p-3 text-left min-[420px]:grid-cols-[auto_minmax(0,1fr)_auto] ${paquete.popular ? 'border-amber-400 bg-amber-50 shadow-sm' : 'border-slate-200 bg-white'}`}>
    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-rose-100" aria-hidden="true"><IconHeart size={22} /></span>
    <div className="min-w-0 [overflow-wrap:anywhere]">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <h3 className="m-0 text-base leading-snug font-black!">+{paquete.vidas} {paquete.vidas === 1 ? 'Vida' : 'Vidas'}</h3>
        {paquete.badge && <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-800 uppercase">{paquete.badge}</span>}
      </div>
      <p className="m-0 mt-1 text-xs leading-relaxed font-semibold text-slate-500">
        Costo: <strong className="text-amber-700">{paquete.puntos} pts</strong>
        {paquete.descuento && <span className="ml-1 inline-block text-green-700">({paquete.descuento})</span>}
      </p>
    </div>
    <button type="button" onClick={() => onCanjear(paquete)} disabled={!puedeComprar || procesandoId !== null}
      aria-label={`Canjear ${paquete.vidas} ${paquete.vidas === 1 ? 'vida' : 'vidas'} por ${paquete.puntos} puntos`}
      className="col-span-full min-h-11 w-full cursor-pointer rounded-xl bg-[#294C6B] px-3 py-2 text-sm font-extrabold whitespace-normal text-white transition-colors hover:bg-[#1f3a52] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294C6B] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 min-[420px]:col-span-1 min-[420px]:w-auto">
      {procesandoId === paquete.id ? 'Canjeando...' : puedeComprar ? 'Canjear' : `Faltan ${paquete.puntos - puntos}`}
    </button>
  </article>;
}
