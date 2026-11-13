/* Muestra el avance de la racha diaria y cuánto falta para el próximo hito. */
import { useEffect, useId, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { flameOutline } from 'ionicons/icons';
import { usePlayerEconomy } from '../../../context/PlayerEconomyContext';
import type { RachaTramo } from '../../../store/playerEconomySlice';
import { ModalBase } from './ModalBase';

interface StreakProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StreakProgressModal({ isOpen, onClose }: StreakProgressModalProps) {
  const { racha, bonusRacha, recargarEconomia } = usePlayerEconomy();
  const titleId = useId();
  const [animado, setAnimado] = useState(false);

  // Los hitos viven en la configuración de economía; al abrir se revalida para no mostrar valores viejos.
  useEffect(() => {
    if (isOpen) void recargarEconomia();
  }, [isOpen, recargarEconomia]);

  // Arranca la barra en cero y la deja crecer al abrir; si llegan datos nuevos, acompaña con la transición.
  useEffect(() => {
    if (!isOpen) {
      setAnimado(false);
      return;
    }
    const cuadro = requestAnimationFrame(() => setAnimado(true));
    return () => cancelAnimationFrame(cuadro);
  }, [isOpen]);

  const hitos = [...(bonusRacha?.tramos ?? [])].sort((a, b) => a.dias - b.dias);
  const total = hitos[hitos.length - 1]?.dias ?? 0;
  const alcanzados = hitos.filter((hito) => racha >= hito.dias).length;
  const siguiente = hitos.find((hito) => racha < hito.dias) ?? null;
  const faltan = siguiente ? siguiente.dias - racha : 0;
  const avance =
    total > 0 ? Math.max(0, Math.min(100, Math.round((racha / total) * 100))) : 0;
  const unidad = (dias: number) => (dias === 1 ? 'día' : 'días');
  const faltanTexto = faltan === 1 ? 'Te falta 1 día' : `Te faltan ${faltan} días`;
  const posicion = (dias: number) =>
    total > 0 ? Math.max(0, Math.min(100, (dias / total) * 100)) : 0;

  // La recompensa sólo se nombra cuando el bonus está activo; así no se promete algo que no se acredita.
  const recompensaDe = (tramo: RachaTramo): string | null => {
    if (!bonusRacha || !bonusRacha.activo) return null;
    return bonusRacha.modo === 'puntos_fijos' ? `+${tramo.valor} pts` : `+${tramo.valor}%`;
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} labelledBy={titleId}>
      <div className="text-left text-slate-700">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <IonIcon icon={flameOutline} className="text-base" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id={titleId} className="m-0 text-base leading-tight font-bold text-[#294C6B]">
              Tu racha
            </h2>
            <p className="m-0 mt-0.5 text-xs leading-tight font-medium text-slate-400">
              Días seguidos abriendo CogniJuegos
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-baseline gap-1.5">
          <span className="text-[2rem] leading-none font-semibold text-[#294C6B] tabular-nums">
            {racha} {unidad(racha)}
          </span>
          <span className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">
            Racha actual
          </span>
        </div>

        {hitos.length === 0 ? (
          <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-500">
            Todavía no hay hitos de racha configurados.
          </p>
        ) : (
          <section className="mt-5" aria-labelledby={`${titleId}-progreso`}>
            <div className="flex items-baseline justify-between gap-3">
              <p id={`${titleId}-progreso`} className="m-0 text-sm font-semibold text-slate-600">
                {siguiente ? `Próximo hito: ${siguiente.dias} días` : 'Completaste todos los hitos'}
              </p>
              <span className="shrink-0 text-[11px] font-medium whitespace-nowrap text-slate-400 tabular-nums">
                {alcanzados} de {hitos.length} hitos
              </span>
            </div>
            <p className="m-0 mt-0.5 text-xs font-medium text-slate-400">
              {siguiente ? faltanTexto : 'Ya alcanzaste la meta máxima.'}
            </p>

            <div className="relative mt-5">
              <div
                role="progressbar"
                aria-label={
                  siguiente
                    ? `Avance hacia el hito de ${siguiente.dias} días`
                    : 'Todos los hitos completados'
                }
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={avance}
                aria-valuetext={
                  siguiente
                    ? `${faltan} ${unidad(faltan)} para el hito de ${siguiente.dias} días`
                    : 'Todos los hitos alcanzados'
                }
                className="h-1 overflow-hidden rounded-full bg-slate-100"
              >
                <div
                  className="h-full rounded-full bg-[#294C6B]/70 motion-safe:transition-[width] motion-safe:duration-700 motion-safe:ease-out"
                  style={{ width: `${animado ? avance : 0}%` }}
                />
              </div>

              {hitos.map((hito) => {
                const alcanzado = racha >= hito.dias;
                const esSiguiente = siguiente?.dias === hito.dias;
                return (
                  <span
                    key={hito.dias}
                    aria-hidden="true"
                    style={{ left: `${posicion(hito.dias)}%` }}
                    className={`absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border ${
                      alcanzado
                        ? 'border-[#294C6B] bg-[#294C6B]'
                        : esSiguiente
                          ? 'border-[#294C6B]/60 bg-white'
                          : 'border-slate-300 bg-white'
                    }`}
                  >
                    {esSiguiente && (
                      <span className="absolute inset-0 rounded-full bg-[#294C6B]/25 motion-safe:animate-ping" />
                    )}
                  </span>
                );
              })}
            </div>

            <div className="relative mt-2 h-9" aria-label="Hitos de racha">
              {hitos.map((hito, indice) => {
                const alcanzado = racha >= hito.dias;
                const recompensa = recompensaDe(hito);
                const alineacion =
                  hitos.length === 1
                    ? '-translate-x-1/2'
                    : indice === 0
                      ? ''
                      : indice === hitos.length - 1
                        ? '-translate-x-full'
                        : '-translate-x-1/2';
                return (
                  <span
                    key={hito.dias}
                    style={{ left: `${posicion(hito.dias)}%` }}
                    className={`absolute top-0 text-center whitespace-nowrap ${alineacion}`}
                  >
                    <span
                      className={`block text-[11px] font-semibold tabular-nums ${
                        alcanzado ? 'text-[#294C6B]' : 'text-slate-400'
                      }`}
                    >
                      {recompensa ?? `${hito.dias} días`}
                    </span>
                    {recompensa && (
                      <span className="block text-[10px] leading-tight text-slate-400 tabular-nums">
                        {hito.dias} días
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          </section>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-5 min-h-11 w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-semibold text-[#294C6B] transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294C6B]"
        >
          Seguir jugando
        </button>
      </div>
    </ModalBase>
  );
}

export default StreakProgressModal;
