import type { CSSProperties } from 'react';
import type { DayChallenge, CalendarTheme } from './types';
import { CalendarCell } from './CalendarCell';
import { IconCalendar, IconSpinner, IconChevronLeft, IconChevronRight } from './icons';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const monthButton = 'inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-md border border-[#DEE3EA] bg-[#F4F6F9] text-[var(--calendar-primary)] transition-colors hover:bg-[#DEE3EA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#53BFC9] disabled:cursor-default disabled:opacity-35';

interface CalendarGridProps {
  challenges: DayChallenge[];
  loading: boolean;
  year: number;
  month: number;
  monthName: string;
  theme: CalendarTheme;
  canGoPrev?: boolean;
  canGoNext?: boolean;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  onCellClick: (item: DayChallenge) => void;
}

export function CalendarGrid({ challenges, loading, year, month, monthName, theme, canGoPrev = false, canGoNext = false, onPrevMonth, onNextMonth, onCellClick }: CalendarGridProps) {
  // Alinea el primer día con lunes y completa la última semana sin inventar fechas.
  const leading = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const trailing = challenges.length ? (7 - (leading + challenges.length) % 7) % 7 : 0;

  return <section className="rounded-lg border border-[#D5DCE5] bg-white p-3 text-[#46556D] sm:p-6" aria-label="Calendario de desafíos"
    style={{ '--calendar-primary': theme.primaryBlue } as CSSProperties}>
    <div className="mb-4 flex items-center justify-between gap-2 border-b border-[#DEE3EA] pb-4">
      <button type="button" className={monthButton} onClick={onPrevMonth} disabled={!canGoPrev} aria-label="Ver mes anterior"><IconChevronLeft size={22} /></button>
      <h2 aria-live="polite" className="m-0 flex items-center gap-2 text-base leading-tight font-extrabold text-[var(--calendar-primary)] sm:text-xl">
        <span className="hidden sm:inline" aria-hidden="true"><IconCalendar size={22} color="currentColor" /></span>
        {monthName} {year}
      </h2>
      <button type="button" className={monthButton} onClick={onNextMonth} disabled={!canGoNext} aria-label="Ver mes siguiente"><IconChevronRight size={22} /></button>
    </div>
    <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-[#64748B] sm:gap-2 sm:text-sm" aria-hidden="true">
      {WEEKDAYS.map(day => <span key={day} className="min-w-0 py-1">{day}</span>)}
    </div>
    {loading ? <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-sm" role="status">
      <IconSpinner size={28} color={theme.primaryBlue} />
      Cargando desafíos...
    </div> : <div className="grid grid-cols-7 gap-1 sm:gap-2">
      {Array.from({ length: leading }, (_, i) => <span key={`before-${i}`} aria-hidden="true" />)}
      {challenges.map(item => <CalendarCell key={item.dateKey} item={item} theme={theme} onClick={onCellClick} />)}
      {Array.from({ length: trailing }, (_, i) => <span key={`after-${i}`} aria-hidden="true" />)}
    </div>}
    <ul className="m-0 mt-5 flex list-none flex-wrap gap-x-5 gap-y-2 border-t border-[#DEE3EA] p-0 pt-4 text-xs text-[#46556D] sm:text-sm" aria-label="Estados de los desafíos">
      {[
        { label: 'Hoy', color: theme.todayBg },
        { label: 'Para jugar', color: theme.pendingBorder },
        { label: 'Completado', color: theme.completedBorder },
      ].map(({ label, color }) => <li key={label} className="flex items-center gap-2"><span aria-hidden="true" className="size-2.5 rounded-full" style={{ backgroundColor: color }} />{label}</li>)}
    </ul>
  </section>;
}
