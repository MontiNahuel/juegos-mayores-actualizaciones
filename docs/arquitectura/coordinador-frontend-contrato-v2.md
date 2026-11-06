# King’s Court: front coordinador sobre el contrato V2

Revisión: 6 de noviembre de 2026. Estado: propuesta de refactor del frontend; no migración de juego implementada.

## 1. Fuentes y precedencia

**Cambios necesarios > código y funcionamiento actual > GDD.**

Se hizo pull en ambos repositorios. El frontend quedó en `30a7844`; el repositorio de documentación estaba actualizado en `c7afbf1`. Se releyeron el HTML, los componentes documentales, `KingsCourt.tsx`, `narrativeService.ts` y `narrativoSelectionSlice.ts`.

Se consultaron por GET:

- Swagger: `http://10.16.2.19:8090/docs`.
- Contrato: `http://10.16.2.19:8090/openapi.json`.
- `/docs..` devuelve 404; no es la URL de Swagger.

La API se identifica como “Mayores Actualizaciones API”, versión `2.0.0`. El contrato publica narrativa V2, grafos y administración de acciones/frecuencias. No se consultaron registros administrativos con credenciales ni se ejecutaron partidas, POST, PUT o DELETE contra el servidor. OpenAPI no certifica por sí solo la implementación de todas las primitivas ni revela la organización física completa de MongoDB.

La revisión histórica `33cdf8f` describía un backend sin narrativa registrada. Esa conclusión no representa al servidor documentado el 6/11. El documento inicial de motor y sus simulaciones de commandId/versiones quedan como antecedentes y mejoras futuras; este texto rige la integración con los endpoints publicados hoy.

## 2. Lo que ya cambió en el backend

El contrato permite separar definición reutilizable, referencia parametrizada y frecuencia:

| Elemento | Campos publicados relevantes | Responsabilidad |
| --- | --- | --- |
| `AccionCatalogoResponse` | `_id`, `universo_id`, `nombre`, `primitiva`, `permitido_en`, `activo`, `version` | Describe una acción reutilizable. |
| `AccionReferenciadaSchema` | `accion_id`, `parametros` | Referencia la acción y configura su aplicación. |
| `EfectoSchema` | `id`, `frecuencia_id`, `disparador`, `condiciones`, `acciones[]`, `accion` | Agrupa las referencias y condiciones. El campo singular permanece como compatibilidad legacy. |
| `ParametrosAccionSchema` | `clave`, `ruta`, `operacion_matematica`, `valor`, `tipo_calculo`, `destino`, `personaje_id`, `tag`, otros | Parametriza la ejecución que pertenece al back. |
| `ItemFrecuenciaSchema` | `id`, `evento_motor`, `cada`, `desfase`, `conteo_desde`, `activo` | Describe periodicidad por adquisición o inicio de mes. |

Primitivas declaradas: `modificar_recurso`, `modificar_afinidad`, `otorgar_tag`, `remover_tag`, `amortiguar_danio`, `mutar_estado`, `mutar_estado_entidad`. Que aparezcan en el enum no sustituye las pruebas de ejecución.

Rutas administrativas publicadas:

- `GET /api/narrative/admin/operaciones` y `/eventos-motor`.
- CRUD de `/api/narrative/admin/acciones`, con `/{accion_id}/usos`.
- `GET /api/narrative/admin/frecuencias`, actualización por universo y consulta de usos.
- `GET /api/narrative/admin/catalogo-reglas`.

El catálogo usa autenticación administrativa HTTPBearer según OpenAPI. El cliente de juego no debe descargarlo para ejecutar acciones ni escribir rutas arbitrarias del estado enviadas por el jugador.

Ejemplo ilustrativo con estructura publicada; estos IDs no aseguran registros existentes:

```json
{
  "id": "efecto_demo",
  "frecuencia_id": "cada_mes",
  "condiciones": [],
  "acciones": [{
    "accion_id": "accion_demo_reservas",
    "parametros": {
      "clave": "oro",
      "operacion_matematica": "sumar",
      "valor": 10,
      "tipo_calculo": "fijo",
      "destino": "portador"
    }
  }]
}
```

**La carta declara referencias. El motor del back las resuelve. El front muestra el estado resultante.** No agregar una búsqueda `accion_id → handler de negocio` en React.

## 3. Patrón recomendado: Application Controller + Adapter

**Application Controller** centraliza la coordinación de navegación y secuencia de presentación. Adaptado a React, puede exponerse como `useKingsCourtCoordinator`, sin exigir una clase, una nueva librería ni otro router.

