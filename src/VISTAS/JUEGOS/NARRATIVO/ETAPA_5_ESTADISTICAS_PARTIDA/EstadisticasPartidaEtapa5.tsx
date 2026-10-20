// Muestra las estadisticas obtenidas del estado y la trazabilidad del servidor.
const nombre = (valor: string) => valor.replaceAll('_', ' ');

// ETAPA 5: presenta la foto final y el historial sin guardar trazabilidad en Redux.
export default function EstadisticasPartidaEtapa5({ estado, historial, onVolver }: any) {
  const meses = historial.historial_mensual || [];
  const ultimoMes = meses[meses.length - 1] || {};
  const recursos = ultimoMes.recursos_fin_mes || estado.recursos || {};
  const resumen = [
    ['Meses jugados', estado.mes_actual || historial.mes_actual],
    ['Eventos resueltos', meses.filter((mes: any) => mes.evento_id).length],
    ['Conversaciones', meses.filter((mes: any) => mes.conversacion_id).length],
    ['Estado final', estado.status || historial.status],
  ];

  return (
    <section className="narrativo-panel narrativo-panel--claro narrativo-estadisticas">
      <div className="border-b border-slate-200 pb-3">
        <p className="text-sm font-medium text-slate-500">{estado.modo_local ? 'Registro de la partida local' : 'Registro del servidor'}</p>
        <h2 className="mt-1 text-3xl font-bold text-slate-900">Estadisticas del reinado</h2>
        <p className="mt-2 text-slate-600">{estado.finalizacion?.titulo || 'Partida finalizada'} · Rango {estado.finalizacion?.rango || '-'}</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {resumen.map(([etiqueta, valor]) => (
          <div className="rounded-lg border border-slate-200 bg-white p-2" key={etiqueta}>
            <p className="text-sm text-slate-500">{etiqueta}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{valor}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
        <h3 className="font-bold text-slate-900">Recursos al finalizar</h3>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {Object.entries(recursos).map(([recurso, valor]) => (
            <div key={recurso}>
              <p className="capitalize text-slate-500">{nombre(recurso)}</p>
              <p className="text-xl font-bold text-slate-900">{String(valor)}</p>
            </div>
          ))}
        </div>
      </div>

      <details className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
        <summary className="cursor-pointer font-bold text-slate-900">Historial mensual ({meses.length})</summary>
        <div className="mt-2 divide-y divide-slate-100">
          {meses.map((mes: any) => (
            <div className="flex items-center justify-between gap-2 py-1" key={mes.mes}>
              <p className="font-medium text-slate-800">Mes {mes.mes}</p>
              <p className="text-right text-sm text-slate-600">Evento: {mes.evento_id || 'sin evento'} · Resultado: {mes.resultado_id || 'sin resultado'}</p>
            </div>
          ))}
        </div>
      </details>

      <button className="mt-3 rounded bg-slate-800 px-4 py-2 text-white" onClick={onVolver}>Volver al cierre</button>
    </section>
  );
}
