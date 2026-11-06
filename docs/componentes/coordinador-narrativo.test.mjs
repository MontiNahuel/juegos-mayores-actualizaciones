import { test } from 'node:test';
import assert from 'node:assert/strict';
await import('./coordinador-narrativo.js');
const { adapt, project, initial, examples } = globalThis.CogniCoordinatorDemo;

test('un nodo intermedio conserva recursos y afinidad omitidos sin reinterpretar condiciones', () => {
  const { confirmed, needsSync } = adapt(initial, examples.intermediate.response, 'grafo');
  assert.deepEqual(confirmed.recursos, initial.recursos);
  assert.deepEqual(confirmed.afinidad, initial.afinidad);
  assert.equal(needsSync, false);
  const view = project(confirmed);
  assert.equal(view.screen, 'DecidirEventoEtapa2');
  assert.equal(view.options[1].disponible, false);
  assert.ok(view.options[1].motivo_bloqueo);
});
test('un resultado usa el saldo confirmado una vez y tiene prioridad sobre BALANCE_MES', () => {
  const { confirmed, needsSync } = adapt(initial, examples.result.response, 'grafo');
  assert.equal(confirmed.recursos.oro, 70);
  assert.equal(confirmed.afinidad.consejera_demo, 58);
  assert.equal(confirmed.fase_actual, 'BALANCE_MES');
  assert.equal(project(confirmed).screen, 'MostrarResultadoEtapa4 · resultado');
  assert.equal(needsSync, false);
  assert.equal(initial.recursos.oro, 60);
});
test('un desenlace con impactos pero sin saldo autoritativo requiere recuperar estado', () => {
  const { confirmed, needsSync } = adapt(initial, examples.incomplete.response, 'grafo');
  assert.equal(needsSync, true);
  assert.equal(confirmed.recursos.oro, 60);
});
test('un cambio de grafo pide reconciliacion y no decide descartar escenas pendientes', () => {
  const previous = adapt(initial, examples.intermediate.response, 'grafo').confirmed;
  const { needsSync, reason } = adapt(previous, examples.conversation.response, 'grafo');
  assert.equal(needsSync, true);
  assert.match(reason, /resultado previo/);
});
test('al confirmar draft se limpia el grafo viejo y una oferta vacia no inventa cartas', () => {
  const previous = adapt(initial, examples.intermediate.response, 'grafo').confirmed;
  const { confirmed } = adapt(previous, examples.draft.response, 'estado');
  assert.equal(confirmed.grafo_actual, null);
  assert.equal(confirmed.mes_actual, 3);
  assert.equal(project(confirmed).emptyDraft, false);
  assert.equal(project(confirmed).options.length, 3);
  const empty = adapt(initial, examples.emptyDraft.response, 'estado').confirmed;
  assert.equal(project(empty).emptyDraft, true);
  assert.match(project(confirmed).screen, /SeleccionarCartas/);
});
test('el back decide el final; cero es un valor confirmado y una fase desconocida no avanza', () => {
  const terminal = adapt(initial, examples.final.response, 'estado').confirmed;
  assert.equal(terminal.recursos.oro, 60);
  assert.match(project(terminal).screen, /finalización/);
  const zero = adapt(initial, { recursos: { oro: 0 } }, 'estado').confirmed;
  assert.equal(zero.recursos.oro, 0);
  const unknown = project({ ...initial, fase_actual: 'FASE_NUEVA_NO_MAPEADA' });
  assert.equal(unknown.unsupported, true);
  const conversation = adapt(initial, examples.conversation.response, 'grafo').confirmed;
  assert.equal(project(conversation).screen, 'ResponderConversacionEtapa3');
});
