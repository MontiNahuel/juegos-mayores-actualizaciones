/* Laboratorio documental del contrato V2 leído el 6/11/2026. Sin peticiones reales. */
(() => {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  const has = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const initial = {
    date: '2026-11-06', mes_actual: 2, fase_actual: 'TOMA_DECISION_EVENTO', status: 'CONTINUA',
    recursos: { oro: 60, pueblo: 50, ejercito: 50, fe: 50 }, afinidad: { consejera_demo: 50 },
    grafo_actual: null,
  };
  const node = (extra = {}) => ({
    id: 'nodo_demo', hablante_id: 'consejera_demo', texto: 'La corte espera tu decisión.',
    imagen: null, es_final: false, opciones: [{ id: 'ayudar', texto: 'Ayudar al pueblo', disponible: true, motivo_bloqueo: null }],
    resultado_texto: '', impactos_recursos: [], impactos_afinidad: [], impactos_tags: [], ...extra,
  });
  const graph = (extra = {}) => ({
    fase_actual: 'TOMA_DECISION_EVENTO', grafo_id: 'evento_demo', tipo: 'evento',
    titulo: 'Decisión de la corte', imagen: '/assets/narrative/eventos/demo.webp',
    nodo_actual: node(), recursos: null, afinidad: null, finalizacion: null,
    status: 'CONTINUA', ...extra,
  });
  const examples = {
    draft: { label: 'Nuevo mes: draft confirmado', endpoint: 'POST /api/narrative/v2/partida/avanzar-mes', kind: 'estado',
      request: { date: '2026-11-06' },
      response: { mes_actual: 3, fase_actual: 'DRAFT_MENSUAL', status: 'CONTINUA', recursos: { oro: 70, pueblo: 50, ejercito: 50, fe: 50 }, cartas_draft_actual: [
        { _id: 'carta_demo_a', universo_id: 'universo_demo', categoria: 'item', nombre: 'Reservas de la corte', descripcion: 'Carta ficticia para ilustrar la oferta recibida.' },
        { _id: 'carta_demo_b', universo_id: 'universo_demo', categoria: 'bonus', nombre: 'Acuerdo del consejo', descripcion: 'Carta ficticia para ilustrar la oferta recibida.' },
        { _id: 'carta_demo_c', universo_id: 'universo_demo', categoria: 'personaje', nombre: 'Visita de un consejero', descripcion: 'Carta ficticia para ilustrar la oferta recibida.' },
      ], finalizacion: null },
      note: 'El mes y el oro llegan confirmados. Se prepara SeleccionarCartasEtapa0y1 con la oferta recibida, conservando una elección mensual en la UI normal vigente. Los botones de la maqueta son informativos.' },
    emptyDraft: { label: 'Draft vacío: recuperar oferta', endpoint: 'POST /api/narrative/v2/partida/avanzar-mes', kind: 'estado',
      request: { date: '2026-11-06' },
      response: { mes_actual: 3, fase_actual: 'DRAFT_MENSUAL', status: 'CONTINUA', recursos: { oro: 70, pueblo: 50, ejercito: 50, fe: 50 }, cartas_draft_actual: [], finalizacion: null },
      note: 'Una oferta vacía requiere recuperación o un error explícito. No se sortean cartas nuevas en React ni se envía una elección inventada.' },
    intermediate: { label: 'Nodo intermedio: recursos omitidos', endpoint: 'POST /api/narrative/v2/partida/avanzar-nodo', kind: 'grafo',
      request: { date: '2026-11-06', opcion_id: 'seguir' },
      response: graph({ nodo_actual: node({ opciones: [
        { id: 'ayudar', texto: 'Ayudar al pueblo', disponible: true, motivo_bloqueo: null },
        { id: 'secreta', texto: 'Negociar un acuerdo', disponible: false, motivo_bloqueo: 'No cumplís el requisito del servidor.' },
      ] }) }),
      note: 'recursos y afinidad pueden ser null en un nodo intermedio. El adapter conserva los valores confirmados; no los convierte en cero. disponible y motivo_bloqueo se respetan sin recalcular condiciones.' },
    result: { label: 'Desenlace: mostrar sin volver a sumar', endpoint: 'POST /api/narrative/v2/partida/avanzar-nodo', kind: 'grafo',
      request: { date: '2026-11-06', opcion_id: 'ayudar' },
      response: graph({ fase_actual: 'BALANCE_MES', recursos: { oro: 70, pueblo: 50, ejercito: 50, fe: 50 }, afinidad: { consejera_demo: 58 },
        nodo_actual: node({ id: 'resultado_demo', es_final: true, opciones: [], texto: 'La corte agradece tu decisión.', resultado_texto: 'Se incorporaron reservas al reino.', impactos_recursos: [{ recurso: 'oro', delta: 10 }], impactos_afinidad: [{ personaje_id: 'consejera_demo', delta: 8 }] }) }),
      note: 'Aunque fase_actual ya sea BALANCE_MES, nodo_actual.es_final pide presentar MostrarResultadoEtapa4. El oro confirmado es 70; impactos_recursos explica el cambio, no ordena sumar otros 10.' },
    conversation: { label: 'Conversación: mismos retratos y diálogo', endpoint: 'POST /api/narrative/v2/partida/avanzar-nodo', kind: 'grafo',
      request: { date: '2026-11-06', opcion_id: 'continuar' },
      response: graph({ grafo_id: 'conversacion_demo', tipo: 'conversacion', fase_actual: 'RESOLVER_CONVERSACION', titulo: 'Una audiencia con tu consejera', nodo_actual: node({ texto: '¿Qué prioridad tendrá el reino?' }) }),
      note: 'El tipo y hablante_id preparan ResponderConversacionEtapa3 con retratos del catálogo ya cargado. Un cambio de grafo exige reconciliar el estado y conservar cualquier resultado pendiente antes de mostrar la conversación.' },
    final: { label: 'Finalización: manda la respuesta', endpoint: 'GET /api/narrative/v2/partida/estado?date=2026-11-06', kind: 'estado', request: null,
      response: { ...initial, fase_actual: 'FINALIZADA', status: 'DERROTA',
        finalizacion: { _id: 'fin_demo', universo_id: 'universo_demo', titulo: 'Fin del reinado', texto: 'El servidor confirmó el desenlace.', tipo: 'derrota_recurso', imagen: '/assets/narrative/finalizaciones/default.webp' } },
      note: 'Se muestra la finalización recibida. No se llama a finalPorRecurso para inventar un desenlace. Esta fixture usa oro=60 deliberadamente para hacer visible quién decide el cierre.' },
    incomplete: { label: 'Desenlace sin saldo: consultar antes de continuar', endpoint: 'POST /api/narrative/v2/partida/avanzar-nodo', kind: 'grafo',
      request: { date: '2026-11-06', opcion_id: 'ayudar' },
      response: graph({ fase_actual: 'BALANCE_MES', nodo_actual: node({ es_final: true, opciones: [], impactos_recursos: [{ recurso: 'oro', delta: 10 }] }) }),
      note: 'El schema permite recursos=null. Con un desenlace que cambia recursos, falta confirmar el saldo: el coordinador consulta GET estado. No lo reconstruye sumando deltas ni sigue al próximo mes a ciegas.' },
  };

  function adapt(previous, payload, kind) {
    const confirmed = clone(previous);
    const incoming = kind === 'grafo' ? { grafo_actual: payload, fase_actual: payload.fase_actual, status: payload.status } : payload;
    const currentGraph = incoming.grafo_actual;
    for (const key of ['date', 'mes_actual', 'fase_actual', 'status', 'cartas_draft_actual', 'finalizacion', 'grafo_actual']) {
      if (has(incoming, key)) confirmed[key] = clone(incoming[key]);
    }
    if (incoming.fase_actual === 'DRAFT_MENSUAL' && !has(incoming,'grafo_actual')) confirmed.grafo_actual = null;
    for (const key of ['recursos', 'afinidad']) {
      const value = currentGraph?.[key] ?? incoming[key];
      if (value != null) confirmed[key] = clone(value);
    }
    if (currentGraph?.finalizacion) confirmed.finalizacion = clone(currentGraph.finalizacion);
    const finalNode = currentGraph?.nodo_actual?.es_final;
    const missingFinalResources = finalNode && currentGraph?.recursos == null && incoming.recursos == null && currentGraph.nodo_actual.impactos_recursos?.length;
    const missingFinalAffinity = finalNode && currentGraph?.afinidad == null && incoming.afinidad == null && currentGraph.nodo_actual.impactos_afinidad?.length;
    const changedGraph = previous.grafo_actual && currentGraph && previous.grafo_actual.grafo_id !== currentGraph.grafo_id;
    return { confirmed, needsSync: Boolean(missingFinalResources || missingFinalAffinity || changedGraph), reason: changedGraph ? 'Cambió el grafo: reconciliar sin perder el resultado previo.' : 'Faltan valores confirmados del desenlace.' };
  }
  function project(state) {
    if (state.finalizacion || ['VICTORIA', 'DERROTA', 'completed', 'failed'].includes(state.status)) return { screen: 'MostrarResultadoEtapa4 · finalización', options: [], title: state.finalizacion?.titulo || 'Final confirmado', background: state.finalizacion?.imagen || null };
    const g = state.grafo_actual, n = g?.nodo_actual;
    if (n?.es_final) return { screen: 'MostrarResultadoEtapa4 · resultado', options: [], title: n.resultado_texto || n.texto, background: n.imagen || g.imagen };
    if (g && n && ['evento','conversacion'].includes(g.tipo)) return {
      screen: g.tipo === 'conversacion' ? 'ResponderConversacionEtapa3' : 'DecidirEventoEtapa2',
      options: n.opciones || [], title: n.texto, background: n.imagen || g.imagen, speaker: n.hablante_id,
    };
    if (state.fase_actual === 'DRAFT_MENSUAL') return { screen: 'SeleccionarCartasEtapa0y1 · draft', options: (state.cartas_draft_actual || []).map(c=>({ id:c._id,texto:c.nombre,disponible:true })), title: 'Mes '+state.mes_actual, background: null, emptyDraft: !state.cartas_draft_actual?.length };
    if (state.fase_actual === 'BALANCE_MES') return { screen: 'Balance · esperar intención de continuar', options: [], title: 'Balance mensual', background: null };
    return { screen: 'Contrato no reconocido · recuperar estado', options: [], title: 'No se inventa una fase alternativa.', background: null, unsupported: true };
  }
  globalThis.CogniCoordinatorDemo = Object.freeze({ adapt, project, initial, examples });
  if (typeof customElements === 'undefined') return;
  class CoordinadorNarrativo extends HTMLElement {
    connectedCallback() {
      if (this.dataset.ready) return;
      this.dataset.ready='true';
      this.innerHTML = `
        <style>coordinador-narrativo{display:block;min-width:0}.cc-columns{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:20px}.cc-columns>div{min-width:0}.cc-columns pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px}.cc-flow{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:20px 0}.cc-flow span{padding:9px;border:1px solid var(--line);border-radius:6px;font-size:13px}.cc-flow [data-active=true]{background:var(--soft);border-color:var(--accent);font-weight:650}.cc-preview{overflow-wrap:anywhere;padding:20px;border:1px solid var(--line);border-radius:12px;background:var(--card)}.cc-preview h4{margin-top:0}.cc-preview button{display:block;width:100%;text-align:left;margin:10px 0}.cc-controls label{display:block}.cc-controls select{max-width:100%;color:var(--ink);background:var(--card);padding:10px;border:1px solid var(--line);border-radius:7px}.cc-check{font-size:14px;line-height:1.65}.cc-check strong{color:var(--accent)}@media(max-width:850px){.cc-columns{grid-template-columns:1fr}.cc-columns>div:first-child{order:2}.cc-columns>div:last-child{order:1}}@media print{.cc-controls{display:none}}</style>
        <h3>Actualización del 6 de noviembre: Application Controller + Adapter</h3>
        <p>El backend administra acciones reutilizables y resuelve la partida. El front conserva la puesta en escena: fondos, retratos, diálogos, resultado y transiciones. La migración propuesta cambia quién prepara los datos y decide la siguiente vista; reutiliza los componentes actuales.</p>
        <p><a class="secondary" href="docs/arquitectura/coordinador-frontend-contrato-v2.md" target="_blank" rel="noopener noreferrer">Abrir especificación actualizada para implementar</a></p>
        <div class="tablewrap"><table><thead><tr><th>Patrón</th><th>Responsabilidad concreta</th></tr></thead><tbody>
          <tr><td>Application Controller</td><td>Coordina intenciones, peticiones, recuperación y secuencia visual. Se puede exponer como useKingsCourtCoordinator; el hook es una implementación propuesta.</td></tr>
          <tr><td>Adapter</td><td>Normaliza EstadoTurnoResponse, EstadoGrafoV2Response y respuestas parciales. No interpreta acciones, frecuencias, porcentajes ni condiciones de cartas.</td></tr>
          <tr><td>Presentation Model</td><td>Produce props para las vistas actuales: pantalla, fondo, retratos, texto, opciones y estado de espera. La FSM local solo regula presentación.</td></tr>
        </tbody></table></div>
        <p class="source"><a href="https://martinfowler.com/eaaCatalog/applicationController.html" target="_blank" rel="noopener noreferrer">Application Controller · Fowler</a><a href="https://martinfowler.com/eaaDev/PresentationModel.html" target="_blank" rel="noopener noreferrer">Presentation Model · Fowler</a><a href="http://10.16.2.19:8090/docs" target="_blank" rel="noopener noreferrer">Swagger de referencia · red interna</a></p>
        <h3>Qué cambió en el contrato de las cartas</h3>
        <p><code>EfectoSchema</code> admite <code>frecuencia_id</code>, <code>condiciones</code> y una lista <code>acciones</code>. Cada elemento referencia <code>accion_id</code> y sus <code>parametros</code>. La acción del catálogo define <code>primitiva</code>, universo, disponibilidad y versión. El campo singular <code>accion</code> sigue publicado como formato legacy; no debe convertirse en un segundo motor en el front.</p>
        <pre><code>{
  "id": "efecto_demo", "frecuencia_id": "cada_mes",
  "condiciones": [],
  "acciones": [{
    "accion_id": "accion_demo_reservas",
    "parametros": {"clave": "oro", "operacion_matematica": "sumar",
                   "valor": 10, "tipo_calculo": "fijo", "destino": "portador"}
  }]
}</code></pre>
        <p class="small muted">Fixture inventada con la estructura publicada. Los IDs no certifican registros existentes en la DB. El servidor resuelve referencias y frecuencias; la vista no descarga el catálogo administrativo para ejecutarlo.</p>
        <h3>Peticiones reales que coordina el front</h3>
        <div class="tablewrap"><table><thead><tr><th>Intención / consulta</th><th>Ruta y datos</th><th>Qué hace el coordinador con la respuesta</th></tr></thead><tbody>
          <tr><td>Preparar / restaurar</td><td>GET /api/narrative/partida/setup; GET /api/narrative/v2/partida/estado, con date.</td><td>Preparar selección si no existe partida; reanudar fase y grafo confirmados si existe.</td></tr>
          <tr><td>Confirmar preparación</td><td>POST /api/narrative/v2/partida/iniciar: date, corte_elegida_ids, cartas_iniciales_ids.</td><td>Tomar recursos, afinidad, draft y finalización del back. No ejecutar al_obtener en Redux.</td></tr>
          <tr><td>Elegir carta mensual</td><td>POST /api/narrative/v2/partida/elegir-carta-mes: date, carta_id.</td><td>Adaptar grafo_actual, recursos y posibles finales; actualizar inventario con una consulta autoritativa cuando falte.</td></tr>
          <tr><td>Elegir opción / respuesta</td><td>POST /api/narrative/v2/partida/avanzar-nodo: date, opcion_id.</td><td>Adaptar el grafo directo; presentar nodo o desenlace y conservar conversación pendiente.</td></tr>
          <tr><td>Avanzar mes</td><td>POST /api/narrative/v2/partida/avanzar-mes: date.</td><td>Usar mes_actual y recursos recibidos; no incrementar el mes antes del POST.</td></tr>
        </tbody></table></div>
        <h3>Laboratorio: la misma UI, otra autoridad</h3>
        <p>Elegí una respuesta y aplicala para observar cómo cambia el entorno. Son fixtures locales basadas en los schemas; no se consulta ni modifica el servidor. El laboratorio anterior conserva el diseño inicial como referencia histórica.</p>
        <div class="cc-controls"><label>Respuesta del backend <select data-cc="case">${Object.entries(examples).map(([key,value])=>`<option value="${key}">${value.label}</option>`).join('')}</select></label><p><button data-cc="apply">Aplicar respuesta al coordinador</button> <button data-cc="reset">Reiniciar lectura del ejemplo</button></p></div>
        <div class="cc-flow" aria-label="Recorrido de la respuesta"><span>Intención</span><span>API V2</span><span data-cc="adapter-step">Adapter</span><span data-cc="view-step">Presentation Model</span><span>Vista existente</span></div>
        <p data-cc="status" role="status" aria-live="polite"></p>
        <div class="cc-columns"><div><h4>Respuesta y petición documentadas</h4><p data-cc="endpoint"></p><pre><code data-cc="request"></code></pre><pre><code data-cc="response"></code></pre></div><div><h4>Entorno preparado por el coordinador</h4><div class="cc-preview"><h4 data-cc="screen"></h4><p data-cc="title"></p><p data-cc="environment"></p><div data-cc="options"></div><p class="cc-check" data-cc="confirmed"></p></div><p data-cc="explanation"></p></div></div>
        <h3>Conservar el flujo, retirar reglas duplicadas</h3>
        <p>Se conservan <code>MuestraEventoEtapa0</code>, <code>SeleccionarCartasEtapa0y1</code>, <code>DecidirEventoEtapa2</code>, <code>ResponderConversacionEtapa3</code>, <code>MostrarResultadoEtapa4</code>, <code>EstadisticasPartidaEtapa5</code> y la composición del fondo. Selección temporal y adaptación visual siguen siendo locales.</p>
        <p>El coordinador recibe texto, nodo e impactos, prepara las props y precarga recursos visuales. Un nodo final tiene prioridad de presentación sobre la fase BALANCE_MES: primero se lee el resultado, luego se muestra el cambio del fondo y la conversación pendiente. Al continuar, solo una intención explícita puede solicitar avanzar el mes.</p>
        <pre><code>// Diseño propuesto; utiliza las rutas V2 que ya están publicadas.
async function elegirOpcion(opcionId) {
  bloquearInteraccion();
  try {
    const dto = await api.avanzarNodo({ date, opcion_id: opcionId });
    conservarResultadoYDialogoPendientes(dto);
    const respuesta = adapter.normalizar(dto, confirmado);
    if (respuesta.necesitaReconciliar) {
      const estado = await api.obtenerEstado(date);
      aceptarConfirmado(adapter.normalizarEstado(estado));
    } else {
      aceptarConfirmado(respuesta.confirmado);
    }
    prepararPresentacion(proyectarVista(confirmado, escenasPendientes));
  } catch (error) {
    marcarResultadoInciertoSiCorresponde(error);
    // No repetir automáticamente un POST ni activar fallback silencioso.
  }
}
// ANIMACION_FIN libera la secuencia visual; no aplica acciones.
// Cargar una fase no dispara por sí mismo otro comando de partida.</code></pre>
        <details><summary>Qué quitar del camino remoto y qué falta acordar con el back</summary><div>
          <ul><li>Retirar aplicarEfectosAlObtener y los deltas de guardarResultado del camino remoto; conservarlos solo en una demo local identificada si sigue siendo necesaria.</li><li>Separar elección temporal de corte/cartas de su adquisición confirmada. No restar pérdidas por edad ni decidir finalizaciones en el cliente.</li><li>Conservar valores cuando un campo se omite o es null; comprobar un GET autoritativo si un desenlace no trae el saldo actualizado. No completar datos con cero ni con una suma de impactos.</li><li>Los endpoints de partida no publican commandId ni expectedVersion. La versión del catálogo de acciones no es la versión del run: bloquear clics no resuelve reintentos en dos pestañas.</li><li>Después de timeout: consultar estado; no reenviar automáticamente. Un recibo idempotente y un resultado persistido reanudable siguen siendo mejoras de backend a acordar.</li><li>El retorno conversacion_actual es un objeto abierto en el schema de grafo. Normalizarlo y preservar el resultado pendiente; no asumir un formato no documentado ni perderlo al hacer GET.</li><li>La API documenta Authorization y x-guest-credential. El transporte actual envía token pero no ese header de invitado; reutilizar el flujo de credenciales existente y verificar la política del servidor.</li></ul>
        </div></details>
        <p class="small muted">Evidencia: contrato OpenAPI de la API versión 2.0.0 leído el 6/11/2026 y frontend 30a7844. OpenAPI declara contratos; no prueba la ejecución de todas las primitivas ni se ejecutaron partidas o escrituras contra la DB.</p>`;
      const field=this.querySelector('[data-cc="case"]');
      this.querySelector('[data-cc="apply"]').addEventListener('click',()=>this.renderExample(true));
      this.querySelector('[data-cc="reset"]').addEventListener('click',()=>this.renderExample(false));
      field.addEventListener('change',()=>this.renderExample(false));
      this.renderExample(false);
    }
    renderExample(applied) {
      const example=examples[this.querySelector('[data-cc="case"]').value];
      const result=applied?adapt(initial,example.response,example.kind):{confirmed:clone(initial),needsSync:false};
      const view=applied?project(result.confirmed):{screen:'Esperando respuesta',title:'Todavía no cambió el entorno.',options:[],background:null};
      const write=(part,value)=>{this.querySelector(`[data-cc="${part}"]`).textContent=value;};
      write('endpoint',example.endpoint);write('request',JSON.stringify(example.request,null,2));write('response',JSON.stringify(example.response,null,2));
      write('screen',result.needsSync?'Reconciliando · GET estado':view.screen);
      write('title',view.title);write('environment',`Fondo: ${view.background||'conservar fondo de la corte'}. Retrato: ${view.speaker||'según la escena existente'}.`);
      write('confirmed',`Estado confirmado local: mes ${result.confirmed.mes_actual}; oro ${result.confirmed.recursos.oro}; afinidad ${result.confirmed.afinidad.consejera_demo}. Impactos ejecutados por el front: 0.`);
      write('status',!applied?'Esperando que apliques la respuesta.':result.needsSync?result.reason:view.emptyDraft?'Draft vacío: recuperar estado o mostrar error de oferta; no inventar cartas.':'Respuesta adaptada: se prepara la pantalla existente sin ejecutar acciones.');
      write('explanation',example.note);
      this.querySelector('[data-cc="adapter-step"]').dataset.active=String(applied);
      this.querySelector('[data-cc="view-step"]').dataset.active=String(applied&&!result.needsSync);
      const options=this.querySelector('[data-cc="options"]');options.replaceChildren();
      for(const option of result.needsSync?[]:view.options){const button=document.createElement('button');button.type='button';button.disabled=true;button.textContent=option.texto+(option.disponible?' · disponible en el juego':' · bloqueada: '+(option.motivo_bloqueo||'según el servidor'));options.append(button);}
    }
  }
  customElements.define('coordinador-narrativo',CoordinadorNarrativo);
})();
