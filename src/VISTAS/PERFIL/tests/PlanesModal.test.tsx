import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PlanesModal } from '../components/planes/PlanesModal';
import type { CatalogoPlanes, PlanSuscripcion } from '../services/planesService';

const fetchPlanes = vi.hoisted(() => vi.fn());

vi.mock('../services/planesService', () => ({ fetchPlanes }));
vi.mock('@ionic/react', () => ({
  IonIcon: () => <span aria-hidden="true" />,
}));

const PLAN_SIN_COMPRA: PlanSuscripcion = {
  codigo: 'premium',
  nombre: 'Premium',
  descripcion: 'Todo el archivo de desafíos',
  precio: { monto: 5000, moneda: 'ARS' },
  descuento_anual_pct: 20,
  precio_anual: { monto: 48000, moneda: 'ARS' },
  beneficios: ['Sin anuncios', 'Acceso anticipado'],
  orden: 0,
  visible: true,
  habilitado: false,
  updated_at: null,
};

const PLAN_HABILITADO: PlanSuscripcion = {
  codigo: 'premium_plus',
  nombre: 'Premium Plus',
  descripcion: '',
  precio: { monto: 9999, moneda: 'ARS' },
  descuento_anual_pct: 0,
  precio_anual: { monto: 119988, moneda: 'ARS' },
  beneficios: [],
  orden: 1,
  visible: true,
  habilitado: true,
  updated_at: null,
};

const CATALOGO: CatalogoPlanes = {
  anual_habilitado: true,
  planes: [PLAN_SIN_COMPRA, PLAN_HABILITADO],
};