**Adapter** normaliza los DTOs V2 hacia un estado confirmado y un modelo de presentación. Separa las peculiaridades de `EstadoTurnoResponse` y `EstadoGrafoV2Response` de los componentes visuales.

**Presentation Model** expresa la pantalla, fondo, personajes, texto, opciones, estado de espera y secuencia visual que las vistas necesitan. Es una proyección del estado confirmado, no una réplica del motor de acciones.

Distribución propuesta:

```text
Vistas de etapa existentes
  → intenciones / callbacks
useKingsCourtCoordinator
  → narrativeApi (transporte V2)
  ← adapter de respuestas
  → confirmedState + presentationState
  → projectNarrativeView → props de las mismas vistas

Backend: referencias → frecuencias/condiciones → primitivas → estado guardado
```

El coordinador delega transporte y funciones puras; no se convierte en un componente gigante que incluya azar, porcentajes, adquisición y finalización.

### Capas y archivos propuestos

| Capa | Punto de partida | Cambio |
| --- | --- | --- |
| Transporte | `narrativeService.ts` | Extraer llamadas tipadas, autenticación/invitado y errores. Evitar dependencia del store para decidir mutaciones remotas. |
| Adapter | `adaptarEstadoGrafo` existente | Aprovecharlo, separando DTOs de props y quitando la conversión de impactos a acciones ejecutables. |
| Coordinador | Manejadores de `KingsCourt.tsx` | Extraer envío, exclusión de operaciones, recuperación, secuencia de resultado/fondo/diálogo y proyección. |
| Estado confirmado | `sincronizarPartida` | Reconciliar valores remotos sin ejecutar efectos. Separarlo de selecciones y animaciones locales. |
| Presentación | Vistas y configuración de fondo existentes | Conservar CSS, composición, retratos, diálogo, accesibilidad y modo visual por edad. |

Los nombres de archivos nuevos son propuestas; las rutas V2 de la próxima sección son las del contrato observado.

## 4. Contrato real de juego

| Operación | Endpoint | Request / query | Response |
| --- | --- | --- | --- |
| Setup | GET `/api/narrative/partida/setup` | `date` | `SetupDesafioResponse` |
| Restaurar | GET `/api/narrative/v2/partida/estado` | `date` | `EstadoTurnoResponse` |
| Iniciar | POST `/api/narrative/v2/partida/iniciar` | `date`, `corte_elegida_ids`, `cartas_iniciales_ids` | `IniciarPartidaV2Response` |
| Elegir carta | POST `/api/narrative/v2/partida/elegir-carta-mes` | `date`, `carta_id` | `ElegirCartaMesV2Response` |
| Elegir opción | POST `/api/narrative/v2/partida/avanzar-nodo` | `date`, `opcion_id` | `EstadoGrafoV2Response` directo |
| Avanzar mes | POST `/api/narrative/v2/partida/avanzar-mes` | `date` | `AvanzarMesV2Response` |
| Grafo actual | GET `/api/narrative/v2/partida/grafo-actual` | `date` | Grafo actual |

También existen consultas de corte, inventario, historial y finalización bajo `/api/narrative/partida/`. Su uso es una reconciliación o preparación de herramientas, no una ejecución de efectos.

Los headers de juego documentados incluyen `authorization` y `x-guest-credential`. Son opcionales en la firma OpenAPI; eso **no significa acceso anónimo universal**. Confirmar las reglas del servidor y reutilizar la gestión de credenciales existente. El request narrativo actual solo agrega el token, por lo que hay una integración de invitado a revisar.

## 5. Normalización sin inventar valores

`EstadoTurnoResponse` exige `date`, `mes_actual`, `fase_actual`, `status`, `recursos` y `afinidad`; puede incorporar draft, resultado, conversación, finalización y grafo.

`EstadoGrafoV2Response` exige fase, identidad/tipo/título/imagen del grafo y nodo actual. Sus `recursos` y `afinidad` son opcionales/null, descritos como actualizados si el nodo es final. Incluye status, finalización, puntos y conversación encadenada.

Reglas del adapter:

