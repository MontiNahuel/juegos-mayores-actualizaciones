import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EstadoGrafoApi } from './narrativeService';
import { guardarResultado, iniciarJugador, sincronizarPartida } from '../../../store/narrativoSelectionSlice';

const date = '2026-10-28';
const recursos = { oro: 50, pueblo: 50, ejercito: 50, fe: 50 };
const grafo = (cambios: Partial<EstadoGrafoApi> = {}): EstadoGrafoApi => ({
  fase_actual: 'toma_decision_evento', grafo_id: 'evt_cometa', tipo: 'evento',
  titulo: 'El cometa', imagen: '/assets/narrative/eventos/default.webp',
  nodo_actual: {
    id: 'avistamiento', hablante_id: 'narrador', texto: 'Un cometa cayó en el bosque.', es_final: false,
    opciones: [
      { id: 'opt_enviar_guardia', texto: 'Enviar la guardia', disponible: true },
      { id: 'opt_alquimista', texto: 'Investigar', disponible: false, motivo_bloqueo: 'Requiere a Vera' },
    ],
    resultado_texto: '', impactos_recursos: [], impactos_afinidad: [], impactos_tags: [],
  },
  recursos: null, afinidad: null, status: 'in_progress', ...cambios,
});
const responder = (datos: unknown) => new Response(JSON.stringify(datos));

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal('localStorage', { getItem: vi.fn().mockReturnValue('token-prueba') });
  vi.stubGlobal('fetch', vi.fn());
});
afterEach(() => vi.unstubAllGlobals());

