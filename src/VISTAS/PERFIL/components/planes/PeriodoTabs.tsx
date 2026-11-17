/* Selector Mensual/Anual con la nota del periodo activo. */
import type { PeriodoCobro } from '../../services/planesService';
import type { CambioPeriodo } from './planesPeriodo';

const PERIODOS: { id: PeriodoCobro; etiqueta: string }[] = [
  { id: 'mensual', etiqueta: 'Mensual' },
  { id: 'anual', etiqueta: 'Anual' },
];

interface PeriodoTabsProps {
  periodoActivo: PeriodoCobro;
  cambio: CambioPeriodo | null;
  onCambiar: (periodo: PeriodoCobro) => void;
}

export function PeriodoTabs({ periodoActivo, cambio, onCambiar }: PeriodoTabsProps) {
  return (
    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div
        role="group"
        aria-label="Periodo de cobro"
        className="inline-flex self-start rounded-xl border border-slate-200 bg-slate-50 p-1"
      >
        {PERIODOS.map(({ id, etiqueta }) => {
          const activo = periodoActivo === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={activo}
              onClick={() => onCambiar(id)}
              className={`min-h-9 cursor-pointer rounded-lg px-4 font-[inherit] text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294C6B] ${
                activo
                  ? 'bg-[#294C6B] text-white shadow-sm'
                  : 'text-slate-500 hover:text-[#294C6B]'
              }`}
            >
              {etiqueta}
            </button>
          );
        })}
      </div>
      <p
        key={cambio ? `nota-${cambio.id}` : 'nota'}
        className={`planes-nota m-0 text-[11px] font-medium text-slate-400${
          cambio ? ' planes-nota-entra' : ''
        }`}
      >
        {periodoActivo === 'anual'
          ? 'Precio por mes con descuento; se cobra una vez por año.'
          : 'Se renueva todos los meses.'}
      </p>
    </div>
  );
}
