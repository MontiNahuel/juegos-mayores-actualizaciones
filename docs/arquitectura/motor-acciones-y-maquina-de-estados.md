# Motor de acciones autoritativo y máquina de estados de presentación

> Actualización del 6/11/2026: este documento conserva el diseño inicial. Para el contrato real de acciones referenciadas y el front coordinador, usar [King’s Court: front coordinador sobre el contrato V2](coordinador-frontend-contrato-v2.md). Los commandId, versiones de run y endpoints v3 de aquí son propuestas; no están publicados como tales en el OpenAPI consultado.


Estado: propuesta de implementación, no descripción de una migración ya realizada.
Fecha: 5 de noviembre de 2026.
Destino: agente que implemente los cambios en frontend y backend de Cognijuegos.

## 1. Mandato, alcance y precedencia

Implementar un motor de acciones de dominio en el backend y una máquina de estados de presentación en el frontend. El cliente envía intenciones; el servidor valida, calcula, guarda y responde; el cliente presenta la respuesta sin volver a ejecutar sus consecuencias de negocio.

**Orden obligatorio: cambios necesarios > código y funcionamiento actual > GDD.** El GDD es contexto de producto, no una especificación que deba restaurarse literalmente. Conservar el comportamiento actual salvo que un cambio sea necesario para corregir una divergencia, cumplir el nuevo contrato o resolver una decisión de producto explícita. Registrar esas decisiones.

Este documento autoriza diseñar la migración del flujo narrativo. No autoriza cambiar sin evaluación el balance, las probabilidades, las cantidades de cartas, la adaptación por edad o la economía de los clásicos. Tampoco exige reescribir todo el proyecto, migrar Python a TypeScript, introducir microservicios ni adoptar una librería de estados específica.

## 2. Fuentes y distinción entre evidencia y propuesta

Se leyó el ZIP `f4843d98-f68b-4a51-8215-e4d607cb0514_ExportBlock-d2069a98-736e-4f01-ad57-86fc8a064769.zip`: contiene `Frame Narrativo 3f2516e6018e8097a0afe3531fb2eacb.html` y ocho imágenes. Los dibujos muestran corte, cartas, evento, resultado, conversación, respuesta y otro resultado.

El GDD aporta contexto: desafíos diarios, personajes con beneficios y condiciones, cartas de tipo item/bonus/personaje, eventos editables, alternativas secretas, resultados independientes y conversaciones con requisitos. Menciona doce etapas de un año y un pool de veinte eventos: eso no significa veinte turnos. Describe tres cartas por ciclo y una respuesta visible incluso sin impacto.

El código revisado selecciona tres personajes y tres cartas iniciales, pero una carta mensual; el modo adaptado puede omitir esa elección visible. No cambiar esas cantidades por la lectura del GDD. El respaldo local de seis meses tampoco es la definición del largo de una partida remota.

Referencias técnicas de la revisión anterior:

- Frontend de referencia `0f12188`; el agente debe revisar el HEAD real antes de editar.
- Backend analizado `Facundo-Bernard/mayores_actualizacionesSIPI-BACK@33cdf8f`.
- Ese backend no registra narrativa en `app/main.py`, aunque contiene sus servicios. **Identificar el backend que realmente atiende la web antes de implementar.** No asumir que el repositorio analizado y el servidor desplegado son idénticos.
- La UI soporta un contrato de grafos que no está implementado en ese corte del backend. No inventar compatibilidad ni degradarlo silenciosamente a fases.

Los nombres de comandos y el endpoint de este documento son **propuestos**. Las cartas de ejemplo reutilizan mecanismos y nombres observados, pero sus payloads son fixtures didácticos; no certifican el catálogo real de producción.

## 3. Técnica y patrones que se combinan

