import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const date = '2026-11-06';
const balance = { mes_actual: 2, fase_actual: 'BALANCE_MES', recursos: { oro: 50 } };
const draft = { grafo_actual: null, evento_actual: null, resultado_actual: null, conversacion_actual: null, mes_actual: 3, fase_actual: 'DRAFT_MENSUAL', recursos: { oro: 48 }, cartas_draft_actual: [{ _id: 'nueva' }] };
const response = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });

beforeEach(async () => {
  vi.resetModules();
  localStorage.clear(); sessionStorage.clear();
  const { setSessionUser } = await import('../../AUTH/sessionStore');
  setSessionUser({ id: 1, name: 'Test' });
  vi.stubGlobal('fetch', vi.fn());
});
afterEach(() => { vi.unstubAllGlobals(); localStorage.clear(); sessionStorage.clear(); });

describe('continuar la partida sin adelantarse al servidor', () => {
  it('retoma una conversación pendiente sin enviar avanzar-mes ni cargar el draft viejo', async () => {
    const conversacion = { _id: 'charla', frases: [], decisiones: [] };
    vi.mocked(fetch).mockResolvedValue(response({ ...balance, fase_actual: 'TOMA_DECISION_CONVERSACION', conversacion_actual: conversacion, resultado_actual: { titulo: 'Resultado anterior' }, cartas_draft_actual: [{ _id: 'vieja' }] }));
    const api = await import('./narrativeService');
    const estado = await api.continuarTurno(date);
    expect(estado.conversacion_actual).toEqual(conversacion);
    expect(estado.resultado_actual).toBeNull();
    expect(estado.mes_actual).toBe(2);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fetch).mock.calls[0][1]?.method).toBeUndefined();
  });

  it('dos clics concurrentes envían un solo cierre de mes y toman el mes confirmado', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(response(balance)).mockResolvedValueOnce(response(draft));
    const api = await import('./narrativeService');
    const [a, b] = await Promise.all([api.continuarTurno(date), api.continuarTurno(date)]);
    expect(a).toEqual(draft); expect(b).toEqual(a);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(vi.mocked(fetch).mock.calls.filter(([, opts]) => opts?.method === 'POST')).toHaveLength(1);
  });

  it('reconcilia un timeout posterior al commit sin volver a aplicar los pasivos', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(response(balance)).mockRejectedValueOnce(new TypeError('Conexión cortada')).mockResolvedValueOnce(response(draft));
    const api = await import('./narrativeService');
    expect(await api.continuarTurno(date)).toMatchObject(draft);
    expect(vi.mocked(fetch).mock.calls.filter(([, opts]) => opts?.method === 'POST')).toHaveLength(1);
    expect(api.esPartidaNarrativaLocal(date)).toBe(false);
  });

  it('si el rechazo no cambió la partida, no inventa cartas o mes y permite reintentar', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(response(balance)).mockResolvedValueOnce(response({ detail: 'Fase incorrecta' }, 400)).mockResolvedValueOnce(response(balance));
    const api = await import('./narrativeService');
    await expect(api.continuarTurno(date)).rejects.toThrow('Fase incorrecta');
    expect(api.esPartidaNarrativaLocal(date)).toBe(false);
    vi.mocked(fetch).mockResolvedValueOnce(response(balance)).mockResolvedValueOnce(response(draft));
    expect(await api.continuarTurno(date)).toEqual(draft);
  });

  it('si otra petición abrió una conversación, un 400 recupera ese diálogo sin repetir avanzar-mes', async () => {
    const conversacion = { _id: 'charla', decisiones: [] };
    vi.mocked(fetch).mockResolvedValueOnce(response(balance))
      .mockResolvedValueOnce(response({ detail: 'No está en balance mensual' }, 400))
      .mockResolvedValueOnce(response({ ...balance, fase_actual: 'TOMA_DECISION_CONVERSACION', resultado_actual: { titulo: 'Anterior' }, conversacion_actual: conversacion }));
    const api = await import('./narrativeService');
    const estado = await api.continuarTurno(date);
    expect(estado.conversacion_actual).toEqual(conversacion);
    expect(estado.resultado_actual).toBeNull();
    expect(vi.mocked(fetch).mock.calls.filter(([, opts]) => opts?.method === 'POST')).toHaveLength(1);
  });

  it('descarta el grafo y resultado anteriores también en la respuesta del cierre mensual', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(response(balance)).mockResolvedValueOnce(response({
      ...draft, grafo_actual: { nodo_actual: { es_final: true } }, resultado_actual: { titulo: 'Anterior' },
      conversacion_actual: { _id: 'Anterior' },
    }));
    const api = await import('./narrativeService');
    const estado = await api.continuarTurno(date);
    expect(estado.mes_actual).toBe(3);
    expect(estado.grafo_actual).toBeNull();
    expect(estado.resultado_actual).toBeNull();
    expect(estado.conversacion_actual).toBeNull();
  });

  it('una fase ya avanzada restaura el draft sin cerrar otro mes ni mostrar un resultado viejo', async () => {
    vi.mocked(fetch).mockResolvedValue(response({ ...draft, resultado_actual: { titulo: 'Anterior' } }));
    const api = await import('./narrativeService');
    const estado = await api.continuarTurno(date);
    expect(estado.mes_actual).toBe(3);
    expect(estado.resultado_actual).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
