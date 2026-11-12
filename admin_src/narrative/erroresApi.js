/* Traduce el "detail" de un error de la API a texto legible en el panel. */

// Un 422 de la barrera de efectos llega como objeto {mensaje, errores:[...]};
// un 422 de validación de Pydantic llega como array de {loc, msg}. Sin esto,
// el panel terminaba renderizando "[object Object]" o rompiendo el render.
export function normalizarErrorApi(detalle, fallback = 'Ocurrió un error.') {
  if (!detalle) return { titulo: fallback, items: [] };

  if (typeof detalle === 'string') return { titulo: detalle, items: [] };

  if (Array.isArray(detalle)) {
    const items = detalle
      .map((e) => {
        const campo = (e.loc || []).filter((p) => p !== 'body').join('.');
        const msg = e.msg || '';
        return campo ? `${campo}: ${msg}` : msg;
      })
      .filter(Boolean);
    return { titulo: items.length ? 'El contenido tiene errores de formato.' : fallback, items };
  }

  if (typeof detalle === 'object') {
    const items = (detalle.errores || [])
      .map((e) => {
        const donde = [e.nodo_id, e.opcion_id].filter(Boolean).join(' / ');
        const texto = e.mensaje || e.codigo || '';
        return texto && donde ? `${donde}: ${texto}` : texto;
      })
      .filter(Boolean);
    return { titulo: detalle.mensaje || fallback, items };
  }

  return { titulo: String(detalle), items: [] };
}

export function textoDelDetalle(detalle, fallback = 'Ocurrió un error.') {
  const { titulo, items } = normalizarErrorApi(detalle, fallback);
  return items.length ? `${titulo} ${items.join(' · ')}` : titulo;
}
