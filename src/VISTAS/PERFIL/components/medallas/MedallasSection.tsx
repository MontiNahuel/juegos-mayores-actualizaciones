/* Sección de medallas: selector de mes, pestañas por juego y tarjeta del juego. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { appsOutline, chevronDownOutline } from 'ionicons/icons';
import { JUEGOS_PERFIL, type JuegoPerfil } from './perfilGames';
import { MedallasJuegoCard, type PeriodoMedallas } from './MedallasJuegoCard';
import type { MedallasMes, MedallasPorCalificacion, RendimientoJuego } from '../../services/perfilService';
import {
  formatearMes,
  medallasDe,
  medallasDeRendimiento,
  rendimientoAgregado,
  sumarMedallas,
  totalMedallas,
} from '../../utils/perfilUtils';

const TITULO_SECCION = 'm-0! text-[1.375rem]! leading-[1.3]! font-bold!';
const BOTON_MES =
  'inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-[10px] border border-[#526176] bg-[#263548] py-2 pr-3 pl-3.5 font-[inherit] text-sm font-extrabold text-menu-ink transition-colors hover:border-[#64778f] hover:bg-[#28384b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8bd9cc]';

/** Pestaña extra que suma los cuatro juegos del mes y del histórico. */
const TODOS: JuegoPerfil = {
  id: 'todos',
  corto: 'Todos',
  titulo: 'Todos los juegos',
  enfoque: 'En conjunto',
  acento: '#8bd9cc',
  icono: appsOutline,
};
const PESTANAS = [...JUEGOS_PERFIL, TODOS];
const IDS_JUEGOS = JUEGOS_PERFIL.map((juego) => juego.id);

function totalDeJuegos(
  juegos: Record<string, MedallasPorCalificacion> | undefined,
): number {
  return JUEGOS_PERFIL.reduce(
    (total, juego) => total + totalMedallas(medallasDe(juegos, juego.id)),
    0,
  );
}

interface MedallasSectionProps {
  meses: MedallasMes[] | undefined;
  historico: Record<string, MedallasPorCalificacion> | undefined;
  rendimiento: Record<string, RendimientoJuego> | undefined;
  actual: string;
}

