import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const key = 'cognijuegos_narrative_guest_v1';
const guest = { success: true, guest_id: 'invitado-prueba', credential: 'credencial-firmada-prueba', expires_in_days: 7 };
beforeEach(() => {
  vi.resetModules();
  localStorage.clear(); sessionStorage.clear();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(guest))));
});
afterEach(() => { vi.unstubAllGlobals(); localStorage.clear(); sessionStorage.clear(); });

describe('identidad de King’s Court', () => {
  it('obtiene una credencial firmada, comparte la petición concurrente y la reutiliza', async () => {
    const api = await import('./narrativeAuth');
    const [first, second] = await Promise.all([api.narrativeGameHeaders(), api.narrativeGameHeaders()]);
    expect(first).toEqual({ 'x-guest-credential': guest.credential });
    expect(second).toEqual(first);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/auth/guest-credential'), expect.objectContaining({ method: 'POST', credentials: 'same-origin' }));
    expect(await api.narrativeGameHeaders()).toEqual(first);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem(key)!)).toMatchObject({ credential: guest.credential, expiresAt: expect.any(Number) });
  });

  it('renueva pasando la credencial anterior y la conserva durante una recarga del módulo', async () => {
    localStorage.setItem(key, JSON.stringify({ credential: 'anterior', expiresAt: Date.now()-1000 }));
    const api = await import('./narrativeAuth');
    await api.narrativeGameHeaders();
    expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ headers: { 'x-guest-credential': 'anterior' } }));
    vi.resetModules();
    expect(await (await import('./narrativeAuth')).narrativeGameHeaders()).toEqual({ 'x-guest-credential': guest.credential });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each(['local', 'session', 'operator'])('respeta la sesión %s y no solicita identidad de invitado', async source => {
    if (source === 'local') localStorage.setItem('token','cuenta');
    if (source === 'session') sessionStorage.setItem('token','cuenta');
    if (source === 'operator') localStorage.setItem('asistodo_operador_session',JSON.stringify({ token:'cuenta',tipoUsuario:2 }));
    expect(await (await import('./narrativeAuth')).narrativeGameHeaders()).toEqual({ Authorization:'Bearer cuenta' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('deja autenticar la cookie de una cuenta conocida sin degradarla a invitado', async () => {
    localStorage.setItem('usuario',JSON.stringify({ id:42 }));
    expect(await (await import('./narrativeAuth')).narrativeGameHeaders()).toEqual({});
    expect(fetch).not.toHaveBeenCalled();
  });

  it('no guarda respuestas inválidas y permite recuperar la solicitud después del error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('{}'));
    const api = await import('./narrativeAuth');
    await expect(api.narrativeGameHeaders()).rejects.toThrow('credencial de invitado válida');
    expect(localStorage.getItem(key)).toBeNull();
    expect(await api.narrativeGameHeaders()).toEqual({ 'x-guest-credential':guest.credential });
  });

  it('propaga los rechazos de autenticación con su status', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ detail:'Credencial rechazada' }),{status:401}));
    await expect((await import('./narrativeAuth')).narrativeGameHeaders()).rejects.toMatchObject({status:401,message:'Credencial rechazada'});
    expect(localStorage.getItem(key)).toBeNull();
  });
});
