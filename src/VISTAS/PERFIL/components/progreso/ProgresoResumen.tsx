/* Columna izquierda del progreso: total del año, comparación mensual y mensaje. */
import {
  nombreMesCorto,
  type SerieProgreso,
  type TramoMensaje,
} from '../../utils/perfilUtils';
import { TextoMensaje } from './TextoMensaje';

interface ProgresoResumenProps {
  serie: SerieProgreso;
  actual: string;
  mensaje: TramoMensaje[];
}

export function ProgresoResumen({ serie, actual, mensaje }: ProgresoResumenProps) {
  const signo =
    serie.diferencia > 0 ? 'sube' : serie.diferencia < 0 ? 'baja' : 'igual';
  const delta =
    signo === 'igual'
      ? `${nombreMesCorto(actual)} igual que ${nombreMesCorto(serie.anterior)}`
      : `${nombreMesCorto(actual)} ${signo === 'sube' ? '+' : '−'}${Math.abs(serie.diferencia)} vs ${nombreMesCorto(serie.anterior)}`;

  return (
    <div className="flex min-w-0 flex-col">
      <p
        id="perfil-progreso"
        className="m-0 text-[11px] font-extrabold tracking-[.1em] text-[#8bd9cc] uppercase"
      >
        Tu progreso
      </p>
      <p
        className="mt-[9px] mb-0 text-[13.5px] leading-[1.35] text-menu-copy"
        aria-label={`${serie.totalAnio} medallas en ${serie.anio}`}
      >
        <strong className="block text-[42px] leading-none font-black tracking-[-.02em] text-[#8bd9cc] tabular-nums max-[720px]:text-[36px]">
          {serie.totalAnio}
        </strong>
        medallas en <span>{serie.anio}</span>
      </p>
      <span
        className={`mt-3 inline-flex self-start items-center rounded-full px-2.5 py-[3px] text-[11.5px] font-extrabold whitespace-nowrap ${
          signo === 'sube' ? 'bg-[#8bd9cc]/13 text-[#8bd9cc]' : 'bg-white/6 text-menu-copy'
        }`}
      >
        {delta}
      </span>
      <div className="mt-auto flex min-h-16 flex-col justify-end pt-3">
        <TextoMensaje partes={mensaje} />
      </div>
    </div>
  );
}
