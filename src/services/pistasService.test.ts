/* Comprueba con pruebas que pistas service siga funcionando como se espera. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { pedirPistaConVida } from './pistasService';

beforeEach(/* Prepara un entorno limpio antes de cada prueba. */ () => {
  localStorage.setItem('token', 'sesion');
  sessionStorage.clear();
  vi.stubGlobal('fetch', vi.fn());
});
afterEach(/* Limpia el entorno al terminar cada prueba. */ () => { localStorage.clear(); sessionStorage.clear(); vi.unstubAllGlobals(); });

describe('contrato use-hint', /* Agrupa las pruebas de este comportamiento. */ () => {
  it.each([
    { game_id: 'wordle' as const, date: '2026-10-29', hint_index: 0 },
    { game_id: 'sudoku' as const, date: '2026-10-29', row: 3, col: 4 },
    { game_id: 'crucigrama' as const, date: '2026-10-29', row: 2, col: 5 },
    { game_id: 'sopa_letras' as const, date: '2026-10-29', hint_index: 1 },
  ])('envía el contexto de $game_id y devuelve la respuesta del servidor', /* Completa este paso con los datos recibidos por la operación. */ async solicitud => {
    const respuesta = { success: true, vidas_restantes: 4, vidas_descontadas: 1, pista: 'Ayuda', valor_revelado: 7 };
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(respuesta)));
    expect(await pedirPistaConVida(solicitud)).toEqual(respuesta);
    expect(fetch).toHaveBeenCalledExactlyOnceWith(expect.stringContaining('/api/economy/use-hint'), expect.objectContaining({
      method: 'POST', body: JSON.stringify(solicitud), headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sesion' },
    }));
  });

  it('requiere sesión y no pide ni revela una pista para invitados', /* Comprueba el comportamiento indicado en este caso. */ async () => {
    localStorage.clear();
    await expect(pedirPistaConVida({ game_id: 'wordle' })).rejects.toMatchObject({ status: 401 });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('admite el token de sessionStorage', /* Comprueba el comportamiento indicado en este caso. */ async () => {
    localStorage.clear(); sessionStorage.setItem('token', 'temporal');
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ success: true, vidas_restantes: 0, vidas_descontadas: 1, pista: 'Pista' })));
    await pedirPistaConVida({ game_id: 'wordle' });
    expect(vi.mocked(fetch).mock.calls[0][1]?.headers).toMatchObject({ Authorization: 'Bearer temporal' });
  });

  it('conserva el error 400 sin reintentar el descuento', /* Comprueba el comportamiento indicado en este caso. */ async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ detail: 'Sin vidas' }), { status: 400 }));
    await expect(pedirPistaConVida({ game_id: 'sudoku', row: 1, col: 2 })).rejects.toMatchObject({ status: 400, message: 'Sin vidas' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('no convierte un error de red en una pista local ni reintenta la compra', /* Comprueba el comportamiento indicado en este caso. */ async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Sin conexión'));
    await expect(pedirPistaConVida({ game_id: 'wordle' })).rejects.toThrow('Sin conexión');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