1. **Backend autoritativo:** decide el estado válido y persistido de la partida.
2. **Command, patrón de comportamiento:** separa la solicitud de su ejecución mediante un objeto que representa la intención. Aquí se adapta como mensaje serializable y command handler remoto: `ELEGIR_CARTA_MENSUAL` o `AVANZAR_MES`, nunca cambios arbitrarios enviados por el jugador. No basta con dar nombre a una función: el mensaje y su ejecutor están separados.
3. **Finite State Machine (FSM), modelo de comportamiento:** estados finitos y transiciones definidas por evento, con guards y acciones. La de dominio determina qué comando es válido en cada fase. La de presentación reacciona a eventos locales y respuestas HTTP.
4. **Motor ECA:** selecciona efectos por evento/disparador, evalúa condiciones y ejecuta acciones conocidas.
5. **Funciones de dominio puras:** calculan un resultado a partir de estado, comando, contenido y azar explícito. No hacen HTTP, no acceden a Redux y no escriben MongoDB.
6. **Puertos y adaptadores:** HTTP, persistencia, catálogo y azar rodean el dominio. React consume una proyección, no es el motor de reglas.
7. **Idempotencia y control de concurrencia:** un reintento no vuelve a ejecutar el comando; una pestaña obsoleta no pisa otra decisión.
8. **Máquina de presentación:** coordina envío, espera, error, animación y pantalla visible. Las consecuencias recibidas son información para representar, no una orden de recalcular el dominio.

No se requiere event sourcing completo. Un estado persistido, recibos de comandos y un historial de consecuencias son suficientes para comenzar. Las consecuencias documentadas aquí no implican un bus distribuido.

Los nombres no son intercambiables. **State (GoF)** es un patrón que delega comportamiento a objetos que representan estados; es una implementación posible de comportamiento dependiente del estado. Una FSM con tablas y funciones no exige implementar State de GoF. **Hexagonal Architecture / Ports and Adapters** es el nombre del patrón arquitectónico de separación. **ECA** es el modelo de reglas declarativas; backend autoritativo, idempotencia y **Optimistic Concurrency Control** son decisiones y técnicas complementarias. Una FSM por sí sola no aporta recibos ni atomicidad.

## 4. Tres conceptos que no deben confundirse

| Concepto | Ejemplo | Quién lo origina y ejecuta |
| --- | --- | --- |
| Comando del jugador | `AVANZAR_MES` | El front lo solicita; el servidor valida y procesa. |
| Disparador interno del dominio | `cada_mes` | El motor lo activa en el límite de turno definido. No lo ordena arbitrariamente el cliente. |
| Acción de negocio | sumar 10 de oro, otorgar un tag | La ejecuta el motor del backend. |
| Consecuencia confirmada | oro pasó de 60 a 70 por una carta | El backend la devuelve; se conserva para explicar y auditar. |
| Acción visual | animar 60 → 70, resaltar carta | La ejecuta el frontend sin modificar el estado de dominio. |

También separar `turno`/`mes`, `fase` y `uiState`. Estar en el mes 3 no implica estar en la fase 3. Una animación que termina no significa que el servidor haya avanzado un turno.

## 5. Distribución concreta de responsabilidades

### Backend

- Derivar identidad del contexto autenticado y verificar propiedad de la partida.
- Cargar el estado y las versiones de contenido/reglas asociadas al run.
- Validar fase, versión esperada, oferta de cartas, opción y condiciones.
- Elegir eventos y desenlaces con su política de azar.
- Aplicar reglas de edad/dificultad que cambien efectos, no solo tamaño de texto.
- Ejecutar acciones de recursos, afinidad, inventario y tags soportadas.
- Comprobar límites y finalización en los puntos establecidos.
- Persistir de manera consistente estado, historial y recibo del comando.
- Devolver una proyección completa para reanudar, las opciones permitidas y las consecuencias confirmadas.

### Frontend

- Mostrar la proyección del servidor y enviar intenciones tipadas.
- Conservar temporalmente selección, frase actual, carga de imágenes y animación.
- Bloquear interacciones mientras haya un comando incompatible en curso.
- Reintentar con el mismo identificador y payload cuando la respuesta sea incierta.
- Aplicar instantáneas por versión; descartar respuestas viejas.
- Representar consecuencias sin volver a sumar sus deltas al snapshot.
- Recuperar el estado por GET al recargar o reconciliar un conflicto.

El front puede deshabilitar una opción por UX, pero el servidor debe validarla igualmente. No aceptar del navegador `oro_final`, `efectos_aplicados` o una carta no ofrecida como verdad persistible.

