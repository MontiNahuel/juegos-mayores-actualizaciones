import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setSessionUser } from '../AUTH/sessionStore';
import Perfil from './Perfil';
import type { PerfilResumen } from './perfilService';

const economy = vi.hoisted(() => ({
  isAuthenticated: true,
  isLoading: false,
  racha: 12,
  rachaHoyIngresada: true,
  puntos: 1450,
  suscripcion: 'premium' as 'premium' | 'basica',
  diasDesbloqueados: [] as string[],
  bonusRacha: {
    activo: true,
    modo: 'porcentaje' as const,
    tramos: [
      { dias: 10, valor: 10 },
      { dias: 15, valor: 20 },
    ],
  },
}));

const fetchPerfilResumen = vi.hoisted(() => vi.fn());
const fetchPlanes = vi.hoisted(() => vi.fn());

vi.mock('../../context/PlayerEconomyContext', () => ({
  usePlayerEconomy: () => economy,
}));
vi.mock('./perfilService', () => ({ fetchPerfilResumen }));
vi.mock('./planesService', () => ({ fetchPlanes }));
vi.mock('../COMPONENTS/Navbar/AppNavbar', () => ({
  default: ({ view }: { view: { title: string; onBack: () => void } }) => (
    <header>
      <h1>{view.title}</h1>
      <button type="button" onClick={view.onBack}>
        Volver
      </button>
    </header>
  ),
}));
vi.mock('@ionic/react', () => ({
  IonPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  IonContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  IonIcon: () => <span aria-hidden="true" />,
}));

const RESUMEN: PerfilResumen = {
  periodo: { mes: '2026-11', desde: '2026-08-22', hasta: '2026-11-13' },
  medallas: {
    mes_actual: {
      wordle: { S: 2, A: 1, B: 0, C: 0, F: 1 },
      sopa_letras: { S: 0, A: 0, B: 3, C: 0, F: 0 },
    },
    historico: {
      wordle: { S: 5, A: 3, B: 1, C: 0, F: 2 },
      sudoku: { S: 1, A: 1, B: 1, C: 1, F: 1 },
    },
  },
  rendimiento: {
    wordle: {
      completadas: 9,
      mejor_tiempo_segundos: 120,
      promedio_tiempo_segundos: 180,
      ultima_fecha: '2026-11-12',
    },
    sopa_letras: {
      completadas: 3,
      mejor_tiempo_segundos: 80,
      promedio_tiempo_segundos: 95,
      ultima_fecha: '2026-11-02',
    },
  },
  actividad: ['2026-11-13', '2026-11-12'],
};

/** Refleja la ruta activa para comprobar los regresos del perfil. */
function SondaRuta() {
  const location = useLocation();
  return (
    <>
      <span data-testid="ruta">{location.pathname}</span>
      <span data-testid="origen">
        {(location.state as { from?: string } | null)?.from ?? ''}
      </span>
    </>
  );
}

function renderPerfil(
  entry: string | { pathname: string; state?: unknown } = '/perfil',
) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Perfil />
      <SondaRuta />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  setSessionUser({ id: 1, name: 'Ana Pérez', dateStart: '2026-08-14' });
  economy.isAuthenticated = true;
  economy.isLoading = false;
  economy.racha = 12;
  economy.rachaHoyIngresada = true;
  economy.puntos = 1450;
  economy.suscripcion = 'premium';
  economy.diasDesbloqueados = [];
  fetchPerfilResumen.mockReset();
  fetchPerfilResumen.mockResolvedValue(RESUMEN);
  fetchPlanes.mockReset();
  fetchPlanes.mockResolvedValue({
    anual_habilitado: true,
    planes: [
      {
        codigo: 'premium',
        nombre: 'Premium',
        descripcion: 'Todo el archivo de desafíos',
        precio: { monto: 5000, moneda: 'ARS' },
        descuento_anual_pct: 20,
        precio_anual: { monto: 48000, moneda: 'ARS' },
        beneficios: ['Sin anuncios'],
        orden: 0,
        visible: true,
        habilitado: false,
        updated_at: null,
      },
    ],
  });
});

afterEach(() => {
  cleanup();
  setSessionUser(null);
  vi.clearAllMocks();
});

