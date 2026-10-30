/* Destaca el desafío de hoy para poder empezarlo desde el calendario. */
import type { CSSProperties } from 'react';
import type { DayChallenge, CalendarTheme } from './types';
import { IconArrowRight, IconCalendar } from './icons';

interface CalendarHeroCardProps {
  todayChallenge: DayChallenge;
  heroBadge?: string;
  heroSubtitle: string;
  theme: CalendarTheme;
  onPlayClick: (challenge: DayChallenge) => void;
}

// Destaca el desafío de hoy para poder empezarlo desde el calendario.
export function CalendarHeroCard({ todayChallenge, heroBadge = 'Desafío de hoy', heroSubtitle, theme, onPlayClick }: CalendarHeroCardProps) {
  const isCompleted = todayChallenge.status === 'completed';

  return <section className="overflow-hidden rounded-lg border border-[#D5DCE5] bg-white text-[#46556D]"
    style={{ '--calendar-primary': theme.primaryBlue, '--calendar-accent': theme.accentTeal } as CSSProperties}>
    <div className="flex items-center gap-4 bg-[#DEE3EA] px-5 py-5 sm:px-6">
      <span aria-hidden="true" className="shrink-0"><IconCalendar size={42} color={theme.accentTeal} /></span>
      <div className="min-w-0">
        <p className="m-0 text-sm font-extrabold text-[var(--calendar-primary)]">{heroBadge}</p>
        <h2 className="m-0 mt-1 text-[clamp(22px,4.8vw,28px)] leading-tight font-extrabold">{todayChallenge.dayName} {todayChallenge.dateStr}</h2>
      </div>
    </div>
    <div className="px-5 py-5 sm:px-6">
      <p className="m-0 max-w-[65ch] text-base leading-relaxed">{heroSubtitle}</p>
      <button type="button" onClick={/* Responde a click desde este control. */ () => onPlayClick(todayChallenge)}
        className="mt-4 flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-[var(--calendar-primary)] px-5 py-3 text-base font-bold text-white transition-colors hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--calendar-accent)] active:brightness-95 sm:w-auto">
        {isCompleted ? 'Ver resultado de hoy' : 'Jugar desafío de hoy'}
        <IconArrowRight size={18} />
      </button>
    </div>
  </section>;
}
