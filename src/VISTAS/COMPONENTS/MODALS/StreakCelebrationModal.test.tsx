import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StreakCelebrationModal } from './StreakCelebrationModal';
import { setSessionUser } from '../../AUTH/sessionStore';

const economy = vi.hoisted(() => ({
  isAuthenticated: false,
  isLoading: false,
  racha: 0,
  rachaUltimaFecha: null as string | null,
}));

vi.mock('../../../context/PlayerEconomyContext', () => ({
  usePlayerEconomy: () => economy,
}));
vi.mock('../ANIMATIONS/SuccessFireworks', () => ({
  SuccessFireworks: () => <div data-testid="fireworks" />,
}));
vi.mock('@ionic/react', () => ({
  IonIcon: () => <span aria-hidden="true" />,
}));

beforeEach(() => {
  localStorage.clear();
  setSessionUser(null);
  economy.isAuthenticated = false;
  economy.isLoading = false;
  economy.racha = 0;
  economy.rachaUltimaFecha = null;
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  setSessionUser(null);
});

describe('StreakCelebrationModal', () => {
  it('no se muestra para invitados ni con racha en 0', () => {
    render(<StreakCelebrationModal />);
    expect(screen.queryByRole('dialog')).toBeNull();

    economy.isAuthenticated = true;
    economy.racha = 0;
    economy.rachaUltimaFecha = null;
    render(<StreakCelebrationModal />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('muestra fuegos artificiales y días de racha una sola vez por fecha al autenticarse', () => {
    setSessionUser({ id: 42, name: 'Dai' });
    economy.isAuthenticated = true;
    economy.racha = 4;
    economy.rachaUltimaFecha = '2026-11-11';

    const { unmount } = render(<StreakCelebrationModal />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('¡Felicidades!')).toBeInTheDocument();
    expect(screen.getByText('4 días')).toBeInTheDocument();
    expect(screen.getByTestId('fireworks')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '¡Vamos a jugar!' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    unmount();

    // En la misma fecha no vuelve a interrumpir
    render(<StreakCelebrationModal />);
    expect(screen.queryByRole('dialog')).toBeNull();

    // Al día siguiente celebra el nuevo día
    cleanup();
    economy.racha = 5;
    economy.rachaUltimaFecha = '2026-11-12';
    render(<StreakCelebrationModal />);
    expect(screen.getByText('5 días')).toBeInTheDocument();
  });
});