describe('Perfil: resumen autenticado', () => {
  it('muestra identidad, medallas del mes, histórico y rendimiento por juego', async () => {
    renderPerfil();

    expect(await screen.findByRole('article', { name: 'Palabra del día' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ana Pérez' })).toBeInTheDocument();
    expect(screen.getByText('Miembro desde agosto de 2026 · Noviembre de 2026 en curso')).toBeInTheDocument();
    expect(screen.getByText('Plan Premium')).toBeInTheDocument();
    expect(screen.getByText(/7 medallas en total/)).toBeInTheDocument();
    expect(screen.getByText('Acceso completo al archivo de desafíos.')).toBeInTheDocument();
    expect(screen.getByText('1.450')).toBeInTheDocument();

    const wordle = screen.getByRole('article', { name: 'Palabra del día' });
    expect(within(wordle).getByLabelText('2 medallas S')).toBeInTheDocument();
    expect(within(wordle).getByLabelText('1 medalla F')).toBeInTheDocument();
    expect(within(wordle).getByText('Histórico · 5 S · 3 A · 1 B · 2 F')).toBeInTheDocument();
    expect(within(wordle).getByText('2:00')).toBeInTheDocument();
    expect(within(wordle).getByText('3:00')).toBeInTheDocument();
    expect(within(wordle).getByText('9')).toBeInTheDocument();

    const sopa = screen.getByRole('article', { name: 'Sopa de letras' });
    expect(within(sopa).getByLabelText('3 medallas B')).toBeInTheDocument();
    expect(within(sopa).getByText('Histórico · Sin medallas todavía')).toBeInTheDocument();

    expect(screen.getByText(/2 días con actividad/)).toBeInTheDocument();
    expect(screen.getByText(/Te faltan 3 para sumar 20% extra/)).toBeInTheDocument();
    expect(screen.getByText('1 de 2 hitos completados.')).toBeInTheDocument();
  });

  it('describe el plan básico con los días desbloqueados', async () => {
    economy.suscripcion = 'basica';
    economy.diasDesbloqueados = ['wordle:2026-11-01', 'sudoku:2026-11-02'];
    renderPerfil();

    expect(await screen.findByText('Básica')).toBeInTheDocument();
    expect(screen.getByText('2 días desbloqueados con puntos.')).toBeInTheDocument();
  });

  it('abre el catálogo de planes desde el badge del plan básico', async () => {
    economy.suscripcion = 'basica';
    renderPerfil();

    fireEvent.click(await screen.findByRole('button', { name: /Mejorar suscripción/ }));

    const dialogo = await screen.findByRole('dialog');
    expect(within(dialogo).getByRole('heading', { name: 'Mejorar suscripción' })).toBeInTheDocument();
    expect(await within(dialogo).findByText('Premium')).toBeInTheDocument();
    expect(within(dialogo).getByRole('button', { name: 'Premium: próximamente' })).toBeDisabled();
    expect(fetchPlanes).toHaveBeenCalledTimes(1);
  });

  it('no ofrece mejorar la suscripción cuando la cuenta ya es premium', async () => {
    renderPerfil();

    await screen.findByRole('article', { name: 'Palabra del día' });
    expect(screen.queryByRole('button', { name: /Mejorar suscripción/ })).not.toBeInTheDocument();
    expect(fetchPlanes).not.toHaveBeenCalled();
  });

  it('reintenta la carga cuando el resumen falla', async () => {
    fetchPerfilResumen.mockReset();
    fetchPerfilResumen.mockResolvedValueOnce(null).mockResolvedValue(RESUMEN);
    renderPerfil();

    expect(await screen.findByText(/No pudimos cargar tus medallas/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Reintentar/ }));

    await waitFor(() =>
      expect(screen.getByRole('article', { name: 'Palabra del día' })).toBeInTheDocument(),
    );
    expect(fetchPerfilResumen).toHaveBeenCalledTimes(2);
  });
});

describe('Perfil: acceso y regreso', () => {
  it('muestra la invitación a iniciar sesión y vuelve al menú sin consultar el resumen', async () => {
    economy.isAuthenticated = false;
    economy.isLoading = false;
    renderPerfil();

    expect(await screen.findByText('Tu perfil te espera')).toBeInTheDocument();
    expect(fetchPerfilResumen).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Volver al menú' }));
    expect(screen.getByTestId('ruta')).toHaveTextContent('/menu');
  });

  it('vuelve a la pantalla de origen recibida por el estado de navegación', async () => {
    renderPerfil({ pathname: '/perfil', state: { from: '/juegos/wordle' } });
    await screen.findByRole('article', { name: 'Palabra del día' });
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(screen.getByTestId('ruta')).toHaveTextContent('/juegos/wordle');
  });

  it('ignora orígenes externos y vuelve al menú', async () => {
    renderPerfil({ pathname: '/perfil', state: { from: 'https://ejemplo.com' } });
    await screen.findByRole('article', { name: 'Palabra del día' });
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(screen.getByTestId('ruta')).toHaveTextContent('/menu');
  });
});
