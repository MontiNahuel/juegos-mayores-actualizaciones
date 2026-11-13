import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StreakProgressModal } from './StreakProgressModal';
import type { BonusRachaConfig } from '../../../store/playerEconomySlice';

const economy = vi.hoisted(() => ({
  racha: 0,
  bonusRacha: null as BonusRachaConfig | null,
  recargarEconomia: vi.fn(),
}));

vi.mock('../../../context/PlayerEconomyContext', () => ({
  usePlayerEconomy: () => economy,
}));
vi.mock('@ionic/react', () => ({
  IonIcon: () => <span aria-hidden="true" />,
}));

const HITOS: BonusRachaConfig = {
  activo: false,
  modo: 'porcentaje',
  tramos: [
    { dias: 20, valor: 30 },
    { dias: 10, valor: 10 },
    { dias: 15, valor: 20 },
  ],
};

beforeEach(() => {
  economy.racha = 0;
  economy.bonusRacha = HITOS;
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('StreakProgressModal', () => {
  it('muestra el avance dentro del tramo hasta el próximo hito y el total configurado', () => {
    economy.racha = 12;
    const onClose = vi.fn();

    render(<StreakProgressModal isOpen onClose={onClose} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tu racha' })).toBeInTheDocument();
    expect(screen.getByText('12 días')).toBeInTheDocument();
    expect(screen.getByText('Próximo hito: 15 días')).toBeInTheDocument();
    expect(screen.getByText('Te faltan 3 días')).toBeInTheDocument();
    expect(screen.getByText('1 de 3 hitos')).toBeInTheDocument();

    const barra = screen.getByRole('progressbar');
    expect(barra).toHaveAttribute('aria-valuenow', '60');
    expect(barra).toHaveAttribute('aria-valuetext', '3 días para el hito de 15 días');
    expect(screen.getByText('10 días')).toBeInTheDocument();
    expect(screen.getByText('20 días')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Seguir jugando' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('toma los hitos del backend y respeta un primer hito distinto de 10', () => {
    economy.racha = 3;
    economy.bonusRacha = {
      activo: true,
      modo: 'puntos_fijos',
      tramos: [
        { dias: 15, valor: 20 },
        { dias: 5, valor: 5 },
      ],
    };

    render(<StreakProgressModal isOpen onClose={vi.fn()} />);

    expect(screen.getByText('Próximo hito: 5 días')).toBeInTheDocument();
    expect(screen.getByText('Te faltan 2 días')).toBeInTheDocument();
    expect(screen.getByText('0 de 2 hitos')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '20');
    expect(screen.getByText('+5 pts')).toBeInTheDocument();
    expect(screen.getByText('+20 pts')).toBeInTheDocument();
  });

  it('no inventa hitos cuando el backend no entrega tramos', () => {
    economy.racha = 4;
    economy.bonusRacha = null;

    render(<StreakProgressModal isOpen onClose={vi.fn()} />);

    expect(screen.getByText('Todavía no hay hitos de racha configurados.')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.queryByText(/Próximo hito/)).toBeNull();
  });

  it('celebra cuando ya alcanzó todos los hitos', () => {
    economy.racha = 25;

    render(<StreakProgressModal isOpen onClose={vi.fn()} />);

    expect(screen.getByText('Completaste todos los hitos')).toBeInTheDocument();
    expect(screen.getByText('Ya alcanzaste la meta máxima.')).toBeInTheDocument();
    expect(screen.getByText('3 de 3 hitos')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText('20 días')).toBeInTheDocument();
  });

  it('sólo nombra la recompensa cuando el bonus está activo', () => {
    economy.racha = 12;
    const { rerender } = render(<StreakProgressModal isOpen onClose={vi.fn()} />);
    expect(screen.queryByText('+20%')).not.toBeInTheDocument();

    economy.bonusRacha = { ...HITOS, activo: true };
    rerender(<StreakProgressModal isOpen onClose={vi.fn()} />);
    expect(screen.getByText('+10%')).toBeInTheDocument();
    expect(screen.getByText('+20%')).toBeInTheDocument();
    expect(screen.getByText('+30%')).toBeInTheDocument();

    economy.bonusRacha = { ...HITOS, activo: true, modo: 'puntos_fijos' };
    rerender(<StreakProgressModal isOpen onClose={vi.fn()} />);
    expect(screen.getByText('+10 pts')).toBeInTheDocument();
  });

  it('revalida la economía al abrir para traer los hitos vigentes', () => {
    const { rerender } = render(<StreakProgressModal isOpen={false} onClose={vi.fn()} />);
    expect(economy.recargarEconomia).not.toHaveBeenCalled();

    rerender(<StreakProgressModal isOpen onClose={vi.fn()} />);
    expect(economy.recargarEconomia).toHaveBeenCalledOnce();
  });

  it('no renderiza nada cerrado', () => {
    render(<StreakProgressModal isOpen={false} onClose={vi.fn()} />);

    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