1. Normalizar según el endpoint que respondió: `avanzar-nodo` devuelve el grafo directo; `estado` puede anidarlo en `grafo_actual`.
2. Reemplazar un mapa de recursos/afinidad cuando viene confirmado. Omitido/null en un nodo intermedio significa conservar el último valor conocido; nunca poner cero.
3. Los `impactos_recursos` y `impactos_afinidad` explican una consecuencia; no mutan el saldo confirmado. No convertirlos a `guardarResultado.efectos[].accion` que otro reducer vuelva a ejecutar.
4. Si un desenlace presenta impactos pero omite el saldo final, bloquear acciones dependientes y consultar GET estado. No recomputar el saldo en el browser.
5. Respetar `opciones[].disponible` y `motivo_bloqueo`. Ocultar o deshabilitar según la UX vigente, sin recalcular requisitos para habilitar una opción.
6. Respetar null explícito para limpiar una escena. En una transición confirmada a draft no debe quedar un grafo viejo que vuelva a mostrar el evento.
7. Mantener las respuestas brutas necesarias para no perder resultado pendiente al consultar estado o encadenar un grafo nuevo.
8. `fase_actual` y `status` son strings; el adapter requiere mapeos explícitos y verificados. Un valor desconocido debe mostrar recuperación/diagnóstico, no avanzar o asumir victoria.

Ejemplo: antes oro=60; el back devuelve recursos.oro=70 e impacto.delta=10. El coordinador conserva **70**, muestra “+10” y puede animar 60→70. No produce 80.

No interpretar `impactos_tags`, que es una lista de strings, como un protocolo completo de altas/bajas de inventario o tags. Para representar eliminaciones sin ambigüedad se necesita consulta autoritativa de inventario o un contrato de consecuencias más preciso.

## 6. Proyección que conserva las pantallas

Prioridades propuestas:

1. Finalización confirmada → `MostrarResultadoEtapa4` en modo final.
2. Nodo `es_final` o resultado confirmado pendiente → `MostrarResultadoEtapa4` en modo resultado, incluso si la fase del back ya es BALANCE_MES.
3. Grafo de conversación → `ResponderConversacionEtapa3`.
4. Grafo de evento → `DecidirEventoEtapa2`.
5. Draft confirmado → `SeleccionarCartasEtapa0y1`, con la oferta recibida.
6. Setup sin partida → muestra y selecciones iniciales existentes.
7. Valor incompatible/faltante → recuperación explícita.

No usar solo la fase para saltar un resultado que todavía debe leerse. No usar `oro<=0` local para inventar una finalización: la dicta el servidor.

Entorno a preparar:

- Fondo ilustrativo del nodo, con fallback al del grafo cuando corresponda.
- Fondo de corte y decoración según recursos confirmados usando los umbrales visuales existentes.
- Retratos y hablante por ID usando la corte/catálogos cargados.
- Texto, opciones y bloqueo de controles durante peticiones.
- Cursor de diálogo y colas visuales de resultado, cambio de fondo y conversación.

El cálculo de cuántos adornos dibujar a partir de un recurso es una regla visual válida en el front. Atenuar pérdidas por edad, adquirir una carta o decidir un final son reglas de juego del back.

## 7. Flujo preservado, con causalidad explícita

Ejemplo de decisión:

```text
Jugador elige opción
 → coordinador bloquea envío duplicado
 → POST avanzar-nodo { date, opcion_id }
 → adapter normaliza grafo/estado parcial
 → se aceptan valores confirmados
 → se presenta resultado y se conserva conversación pendiente
Jugador presiona Continuar
 → se prepara la transición del fondo si cambia la decoración
 → se muestra conversación pendiente, o se solicita avance de mes
   solo como continuación de esa intención explícita y si el estado lo permite
```

El callback de una animación **no decide reglas** ni ejecuta acciones de carta. Puede completar una tarea de presentación que el coordinador programó al aceptar una intención. Si continuar requiere un POST después de una pausa visual, esa operación debe quedar ligada a la intención original y consumirse una sola vez; no dispararse por montar una vista, por observar una fase o por repetir un `useEffect`.

Al restaurar por GET, reconstruir la fase guardada sin volver a jugar la carta o avanzar el mes. Si el contrato no conserva el resultado que debe leerse, es una brecha a resolver en backend; un estado efímero del navegador no da reanudación entre dispositivos.

El schema describe `conversacion_actual` del grafo como objeto abierto. Acordar su DTO y cómo confirmar la lectura del resultado. No inventar un nuevo endpoint CONTINUAR_RESULTADO como si ya existiera.

## 8. Diferencias concretas respecto del frontend actualizado

