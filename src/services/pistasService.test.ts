/* Comprueba con pruebas que pistasService use cookie HttpOnly sin localStorage. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { pedirPistaConPuntos } from './pistasService';
import { getSessionUser, setSessionUser } from '../VISTAS/AUTH/sessionStore';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  setSessionUser({ id: 7, name: 'Dai' });
  vi.stubGlobal('fetch', vi.fn());
});
afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  setSessionUser(null);
  vi.unstubAllGlobals();
});

describe('contrato use-hint', () => {
  it.each([
    { game_id: 'wordle' as const, date: '2026-10-29', hint_index: 0 },
    { game_id: 'sudoku' as const, date: '2026-10-29', row: 3, col: 4 },
    { game_id: 'crucigrama' as const, date: '2026-10-29', row: 2, col: 5 },
    { game_id: 'sopa_letras' as const, date: '2026-10-29', hint_index: 1 },
  ])('envía el contexto de $game_id con credentials: include y devuelve la respuesta del servidor', async solicitud => {
    const respuesta = { success: true, puntos_restantes: 480, puntos_descontados: 20, pista: 'Ayuda', valor_revelado: 7 };
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(respuesta)));
    expect(await pedirPistaConPuntos(solicitud)).toEqual(respuesta);
    expect(fetch).toHaveBeenCalledExactlyOnceWith(
      expect.stringContaining('/api/economy/use-hint'),
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(solicitud),
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('requiere sesión en memoria y no pide ni revela una pista para invitados', async () => {
    setSessionUser(null);
    await expect(pedirPistaConPuntos({ game_id: 'wordle' })).rejects.toMatchObject({ status: 401 });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('limpia la sesión en memoria si el servidor responde 401', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ detail: 'Expirada' }), { status: 401 }));
    await expect(pedirPistaConPuntos({ game_id: 'wordle' })).rejects.toMatchObject({ status: 401, message: 'Expirada' });
    expect(getSessionUser()).toBeNull();
  });

  it('conserva el error 400 sin reintentar el descuento', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ detail: 'Sin puntos' }), { status: 400 }));
    await expect(pedirPistaConPuntos({ game_id: 'sudoku', row: 1, col: 2 })).rejects.toMatchObject({ status: 400, message: 'Sin puntos' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('no convierte un error de red en una pista local ni reintenta la compra', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Sin conexión'));
    await expect(pedirPistaConPuntos({ game_id: 'wordle' })).rejects.toThrow('Sin conexión');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

it('rechaza un contrato viejo que todavía devuelve solo vidas', async () => {
  vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ success: true, vidas_restantes: 4, pista: 'Vieja' })));
  await expect(pedirPistaConPuntos({ game_id: 'wordle' })).rejects.toThrow('No se pudo confirmar');
  expect(fetch).toHaveBeenCalledTimes(1);
});
