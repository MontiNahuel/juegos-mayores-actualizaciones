/* Tarjeta de un juego: sellos del mes o del histórico y rendimiento. */
import { IonIcon } from '@ionic/react';
import { calendarOutline, gridOutline, timeOutline, trophyOutline } from 'ionicons/icons';
import { JUEGOS_PERFIL, type JuegoPerfil } from './perfilGames';
import type { MedallasPorCalificacion, RendimientoJuego } from '../../services/perfilService';
import { SelloMedalla } from './SelloMedalla';
import { TableroFondo } from './TableroFondo';
import {
  CALIFICACIONES,
  formatearDuracion,
  formatearFechaCorta,
  formatearMes,
  totalMedallas,
} from '../../utils/perfilUtils';

export type PeriodoMedallas = 'mes' | 'historico';

const OPCIONES_PERIODO: { valor: PeriodoMedallas; etiqueta: string }[] = [
  { valor: 'mes', etiqueta: 'Mensual' },
  { valor: 'historico', etiqueta: 'Histórico' },
];

const BOTON_PERIODO =
  'cursor-pointer border-b-2 pb-1 font-[inherit] text-[11px] font-extrabold tracking-[.07em] uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]';

interface MedallasJuegoCardProps {
  juego: JuegoPerfil;
  mes: string;
  delMes: MedallasPorCalificacion;
  historico: MedallasPorCalificacion;
  rendimiento: RendimientoJuego;
  periodo: PeriodoMedallas;
  onCambiarPeriodo: (periodo: PeriodoMedallas) => void;
  esTodos?: boolean;
  juegosConMedallas?: number;
}

function textoTotal(total: number): string {
  if (total === 0) return 'Sin medallas';
  return `${total} ${total === 1 ? 'medalla' : 'medallas'}`;
}

