/* Muestra los desafíos diarios y permite elegir o desbloquear un día. */
import { useEffect, useMemo, useState, useCallback, useRef, type CSSProperties } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { IonContent, IonPage } from '@ionic/react';
import { type DailyChallengeCalendarProps, type DayChallenge, DEFAULT_CALENDAR_THEME } from './types';
import { useGameCalendar } from './useGameCalendar';
import AppNavbar from '../Navbar/AppNavbar';
import { CalendarHeroCard } from './CalendarHeroCard';
import { CalendarGrid } from './CalendarGrid';
import { IconInfo, IconClose, IconCheck, IconStarSolid } from './icons';
import { HistoricalChallengeAccess } from './HistoricalChallengeAccess';
import { usePlayerEconomy } from '../../../context/PlayerEconomyContext';

// Muestra los desafíos diarios y permite elegir o desbloquear un día.
export function DailyChallengeCalendar({
  gameId,
  title,
  heroBadge,
  heroSubtitle,
  difficulty = 'standard',
  playRoute,
  onPlayChallenge,
  year,
  month,
  todayDay,
  theme: themeProp,
  onBack,
  renderCompletedModal,
}: DailyChallengeCalendarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useMemo(/* Recalcula este dato cuando cambian sus dependencias. */ () => ({ ...DEFAULT_CALENDAR_THEME, ...themeProp }), [themeProp]);
  const {
    challenges,
    todayChallenge,
    loading,
    monthName,
    year: resolvedYear,
    month: resolvedMonth,
    canGoPrev,
    canGoNext,
    goToPreviousMonth,
    goToNextMonth,
  } = useGameCalendar({
    gameId,
    difficulty,
    year,
    month,
    todayDay,
  });

  const {
    suscripcion,
    isDiaDesbloqueado,
  } = usePlayerEconomy();

  const [selectedCompleted, setSelectedCompleted] = useState<DayChallenge | null>(null);
  const [challengeParaDesbloquear, setChallengeParaDesbloquear] = useState<DayChallenge | null>(null);
  const [futureNotice, setFutureNotice] = useState<string | null>(null);

  useEffect(/* Sincroniza este efecto cuando cambian los datos de los que depende. */ () => {
    if (!futureNotice) return;
    const timer = window.setTimeout(/* Ejecuta este paso cuando se cumple la espera. */ () => setFutureNotice(null), 3500);
    return /* Libera los recursos de este efecto cuando deja de usarse. */ () => window.clearTimeout(timer);
  }, [futureNotice]);

  // Comprueba si hace falta desbloquear ese desafío anterior.
  const isItemHistoricalLocked = useCallback(
    (item: DayChallenge): boolean => {
      if (item.status !== 'pending' || item.isToday) return false;
      if (suscripcion === 'premium') return false;
      return !isDiaDesbloqueado(gameId, item.dateKey);
    },
    [gameId, suscripcion, isDiaDesbloqueado]
  );

  // Abre el juego con los datos del día elegido.
  const ejecutarJuego = useCallback(
    (item: DayChallenge) => {
      if (onPlayChallenge) {
        onPlayChallenge(item);
      } else if (playRoute) {
        navigate(playRoute, {
          state: {
            challenge: {
              day: item.day,
              dateStr: item.dateStr,
              dateKey: item.dateKey,
              config: item.config,
              word: item.config?.solution || item.completedData?.word,
              hints: item.config?.hints,
            },
          },
        });
      }
    },
    [navigate, onPlayChallenge, playRoute]
  );

  // Responde a la casilla elegida y actualiza la selección.
  const handleCellClick = useCallback((item: DayChallenge) => {
    if (item.status === 'completed') {
      setSelectedCompleted(item);
      return;
    }

    if (item.status === 'pending') {
      if (isItemHistoricalLocked(item)) {
        setChallengeParaDesbloquear(item);
        return;
      }
      ejecutarJuego(item);
      return;
    }

    setFutureNotice(`El desafío del día ${item.day} estará disponible el ${item.dateStr}.`);
  }, [isItemHistoricalLocked, ejecutarJuego]);

  const consumedContinuation = useRef<string | null>(null);

  // Consume una continuación una sola vez y conserva el flujo propio de cada juego.
  useEffect(() => {
    const item = location.state?.continueChallenge as DayChallenge | undefined;
    if (!item || consumedContinuation.current === location.key) return;
    consumedContinuation.current = location.key;
    navigate(location.pathname, { replace: true, state: null });
    handleCellClick(item);
  }, [location.key, location.state, location.pathname, navigate, handleCellClick]);

  return (
    <IonPage
      className="bg-[var(--calendar-primary)] text-[#46556D]"
      style={{ '--calendar-primary': theme.primaryBlue } as CSSProperties}
    >
      {/* El calendario solo describe su estado; AppNavbar resuelve identidad y sesión. */}
      <AppNavbar view={{ kind: 'calendar', title, onBack: () => (onBack ? onBack() : navigate('/')) }} />
      <IonContent style={{ '--background': 'var(--app-background)' } as CSSProperties}>
        <main className="mx-auto flex min-h-full w-full max-w-[760px] flex-col gap-5 px-3 pt-6 pb-[max(calc(env(safe-area-inset-bottom,0px)+32px),56px)] sm:gap-6 sm:px-6 sm:pt-8">
          {futureNotice && (
            <div
              role="status"
              className="flex items-center justify-between gap-3 rounded-lg border border-[#53BFC9] bg-white px-4 py-3 text-sm font-semibold text-[#294C6B]"
            >
              <span className="flex items-center gap-2">
                <span className="shrink-0" aria-hidden="true">
                  <IconInfo size={20} color={theme.primaryBlue} />
                </span>
                {futureNotice}
              </span>
              <button
                type="button"
                aria-label="Cerrar aviso"
                onClick={/* Responde a click desde este control. */ () => setFutureNotice(null)}
                className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md hover:bg-[#DEE3EA] focus-visible:outline-2 focus-visible:outline-[#53BFC9]"
              >
                <IconClose size={18} color="currentColor" />
              </button>
            </div>
          )}

          <CalendarHeroCard
            todayChallenge={todayChallenge}
            heroBadge={heroBadge}
            heroSubtitle={heroSubtitle}
            theme={theme}
            onPlayClick={handleCellClick}
          />

          <CalendarGrid
            challenges={challenges}
            loading={loading}
            year={resolvedYear}
            month={resolvedMonth}
            monthName={monthName}
            theme={theme}
            canGoPrev={canGoPrev}
            canGoNext={canGoNext}
            onPrevMonth={goToPreviousMonth}
            onNextMonth={goToNextMonth}
            isCellHistoricalLocked={isItemHistoricalLocked}
            onCellClick={handleCellClick}
          />
        </main>

        {/* Modal Desafío Completado */}
        {selectedCompleted &&
          (renderCompletedModal ? (
            renderCompletedModal(selectedCompleted, /* Completa este paso con los datos recibidos por la operación. */ () => setSelectedCompleted(null))
          ) : (
            <div onClick={/* Responde a click desde este control. */ event => { if (event.target === event.currentTarget) setSelectedCompleted(null); }} className="fixed inset-0 z-[999] flex items-center justify-center bg-[#294C6B]/55 px-4 py-[var(--app-safe-bottom)] backdrop-blur-sm">
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="calendar-result-title"
                className="calendar-shared-modal-card w-full max-w-[360px] rounded-2xl border border-[#D5DCE5] bg-white p-6 text-center text-[#46556D] shadow-xl"
              >
                <span
                  className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: theme.completedBg }}
                >
                  <IconCheck size={26} color={theme.completedIconColor} />
                </span>
                <h2 id="calendar-result-title" className="m-0 text-xl leading-tight font-extrabold text-slate-800">
                  Desafío del {selectedCompleted.dateStr}
                </h2>
                <div className="my-4 rounded-xl bg-[#F4F6F9] p-4">
                  <p className="m-0 text-sm font-semibold text-slate-700">¡Completado con éxito!</p>
                  {selectedCompleted.stars != null && (
                    <div className="mt-2 flex justify-center gap-1" aria-label={`${selectedCompleted.stars} estrellas`}>
                      {Array.from({ length: selectedCompleted.stars }, /* Completa este paso con los datos recibidos por la operación. */ (_, i) => (
                        <IconStarSolid key={i} size={19} color="#AFA1E8" />
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={/* Responde a click desde este control. */ () => setSelectedCompleted(null)}
                  className="min-h-11 w-full cursor-pointer rounded-xl bg-[var(--calendar-primary)] px-4 py-3 text-sm font-bold text-white hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#53BFC9]"
                >
                  Cerrar
                </button>
              </section>
            </div>
          ))}

        {challengeParaDesbloquear && (
          <HistoricalChallengeAccess
            gameId={gameId}
            challenge={challengeParaDesbloquear}
            onPlay={() => {
              const item = challengeParaDesbloquear;
              setChallengeParaDesbloquear(null);
              ejecutarJuego(item);
            }}
            onClose={() => setChallengeParaDesbloquear(null)}
          />
        )}
      </IonContent>
    </IonPage>
  );
}
