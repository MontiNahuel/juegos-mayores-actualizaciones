import type { FinalizacionApi, ResultadoApi } from './narrativeService';

export default function ResultadoActual({ resultado, finalizacion, onContinuar }: {
  resultado?: ResultadoApi;
  finalizacion?: FinalizacionApi;
  onContinuar?: () => void;
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
      <div className="mt-4 flex h-48 items-center justify-center rounded border bg-slate-900 text-white">
        {contenido.imagen}
      </div>
      <p className="mx-auto mt-6 max-w-md text-slate-700">{contenido.texto}</p>
      <p className={`mt-6 rounded border p-3 font-bold ${esFinal ? colorFinal : colorResultado}`}>
        {finalizacion ? (finalizacion.rango ? `Rango final: ${finalizacion.rango}` : 'Partida finalizada') : resultado?.efectos.map(({ accion }) => `${accion.valor > 0 ? '+' : ''}${accion.valor} ${accion.clave}`).join(', ') || 'Sin cambios'}
      </p>
      {onContinuar && <button className="mt-6 rounded bg-slate-800 px-4 py-2 text-white" onClick={onContinuar}>Continuar</button>}
    </section>
  );
}
