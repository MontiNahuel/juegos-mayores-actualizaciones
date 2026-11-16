/* Mapa de constancia: doce semanas de días con al menos un ingreso. */
import { useMemo } from 'react';
import {
  construirGrillaActividad,
  diasActivos,
  formatearFechaLarga,
} from './perfilUtils';

interface ActividadHeatmapProps {
  desde: string;
  hasta: string;
  actividad: string[];
}

const ESTILO_CELDA =
  'size-4 rounded-[3px] transition-colors max-md:size-3.5';

/** Pinta la actividad diaria en columnas semanales, de lunes a domingo. */
export function ActividadHeatmap({ desde, hasta, actividad }: ActividadHeatmapProps) {
  const semanas = useMemo(
    () => construirGrillaActividad(desde, hasta, actividad),
    [desde, hasta, actividad],
  );
  const total = diasActivos(actividad, desde, hasta);

  return (
    <div className="flex flex-wrap items-start justify-between gap-5">
      <div>
        <div className="flex gap-1" aria-hidden="true" role="presentation">
          {semanas.map((semana, indice) => (
            <div key={indice} className="grid gap-1">
              {semana.celdas.map((celda) => (
                <span
                  key={celda.fecha}
                  className={`${ESTILO_CELDA} ${
                    celda.fuera
                      ? 'bg-transparent'
                      : celda.activa
                        ? 'bg-[#8bd9cc]'
                        : 'bg-[#34465b]'
                  }`}
                  title={`${formatearFechaLarga(celda.fecha)}: ${
                    celda.fuera
                      ? 'fuera de la ventana'
                      : celda.activa
                        ? 'con actividad'
                        : 'sin actividad'
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
        <p className="mt-2.5 mb-0 text-xs leading-normal text-menu-copy">
          Cada columna es una semana · {total}{' '}
          {total === 1 ? 'día con actividad' : 'días con actividad'} en los
          últimos 84 días.
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-menu-copy" aria-hidden="true">
        <span>Menos</span>
        <span className={`${ESTILO_CELDA} bg-[#34465b]`} />
        <span className={`${ESTILO_CELDA} bg-[#8bd9cc]/45`} />
        <span className={`${ESTILO_CELDA} bg-[#8bd9cc]`} />
        <span>Más</span>
      </div>
    </div>
  );
}

export default ActividadHeatmap;
