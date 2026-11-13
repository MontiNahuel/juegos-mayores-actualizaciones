import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CalendarCell } from './CalendarCell';
import { DEFAULT_CALENDAR_THEME, type DayChallenge } from './types';

const baseItem: DayChallenge = {
  day: 5,
  dateStr: '5 de Noviembre',
  dayName: 'Jueves',
  dateKey: '2026-11-05',
  status: 'completed',
};

describe('CalendarCell', () => {
  it('estampa la calificación de un día completado', () => {
    render(<CalendarCell item={{ ...baseItem, grade: 'S' }} theme={DEFAULT_CALENDAR_THEME} onClick={() => {}} />);

    const cell = screen.getByRole('button', { name: /Calificación S/ });
    expect(within(cell).getByText('S')).toBeInTheDocument();
  });

  it('muestra la F de un día perdido que sigue disponible para jugar', () => {
    const onClick = vi.fn();
    render(
      <CalendarCell
        item={{ ...baseItem, status: 'pending', grade: 'F' }}
        theme={DEFAULT_CALENDAR_THEME}
        onClick={onClick}
      />
    );

    const cell = screen.getByRole('button', { name: /Disponible para jugar\. Calificación F/ });
    expect(within(cell).getByText('F')).toBeInTheDocument();

    fireEvent.click(cell);
    expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ day: 5, status: 'pending' }));
  });

  it('agrega el anillo de premio solo a la S', () => {
    const { unmount } = render(
      <CalendarCell item={{ ...baseItem, grade: 'S' }} theme={DEFAULT_CALENDAR_THEME} onClick={() => {}} />
    );
    expect(screen.getByRole('button').querySelectorAll('svg')).toHaveLength(2);
    unmount();

    render(<CalendarCell item={{ ...baseItem, grade: 'A' }} theme={DEFAULT_CALENDAR_THEME} onClick={() => {}} />);
    expect(screen.getByRole('button').querySelectorAll('svg')).toHaveLength(1);
  });

  it('no muestra sello si el día no tiene calificación', () => {
    render(<CalendarCell item={baseItem} theme={DEFAULT_CALENDAR_THEME} onClick={() => {}} />);

    expect(screen.getByRole('button', { name: '5 de Noviembre: Completado. Ver resultado' })).toBeInTheDocument();
    expect(screen.queryByText('S')).not.toBeInTheDocument();
  });
});
