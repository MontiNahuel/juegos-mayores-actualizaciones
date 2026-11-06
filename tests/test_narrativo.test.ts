import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const html = readFileSync('public/test_narrativo.html', 'utf8');
const script = html.split('<script>')[1].split('</script>')[0].split('// Inicializar al cargar conectando directamente con la API')[0];
const balance = { mes_actual: 2, fase_actual: 'BALANCE_MES', recursos: { oro: 50 } };
const draft = { mes_actual: 3, fase_actual: 'DRAFT_MENSUAL', recursos: { oro: 48 }, cartas_draft_actual: [{ _id: 'nueva' }] };
const response = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
function cargar(modo = 'v2') {
  const fetch = vi.fn(); const alert = vi.fn();
  const context = createContext({ fetch, alert, console });
  runInContext(script + `\nrenderFase = () => {}; estado.modo = '${modo}'; estado.mes = 2; estado.fase = 'RESULTADO';`, context);
  return { fetch, alert, run: (code: string) => runInContext(code, context) };
}

describe('avance mensual del HTML de prueba', () => {
  it('consulta la fase y retoma la conversación pendiente sin cerrar el mes', async () => {
    const api = cargar();
    api.fetch.mockResolvedValue(response({ ...balance, fase_actual: 'TOMA_DECISION_CONVERSACION',
      resultado_actual: { titulo: 'Anterior' }, conversacion_actual: { _id: 'charla' } }));
    await api.run('continuarTrasResultado()');
    expect(api.run('estado.fase')).toBe('DIALOGO');
    expect(api.run('estado.mes')).toBe(2);
    expect(api.fetch).toHaveBeenCalledTimes(1);
    expect(api.alert).not.toHaveBeenCalled();
  });
  it('deduplica clics y descarta el resultado anterior al abrir el nuevo mes', async () => {
    const api = cargar();
    api.fetch.mockResolvedValueOnce(response(balance)).mockResolvedValueOnce(response({ ...draft, resultado_actual: { titulo: 'Anterior' } }));
    await api.run('Promise.all([avanzarMesSiguiente(), avanzarMesSiguiente()])');
    expect(api.fetch).toHaveBeenCalledTimes(2);
    expect(api.run('estado.mes')).toBe(3);
    expect(api.run('estado.fase')).toBe('DRAFT');
    expect(api.run('estado.apiData.resultado_actual')).toBeNull();
  });
  it('recupera un cierre confirmado aunque falle la respuesta sin repetir el POST', async () => {
    const api = cargar();
    api.fetch.mockResolvedValueOnce(response(balance)).mockRejectedValueOnce(new TypeError('Conexión cortada')).mockResolvedValueOnce(response(draft));
    await api.run('avanzarMesSiguiente()');
    expect(api.run('estado.mes')).toBe(3);
    expect(api.fetch.mock.calls.filter(([, options]) => options?.method === 'POST')).toHaveLength(1);
    expect(api.alert).not.toHaveBeenCalled();
  });
  it('conserva el mes y la pantalla tras un 400 real y permite reintentar', async () => {
    const api = cargar();
    api.fetch.mockResolvedValueOnce(response(balance)).mockResolvedValueOnce(response({ detail: 'Fase incorrecta' }, 400)).mockResolvedValueOnce(response(balance));
    await api.run('avanzarMesSiguiente()');
    expect(api.run('estado.mes')).toBe(2);
    expect(api.run('estado.fase')).toBe('RESULTADO');
    expect(api.alert).toHaveBeenCalledWith(expect.stringContaining('Fase incorrecta'));
    api.fetch.mockResolvedValueOnce(response(balance)).mockResolvedValueOnce(response(draft));
    await api.run('avanzarMesSiguiente()');
    expect(api.run('estado.mes')).toBe(3);
  });
  it('aplica la misma verificación de fase al modo V1', async () => {
    const api = cargar('v1');
    api.fetch.mockResolvedValue(response({ run: { ...balance, fase_actual: 'RESOLVER_CONVERSACION' }, conversacion_actual: { _id: 'charla' } }));
    await api.run('avanzarMesSiguiente()');
    expect(api.run('estado.fase')).toBe('DIALOGO');
    expect(api.fetch).toHaveBeenCalledTimes(1);
  });
  it('usa avanzar-nodo para IDs de texto y recupera la fase completa', async () => {
    const api = cargar();
    api.fetch.mockResolvedValueOnce(response({})).mockResolvedValueOnce(response({ ...balance, resultado_actual: { titulo: 'Consecuencia' } }));
    await api.run("responderDialogo('opt_mediar')");
    expect(api.fetch.mock.calls[0][0]).toContain('/avanzar-nodo');
    expect(JSON.parse(api.fetch.mock.calls[0][1].body).opcion_id).toBe('opt_mediar');
    expect(api.run('estado.fase')).toBe('RESULTADO');
  });
  it('completa doce meses y respeta el final sin enviar otro cierre', async () => {
    const api = cargar();
    for (let mes = 1; mes <= 12; mes++) {
      const siguiente = mes === 12
        ? { mes_actual: 12, fase_actual: 'FINALIZADA', finalizacion: { titulo: 'Victoria' } }
        : { ...draft, mes_actual: mes + 1 };
      api.fetch.mockResolvedValueOnce(response({ ...balance, mes_actual: mes })).mockResolvedValueOnce(response(siguiente));
      await api.run('avanzarMesSiguiente()');
      expect(api.run('estado.mes')).toBe(mes === 12 ? 12 : mes + 1);
    }
    expect(api.run('estado.fase')).toBe('FIN');
    api.fetch.mockResolvedValueOnce(response({ mes_actual: 12, fase_actual: 'FINALIZADA', finalizacion: { titulo: 'Victoria' } }));
    await api.run('avanzarMesSiguiente()');
    expect(api.fetch.mock.calls.filter(([, options]) => options?.method === 'POST')).toHaveLength(12);
  });
  it('no duplica la carta mensual al recibir dos clics', async () => {
    const api = cargar();
    api.run("estado.apiData = { cartas_draft_actual: [{ _id: 'apoyo', nombre: 'Apoyo' }] }");
    api.fetch.mockResolvedValue(response({ ...balance, fase_actual: 'TOMA_DECISION_EVENTO', evento_actual: { id: 'evento' } }));
    await api.run("Promise.all([elegirCartaDraft('apoyo'), elegirCartaDraft('apoyo')])");
    expect(api.fetch).toHaveBeenCalledTimes(1);
    expect(api.run('estado.cartas.length')).toBe(1);
    expect(api.run('estado.fase')).toBe('EVENTO');
  });

});
