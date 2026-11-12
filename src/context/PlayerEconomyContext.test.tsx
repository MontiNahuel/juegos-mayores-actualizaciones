/* Comprueba economía, racha diaria y sesión por cookie HttpOnly en Redux sin localStorage. */
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import reducer, { actualizarEconomia } from '../store/playerEconomySlice';
import { PlayerEconomyProvider, usePlayerEconomy, type PlayerEconomyContextType } from './PlayerEconomyContext';
import { getSessionUser, setSessionUser } from '../VISTAS/AUTH/sessionStore';

let economia: PlayerEconomyContextType;

function JuegoDePrueba() {
  economia = usePlayerEconomy();
  return <output data-testid="saldo">{economia.puntos}:{economia.racha}</output>;
}

async function montarEconomia() {
  const store = configureStore({ reducer: { playerEconomy: reducer } });
  render(
    <Provider store={store}>
      <PlayerEconomyProvider>
        <JuegoDePrueba />
      </PlayerEconomyProvider>
    </Provider>
  );
  await waitFor(() => expect(economia.isLoading).toBe(false));
  return store;
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  setSessionUser(null);
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (String(url).endsWith('/api/auth/session')) {
        return new Response(
          JSON.stringify({
            success: true,
            authenticated: false,
            user: null,
            racha: 0,
            racha_ultima_fecha: null,
            racha_hoy_ingresada: false,
          }),
          { status: 200 }
        );
      }
      return new Response('{}', { status: 401 });
    })
  );
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  setSessionUser(null);
  vi.unstubAllGlobals();
});

