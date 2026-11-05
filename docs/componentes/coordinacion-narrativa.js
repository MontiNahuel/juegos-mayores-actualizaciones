/* Gráfico didáctico: reutiliza el modelo del laboratorio, nunca llama APIs. */
(() => {
  'use strict';
  const stages = [
    ['Estado inicial', 'Ambos conocen BALANCE_MES, mes 2, versión 8 y oro 60. No hay ninguna petición en curso.'],
    ['Enviar Command', 'El clic genera INTENCION: listo → enviando. Sale AVANZAR_MES con commandId y expectedVersion=8; todavía no cambian los recursos.'],
    ['Validar en backend', 'El handler consulta el recibo y valida fase, versión y requisitos. Esta pausa representa trabajo del servidor, no una fase persistida nueva.'],
    ['Ejecutar ECA y guardar', 'El backend aplica cada_mes: oro 60 → 70. Confirma DRAFT_MENSUAL, mes 3, versión 9 y el recibo juntos. El front aún conserva versión 8.'],
    ['Entregar HTTP_OK', 'La respuesta lleva snapshot y consecuencias. HTTP_OK cambia enviando → mostrando_consecuencias: oro confirmado 70, contador visual todavía 60.'],
    ['Terminar presentación', 'ANIMACION_FIN cambia mostrando_consecuencias → listo. Se muestra el draft; el back conserva oro 70 y versión 9. No se envía otro POST.'],
    ['Esperar otra intención', 'La operación terminó. El siguiente comando será ELEGIR_CARTA_MENSUAL cuando el jugador elija. Estar en DRAFT_MENSUAL no genera otro mes.'],
  ];
  const paths = {
    request: 'M 285 220 C 395 220 405 133 515 133',
    response: 'M 515 411 C 405 411 395 381 285 381',
    domain: 'M 640 166 L 640 249 L 640 378',
    return: 'M 35 381 L 15 381 L 15 133 L 35 133',
  };
  function snapshotAt(step) {
    const api = globalThis.CogniPatternDemo;
    const state = api.create();
    if (step >= 1) api.send(state);
    if (step >= 3) api.process(state);
    if (step >= 4) api.receive(state);
    if (step >= 5) api.animate(state);
    return state;
  }
  class CoordinacionNarrativa extends HTMLElement {
    connectedCallback() {
      if (this.dataset.ready) return;
      this.dataset.ready = 'true';
      this.stage = 0; this.elapsed = 0; this.duration = 2400;
      this.running = false; this.auto = false; this.raf = null;
      this.motion = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.innerHTML = `
        <style>
          coordinacion-narrativa{display:block;margin:24px 0 36px;border:1px solid var(--line);border-radius:12px;background:var(--card);overflow:hidden}
          .ncg-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:16px 18px;border-bottom:1px solid var(--line)}
          .ncg-toolbar button{font-size:13px}.ncg-toolbar button:first-child{background:var(--accent);color:var(--card)}
          .ncg-count{font-size:12px;color:var(--muted);margin-left:auto}
          .ncg-viewport{overflow:auto}.ncg-svg{display:block;width:100%;min-width:620px;height:auto}
          .ncg-svg text{fill:var(--ink);font:14px 'Segoe UI',sans-serif}.ncg-svg .ncg-mono{font:12px Consolas,monospace}
          .ncg-svg .ncg-label{font-size:12px;fill:var(--muted)}.ncg-svg .ncg-heading{font-size:20px;font-weight:650}
          .ncg-lane{fill:var(--paper);stroke:var(--line)}.ncg-box{fill:var(--card);stroke:var(--line);stroke-width:1.5}
          .ncg-node[data-active="true"] .ncg-box{stroke:var(--accent);stroke-width:3;fill:var(--soft)}
          .ncg-node[data-node="engine"][data-active="true"] .ncg-box{stroke:var(--warn)}
          .ncg-state-dot{fill:var(--accent);opacity:0}.ncg-node[data-active="true"] .ncg-state-dot{opacity:1}
          .ncg-link{fill:none;stroke:var(--muted);stroke-width:1.5;opacity:.45}
          .ncg-link[data-active="true"]{stroke:var(--accent);stroke-width:3;opacity:1}
          .ncg-message{fill:#3b658d;stroke:var(--card);stroke-width:3}
          .ncg-marker{fill:var(--muted)}.ncg-footer{fill:var(--soft)}
          .ncg-caption{padding:0 20px 20px}.ncg-caption h4{margin:0 0 8px}.ncg-caption p{font-size:14px;margin:0}
          .ncg-stages{display:flex;gap:6px;flex-wrap:wrap;padding:0 20px 16px}
          .ncg-stages button{font-size:11px;min-height:36px;padding:6px 9px}.ncg-stages button[aria-current="step"]{background:var(--soft);border-color:var(--accent);font-weight:700}
          .ncg-progress{height:4px;background:var(--line)}.ncg-progress span{display:block;height:100%;background:var(--accent);width:0}
          @media(prefers-reduced-motion:reduce){.ncg-message{display:none}}
          @media print{.ncg-toolbar,.ncg-stages,.ncg-progress{display:none}.ncg-svg{min-width:0}}
        </style>
        <div class="ncg-toolbar">
          <button data-control="play">▶ Reproducir</button><button data-control="pause" disabled>Ⅱ Pausar</button>
          <button data-control="prev" disabled>← Paso anterior</button><button data-control="next">Paso siguiente →</button>
          <button data-control="reset">Reiniciar gráfico</button><span class="ncg-count" data-part="count"></span>
        </div>
        <div class="ncg-viewport" role="region" aria-label="Gráfico de coordinación, desplazable en pantallas pequeñas" tabindex="0">
          <svg class="ncg-svg" viewBox="0 0 800 520" role="img" aria-label="Dos máquinas de estados: front a la izquierda y back a la derecha, conectadas por comando y respuesta.">
            <defs><marker id="ncg-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="ncg-marker" d="M 0 0 L 10 5 L 0 10 z"/></marker></defs>
            <rect class="ncg-lane" x="25" y="30" width="270" height="420" rx="12"/><rect class="ncg-lane" x="505" y="30" width="270" height="420" rx="12"/>
            <text class="ncg-heading" x="45" y="61">Frontend</text><text class="ncg-label" x="45" y="82">FSM de presentación</text>
            <text class="ncg-heading" x="525" y="61">Backend</text><text class="ncg-label" x="525" y="82">FSM de dominio + motor ECA</text>
            <path class="ncg-link" data-link="send" d="M 160 166 L 160 187" marker-end="url(#ncg-arrow)"/>
            <path class="ncg-link" data-link="receive" d="M 160 253 L 160 348" marker-end="url(#ncg-arrow)"/>
            <text class="ncg-label" x="174" y="292">HTTP_OK</text><text class="ncg-label" x="174" y="310">+ efectos nuevos</text>
            <path class="ncg-link" data-link="return" d="${paths.return}" marker-end="url(#ncg-arrow)"/>
            <path class="ncg-link" data-link="domain" d="${paths.domain}" marker-end="url(#ncg-arrow)"/>
            <text class="ncg-label" x="650" y="202">guards válidos</text>
            <text class="ncg-label" x="650" y="345">commit</text>
            <path class="ncg-link" data-link="request" d="${paths.request}" marker-end="url(#ncg-arrow)"/>
            <text class="ncg-mono" x="323" y="113">Command →</text><text class="ncg-mono" x="310" y="135">AVANZAR_MES</text><text class="ncg-label" x="330" y="155">id + versión 8</text>
            <path class="ncg-link" data-link="response" d="${paths.response}" marker-end="url(#ncg-arrow)"/>
            <text class="ncg-mono" x="338" y="340">← Response</text><text class="ncg-label" x="315" y="359">snapshot + consecuencias</text>
            <g class="ncg-node" data-node="ready"><rect class="ncg-box" x="35" y="100" width="250" height="66" rx="8"/><circle class="ncg-state-dot" cx="266" cy="115" r="4"/><text x="50" y="125">listo</text><text class="ncg-mono" data-part="ready-phase" x="50" y="148"></text></g>
            <g class="ncg-node" data-node="sending"><rect class="ncg-box" x="35" y="187" width="250" height="66" rx="8"/><circle class="ncg-state-dot" cx="266" cy="202" r="4"/><text x="50" y="212">enviando</text><text class="ncg-mono" x="50" y="235">INTENCION / enviar HTTP</text></g>
            <g class="ncg-node" data-node="showing"><rect class="ncg-box" x="35" y="348" width="250" height="66" rx="8"/><circle class="ncg-state-dot" cx="266" cy="363" r="4"/><text class="ncg-mono" x="50" y="373">mostrando_consecuencias</text><text class="ncg-label" x="50" y="396">Animar 60 → 70; no volver a sumar</text></g>
            <text class="ncg-label" x="45" y="438">↖ ANIMACION_FIN: vuelve a listo</text>
            <g class="ncg-node" data-node="balance"><rect class="ncg-box" x="515" y="100" width="250" height="66" rx="8"/><circle class="ncg-state-dot" cx="746" cy="115" r="4"/><text class="ncg-mono" x="530" y="125">BALANCE_MES</text><text class="ncg-label" x="530" y="148">Fase persistida · mes 2 · v8</text></g>
            <g class="ncg-node" data-node="engine"><rect class="ncg-box" x="515" y="249" width="250" height="66" rx="8"/><circle class="ncg-state-dot" cx="746" cy="264" r="4"/><text x="530" y="274">cada_mes → oro +10</text><text class="ncg-label" x="530" y="297">Trabajo interno, no fase persistida</text></g>
            <g class="ncg-node" data-node="draft"><rect class="ncg-box" x="515" y="378" width="250" height="66" rx="8"/><circle class="ncg-state-dot" cx="746" cy="393" r="4"/><text class="ncg-mono" x="530" y="403">DRAFT_MENSUAL</text><text class="ncg-label" x="530" y="426">Fase persistida · mes 3 · v9</text></g>
            <circle class="ncg-message" data-part="token" r="7" visibility="hidden"/>
            <rect class="ncg-footer" x="25" y="465" width="750" height="45" rx="8"/>
            <text class="ncg-mono" data-part="front-summary" x="40" y="493"></text><text class="ncg-mono" data-part="back-summary" x="420" y="493"></text>
          </svg>
        </div>
        <div class="ncg-stages" aria-label="Elegir paso del gráfico">${stages.map(([name],i)=>`<button data-stage="${i}">${i+1}. ${name}</button>`).join('')}</div>
        <div class="ncg-caption"><h4 data-part="title"></h4><p data-part="description" role="status" aria-live="polite"></p><p class="small muted" style="margin-top:12px">Ejemplo local de éxito. Se usa el mismo modelo del laboratorio de abajo; no hay llamadas reales. El motor intermedio representa trabajo dentro de la transición del back.</p></div>
        <div class="ncg-progress" aria-hidden="true"><span data-part="progress"></span></div>`;
      this.querySelectorAll('[data-stage]').forEach(button => button.addEventListener('click', () => this.go(Number(button.dataset.stage))));
      this.querySelector('[data-control="play"]').addEventListener('click', () => {
        if (this.stage === stages.length - 1) { this.stage = 0;this.elapsed = 0; }
        this.auto = true; this.start();
      });
      this.querySelector('[data-control="pause"]').addEventListener('click', () => this.pause());
      this.querySelector('[data-control="prev"]').addEventListener('click', () => this.go(this.stage-1));
      this.querySelector('[data-control="next"]').addEventListener('click', () => this.go(this.stage+1));
      this.querySelector('[data-control="reset"]').addEventListener('click', () => { this.pause();this.stage=0;this.elapsed=0;this.render();this.drawToken(); });
      this.render();
    }
    disconnectedCallback() { this.pause(); }
    pause() {
      this.running = false; this.auto = false;
      if (this.raf !== null) cancelAnimationFrame(this.raf);
      this.raf = null; this.updateControls();
    }
    go(step) {
      this.pause(); this.stage = Math.max(0, Math.min(stages.length-1, step)); this.elapsed=0;
      this.auto=false; this.start();
    }
    start() {
      if (this.raf !== null) cancelAnimationFrame(this.raf);
      this.running=true; this.lastTime=null; this.render();
      this.raf=requestAnimationFrame(time=>this.frame(time));
    }
    frame(time) {
      if (!this.running) return;
      if (this.lastTime !== null) this.elapsed += Math.min(time-this.lastTime,100);
      this.lastTime=time;
      this.drawToken();
      if (this.elapsed >= this.duration) {
        if (this.auto && this.stage < stages.length-1) {
          this.stage++;this.elapsed=0;this.render();
        } else { this.pause();return; }
      }
      this.raf=requestAnimationFrame(next=>this.frame(next));
    }
    drawToken() {
      const route = ({1:'request',3:'domain',4:'response',5:'return'})[this.stage];
      const token=this.querySelector('[data-part="token"]');
      const progress=Math.min(1,this.elapsed/this.duration);
      this.querySelector('[data-part="progress"]').style.width=((this.stage+progress)/stages.length*100)+'%';
      token.setAttribute('visibility',route&&!this.motion.matches?'visible':'hidden');
      if (!route) return;
      const path=this.querySelector(`[data-link="${route}"]`);
      const point=path.getPointAtLength(path.getTotalLength()*progress);
      token.setAttribute('cx',point.x);token.setAttribute('cy',point.y);
    }
    updateControls() {
      this.querySelector('[data-control="pause"]').disabled=!this.running;
      this.querySelector('[data-control="play"]').disabled=this.running&&this.auto;
      this.querySelector('[data-control="prev"]').disabled=this.stage===0;
      this.querySelector('[data-control="next"]').disabled=this.stage===stages.length-1;
    }
    render() {
      const m=snapshotAt(this.stage);
      const text=(part,value)=>{this.querySelector(`[data-part="${part}"]`).textContent=value;};
      text('title',stages[this.stage][0]);text('description',stages[this.stage][1]);text('count',`Paso ${this.stage+1} de ${stages.length}`);
      text('ready-phase',this.stage>=5?'Vista: DRAFT_MENSUAL':'Vista: BALANCE_MES');
      text('front-summary',`Front: ${m.ui} · oro ${m.client.oro}`);
      text('back-summary',`Back: mes ${m.server.mes} · v${m.server.version} · oro ${m.server.oro}`);
      const active=[this.stage===0||this.stage>=5?'ready':this.stage===4?'showing':'sending',this.stage<3?'balance':'draft'];
      if(this.stage===3) active.push('engine');
      this.querySelectorAll('[data-node]').forEach(node=>node.dataset.active=String(active.includes(node.dataset.node)));
      const links=({1:['send','request'],2:['request'],3:['domain'],4:['response','receive'],5:['return']})[this.stage]||[];
      this.querySelectorAll('[data-link]').forEach(path=>path.dataset.active=String(links.includes(path.dataset.link)));
      this.querySelectorAll('[data-stage]').forEach(button=>{if(Number(button.dataset.stage)===this.stage)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
      this.updateControls();this.drawToken();
    }
  }
  customElements.define('coordinacion-narrativa',CoordinacionNarrativa);
})();
