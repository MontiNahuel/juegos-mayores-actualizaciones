/* Constancia: mapa de actividad y avance hacia el próximo hito de racha. */
import { useMemo } from 'react';
import type { TramoPuntosDiarios } from '../../../utils/rachaUtils';
import { ActividadHeatmap } from './actividad/ActividadHeatmap';
import type { PerfilResumen } from '../services/perfilService';
import { proximoHitoDeRacha, progresoDeRacha } from '../utils/perfilUtils';
import { COPIA_SECCION, PANEL, TITULO_SECCION } from './paneles';

interface ConstanciaSectionProps {
  resumen: PerfilResumen | null;
  racha: number;
  rachaTramosDiarios: TramoPuntosDiarios[];
}

export function ConstanciaSection({
  resumen,
  racha,
  rachaTramosDiarios,
}: ConstanciaSectionProps) {
  const tramos = useMemo(
    () => rachaTramosDiarios.map((tramo) => ({ dias: tramo.dias, valor: tramo.puntos })),
    [rachaTramosDiarios],
  );
  const { siguiente, avance } = useMemo(() => progresoDeRacha(racha, tramos), [racha, tramos]);
  const resumenRacha = proximoHitoDeRacha(racha, tramos);

  return (
    <section className="mt-9" aria-labelledby="perfil-constancia">
      <h2 id="perfil-constancia" className={TITULO_SECCION}>
        Constancia
      </h2>
      <p className={COPIA_SECCION}>
        Los días que jugaste y cuántos desafíos completaste, en el último mes.
      </p>
      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_320px] gap-5 max-[900px]:grid-cols-1">
        <div className={PANEL}>
          {resumen ? (
            <ActividadHeatmap
              desde={resumen.periodo.desde}
              hasta={resumen.periodo.hasta}
              actividad={resumen.actividad}
              completadasPorDia={resumen.completadas_por_dia}
            />
          ) : (
            <div className="h-24 animate-pulse rounded-xl bg-[#34465b]" aria-hidden="true" />
          )}
        </div>
        <div className={`${PANEL} flex flex-col`}>
          <span className="text-sm text-menu-copy">Próximo hito de racha</span>
          {siguiente ? (
            <>
              <strong className="mt-1 text-xl leading-tight font-bold">{siguiente.dias} días</strong>
              <span className="mt-1 text-sm leading-snug text-menu-copy">
                Te faltan {Math.max(0, siguiente.dias - racha)} para ganar{' '}
                {siguiente.valor} puntos por día.
              </span>
              <div
                className="mt-4 h-2 overflow-hidden rounded-full bg-[#34465b]"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(avance * 100)}
                aria-label="Avance hacia el próximo hito de racha"
              >
                <div
                  className="h-full rounded-full bg-[#edd499] transition-[width] duration-500"
                  style={{ width: `${Math.round(avance * 100)}%` }}
                />
              </div>
            </>
          ) : (
            <strong className="mt-1 text-xl leading-tight font-bold">
              ¡Todos los hitos alcanzados!
            </strong>
          )}
          <span className="mt-auto pt-4 text-sm leading-snug text-menu-copy">
            {resumenRacha.alcanzados} de {resumenRacha.total} hitos completados.
          </span>
        </div>
      </div>
    </section>
  );
}

export default ConstanciaSection;
