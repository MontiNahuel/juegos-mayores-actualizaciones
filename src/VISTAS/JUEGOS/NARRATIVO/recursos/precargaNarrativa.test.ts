import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { SetupPartida } from '../narrativeService';
import { NARRATIVE_API_PATH, NARRATIVE_CATALOG_PATHS } from '../narrativeEndpoints';

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  sessionStorage.clear();
  vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => new Response('[{"imagen":"/assets/narrative/test.webp"}]')));
});
afterEach(() => { vi.unstubAllGlobals(); localStorage.clear(); sessionStorage.clear(); });

const setup = { universo_id: 'corte_medieval' } as SetupPartida;

it('precarga los seis catálogos actuales, incluidos los grafos V2, con cookie HttpOnly de operador', async () => {
  const { setSessionUser } = await import('../../../AUTH/sessionStore');
  setSessionUser({ id: 1, name: 'Admin', tipoUsuario: 2 });
  const { imagenesDelUniverso } = await import('./precargaNarrativa');
  expect(await imagenesDelUniverso(setup, '2026-11-06')).toEqual(['/assets/narrative/test.webp']);
  const paths = vi.mocked(fetch).mock.calls.map(([input, options]) => {
    const url = new URL(String(input), 'http://app');
    expect(url.searchParams.get('universo_id')).toBe('corte_medieval');
    expect(options).toMatchObject({ credentials: 'include' });
    return url.pathname;
  });
  expect(paths.sort()).toEqual(['personajes', 'cartas', 'eventos', 'conversaciones', 'eventosEspeciales', 'finalizaciones']
    .map(key => NARRATIVE_API_PATH + NARRATIVE_CATALOG_PATHS[key as keyof typeof NARRATIVE_CATALOG_PATHS]).sort());
});

it('no consulta catálogos administrativos para un invitado o alumno', async () => {
  const { imagenesDelUniverso } = await import('./precargaNarrativa');
  expect(await imagenesDelUniverso(setup, '2026-11-06')).toEqual([]);
  const { setSessionUser } = await import('../../../AUTH/sessionStore');
  setSessionUser({ id: 42, name: 'Alumno', tipoUsuario: 1 });
  expect(await imagenesDelUniverso(setup, '2026-11-06')).toEqual([]);
  expect(fetch).not.toHaveBeenCalled();
});