beforeEach(() => {
  fetchPlanes.mockReset();
  fetchPlanes.mockResolvedValue(CATALOGO);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('PlanesModal', () => {
  it('lista los planes con el precio mensual, beneficios y el estado de compra', async () => {
    render(<PlanesModal isOpen onClose={() => {}} />);

    expect(await screen.findByText('Premium')).toBeInTheDocument();
    expect(screen.getByText('Nivel bronce')).toBeInTheDocument();
    expect(screen.getByText('Nivel oro')).toBeInTheDocument();
    expect(screen.getByText(/\$\s*5\.000.*\/ mes/)).toBeInTheDocument();
    expect(screen.getByText('Sin anuncios')).toBeInTheDocument();
    expect(screen.getByText('Premium Plus')).toBeInTheDocument();
    expect(screen.getByText(/\$\s*9\.999.*\/ mes/)).toBeInTheDocument();
    expect(screen.queryByText(/\/ año/)).not.toBeInTheDocument();
    expect(screen.queryByText(/% OFF/)).not.toBeInTheDocument();
    expect(screen.getByText('Se renueva todos los meses.')).toBeInTheDocument();

    const sinComprar = screen.getByRole('button', { name: 'Premium: próximamente' });
    expect(sinComprar).toBeDisabled();
    expect(sinComprar).toHaveTextContent('Próximamente');

    const comprable = screen.getByRole('button', { name: 'Elegir Premium Plus' });
    expect(comprable).toBeEnabled();

    fireEvent.click(comprable);
    expect(await screen.findByRole('status')).toHaveTextContent(
      /cuando conectemos la pasarela de pagos/,
    );
    expect(fetchPlanes).toHaveBeenCalledTimes(1);
  });

  it('cambia a precios y descuentos anuales con el valor anterior tachado', async () => {
    render(<PlanesModal isOpen onClose={() => {}} />);

    const selector = await screen.findByRole('group', { name: 'Periodo de cobro' });
    const mensual = screen.getByRole('button', { name: 'Mensual' });
    const anual = screen.getByRole('button', { name: 'Anual' });
    expect(mensual).toHaveAttribute('aria-pressed', 'true');
    expect(anual).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(anual);

    expect(anual).toHaveAttribute('aria-pressed', 'true');
    expect(mensual).toHaveAttribute('aria-pressed', 'false');
    expect(
      screen.getByText(/\$\s*4\.000.*\/ mes/, { selector: '[data-estado="activo"]' }),
    ).toBeInTheDocument();
    expect(screen.getByText('20% OFF')).toBeInTheDocument();
    expect(
      screen.getByText('Precio por mes con descuento; se cobra una vez por año.'),
    ).toBeInTheDocument();

    const saliente = screen.getByText(/\$\s*5\.000.*\/ mes/, {
      selector: '[data-estado="saliente"]',
    });
    expect(saliente).toHaveAttribute('aria-hidden', 'true');
    await waitForElementToBeRemoved(saliente, { timeout: 2500 });

    fireEvent.click(screen.getByRole('button', { name: 'Mensual' }));
    expect(
      screen.getByText(/\$\s*5\.000.*\/ mes/, { selector: '[data-estado="activo"]' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Se renueva todos los meses.')).toBeInTheDocument();
    await waitForElementToBeRemoved(() => screen.queryByText('20% OFF'), { timeout: 2500 });
    expect(screen.queryByText(/\$\s*4\.000.*\/ mes/)).not.toBeInTheDocument();
    expect(selector).toBeInTheDocument();
  });

  it('cambia al instante cuando el usuario pide menos movimiento', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }) as MediaQueryList);
    render(<PlanesModal isOpen onClose={() => {}} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Anual' }));

    expect(
      screen.getByText(/\$\s*4\.000.*\/ mes/, { selector: '[data-estado="activo"]' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/\$\s*5\.000.*\/ mes/)).not.toBeInTheDocument();
  });

  it('omite el selector cuando el cobro anual no está habilitado', async () => {
    fetchPlanes.mockResolvedValue({ anual_habilitado: false, planes: [PLAN_SIN_COMPRA] });
    render(<PlanesModal isOpen onClose={() => {}} />);

    expect(await screen.findByText('Premium')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Periodo de cobro' })).not.toBeInTheDocument();
    expect(screen.getByText(/\$\s*5\.000.*\/ mes/)).toBeInTheDocument();
    expect(screen.queryByText(/\/ año/)).not.toBeInTheDocument();
  });

  it('menciona la modalidad anual al elegir un plan anual', async () => {
    render(<PlanesModal isOpen onClose={() => {}} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Anual' }));
    fireEvent.click(screen.getByRole('button', { name: 'Elegir Premium Plus' }));

    expect(await screen.findByRole('status')).toHaveTextContent(/modalidad anual/);
  });

  it('no ejecuta ninguna acción al tocar un plan deshabilitado', async () => {
    render(<PlanesModal isOpen onClose={() => {}} />);

    const sinComprar = await screen.findByRole('button', { name: 'Premium: próximamente' });
    fireEvent.click(sinComprar);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('muestra el error de carga y permite reintentar', async () => {
    fetchPlanes.mockReset();
    fetchPlanes.mockResolvedValueOnce(null).mockResolvedValueOnce({
      anual_habilitado: true,
      planes: [PLAN_SIN_COMPRA],
    });
    render(<PlanesModal isOpen onClose={() => {}} />);

    expect(await screen.findByText(/No pudimos cargar los planes/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Reintentar/ }));

    expect(await screen.findByText('Premium')).toBeInTheDocument();
    expect(fetchPlanes).toHaveBeenCalledTimes(2);
  });

  it('avisa cuando todavía no hay planes configurados', async () => {
    fetchPlanes.mockResolvedValue({ anual_habilitado: true, planes: [] });
    render(<PlanesModal isOpen onClose={() => {}} />);

    expect(await screen.findByText(/Todavía no hay planes disponibles/)).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Periodo de cobro' })).not.toBeInTheDocument();
  });

  it('no consulta el catálogo mientras está cerrado', () => {
    render(<PlanesModal isOpen={false} onClose={() => {}} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(fetchPlanes).not.toHaveBeenCalled();
  });
});
