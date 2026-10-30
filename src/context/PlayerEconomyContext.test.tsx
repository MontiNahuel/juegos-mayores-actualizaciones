/* Comprueba con pruebas que player economy context siga funcionando como se espera. */
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import reducer, { actualizarEconomia } from '../store/playerEconomySlice';
import { PlayerEconomyProvider, usePlayerEconomy, type PlayerEconomyContextType } from './PlayerEconomyContext';

let economia: PlayerEconomyContextType;

// Hace visible el saldo que recibiría cualquier juego desde el Context.
function JuegoDePrueba() {
  economia = usePlayerEconomy();
  return <output data-testid="saldo">{economia.vidas}:{economia.puntos}</output>;
}

// Crea una tienda independiente para que las pruebas no compartan saldo.
async function montarEconomia() {
  const store = configureStore({ reducer: { playerEconomy: reducer } });
  render(<Provider store={store}><PlayerEconomyProvider><JuegoDePrueba /></PlayerEconomyProvider></Provider>);
  await waitFor(/* Espera a que termine la lectura inicial de la economía. */ () => expect(economia.isLoading).toBe(false));
  return store;
}

beforeEach(/* Prepara un invitado y una configuración pública sin llamadas reales. */ () => {
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem('asistodo_guest_economy', JSON.stringify({ vidas: 3, puntos: 800 }));
  vi.stubGlobal('fetch', vi.fn(/* Devuelve la configuración pública de la tienda. */ async () => new Response('{}', { status: 200 })));
});

afterEach(/* Desmonta los juegos y limpia la sesión de cada prueba. */ () => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  vi.unstubAllGlobals();
});

describe('economía compartida en Redux', /* Reúne las comprobaciones de saldo y compras. */ () => {
  it('compra una pista sin guardar el callback del juego en Redux', /* Comprueba que el saldo sea compartido y la entrega de pistas siga siendo local. */ async () => {
    localStorage.setItem('token', 'sesion-de-prueba');
    const vidas = 4;
    let puntos = 500;
    const resultado = { success: true, puntos_restantes: 480, puntos_descontados: 20, pista: null, valor_revelado: 7 };
    vi.stubGlobal('fetch', vi.fn(/* Simula la compra de la pista y el saldo posterior de la cuenta. */ async (url: string) => {
      if (url.endsWith('/use-hint')) {
        puntos = 480;
        return new Response(JSON.stringify(resultado));
      }
      if (url.endsWith('/me')) return new Response(JSON.stringify({ vidas, puntos, suscripcion: 'basica', dias_desbloqueados: [] }));
      return new Response('{}');
    }));
    const store = await montarEconomia();
    const onRecibir = vi.fn();
    act(/* Abre la confirmación de compra con el callback de este juego. */ () => {
      economia.abrirComprarPista({ game_id: 'sudoku', row: 0, col: 0, onRecibir });
    });
    expect(economia.isComprarPistaOpen).toBe(true);
    expect(JSON.parse(JSON.stringify(store.getState()))).toEqual(store.getState());
    await act(/* Confirma la compra y espera la entrega de la pista. */ async () => {
      await economia.comprarPista();
    });
    expect(onRecibir).toHaveBeenCalledWith(resultado);
    expect(store.getState().playerEconomy).toMatchObject({ vidas: 4, puntos: 480 });
    expect(economia.isComprarPistaOpen).toBe(false);
  });

  it('carga el invitado en Redux y refleja cambios de Redux en el juego', /* Comprueba que Redux sea la fuente del saldo visible. */ async () => {
    const store = await montarEconomia();
    expect(store.getState().playerEconomy).toMatchObject({ vidas: 3, puntos: 800 });
    act(/* Cambia el saldo desde otra parte de la aplicación. */ () => {
      store.dispatch(actualizarEconomia({ vidas: 8, puntos: 900 }));
    });
    expect(screen.getByTestId('saldo').textContent).toBe('8:900');
  });

  it('consume y canjea vidas conservando el guardado del invitado', /* Comprueba que las acciones existentes sigan escribiendo en Redux y en disco. */ async () => {
    const store = await montarEconomia();
    await act(/* Descuenta una vida como haría un juego al registrar un error. */ async () => {
      expect(await economia.consumirVida()).toBe(true);
    });
    await waitFor(/* Espera a que se refleje el consumo confirmado. */ () => expect(economia.vidas).toBe(2));
    await act(/* Compra el paquete de tres vidas con los puntos del invitado. */ async () => {
      expect(await economia.canjearVidas('pack_3')).toMatchObject({ success: true });
    });
    await waitFor(/* Espera la sincronización del saldo después de la compra. */ () => {
      expect(store.getState().playerEconomy).toMatchObject({ vidas: 5, puntos: 200 });
    });
    expect(JSON.parse(localStorage.getItem('asistodo_guest_economy')!)).toEqual({ vidas: 5, puntos: 200 });
    expect(screen.getByTestId('saldo').textContent).toBe('5:200');
  });

  it('desbloquea un día autenticado y mantiene el saldo del servidor', /* Comprueba la compra de acceso a un desafío anterior. */ async () => {
    localStorage.setItem('token', 'sesion-de-prueba');
    let comprado = false;
    vi.stubGlobal('fetch', vi.fn(/* Simula las respuestas confirmadas por el servidor. */ async (url: string) => {
      if (url.endsWith('/unlock-day')) {
        comprado = true;
        return new Response(JSON.stringify({ success: true, puntos: 400 }));
      }
      if (url.endsWith('/me')) return new Response(JSON.stringify({
        vidas: 4, puntos: comprado ? 400 : 500, suscripcion: 'basica',
        dias_desbloqueados: comprado ? ['sudoku:2026-10-01'] : [],
      }));
      return new Response('{}');
    }));
    const store = await montarEconomia();
    await act(/* Pide comprar el desafío de la fecha elegida. */ async () => {
      expect(await economia.desbloquearDia('sudoku', '2026-10-01')).toMatchObject({ success: true });
    });
    await waitFor(/* Espera a que el calendario pueda leer el desbloqueo desde Redux. */ () => {
      expect(store.getState().playerEconomy).toMatchObject({ puntos: 400, diasDesbloqueados: ['sudoku:2026-10-01'] });
    });
    expect(economia.isDiaDesbloqueado('sudoku', '2026-10-01')).toBe(true);
  });
});

