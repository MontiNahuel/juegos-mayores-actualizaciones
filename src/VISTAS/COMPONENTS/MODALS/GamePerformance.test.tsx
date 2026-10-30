import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CompletedModal } from './CompletedModal';
import { getPerformanceRank } from './gamePerformanceRank';

afterEach(cleanup);

describe('rendimiento según las vidas', () => {
  it.each([
    [0, 'F'], [1, 'D'], [2, 'B'], [3, 'B'], [4, 'S'],
  ] as const)('con %i vidas de 4 corresponde %s', (remainingLives, rank) => {
    expect(getPerformanceRank({ remainingLives })).toBe(rank);
  });

  it.each([1, 2, 3])('prioriza S al terminar sin perder ninguna de las %i vidas iniciales', initialLives => {
    expect(getPerformanceRank({ remainingLives: initialLives, initialLives })).toBe('S');
  });

  it('no otorga S si se perdieron vidas antes de una recarga', () => {
    expect(getPerformanceRank({ remainingLives: 4, livesLost: 4 })).toBe('B');
  });

  it('muestra el rango en el modal y mantiene la acción de cierre', () => {
    const onClose = vi.fn();
    render(<CompletedModal gameId="sudoku" performance={{ remainingLives: 2 }} onClose={onClose} />);
    expect(screen.getByLabelText('Rango B')).toBeInTheDocument();
    expect(screen.getByText('Vidas restantes: 2 de 4')).toBeInTheDocument();
    expect(screen.queryByLabelText(/de 3 estrellas/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Volver al calendario' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('presenta la derrota al recibir cero vidas, aunque no se indique isGameOver', () => {
    render(<CompletedModal gameId="sudoku" performance={{ remainingLives: 0 }} onClose={() => {}} />);
    expect(screen.getByLabelText('Rango F')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '¡Sin vidas restantes!' })).toBeInTheDocument();
  });

  it('mantiene los resultados existentes cuando todavía no se pasan vidas', () => {
    render(<CompletedModal gameId="sudoku" stars={2} onClose={() => {}} />);
    expect(screen.getByLabelText('2 de 3 estrellas')).toBeInTheDocument();
    expect(screen.queryByLabelText('Rendimiento de la partida')).not.toBeInTheDocument();
  });
});
