/* Panel de progreso: evolución mensual y práctica por eje, con mensaje contextual. */
import { useState } from 'react';
import type { MedallasMes } from '../../services/perfilService';
import {
  construirProgreso,
  mensajeEvolucion,
  mensajePractica,
  practicaAnual,
} from '../../utils/perfilUtils';
import { EvolucionChart } from './EvolucionChart';
import { ProgresoResumen } from './ProgresoResumen';
import { ProgresoTabs, type VistaProgreso } from './ProgresoTabs';
import { RadarPractica } from './RadarPractica';

interface ProgresoPanelProps {
  meses: MedallasMes[] | undefined;
  actual: string;
  hasta: string;
}

export function ProgresoPanel({ meses, actual, hasta }: ProgresoPanelProps) {
  const [vista, setVista] = useState<VistaProgreso>('linea');
  const serie = construirProgreso(meses, actual);
  const practica = practicaAnual(meses, actual);
  const mensaje =
    vista === 'linea' ? mensajeEvolucion(serie, hasta) : mensajePractica(practica);

  return (
    <section
      aria-labelledby="perfil-progreso"
      className="mb-[22px] grid grid-cols-[minmax(210px,258px)_minmax(0,1fr)] gap-[26px] rounded-2xl border border-[#4b5d73] bg-menu-panel px-[22px] pt-5 pb-4 max-[720px]:grid-cols-1 max-[720px]:gap-[18px] max-[720px]:px-4 max-[720px]:pt-4 max-[720px]:pb-3"
    >
      <ProgresoResumen serie={serie} actual={actual} mensaje={mensaje} />
      <div className="min-w-0">
        <ProgresoTabs vista={vista} onCambiar={setVista} />
        <div className="relative h-40">
          {vista === 'linea' ? (
            <EvolucionChart serie={serie} actual={actual} />
          ) : (
            <RadarPractica practica={practica} />
          )}
        </div>
      </div>
    </section>
  );
}

export default ProgresoPanel;