| Código observado en 30a7844 | Riesgo / cambio propuesto |
| --- | --- |
| `guardarCorte`, `guardarCartasIniciales`, `elegirCarta` ejecutan `aplicarEfectosAlObtener` | Guardar selección local por separado. En partidas remotas, aceptar adquisición y recursos del back sin ejecutar acciones. |
| `guardarResultado` suma deltas y puede atenuar por edad; `mostrarEstado` sincroniza antes/después | Crear un registro de presentación sin mutación de dominio. Retirar la doble escritura como mecanismo de compensación. |
| `avanzarMes` incrementa Redux antes del POST | Esperar mes/fase/recursos confirmados. Si falla, mantener el último confirmado. |
| `finalPorRecurso` puede decidir final tras una respuesta | Usar finalización/status autoritativos; recuperar si el contrato es incompleto. |
| `adaptarEstadoGrafo` ya reutiliza las vistas y filtra opciones disponibles | Mantener su idea y formalizar DTO → Presentation Model. No volver a escribir las pantallas. |
| `avanzarNodo` hace GET si cambia el ID de grafo | Preservar las consecuencias y escena pendiente antes de sustituir la respuesta. El GET no debe borrar la explicación de una transición recién confirmada. |
| El transporte puede ir a fallback después de timeout, 5xx o 404 | Separar explícitamente demo de partida remota. El POST puede haber guardado antes del fallo: no abrir otra rama local como si fuera la misma partida. |
| Las respuestas de conversación ya pasan por `avanzarNodo` y `mostrarEstado` | La afirmación histórica de “afinidad previa al POST en ese camino” no describe este HEAD. El problema remanente está en la ejecución local del resultado y adquisición. |

## 9. Reintentos y concurrencia: no confundir catálogo con partida

`AccionCatalogoUpdateRequest` tiene `expected_version`; `AccionCatalogoResponse` tiene `version`. Es control sobre la edición del catálogo.

Los requests actuales de iniciar, elegir carta, avanzar nodo y avanzar mes **no publican commandId/expectedVersion de partida**; `EstadoTurnoResponse` no declara una versión del run ni una lista de recibos/consecuencias con ID. El contrato por sí solo no garantiza los reintentos idempotentes que simulaba la propuesta anterior.

Para integrar hoy:

- Una operación de juego en vuelo por partida y UI bloqueada; IDs locales de solicitud pueden evitar aplicar respuestas antiguas en el mismo cliente.
- Cancelar una espera del navegador no deshace un POST aceptado por el servidor.
- Tras timeout, entrar en resultado incierto y consultar el estado. No reenviar automáticamente.
- Si el GET no permite decidir con certeza qué pasó, mantener recuperación explícita; no adivinar, no recalcular y no continuar con otro comando.
- Acordar como mejora backend: identidad estable de operación, recibos, control de versión del run y resultado pendiente reanudable.

Un contador local de requests no proporciona control de concurrencia entre pestañas ni reemplaza una versión persistida.

## 10. Migración por pasos y pruebas

1. Tipar los DTOs reales y separar api/adapter/proyección/coordinador.
2. Migrar primero avanzar-mes: recibir mes y saldo antes de reemplazar. Mantener las vistas.
3. Migrar adquisición y resultados eliminando solo la ejecución local sustituida.
4. Migrar nodo/conversación con secuencia visual y conservación de escenas pendientes.
5. Reconciliar corte, inventario y finalización donde las respuestas parciales no alcancen.
6. Separar demo/offline y la política de edad. No cambiar balance ni cantidades por leer el GDD.
7. Acordar las garantías faltantes de reanudación, errores y concurrencia; recién entonces activar reintentos automáticos.

Pruebas necesarias: null/omisión sin reset; reemplazo de valores cero; resultado sin doble delta; resultado antes de conversación; cambio de grafo sin perder consecuencias; desconocidos con recuperación; ausencia de avance optimista; timeout sin fallback silencioso; misma UI en modo visual por edad; restauración sin ejecutar cartas.

El HTML incluye un laboratorio aislado de normalización/proyección, no el coordinador productivo. Sus fixtures son inventadas con la estructura de OpenAPI. No se hicieron escrituras contra el servidor.

Verificación reproducible del laboratorio actualizado:

```sh
node --check docs/componentes/coordinador-narrativo.js
node --test docs/componentes/coordinador-narrativo.test.mjs
```

Sus seis pruebas verifican las invariantes de normalización/proyección, no autenticación, persistencia ni ejecución de acciones del servidor.

Referencias: [Application Controller](https://martinfowler.com/eaaCatalog/applicationController.html), [Presentation Model](https://martinfowler.com/eaaDev/PresentationModel.html), [Swagger de la red interna](http://10.16.2.19:8090/docs).
