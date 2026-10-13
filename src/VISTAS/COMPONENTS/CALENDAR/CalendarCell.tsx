import React from 'react';
import type { CSSProperties } from 'react';
import type { DayChallenge, CalendarTheme } from './types';
import { IconCheck, IconLock, IconPlay, IconChevronSmall } from './icons';

interface CalendarCellProps {
  item: DayChallenge;
  theme: CalendarTheme;
  onClick: (item: DayChallenge) => void;
}

export const CalendarCell: React.FC<CalendarCellProps> = ({ item, theme, onClick }) => {
  const isCompleted = item.status === 'completed';
  const isPending = item.status === 'pending';
  const isToday = item.isToday;

  let cellStyle: CSSProperties = {
    alignItems: 'center',
    borderRadius: 12,
    boxSizing: 'border-box',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: 56,
    minWidth: 0,
    outline: 'none',
    padding: '5px 3px 5px',
    position: 'relative',
    transition: 'transform 0.1s ease',
    width: '100%',
  };

  if (isToday) {
    cellStyle = {
      ...cellStyle,
      background: theme.todayBg,
      border: `2px solid ${theme.todayBorder}`,
      boxShadow: '0 3px 10px rgba(41, 76, 107, 0.35)',
      color: theme.todayText,
    };
  } else if (isCompleted) {
    cellStyle = {
      ...cellStyle,
      background: theme.completedBg,
      border: `1.5px solid ${theme.completedBorder}`,
      boxShadow: '0 1px 4px rgba(83, 191, 201, 0.16)',
      color: theme.completedText,
    };
  } else if (isPending) {
    cellStyle = {
      ...cellStyle,
      background: theme.pendingBg,
      border: `1.5px solid ${theme.pendingBorder}`,
      boxShadow: '0 1px 4px rgba(251, 146, 60, 0.18)',
      color: theme.pendingText,
    };
  } else {
    cellStyle = {
      ...cellStyle,
      background: theme.lockedBg,
      border: `1px solid ${theme.lockedBorder}`,
      color: theme.lockedText,
      opacity: 0.55,
    };
  }

  const numberColor = isToday
    ? theme.todayText
    : isCompleted
    ? theme.completedText
    : isPending
    ? theme.pendingText
    : 'inherit';

  return (
    <button
      onClick={() => onClick(item)}
      style={cellStyle}
      className="calendar-shared-cell active:scale-95"
      title={
        isCompleted
          ? `Día ${item.day}: Completado (Click para ver resultado)`
          : isPending
          ? `Día ${item.day}: Pendiente (Click para jugar)`
          : `Día ${item.day}: Disponible el ${item.dateStr}`
      }
    >
      {/* Fila superior: Número del día y badge "Hoy" */}
      <div
        style={{
          alignItems: 'flex-start',
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        <span
          className="calendar-shared-day-num"
          style={{
            color: numberColor,
            fontSize: 13,
            fontWeight: 900,
            lineHeight: 1,
            paddingLeft: 2,
          }}
        >
          {item.day}
        </span>

        {isToday && (
          <span
            className="calendar-shared-today-top-badge"
            style={{
              background: theme.accentTeal,
              borderRadius: 3,
              color: '#1A344A',
              fontSize: 8,
              fontWeight: 900,
              letterSpacing: '0.02em',
              lineHeight: 1,
              padding: '2px 3px',
              textTransform: 'uppercase',
            }}
          >
            Hoy
          </span>
        )}
      </div>

      {/* Fila inferior: Indicador con SVG o badge Hoy */}
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 2,
          marginTop: 'auto',
          minHeight: 12,
          width: '100%',
        }}
      >
        {isCompleted ? (
          <IconCheck size={16} color={theme.completedIconColor} className="calendar-shared-check-icon" />
        ) : isToday ? (
          <>
            {/* En celulares: solo la palabra hoy mas abajo */}
            <span
              className="calendar-shared-today-bottom-text"
              style={{
                color: theme.accentTeal,
                fontSize: 9,
                fontWeight: 900,
                letterSpacing: '0.02em',
                lineHeight: 1,
                textTransform: 'uppercase',
              }}
            >
              Hoy
            </span>
            {/* En desktop: jugar */}
            <div
              className="calendar-shared-jugar-badge"
              style={{
                alignItems: 'center',
                color: theme.accentTeal,
                gap: 1,
                fontSize: 10,
                fontWeight: 800,
              }}
            >
              <span>Jugar</span>
              <IconChevronSmall size={10} color={theme.accentTeal} />
            </div>
          </>
        ) : isPending ? (
          <>
            {/* En celulares: icono play visible en coral */}
            <IconPlay size={10} color={theme.pendingIconColor} className="calendar-shared-play-icon" />
            {/* En desktop: jugar con icono play */}
            <div
              className="calendar-shared-jugar-badge"
              style={{
                alignItems: 'center',
                color: theme.pendingText,
                gap: 2,
                fontSize: 10,
                fontWeight: 900,
              }}
            >
              <IconPlay size={8} color={theme.pendingIconColor} />
              <span>Jugar</span>
            </div>
          </>
        ) : (
          <IconLock size={12} color={theme.lockedIconColor} className="calendar-shared-lock-icon" />
        )}
      </div>
    </button>
  );
};