## 6. Modelo de dominio y contrato mínimo propuesto

Un run debe identificar al menos:

```ts
type RunSnapshot = {
  runId: string;
  schemaVersion: number;
  rulesVersion: string;
  contentVersion: string;
  version: number;
  mes: number;
  fase: string;
  status: 'in_progress' | 'completed' | 'failed';
  recursos: Record<string, number>;
  afinidad: Record<string, number>;
  inventario: string[]; // IDs de instancias, si se admiten copias
  corte: string[];
  tags: string[];
  contenidoActual: unknown; // Unión discriminada definida en OpenAPI
  comandosPermitidos: string[];
};
```

No convertir `unknown` en contrato final: definir DTOs discriminados para draft, evento, conversación, resultado y final. Nunca enviar secretos completos, semillas explotables ni información de contenido futuro que no deba ver el jugador. Si el editor cambia una carta, un run activo debe conservar la versión acordada; no cambiar reglas retroactivamente por accidente.

Ejemplo de comando HTTP, dentro de un contrato versionado:

```http
POST /api/narrative/v3/runs/run-123/commands
Authorization: Bearer ...
Content-Type: application/json
```

```json
{
  "commandId": "uuid-generado-una-vez",
  "expectedVersion": 8,
  "type": "AVANZAR_MES",
  "payload": {}
}
```

Ese endpoint todavía no existe por este documento. Puede implementarse como fachada de los endpoints actuales. Lo importante es la semántica común de comando, no concentrar a la fuerza todo en una URL.

Respuesta de una carta mensual de +10 oro, partiendo de oro=60:

```json
{
  "commandId": "uuid-generado-una-vez",
  "snapshot": {
    "runId": "run-123", "schemaVersion": 1,
    "rulesVersion": "kc-1", "contentVersion": "daily-2026-11-05-1",
    "version": 9, "mes": 3, "fase": "DRAFT_MENSUAL", "status": "in_progress",
    "recursos": {"oro": 70, "pueblo": 50, "ejercito": 50, "fe": 50},
    "afinidad": {}, "inventario": ["instancia-arancel-1"], "corte": [], "tags": [],
    "contenidoActual": {"tipo": "draft", "cartasOfrecidas": ["a", "b", "c"], "cantidadAElegir": 1},
    "comandosPermitidos": ["ELEGIR_CARTA_MENSUAL"]
  },
  "consecuencias": [
    {"id": "run-123:cmd-1:0", "origen": "instancia-arancel-1", "atributo": "oro",
     "antes": 60, "deltaSolicitado": 10, "deltaAplicado": 10, "despues": 70}
  ],
  "presentacion": {"titulo": "Balance mensual", "texto": "El arancel aportó reservas al reino."}
}
```

El front sustituye el estado confirmado por `snapshot`. Puede mostrar visualmente `antes` y animarlo hasta `despues`; no hace `snapshot.oro += deltaAplicado`. El saldo para comprar y validar acciones ya es 70 aunque el contador todavía esté animándose.

## 7. Acciones declarativas y semántica exacta

Reutilizar el motor Python existente si sirve en el backend real. Empezar con un catálogo pequeño y validado:

| Acción | Semántica a especificar |
| --- | --- |
| `modificar_recurso` | Recurso conocido; cálculo fijo/porcentual; base de porcentaje, redondeo y límites explícitos. |
| `modificar_afinidad` | Personaje válido; política de personaje ausente y límites. |
| `otorgar_tag` / `quitar_tag` | Operaciones de conjunto; quitar uno ausente es no-op documentado. |
| `agregar_carta` / `quitar_carta` | Identidad de instancia, duplicados, orden y efectos de adquisición. |
| `modificar_peso_evento` | Cambio de peso de selección, distinto de porcentaje de recurso; duración y normalización explícitas. |

Los tipos adicionales son propuestas, no capacidades actuales garantizadas. Un tipo, disparador, atributo u operador desconocido debe rechazarse al publicar contenido y fallar de forma controlada si llega al runtime. No ignorarlo ni considerarlo cumplido silenciosamente. El contenido debe ser datos validados: no ejecutar JavaScript o Python arbitrario enviado por el administrador.

