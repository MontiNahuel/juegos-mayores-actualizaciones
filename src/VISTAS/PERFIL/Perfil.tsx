/* Perfil del jugador: identidad, medallas, rendimiento y constancia. */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { IonContent, IonIcon, IonPage } from '@ionic/react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  flameOutline,
  personCircleOutline,
  refreshOutline,
  ribbonOutline,
  sparklesOutline,
  starOutline,
} from 'ionicons/icons';
import AppNavbar from '../COMPONENTS/Navbar/AppNavbar';
import { usePlayerEconomy } from '../../context/PlayerEconomyContext';
import {
  getSessionUser,
  subscribeSessionUser,
  type SessionUser,
} from '../AUTH/sessionStore';
import { fetchPerfilResumen, type PerfilResumen } from './perfilService';
import { JUEGOS_PERFIL } from './perfilGames';
import { MedallasJuegoCard } from './MedallasJuegoCard';
import { ActividadHeatmap } from './ActividadHeatmap';
import { PlanesModal } from './PlanesModal';
import {
  formatearMes,
  medallasDe,
  medallasDeRendimiento,
  proximoHitoDeRacha,
  totalMedallas,
} from './perfilUtils';
import '../MENU/Menu.css';

const PANEL = 'rounded-2xl border border-[#52647b] bg-menu-panel p-[26px] max-md:p-5';
const TITULO_SECCION = 'm-0! text-[1.375rem]! leading-[1.3]! font-bold!';
const COPIA_SECCION = 'mt-1.5 mb-0 text-base leading-normal text-menu-copy';

/** Vuelve a la pantalla de origen; el perfil nunca es destino de sí mismo. */
function destinoDeVuelta(state: unknown): string {
  const desde = (state as { from?: unknown } | null)?.from;
  if (typeof desde === 'string' && desde.startsWith('/') && !desde.startsWith('/perfil')) {
    return desde;
  }
  return '/menu';
}

function formatearAlta(valor?: string | null): string | null {
  if (!valor) return null;
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return null;
  return new Intl.DateTimeFormat('es-AR', {
    month: 'long',
    year: 'numeric',
  }).format(fecha);
}

/** Progreso hacia el próximo hito, con el tramo anterior como piso. */
function progresoDeRacha(racha: number, tramos: { dias: number; valor: number }[] | undefined) {
  const ordenados = [...(tramos ?? [])].sort((a, b) => a.dias - b.dias);
  const siguiente = ordenados.find((tramo) => racha < tramo.dias) ?? null;
  const previo = [...ordenados].reverse().find((tramo) => racha >= tramo.dias) ?? null;
  const piso = previo?.dias ?? 0;
  const avance = siguiente
    ? Math.min(1, Math.max(0, (racha - piso) / Math.max(1, siguiente.dias - piso)))
    : 1;
  return { siguiente, avance };
}

const PanelCargando = () => (
  <div className="mt-8 grid grid-cols-2 gap-5 max-md:grid-cols-1" aria-hidden="true">
    {[0, 1, 2, 3].map((indice) => (
      <div key={indice} className={`${PANEL} animate-pulse`}>
        <div className="h-5 w-40 rounded bg-[#3d4f65]" />
        <div className="mt-4 h-14 rounded-xl bg-[#34465b]" />
        <div className="mt-4 h-3 w-3/4 rounded bg-[#34465b]" />
      </div>
    ))}
  </div>
);