export function MedallasSection({
  meses,
  historico,
  rendimiento,
  actual,
}: MedallasSectionProps) {
  const opciones = useMemo<MedallasMes[]>(() => {
    const lista = meses && meses.length > 0 ? meses : [];
    if (lista.some((bloque) => bloque.mes === actual)) return lista;
    return [{ mes: actual, juegos: {} }, ...lista];
  }, [meses, actual]);

  const [mes, setMes] = useState(actual);
  const [juegoId, setJuegoId] = useState(JUEGOS_PERFIL[0].id);
  const [periodo, setPeriodo] = useState<PeriodoMedallas>('mes');
  const [abierto, setAbierto] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  const cambiarPeriodo = (nuevo: PeriodoMedallas) => {
    setPeriodo(nuevo);
    if (nuevo === 'historico') setAbierto(false);
  };

  useEffect(() => {
    if (!opciones.some((bloque) => bloque.mes === mes)) setMes(actual);
  }, [opciones, mes, actual]);

  useEffect(() => {
    if (!abierto) return;
    const alClic = (evento: MouseEvent) => {
      if (!selectorRef.current?.contains(evento.target as Node)) setAbierto(false);
    };
    const alTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setAbierto(false);
    };
    document.addEventListener('mousedown', alClic);
    document.addEventListener('keydown', alTecla);
    return () => {
      document.removeEventListener('mousedown', alClic);
      document.removeEventListener('keydown', alTecla);
    };
  }, [abierto]);

  const bloque = opciones.find((opcion) => opcion.mes === mes) ?? opciones[0];
  const juego =
    PESTANAS.find((item) => item.id === juegoId) ?? JUEGOS_PERFIL[0];
  const esTodos = juego.id === TODOS.id;
  const totalDe = (id: string) => {
    const fuente = periodo === 'historico' ? historico : bloque?.juegos;
    return id === TODOS.id ? totalDeJuegos(fuente) : totalMedallas(medallasDe(fuente, id));
  };
  const delMes = esTodos
    ? sumarMedallas(IDS_JUEGOS.map((id) => medallasDe(bloque?.juegos, id)))
    : medallasDe(bloque?.juegos, juego.id);
  const historicoDelJuego = esTodos
    ? sumarMedallas(IDS_JUEGOS.map((id) => medallasDe(historico, id)))
    : medallasDe(historico, juego.id);
  const rendimientoDelJuego = esTodos
    ? rendimientoAgregado(rendimiento, IDS_JUEGOS)
    : medallasDeRendimiento(rendimiento, juego.id);
  const juegosConMedallas = IDS_JUEGOS.filter(
    (id) => totalMedallas(medallasDe(bloque?.juegos, id)) > 0,
  ).length;

  return (
    <section aria-labelledby="perfil-medallas">
      <div className="flex min-h-10 flex-wrap items-end justify-between gap-3">
        <h2 id="perfil-medallas" className={TITULO_SECCION}>
          Medallas
        </h2>

        {periodo === 'mes' && (
          <div className="relative" ref={selectorRef}>
            <button
              type="button"
              aria-expanded={abierto}
              aria-haspopup="listbox"
              aria-controls="perfil-meses"
              onClick={() => setAbierto((valor) => !valor)}
              className={BOTON_MES}
            >
              <span>{formatearMes(mes)}</span>
              <IonIcon
                icon={chevronDownOutline}
                aria-hidden="true"
                className={`transition-transform ${abierto ? 'rotate-180' : ''}`}
              />
            </button>

            {abierto && (
              <ul
                id="perfil-meses"
                role="listbox"
                aria-label="Elegí un mes"
                className="absolute top-[calc(100%+6px)] right-0 z-10 m-0 w-[244px] list-none rounded-xl border border-[#526176] bg-[#263548] p-1.5 shadow-[0_22px_40px_-18px_rgba(3,8,14,.9)]"
              >
                {opciones.map((opcion) => {
                  const total = totalDeJuegos(opcion.juegos);
                  const esActual = opcion.mes === actual;
                  const elegido = opcion.mes === mes;
                  return (
                    <li key={opcion.mes}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={elegido}
                        onClick={() => {
                          setMes(opcion.mes);
                          setAbierto(false);
                        }}
                        className={`flex min-h-[38px] w-full cursor-pointer items-center justify-between gap-2.5 rounded-lg px-2.5 py-2 font-[inherit] text-[13.5px] font-bold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#8bd9cc] ${
                          elegido
                            ? 'bg-[#8bd9cc]/12 text-[#8bd9cc]'
                            : total === 0
                              ? 'text-[#7f8da0] hover:bg-[#30425a]'
                              : 'text-menu-copy hover:bg-[#30425a] hover:text-menu-ink'
                        }`}
                      >
                        <span>{formatearMes(opcion.mes)}</span>
                        {esActual ? (
                          <span className="rounded-full bg-[#8bd9cc]/15 px-1.5 py-px text-[10px] font-extrabold tracking-[.04em] text-[#8bd9cc] uppercase">
                            Mes actual
                          </span>
                        ) : (
                          <span className="tabular-nums">{total}</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      <div
        role="tablist"
        aria-label="Juegos"
        className="mt-4 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {PESTANAS.map((item) => {
          const total = totalDe(item.id);
          const elegido = item.id === juego.id;
          return (
            <button
              key={item.id}
              id={`perfil-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={elegido}
              aria-controls="perfil-tabpanel"
              onClick={() => setJuegoId(item.id)}
              style={{ ['--accent' as string]: item.acento }}
              className={`inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-[7px] rounded-full border px-3 py-2 font-[inherit] text-[13.5px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
                elegido
                  ? 'border-[color-mix(in_srgb,var(--accent),transparent_45%)] bg-[color-mix(in_srgb,var(--accent),transparent_86%)] text-[var(--accent)]'
                  : 'border-[#52647b] text-menu-copy hover:border-[#6b7f97] hover:text-menu-ink'
              }`}
            >
              <IonIcon icon={item.icono} className="size-4 shrink-0" aria-hidden="true" />
              <span>{item.corto}</span>
              <span
                className={`min-w-5 rounded-full px-1.5 py-px text-center text-[11px] font-extrabold tabular-nums ${
                  elegido
                    ? 'bg-[color-mix(in_srgb,var(--accent),transparent_76%)]'
                    : 'bg-white/7'
                } ${total === 0 ? 'opacity-45' : ''}`}
              >
                {total}
              </span>
            </button>
          );
        })}
      </div>

      <div
        id="perfil-tabpanel"
        role="tabpanel"
        aria-labelledby={`perfil-tab-${juego.id}`}
      >
        <MedallasJuegoCard
          key={juego.id}
          juego={juego}
          mes={mes}
          delMes={delMes}
          historico={historicoDelJuego}
          rendimiento={rendimientoDelJuego}
          periodo={periodo}
          onCambiarPeriodo={cambiarPeriodo}
          esTodos={esTodos}
          juegosConMedallas={juegosConMedallas}
        />
      </div>
    </section>
  );
}

export default MedallasSection;
