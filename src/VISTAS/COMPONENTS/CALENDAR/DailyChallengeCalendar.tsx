import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { IonContent, IonPage } from '@ionic/react';
import { type DailyChallengeCalendarProps, type DayChallenge, DEFAULT_CALENDAR_THEME } from './types';
import { useGameCalendar } from './useGameCalendar';
import { CalendarHeader } from './CalendarHeader';
import { CalendarHeroCard } from './CalendarHeroCard';
import { CalendarGrid } from './CalendarGrid';
import { IconInfo, IconClose, IconCheck, IconStarSolid } from './icons';

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
  const [selectedCompleted, setSelectedCompleted] = useState<DayChallenge | null>(null);
  const [futureNotice, setFutureNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!futureNotice) return;
    const timer = window.setTimeout(() => setFutureNotice(null), 3500);
    return () => window.clearTimeout(timer);
  }, [futureNotice]);

  const handleCellClick = (item: DayChallenge) => {
    if (item.status === 'completed') {
      setSelectedCompleted(item);
    } else if (item.status === 'pending') {
      if (onPlayChallenge) onPlayChallenge(item);
      else if (playRoute) navigate(playRoute, {
        state: {
          challenge: {
            day: item.day, dateStr: item.dateStr, dateKey: item.dateKey, config: item.config,
            word: item.config?.solution || item.completedData?.word,
            hints: item.config?.hints,
          },
        },
      });
    } else setFutureNotice(`El desafío del día ${item.day} estará disponible el ${item.dateStr}.`);
  };

  return <IonPage className="bg-[var(--calendar-primary)] text-[#46556D]" style={{ '--calendar-primary': theme.primaryBlue } as CSSProperties}>
    <CalendarHeader title={title} onBack={() => onBack ? onBack() : navigate('/menu')} primaryColor={theme.primaryBlue} />
    <IonContent style={{ '--background': theme.primaryBlue } as CSSProperties}>
      <main className="mx-auto flex min-h-full w-full max-w-[760px] flex-col gap-5 px-3 pt-6 pb-[max(calc(env(safe-area-inset-bottom,0px)+32px),56px)] sm:gap-6 sm:px-6 sm:pt-8">
        {futureNotice && <div role="status" className="flex items-center justify-between gap-3 rounded-lg border border-[#53BFC9] bg-white px-4 py-3 text-sm font-semibold text-[#294C6B]">
          <span className="flex items-center gap-2"><span className="shrink-0" aria-hidden="true"><IconInfo size={20} color={theme.primaryBlue} /></span>{futureNotice}</span>
          <button type="button" aria-label="Cerrar aviso" onClick={() => setFutureNotice(null)} className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md hover:bg-[#DEE3EA] focus-visible:outline-2 focus-visible:outline-[#53BFC9]"><IconClose size={18} color="currentColor" /></button>
        </div>}
        <CalendarHeroCard todayChallenge={todayChallenge} heroBadge={heroBadge} heroSubtitle={heroSubtitle} theme={theme} onPlayClick={handleCellClick} />
        <CalendarGrid challenges={challenges} loading={loading} year={resolvedYear} month={resolvedMonth} monthName={monthName} theme={theme} canGoPrev={canGoPrev} canGoNext={canGoNext} onPrevMonth={goToPreviousMonth} onNextMonth={goToNextMonth} onCellClick={handleCellClick} />
      </main>

      {selectedCompleted && (renderCompletedModal
        ? renderCompletedModal(selectedCompleted, () => setSelectedCompleted(null))
        : <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#294C6B]/55 px-4 py-[var(--app-safe-bottom)] backdrop-blur-sm">
          <section role="dialog" aria-modal="true" aria-labelledby="calendar-result-title" className="calendar-shared-modal-card w-full max-w-[360px] rounded-lg border border-[#D5DCE5] bg-white p-6 text-center text-[#46556D] shadow-xl">
            <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full" style={{ backgroundColor: theme.completedBg }}><IconCheck size={26} color={theme.completedIconColor} /></span>
            <h2 id="calendar-result-title" className="m-0 text-xl leading-tight font-extrabold">Desafío del {selectedCompleted.dateStr}</h2>
            <div className="my-4 rounded-md bg-[#F4F6F9] p-4">
              <p className="m-0 text-sm">¡Completado con éxito!</p>
              {selectedCompleted.stars != null && <div className="mt-2 flex justify-center gap-1" aria-label={`${selectedCompleted.stars} estrellas`}>
                {Array.from({ length: selectedCompleted.stars }, (_, i) => <IconStarSolid key={i} size={19} color="#AFA1E8" />)}
              </div>}
            </div>
            <button type="button" onClick={() => setSelectedCompleted(null)} className="min-h-11 w-full cursor-pointer rounded-md bg-[var(--calendar-primary)] px-4 py-3 text-sm font-bold text-white hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#53BFC9]">Cerrar</button>
          </section>
        </div>)}
    </IonContent>
  </IonPage>;
}