describe('contrato de grafos narrativos V2', () => {
  it('abre el grafo al elegir carta y conserva únicamente las opciones habilitadas', async () => {
    vi.mocked(fetch).mockResolvedValue(responder({ recursos, evento_actual: null, grafo_actual: grafo() }));
    const api = await import('./narrativeService');
    const estado = await api.elegirCartaMensual(date, 'carta_sello');
    expect(estado.recursos).toEqual(recursos);
    expect(estado.evento_actual).toMatchObject({
      id: 'evt_cometa', nodo_id: 'avistamiento', descripcion: 'Un cometa cayó en el bosque.',
      opciones: [{ id: 'opt_enviar_guardia', texto: 'Enviar la guardia', bloqueada: false }],
    });
    expect(estado.resultado_actual).toBeNull();
    await api.agregarCondicionesSecretas(estado.evento_actual!);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/v2/partida/elegir-carta-mes'), expect.objectContaining({
      method: 'POST', body: JSON.stringify({ date, carta_id: 'carta_sello' }),
    }));
  });

  it('avanza por nodos intermedios sin aplicar resultados ni borrar los recursos locales', async () => {
    const intermedio = grafo();
    intermedio.nodo_actual.id = 'analisis';
    vi.mocked(fetch).mockResolvedValue(responder(intermedio));
    const api = await import('./narrativeService');
    const { store } = await import('../../../store/store');
    store.dispatch(iniciarJugador({ date, recursos, afinidad: { vera: 50 } }));
    const estado = await api.avanzarNodo(date, 'opt_enviar_guardia', 'evt_cometa');
    store.dispatch(sincronizarPartida(estado));
    expect(estado.evento_actual?.nodo_id).toBe('analisis');
    expect(estado.resultado_actual).toBeNull();
    expect(store.getState().narrativoSelection.jugador.recursos).toEqual(recursos);
    expect(store.getState().narrativoSelection.jugador.afinidad).toEqual({ vera: 50 });
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/v2/partida/avanzar-nodo'), expect.objectContaining({
      method: 'POST', body: JSON.stringify({ date, opcion_id: 'opt_enviar_guardia' }),
      headers: expect.objectContaining({ Authorization: 'Bearer token-prueba' }),
    }));
  });

  it('muestra el nodo terminal en la pantalla de resultado y usa los valores ya aplicados por el servidor', async () => {
    const final = grafo({ fase_actual: 'balance_mes', recursos: { ...recursos, oro: 35, pueblo: 70 }, afinidad: { vera: 65 } });
    final.nodo_actual = {
      ...final.nodo_actual, id: 'cierre', es_final: true, opciones: [], resultado_texto: 'El reino prospera.',
      impactos_recursos: [{ recurso: 'oro', delta: -15 }, { recurso: 'pueblo', delta: 20 }],
      impactos_afinidad: [{ personaje_id: 'vera', delta: 15 }], impactos_tags: ['ciencia'],
    };
    vi.mocked(fetch).mockResolvedValue(responder(final));
    const api = await import('./narrativeService');
    const { store } = await import('../../../store/store');
    store.dispatch(iniciarJugador({ date, recursos, afinidad: { vera: 50 } }));
    const estado = await api.avanzarNodo(date, 'opt_financiar', 'evt_cometa');
    store.dispatch(guardarResultado(estado.resultado_actual));
    store.dispatch(sincronizarPartida(estado));
    expect(estado.resultado_actual?.texto).toContain('El reino prospera.');
    expect(estado.resultado_actual?.efectos).toHaveLength(2);
    expect(estado.evento_actual).toBeNull();
    const jugador = store.getState().narrativoSelection.jugador;
    expect(jugador.recursos.oro).toBe(35);
    expect(jugador.afinidad.vera).toBe(65);
    expect(jugador.tags_activos).toEqual(['ciencia']);
  });

  it('restaura la conversación con IDs de opción de texto aunque el estado también contenga el draft anterior', async () => {
    const conversacion = grafo({ tipo: 'conversacion', grafo_id: 'conv_tesoro' });
    conversacion.nodo_actual.hablante_id = 'vera';
    vi.mocked(fetch).mockResolvedValue(responder({
      recursos, afinidad: { vera: 50 }, cartas_draft_actual: [{ _id: 'vieja' }], grafo_actual: conversacion,
    }));
    const api = await import('./narrativeService');
    const estado = await api.obtenerEstadoPartida(date);
    expect(estado.conversacion_actual).toMatchObject({
      _id: 'conv_tesoro', nodo_id: 'avistamiento', frases: [{ personajeId: 'vera', texto: expect.any(String) }],
      decisiones: [{ opcion: 'opt_enviar_guardia', texto: 'Enviar la guardia' }],
    });
    expect(estado.evento_actual).toBeNull();
    vi.mocked(fetch).mockResolvedValue(responder(conversacion));
    await api.avanzarNodo(date, 'opt_enviar_guardia', 'conv_tesoro');
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[1][1]?.body))).toEqual({ date, opcion_id: 'opt_enviar_guardia' });
  });

  it('recupera recursos y afinidades cuando el backend encadena una conversación u otro evento', async () => {
    const conversacion = grafo({ tipo: 'conversacion', grafo_id: 'conv_tesoro' });
    vi.mocked(fetch)
      .mockResolvedValueOnce(responder(conversacion))
      .mockResolvedValueOnce(responder({ recursos: { ...recursos, oro: 35 }, afinidad: { vera: 65 }, grafo_actual: conversacion }));
    const api = await import('./narrativeService');
    const estado = await api.avanzarNodo(date, 'opt_financiar', 'evt_cometa');
    expect(estado.conversacion_actual?._id).toBe('conv_tesoro');
    expect(estado.recursos?.oro).toBe(35);
    expect(estado.afinidad?.vera).toBe(65);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(String(vi.mocked(fetch).mock.calls[1][0])).toContain(`/v2/partida/estado?date=${date}`);
  });

  it('conserva la finalización recibida por colapso de recursos', async () => {
    vi.mocked(fetch).mockResolvedValue(responder(grafo({ finalizacion: { _id: 'fin_oro', tipo: 'derrota_recurso' } as EstadoGrafoApi['finalizacion'] })));
    const api = await import('./narrativeService');
    expect((await api.avanzarNodo(date, 'opt_costosa', 'evt_cometa')).finalizacion?._id).toBe('fin_oro');
  });

  it('mantiene un error del grafo visible sin reemplazarlo por una partida de demostración', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ detail: 'Grafo no encontrado' }), { status: 404 }));
    const api = await import('./narrativeService');
    await expect(api.avanzarNodo(date, 'opt_guardia', 'evt_cometa')).rejects.toThrow('Grafo no encontrado');
    expect(api.esPartidaNarrativaLocal(date)).toBe(false);
  });
});
