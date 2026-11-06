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

it('precarga los seis catálogos actuales, incluidos los grafos V2, con identidad del operador', async () => {
  const token = `header.${btoa(JSON.stringify({ tipoUsuario: 2 }))}.firma`;
  localStorage.setItem('token', token);
  const { imagenesDelUniverso } = await import('./precargaNarrativa');
  expect(await imagenesDelUniverso(setup, '2026-11-06')).toEqual(['/assets/narrative/test.webp']);
  const paths = vi.mocked(fetch).mock.calls.map(([input, options]) => {
    const url = new URL(String(input), 'http://app');
    expect(url.searchParams.get('universo_id')).toBe('corte_medieval');
    expect(options).toMatchObject({ credentials: 'same-origin', headers: { Authorization: `Bearer ${token}` } });
    return url.pathname;
  });
  expect(paths.sort()).toEqual(['personajes', 'cartas', 'eventos', 'conversaciones', 'eventosEspeciales', 'finalizaciones']
    .map(key => NARRATIVE_API_PATH + NARRATIVE_CATALOG_PATHS[key as keyof typeof NARRATIVE_CATALOG_PATHS]).sort());
});

it('no consulta catálogos administrativos para un invitado', async () => {
  const { imagenesDelUniverso } = await import('./precargaNarrativa');
  expect(await imagenesDelUniverso(setup, '2026-11-06')).toEqual([]);
  expect(fetch).not.toHaveBeenCalled();
});
