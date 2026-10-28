import type { CSSProperties } from 'react';
import type { DayChallenge, CalendarTheme } from './types';
import { IconCheck, IconLock, IconPlay } from './icons';

interface CalendarCellProps {
  item: DayChallenge;
  theme: CalendarTheme;
  onClick: (item: DayChallenge) => void;
}

export function CalendarCell({ item, theme, onClick }: CalendarCellProps) {
  const isCompleted = item.status === 'completed';
  const isPending = item.status === 'pending';
  const colors = item.isToday
    ? [theme.todayBg, theme.todayBorder, theme.todayText]
    : isCompleted ? [theme.completedBg, theme.completedBorder, theme.completedText]
    : isPending ? [theme.pendingBg, theme.pendingBorder, theme.pendingText]
    : [theme.lockedBg, theme.lockedBorder, theme.lockedText];
  const label = isCompleted ? 'Completado. Ver resultado' : isPending ? 'Disponible para jugar' : `Disponible el ${item.dateStr}`;

  return <button type="button" onClick={() => onClick(item)}
    aria-label={`${item.dateStr}${item.isToday ? ', hoy' : ''}: ${label}`}
    aria-current={item.isToday ? 'date' : undefined}
    title={`Día ${item.day}: ${label}`}
    style={{ '--cell-bg': colors[0], '--cell-border': colors[1], '--cell-text': colors[2] } as CSSProperties}
    className={`flex min-h-14 min-w-0 cursor-pointer flex-col justify-between rounded-md border-[var(--cell-border)] bg-[var(--cell-bg)] p-1.5 text-[var(--cell-text)] transition-colors hover:brightness-95 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#53BFC9] sm:min-h-[76px] sm:p-2 ${item.isToday ? 'border-2' : 'border'}`}>
    <span className="flex w-full items-start justify-between gap-1">
      <span className="text-sm leading-none font-extrabold sm:text-base">{item.day}</span>
      {item.isToday && <span className="hidden rounded-sm bg-[#53BFC9] px-1 py-0.5 text-[9px] leading-none font-bold text-[#294C6B] sm:inline">Hoy</span>}
    </span>
    <span aria-hidden="true" className="mt-2 flex items-center justify-center gap-1 text-[11px] font-bold sm:text-xs">
      {isCompleted ? <IconCheck size={16} color="currentColor" />
        : isPending ? <>
          <IconPlay size={11} color="currentColor" />
          <span className="hidden sm:inline">Jugar</span>
          {item.isToday && <span className="text-[9px] sm:hidden">Hoy</span>}
        </> : <IconLock size={13} color="currentColor" />}
    </span>
  </button>;
}
