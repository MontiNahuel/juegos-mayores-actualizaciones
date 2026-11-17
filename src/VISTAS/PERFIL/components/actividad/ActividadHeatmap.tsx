/* Mapa de constancia: el último mes, con el tono según los desafíos del día. */
import { useMemo } from 'react';
import {
  construirGrillaActividad,
  desafiosCompletados,
  diasActivos,
  formatearFechaLarga,
  inicioConstancia,
  type NivelActividad,
} from '../../utils/perfilUtils';

interface ActividadHeatmapProps {
  desde: string;
  hasta: string;
  actividad: string[];
  completadasPorDia?: Record<string, number>;
}

const INICIALES_DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const ESTILO_NIVEL: Record<NivelActividad, string> = {
  0: 'bg-[#34465b]',
  1: 'bg-[#8bd9cc]/30',
  2: 'bg-[#8bd9cc]/60',
  3: 'bg-[#8bd9cc]',
};

const ESTILO_CELDA = 'size-7 rounded-[6px] transition-colors max-md:size-6';

function descripcionDia(completadas: number): string {
  if (completadas === 1) return '1 desafío completado';
  return `${completadas} desafíos completados`;
}

/** Pinta el último mes en filas semanales, de lunes a domingo. */
export function ActividadHeatmap({
  desde,
  hasta,
  actividad,
  completadasPorDia,
}: ActividadHeatmapProps) {
  const inicio = inicioConstancia(hasta);
  const desdeVisible = desde > inicio ? desde : inicio;
  const semanas = useMemo(
    () => construirGrillaActividad(desdeVisible, hasta, actividad, completadasPorDia),
    [desdeVisible, hasta, actividad, completadasPorDia],
  );
  const total = diasActivos(actividad, desdeVisible, hasta);
  const completadas = desafiosCompletados(completadasPorDia, desdeVisible, hasta);
  const diasTexto =
    total === 1 ? '1 día con actividad' : `${total} días con actividad`;
  const desafiosTexto =
    completadas === 1 ? '1 desafío completado' : `${completadas} desafíos completados`;

  return (
    <div className="flex flex-wrap items-start justify-between gap-5">
      <div>
        <div
          className="inline-grid grid-cols-7 gap-1.5 align-top"
          aria-hidden="true"
          role="presentation"
        >
          {INICIALES_DIAS.map((inicial, indice) => (
            <span
              key={`dia-${indice}`}
              className="flex justify-center pb-0.5 text-xs leading-none font-semibold text-menu-copy"
            >
              {inicial}
            </span>
          ))}
          {semanas.flatMap((semana) => semana.celdas).map((celda) => (
            <span
              key={celda.fecha}
              className={`${ESTILO_CELDA} ${
                celda.fuera
                  ? 'bg-transparent'
                  : ESTILO_NIVEL[celda.nivel]
              } ${celda.esHoy ? 'ring-1 ring-[#edd499] ring-inset' : ''}`}
              title={`${formatearFechaLarga(celda.fecha)}: ${
                celda.fuera ? 'todavía no llega' : descripcionDia(celda.completadas)
              }`}
            />
          ))}
        </div>
        <p className="mt-2.5 mb-0 text-xs leading-normal text-menu-copy">
          Cada fila es una semana. {diasTexto} y {desafiosTexto} en el último mes.
        </p>
      </div>
      <div
        className="flex items-center gap-1.5 pt-1 text-xs text-menu-copy"
        aria-hidden="true"
      >
        <span className="mr-1">Desafíos por día</span>
        {([0, 1, 2, 3] as NivelActividad[]).map((nivel) => (
          <span
            key={nivel}
            className={`size-4 rounded-[4px] ${ESTILO_NIVEL[nivel]}`}
          />
        ))}
      </div>
    </div>
  );
}

export default ActividadHeatmap;
