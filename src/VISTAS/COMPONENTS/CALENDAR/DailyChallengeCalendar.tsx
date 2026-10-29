import { useEffect, useMemo, useState, useCallback, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { IonContent, IonPage } from '@ionic/react';
import { type DailyChallengeCalendarProps, type DayChallenge, DEFAULT_CALENDAR_THEME } from './types';
import { useGameCalendar } from './useGameCalendar';
import { CalendarHeader } from './CalendarHeader';
import { CalendarHeroCard } from './CalendarHeroCard';
import { CalendarGrid } from './CalendarGrid';
import { IconInfo, IconClose, IconCheck, IconStarSolid, IconLock, IconCoins, IconSpinner } from './icons';
import { usePlayerEconomy } from '../../../context/PlayerEconomyContext';

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
  const theme = useMemo(() => ({ ...DEFAULT_CALENDAR_THEME, ...themeProp }), [themeProp]);
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
    puntos,
    costoDesbloqueoDiaPuntos,
    suscripcion,
    isDiaDesbloqueado,
    desbloquearDia,
  } = usePlayerEconomy();

  const [selectedCompleted, setSelectedCompleted] = useState<DayChallenge | null>(null);
  const [challengeParaDesbloquear, setChallengeParaDesbloquear] = useState<DayChallenge | null>(null);
  const [desbloqueando, setDesbloqueando] = useState(false);
  const [errorDesbloqueo, setErrorDesbloqueo] = useState<string | null>(null);
  const [futureNotice, setFutureNotice] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const esInvitado = !token;

  useEffect(() => {
    if (!futureNotice) return;
    const timer = window.setTimeout(() => setFutureNotice(null), 3500);
    return () => window.clearTimeout(timer);
  }, [futureNotice]);

  const isItemHistoricalLocked = useCallback(
    (item: DayChallenge): boolean => {
      if (item.status !== 'pending' || item.isToday) return false;
      if (suscripcion === 'premium') return false;
      return !isDiaDesbloqueado(gameId, item.dateKey);
    },
    [gameId, suscripcion, isDiaDesbloqueado]
  );

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

  const handleCellClick = (item: DayChallenge) => {
    if (item.status === 'completed') {
      setSelectedCompleted(item);
      return;
    }

    if (item.status === 'pending') {
      if (isItemHistoricalLocked(item)) {
        setErrorDesbloqueo(null);
        setChallengeParaDesbloquear(item);
        return;
      }
      ejecutarJuego(item);
      return;
    }

    setFutureNotice(`El desafío del día ${item.day} estará disponible el ${item.dateStr}.`);
  };

  const handleConfirmarDesbloqueo = async () => {
    if (!challengeParaDesbloquear) return;
    setDesbloqueando(true);
    setErrorDesbloqueo(null);

    const res = await desbloquearDia(gameId, challengeParaDesbloquear.dateKey);
    setDesbloqueando(false);

    if (res.success) {
      const itemToPlay = challengeParaDesbloquear;
      setChallengeParaDesbloquear(null);
      ejecutarJuego(itemToPlay);
    } else {
      setErrorDesbloqueo(res.message);
    }
  };

  return (
    <IonPage
      className="bg-[var(--calendar-primary)] text-[#46556D]"
      style={{ '--calendar-primary': theme.primaryBlue } as CSSProperties}
    >
      <CalendarHeader
        title={title}
        onBack={() => (onBack ? onBack() : navigate('/menu'))}
        primaryColor={theme.primaryBlue}
      />
      <IonContent style={{ '--background': theme.primaryBlue } as CSSProperties}>
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
                onClick={() => setFutureNotice(null)}
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
            renderCompletedModal(selectedCompleted, () => setSelectedCompleted(null))
          ) : (
            <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#294C6B]/55 px-4 py-[var(--app-safe-bottom)] backdrop-blur-sm">
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
                      {Array.from({ length: selectedCompleted.stars }, (_, i) => (
                        <IconStarSolid key={i} size={19} color="#AFA1E8" />
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCompleted(null)}
                  className="min-h-11 w-full cursor-pointer rounded-xl bg-[var(--calendar-primary)] px-4 py-3 text-sm font-bold text-white hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#53BFC9]"
                >
                  Cerrar
                </button>
              </section>
            </div>
          ))}

        {/* Modal Desbloquear Día Anterior */}
        {challengeParaDesbloquear && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 px-4 py-[var(--app-safe-bottom)] backdrop-blur-sm animate-in fade-in duration-150">
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-desbloqueo-title"
              className="calendar-shared-modal-card w-full max-w-[400px] rounded-3xl border border-slate-200 bg-white p-6 text-center text-[#46556D] shadow-2xl space-y-4"
            >
              {esInvitado ? (
                <>
                  <div className="mx-auto size-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shadow-xs">
                    <IconLock size={26} color="#D97706" />
                  </div>
                  <div>
                    <h2 id="modal-desbloqueo-title" className="text-lg font-black text-slate-900">
                      Desafío del {challengeParaDesbloquear.dateStr}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Este desafío pertenece a un día anterior.
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 space-y-2">
                    <p className="font-semibold text-slate-800">
                      Iniciá sesión o registrate para desbloquear desafíos de días anteriores y acumular puntos.
                    </p>
                    <p className="text-[11px] text-slate-500">
                      El desafío de hoy está siempre disponible para que juegues gratis.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => navigate('/login')}
                      className="min-h-11 w-full cursor-pointer rounded-xl bg-[#002B5E] px-4 py-3 text-sm font-bold text-white hover:bg-slate-900 transition shadow-sm"
                    >
                      Iniciar Sesión / Registrarse
                    </button>
                    <button
                      type="button"
                      onClick={() => setChallengeParaDesbloquear(null)}
                      className="min-h-10 w-full cursor-pointer rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                    >
                      Volver al calendario
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mx-auto size-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shadow-xs">
                    <IconCoins size={28} color="#D97706" />
                  </div>
                  <div>
                    <h2 id="modal-desbloqueo-title" className="text-lg font-black text-slate-900">
                      Desbloquear Desafío Histórico
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Día {challengeParaDesbloquear.day} · {challengeParaDesbloquear.dateStr}
                    </p>
                  </div>

                  {errorDesbloqueo && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold text-left">
                      {errorDesbloqueo}
                    </div>
                  )}

                  {/* Resumen de Saldo y Costo */}
                  <div className="grid grid-cols-2 gap-2.5 bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
                    <div className="text-left">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tus Puntos</div>
                      <div className="text-base font-black text-slate-900 flex items-center gap-1">
                        <IconCoins size={14} color="#D97706" />
                        <span>{puntos}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Costo</div>
                      <div className="text-base font-black text-amber-600">
                        {costoDesbloqueoDiaPuntos} pts
                      </div>
                    </div>
                  </div>

                  {puntos >= costoDesbloqueoDiaPuntos ? (
                    <>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        ¿Querés desbloquear este desafío? Quedará disponible en tu cuenta para siempre y podrás sumar puntos al ganarlo.
                      </p>
                      <div className="flex flex-col gap-2 pt-2">
                        <button
                          type="button"
                          onClick={handleConfirmarDesbloqueo}
                          disabled={desbloqueando}
                          className="min-h-11 w-full cursor-pointer rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-3 text-sm font-extrabold text-white transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {desbloqueando ? (
                            <>
                              <IconSpinner size={18} color="#FFFFFF" />
                              <span>Desbloqueando...</span>
                            </>
                          ) : (
                            <>
                              <IconCoins size={16} color="#FFFFFF" />
                              <span>Desbloquear por {costoDesbloqueoDiaPuntos} pts</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setChallengeParaDesbloquear(null)}
                          className="min-h-10 w-full cursor-pointer rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                        >
                          Cancelar
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 text-xs text-amber-900 font-medium">
                        Te faltan <strong>{costoDesbloqueoDiaPuntos - puntos} puntos</strong> para desbloquear este día. ¡Jugá los desafíos de hoy para sumar puntos o pasate a Premium!
                      </div>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setChallengeParaDesbloquear(null)}
                          className="min-h-11 w-full cursor-pointer rounded-xl bg-slate-800 hover:bg-slate-900 px-4 py-3 text-sm font-bold text-white transition shadow-sm"
                        >
                          Entendido
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </section>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
}
