/** Detecta recorridos que nunca pueden terminar y, por lo tanto, no habilitan el balance mensual. */
export function validarCierreGrafo(grafo) {
  const nodos = grafo.nodos || {};
  if (!nodos[grafo.nodo_raiz]) return 'El nodo raíz no existe en el grafo.';
  const destinos = nodo => (nodo.opciones || []).flatMap(opcion =>
    opcion.desenlaces?.length
      ? opcion.desenlaces.filter(d => Number(d.peso) > 0).map(d => d.nodo)
      : [opcion.siguiente_nodo]);
  const alcanzables = new Set();
  const pendientes = [grafo.nodo_raiz];
  while (pendientes.length) {
    const id = pendientes.pop();
    if (alcanzables.has(id)) continue;
    alcanzables.add(id);
    if (!nodos[id]) return `El destino "${id}" no existe en el grafo.`;
    if (!nodos[id].es_final) pendientes.push(...destinos(nodos[id]));
  }
  const conCierre = new Set([...alcanzables].filter(id => nodos[id].es_final));
  let cambio = true;
  while (cambio) {
    cambio = false;
    for (const id of alcanzables) {
      if (!conCierre.has(id) && destinos(nodos[id]).some(destino => conCierre.has(destino))) {
        conCierre.add(id);
        cambio = true;
      }
    }
  }
  const sinCierre = [...alcanzables].filter(id => !conCierre.has(id));
  return sinCierre.length
    ? `Los nodos ${sinCierre.join(', ')} no tienen un camino hacia un nodo final. Agregá un cierre para permitir el avance del mes.`
    : null;
}