describe('economía y racha compartida en Redux con cookies HttpOnly', () => {
  it('hidrata sesión, racha y saldo desde /api/auth/session y /api/economy/me sin llamar a /config ni guardar en localStorage', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.endsWith('/api/auth/session')) {
          return new Response(
            JSON.stringify({
              success: true,
              authenticated: true,
              user: { id: 7, name: 'Dai', tipoUsuario: 1 },
              racha: 4,
              racha_ultima_fecha: '2026-11-11',
              racha_hoy_ingresada: true,
            })
          );
        }
        if (url.endsWith('/api/economy/me')) {
          return new Response(
            JSON.stringify({
              puntos: 500,
              racha: 4,
              racha_ultima_fecha: '2026-11-11',
              racha_hoy_ingresada: true,
              suscripcion: 'basica',
              dias_desbloqueados: [],
              costo_pista_puntos: 20,
              costo_desbloqueo_dia_puntos: 80,
            })
          );
        }
        return new Response('{}', { status: 404 });
      })
    );

    const store = await montarEconomia();
    expect(economia.isAuthenticated).toBe(true);
    expect(getSessionUser()).toMatchObject({ id: 7, name: 'Dai' });
    expect(store.getState().playerEconomy).toMatchObject({
      puntos: 500,
      racha: 4,
      rachaUltimaFecha: '2026-11-11',
      rachaHoyIngresada: true,
    });
    expect(screen.getByTestId('saldo').textContent).toBe('500:4');
    expect(economia.costoDesbloqueoDiaPuntos).toBe(80);

    const urls = vi.mocked(fetch).mock.calls.map(([u]) => String(u));
    expect(urls.some((u) => u.includes('/api/economy/config'))).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('usuario')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('queda como invitado en 0 sin llamar a /api/economy/me cuando /api/auth/session devuelve authenticated=false (200)', async () => {
    localStorage.setItem('token', 'token-viejo-en-storage');
    localStorage.setItem('usuario', JSON.stringify({ id: 99, name: 'Viejo' }));

    const store = await montarEconomia();
    expect(economia.isAuthenticated).toBe(false);
    expect(store.getState().playerEconomy).toMatchObject({ puntos: 0, racha: 0 });
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('usuario')).toBeNull();

    const urls = vi.mocked(fetch).mock.calls.map(([u]) => String(u));
    expect(urls.some((u) => u.includes('/api/economy/me'))).toBe(false);

    act(() => {
      store.dispatch(actualizarEconomia({ puntos: 900, racha: 2 }));
    });
    expect(screen.getByTestId('saldo').textContent).toBe('900:2');
  });

  it('también limpia la sesión y queda en invitado si /api/auth/session responde 401', async () => {
    setSessionUser({ id: 7, name: 'Dai' });
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 401 })));

    const store = await montarEconomia();
    expect(economia.isAuthenticated).toBe(false);
    expect(getSessionUser()).toBeNull();
    expect(store.getState().playerEconomy).toMatchObject({ puntos: 0, racha: 0 });
  });

  it('compra una pista con cookie HttpOnly sin guardar el callback en Redux', async () => {
    const resultado = {
      success: true,
      puntos_restantes: 480,
      puntos_descontados: 20,
      pista: null,
      valor_revelado: 7,
    };

    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.endsWith('/api/auth/session')) {
          return new Response(
            JSON.stringify({
              success: true,
              authenticated: true,
              user: { id: 7, name: 'Dai' },
              racha: 2,
              racha_ultima_fecha: '2026-11-11',
              racha_hoy_ingresada: true,
            })
          );
        }
        if (url.endsWith('/api/economy/me')) {
          return new Response(
            JSON.stringify({
              puntos: 500,
              racha: 2,
              suscripcion: 'basica',
              dias_desbloqueados: [],
              costo_pista_puntos: 20,
            })
          );
        }
        if (url.endsWith('/use-hint')) {
          return new Response(JSON.stringify(resultado));
        }
        return new Response('{}');
      })
    );

    const store = await montarEconomia();
    const onRecibir = vi.fn();
    act(() => {
      economia.abrirComprarPista({ game_id: 'sudoku', row: 0, col: 0, onRecibir });
    });
    expect(economia.isComprarPistaOpen).toBe(true);
    expect(JSON.parse(JSON.stringify(store.getState()))).toEqual(store.getState());

    await act(async () => {
      await economia.comprarPista();
    });

    expect(onRecibir).toHaveBeenCalledWith(resultado);
    expect(store.getState().playerEconomy).toMatchObject({ puntos: 480 });
    expect(economia.isComprarPistaOpen).toBe(false);
    expect(localStorage.getItem('usuario')).toBeNull();
  });

  it('desbloquea un día autenticado sin duplicar recargas ni tocar localStorage', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.endsWith('/api/auth/session')) {
          return new Response(
            JSON.stringify({
              success: true,
              authenticated: true,
              user: { id: 7, name: 'Dai' },
              racha: 1,
              racha_ultima_fecha: '2026-11-11',
              racha_hoy_ingresada: true,
            })
          );
        }
        if (url.endsWith('/api/economy/me')) {
          return new Response(
            JSON.stringify({
              puntos: 500,
              racha: 1,
              suscripcion: 'basica',
              dias_desbloqueados: [],
            })
          );
        }
        if (url.endsWith('/unlock-day')) {
          return new Response(JSON.stringify({ success: true, puntos: 400 }));
        }
        return new Response('{}');
      })
    );

    const store = await montarEconomia();
    await act(async () => {
      expect(await economia.desbloquearDia('sudoku', '2026-10-01')).toMatchObject({ success: true });
    });
    expect(store.getState().playerEconomy).toMatchObject({
      puntos: 400,
      diasDesbloqueados: ['sudoku:2026-10-01'],
    });
    expect(economia.isDiaDesbloqueado('sudoku', '2026-10-01')).toBe(true);
    expect(economia.costoDesbloqueoDiaPuntos).toBe(100);

    const meCalls = vi.mocked(fetch).mock.calls.filter(([u]) => String(u).endsWith('/api/economy/me'));
    expect(meCalls).toHaveLength(1);
  });

  it('sin puntos no entrega una pista ni vuelve a cobrar si falla el callback', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.endsWith('/api/auth/session')) {
          return new Response(
            JSON.stringify({
              success: true,
              authenticated: true,
              user: { id: 7, name: 'Dai' },
              racha: 1,
            })
          );
        }
        if (url.endsWith('/api/economy/me')) {
          return new Response(JSON.stringify({ puntos: 0, racha: 1, suscripcion: 'basica' }));
        }
        if (url.endsWith('/use-hint')) {
          return new Response(JSON.stringify({ detail: 'Puntos insuficientes' }), { status: 400 });
        }
        return new Response('{}');
      })
    );

    await montarEconomia();
    const onRecibir = vi.fn();
    act(() => economia.abrirComprarPista({ game_id: 'wordle', onRecibir }));
    await act(async () => {
      await expect(economia.comprarPista()).rejects.toThrow('Puntos insuficientes');
    });
    expect(onRecibir).not.toHaveBeenCalled();
    expect(economia.isComprarPistaOpen).toBe(true);
  });
});
