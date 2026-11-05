import { test } from 'node:test';
import assert from 'node:assert/strict';
await import('./patron-narrativo.js');
const {create,send,process,receive,animate,reload,drop,retry}=globalThis.CogniPatternDemo;
test('un comando cambia backend una vez; recibir y animar no vuelven a sumar',()=>{
  const m=create();send(m);assert.equal(m.server.oro,60);process(m);assert.equal(m.server.oro,70);assert.equal(m.client.oro,60);
  receive(m);assert.equal(m.client.oro,70);assert.equal(m.visualOro,60);animate(m);assert.equal(m.visualOro,70);assert.equal(m.server.oro,70);
});
test('timeout después del commit y reintento conservan resultado y efectos',()=>{
  const m=create();send(m);process(m);m.packet=null;process(m);assert.equal(m.applied,1);assert.equal(m.server.version,9);receive(m);animate(m);
  process(m);receive(m);assert.equal(m.ui,'listo');assert.equal(m.applied,1);
});
test('conflicto no aplica efectos; GET solo recupera el snapshot',()=>{
  const m=create();send(m);m.server.version++;process(m);assert.equal(m.packet.error,409);assert.equal(m.applied,0);reload(m);assert.equal(m.client.version,9);assert.equal(m.server.oro,60);
});
test('secreto valida condición en backend',()=>{
  const denied=create('secreto');send(denied);process(denied);assert.equal(denied.packet.error,403);assert.equal(denied.server.version,8);
  const accepted=create('secreto',90);send(accepted);process(accepted);assert.equal(accepted.server.oro,70);
});
test('porcentaje, afinidad y resultado neutral tienen semántica distinta',()=>{
  for(const [scenario,key,value] of [['porcentaje','oro',51],['conversacion','afinidad',58],['neutral','oro',60]]){
    const m=create(scenario);send(m);process(m);receive(m);assert.equal(m.client[key],value);assert.equal(m.client.mes,2);
    if(scenario==='neutral'){assert.equal(m.applied,0);assert.equal(m.client.fase,'RESULTADO_EVENTO');}
  }
});
test('condición mensual, clamp y respuesta obsoleta',()=>{
  const m=create('arancel',60,30);send(m);process(m);assert.equal(m.server.oro,60);assert.equal(m.server.mes,3);
  const capped=create('arancel',95);send(capped);process(capped);receive(capped);assert.equal(capped.client.oro,100);assert.equal(capped.packet.consecuencias[0].deltaAplicado,5);
  receive(capped,{snapshot:{...capped.client,version:7,oro:1},consecuencias:[]});assert.equal(capped.client.oro,100);
});
test('las dos FSM avanzan en momentos distintos y ANIMACION_FIN no envía comandos',()=>{
  const m=create();send(m);
  assert.deepEqual([m.lastFront.from,m.lastFront.event,m.ui],['listo','INTENCION','enviando']);
  assert.equal(m.server.fase,'BALANCE_MES');
  process(m);
  assert.deepEqual([m.lastBack.from,m.lastBack.event,m.lastBack.to],['BALANCE_MES','AVANZAR_MES','DRAFT_MENSUAL']);
  assert.equal(m.client.fase,'BALANCE_MES');assert.equal(m.ui,'enviando');
  receive(m);assert.equal(m.lastFront.event,'HTTP_OK');assert.equal(m.ui,'mostrando_consecuencias');
  const confirmed=JSON.stringify(m.server);animate(m);
  assert.equal(m.lastFront.event,'ANIMACION_FIN');assert.equal(m.ui,'listo');
  assert.equal(JSON.stringify(m.server),confirmed);assert.equal(m.sequence,1);
});
test('TIMEOUT y REINTENTAR transicionan solo la FSM del front conservando el comando',()=>{
  const m=create();send(m);process(m);const identity=JSON.stringify(m.pending);
  drop(m);assert.equal(m.ui,'resultado_incierto');assert.equal(m.lastFront.event,'TIMEOUT');
  assert.equal(m.server.oro,70);assert.equal(m.client.oro,60);
  retry(m);assert.equal(m.ui,'enviando');assert.equal(m.lastFront.event,'REINTENTAR');
  assert.equal(JSON.stringify(m.pending),identity);assert.equal(m.applied,1);
  assert.equal(m.lastBack.from,m.lastBack.to);receive(m);assert.equal(m.client.oro,70);
});
test('FSM rechaza eventos fuera de estado y distingue conflicto de rechazo',()=>{
  const m=create();animate(m);assert.equal(m.ui,'listo');assert.equal(m.lastFront,null);
  m.ui='cargando';send(m);assert.equal(m.pending,null);
  const conflict=create();send(conflict);conflict.server.version++;process(conflict);receive(conflict);
  assert.equal(conflict.ui,'reconciliando');assert.equal(conflict.lastFront.event,'HTTP_CONFLICTO');
  reload(conflict);assert.equal(conflict.lastFront.from,'cargando');assert.equal(conflict.lastFront.event,'ESTADO_RECUPERADO');assert.equal(conflict.server.oro,60);
  const denied=create('secreto');send(denied);process(denied);receive(denied);
  assert.equal(denied.ui,'error_recuperable');assert.equal(denied.lastFront.event,'HTTP_RECHAZO');
  assert.equal(denied.lastBack.from,denied.lastBack.to);
});
test('la tabla del dominio impide ejecutar un comando en una fase incompatible',()=>{
  const m=create();send(m);m.pending.type='RESPONDER_CONVERSACION';process(m);
  assert.equal(m.packet.error,409);assert.equal(m.server.version,8);assert.equal(m.applied,0);
});
