/* Simulador documental. No llama APIs ni ejecuta reglas sobre partidas reales. */
(() => {
  'use strict';
  const copy = value => JSON.parse(JSON.stringify(value));
  const cases = {
    arancel: { name: 'Arancel: +10 oro mensual', phase: 'BALANCE_MES', command: 'AVANZAR_MES', next: 'DRAFT_MENSUAL', explanation: 'El motor comprueba pueblo ≥ 40 y ejecuta cada_mes al entrar al siguiente mes no final. La cantidad de cartas del draft permanece configurable.' },
    porcentaje: { name: 'Resultado: −15% de oro', phase: 'DECIDIR_EVENTO', command: 'DECIDIR_EVENTO', next: 'RESULTADO_EVENTO', explanation: 'Con oro=60, −15% da 51. El servidor devuelve el saldo y el delta aplicado; la animación no resta otros nueve.' },
    secreto: { name: 'Forzar opción secreta: oro ≥ 80', phase: 'DECIDIR_EVENTO', command: 'DECIDIR_EVENTO', next: 'RESULTADO_EVENTO', explanation: 'La demo permite intentar la opción para probar el guard del backend. Con oro menor a 80 se rechaza; con 80 o más cuesta 20 y avanza.' },
    conversacion: { name: 'Conversación: +8 de afinidad', phase: 'CONVERSACION', command: 'RESPONDER_CONVERSACION', next: 'RESULTADO_CONVERSACION', explanation: 'La afinidad de 50 pasa a 58 una sola vez. El frontend espera el valor confirmado, incluso si reintenta la misma respuesta.' },
    neutral: { name: 'Resultado sin efectos', phase: 'DECIDIR_EVENTO', command: 'DECIDIR_EVENTO', next: 'RESULTADO_EVENTO', explanation: 'Una consecuencia vacía sigue teniendo resultado y una fase reanudable. No se inventa una recompensa para mostrar la pantalla.' },
  };
  // Tablas de transición: el estado actual limita los eventos que se pueden aceptar.
  // Una FSM puede implementarse con tablas; no requiere una clase por estado.
  const uiEdges = {
    listo: { INTENCION: ['enviando'], HTTP_OK: ['listo'], RECARGAR: ['cargando'] },
    enviando: { HTTP_OK: ['mostrando_consecuencias', 'listo'], HTTP_RECHAZO: ['error_recuperable'], HTTP_CONFLICTO: ['reconciliando'], TIMEOUT: ['resultado_incierto'], RECARGAR: ['cargando'] },
    mostrando_consecuencias: { ANIMACION_FIN: ['listo'], HTTP_OK: ['listo'], RECARGAR: ['cargando'] },
    resultado_incierto: { REINTENTAR: ['enviando'], HTTP_OK: ['mostrando_consecuencias', 'listo'], RECARGAR: ['cargando'] },
    error_recuperable: { RECARGAR: ['cargando'] },
    reconciliando: { RECARGAR: ['cargando'] },
    cargando: { ESTADO_RECUPERADO: ['listo'] },
  };
  const domainEdges = {
    BALANCE_MES: { AVANZAR_MES: 'DRAFT_MENSUAL' },
    DECIDIR_EVENTO: { DECIDIR_EVENTO: 'RESULTADO_EVENTO' },
    CONVERSACION: { RESPONDER_CONVERSACION: 'RESULTADO_CONVERSACION' },
  };
  function transitionUI(m, event, target, guard, action) {
    if (!uiEdges[m.ui]?.[event]?.includes(target)) {
      m.log.push(`FSM FRONT → evento ${event} ignorado en ${m.ui}; no existe esa transición.`); return false;
    }
    m.lastFront = { from: m.ui, event, guard, action, to: target };
    m.ui = target; return true;
  }
  function create(scenario = 'arancel', oro = 60, pueblo = 50) {
    const state = { version: 8, mes: 2, fase: cases[scenario].phase, oro, pueblo, afinidad: 50 };
    return { scenario, server: copy(state), client: copy(state), visualOro: oro, ui: 'listo', pending: null, packet: null, receipts: {}, seen: [], applied: 0, sequence: 0, lastFront: null, lastBack: null, step: 'Inicio: ambas partes conocen la versión 8. Todavía no viajó ningún mensaje.', log: ['Estado inicial: versión 8. Los cambios de la demo se descartan al reiniciar.'] };
  }
  function send(m) {
    if (m.pending || !transitionUI(m, 'INTENCION', 'enviando', 'No hay otro comando pendiente.', 'Crear commandId y pedir al servicio HTTP que envíe el comando.')) return;
    m.pending = { commandId: `demo-${++m.sequence}`, expectedVersion: m.client.version, type: cases[m.scenario].command, payload: m.scenario === 'arancel' ? {} : { opcionId: m.scenario } };
    m.step = '1 · El clic produce INTENCION en la FSM del front. Su acción envía HTTP; la fase del backend todavía no cambió.';
    m.log.push(`FRONT → ${m.pending.type}, ${m.pending.commandId}, versión ${m.pending.expectedVersion}. Aún no cambió el backend.`);
  }
  function process(m) {
    if (!m.pending) return;
    const command = m.pending;
    const receipt = m.receipts[command.commandId];
    if (receipt) { m.packet = copy(receipt); m.lastBack = { from: m.server.fase, event: command.type + ' repetido', guard: 'Existe el recibo de commandId.', action: 'Devolver el recibo guardado; no ejecutar ECA ni transicionar.', to: m.server.fase }; m.step = 'Reintento · El back reconoce commandId y devuelve el recibo original; no hay nueva transición de dominio.'; m.log.push('BACK → recibo existente: mismo resultado, sin ejecutar efectos otra vez.'); return; }
    if (command.expectedVersion !== m.server.version || !domainEdges[m.server.fase]?.[command.type]) {
      m.packet = { error: 409, message: 'Versión o fase obsoleta: consultar el estado antes de otra intención.' };
      m.lastBack = { from: m.server.fase, event: command.type, guard: 'FALLÓ: versión o comando permitido en esta fase.', action: 'Responder 409; no ejecutar ECA.', to: m.server.fase };
      m.step = 'El backend rechazó el comando. El front todavía espera: recién conocerá el conflicto cuando reciba HTTP 409.';
      m.log.push('BACK → 409. No se aplicó esta intención.'); return;
    }
    if (m.scenario === 'secreto' && m.server.oro < 80) {
      m.packet = { error: 403, message: 'La opción secreta exige oro ≥ 80.' };
      m.lastBack = { from: m.server.fase, event: command.type, guard: 'FALLÓ: oro ≥ 80.', action: 'Responder 403; sin efectos ni avance.', to: m.server.fase };
      m.step = 'El guard de dominio impide elegir esta opción. La fase y los recursos se conservan.';
      m.log.push('BACK → 403 por condición incumplida. Sin cambios.'); return;
    }
    const next = copy(m.server), consequences = [];
    const change = (field, target) => {
      const before = next[field];
      next[field] = Math.max(0, Math.min(100, target));
      if (next[field] !== before) consequences.push({ id: `${command.commandId}:${consequences.length}`, atributo: field, antes: before, despues: next[field], deltaAplicado: next[field] - before });
    };
    if (m.scenario === 'arancel') { if (next.pueblo >= 40) change('oro', next.oro + 10); next.mes++; }
    if (m.scenario === 'porcentaje') change('oro', Math.round(next.oro * 0.85));
    if (m.scenario === 'secreto') change('oro', next.oro - 20);
    if (m.scenario === 'conversacion') change('afinidad', next.afinidad + 8);
    next.version++; next.fase = domainEdges[m.server.fase][command.type];
    const packet = { commandId: command.commandId, snapshot: next, consecuencias: consequences, presentacion: { titulo: m.scenario === 'neutral' ? 'La corte escuchó tu decisión' : 'Consecuencias confirmadas' } };
    // Commit indivisible en memoria. En producción exige persistencia atómica y control de concurrencia real.
    m.lastBack = { from: m.server.fase, event: command.type, guard: 'Versión, fase y requisitos válidos.', action: `Ejecutar ECA; guardar snapshot v${next.version} y recibo juntos.`, to: next.fase };
    m.server = next; m.receipts[command.commandId] = copy(packet); m.packet = copy(packet); m.applied += consequences.length;
    m.step = '2 · La FSM del backend validó el comando y avanzó. El snapshot del front sigue viejo: aún no recibió la respuesta.';
    m.log.push(`BACK → commit versión ${next.version}; mes ${next.mes}, fase ${next.fase}. Efectos aplicados: ${consequences.length}.`);
  }
  function receive(m, packet = m.packet) {
    if (!packet) return;
    if (packet.error) { transitionUI(m, packet.error === 409 ? 'HTTP_CONFLICTO' : 'HTTP_RECHAZO', packet.error === 409 ? 'reconciliando' : 'error_recuperable', `HTTP ${packet.error} recibido.`, 'Mostrar el problema; recuperar estado antes de una intención nueva.'); m.step = '3 · El transporte convirtió el error HTTP en un evento de la FSM del front. No se adelanta la fase local.'; m.log.push(`FRONT ← ${packet.error}: ${packet.message}`); return; }
    if (packet.snapshot.version < m.client.version) { m.log.push('FRONT → respuesta vieja ignorada. No retrocede la versión.'); return; }
    const fresh = packet.consecuencias.filter(effect => !m.seen.includes(effect.id));
    if (!transitionUI(m, 'HTTP_OK', fresh.length ? 'mostrando_consecuencias' : 'listo', 'Versión no obsoleta; consecuencias deduplicadas por ID.', 'Sustituir el snapshot y preparar la presentación de la fase confirmada.')) return;
    m.client = copy(packet.snapshot);
    const oro = fresh.find(effect => effect.atributo === 'oro');
    m.visualOro = oro ? oro.antes : m.client.oro;
    m.seen.push(...fresh.map(effect => effect.id));
    m.step = '3 · HTTP_OK sincroniza el snapshot. La fase de dominio ya está confirmada; la FSM del front decide cuándo mostrar su pantalla.';
    m.log.push(`FRONT ← sustituye snapshot v${m.client.version}. ${fresh.length ? 'Prepara animación; no suma deltas al saldo confirmado.' : 'Muestra resultado sin efectos nuevos; no repite animaciones.'}`);
  }
  function animate(m) {
    if (!transitionUI(m, 'ANIMACION_FIN', 'listo', 'Hay una consecuencia en presentación.', 'Mostrar la vista que corresponde a snapshot.fase. No enviar un comando de negocio.')) return;
    m.visualOro = m.client.oro; m.step = '4 · ANIMACION_FIN cambia solo la FSM del front. La pantalla siguiente aparece sin otro POST ni otro incremento.';
    m.log.push('UI → finaliza la representación. No cambia backend, mes ni versión.');
  }
  function drop(m) {
    if (!m.packet || m.packet.error || !transitionUI(m, 'TIMEOUT', 'resultado_incierto', 'Venció la espera sin confirmación recibida.', 'Conservar commandId y payload; ofrecer reintento.')) return;
    m.packet = null; m.step = 'TIMEOUT · El back ya guardó, pero el front no lo sabe. Entrar en resultado_incierto no revierte la partida.';
    m.log.push('RED → se perdió la respuesta después del commit. Se conserva la identidad del comando.');
  }
  function retry(m) {
    if (m.ui === 'resultado_incierto') transitionUI(m, 'REINTENTAR', 'enviando', 'Existe un comando pendiente con su identidad original.', 'Reenviar el mismo commandId, expectedVersion y payload.');
    process(m);
  }
  function reload(m) {
    if (!transitionUI(m, 'RECARGAR', 'cargando', 'Se solicita reconstruir la vista.', 'Consultar GET estado; no ejecutar comandos de juego.')) return;
    m.client = copy(m.server); m.visualOro = m.server.oro; m.pending = null; m.packet = null;
    transitionUI(m, 'ESTADO_RECUPERADO', 'listo', 'Snapshot actual recibido por GET.', 'Mapear snapshot.fase a una pantalla.');
    m.step = 'GET · cargando → listo. Se reconstruye la fase guardada, sin pasar por la transición de dominio ni ejecutar ECA.';
    m.log.push('GET estado → reconstruye la pantalla. No genera un turno ni ejecuta cartas.');
  }
  const model = Object.freeze({ create, send, process, receive, animate, reload, drop, retry, uiEdges, domainEdges });
  globalThis.CogniPatternDemo = model;
  if (typeof customElements === 'undefined') return;

  class PatronNarrativo extends HTMLElement {
    connectedCallback() {
      if (this.dataset.ready) return;
      this.dataset.ready = 'true';
      this.innerHTML = `<style>patron-narrativo{display:block;min-width:0}.np-controls{display:flex;flex-wrap:wrap;gap:12px;margin:20px 0}.np-controls label{font-size:12px}.np-controls select,.np-controls input{display:block;padding:8px;border:1px solid var(--line);border-radius:7px;color:var(--ink);background:var(--card);max-width:100%}.np-controls input{width:100px}.np-columns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.np-columns pre{font-size:12px;white-space:pre-wrap}.np-actions{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0}.np-actions button{font-size:12px}.np-log{max-height:300px;overflow:auto;font-size:13px;padding-left:24px}.np-log li{padding-bottom:8px;border-bottom:1px solid var(--line)}.np-status{font-weight:700;color:var(--accent)}@media(max-width:800px){.np-columns{grid-template-columns:1fr}}@media print{.np-controls,.np-actions{display:none}.np-log{max-height:none}}</style>
        <div class="note"><strong>Laboratorio explicativo local</strong>Estos botones simulan front, backend y red dentro del documento. No llaman APIs ni cambian partidas reales. El contrato y los estados son una propuesta, no endpoints ya implementados.</div>
        <div class="np-controls"><label>Ejemplo<select data-input="scenario">${Object.entries(cases).map(([id,c])=>`<option value="${id}">${c.name}</option>`).join('')}</select></label><label>Oro inicial<input data-input="oro" type="number" min="0" max="100" value="60"></label><label>Pueblo inicial<input data-input="pueblo" type="number" min="0" max="100" value="50"></label></div>
        <p data-view="explanation"></p><p class="small muted">Cambiar el ejemplo o sus valores reinicia la simulación. El mes y la fase son datos separados.</p>
        <div class="np-actions"><button data-action="send">1. Enviar intención</button><button data-action="process">2. Procesar en backend</button><button data-action="receive">3. Entregar respuesta</button><button data-action="animate">4. Terminar animación</button></div>
        <style>
          .np-machines{border:1px solid var(--line);border-radius:10px;overflow:hidden;margin:22px 0;background:var(--card)}
          .np-machine{padding:20px;min-width:0}.np-machine + .np-machine{border-top:1px solid var(--line)}
          .np-machine h4{margin:0 0 12px}.np-track{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:12px 0}
          .np-node{padding:9px 11px;border:1px dashed var(--muted);border-radius:7px;font:12px/1.5 Consolas,monospace;overflow-wrap:anywhere;background:var(--paper)}
          .np-node[aria-current="true"]{background:var(--accent);color:var(--card);border-style:solid;font-weight:700}
          .np-edge{font-size:11px;color:var(--muted);text-align:center;max-width:135px}
          .np-wire{padding:16px 20px;border-block:1px solid var(--line);background:var(--soft);font-size:14px}
          .np-transition{padding:12px;border-left:3px solid var(--accent);font-size:13px;background:var(--soft);overflow-wrap:anywhere}
          .np-transition dl{margin:8px 0 0;display:grid;grid-template-columns:80px minmax(0,1fr);gap:5px 12px}.np-transition dt{font-size:12px}.np-transition dd{margin:0;font-size:13px;color:var(--ink)}
          .np-runtime{font-size:13px;min-height:3em}.np-runtime strong{color:var(--accent)}
          .np-legend{font-size:12px;color:var(--muted)}.np-transitions td{font-size:12px;padding:10px}
          .np-transitions tr[data-active="true"] td{background:var(--soft)}
          .np-inspect[aria-pressed="true"]{border:2px solid var(--accent)}
          .np-sync{padding:18px;background:var(--soft);border-bottom:1px solid var(--line)}
          .np-sync-grid{display:grid;grid-template-columns:minmax(0,1fr) 40px minmax(0,1fr);gap:10px;align-items:center}
          .np-sync-grid p{margin:4px 0;font-size:12px;overflow-wrap:anywhere}.np-sync-grid b{display:block;font:600 14px/1.5 Consolas,monospace;overflow-wrap:anywhere}
          .np-sync-arrow{text-align:center;font-size:25px;color:var(--accent)}
          .np-sync [data-view="coordination"]{margin:15px 0 0;font-size:14px;line-height:1.6}
          @media print{.np-node[aria-current="true"]{outline:2px solid currentColor}}
        </style>
        <div class="np-machines" aria-label="Coordinación de las dos máquinas de estados">
          <div class="np-sync">
            <div class="np-sync-grid"><div><strong>Frontend</strong><b data-view="front-active"></b><p data-view="front-context"></p></div><div class="np-sync-arrow" aria-label="Mensajes HTTP entre front y back">⇄</div><div><strong>Backend</strong><b data-view="back-active"></b><p data-view="back-context"></p></div></div>
            <p data-view="coordination" role="status" aria-live="polite"></p>
          </div>
          <div class="np-machine">
            <h4>Front · FSM de presentación</h4>
            <p class="np-legend">El estado activo tiene fondo verde y el texto «activo». Cada flecha indica el evento que permite cambiar de estado.</p>
            <div class="np-track"><span class="np-node" data-ui-node="listo">listo</span><span class="np-edge">INTENCION →</span><span class="np-node" data-ui-node="enviando">enviando</span><span class="np-edge">HTTP_OK + efectos nuevos →</span><span class="np-node" data-ui-node="mostrando_consecuencias">mostrando_consecuencias</span></div>
            <p class="small">mostrando_consecuencias ── ANIMACION_FIN → listo. HTTP_OK sin efectos nuevos también vuelve a listo.</p>
            <div class="np-track"><span class="np-node" data-ui-node="resultado_incierto">resultado_incierto</span><span class="np-edge">REINTENTAR → enviando</span><span class="np-node" data-ui-node="error_recuperable">error_recuperable</span><span class="np-node" data-ui-node="reconciliando">reconciliando</span><span class="np-node" data-ui-node="cargando">cargando</span></div>
            <p class="small">Desde enviando: TIMEOUT → resultado_incierto; HTTP_RECHAZO → error_recuperable; HTTP_CONFLICTO → reconciliando. RECARGAR lleva a cargando y ESTADO_RECUPERADO vuelve a listo.</p>
            <p class="np-runtime" data-view="screen"></p>
            <div class="np-transition" data-view="front-transition"></div>
          </div>
          <div class="np-wire"><strong>Frontera HTTP · Command / Response</strong><p class="small" style="margin:6px 0 0">El clic genera un evento local. El servicio envía un comando. La respuesta HTTP se convierte en otro evento local. Cambiar una pantalla no envía automáticamente el siguiente comando.</p></div>
          <div class="np-machine">
            <h4>Back · FSM de dominio</h4>
            <div class="np-track" data-view="domain-graph"></div>
            <p class="np-runtime" data-view="domain-context"></p>
            <div class="np-transition" data-view="back-transition"></div>
          </div>
        </div>
        <details><summary>Tabla de transiciones de la FSM del front</summary><div><p>Una fila define origen + evento + guard + acción + destino. Si no existe una transición habilitada, el evento no cambia el estado. «Acción» aquí significa trabajo del front, como enviar HTTP; las acciones de recursos se ejecutan en el motor del back.</p><div class="tablewrap"><table class="np-transitions"><thead><tr><th>Origen</th><th>Evento y guard</th><th>Acción del front</th><th>Destino</th></tr></thead><tbody data-view="ui-table"></tbody></table></div></div></details>
        <div class="np-columns"><section class="card"><h3>Backend · datos guardados</h3><pre><code data-view="server"></code></pre><p data-view="applied"></p></section><section class="card"><h3>Frontend · copia y contador visual</h3><p class="np-status" data-view="ui"></p><pre><code data-view="client"></code></pre><p data-view="visual"></p></section></div>
        <div class="np-actions"><button data-action="drop">Perder respuesta</button><button data-action="retry">Reintentar mismo comando</button><button data-action="conflict">Simular otra pestaña</button><button data-action="reload">Recargar estado (GET)</button><button data-action="stale">Entregar respuesta vieja</button><button data-action="reset">Reiniciar ejemplo</button></div>
        <details open><summary>Qué probar y qué debería pasar</summary><div><ol><li>Enviar → procesar → entregar → terminar animación. El saldo real solo cambia al procesar en el backend.</li><li>Procesar → perder respuesta → reintentar → entregar. No se ejecuta otro efecto.</li><li>Enviar → simular otra pestaña → procesar → entregar. Se obtiene un conflicto; «Recargar estado» recupera la versión actual.</li><li>Después de aplicar una respuesta, entregar una vieja. El front conserva la versión nueva.</li><li>Probar el resultado neutral o bajar pueblo a 30: puede haber transición sin recompensa.</li></ol></div></details>
        <h3>Comando y respuesta</h3><div class="np-columns"><pre><code data-view="command"></code></pre><pre><code data-view="response"></code></pre></div>
        <h3>Traza de responsabilidades</h3><ol class="np-log" data-view="log"></ol>`;
      const field = name => this.querySelector(`[data-input="${name}"]`);
      this.reset = () => {
        const value = name => Math.max(0, Math.min(100, Math.trunc(Number(field(name).value) || 0)));
        this.state = create(field('scenario').value, value('oro'), value('pueblo')); this.render();
      };
      this.querySelectorAll('[data-input]').forEach(input => input.addEventListener('change', this.reset));
      this.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => {
        const m = this.state;
        switch (button.dataset.action) {
          case 'send': send(m); break;
          case 'process': process(m); break;
          case 'receive': receive(m); break;
          case 'animate': animate(m); break;
          case 'drop': drop(m); break;
          case 'retry': retry(m); break;
          case 'conflict': m.server.version++; m.log.push('OTRA PESTAÑA → confirmó una operación y elevó la versión del run.'); break;
          case 'reload': reload(m); break;
          case 'stale': receive(m, { snapshot: {...m.client, version: 7, oro: 1}, consecuencias: [] }); break;
          case 'reset': this.reset(); return;
        }
        this.render();
      }));
      this.reset();
    }
    render() {
      const m = this.state;
      const write = (key, text) => { this.querySelector(`[data-view="${key}"]`).textContent = text; };
      const json = value => JSON.stringify(value, null, 2);
      write('explanation', cases[m.scenario].explanation);
      write('server', json(m.server)); write('client', json(m.client)); write('ui', `UI: ${m.ui}`);
      write('applied', `Efectos de esta intención aplicados en backend: ${m.applied}. Recibos: ${Object.keys(m.receipts).length}.`);
      write('visual', `Oro del contador visual: ${m.visualOro}. Oro confirmado para reglas/compras: ${m.client.oro}.`);
      write('command', m.pending ? json(m.pending) : 'Todavía no se envió un comando.');
      write('response', m.packet ? json(m.packet) : 'No hay respuesta disponible para entregar.');
      write('coordination', m.step);
      write('front-active', m.ui); write('back-active', m.server.fase);
      write('front-context', `Snapshot: ${m.client.fase}, mes ${m.client.mes}, v${m.client.version}, oro ${m.client.oro}.`);
      write('back-context', `Persistido: mes ${m.server.mes}, v${m.server.version}, oro ${m.server.oro}.`);
      this.querySelectorAll('[data-ui-node]').forEach(node => {
        const active = node.dataset.uiNode === m.ui;
        node.setAttribute('aria-current', String(active));
        node.textContent = node.dataset.uiNode + (active ? ' · activo' : '');
      });
      const views = { BALANCE_MES: 'Balance mensual', DRAFT_MENSUAL: 'Elección de carta mensual', DECIDIR_EVENTO: 'Decisión de evento', RESULTADO_EVENTO: 'Resultado del evento', CONVERSACION: 'Conversación', RESULTADO_CONVERSACION: 'Resultado de conversación' };
      write('screen', `Vista de dominio confirmada: ${views[m.client.fase]}. ${m.ui === 'mostrando_consecuencias' ? 'Se presenta una consecuencia antes de habilitar esa vista.' : m.ui === 'listo' ? 'Interacción habilitada según comandos permitidos por el back.' : 'La interfaz mantiene la interacción de juego bloqueada mientras resuelve esta operación.'}`);
      write('domain-context', `Mes ${m.server.mes} · versión ${m.server.version}. El back no tiene un estado «animando»; guarda una fase de juego. ECA se ejecuta dentro del procesamiento del comando antes del commit.`);
      const graph = this.querySelector('[data-view="domain-graph"]');
      graph.replaceChildren();
      [cases[m.scenario].phase, cases[m.scenario].next].forEach((phase, index) => {
        if (index) { const edge=document.createElement('span');edge.className='np-edge';edge.textContent=cases[m.scenario].command+' [guards válidos] →';graph.append(edge); }
        const node=document.createElement('span');node.className='np-node';node.setAttribute('aria-current',String(phase===m.server.fase));node.textContent=phase+(phase===m.server.fase?' · activo':'');graph.append(node);
      });
      const describe = (key, transition, initial) => {
        const box=this.querySelector(`[data-view="${key}"]`);box.replaceChildren();
        if(!transition){box.textContent=initial;return;}
        const title=document.createElement('strong');title.textContent='Última transición evaluada';box.append(title);
        const dl=document.createElement('dl');
        for(const [label,value] of [['Origen',transition.from],['Evento',transition.event],['Guard',transition.guard],['Acción',transition.action],['Destino',transition.to]]){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;dl.append(dt,dd);}
        box.append(dl);
      };
      describe('front-transition',m.lastFront,'Sin eventos: el front está listo con un snapshot confirmado.');
      describe('back-transition',m.lastBack,'Sin comandos: el back conserva su fase y sus recursos.');
      const rows = [
        ['listo','INTENCION','Sin comando pendiente','Crear comando y enviar HTTP','enviando'],
        ['enviando','HTTP_OK','Versión válida y efectos nuevos','Sustituir snapshot; preparar animación','mostrando_consecuencias'],
        ['enviando','HTTP_OK','Sin efectos nuevos','Sustituir snapshot; mostrar vista','listo'],
        ['mostrando_consecuencias','ANIMACION_FIN','Presentación en curso','Mostrar vista de snapshot.fase; sin POST','listo'],
        ['enviando','TIMEOUT','Venció la espera','Conservar comando pendiente','resultado_incierto'],
        ['resultado_incierto','REINTENTAR','Misma identidad y payload','Reenviar comando','enviando'],
        ['enviando','HTTP_CONFLICTO','HTTP 409','Ofrecer recuperar estado','reconciliando'],
        ['enviando','HTTP_RECHAZO','HTTP 403 en este ejemplo','Explicar rechazo','error_recuperable'],
        ['cualquier estado salvo cargando','RECARGAR','Consultar partida actual','GET; sin efectos de cartas','cargando'],
        ['cargando','ESTADO_RECUPERADO','Respuesta de GET válida','Sustituir snapshot; reconstruir vista','listo'],
        ['listo / mostrando_consecuencias','HTTP_OK','Recibo repetido sin efectos nuevos','Conservar snapshot; no repetir animación','listo'],
      ];
      const table=this.querySelector('[data-view="ui-table"]');table.replaceChildren(...rows.map(([from,event,guard,action,to])=>{const tr=document.createElement('tr');tr.dataset.active=String(m.lastFront?.from===from&&m.lastFront?.event===event&&m.lastFront?.to===to);for(const value of [from,event+' · '+guard,action,to]){const td=document.createElement('td');td.textContent=value;tr.append(td);}return tr;}));
      const log = this.querySelector('[data-view="log"]'); log.replaceChildren(...m.log.map(text => { const li=document.createElement('li');li.textContent=text;return li; }));
      const disable = (action, value) => { this.querySelector(`[data-action="${action}"]`).disabled = value; };
      disable('send', Boolean(m.pending)); disable('process', !m.pending || Boolean(m.packet));
      disable('receive', !m.packet); disable('animate', m.ui !== 'mostrando_consecuencias');
      disable('drop', !m.packet || Boolean(m.packet.error) || m.ui !== 'enviando'); disable('retry', !m.pending || ['error_recuperable','reconciliando'].includes(m.ui));
      disable('conflict', !m.pending || Boolean(m.receipts[m.pending?.commandId]));
    }
  }
  customElements.define('patron-narrativo', PatronNarrativo);
})();
