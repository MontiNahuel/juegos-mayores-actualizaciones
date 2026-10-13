import React from 'react';
import type { DayChallenge, CalendarTheme } from './types';
import { CalendarCell } from './CalendarCell';
import { IconCalendar, IconSpinner, IconChevronLeft, IconChevronRight } from './icons';

const WEEKDAYS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

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

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  challenges,
  loading,
  year,
  month,
  monthName,
  theme,
  canGoPrev = false,
  canGoNext = false,
  onPrevMonth,
  onNextMonth,
  onCellClick,
}) => {
  // Cálculo del offset del primer día de la semana (LUN=0 .. DOM=6)
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const emptyDaysOffset = (firstDayOfMonth + 6) % 7;
  // Días vacíos al final para completar simétricamente la última fila (de 7 columnas)
  const totalOccupiedSlots = emptyDaysOffset + challenges.length;
  const trailingEmptyOffset = challenges.length > 0 ? (7 - (totalOccupiedSlots % 7)) % 7 : 0;

  return (
    <div
      className="calendar-shared-cal-card"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 20,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '16px 14px',
        width: '100%',
      }}
    >
      {/* Encabezado del Mes con Navegación Accesible [ ‹ ] Mes Año [ › ] */}
      <div
        style={{
          alignItems: 'center',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex',
          justifyContent: 'space-between',
          paddingBottom: 10,
          width: '100%',
        }}
      >
        {/* Botón Mes Anterior */}
        <button
          type="button"
          onClick={onPrevMonth}
          disabled={!canGoPrev}
          aria-label="Ver mes anterior"
          title={canGoPrev ? 'Ver mes anterior' : 'No hay meses anteriores disponibles'}
          style={{
            alignItems: 'center',
            background: canGoPrev ? '#F8FAFC' : '#F1F5F9',
            border: canGoPrev ? '1.5px solid #CBD5E1' : '1.5px solid #E2E8F0',
            borderRadius: 14,
            boxShadow: canGoPrev ? '0 1px 3px rgba(0, 0, 0, 0.05)' : 'none',
            color: canGoPrev ? theme.primaryBlue : '#94A3B8',
            cursor: canGoPrev ? 'pointer' : 'not-allowed',
            display: 'inline-flex',
            height: 44,
            justifyContent: 'center',
            minHeight: 44,
            minWidth: 44,
            opacity: canGoPrev ? 1 : 0.4,
            outline: 'none',
            padding: 0,
            transition: 'all 0.15s ease',
            width: 44,
          }}
        >
          <IconChevronLeft size={22} color={canGoPrev ? theme.primaryBlue : '#94A3B8'} />
        </button>

        {/* Título Central del Mes y Año */}
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            gap: 8,
            justifyContent: 'center',
          }}
        >
          <IconCalendar size={22} color={theme.primaryBlue} />
          <h3
            style={{
              color: theme.primaryBlue,
              fontSize: 18,
              fontWeight: 900,
              letterSpacing: '-0.01em',
              margin: 0,
            }}
          >
            {monthName} {year}
          </h3>
        </div>

        {/* Botón Mes Siguiente */}
        <button
          type="button"
          onClick={onNextMonth}
          disabled={!canGoNext}
          aria-label="Ver mes siguiente"
          title={canGoNext ? 'Ver mes siguiente' : 'Mes actual (último disponible)'}
          style={{
            alignItems: 'center',
            background: canGoNext ? '#F8FAFC' : '#F1F5F9',
            border: canGoNext ? '1.5px solid #CBD5E1' : '1.5px solid #E2E8F0',
            borderRadius: 14,
            boxShadow: canGoNext ? '0 1px 3px rgba(0, 0, 0, 0.05)' : 'none',
            color: canGoNext ? theme.primaryBlue : '#94A3B8',
            cursor: canGoNext ? 'pointer' : 'not-allowed',
            display: 'inline-flex',
            height: 44,
            justifyContent: 'center',
            minHeight: 44,
            minWidth: 44,
            opacity: canGoNext ? 1 : 0.4,
            outline: 'none',
            padding: 0,
            transition: 'all 0.15s ease',
            width: 44,
          }}
        >
          <IconChevronRight size={22} color={canGoNext ? theme.primaryBlue : '#94A3B8'} />
        </button>
      </div>

      {/* Días de la semana (LUN a DOM) */}
      <div
        className="calendar-shared-cal-grid"
        style={{
          boxSizing: 'border-box',
          display: 'grid',
          gap: 5,
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          textAlign: 'center',
          width: '100%',
        }}
      >
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            className="calendar-shared-cal-weekday"
            style={{
              boxSizing: 'border-box',
              color: '#64748B',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.02em',
              minWidth: 0,
              overflow: 'hidden',
              padding: '2px 0',
            }}
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Matriz de Días del Calendario (7 Columnas con inline style y responsive) */}
      <div className="calendar-shared-cal-body">
        {loading ? (
          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              minHeight: 222,
              justifyContent: 'center',
              padding: '24px 0',
              width: '100%',
            }}
          >
            <IconSpinner size={28} color={theme.primaryBlue} />
            <span
              style={{
                color: '#64748B',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.02em',
              }}
            >
              Cargando desafíos...
            </span>
          </div>
        ) : (
          <div
            className="calendar-shared-cal-grid"
            style={{
              boxSizing: 'border-box',
              display: 'grid',
              gap: 5,
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
              width: '100%',
            }}
          >
            {/* Espacios vacíos antes del día 1 */}
            {Array.from({ length: emptyDaysOffset }).map((_, i) => (
              <div
                key={`empty-leading-${i}`}
                className="calendar-shared-cal-cell-empty"
                style={{
                  background: 'transparent',
                  border: '1px solid transparent',
                  borderRadius: 12,
                  boxSizing: 'border-box',
                  minHeight: 56,
                  minWidth: 0,
                }}
              />
            ))}

            {/* Celdas interactivas de los días del mes */}
            {challenges.map((item) => (
              <CalendarCell
                key={item.day}
                item={item}
                theme={theme}
                onClick={onCellClick}
              />
            ))}

            {/* Espacios vacíos al final de la última semana para completar la fila */}
            {Array.from({ length: trailingEmptyOffset }).map((_, i) => (
              <div
                key={`empty-trailing-${i}`}
                className="calendar-shared-cal-cell-empty"
                style={{
                  background: 'transparent',
                  border: '1px solid transparent',
                  borderRadius: 12,
                  boxSizing: 'border-box',
                  minHeight: 56,
                  minWidth: 0,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
