import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StreakCelebrationModal } from './StreakCelebrationModal';
import { setSessionUser } from '../../AUTH/sessionStore';
import type { TramoPuntosDiarios } from '../../../utils/rachaUtils';

const economy = vi.hoisted(() => ({
  isAuthenticated: false,
  isLoading: false,
  racha: 0,
  rachaUltimaFecha: null as string | null,
  rachaPuntosDia: 0,
  rachaTramosDiarios: [] as TramoPuntosDiarios[],
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
  economy.rachaPuntosDia = 0;
  economy.rachaTramosDiarios = [];
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
    economy.rachaPuntosDia = 40;

    const { unmount } = render(<StreakCelebrationModal />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('¡Felicidades!')).toBeInTheDocument();
    expect(screen.getByText('4 días')).toBeInTheDocument();
    expect(screen.getByText('+40 pts por ingresar hoy')).toBeInTheDocument();
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

  it('calcula los puntos diarios desde los tramos si rachaPuntosDia no viene informado', () => {
    setSessionUser({ id: 77, name: 'Ana' });
    economy.isAuthenticated = true;
    economy.racha = 15;
    economy.rachaUltimaFecha = '2026-11-16';
    economy.rachaPuntosDia = 0;
    economy.rachaTramosDiarios = [
      { dias: 1, puntos: 40 },
      { dias: 15, puntos: 80 },
      { dias: 20, puntos: 120 },
    ];

    render(<StreakCelebrationModal />);
    expect(screen.getByText('15 días')).toBeInTheDocument();
    expect(screen.getByText('+80 pts por ingresar hoy')).toBeInTheDocument();
  });
});
