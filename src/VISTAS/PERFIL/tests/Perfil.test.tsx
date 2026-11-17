import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setSessionUser } from '../../AUTH/sessionStore';
import Perfil from '../Perfil';
import type { PerfilResumen } from '../services/perfilService';

const economy = vi.hoisted(() => ({
  isAuthenticated: true,
  isLoading: false,
  racha: 12,
  rachaHoyIngresada: true,
  puntos: 1450,
  suscripcion: 'premium' as 'premium' | 'basica',
  diasDesbloqueados: [] as string[],
  rachaTramosDiarios: [
    { dias: 1, puntos: 40 },
    { dias: 15, puntos: 80 },
  ],
}));

const fetchPerfilResumen = vi.hoisted(() => vi.fn());
const fetchPlanes = vi.hoisted(() => vi.fn());

vi.mock('../../../context/PlayerEconomyContext', () => ({
  usePlayerEconomy: () => economy,
}));
vi.mock('../services/perfilService', () => ({ fetchPerfilResumen }));
vi.mock('../services/planesService', () => ({ fetchPlanes }));
vi.mock('../../COMPONENTS/Navbar/AppNavbar', () => ({
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

const juegosVacios = () => ({
  wordle: { S: 0, A: 0, B: 0, C: 0, F: 0 },
  sopa_letras: { S: 0, A: 0, B: 0, C: 0, F: 0 },
  sudoku: { S: 0, A: 0, B: 0, C: 0, F: 0 },
  crucigrama: { S: 0, A: 0, B: 0, C: 0, F: 0 },
});

const CONSEJOS = [
  {
    id: 'c1',
    texto: 'Los juegos diarios estimulan la memoria.',
    fuente: 'Wilson et al., JAMA, 2002',
    url: 'https://doi.org/10.1001/jama.287.6.742',
  },
  {
    id: 'c2',
    texto: 'Aprender algo nuevo mejora la memoria.',
    fuente: 'Park et al., Psychological Science, 2014',
    url: 'https://doi.org/10.1177/0956797613504966',
  },
];

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
  meses: [
    {
      mes: '2026-11',
      juegos: {
        ...juegosVacios(),
        wordle: { S: 2, A: 1, B: 0, C: 0, F: 1 },
        sopa_letras: { S: 0, A: 0, B: 3, C: 0, F: 0 },
      },
    },
    {
      mes: '2026-10',
      juegos: { ...juegosVacios(), wordle: { S: 2, A: 1, B: 1, C: 1, F: 0 } },
    },
    {
      mes: '2026-09',
      juegos: { ...juegosVacios(), sudoku: { S: 1, A: 2, B: 2, C: 1, F: 1 } },
    },
    { mes: '2026-08', juegos: juegosVacios() },
    {
      mes: '2026-07',
      juegos: { ...juegosVacios(), crucigrama: { S: 1, A: 0, B: 0, C: 0, F: 0 } },
    },
    {
      mes: '2026-06',
      juegos: { ...juegosVacios(), wordle: { S: 1, A: 1, B: 0, C: 0, F: 0 } },
    },
  ],
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
  completadas_por_dia: { '2026-11-13': 2, '2026-11-12': 1 },
  consejos: CONSEJOS,
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
  it('muestra identidad, progreso, medallas del mes e histórico', async () => {
    renderPerfil();

    const wordle = await screen.findByRole('article', { name: 'Palabra del día' });
    expect(screen.getByRole('heading', { name: 'Ana Pérez' })).toBeInTheDocument();
    expect(screen.getByText('Miembro desde agosto de 2026 · Noviembre de 2026 en curso')).toBeInTheDocument();
    expect(screen.getByText('Plan Premium')).toBeInTheDocument();
    expect(screen.getByText('Acceso completo al archivo de desafíos.')).toBeInTheDocument();
    expect(screen.getByText('1.450')).toBeInTheDocument();

    expect(screen.getByLabelText('20 medallas en 2026')).toBeInTheDocument();
    expect(screen.getByText('nov +1 vs oct')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /Medallas por mes:.*Promedio 3, récord 6\./ }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, elemento) =>
          elemento?.tagName.toLowerCase() === 'p' &&
          elemento.textContent === 'Noviembre suma 6 medallas; octubre cerró con 5.',
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Práctica' }));
    expect(
      screen.getByRole('img', {
        name: 'Práctica del año: Deducción verbal 10, Atención visual 3, Lógica 6, Vocabulario 1.',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, elemento) =>
          elemento?.tagName.toLowerCase() === 'p' &&
          elemento.textContent ===
            'Practicaste más Deducción verbal: 10 de 20 medallas. Después, Lógica con 6.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('img', { name: /Medallas por mes/ }),
    ).not.toBeInTheDocument();

    expect(screen.getByText('Los juegos diarios estimulan la memoria.')).toBeInTheDocument();
    expect(screen.getByText('Fuente: Wilson et al., JAMA, 2002')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Wilson et al/ })).not.toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Medallas' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Wordle/ })).toHaveAttribute('aria-selected', 'true');

    expect(within(wordle).getByLabelText('2 medallas S')).toBeInTheDocument();
    expect(within(wordle).getByLabelText('1 medalla F')).toBeInTheDocument();
    expect(within(wordle).getByText('4 medallas')).toBeInTheDocument();

    const periodo = within(wordle).getByRole('group', { name: 'Periodo de las medallas' });
    fireEvent.click(within(periodo).getByRole('button', { name: 'Histórico' }));
    expect(within(periodo).getByRole('button', { name: 'Histórico' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(wordle).queryByText('Noviembre de 2026')).not.toBeInTheDocument();
    expect(within(wordle).getByLabelText('5 medallas S')).toBeInTheDocument();
    expect(within(wordle).getByLabelText('3 medallas A')).toBeInTheDocument();
    expect(within(wordle).getByLabelText('1 medalla B')).toBeInTheDocument();
    expect(within(wordle).getByLabelText('2 medallas F')).toBeInTheDocument();
    expect(within(wordle).getByText('11 medallas')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Noviembre de 2026' })).not.toBeInTheDocument();

    fireEvent.click(within(periodo).getByRole('button', { name: 'Mensual' }));
    expect(within(wordle).getByText('4 medallas')).toBeInTheDocument();

    expect(within(wordle).getByText('2:00')).toBeInTheDocument();
    expect(within(wordle).getByText('3:00')).toBeInTheDocument();
    expect(within(wordle).getByText('9')).toBeInTheDocument();

    expect(screen.getByText(/2 días con actividad/)).toBeInTheDocument();
    expect(screen.getByText(/3 desafíos completados en el último mes/)).toBeInTheDocument();
    expect(screen.getByText('Desafíos por día')).toBeInTheDocument();
    expect(screen.getByText(/Te faltan 3 para ganar 80 puntos por día/)).toBeInTheDocument();
    expect(screen.getByText('1 de 2 hitos completados.')).toBeInTheDocument();
  });

  it('permite cambiar de juego y de mes en las medallas', async () => {
    renderPerfil();

    await screen.findByRole('article', { name: 'Palabra del día' });

    fireEvent.click(screen.getByRole('tab', { name: /Sopa/ }));
    const sopa = screen.getByRole('article', { name: 'Sopa de letras' });
    expect(within(sopa).getByLabelText('3 medallas B')).toBeInTheDocument();

    fireEvent.click(within(sopa).getByRole('button', { name: 'Histórico' }));
    expect(within(sopa).getByText('Sin medallas')).toBeInTheDocument();
    expect(
      within(sopa).getByText('Todavía no tenés medallas de este juego.'),
    ).toBeInTheDocument();
    fireEvent.click(within(sopa).getByRole('button', { name: 'Mensual' }));

    fireEvent.click(screen.getByRole('button', { name: 'Noviembre de 2026' }));
    fireEvent.click(screen.getByRole('option', { name: /Octubre de 2026/ }));
    expect(
      screen.getByText('No jugaste este juego en el mes elegido. Probá con otro mes u otro juego.'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /Wordle/ }));
    const wordleOctubre = screen.getByRole('article', { name: 'Palabra del día' });
    expect(within(wordleOctubre).getByText('Octubre de 2026')).toBeInTheDocument();
    expect(within(wordleOctubre).getByLabelText('2 medallas S')).toBeInTheDocument();
    expect(within(wordleOctubre).getByLabelText('1 medalla C')).toBeInTheDocument();
    expect(within(wordleOctubre).getByText('5 medallas')).toBeInTheDocument();
  });

  it('recorre los consejos con las flechas', async () => {
    renderPerfil();

    await screen.findByRole('article', { name: 'Palabra del día' });

    const carrusel = screen.getByRole('region', { name: 'Por qué estos juegos' });
    const fuenteWilson = screen.getByText('Fuente: Wilson et al., JAMA, 2002');
    expect(fuenteWilson.closest('li')).toHaveAttribute('aria-hidden', 'false');
    fireEvent.click(screen.getByRole('button', { name: 'Consejo siguiente' }));
    const fuentePark = screen.getByText('Fuente: Park et al., Psychological Science, 2014');
    expect(fuentePark.closest('li')).toHaveAttribute('aria-hidden', 'false');
    expect(fuenteWilson.closest('li')).toHaveAttribute('aria-hidden', 'true');
    expect(within(carrusel).queryByRole('link')).not.toBeInTheDocument();
  });

  it('antepone el motivo del progreso al consejo etiquetado', async () => {
    fetchPerfilResumen.mockResolvedValue({
      ...RESUMEN,
      consejos: [{ ...CONSEJOS[0], situacion: 'eje_desequilibrado' }, CONSEJOS[1]],
    });
    renderPerfil();

    await screen.findByRole('article', { name: 'Palabra del día' });

    expect(
      screen.getByText('Este año practicaste Deducción verbal 10× más que Vocabulario.'),
    ).toBeInTheDocument();
    // El consejo sin situación sigue mostrando solo su texto.
    const park = screen.getByText('Fuente: Park et al., Psychological Science, 2014');
    expect(park.closest('li')).not.toHaveTextContent('Este año practicaste');
  });

  it('suma todos los juegos en la pestaña Todos', async () => {
    renderPerfil();

    await screen.findByRole('article', { name: 'Palabra del día' });
    fireEvent.click(screen.getByRole('tab', { name: /Todos/ }));

    const todos = screen.getByRole('article', { name: 'Todos los juegos' });
    expect(within(todos).getByText('7 medallas')).toBeInTheDocument();
    expect(within(todos).getByLabelText('2 medallas S')).toBeInTheDocument();
    expect(within(todos).getByLabelText('3 medallas B')).toBeInTheDocument();

    fireEvent.click(within(todos).getByRole('button', { name: 'Histórico' }));
    expect(within(todos).getByText('16 medallas')).toBeInTheDocument();
    expect(within(todos).getByLabelText('6 medallas S')).toBeInTheDocument();
    expect(within(todos).getByLabelText('4 medallas A')).toBeInTheDocument();

    expect(within(todos).getByText('12')).toBeInTheDocument();
    expect(within(todos).getByText('2 de 4')).toBeInTheDocument();
    expect(within(todos).getByText(/12\D+nov/)).toBeInTheDocument();
    expect(within(todos).queryByText('Mejor')).not.toBeInTheDocument();
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
