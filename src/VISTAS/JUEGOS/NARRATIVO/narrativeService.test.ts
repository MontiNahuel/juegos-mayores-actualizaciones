/* Comprueba con pruebas que narrative service siga funcionando como se espera. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as acciones from '../../../store/narrativoSelectionSlice';

const date = '2026-10-19';

// Carga servicio con los datos de este paso.
async function cargarServicio(habilitado = true) {
  vi.stubEnv('VITE_NARRATIVE_FALLBACK', String(habilitado));
  const servicio = await import('./narrativeService');
  const { store } = await import('../../../store/store');
  return { servicio, store };
}

beforeEach(/* Prepara un entorno limpio antes de cada prueba. */ () => {
  vi.resetModules();
  vi.stubGlobal('localStorage', { getItem: vi.fn().mockReturnValue(null) });
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Servidor desconectado')));
});
afterEach(/* Limpia el entorno al terminar cada prueba. */ () => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('respaldo del juego narrativo', /* Agrupa las pruebas de este comportamiento. */ () => {
  it('permite completar seis meses, aplicar consecuencias, ver estadisticas y reiniciar sin servidor', /* Comprueba el comportamiento indicado en este caso. */ async () => {
    const { servicio: api, store } = await cargarServicio();
    const setup = await api.obtenerSetup(date);
    // Deja el texto en un formato parejo para compararlo.
    const normalizar = <T extends { _id: string }>(item: T) => ({ ...item, id: item._id });
    store.dispatch(acciones.iniciarJugador({ date, recursos: setup.atributos_iniciales }));
    store.dispatch(acciones.guardarCorte(setup.personajes_ofrecidos.slice(0, 3).map(normalizar)));
    const iniciales = setup.cartas_ofrecidas.slice(0, 3).map(normalizar);
    const inicio = await api.iniciarPartida(date, store.getState().narrativoSelection.jugador.corte_activa, iniciales.map(/* Prepara el resultado de cada elemento. */ c => c.id));
    store.dispatch(acciones.guardarCartasIniciales(iniciales));
    store.dispatch(acciones.guardarCartasDraft(inicio.cartas_draft_actual?.map(normalizar)));

    for (let mes = 1; mes <= 6; mes++) {
      const carta = store.getState().narrativoSelection.cartasDraft[0];
      const evento = (await api.elegirCartaMensual(date, carta.id)).evento_actual!;
      store.dispatch(acciones.elegirCarta(carta));
      store.dispatch(acciones.mostrarEvento(evento));
      const opcion = evento.opciones[mes % 2];
      store.dispatch(acciones.registrarDecisionEvento({ evento_id: evento.id, opcion_id: opcion.id }));
      const data = await api.decidirEvento(date, opcion.id);
      store.dispatch(acciones.guardarResultado(data.resultado_actual));
      store.dispatch(acciones.limpiarResultado());
      if (data.conversacion_actual) {
        store.dispatch(acciones.mostrarConversacion(data.conversacion_actual));
        const decision = data.conversacion_actual.decisiones[0];
        store.dispatch(acciones.resolverConversacion({ conversacionId: data.conversacion_actual._id, decision }));
        await api.responderConversacion(date, decision.opcion);
      }
      store.dispatch(acciones.avanzarMes());
      const siguiente = await api.avanzarMes(date);
      if (mes === 6) {
        expect(siguiente.finalizacion?.tipo).toBe('victoria_tiempo');
        store.dispatch(acciones.finalizarPartida(siguiente.finalizacion));
      } else store.dispatch(acciones.guardarCartasDraft(siguiente.cartas_draft_actual?.map(normalizar)));
    }
    expect(store.getState().narrativoSelection.jugador.recursos.oro).toBe(32);
    expect(store.getState().narrativoSelection.jugador.conversaciones_jugadas).toHaveLength(3);
    expect(Object.values(store.getState().narrativoSelection.jugador.afinidad)).toContain(74);
    const historial = (await api.obtenerHistorialPartida(date)).historial_mensual;
    expect(historial).toHaveLength(6);
    expect(historial[0].recursos_fin_mes).toMatchObject({ oro: expect.any(Number), pueblo: expect.any(Number) });
    expect(historial[0].carta_elegida_id).toBeTruthy();
    expect(historial[0].evento_id).toBeTruthy();
    expect((await api.obtenerEstadoPartida(date)).finalizacion?.rango).toBe('A');
    expect(fetch).toHaveBeenCalledTimes(1);
    await api.reiniciarPartida(date);
    store.dispatch(acciones.reiniciarSeleccionNarrativa());
    expect(api.esPartidaNarrativaLocal(date)).toBe(false);
    expect((await api.obtenerSetup(date)).tiene_partida_activa).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('prioriza la respuesta real cuando el servidor funciona', /* Comprueba el comportamiento indicado en este caso. */ async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ universo_nombre: 'Servidor real' })));
    const { servicio } = await cargarServicio();
    expect((await servicio.obtenerSetup(date)).universo_nombre).toBe('Servidor real');
    expect(servicio.esPartidaNarrativaLocal(date)).toBe(false);
  });

  it('reconstruye los nombres desde el mismo universo sin perder la crónica si falla un catálogo', /* Comprueba el comportamiento indicado en este caso. */ async () => {
    vi.mocked(fetch).mockImplementation(/* Completa este paso con los datos recibidos por la operación. */ async input => {
      const url = String(input);
      if (url.includes('/admin/resultados?')) return new Response('{}', { status: 503 });
      return new Response(JSON.stringify([{ _id: 'c1', nombre: 'Sello real' }]));
    });
    const { servicio } = await cargarServicio(false);
    const catalogos = await servicio.obtenerCatalogosCronica(date, 'corte_medieval');
    expect(catalogos.cartas[0].nombre).toBe('Sello real');
    expect(catalogos.resultados).toEqual([]);
    expect(fetch).toHaveBeenCalledTimes(4);
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain('universo_id=corte_medieval');
  });

  it.each([404, 503])('habilita el respaldo ante HTTP %s', /* Completa este paso con los datos recibidos por la operación. */ async status => {
    vi.mocked(fetch).mockResolvedValue(new Response('{}', { status }));
    const { servicio } = await cargarServicio();
    expect((await servicio.obtenerSetup(date)).cartas_ofrecidas.length).toBeGreaterThanOrEqual(3);
    expect(servicio.esPartidaNarrativaLocal(date)).toBe(true);
  });

  it('mantiene los errores de autenticacion sin convertirlos en una partida local', /* Comprueba el comportamiento indicado en este caso. */ async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ detail: 'Sesión vencida' }), { status: 401 }));
    const { servicio } = await cargarServicio();
    await expect(servicio.obtenerSetup(date)).rejects.toThrow('Sesión vencida');
    expect(servicio.esPartidaNarrativaLocal(date)).toBe(false);
  });

  it('permite desactivar todos los respaldos con la variable de entorno', /* Comprueba el comportamiento indicado en este caso. */ async () => {
    const { servicio } = await cargarServicio(false);
    await expect(servicio.obtenerSetup(date)).rejects.toThrow('Servidor desconectado');
    expect(servicio.esPartidaNarrativaLocal(date)).toBe(false);
  });

  it('activa el respaldo si el servidor queda sin responder', /* Comprueba el comportamiento indicado en este caso. */ async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockImplementation(/* Completa este paso con los datos recibidos por la operación. */ (_url, options) => new Promise(/* Resuelve este trabajo pendiente y comunica cuándo terminó. */ (_resolve, reject) => {
      options?.signal?.addEventListener('abort', /* Completa este paso con los datos recibidos por la operación. */ () => reject(new DOMException('Timeout', 'AbortError')));
    }));
    const { servicio } = await cargarServicio();
    const setup = servicio.obtenerSetup(date);
    await vi.advanceTimersByTimeAsync(2500);
    expect((await setup).personajes_ofrecidos).toHaveLength(4);
  });
});