it('sin puntos no entrega una pista ni abre la tienda de vidas', async () => {
  localStorage.setItem('token', 'sesion-de-prueba');
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url.endsWith('/use-hint')) return new Response(JSON.stringify({ detail: 'Puntos insuficientes' }), { status: 400 });
    if (url.endsWith('/me')) return new Response(JSON.stringify({ vidas: 4, puntos: 0, suscripcion: 'basica', dias_desbloqueados: [] }));
    return new Response(JSON.stringify({ costo_pista_puntos: 35 }));
  }));
  const store = await montarEconomia();
  expect(economia.costoPistaPuntos).toBe(35);
  const onRecibir = vi.fn();
  act(() => economia.abrirComprarPista({ game_id: 'wordle', onRecibir }));
  await act(async () => { await expect(economia.comprarPista()).rejects.toThrow('Puntos insuficientes'); });
  expect(onRecibir).not.toHaveBeenCalled();
  expect(economia.isComprarPistaOpen).toBe(true);
  expect(economia.isMiniTiendaOpen).toBe(false);
  expect(store.getState().playerEconomy).toMatchObject({ vidas: 4, puntos: 0 });
});

it('consume una pista cobrada antes de entregarla y evita volver a cobrar si falla el juego', async () => {
  localStorage.setItem('token', 'sesion-de-prueba');
  localStorage.setItem('usuario', JSON.stringify({ id: 7, vidas: 4, puntos: 500 }));
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url.endsWith('/use-hint')) return new Response(JSON.stringify({ success: true, puntos_restantes: 480, pista: null, valor_revelado: null }));
    if (url.endsWith('/me')) return new Response(JSON.stringify({ vidas: 4, puntos: 500, suscripcion: 'basica' }));
    return new Response('{}');
  }));
  const store = await montarEconomia();
  act(() => economia.abrirComprarPista({ game_id: 'sudoku', onRecibir: () => { throw new Error('Pista inválida'); } }));
  await act(async () => { await expect(economia.comprarPista()).rejects.toThrow('Pista inválida'); });
  expect(economia.isComprarPistaOpen).toBe(false);
  await act(async () => { await economia.comprarPista(); });
  const urls = vi.mocked(fetch).mock.calls.map(([url]) => String(url));
  expect(urls.filter(url => url.endsWith('/use-hint'))).toHaveLength(1);
  expect(urls.filter(url => url.endsWith('/me'))).toHaveLength(1);
  expect(store.getState().playerEconomy).toMatchObject({ vidas: 4, puntos: 480 });
  expect(JSON.parse(localStorage.getItem('usuario')!).puntos).toBe(480);
});