export function MedallasJuegoCard({
  juego,
  mes,
  delMes,
  historico,
  rendimiento,
  periodo,
  onCambiarPeriodo,
  esTodos = false,
  juegosConMedallas = 0,
}: MedallasJuegoCardProps) {
  const esHistorico = periodo === 'historico';
  const sellos = esHistorico ? historico : delMes;
  const totalVisible = totalMedallas(sellos);

  return (
    <article
      aria-labelledby={`perfil-juego-${juego.id}`}
      className="relative mt-3.5 overflow-hidden rounded-2xl border border-[#52647b] bg-menu-panel px-[26px] py-6 max-[820px]:p-5"
      style={{ ['--accent' as string]: juego.acento }}
    >
      {!esTodos && <TableroFondo juego={juego} />}

      <header className="relative z-[1] flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 items-start gap-3">
          {esTodos && (
            <span
              className="flex size-[42px] shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--accent),transparent_85%)] text-[var(--accent)]"
              aria-hidden="true"
            >
              <IonIcon icon={juego.icono} className="text-[21px]" />
            </span>
          )}
          <div className="min-w-0">
            <h3
              id={`perfil-juego-${juego.id}`}
              className="m-0! text-lg! leading-tight! font-black!"
            >
              {juego.titulo}
            </h3>
            <p className="mt-0.5 mb-0 text-[13.5px] leading-snug font-semibold text-[var(--accent)]">
              {juego.enfoque}
            </p>
          </div>
        </div>

        <div
          role="group"
          aria-label="Periodo de las medallas"
          className="ml-auto flex shrink-0 items-center gap-3 pt-1"
        >
          {OPCIONES_PERIODO.map(({ valor, etiqueta }) => {
            const activo = periodo === valor;
            return (
              <button
                key={valor}
                type="button"
                aria-pressed={activo}
                onClick={() => onCambiarPeriodo(valor)}
                className={`${BOTON_PERIODO} ${
                  activo
                    ? 'border-[var(--accent)] text-menu-ink'
                    : 'border-transparent text-menu-copy hover:text-menu-ink'
                }`}
              >
                {etiqueta}
              </button>
            );
          })}
        </div>
      </header>

      <div className="relative z-[1] mt-5 grid grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-[26px] max-[820px]:grid-cols-1 max-[820px]:gap-5">
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="m-0 text-[11px] font-extrabold tracking-[.08em] text-menu-copy uppercase">
              {esHistorico ? 'Histórico' : formatearMes(mes)}
            </p>
            <span className="text-[11.5px] font-bold whitespace-nowrap text-menu-copy tabular-nums">
              {textoTotal(totalVisible)}
            </span>
          </div>
          <ul
            className="mt-2.5 flex gap-2.5 max-[520px]:gap-1.5"
            aria-label={
              esHistorico
                ? `Medallas históricas de ${juego.titulo}`
                : `Medallas de ${juego.titulo} en ${formatearMes(mes)}`
            }
          >
            {CALIFICACIONES.map((calificacion) => (
              <SelloMedalla
                key={calificacion}
                calificacion={calificacion}
                cantidad={sellos[calificacion] ?? 0}
              />
            ))}
          </ul>
          {totalVisible === 0 && (
            <p className="mt-2.5 mb-0 rounded-[10px] border border-dashed border-[#52647b] p-3.5 text-center text-[13px] leading-snug text-menu-copy">
              {esHistorico
                ? esTodos
                  ? 'Todavía no hay medallas registradas.'
                  : 'Todavía no tenés medallas de este juego.'
                : esTodos
                  ? 'Sin medallas en el mes elegido. Probá con otro mes.'
                  : 'No jugaste este juego en el mes elegido. Probá con otro mes u otro juego.'}
            </p>
          )}
        </div>

        <div>
          {esTodos ? (
            <dl className="m-0 grid grid-cols-3 gap-2.5 border-t border-[#3d4f65] pt-4">
              <div className="min-w-0">
                <dt className="m-0 flex items-center gap-1 text-[11.5px] text-menu-copy">
                  <IonIcon icon={trophyOutline} aria-hidden="true" />
                  Jugadas
                </dt>
                <dd className="mt-1 mb-0 text-base font-extrabold tabular-nums">
                  {rendimiento.completadas}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="m-0 flex items-center gap-1 text-[11.5px] text-menu-copy">
                  <IonIcon icon={gridOutline} aria-hidden="true" />
                  Juegos
                </dt>
                <dd className="mt-1 mb-0 text-base font-extrabold tabular-nums">
                  {juegosConMedallas} de {JUEGOS_PERFIL.length}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="m-0 flex items-center gap-1 text-[11.5px] text-menu-copy">
                  <IonIcon icon={calendarOutline} aria-hidden="true" />
                  Último
                </dt>
                <dd className="mt-1 mb-0 text-base font-extrabold tabular-nums">
                  {formatearFechaCorta(rendimiento.ultima_fecha)}
                </dd>
              </div>
            </dl>
          ) : (
            <>
              <dl className="m-0 grid grid-cols-3 gap-2.5 border-t border-[#3d4f65] pt-4">
                <div className="min-w-0">
                  <dt className="m-0 flex items-center gap-1 text-[11.5px] text-menu-copy">
                    <IonIcon icon={trophyOutline} aria-hidden="true" />
                    Jugadas
                  </dt>
                  <dd className="mt-1 mb-0 text-base font-extrabold tabular-nums">
                    {rendimiento.completadas}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="m-0 flex items-center gap-1 text-[11.5px] text-menu-copy">
                    <IonIcon icon={timeOutline} aria-hidden="true" />
                    Mejor
                  </dt>
                  <dd className="mt-1 mb-0 text-base font-extrabold tabular-nums">
                    {formatearDuracion(rendimiento.mejor_tiempo_segundos)}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="m-0 flex items-center gap-1 text-[11.5px] text-menu-copy">
                    <IonIcon icon={timeOutline} aria-hidden="true" />
                    Promedio
                  </dt>
                  <dd className="mt-1 mb-0 text-base font-extrabold tabular-nums">
                    {formatearDuracion(rendimiento.promedio_tiempo_segundos)}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 mb-0 text-xs text-menu-copy">
                Último intento: {formatearFechaCorta(rendimiento.ultima_fecha)}
              </p>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export default MedallasJuegoCard;