Una carta similar al arancel observado puede expresarse con el esquema ECA existente:

```json
{
  "id": "arancel_demo",
  "efectos": [{
    "disparador": "cada_mes",
    "condiciones": [{"tipo": "comparar_recurso", "clave": "pueblo", "operador": ">=", "valor": 40}],
    "accion": {"tipo": "modificar_recurso", "clave": "oro", "tipo_calculo": "fijo", "valor": 10}
  }]
}
```

Definir el orden de aplicación. Propuesta inicial: prioridad explícita y desempate estable por instancia/efecto; cada efecto lee el estado de trabajo resultante del anterior. Un porcentaje posterior puede usar una base distinta. Si se prefiere evaluar todo contra una foto inicial, documentarlo y versionarlo. Prohibir ciclos ilimitados de adquisición/efectos; limitar encadenamientos y rechazar el contenido que los produzca.

Con oro=95 y máximo=100, +10 solicita 10 pero aplica 5. Con oro=60, −15% produce 51 si la política es redondear el resultado al entero más cercano. No confundir +20% sobre un atributo con +20 puntos porcentuales de probabilidad o un multiplicador de peso.

## 8. Máquina de dominio y resultados que se pueden reanudar

Conservar el recorrido actual donde sea compatible. Un mapa canónico posible:

| Fase persistida | Comando permitido | Trabajo del servidor y siguiente fase |
| --- | --- | --- |
| `SETUP` | `INICIAR_PARTIDA` | Validar corte/cartas, ejecutar adquisiciones una vez; preparar draft o evento según política actual. |
| `DRAFT_MENSUAL` | `ELEGIR_CARTA_MENSUAL` | Validar oferta/cantidad, obtener cartas, evaluar final y preparar evento. |
| `DECIDIR_EVENTO` | `DECIDIR_EVENTO` | Validar opción/condición, resolver azar y efectos, persistir resultado pendiente de lectura. |
| `RESULTADO_EVENTO` | `CONTINUAR_RESULTADO` | Dar por leído el resultado; abrir la siguiente escena pendiente sin reaplicar efectos. |
| `CONVERSACION` | `RESPONDER_CONVERSACION` | Validar participantes, decisión y requisitos; aplicar consecuencias y persistir su resultado. |
| `RESULTADO_CONVERSACION` | `CONTINUAR_RESULTADO` | Reconocer la lectura y habilitar balance. |
| `BALANCE_MES` | `AVANZAR_MES` | Ejecutar el límite mensual acordado, evaluar final y preparar el siguiente turno. |
| `FINALIZADA` | Lecturas | No aceptar nuevas acciones de juego. Reiniciar debe ser una operación explícita y autorizada. |

Es una propuesta de nombres, no una orden de renombrar todos los enums inmediatamente. El mapper puede traducir los actuales. Si el producto necesita un evento incidental independiente, modelarlo como escena/cola persistida; no introducirlo implícitamente por una bandera de React. El GDD lo menciona, pero no obliga a cambiar el flujo vigente sin decisión de producto.

No confundir confirmar un resultado leído con volver a calcularlo. Recargar en `RESULTADO_EVENTO` debe recuperar el mismo resultado y recursos, sin repetir efectos ni perder la conversación pendiente. Una consecuencia vacía puede ser un resultado válido; mantener la pantalla neutral conforme al comportamiento acordado, sin inventar cambios para justificarla.

El límite mensual necesita una decisión explícita: el backend revisado guarda el balance del mes, avanza y aplica `cada_mes` al entrar al siguiente mes no final. Preservar esa política inicialmente si sigue vigente; no curar otra vez al recargar ni aplicar un turno 13 al cerrar el año. Un juego con otro orden debe usar una política versionada y pruebas propias. La carta de «+10 vida» de la conversación previa es un ejemplo genérico: `vida` no es uno de los cuatro recursos actuales de King’s Court.

## 9. Máquina de presentación del frontend

Leer cada transición como `origen + evento [guard] / acciones → destino`. Un guard comprueba sin efectos si se permite la transición; las acciones realizan el trabajo autorizado. El contexto contiene datos como snapshot, comando pendiente y cursor visual. Un evento no admitido en el estado actual no debe provocar una transición.