const Perfil = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isAuthenticated,
    isLoading,
    racha,
    rachaHoyIngresada,
    puntos,
    suscripcion,
    diasDesbloqueados,
    rachaTramosDiarios,
  } = usePlayerEconomy();
  const [usuario, setUsuario] = useState<SessionUser | null>(() => getSessionUser());
  const [resumen, setResumen] = useState<PerfilResumen | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(false);
  const [planesAbiertos, setPlanesAbiertos] = useState(false);

  const volver = useCallback(() => {
    navigate(destinoDeVuelta(location.state));
  }, [navigate, location.state]);

  useEffect(() => subscribeSessionUser(setUsuario), []);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(false);
    const datos = await fetchPerfilResumen();
    setCargando(false);
    if (datos) {
      setResumen(datos);
    } else {
      setError(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setResumen(null);
      setError(false);
      return;
    }
    void cargar();
  }, [isAuthenticated, cargar]);

  const tramos = useMemo(
    () => rachaTramosDiarios.map((tramo) => ({ dias: tramo.dias, valor: tramo.puntos })),
    [rachaTramosDiarios],
  );
  const { siguiente, avance } = useMemo(
    () => progresoDeRacha(racha, tramos),
    [racha, tramos],
  );
  const alta = formatearAlta(usuario?.dateStart);
  const esPremium = suscripcion === 'premium';
  const inicial = (usuario?.name ?? '?').trim().charAt(0).toUpperCase();

  const totalMes = useMemo(() => {
    if (!resumen) return 0;
    return JUEGOS_PERFIL.reduce(
      (total, juego) =>
        total + totalMedallas(medallasDe(resumen.medallas.mes_actual, juego.id)),
      0,
    );
  }, [resumen]);

  const resumenRacha = proximoHitoDeRacha(racha, tramos);

  return (
    <IonPage>
      <AppNavbar view={{ kind: 'profile', title: 'Mi perfil', onBack: volver }} />
      <IonContent className="menu-content">
        <main className="menu-shell menu-theme box-border mx-auto max-w-[1180px] px-9 pt-9 pb-[max(calc(env(safe-area-inset-bottom,0px)+28px),56px)] text-menu-ink max-md:px-5 max-md:pt-6">
          {!isAuthenticated ? (
            <section className={`${PANEL} mt-3 text-center`} aria-labelledby="perfil-invitado">
              <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#8bd9cc]/15 text-[#8bd9cc]">
                <IonIcon icon={personCircleOutline} className="text-3xl" aria-hidden="true" />
              </span>
              <h1 id="perfil-invitado" className="mt-4 mb-0! text-[1.75rem]! leading-tight! font-bold!">
                Tu perfil te espera
              </h1>
              <p className="mx-auto mt-2.5 mb-0 max-w-[52ch] text-base leading-[1.55] text-menu-copy">
                Iniciá sesión desde el menú para ver tus medallas, tus tiempos y
                tu constancia en cada juego.
              </p>
              <button
                type="button"
                onClick={() => navigate('/menu')}
                className="mt-6 min-h-12 cursor-pointer rounded-[10px] border-0 bg-[#8bd9cc] px-5 py-3 font-[inherit] text-base font-bold text-[#172433] transition-colors hover:bg-[#a5e5da]"
              >
                Volver al menú
              </button>
            </section>
          ) : (
            <>
              <header className="mt-3 mb-8 flex flex-wrap items-center gap-5 max-md:mt-2 max-md:gap-4">
                <span
                  className="flex size-16 shrink-0 items-center justify-center rounded-full border border-[#8bd9cc]/35 bg-[#8bd9cc]/15 text-2xl font-extrabold text-[#8bd9cc]"
                  aria-hidden="true"
                >
                  {inicial}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-xs font-semibold tracking-[.12em] text-menu-copy uppercase">
                    Tu perfil
                  </p>
                  <h1 className="mt-1 mb-0! text-[2.125rem]! leading-[1.2]! font-bold! tracking-[-.02em] max-md:text-[1.75rem]!">
                    {usuario?.name ?? 'Jugador'}
                  </h1>
                  <p className="mt-1.5 mb-0 text-base leading-normal text-menu-copy">
                    {alta ? `Miembro desde ${alta}` : 'Sesión iniciada'}
                    {resumen ? ` · ${formatearMes(resumen.periodo.mes)} en curso` : ''}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold ${
                    esPremium
                      ? 'border-[#edd499]/45 bg-[#edd499]/10 text-[#edd499]'
                      : 'border-[#8bd9cc]/40 bg-[#8bd9cc]/10 text-[#8bd9cc]'
                  }`}
                >
                  <IonIcon icon={ribbonOutline} aria-hidden="true" />
                  {esPremium ? 'Plan Premium' : 'Plan básico'}
                </span>
              </header>

              <div className="grid grid-cols-3 gap-5 max-md:grid-cols-1 max-md:gap-4">
                <section className={`${PANEL} flex flex-col gap-1`} aria-label="Racha actual">
                  <span className="flex items-center gap-2 text-sm text-menu-copy">
                    <IonIcon icon={flameOutline} className="text-[#edd499]" aria-hidden="true" />
                    Racha actual
                  </span>
                  <strong className="text-[2rem] leading-tight font-bold text-[#edd499] tabular-nums">
                    {racha}
                    <span className="ml-1.5 text-base font-semibold">
                      {racha === 1 ? 'día' : 'días'}
                    </span>
                  </strong>
                  <span className="text-sm leading-snug text-menu-copy">
                    {rachaHoyIngresada
                      ? 'Hoy ya contás para la racha.'
                      : 'Ingresá hoy para mantenerla.'}
                  </span>
                </section>

                <section className={`${PANEL} flex flex-col gap-1`} aria-label="Puntos acumulados">
                  <span className="flex items-center gap-2 text-sm text-menu-copy">
                    <IonIcon icon={starOutline} className="text-[#edd499]" aria-hidden="true" />
                    Puntos
                  </span>
                  <strong className="text-[2rem] leading-tight font-bold text-[#edd499] tabular-nums">
                    {isLoading ? '…' : puntos.toLocaleString('es-AR')}
                  </strong>
                  <span className="text-sm leading-snug text-menu-copy">
                    Para desbloquear días y pedir pistas.
                  </span>
                </section>

                <section className={`${PANEL} flex flex-col gap-1`} aria-label="Suscripción">
                  <span className="flex items-center gap-2 text-sm text-menu-copy">
                    <IonIcon icon={ribbonOutline} className="text-[#8bd9cc]" aria-hidden="true" />
                    Suscripción
                  </span>
                  <strong className="text-[2rem] leading-tight font-bold">
                    {esPremium ? 'Premium' : 'Básica'}
                  </strong>
                  <span className="text-sm leading-snug text-menu-copy">
                    {esPremium
                      ? 'Acceso completo al archivo de desafíos.'
                      : `${diasDesbloqueados.length} ${
                          diasDesbloqueados.length === 1 ? 'día desbloqueado' : 'días desbloqueados'
                        } con puntos.`}
                  </span>
                  {!esPremium && (
                    <button
                      type="button"
                      onClick={() => setPlanesAbiertos(true)}
                      className="mt-3 inline-flex min-h-10 cursor-pointer items-center justify-center gap-1.5 self-start rounded-[10px] border border-[#edd499]/50 bg-[#edd499]/10 px-3.5 py-2 font-[inherit] text-sm font-bold text-[#edd499] transition-colors hover:bg-[#edd499]/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#edd499]"
                    >
                      <IonIcon icon={sparklesOutline} aria-hidden="true" />
                      Mejorar suscripción
                    </button>
                  )}
                </section>
              </div>

              <section className="mt-9" aria-labelledby="perfil-medallas">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 id="perfil-medallas" className={TITULO_SECCION}>
                      Medallas del mes
                    </h2>
                    <p className={COPIA_SECCION}>
                      {resumen
                        ? `${formatearMes(resumen.periodo.mes)}: ${totalMes} ${
                            totalMes === 1 ? 'medalla' : 'medallas'
                          } en total. Debajo, tu acumulado histórico.`
                        : 'Tu desempeño diario, primero del mes en curso y debajo el histórico.'}
                    </p>
                  </div>
                </div>

                {error && (
                  <div className={`${PANEL} mt-5 flex flex-wrap items-center justify-between gap-4`}>
                    <p className="m-0 text-base leading-normal text-menu-copy">
                      No pudimos cargar tus medallas. Revisá la conexión e intentá de nuevo.
                    </p>
                    <button
                      type="button"
                      onClick={() => void cargar()}
                      disabled={cargando}
                      className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-[10px] border border-[#526176] bg-[#263548] px-4 py-2.5 font-[inherit] text-[15px] text-menu-ink hover:bg-[#28384b] disabled:cursor-default disabled:opacity-60"
                    >
                      <IonIcon icon={refreshOutline} aria-hidden="true" />
                      {cargando ? 'Reintentando…' : 'Reintentar'}
                    </button>
                  </div>
                )}

                {!resumen && !error && (cargando || isLoading) && <PanelCargando />}

                {resumen && (
                  <div className="mt-5 grid grid-cols-2 gap-5 max-md:grid-cols-1 max-md:gap-4">
                    {JUEGOS_PERFIL.map((juego) => (
                      <MedallasJuegoCard
                        key={juego.id}
                        juego={juego}
                        delMes={medallasDe(resumen.medallas.mes_actual, juego.id)}
                        historico={medallasDe(resumen.medallas.historico, juego.id)}
                        rendimiento={medallasDeRendimiento(resumen.rendimiento, juego.id)}
                      />
                    ))}
                  </div>
                )}
              </section>

              <section className="mt-9" aria-labelledby="perfil-constancia">
                <h2 id="perfil-constancia" className={TITULO_SECCION}>
                  Constancia
                </h2>
                <p className={COPIA_SECCION}>
                  Los días en que abriste la app, en las últimas doce semanas.
                </p>
                <div className="mt-5 grid grid-cols-[minmax(0,1fr)_320px] gap-5 max-[900px]:grid-cols-1">
                  <div className={PANEL}>
                    {resumen ? (
                      <ActividadHeatmap
                        desde={resumen.periodo.desde}
                        hasta={resumen.periodo.hasta}
                        actividad={resumen.actividad}
                      />
                    ) : (
                      <div className="h-24 animate-pulse rounded-xl bg-[#34465b]" aria-hidden="true" />
                    )}
                  </div>
                  <div className={`${PANEL} flex flex-col`}>
                    <span className="text-sm text-menu-copy">Próximo hito de racha</span>
                    {siguiente ? (
                      <>
                        <strong className="mt-1 text-xl leading-tight font-bold">
                          {siguiente.dias} días
                        </strong>
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
            </>
          )}
        </main>
      </IonContent>
      <PlanesModal isOpen={planesAbiertos} onClose={() => setPlanesAbiertos(false)} />
    </IonPage>
  );
};

export default Perfil;
