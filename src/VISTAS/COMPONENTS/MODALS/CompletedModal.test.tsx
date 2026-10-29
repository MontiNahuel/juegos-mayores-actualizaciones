import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CompletedModal } from './CompletedModal';

const tienda = vi.hoisted(() => vi.fn());
vi.mock('../../../context/PlayerEconomyContext', () => ({
  usePlayerEconomy: () => ({ abrirMiniTienda: tienda, isMiniTiendaOpen: false }),
}));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('modal compartido de resultados', () => {
  it.each([
    ['wordle', '¡Palabra descubierta!'],
    ['sudoku', '¡Desafío completado!'],
    ['sopa_letras', '¡Sopa de letras completada!'],
    ['crucigrama', '¡Crucigrama completado!'],
  ] as const)('muestra el resultado de %s y permite cerrar', (gameId, titulo) => {
    const cerrar = vi.fn();
    render(<CompletedModal gameId={gameId} onClose={cerrar} />);
    expect(screen.getByRole('dialog')).toHaveAccessibleName(titulo);
    fireEvent.click(screen.getByRole('button', { name: 'Volver al calendario' }));
    expect(cerrar).toHaveBeenCalledOnce();
  });

  it('preserva estrellas, puntaje y tiempo en cero', () => {
    render(<CompletedModal gameId="crucigrama" challenge={{ stars: 0, score: 0, config: { timeTaken: 0, words: [{ word: 'CASA', clue: 'Hogar' }] } }} onClose={vi.fn()} />);
    expect(screen.getByLabelText('0 de 3 estrellas')).toBeTruthy();
    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.getByText('0:00')).toBeTruthy();
    expect(screen.getByText('CASA')).toBeTruthy();
    expect(screen.getByText('Hogar')).toBeTruthy();
  });

  it('ofrece vidas y reinicio al perder, sin mostrar estrellas', () => {
    const reiniciar = vi.fn();
    render(<CompletedModal gameId="sudoku" isGameOver onRestart={reiniciar} onClose={vi.fn()} />);
    expect(screen.queryByLabelText('3 de 3 estrellas')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Conseguir vidas' }));
    expect(tienda).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Jugar de nuevo' }));
    expect(reiniciar).toHaveBeenCalledOnce();
  });

  it('muestra la solución de Wordle al perder sin ofrecer vidas', () => {
    render(<CompletedModal gameId="wordle" isGameOver challenge={{ attempts: 6, config: { solution: 'ARBOL' } }} onClose={vi.fn()} />);
    expect(screen.getByText('ARBOL')).toBeTruthy();
    expect(screen.getByText('6 de 6')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Conseguir vidas' })).toBeNull();
  });
});