```text
cargando → listo(fase confirmada)
listo + intención → enviando(commandId)
enviando + respuesta válida → mostrando_consecuencias → listo(fase confirmada)
enviando + timeout → resultado_incierto → reintentar MISMO comando / consultar
enviando + conflicto → reconciliando → listo(snapshot actual)
enviando + rechazo → error_recuperable → listo(sin cambios de dominio)
```

La máquina conoce qué pantalla corresponde a la fase, cuándo permitir interacción y cuándo mostrar mensajes. No busca cartas activas para curar o cobrar, no sortea el evento real y no recalcula porcentajes. Cargar imágenes o mostrar una pantalla no debe emitir automáticamente un comando de negocio desde un `useEffect` que pueda repetirse por StrictMode.

La frontera entre ambas máquinas es explícita:

| Paso | FSM del front | Transporte | FSM del back y datos |
| --- | --- | --- | --- |
| Inicio | listo; snapshot v8, BALANCE_MES | — | BALANCE_MES, v8, oro=60 |
| Clic | INTENCION: listo → enviando | POST de AVANZAR_MES, commandId y expectedVersion=8 | Todavía sin cambios |
| Procesar | Sigue enviando con snapshot v8 | Respuesta aún sin entregar | Valida, aplica cada_mes y confirma DRAFT_MENSUAL, v9, oro=70 |
| Recibir | HTTP_OK: enviando → mostrando_consecuencias; sustituye snapshot por v9 | Respuesta convertida en evento local | Conserva el resultado ya guardado |
| Animar | ANIMACION_FIN: mostrando_consecuencias → listo; muestra draft | No hay POST adicional | Sin cambios |

En la aplicación real el servicio HTTP entrega automáticamente la respuesta a la FSM; el laboratorio permite pausar esa entrega para explicar el orden. La fase de dominio y el estado de presentación pueden cambiar en instantes distintos. El siguiente comando de juego lo origina la siguiente intención del jugador: recibir DRAFT_MENSUAL no vuelve a emitir AVANZAR_MES.

Mantener separados `confirmedSnapshot` y un cursor visual de animación. Guardar el comando pendiente mientras se espera; si se persiste para recuperarlo, aislarlo por cuenta/run y limpiarlo al cerrar sesión. Reintentar o consultar tras remontaje, en vez de generar un comando nuevo a ciegas.

Una respuesta con versión menor que la aplicada se ignora en la UI. Un recibo idempotente puede contener una instantánea histórica: no hacer retroceder el cliente por mostrarlo. Un mismo `consecuencia.id` no debe disparar otra vez la misma animación durante la sesión. Saltar animaciones debe conservar el mismo estado de dominio.

## 10. Idempotencia, concurrencia, azar y persistencia

Procesamiento propuesto:

```text
autenticar y autorizar usuario/run
buscar recibo de (runId, commandId)
  mismo payload: devolver resultado guardado sin recalcular
  distinto payload: rechazar reutilización de clave
validar expectedVersion y fase actual
cargar contenido/reglas fijados al run
resolver en memoria con RNG inyectado
guardar estado, consecuencias y recibo de forma atómica
responder el recibo confirmado
```

Buscar el recibo antes de rechazar la versión: un reintento correcto conserva la versión original. La identidad de idempotencia incluye cuenta/run; el hash del payload incluye tipo, versión esperada y selección. Dos comandos diferentes con la misma versión esperada compiten: solo uno confirma, el otro recibe conflicto y consulta el estado actual.

En MongoDB usar una transacción cuando estado y recibo estén en documentos distintos, con los índices únicos necesarios, o un diseño de actualización atómica de documento que conserve esas garantías. Verificar soporte de transacciones en el despliegue. No escribir primero estado y luego recibo sin una estrategia de recuperación: un corte entre ambas operaciones permitiría efectos duplicados.

El azar se calcula una vez por comando confirmado y se registra su desenlace. Un reintento nunca hace otra tirada. Una ejecución concurrente que pierde la actualización puede haber calculado un candidato, pero no puede publicarlo ni persistirlo como ganador. Las consecuencias externas futuras requieren outbox u otro mecanismo de entrega deduplicada; no prometer entrega «exactamente una vez» en una red.

