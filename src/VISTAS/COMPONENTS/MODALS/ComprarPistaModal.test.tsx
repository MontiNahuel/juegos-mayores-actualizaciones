import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PlayerEconomyProvider, usePlayerEconomy } from '../../../context/PlayerEconomyContext';
import { ErrorPista } from '../../../services/pistasService';
import ComprarPistaModal from './ComprarPistaModal';

const mocks = vi.hoisted(() => ({ pedir: vi.fn(), entregar: vi.fn() }));
vi.mock('../../../services/pistasService', async original => ({ ...await original<typeof import('../../../services/pistasService')>(), pedirPistaConVida: mocks.pedir }));
let saldo = 5;

function Juego() {
  const economia = usePlayerEconomy();
  return <>
    <button onClick={() => economia.abrirComprarPista({ game_id: 'wordle', date: '2026-10-29', hint_index: 0, onRecibir: mocks.entregar })}>Pista del juego</button>
    <span data-testid="vidas">{economia.vidas}</span>
    {economia.isMiniTiendaOpen && <p>Tienda abierta</p>}
    <ComprarPistaModal />
  </>;
}

beforeEach(() => {
  vi.clearAllMocks(); saldo = 5;
  localStorage.clear(); sessionStorage.clear();
  localStorage.setItem('token', 'sesion');
  localStorage.setItem('usuario', JSON.stringify({ id: 1, vidas: 5 }));
  vi.stubGlobal('fetch', vi.fn(async input => new Response(JSON.stringify(String(input).endsWith('/me')
    ? { vidas: saldo, puntos: 200, suscripcion: 'premium' } : { vidas_iniciales: 5 }))));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); localStorage.clear(); });

describe('confirmación de compra de pistas', () => {
  it('espera la confirmación, evita duplicados y actualiza el saldo incluso para premium', async () => {
    let confirmar!: (data: unknown) => void;
    mocks.pedir.mockReturnValue(new Promise(resolve => { confirmar = resolve; }));
    render(<PlayerEconomyProvider><Juego /></PlayerEconomyProvider>);
    fireEvent.click(screen.getByText('Pista del juego'));
    expect(mocks.pedir).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Comprar 1 pista · 1 vida' }));
    fireEvent.click(screen.getByRole('button', { name: 'Canjeando...' }));
    expect(mocks.pedir).toHaveBeenCalledExactlyOnceWith({ game_id: 'wordle', date: '2026-10-29', hint_index: 0 });
    expect(mocks.entregar).not.toHaveBeenCalled();
    saldo = 4;
    confirmar({ success: true, vidas_restantes: 4, vidas_descontadas: 1, pista: 'La pista del servidor', valor_revelado: null });
    await waitFor(() => expect(mocks.entregar).toHaveBeenCalledOnce());
    expect(screen.getByTestId('vidas')).toHaveTextContent('4');
    expect(JSON.parse(localStorage.getItem('usuario')!).vidas).toBe(4);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('abre la tienda al recibir 400 y nunca entrega una pista', async () => {
    mocks.pedir.mockRejectedValue(new ErrorPista(400, 'Sin vidas'));
    render(<PlayerEconomyProvider><Juego /></PlayerEconomyProvider>);
    fireEvent.click(screen.getByText('Pista del juego'));
    fireEvent.click(screen.getByRole('button', { name: 'Comprar 1 pista · 1 vida' }));
    expect(await screen.findByText('Tienda abierta')).toBeTruthy();
    expect(mocks.entregar).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('conserva vidas y muestra el error cuando el servidor falla', async () => {
    mocks.pedir.mockRejectedValue(new ErrorPista(503, 'Servidor no disponible'));
    render(<PlayerEconomyProvider><Juego /></PlayerEconomyProvider>);
    fireEvent.click(screen.getByText('Pista del juego'));
    fireEvent.click(screen.getByRole('button', { name: 'Comprar 1 pista · 1 vida' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Servidor no disponible');
    expect(screen.getByTestId('vidas')).toHaveTextContent('5');
    expect(mocks.entregar).not.toHaveBeenCalled();
  });
});
