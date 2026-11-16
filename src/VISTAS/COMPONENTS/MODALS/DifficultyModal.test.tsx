import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DifficultyModal } from './DifficultyModal';

afterEach(() => {
  cleanup();
});

describe('DifficultyModal', () => {
  it('muestra descripciones generales sin mencionar vidas ni corazones', () => {
    const onSelectDifficulty = vi.fn();
    const onClose = vi.fn();

    render(
      <DifficultyModal
        title="Elegí tu Desafío"
        subtitle="16 de Noviembre"
        onSelectDifficulty={onSelectDifficulty}
        onClose={onClose}
      />,
    );

    expect(screen.getByText('Nivel Inicial')).toBeInTheDocument();
    expect(screen.getByText('Nivel Intermedio')).toBeInTheDocument();
    expect(screen.getByText('Nivel Experto')).toBeInTheDocument();

    expect(screen.queryByText(/vida|coraz/i)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Nivel Intermedio/i }));
    expect(onSelectDifficulty).toHaveBeenCalledWith(2);

    fireEvent.click(screen.getByRole('button', { name: /Volver al Calendario/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
