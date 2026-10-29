import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MiniTiendaModal from './MiniTiendaModal';

const economia = vi.hoisted(() => ({
  isMiniTiendaOpen: true, cerrarMiniTienda: vi.fn(), vidas: 5, puntos: 200,
  paquetesTienda: [{ id: 'uno', vidas: 1, puntos: 200 }], canjearVidas: vi.fn(),
}));
vi.mock('../../../context/PlayerEconomyContext', () => ({ usePlayerEconomy: () => economia }));

beforeEach(() => { vi.clearAllMocks(); economia.puntos = 200; });
afterEach(cleanup);

describe('Tienda de vidas', () => {
  it('no canjea al abrir y deshabilita la compra con saldo insuficiente', () => {
    economia.puntos = 199;
    render(<MiniTiendaModal />);
    expect(screen.getByRole('dialog', { name: 'Tienda de Vidas' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Canjear 1 vida por 200 puntos' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByText('Faltan 1')).toBeTruthy();
    expect(economia.canjearVidas).not.toHaveBeenCalled();
  });

  it('envía un único canje y no cierra el modal mientras espera su confirmación', async () => {
    let resolver!: (value: { success: boolean; message: string }) => void;
    economia.canjearVidas.mockReturnValue(new Promise(resolve => { resolver = resolve; }));
    render(<MiniTiendaModal />);
    const boton = screen.getByRole('button', { name: 'Canjear 1 vida por 200 puntos' });
    fireEvent.click(boton);
    fireEvent.click(boton);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(economia.canjearVidas).toHaveBeenCalledExactlyOnceWith('uno');
    expect(economia.cerrarMiniTienda).not.toHaveBeenCalled();
    resolver({ success: true, message: 'Vida acreditada' });
    expect(await screen.findByRole('status')).toHaveTextContent('Vida acreditada');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(economia.cerrarMiniTienda).toHaveBeenCalledOnce();
  });

  it('muestra un error y permite volver a intentar si el canje falla', async () => {
    economia.canjearVidas.mockRejectedValue(new Error('Sin conexión'));
    render(<MiniTiendaModal />);
    const boton = screen.getByRole('button', { name: 'Canjear 1 vida por 200 puntos' });
    fireEvent.click(boton);
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo confirmar el canje');
    await waitFor(() => expect(boton.hasAttribute('disabled')).toBe(false));
    expect(economia.cerrarMiniTienda).not.toHaveBeenCalled();
  });
});
