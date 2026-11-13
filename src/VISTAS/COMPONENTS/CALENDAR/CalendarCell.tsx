/* Dibuja un día del calendario con su estado disponible, bloqueado o completado. */
import type { CSSProperties } from 'react';
import type { DayChallenge, CalendarTheme } from './types';
import { IconCheck, IconLock, IconPlay } from './icons';

interface CalendarCellProps {
  item: DayChallenge;
  theme: CalendarTheme;
  isHistoricalLocked?: boolean;
  onClick: (item: DayChallenge) => void;
}

// Colores del sello de desempeño: marca translúcida de fondo, sin caja ni borde.
const GRADE_WATERMARK_STYLES: Record<string, string> = {
  S: 'text-[#B8860B]/35',
  A: 'text-[#2E8B7F]/32',
  B: 'text-[#294C6B]/25',
  C: 'text-[#64748B]/25',
  F: 'text-[#C0574A]/30',
};

// Dibuja un día del calendario con su estado disponible, bloqueado o completado.
export function CalendarCell({ item, theme, isHistoricalLocked = false, onClick }: CalendarCellProps) {
  const isCompleted = item.status === 'completed';
  const isPending = item.status === 'pending';
  
  const colors = item.isToday
    ? [theme.todayBg, theme.todayBorder, theme.todayText]
    : isCompleted
    ? [theme.completedBg, theme.completedBorder, theme.completedText]
    : isHistoricalLocked
    ? ['#F8FAFC', '#CBD5E1', '#64748B']
    : isPending
    ? [theme.pendingBg, theme.pendingBorder, theme.pendingText]
    : [theme.lockedBg, theme.lockedBorder, theme.lockedText];

  const label = isCompleted
    ? 'Completado. Ver resultado'
    : isHistoricalLocked
    ? 'Día anterior bloqueado. Desbloqueable con puntos o suscripción Premium.'
    : isPending
    ? 'Disponible para jugar'
    : `Disponible el ${item.dateStr}`;

  const grade = item.grade?.toUpperCase();
  const gradeLabel = grade ? `. Calificación ${grade}` : '';

  return (
    <button
      type="button"
      onClick={/* Responde a click desde este control. */ () => onClick(item)}
      aria-label={`${item.dateStr}${item.isToday ? ', hoy' : ''}: ${label}${gradeLabel}`}
      aria-current={item.isToday ? 'date' : undefined}
      title={`Día ${item.day}: ${label}${gradeLabel}`}
      style={{ '--cell-bg': colors[0], '--cell-border': colors[1], '--cell-text': colors[2] } as CSSProperties}
      className={`relative isolate flex min-h-14 min-w-0 cursor-pointer flex-col justify-between overflow-hidden rounded-md border-[var(--cell-border)] bg-[var(--cell-bg)] p-1.5 text-[var(--cell-text)] transition-colors hover:brightness-95 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#53BFC9] sm:min-h-[76px] sm:p-2 ${
        item.isToday ? 'border-2' : isHistoricalLocked ? 'border border-dashed' : 'border'
      }`}
    >
      {grade && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute right-0.5 -z-10 -rotate-12 select-none text-[20px] leading-none font-black sm:right-1.5 sm:text-[24px] ${
            item.isToday ? 'top-0.5 text-white/30 sm:top-6' : 'top-0.5'
          } ${item.isToday ? '' : GRADE_WATERMARK_STYLES[grade] ?? ''}`}
        >
          {grade === 'S' && (
            <svg
              viewBox="0 0 48 48"
              fill="none"
              className={`absolute top-1/2 left-1/2 h-[38px] w-[38px] -translate-x-1/2 -translate-y-1/2 sm:h-[46px] sm:w-[46px] ${
                item.isToday ? 'text-[#E0B34A]/55' : 'text-[#B8860B]/45'
              }`}
            >
              <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2.6 2.8" />
              <circle cx="24" cy="24" r="16.2" stroke="currentColor" strokeWidth="1" />
              <circle cx="37.2" cy="10.8" r="1.2" fill="currentColor" />
              <circle cx="37.2" cy="37.2" r="1.2" fill="currentColor" />
              <circle cx="10.8" cy="37.2" r="1.2" fill="currentColor" />
              <circle cx="10.8" cy="10.8" r="1.2" fill="currentColor" />
            </svg>
          )}
          <span className="relative">{grade}</span>
        </span>
      )}
      <span className="flex w-full items-start justify-between gap-1">
        <span className="text-sm leading-none font-extrabold sm:text-base">{item.day}</span>
        {item.isToday && (
          <span className="hidden rounded-sm bg-[#53BFC9] px-1 py-0.5 text-[9px] leading-none font-bold text-[#294C6B] sm:inline">
            Hoy
          </span>
        )}
      </span>
      <span aria-hidden="true" className="mt-2 flex items-center justify-center gap-1 text-[11px] font-bold sm:text-xs">
        {isCompleted ? (
          <IconCheck size={16} color="currentColor" />
        ) : isHistoricalLocked ? (
          <span className="flex items-center gap-1 text-[#64748B]">
            <IconLock size={12} color="currentColor" />
            <span className="hidden sm:inline text-[10px]">Puntos</span>
          </span>
        ) : isPending ? (
          <>
            <IconPlay size={11} color="currentColor" />
            <span className="hidden sm:inline">Jugar</span>
            {item.isToday && <span className="text-[9px] sm:hidden">Hoy</span>}
          </>
        ) : (
          <IconLock size={13} color="currentColor" />
        )}
      </span>
    </button>
  );
}
