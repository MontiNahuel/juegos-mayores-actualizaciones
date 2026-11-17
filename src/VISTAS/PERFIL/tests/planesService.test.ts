import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { fetchPlanes } from '../services/planesService';

const PLAN = {
  codigo: 'premium',
  nombre: 'Premium',
  descripcion: '',
  precio: { monto: 5000, moneda: 'ARS' },
  descuento_anual_pct: 20,
  precio_anual: { monto: 48000, moneda: 'ARS' },
  beneficios: [],
  orden: 0,
  visible: true,
  habilitado: false,
  updated_at: null,
};

const CATALOGO = { anual_habilitado: true, planes: [PLAN] };

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

it('pide el catálogo visible con la cookie de sesión', async () => {
  vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(CATALOGO)));

  const catalogo = await fetchPlanes();

  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining('/api/subscription/plans'),
    expect.objectContaining({ method: 'GET', credentials: 'include' }),
  );
  expect(catalogo).toEqual(CATALOGO);
});

it('normaliza el catálogo cuando el cobro anual no viene informado', async () => {
  vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ planes: [PLAN] })));

  const catalogo = await fetchPlanes();

  expect(catalogo).toEqual({ anual_habilitado: false, planes: [PLAN] });
});

it('devuelve null cuando el servidor responde con error', async () => {
  vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 401 }));

  expect(await fetchPlanes()).toBeNull();
});

it('devuelve null cuando la respuesta no trae la lista de planes', async () => {
  vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ anual_habilitado: true })));

  expect(await fetchPlanes()).toBeNull();
});

it('devuelve null cuando falla la conexión', async () => {
  vi.mocked(fetch).mockRejectedValue(new TypeError('Servidor desconectado'));

  expect(await fetchPlanes()).toBeNull();
});

it('deduplica dos lecturas simultáneas del mismo catálogo', async () => {
  let responder!: (res: Response) => void;
  vi.mocked(fetch).mockReturnValue(
    new Promise<Response>((resolver) => {
      responder = resolver;
    }),
  );

  const primero = fetchPlanes();
  const segundo = fetchPlanes();
  expect(fetch).toHaveBeenCalledTimes(1);

  responder(new Response(JSON.stringify(CATALOGO)));

  expect(await primero).toEqual(CATALOGO);
  expect(await segundo).toEqual(CATALOGO);
});
