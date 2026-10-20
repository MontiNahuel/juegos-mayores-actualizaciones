// Muestra el resultado de una decision o el cierre de la partida.
import type { FinalizacionApi, ResultadoApi } from '../narrativeService';

// ETAPA 4: muestra el resultado del evento o el cierre de la partida.
const API = (import.meta as any).env?.VITE_ASSETS_BASE_URL || '';

export default function MostrarResultadoEtapa4({ resultado, finalizacion, onContinuar, onVerEstadisticas, cargandoEstadisticas, onTerminar, reiniciando }: {
  resultado?: ResultadoApi;
  finalizacion?: FinalizacionApi;
  onContinuar?: () => void;
  onVerEstadisticas?: () => void;
  cargandoEstadisticas?: boolean;
  onTerminar?: () => void;
  reiniciando?: boolean;
}) {
  const esFinal = Boolean(finalizacion);
  const contenido = finalizacion || resultado;
  if (!contenido) return null;

  const colorResultado = {
    positivo: 'border-emerald-300 bg-emerald-50',
    negativo: 'border-rose-300 bg-rose-50',
    neutro: 'border-slate-300 bg-slate-50',
  }[resultado?.tipo_resultado || 'neutro'];
  const colorFinal = finalizacion?.tipo === 'victoria_tiempo' ? 'border-emerald-300 bg-emerald-50' : 'border-rose-300 bg-rose-50';

  return (
    <section className="p-6 text-center">
      <h2 className="text-2xl font-bold">{esFinal ? contenido.titulo : 'Resultado'}</h2>
      <div className="mt-4 h-48 overflow-hidden rounded border bg-slate-900">
        {contenido.imagen ? <img className="h-full w-full object-cover" src={contenido.imagen.startsWith('/') ? `${API}${contenido.imagen}` : contenido.imagen} alt={contenido.titulo} /> : null}
      </div>
      <p className="mx-auto mt-6 max-w-md text-slate-700">{contenido.texto}</p>
      <p className={`mt-6 rounded border p-3 font-bold ${esFinal ? colorFinal : colorResultado}`}>
        {finalizacion ? (finalizacion.rango ? `Rango final: ${finalizacion.rango}` : 'Partida finalizada') : resultado?.efectos.map(({ accion }) => `${accion.valor > 0 ? '+' : ''}${accion.valor} ${accion.clave}`).join(', ') || 'Sin cambios'}
      </p>
      {onContinuar && <button className="mt-6 rounded bg-slate-800 px-4 py-2 text-white" onClick={onContinuar}>Continuar</button>}
      {onVerEstadisticas && <button className="ml-3 mt-6 rounded border border-slate-700 px-4 py-2 text-slate-800 disabled:opacity-50" disabled={cargandoEstadisticas} onClick={onVerEstadisticas}>{cargandoEstadisticas ? 'Cargando estadisticas...' : 'Ver estadisticas'}</button>}
      {esFinal && onTerminar && <button className="ml-3 mt-6 rounded bg-slate-800 px-4 py-2 text-white disabled:opacity-50" disabled={reiniciando} onClick={onTerminar}>{reiniciando ? 'Reiniciando...' : 'Terminar prueba'}</button>}
    </section>
  );
}
