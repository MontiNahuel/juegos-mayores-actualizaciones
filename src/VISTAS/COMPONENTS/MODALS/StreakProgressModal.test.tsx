import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StreakProgressModal } from './StreakProgressModal';
import type { TramoPuntosDiarios } from '../../../utils/rachaUtils';
import type { BonusRachaConfig } from '../../../store/playerEconomySlice';

const economy = vi.hoisted(() => ({
  racha: 0,
  rachaPuntosDia: 0,
  rachaTramosDiarios: [] as TramoPuntosDiarios[],
  bonusRacha: null as BonusRachaConfig | null,
  recargarEconomia: vi.fn(),
}));

vi.mock('../../../context/PlayerEconomyContext', () => ({
  usePlayerEconomy: () => economy,
}));
vi.mock('@ionic/react', () => ({
  IonIcon: () => <span aria-hidden="true" />,
}));

const TRAMOS: TramoPuntosDiarios[] = [
  { dias: 1, puntos: 40 },
  { dias: 15, puntos: 80 },
  { dias: 20, puntos: 120 },
  { dias: 25, puntos: 160 },
];

beforeEach(() => {
  economy.racha = 0;
  economy.rachaPuntosDia = 0;
  economy.rachaTramosDiarios = TRAMOS;
  economy.bonusRacha = null;
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('StreakProgressModal', () => {
  it('muestra los puntos por día junto a la racha actual y en cada hito', () => {
    economy.racha = 1;
    economy.rachaPuntosDia = 40;
    const onClose = vi.fn();

    render(<StreakProgressModal isOpen onClose={onClose} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tu racha' })).toBeInTheDocument();
    // "1 día" aparece como racha actual y como etiqueta del primer hito.
    expect(screen.getAllByText('1 día')).toHaveLength(2);
    expect(screen.getByText('[+40 pts / día]')).toBeInTheDocument();

    // Cada hito: recompensa arriba y los días debajo.
    expect(screen.getAllByText('+40 pts / día')).toHaveLength(1);
    expect(screen.getByText('+80 pts / día')).toBeInTheDocument();
    expect(screen.getByText('+120 pts / día')).toBeInTheDocument();
    expect(screen.getByText('+160 pts / día')).toBeInTheDocument();
    expect(screen.getByText('15 días')).toBeInTheDocument();
    expect(screen.getByText('20 días')).toBeInTheDocument();
    expect(screen.getByText('25 días')).toBeInTheDocument();

    expect(screen.getByText('Próximo hito: 15 días')).toBeInTheDocument();
    expect(screen.getByText('Te faltan 14 días')).toBeInTheDocument();
    expect(screen.getByText('1 de 4 hitos')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Seguir jugando' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('el puntaje diario refleja el tramo actual de la racha', () => {
    economy.racha = 16;
    economy.rachaPuntosDia = 80;

    render(<StreakProgressModal isOpen onClose={vi.fn()} />);

    expect(screen.getByText('[+80 pts / día]')).toBeInTheDocument();
    expect(screen.getByText('Próximo hito: 20 días')).toBeInTheDocument();
    expect(screen.getByText('2 de 4 hitos')).toBeInTheDocument();
  });

  it('sin racha anticipa los puntos del primer día', () => {
    economy.racha = 0;
    economy.rachaPuntosDia = 0;

    render(<StreakProgressModal isOpen onClose={vi.fn()} />);

    expect(screen.getByText('[+40 pts / día]')).toBeInTheDocument();
  });

  it('no inventa hitos cuando el backend no entrega tramos', () => {
    economy.racha = 4;
    economy.rachaTramosDiarios = [];

    render(<StreakProgressModal isOpen onClose={vi.fn()} />);

    expect(screen.getByText('Todavía no hay hitos de racha configurados.')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.queryByText(/Próximo hito/)).toBeNull();
  });

  it('celebra cuando ya alcanzó todos los hitos', () => {
    economy.racha = 25;
    economy.rachaPuntosDia = 160;

    render(<StreakProgressModal isOpen onClose={vi.fn()} />);

    expect(screen.getByText('Completaste todos los hitos')).toBeInTheDocument();
    expect(screen.getByText('Ya alcanzaste la meta máxima.')).toBeInTheDocument();
    expect(screen.getByText('4 de 4 hitos')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText('[+160 pts / día]')).toBeInTheDocument();
  });

  it('muestra el bonus por victoria sólo cuando está activo y marca el tramo vigente', () => {
    economy.racha = 16;
    economy.rachaPuntosDia = 80;
    const { rerender } = render(<StreakProgressModal isOpen onClose={vi.fn()} />);
    expect(screen.queryByText('Bonus al ganar una partida')).toBeNull();

    economy.bonusRacha = {
      activo: true,
      modo: 'porcentaje',
      tramos: [
        { dias: 20, valor: 30 },
        { dias: 10, valor: 10 },
        { dias: 15, valor: 20 },
      ],
    };
    rerender(<StreakProgressModal isOpen onClose={vi.fn()} />);

    expect(screen.getByText('Bonus al ganar una partida')).toBeInTheDocument();
    expect(screen.getByText('+10%')).toBeInTheDocument();
    expect(screen.getByText('+20%').closest('li')).toHaveAttribute('aria-current', 'true');
    expect(screen.getByText('+30%').closest('li')).not.toHaveAttribute('aria-current');
    // Los puntos diarios siguen visibles junto al bonus.
    expect(screen.getByText('[+80 pts / día]')).toBeInTheDocument();
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
