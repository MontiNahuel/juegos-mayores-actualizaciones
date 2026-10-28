import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const guardadas = new Map<string, Response>();
const cache = {
  match: vi.fn(async (key: string | Request) => guardadas.get(typeof key === 'string' ? key : key.url)?.clone()),
  put: vi.fn(async (key: string, value: Response) => { guardadas.set(key, value); }),
  keys: vi.fn(async () => [...guardadas.keys()].map(url => new Request(url))),
  delete: vi.fn(async (key: string | Request) => guardadas.delete(typeof key === 'string' ? key : key.url)),
};
const decodes = vi.fn(async () => {});
const OriginalURL = URL;
const imagen = () => new Response(new Blob(['imagen'], { type: 'image/png' }), { headers: { 'Content-Type': 'image/png' } });

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  guardadas.clear();
  vi.stubGlobal('fetch', vi.fn(async () => imagen()));
  vi.stubGlobal('caches', { open: vi.fn(async () => cache), keys: vi.fn(async () => []), delete: vi.fn() });
  vi.stubGlobal('URL', class extends OriginalURL {
    static createObjectURL = vi.fn(() => `blob:prueba-${Math.random()}`);
    static revokeObjectURL = vi.fn();
  });
  vi.stubGlobal('Image', class {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    naturalWidth = 100;
    decode = decodes;
    set src(_valor: string) { queueMicrotask(() => this.onload?.()); }
  });
});
afterEach(() => vi.unstubAllGlobals());

describe('motor compartido de imágenes', () => {
  it('comparte descargas simultáneas y conserva la misma URL al cambiar de pantalla', async () => {
    const api = await import('./assetPreloader');
    await Promise.all([api.precargarImagenes(['/retrato.png']), api.precargarImagenes(['/retrato.png'])]);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(api.imagenPrecargada('/retrato.png')).toMatch(/^blob:/);
    const url = api.imagenPrecargada('/retrato.png');
    await api.precargarImagenes(['/retrato.png']);
    expect(api.imagenPrecargada('/retrato.png')).toBe(url);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('reutiliza el archivo persistido después de reiniciar la sesión del motor', async () => {
    const primera = await import('./assetPreloader');
    await primera.precargarImagenes(['/retrato.png']);
    vi.resetModules();
    const segunda = await import('./assetPreloader');
    await segunda.precargarImagenes(['/retrato.png']);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(segunda.imagenPrecargada('/retrato.png')).toMatch(/^blob:/);
  });

  it('guarda etapas futuras sin decodificarlas y las prepara desde disco cuando se necesitan', async () => {
    const api = await import('./assetPreloader');
    api.guardarImagenesEnSegundoPlano(['/futuro.png']);
    await vi.waitFor(() => expect(guardadas.size).toBe(1));
    expect(decodes).not.toHaveBeenCalled();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    await api.precargarImagenes(['/futuro.png']);
    expect(decodes).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('termina y cuenta imágenes faltantes sin guardar HTML como ilustraciones', async () => {
    vi.mocked(fetch).mockImplementation(async input => String(input).includes('falta')
      ? new Response('', { status: 404 })
      : new Response('<html>Error</html>', { headers: { 'Content-Type': 'text/html' } }));
    const api = await import('./assetPreloader');
    const progreso = vi.fn();
    await api.precargarImagenes(['/falta.png', '/error.png'], progreso);
    expect(progreso).toHaveBeenLastCalledWith(2, 2, 2);
    expect(guardadas.size).toBe(0);
  });

  it('permite jugar si el navegador bloquea el almacenamiento persistente', async () => {
    vi.mocked(caches.open).mockRejectedValue(new Error('Sin espacio'));
    const api = await import('./assetPreloader');
    await api.precargarImagenes(['/retrato.png']);
    expect(api.imagenPrecargada('/retrato.png')).toMatch(/^blob:/);
  });

  it('respeta el ahorro de datos y sólo descarga lo que se pide para mostrar', async () => {
    vi.stubGlobal('navigator', { connection: { saveData: true } });
    const api = await import('./assetPreloader');
    api.guardarImagenesEnSegundoPlano(['/futuro.png']);
    expect(fetch).not.toHaveBeenCalled();
    await api.precargarImagenes(['/visible.png']);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('usa la ilustración guardada si vence su vigencia y la red está caída', async () => {
    const url = new OriginalURL('/retrato.png', window.location.href).href;
    guardadas.set(url, new Response(new Blob(['imagen'], { type: 'image/png' }), { headers: {
      'Content-Type': 'image/png', 'X-Asset-Date': String(Date.now() - 25 * 60 * 60 * 1000),
    } }));
    vi.mocked(fetch).mockRejectedValue(new TypeError('Sin conexión'));
    const api = await import('./assetPreloader');
    await api.precargarImagenes(['/retrato.png']);
    expect(api.imagenPrecargada('/retrato.png')).toMatch(/^blob:/);
  });

  it('limita la concurrencia a tres descargas', async () => {
    let activas = 0;
    let maximo = 0;
    vi.mocked(fetch).mockImplementation(async () => {
      maximo = Math.max(maximo, ++activas);
      await new Promise(resolve => setTimeout(resolve, 5));
      activas--;
      return imagen();
    });
    const api = await import('./assetPreloader');
    await api.precargarImagenes(Array.from({ length: 8 }, (_, i) => `/imagen-${i}.png`));
    expect(maximo).toBe(3);
  });
});
