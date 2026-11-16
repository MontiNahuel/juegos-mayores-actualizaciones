/* Resume medallas del mes, histórico y rendimiento de un juego. */
import { IonIcon } from '@ionic/react';
import { timeOutline, trophyOutline } from 'ionicons/icons';
import type { JuegoPerfil } from './perfilGames';
import type { MedallasPorCalificacion, RendimientoJuego } from './perfilService';
import {
  CALIFICACIONES,
  ESTILO_CALIFICACION,
  formatearDuracion,
  formatearFechaCorta,
  resumenHistorico,
  totalMedallas,
} from './perfilUtils';

interface MedallasJuegoCardProps {
  juego: JuegoPerfil;
  delMes: MedallasPorCalificacion;
  historico: MedallasPorCalificacion;
  rendimiento: RendimientoJuego;
}

/** Un juego por tarjeta: primero el mes en curso y debajo el acumulado histórico. */
export function MedallasJuegoCard({
  juego,
  delMes,
  historico,
  rendimiento,
}: MedallasJuegoCardProps) {
  const totalMes = totalMedallas(delMes);

  return (
    <article
      className="flex min-w-0 flex-col rounded-2xl border border-[#52647b] bg-menu-panel p-[26px] max-md:p-5"
      style={{ ['--game-color' as string]: juego.acento }}
      aria-labelledby={`perfil-juego-${juego.id}`}
    >
      <header className="flex items-start gap-3">
        <span
          className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--game-color),transparent_86%)] text-[var(--game-color)]"
          aria-hidden="true"
        >
          <IonIcon icon={juego.icono} className="text-xl" />
        </span>
        <div className="min-w-0">
          <h3
            id={`perfil-juego-${juego.id}`}
            className="m-0! text-lg! leading-tight! font-bold!"
          >
            {juego.titulo}
          </h3>
          <p className="mt-1 mb-0 text-sm leading-snug text-[var(--game-color)]">
            {juego.enfoque}
          </p>
        </div>
      </header>

      <div className="mt-5">
        <p className="m-0 flex items-baseline justify-between gap-2 text-xs font-semibold tracking-[.08em] text-menu-copy uppercase">
          <span>Este mes</span>
          <span className="tracking-normal normal-case">
            {totalMes === 0
              ? 'Sin medallas todavía'
              : `${totalMes} ${totalMes === 1 ? 'medalla' : 'medallas'}`}
          </span>
        </p>
        <ul className="mt-2.5 flex flex-wrap gap-2" aria-label={`Medallas de ${juego.titulo} este mes`}>
          {CALIFICACIONES.map((calificacion) => {
            const cantidad = delMes[calificacion] ?? 0;
            return (
              <li
                key={calificacion}
                aria-label={`${cantidad} ${cantidad === 1 ? 'medalla' : 'medallas'} ${calificacion}`}
                className={`flex min-w-[52px] flex-1 flex-col items-center rounded-xl px-2 py-2 ${ESTILO_CALIFICACION[calificacion]} ${
                  cantidad === 0 ? 'opacity-40' : ''
                }`}
              >
                <span className="text-base leading-none font-extrabold" aria-hidden="true">
                  {calificacion}
                </span>
                <span className="mt-1 text-sm leading-none font-semibold tabular-nums">
                  {cantidad}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-2.5 mb-0 text-xs leading-normal text-menu-copy">
          Histórico · {resumenHistorico(historico)}
        </p>
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-[#3d4f65] pt-4">
        <div className="min-w-0">
          <dt className="m-0 flex items-center gap-1 text-xs text-menu-copy">
            <IonIcon icon={trophyOutline} aria-hidden="true" />
            Jugadas
          </dt>
          <dd className="mt-1 mb-0 text-base font-bold tabular-nums">
            {rendimiento.completadas}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="m-0 flex items-center gap-1 text-xs text-menu-copy">
            <IonIcon icon={timeOutline} aria-hidden="true" />
            Mejor
          </dt>
          <dd className="mt-1 mb-0 text-base font-bold tabular-nums">
            {formatearDuracion(rendimiento.mejor_tiempo_segundos)}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="m-0 flex items-center gap-1 text-xs text-menu-copy">
            <IonIcon icon={timeOutline} aria-hidden="true" />
            Promedio
          </dt>
          <dd className="mt-1 mb-0 text-base font-bold tabular-nums">
            {formatearDuracion(rendimiento.promedio_tiempo_segundos)}
          </dd>
        </div>
      </dl>
      <p className="mt-2.5 mb-0 text-xs text-menu-copy">
        Último intento: {formatearFechaCorta(rendimiento.ultima_fecha)}
      </p>
    </article>
  );
}

export default MedallasJuegoCard;
