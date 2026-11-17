/* Evolución mensual: curva de medallas de la ventana con récord y promedio. */
import {
  curva,
  formatearMes,
  nombreMesCorto,
  type SerieProgreso,
} from '../../utils/perfilUtils';

interface EvolucionChartProps {
  serie: SerieProgreso;
  actual: string;
}

export function EvolucionChart({ serie, actual }: EvolucionChartProps) {
  const trazo = curva(serie.puntos);
  const primero = serie.puntos[0];
  const ultimo = serie.puntos[serie.puntos.length - 1];
  const detalle = serie.puntos
    .map((punto) => `${formatearMes(punto.mes)} ${punto.total}`)
    .join(', ');
  const referencias = [
    { etiqueta: `Récord ${serie.record}`, valor: serie.record },
    { etiqueta: `Promedio ${serie.promedio}`, valor: serie.promedio },
  ];
  const posicion = (valor: number) => `${(valor / serie.escala) * 100}%`;

  return (
    <>
      <div
        role="img"
        aria-label={`Medallas por mes: ${detalle}. Promedio ${serie.promedio}, récord ${serie.record}.`}
        className="relative h-[136px] max-[720px]:h-[118px]"
      >
        {referencias.map((referencia) => (
          <span
            key={referencia.etiqueta}
            className="absolute left-0 w-[70px] pr-1.5 text-right text-[10px] font-bold whitespace-nowrap text-menu-copy tabular-nums"
            style={{ bottom: `calc(${posicion(referencia.valor)} + 3px)` }}
          >
            {referencia.etiqueta}
          </span>
        ))}

        <div className="absolute inset-y-0 left-[76px] right-0 border-b border-[#3d4f65]">
          {referencias.map((referencia) => (
            <div
              key={`barra-${referencia.etiqueta}`}
              className="absolute right-0 left-0 border-t border-dashed border-[#5b6d84]"
              style={{ bottom: posicion(referencia.valor) }}
            />
          ))}

          <svg
            className="absolute inset-0 size-full overflow-visible"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              className="fill-[#8bd9cc]/14"
              d={`${trazo} L ${ultimo.x} 100 L ${primero.x} 100 Z`}
            />
            <path
              className="fill-none stroke-[#8bd9cc]"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              d={trazo}
            />
          </svg>

          {serie.puntos.map((punto) => (
            <span
              key={punto.mes}
              aria-hidden="true"
              className="absolute size-[9px] -translate-x-1/2 translate-y-1/2 rounded-full bg-[#8bd9cc] shadow-[0_0_0_2px_#2a394c]"
              style={{ left: `${punto.x}%`, bottom: `${100 - punto.y}%` }}
            />
          ))}
          <span
            aria-hidden="true"
            className="absolute -translate-x-1/2 text-xs font-black text-[#8bd9cc] tabular-nums"
            style={{ left: `${ultimo.x}%`, bottom: `calc(${100 - ultimo.y}% + 8px)` }}
          >
            {ultimo.total}
          </span>
        </div>
      </div>

      <div className="relative mt-1.5 ml-[76px] h-[17px]" aria-hidden="true">
        {serie.puntos.map((punto) => (
          <span
            key={punto.mes}
            className={`absolute -translate-x-1/2 text-[10.5px] font-bold whitespace-nowrap capitalize max-[720px]:text-[9.5px] ${
              punto.mes === actual ? 'text-[#8bd9cc]' : 'text-menu-copy'
            }`}
            style={{ left: `${punto.x}%` }}
          >
            {nombreMesCorto(punto.mes)}
          </span>
        ))}
      </div>
    </>
  );
}