Errores propuestos: 401 sin autenticación, 403 sin permiso/condición, 404 run inexistente, 409 versión/fase/clave reutilizada en conflicto, 422 payload o acción no admitidos. Adaptar al estándar del proyecto, manteniendo códigos de dominio legibles. Una caída después de guardar y antes de responder deja un resultado incierto para el front: reintentar la misma operación devuelve su recibo.

## 11. Ejemplos de aceptación basados en King’s Court

1. **Arancel mensual:** oro=60, pueblo=50, `cada_mes` +10. Cerrar mes 2 produce mes 3, oro=70 y una consecuencia; repetir commandId no produce oro=80. Con pueblo=30, no hay +10, pero la transición puede completarse.
2. **Resultado porcentual:** oro=60, efecto −15%. El backend devuelve oro=51 y delta aplicado −9. React anima 60 → 51 sin descontar otros 9 al snapshot.
3. **Opción secreta:** requiere oro≥80. Con oro=60, un POST forzado se rechaza aunque el botón se haya mostrado por error; no avanza fase ni se consumen recursos.
4. **Conversación:** elegir una respuesta da +8 afinidad a un personaje válido. La afinidad de 50 pasa a 58 una vez; una respuesta repetida no produce 66. El cliente reemplaza con la afinidad confirmada.
5. **Resultado neutral:** la respuesta puede tener consecuencias vacías y un texto de resultado. Se presenta y se puede continuar sin inventar un delta.
6. **Dos pestañas:** ambas ven versión 8. La primera confirma versión 9; la segunda no puede ejecutar un comando distinto sobre la 8. Consulta y reconstruye su pantalla.
7. **Edad adaptada:** conservar la presentación actual; decidir y versionar la regla que atenúa pérdidas. Si está vigente, el motor la aplica una vez. No reducir en Python y otra vez en Redux.
8. **Último mes:** se aplica la política de cierre acordada y se persiste la finalización. Reabrir estadísticas no ejecuta pasivos ni cartas finales otra vez.

## 12. Diferencias actuales que la migración debe abordar

| Archivo/camino | Situación revisada | Cambio esperado |
| --- | --- | --- |
| `src/store/narrativoSelectionSlice.ts` | Ejecuta adquisición, deltas de resultado y afinidad local; condiciones incompletas. | Reemplazar esos cálculos en partidas remotas por reconciliación de snapshots; conservar solo selección/presentación local necesaria. |
| `KingsCourt.tsx` | Mezcla coordinación, avance optimista, resultado y sincronización. | Enviar comandos y presentar estados; evitar adelantar el mes local antes de confirmar. |
| `narrativeService.ts` | Múltiples endpoints y adaptación de grafos; no usa recibos/versiones del contrato propuesto. | Incorporar transporte tipado y reconciliación; puede conservar una fachada de funciones actuales. |
| `narrativeFallback.ts` | Demo de seis meses sin paridad completa ni sincronización posterior. | Mantener como demo identificada o diseñar explícitamente un motor local equivalente. No subir un snapshot del navegador como si fuera estado remoto validado. |
| `rule_engine.py` | Ya implementa parte de ECA. | Completar catálogo admitido, validación, orden, condiciones estrictas y pruebas; evitar otro motor en paralelo. |
| Servicios setup/turn/transition | Ejecutan reglas y cambian fases. | Reutilizarlos o extraer casos de uso con comando, versión e idempotencia común. |
| `app/main.py` del backend analizado | No incluye narrativa. | Confirmar servidor real y registrar/verificar routers antes de pruebas integrales. |

No implementar todas las acciones que aparezcan en enums o editores por su nombre. Inventariar cuáles existen y migrar contenido con diagnósticos explícitos. En la revisión se encontraron `cada_mes` solo remoto, porcentajes diferentes, condiciones locales omitidas y habilidades declaradas sin ejecución.

## 13. Plan incremental para el agente

1. Identificar repositorios/HEAD y backend desplegado. Leer este documento y los archivos anteriores; producir un inventario de decisiones pendientes sin tocar reglas de producto.
2. Acordar DTOs, fases canónicas, política de turno, cantidades y versiones. Documentar cada diferencia entre comportamiento vigente y cambio necesario. Publicar OpenAPI y generar/validar tipos TypeScript.
3. Implementar una sección vertical pequeña: `AVANZAR_MES` con el arancel de ejemplo, límites, recibo e idempotencia. Probar contra la aplicación HTTP real con base de pruebas.
4. Conectar esa operación a la UI usando snapshots y consecuencias; quitar solo el cálculo local que haya sido sustituido. Verificar que recarga, error y animación no repiten efectos.
5. Migrar adquisición, decisión y conversación con el mismo patrón. Preservar grafos existentes donde funcionen; no romperlos por adoptar una tabla de fases más simple.
6. Versionar contenido y validar el editor. Rechazar tipos no ejecutables y migrar cartas existentes antes de activar reglas nuevas.
7. Resolver explícitamente demo/offline y adaptación. Probar transición de versiones y reanudación de runs anteriores.
8. Desplegar con observabilidad y una migración controlada por versión de run. No mezclar motor viejo y nuevo dentro de la misma partida.

## 14. Verificación y criterio de terminado

- Tests puros de cada acción/condición, porcentajes, redondeo, límites, orden, tags e instancias duplicadas.
- Tests de todas las transiciones válidas y rechazos, incluyendo opciones secretas forzadas y comandos en fase equivocada.
- Integración HTTP+persistencia: doble comando concurrente, clave reutilizada con otro payload, timeout tras commit y rollback ante fallo de escritura.
- Tests de RNG inyectado: reintentos conservan el desenlace; no se vuelve a sortear un resultado confirmado.
- Frontend: StrictMode, cierre, recarga, respuesta vieja, doble clic, error, cancelación visual y movimiento reducido; ningún callback de animación cambia recursos persistidos.
- E2E de corte → cartas → evento → resultado → conversación opcional → balance → restauración y final. Incluir un resultado sin efectos.
- Auditar por runId/commandId/version, IDs de contenido y reglas; registrar consecuencia solicitada y aplicada. Evitar tokens y datos personales en logs.

Terminado significa: existe una única autoridad de reglas en la partida remota; todos los caminos devuelven estado reanudable; no hay efectos dobles ante reintentos; las capacidades del editor corresponden a acciones soportadas; se conservaron las reglas vigentes salvo decisiones documentadas; la demo se distingue de la partida persistida; el HTML explicativo no se confunde con implementación del motor real.

### Laboratorio de documentación

El capítulo «Patrones de diseño» de `arquitectura-cognijuegos.html#patrones` carga `docs/componentes/patron-narrativo.js`. Simula cinco escenarios: arancel mensual, porcentaje, opción secreta, afinidad y resultado neutral. Permite separar envío/proceso/entrega/presentación, perder una respuesta, reintentar el mismo comando, provocar un conflicto y recibir una respuesta vieja.

Es un modelo didáctico en memoria, con IDs y reglas de ejemplo, sin llamadas de red. No implementa autenticación, validación completa de payloads, azar ni transacciones reales. No copiar su almacenamiento de recibos a producción: aplicar las garantías de las secciones anteriores.

Verificación reproducible del laboratorio:

```sh
node --check docs/componentes/patron-narrativo.js
node --test docs/componentes/patron-narrativo.test.mjs
```

Las diez pruebas comprueban escenarios, fallos y transiciones de ambas FSM; no certifican la integración del juego real.

## 15. Resumen transferible

Implementar **comandos validados e idempotentes + motor ECA y máquina de dominio en backend + snapshots y consecuencias + máquina de presentación en frontend**. Reutilizar el código útil actual, resolver divergencias por versiones y mantener el GDD como contexto subordinado a cambios necesarios y comportamiento real. La entrada a una pantalla puede cargar assets; no debe curar, cobrar o generar de nuevo un turno ya confirmado.

Referencias de patrones: [puertos y adaptadores](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/hexagonal-architecture.html), [máquinas y guards](https://stately.ai/docs/guards), [OpenAPI y clientes](https://fastapi.tiangolo.com/advanced/generate-clients/). Estas referencias explican las técnicas; las decisiones concretas anteriores son la propuesta para Cognijuegos.
