/* Componente documental local: sin React, peticiones de API ni dependencias externas. */
(() => {
  'use strict';
  const fe = 'https://github.com/MontiNahuel/juegos-mayores-actualizaciones/blob/0f12188/';
  const be = 'https://github.com/Facundo-Bernard/mayores_actualizacionesSIPI-BACK/blob/33cdf8f/';
  const game = 'src/VISTAS/JUEGOS/NARRATIVO/';
  const slice = 'src/store/narrativoSelectionSlice.ts';
  const sources = (...refs) => `<p class="source">Código de referencia: ${refs.map(([repo, file]) => `<a href="${repo === 'FE' ? fe : be}${file}" target="_blank" rel="noopener noreferrer" title="${file}">${repo} · ${file.split('/').pop()} ↗</a>`).join(' ')}</p>`;
  const image = (file, title, alt) => `<figure class="project-figure screenshot"><a href="docs/imagenes/arquitectura/${file}.png" target="_blank" rel="noopener noreferrer" aria-label="Ampliar captura: ${title}"><img src="docs/imagenes/arquitectura/${file}.png" width="1280" height="720" alt="${alt}" loading="lazy" decoding="async"></a><figcaption><strong>${title}.</strong> ${alt}</figcaption></figure>`;

  const phases = [
    {
      id: 'carga', title: 'Preparación · cargar o restaurar', phase: 'Antes de la etapa 0',
      play: 'El jugador ve el progreso de carga y puede reintentar si falla. Si existe una partida activa, debe volver a su escena pendiente, no elegir otra corte.',
      checks: 'Se identifica la fecha del desafío. La precarga comparte el trabajo por fecha para tolerar montajes de StrictMode y desconecta oyentes al salir. Si hay partida remota, se consultan estado y corte en paralelo; sin estado recuperable se muestra error. El jugador local se inicializa cuando cambia la fecha.',
      architecture: '<code>prepararCargaNarrativa</code> consulta el setup, prepara los recursos iniciales y deja imágenes futuras en segundo plano. <code>narrativoCargaSlice</code> maneja progreso/error; <code>narrativoSelectionSlice</code> conserva el dominio. <code>mostrarEstado</code> sincroniza recursos y elige final, resultado, conversación, evento o draft según la respuesta.',
      philosophy: 'Separar «contenido listo para mostrarse» de «partida creada». Una imagen descargada no confirma una transición de juego. Restaurar la fase real conserva la continuidad y evita que una recarga invente decisiones nuevas.',
      caveat: 'El respaldo local mantiene la partida mientras la app está abierta: no es una cola offline que sincronice decisiones después. El caché de imágenes tampoco guarda la partida.',
      files: [['FE', game + 'KingsCourt.tsx'], ['FE', game + 'recursos/precargaNarrativa.ts'], ['FE', 'src/store/narrativoCargaSlice.ts']],
    },
    {
      id: 'muestra', title: 'Etapa 0 · presentar el ciclo de eventos', phase: 'muestra_evento · presentación',
      play: 'Se muestran las cartas de evento del día y un título de ciclo. La persona puede reconocer el tema y continuar antes de preparar su corte.',
      checks: 'Solo se abre al comenzar una partida sin avance activo. El título normaliza categorías y tonos: usa una categoría dominante, el balance positivo/negativo o «Ciclo del Bufón» cuando no hay señal suficiente.',
      architecture: '<code>MuestraEventoEtapa0</code> consume <code>eventos_del_dia</code> y formatos compatibles. <code>calcularTituloCiclo</code> resume el contenido. Al continuar se apaga una bandera de presentación: no se sortea un resultado ni se aplican efectos.',
      philosophy: 'Anticipar el contexto sin convertir la introducción en una regla del motor. El título es una síntesis visual de los datos, no una promesa de que un evento concreto vaya a ocurrir.',
      caveat: 'Esta etapa visual no es una fase persistida equivalente a las fases V2 del servidor. La numeración de componentes y los enums del backend no son el mismo contrato.',
      files: [['FE', game + 'ETAPA_0_MUESTRA_EVENTO/MuestraEventoEtapa0.tsx'], ['FE', game + 'ETAPA_0_MUESTRA_EVENTO/cicloEvento.ts']],
    },
    {
      id: 'corte', title: 'Etapa 0a · formar la corte', phase: 'seleccionar_corte',
      play: 'Se eligen exactamente tres personajes entre los ofrecidos. Se pueden marcar y desmarcar cartas; al alcanzar el cupo, las restantes quedan deshabilitadas.',
      checks: '<code>SeleccionarCartasEtapa0y1</code> impide superar la cantidad y bloquea confirmaciones simultáneas. <code>guardarCorte</code> guarda IDs y retratos, toma <code>afinidad_inicial</code> y ejecuta los efectos locales compatibles de <code>al_obtener</code>. Todavía no se llamó a iniciar la partida remota.',
      architecture: 'La misma vista de selección se reutiliza para corte, cartas iniciales y draft mensual. <code>guardarCorte</code> pasa a <code>seleccionar_cartas</code>. Los tres IDs de corte se envían al servidor junto con las cartas iniciales en la siguiente confirmación.',
      philosophy: 'Elegir personajes crea el contexto social del reinado: quién puede conversar y qué condiciones pueden habilitarse. La carta representa identidad y reglas declaradas; su ilustración o descripción no ejecutan una regla por sí solas.',
      caveat: 'La UI controla cantidad; el servidor compatible debe volver a comprobar los IDs contra la oferta del desafío. Elegir una carta localmente no prueba que haya sido aceptada por la API.',
      files: [['FE', game + 'ETAPA_0_1_SELECCIONAR_CARTAS/SeleccionarCartasEtapa0y1.tsx'], ['FE', slice], ['BE', 'app/features/narrative/game/setup_service.py']],
    },
    {
      id: 'iniciales', title: 'Etapa 0b · preparar el reino', phase: 'seleccionar_cartas → draft_mensual',
      play: 'Se eligen tres cartas iniciales. Pueden representar objetos, bonificaciones u otras entidades; su nombre no determina automáticamente su efecto.',
      checks: 'Se exige la cantidad exacta y se espera la respuesta de <code>iniciarPartida</code>. Solo si la petición devuelve datos se guardan las cartas iniciales. En el backend revisado, el alta comprueba pertenencia a las ofertas, ejecuta <code>al_obtener</code> de personajes y cartas y verifica colapso de recursos.',
      architecture: '<code>POST /v2/partida/iniciar</code> recibe fecha, <code>corte_elegida_ids</code> y <code>cartas_iniciales_ids</code>. Redux guarda el inventario y sus efectos compatibles; luego <code>mostrarEstado</code> reemplaza los recursos con la instantánea remota si fue enviada.',
      philosophy: 'La preparación debe dar decisiones con consecuencias verificables, manteniendo un inventario explícito. El estado confirmado del servidor debe reconciliar las reglas locales; aplicar a ciegas el mismo delta en ambos lados produciría divergencia.',
      caveat: 'El fallback devuelve el draft sin ejecutar un motor genérico de cartas: los efectos iniciales que se ven en ese modo provienen del slice. No todos los tipos del modelo tienen una implementación local.',
      files: [['FE', game + 'KingsCourt.tsx'], ['FE', slice], ['BE', 'app/features/narrative/game/setup_service.py']],
    },
    {
      id: 'draft', title: 'Etapa 1 · elegir la carta del mes', phase: 'draft_mensual / DRAFT_MENSUAL',
      play: 'En el modo normal se elige una carta entre las ofrecidas. En modo adaptado se omite esa elección visible y se pide el siguiente evento usando la primera carta disponible.',
      checks: 'En el cliente, la vista exige una selección. El servicio V2 revisado exige fase de draft y que la carta estuviera ofrecida en ese mes. Agrega la carta, combina tags, aplica <code>al_obtener</code> y comprueba si algún recurso colapsó antes de abrir un evento.',
      architecture: '<code>elegirCartaMensual</code> llama a <code>/v2/partida/elegir-carta-mes</code>. El camino normal despacha <code>elegirCarta</code> después de recibir respuesta y luego sincroniza. Si falla, intenta recuperar la fase. <code>abrirEventoSinCarta</code> usa la misma API pero no agrega la carta al inventario local.',
      philosophy: 'El draft conecta planificación e incertidumbre. La adaptación por edad reduce un paso de interacción; no equivale a eliminar esa operación del servidor ni a unificar automáticamente ambas implementaciones.',
      caveat: 'Existe una asimetría concreta: el backend revisado agrega la carta elegida, pero el modo adaptado no la agrega al mazo local. Los recursos pueden sincronizarse; inventario y tags requieren revisar el contrato de restauración.',
      files: [['FE', game + 'KingsCourt.tsx'], ['FE', 'src/config/adaptacionEdad.ts'], ['BE', 'app/features/narrative/game/turn_service.py']],
    },
    {
      id: 'evento', title: 'Etapa 2 · decidir el evento', phase: 'decidir_evento / TOMA_DECISION_EVENTO',
      play: 'Se lee una situación y se elige una opción disponible. La UI puede mostrar una alternativa secreta y explicar su activador; también permite consultar recursos en el modo numérico.',
      checks: 'La UI oculta las opciones marcadas <code>bloqueada</code>. Sus comparadores locales identifican recursos, personajes, afinidad, tags y cartas para describir activadores. El backend V2 comprueba fase, evento, pertenencia de la opción y requisitos de la opción secreta antes de sortear un desenlace ponderado.',
      architecture: 'Sin <code>nodo_id</code>, se registra la decisión local y se llama a <code>decidirEvento</code>. Con <code>nodo_id</code>, se llama a <code>avanzarNodo</code>; el adaptador vuelve a presentar el grafo con las pantallas existentes. Los impactos definitivos deben reconciliarse con recursos y afinidades remotos.',
      philosophy: 'Separar una elección del resultado que produce. La elegibilidad de una opción y la probabilidad de sus desenlaces son reglas diferentes; una etiqueta «secreto» no sustituye una comprobación de autorización en el motor.',
      caveat: 'La función local que describe condiciones no es un guard completo de selección: el filtro visible utiliza <code>bloqueada</code>. El avance por nodos no tiene fallback y no existe en el backend fijado para esta guía.',
      image: image('kings-court-evento', 'Decisión del evento', 'Escena de prueba con la situación y sus dos decisiones disponibles.'),
      files: [['FE', game + 'ETAPA_2_DECIDIR_EVENTO/DecidirEventoEtapa2.tsx'], ['FE', game + 'narrativeService.ts'], ['BE', 'app/features/narrative/game/turn_service.py']],
    },
    {
      id: 'conversacion', title: 'Etapa 3 · responder la conversación', phase: 'responder_conversacion / RESOLVER_CONVERSACION',
      play: 'Los miembros de la corte intervienen por turnos. Se avanza frase por frase y las respuestas aparecen al llegar al último diálogo. La elección puede cambiar afinidades y deja una consecuencia para leer.',
      checks: 'La vista busca participantes por ID y acomoda retratos para evitar superposición. En el flujo por fases, Redux aplica la afinidad y registra la conversación antes de intentar guardarla. En grafos se envía la opción al motor y se muestra la respuesta adaptada.',
      architecture: '<code>ResponderConversacionEtapa3</code> maneja el paso de lectura. <code>resolverConversacion</code> actualiza afinidad e historial del mes; <code>responderActual</code> envía <code>opcion_numero</code>. La siguiente vista «consecuencia» es de presentación y luego continúa al balance.',
      philosophy: 'Dar tiempo a leer y relacionar posiciones de personajes con sus consecuencias. La relación forma parte del estado del dominio; animar retratos y alternar hablantes solo ayuda a comprenderlo.',
      caveat: 'La preferencia enviada por el cliente para conversaciones nuevas es 50% normal y 75% adaptado; el backend revisado utiliza una tirada propia de 40%. Ese hint no garantiza la frecuencia real. Una petición fallida deja un cambio local sin demostrar persistencia remota.',
      files: [['FE', game + 'ETAPA_3_RESPONDER_CONVERSACION/ResponderConversacionEtapa3.tsx'], ['FE', slice], ['BE', 'app/features/narrative/game/turn_service.py']],
    },
    {
      id: 'resultado', title: 'Etapa 4 · explicar el resultado y mostrar la corte', phase: 'mostrar_resultado + cambio_fondo',
      play: 'Se lee el desenlace y sus cambios. Si se agregó decoración por un umbral de recursos, se ve la nueva corte antes de pasar a la próxima escena. Una conversación pendiente se muestra después del resultado.',
      checks: '<code>mostrarEstado</code> sincroniza, guarda el resultado y vuelve a sincronizar la instantánea remota para evitar sumar otra vez sus deltas a los recursos confirmados. El slice limita recursos a 0–100 y atenúa pérdidas en modo adaptado. La pausa visual solo se intercala cuando aumenta alguna capa visible.',
      architecture: '<code>MostrarResultadoEtapa4</code> presenta el desenlace. <code>fondoBase</code> conserva la composición anterior mientras se lee; al continuar se limpia el resultado, se precargan los assets nuevos y se espera hasta 3200 ms, o cero con movimiento reducido. La bandera visual no es una fase remota.',
      philosophy: 'Primero explicar la consecuencia, después mostrar el cambio y finalmente pedir otra decisión. El escenario funciona como retroalimentación del recurso; no debe convertirse en el dueño de la regla ni volver a ejecutar el efecto.',
      caveat: '<code>guardarResultado</code> no es el motor ECA: suma acciones que tengan <code>clave</code>, sin revisar allí su disparador, condiciones o porcentaje. Una respuesta sin instantánea remota puede exponer diferencias frente al motor completo.',
      files: [['FE', game + 'KingsCourt.tsx'], ['FE', slice], ['FE', 'src/config/fondoCorte.ts']],
    },
    {
      id: 'balance', title: 'Balance mensual · cerrar y avanzar', phase: 'BALANCE_MES → DRAFT_MENSUAL',
      play: 'Terminados el resultado y la conversación, se cierra el mes y se prepara el siguiente draft o la finalización. La persona no dispara un efecto mensual tocando una ilustración: lo hace la transición de turno.',
      checks: 'El cliente incrementa el mes local antes de llamar a la API. El backend revisado exige <code>BALANCE_MES</code>, guarda el resumen y, si no llegó al final del año, avanza el mes, procesa <code>cada_mes</code> de corte y cartas y vuelve a comprobar colapso.',
      architecture: '<code>avanzarMes</code> del slice solo cambia mes, carta actual y fase. <code>transition_service.avanzar_mes_v2</code> contiene el despacho mensual y la persistencia. En el mes 12 el backend cierra la victoria antes de procesar otro ciclo de pasivos; el fallback local termina una prueba de seis meses.',
      philosophy: 'Una regla recurrente necesita un reloj de dominio único: la transición de mes. La respuesta del servidor debe corregir el avance optimista local; cambiar de pantalla no puede cobrar o premiar otra vez.',
      caveat: 'En el respaldo local no se ejecutan los pasivos genéricos <code>cada_mes</code>. Además, el historial remoto toma su foto antes de los pasivos del nuevo mes: no atribuir ese cambio al desenlace del mes anterior.',
      files: [['FE', slice], ['FE', game + 'narrativeFallback.ts'], ['BE', 'app/features/narrative/game/transition_service.py']],
    },
    {
      id: 'cierre', title: 'Etapa 5 · finalizar y reconstruir la crónica', phase: 'finalizada / FINALIZADA',
      play: 'Se presenta el final y se puede abrir la crónica: decisiones, balances, relaciones y corte final. Terminar la prueba reinicia la partida narrativa y vuelve al calendario.',
      checks: 'Un recurso en cero puede cerrar el reinado. La finalización tiene prioridad al escoger pantalla. Las estadísticas cargan estado, historial, corte y catálogos en paralelo; si falla un catálogo, los demás datos pueden seguir mostrando la crónica.',
      architecture: '<code>finalizarPartida</code> cambia estado y fase. <code>EstadisticasPartidaEtapa5</code> y <code>estadisticasModel</code> reconstruyen el recorrido. Los catálogos resuelven IDs históricos a nombres; el modo local devuelve catálogos vacíos y utiliza la información disponible en memoria.',
      philosophy: 'El cierre debe explicar por qué se llegó a ese final, no limitarse a una nota. Diferenciar el registro histórico de su reconstrucción visual permite conservar información aunque un catálogo no esté disponible.',
      caveat: 'Elegir «Al Final» en el editor no basta: no se identificó un despacho de <code>al_final_partida</code> en los servicios V2 revisados. La finalización y un efecto final de carta son operaciones distintas.',
      files: [['FE', game + 'ETAPA_5_ESTADISTICAS_PARTIDA/EstadisticasPartidaEtapa5.tsx'], ['FE', game + 'ETAPA_5_ESTADISTICAS_PARTIDA/estadisticasModel.ts'], ['BE', 'app/features/narrative/game/endings_service.py']],
    },
  ];

  const effectRows = [
    ['al_obtener · recurso fijo', 'Funciona en cliente', 'Corte, cartas iniciales y carta mensual normal pasan por aplicarEfectosAlObtener. Suma el valor y limita a 0–100.', 'El motor también lo implementa; reconciliar con su instantánea para evitar deltas duplicados.'],
    ['al_obtener · otorgar_tag', 'Funciona en cliente', 'Agrega el tag de la acción sin duplicados.', 'El campo general carta.tags no se fusiona por esa misma regla local; el backend sí agrega tags declarados.'],
    ['Condiciones de recurso', 'Parcial en cliente', 'El guard de adquisición combina comparaciones con AND: >=, >, <=, < y ==.', 'Los tipos desconocidos y operadores no reconocidos se dan por cumplidos allí. No es igual al evaluador de opciones ni al motor remoto.'],
    ['Condiciones de carta, tag, personaje o afinidad', 'Depende del motor', 'No se evalúan en el guard local al obtener: se omiten y el efecto puede activarse de más.', 'rule_engine sí implementa esas cinco familias de condiciones. La UI de eventos usa otro comparador para rotular activadores.'],
    ['Cálculo porcentual', 'Difiere en cliente', 'El slice no consulta tipo_calculo. Con oro=50 y valor=20 porcentual termina en 70, como suma fija.', 'El motor calcula 20% de 50 y termina en 60; luego redondea y respeta límites del universo.'],
    ['cada_mes · cartas y corte', 'Solo en backend V2', 'avanzarMes no recorre efectos. El fallback tampoco ejecuta estos pasivos genéricos.', 'transition_service los despacha al avanzar un mes no final; requiere una API registrada y compatible.'],
    ['modificar_afinidad como acción de carta', 'Solo en motor remoto', 'La adquisición local no tiene esa rama. Sí existe el camino separado impacto_afinidad al responder una conversación.', 'rule_engine modifica afinidad y limita a 0–100. No confundir la afinidad inicial con esta acción.'],
    ['al_final_partida', 'Sin despacho identificado', 'El editor ofrece «Al Final», pero finalizarPartida no ejecuta cartas.', 'El enum lo declara; los servicios V2 de cierre revisados no lo despachan. No presentarlo como una habilidad funcional.'],
    ['en_evento_positivo / en_evento_negativo', 'Sin despacho identificado', 'No hay ejecución genérica local para estos disparadores.', 'Declarados en enums; los puntos de despacho V2 revisados usan al_obtener y cada_mes.'],
    ['amortiguar_danio', 'Sin implementación en el motor revisado', 'No tiene una rama local para cartas.', 'Está declarado como tipo de acción, pero ejecutar_accion no lo implementa. La reducción por edad es otra regla y no demuestra que esta habilidad funcione.'],
    ['Texto o ilustración sin efectos', 'No ejecuta una regla', 'Una descripción «genera +10 por mes» no modifica el estado si no existe el efecto estructurado.', 'Hay que revisar disparador, condiciones, acción y punto de ejecución, además del contrato y el contenido guardado.'],
  ];

  const parityRows = [
    ['Escenas, precarga y transiciones', 'Compone fondos, retratos, diálogos, imágenes y pausas entre consecuencias.', 'Entrega contenido y estado; no reproduce esas pantallas o animaciones.', 'Solo front · intencional', 'La presentación queda en el cliente. No hace falta duplicarla en el servidor ni usarla como disparador de reglas.'],
    ['Muestra inicial del ciclo', 'Consume eventos_del_dia y variantes para resumir categorías y tonos antes de formar la corte.', 'El setup revisado ofrece personajes y cartas, pero no el resumen de eventos que espera esta introducción.', 'Contrato pendiente', 'Acordar el campo de resumen del setup o documentar que la muestra puede carecer de contenido; el fallback sí aporta su propia lista.'],
    ['Selección de corte y cartas iniciales', 'Exige tres selecciones en la UI y aplica parte de al_obtener en Redux.', 'Comprueba IDs contra la oferta del desafío, crea o recupera el run y aplica efectos de adquisición.', 'Compartido · parcial', 'La validación visual no sustituye al backend. Reconciliar recursos, afinidades, tags e inventario confirmados.'],
    ['Draft mensual y modo adaptado', 'El modo normal agrega la carta elegida al mazo local. El adaptado usa la primera carta para abrir el evento sin agregarla localmente.', 'elegir_carta_mes_v2 agrega la carta seleccionada y sus tags al run antes de abrir el evento.', 'Reglas diferentes', 'Definir si omitir el draft es solo una simplificación visual o si realmente no debe obtenerse carta; hoy el inventario puede divergir.'],
    ['Recursos y tags al obtener', 'Implementa modificar_recurso con suma fija y otorgar_tag; limita recursos a 0–100.', 'Implementa ambas acciones, porcentajes y límites definidos por el universo; también combina carta.tags.', 'Compartido · parcial', 'El soporte básico existe en ambos, pero el rango, el cálculo y los tags de la entidad no se procesan igual.'],
    ['Condiciones de efectos al obtener', 'En ese guard solo evalúa comparaciones de recurso; tipos u operadores desconocidos se consideran cumplidos.', 'Evalúa recursos, personajes, afinidades, cartas y tags. Una condición no reconocida no se considera satisfecha.', 'Solo back · evaluador completo', 'Compartir las reglas admitidas o confiar en una respuesta remota validada. No asumir que la condición escrita en el editor ya se verifica localmente.'],
    ['Porcentajes y límites de recursos', 'Ignora tipo_calculo en la adquisición y usa límites fijos 0–100.', 'Calcula porcentajes sobre el valor actual, redondea y aplica min/max del universo.', 'Reglas diferentes', 'Con oro=50 y +20%, el cliente suma hasta 70 y el motor obtiene 60. Alinear cálculo y límites antes de activar cartas porcentuales.'],
    ['Efectos pasivos cada_mes', 'El avance de Redux cambia mes y fase; el fallback no despacha estos pasivos.', 'Recorre efectos de corte y cartas en transition_service al pasar al siguiente mes no final.', 'Solo back · lógica de turno', 'Una partida local no reproduce la economía mensual de las cartas. Requiere motor local equivalente o servidor accesible.'],
    ['Afinidad como acción de carta', 'al_obtener no implementa la acción modificar_afinidad; sí admite afinidad_inicial y el flujo separado de conversaciones.', 'rule_engine implementa modificar_afinidad con límites 0–100.', 'Solo back · acción de carta', 'No confundir reclutamiento, respuesta de conversación y habilidad de carta: son tres puntos de aplicación distintos.'],
    ['Director de eventos y azar ponderado', 'Presenta el evento recibido y envía la decisión. La demostración local usa situaciones y consecuencias prefijadas.', 'Selecciona eventos según pools/estado y calcula o sortea desenlaces ponderados.', 'Solo back · motor completo', 'El fallback permite jugar, pero no prueba selección de eventos ni probabilidades equivalentes al motor.'],
    ['Opciones secretas', 'Usa los datos de condiciones para describir activadores y oculta opciones marcadas bloqueada.', 'Verifica que la opción pertenezca al evento y vuelve a evaluar requisitos de las opciones secretas.', 'Compartido · responsabilidades distintas', 'La etiqueta o el filtrado de UI no son el control definitivo. La elegibilidad debe validarse también al procesar la decisión.'],
    ['Frecuencia de conversaciones', 'Envía preferencia opcional: 50% normal o 75% adaptado y exclusión de conversaciones usadas. El fallback sigue la configuración por edad.', 'La resolución por fases revisada usa una tirada de 40% y sus propios filtros de participantes/repetición.', 'Reglas diferentes', 'Consumir explícitamente el hint o eliminarlo del contrato; hoy enviarlo no garantiza la frecuencia del servidor.'],
    ['Confirmación de respuesta de conversación', 'Aplica afinidad antes del POST y presenta la consecuencia local. En ese camino no pasa la respuesta por mostrarEstado.', 'Valida fase y opción, persiste la afinidad y devuelve afinidad, texto e impactos confirmados.', 'Respuesta no reconciliada', 'Usar los valores confirmados para corregir el estado optimista. Si falla el guardado, la afinidad local no demuestra persistencia.'],
    ['Grafos y avance por nodos', 'Tiene adaptarEstadoGrafo, opciones disponibles y llamadas a /v2/partida/avanzar-nodo; reutiliza evento, conversación y resultado.', 'El backend fijado no implementa el motor/endpoint de avance por nodos que consume este cliente.', 'Solo front · integración pendiente', 'Implementar un backend compatible o restringir el contenido a fases. avanzarNodo no usa fallback.'],
    ['Adaptación por edad', 'Desde 45 años, si está habilitada: texto y controles mayores, ocultación de números, draft simplificado y pérdidas locales al 50%.', 'El motor revisado no recibe ni aplica esa misma política de edad y atenuación.', 'Solo front · regla de dominio', 'La presentación puede ser local, pero reducir pérdidas cambia el juego. Acordar qué lado aplica la regla para evitar que una sincronización la contradiga.'],
    ['Resultado e instantánea remota', 'guardarResultado suma deltas simplificados. mostrarEstado sincroniza antes y después para recuperar los recursos confirmados cuando vienen en la respuesta.', 'Aplica el motor de efectos antes de persistir y devolver los recursos resultantes.', 'Compartido · autoridad por acordar', 'No sumar dos veces. Los tags, afinidades, porcentajes y condiciones requieren una instantánea coherente, no solo una lista de efectos visuales.'],
    ['Avance de mes y final por tiempo', 'Incrementa el mes antes de pedir la transición; la prueba local termina después de seis meses.', 'Exige BALANCE_MES y cierra victoria anual al mes 12, antes de otro despacho mensual.', 'Reglas diferentes', 'Distinguir demo de partida remota. Al fallar la transición, reconciliar mes/fase para que el cliente no siga adelantado.'],
    ['Persistencia y restauración', 'Redux conserva la ejecución abierta y consulta estado/corte al restaurar. El respaldo local no reenvía sus decisiones después.', 'Guarda el run y su historial en MongoDB y permite recuperar la fase pendiente.', 'Solo back · persistencia duradera', 'El cache de imágenes y una partida visible no equivalen a un run persistido. La restauración depende de endpoints y contratos compatibles.'],
    ['Crónica y presentación de estadísticas', 'Reconstruye nombres, decisiones, balances y relaciones mediante estado, historial y catálogos; tolera catálogos incompletos.', 'Provee historial por IDs, corte y finalización; registra el balance antes de los pasivos del nuevo mes.', 'Compartido · composición en front', 'Acordar qué representa cada foto de recursos y conservar el detalle histórico aunque falte el catálogo de un ID.'],
    ['Efectos finales y amortiguación de daño', 'No despacha al_final_partida ni implementa amortiguar_danio como habilidad genérica.', 'Declara esos conceptos, pero no se identificó su ejecución en los servicios V2 y el ejecutor revisados.', 'Ausente en ambos caminos auditados', 'Que el editor permita declarar una habilidad no la vuelve funcional. Implementar y probar el disparador/acción antes de ofrecerla.'],
    ['Exposición HTTP de la narrativa', 'Consume setup, estado, draft, evento, conversación, balance, corte e historial.', 'El código de servicios existe, pero app/main.py del corte analizado solo incluye auth y progreso.', 'Integración bloqueada en ese backend', 'Registrar routers y verificar contratos antes de afirmar funcionamiento end-to-end. La web publicada puede utilizar otro backend.'],
  ];

  class JuegosNarrativos extends HTMLElement {
    connectedCallback() {
      // La paginación mueve el elemento; conservar listeners y selección al reconectarlo.
      if (this.dataset.ready) return;
      this.dataset.ready = 'true';
      if (!document.getElementById('juegos-narrativos-style')) {
        const style = document.createElement('style');
        style.id = 'juegos-narrativos-style';
        style.textContent = `juegos-narrativos{display:block;min-width:0}.nc-tabs{display:flex;flex-wrap:wrap;gap:10px;margin:20px 0}.nc-tabs button[aria-selected=true]{background:var(--nav);color:white;border-color:var(--nav)}.nc-phase summary{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap}.nc-phase summary::before{content:"+";color:var(--accent);font-weight:700}.nc-phase[open]>summary::before{content:"−"}.nc-phase summary span{color:var(--muted);font:11px Consolas,monospace}.nc-phase h4{margin-top:0}.nc-phase .grid2{padding:5px 0 8px}.nc-phase .note{margin-bottom:18px}.nc-coming{padding:46px 28px;border:1px dashed var(--line);border-radius:12px;background:var(--card)}.nc-coming h3{font:32px Georgia,serif;margin-top:18px}.nc-phase>div>p:last-child{margin-bottom:0}@media(max-width:800px){.nc-phase .grid2{grid-template-columns:1fr}}@media print{.nc-tabs{display:none}.nc-panel[hidden]{display:block!important}.nc-coming{margin-top:20px}.nc-phase{break-inside:auto}.nc-phase .grid2{grid-template-columns:1fr 1fr}.nc-phase summary{break-after:avoid}}`;
        document.head.append(style);
      }
      this.innerHTML = `
        <div class="nc-tabs" role="tablist" aria-label="Elegir juego narrativo">
          <button type="button" id="nc-tab-kings" role="tab" aria-controls="nc-panel-kings" aria-selected="true" data-narrative-game="kings">King’s Court</button>
          <button type="button" id="nc-tab-shooter" role="tab" aria-controls="nc-panel-shooter" aria-selected="false" tabindex="-1" data-narrative-game="shooter">Shooter por turnos <span class="badge warn">Próximamente</span></button>
        </div>
        <article class="nc-panel" id="nc-panel-kings" role="tabpanel" aria-labelledby="nc-tab-kings" data-narrative-panel="kings">
          <h3>King’s Court · del setup a la crónica</h3>
          <p>Un reinado se sostiene con recursos, personajes y decisiones. La pantalla es un coordinador de etapas; el contenido describe situaciones y el motor decide qué reglas se aplican. Las fases de interfaz y las fases persistidas no tienen una correspondencia uno a uno.</p>

          <div class="note"><strong>Contrato actual · 6 nov 2026</strong>La API consultada publica acciones reutilizables por accion_id, frecuencias y grafos V2. El front revisado en 30a7844 ya adapta grafos a las vistas existentes, pero todavía ejecuta parte de adquisición y resultados en Redux. La propuesta es retirar esas reglas del camino remoto y centralizar la coordinación visual. OpenAPI no certifica que cada primitiva declarada esté probada en producción.</div>
          <h3>Comparación actual: qué ejecuta el back y qué coordina el front</h3>
          <div class="tablewrap"><table><thead><tr><th>Capacidad</th><th>Contrato del back · 6/11</th><th>Front 30a7844 y cambio necesario</th></tr></thead><tbody>
            <tr><td>Acciones de cartas</td><td>Catálogo con primitiva; EfectoSchema referencia acciones[] mediante accion_id y parametros. Conserva accion legacy.</td><td>El slice usa accion embebida. No migrar a otro intérprete local: aceptar adquisición y recursos remotos.</td></tr>
            <tr><td>Frecuencias</td><td>Frecuencias por universo con evento_motor, cada, desfase y conteo_desde.</td><td>La frecuencia pertenece al motor. Abrir una vista o terminar una animación no dispara efectos.</td></tr>
            <tr><td>Grafos y opciones</td><td>avanzar-nodo, grafo-actual y estado están publicados. El nodo incluye disponible y motivo_bloqueo.</td><td>adaptarEstadoGrafo ya reutiliza las pantallas. Formalizar Adapter y conservar bloqueo del servidor.</td></tr>
            <tr><td>Desenlaces</td><td>El grafo devuelve nodo final, impactos y recursos/afinidad opcionales.</td><td>guardarResultado todavía suma deltas; mostrarEstado vuelve a sincronizar. Separar presentación de mutación y consultar estado si faltan valores finales.</td></tr>
            <tr><td>Conversación</td><td>El mismo endpoint de nodos devuelve el diálogo y posibles consecuencias.</td><td>El HEAD actual ya usa avanzarNodo y mostrarEstado. Conservar resultado, fondo y conversación pendiente sin recalcular afinidad.</td></tr>
            <tr><td>Avance mensual</td><td>avanzar-mes devuelve mes_actual, fase_actual, status, recursos y draft.</td><td>Eliminar incremento local antes del POST; preparar el entorno con la respuesta confirmada.</td></tr>
            <tr><td>Concurrencia</td><td>expected_version existe en edición del catálogo; los requests de partida no publican commandId/version esperada del run.</td><td>Tras timeout recuperar por GET, sin reenvío automático. Acordar idempotencia de partida con backend antes de habilitarla.</td></tr>
          </tbody></table></div>
          <p><a href="#patrones">Ver Application Controller + Adapter y el laboratorio del contrato actual</a></p>
          <details><summary>Auditoría histórica del 4–5/11: fases, matriz de paridad y efectos del backend 33cdf8f</summary><div>
          <p class="small muted">Se conserva como evidencia de la revisión anterior. Las afirmaciones sobre endpoints ausentes o lógica de conversación pertenecen a esos cortes, no al servidor ni al frontend revisados el 6/11.</p>
          <div class="note warning"><strong>¿Los efectos de las cartas funcionan?</strong>Parcialmente. Los recursos fijos y los tags de <code>al_obtener</code> funcionan en el cliente. Los pasivos mensuales están implementados en el backend V2 revisado, pero no en el fallback local. Porcentajes y condiciones no tienen paridad completa, y hay habilidades declaradas sin ejecución. La matriz de abajo diferencia cada caso.</div>
          <h3>Cuadro comparativo · frontend y backend</h3>
          <p>Este cuadro compara <strong>funcionalidades y reglas implementadas</strong>, no solo pantallas o nombres de endpoints. «Solo front» puede ser una decisión correcta de presentación o una brecha de lógica; cada fila lo distingue.</p>
          <p class="small muted">Cortes revisados: frontend <code>0f12188</code> y backend <code>33cdf8f</code>. Tener un servicio Python no significa que esté expuesto por la aplicación activa. Esta comparación no certifica el servidor utilizado por la web publicada.</p>
          <div class="tablewrap"><table><caption class="small muted" style="padding:12px;text-align:left">King’s Court · paridad de funcionalidades e integraciones pendientes</caption><thead><tr><th scope="col">Funcionalidad</th><th scope="col">Frontend de King’s Court</th><th scope="col">Backend analizado</th><th scope="col">Estado e integración pendiente</th></tr></thead><tbody>${parityRows.map(([feature, front, back, state, action]) => `<tr><th scope="row" style="text-transform:none;letter-spacing:0;vertical-align:top">${feature}</th><td>${front}</td><td>${back}</td><td><span class="badge ${state.startsWith('Ausente') || state.startsWith('Integración bloqueada') ? 'missing' : state.includes('intencional') ? 'ok' : 'warn'}">${state}</span><p style="margin-top:9px">${action}</p></td></tr>`).join('')}</tbody></table></div>
          ${sources(['FE', game + 'KingsCourt.tsx'], ['FE', game + 'narrativeService.ts'], ['FE', game + 'narrativeFallback.ts'], ['FE', slice], ['FE', 'src/config/adaptacionEdad.ts'], ['BE', 'app/features/narrative/engine/rule_engine.py'], ['BE', 'app/features/narrative/engine/event_director.py'], ['BE', 'app/features/narrative/game/turn_service.py'], ['BE', 'app/features/narrative/game/transition_service.py'], ['BE', 'app/main.py'])}
          ${image('kings-court', 'Formación de la corte', 'Selección inicial de personajes en el modo de prueba de King’s Court.')}
          <h3>Fases y etapas, con sus comprobaciones</h3>
          <p class="muted small">Abrí cada etapa para ver qué hace el jugador, qué comprueba el código, cómo se reparte la responsabilidad y qué criterio de diseño se desprende del flujo. La filosofía es una interpretación del diseño; las comprobaciones se apoyan en los archivos enlazados.</p>
          ${phases.map((p, i) => `<details class="nc-phase" data-stage="${p.id}" ${i === 0 ? 'open' : ''}><summary><b>${p.title}</b><span>${p.phase}</span></summary><div><div class="grid2"><div><h4>Qué hace el jugador</h4><p>${p.play}</p><h4>Checks y transiciones</h4><p>${p.checks}</p></div><div><h4>Arquitectura</h4><p>${p.architecture}</p><h4>Filosofía del recorrido</h4><p>${p.philosophy}</p></div></div><div class="note warning"><strong>Límite a tener en cuenta</strong>${p.caveat}</div>${p.image || ''}${sources(...p.files)}</div></details>`).join('')}
          <h3>Efectos: qué está ejecutándose realmente</h3>
          <p>El modelo usa <strong>disparador → condiciones → acción</strong>. Tener esos campos en el editor no prueba que exista un consumidor para todos. Esta matriz separa frontend local, motor remoto y opciones que solo están declaradas.</p>
          <div class="tablewrap"><table><thead><tr><th>Efecto o mecanismo</th><th>Estado</th><th>Frontend y respaldo</th><th>Backend y límite</th></tr></thead><tbody>${effectRows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
          <h4>Ejemplo concreto: «+10 oro cada mes si pueblo ≥ 40»</h4>
          <pre><code>{
  "disparador": "cada_mes",
  "condiciones": [
    {"tipo": "comparar_recurso", "clave": "pueblo", "operador": ">=", "valor": 40}
  ],
  "accion": {"tipo": "modificar_recurso", "clave": "oro", "valor": 10}
}</code></pre>
          <p>En el motor V2, este efecto se evalúa al avanzar al próximo mes no final y solo actúa si se cumple la condición en ese momento. En una prueba local no se ejecuta automáticamente: <code>avanzarMes</code> solo actualiza el turno. En el mes 12 el backend cierra la partida antes de otro despacho mensual.</p>
          <div class="note"><strong>Evidencia y alcance de la verificación · 5 nov 2026</strong>Se revisaron el frontend <code>0f12188</code> y el backend <code>33cdf8f</code>, los mismos cortes de la guía. Pasaron seis comprobaciones locales del reducer: recurso fijo y límite, tag único, comparación numérica, condición de tag omitida, mensual no ejecutado y porcentaje tratado como fijo. También pasaron 22 tests existentes de narrativa. Las seis comprobaciones fueron una auditoría temporal y no modificaron las reglas del juego. Esto no certifica los efectos del catálogo instalado en producción.</div>
          ${sources(['FE', slice], ['FE', 'admin_src/narrative/CartasTab.jsx'], ['FE', game + 'narrativeFallback.ts'], ['BE', 'app/features/narrative/engine/rule_engine.py'], ['BE', 'app/features/narrative/game/transition_service.py'], ['BE', 'app/features/narrative/enums.py'])}
          <h3>Arquitectura y criterios que conviene conservar</h3>
          <div class="grid2">
            <div class="card"><h4>Una fuente explícita para cada responsabilidad</h4><p><code>KingsCourt</code> coordina. Las vistas de etapa presentan y recogen una intención. Redux conserva el estado local; el servicio habla con la API y adapta grafos. El motor remoto evalúa reglas y persiste. Evitar que una animación, una descripción o un cambio de pantalla vuelvan a aplicar una consecuencia.</p><p>Hoy hay lógica repartida: adquisición y resultados en el slice, demostración en el fallback y reglas ECA en Python. Esa separación exige paridad o una autoridad remota bien reconciliada; no equivale a tres motores idénticos.</p></div>
            <div class="card"><h4>Comprensión antes que cantidad de controles</h4><p>El modo adaptado, si está habilitado, comienza a los 45 años: agranda controles y texto, oculta números y reduce las pérdidas locales a la mitad. También omite el draft mensual visible. Es una regla del cliente, no una propiedad automática de una carta ni una garantía de que el backend aplique el mismo factor.</p><p>La composición del fondo responde a recursos y se muestra entre escenas. La intención es hacer legible una consecuencia antes de presentar la siguiente decisión.</p></div>
          </div>
          <details><summary>Servidor, grafos y prueba local: tres recorridos distintos</summary><div><p>La API por fases y la API por nodos no son intercambiables. <code>adaptarEstadoGrafo</code> convierte nodos en evento, conversación o resultado y filtra opciones no disponibles. <code>avanzarNodo</code> consulta el nuevo estado si cambia el grafo y desactiva el respaldo para esa operación.</p><p>El fallback se permite ante fallo de red, timeout, 5xx o 404 si <code>VITE_NARRATIVE_FALLBACK</code> no vale <code>false</code>; otros 4xx siguen siendo errores. Una fecha que pasó a local sigue local hasta reinicio. Su prueba de seis meses usa consecuencias prefijadas y no reenvía decisiones a MongoDB.</p><p>En el backend fijado en esta guía, <code>app/main.py</code> incluye auth y progreso, no los routers narrativos. Que el motor tenga código no demuestra que sus rutas estén activas. Para afirmar funcionamiento remoto hay que revisar además el servidor realmente desplegado y un catálogo de cartas con efectos estructurados.</p>${sources(['FE', game + 'narrativeService.ts'], ['FE', game + 'narrativeFallback.ts'], ['BE', 'app/main.py'])}</div></details>
          <details><summary>Cómo comprobar una carta sin confundir presentación con ejecución</summary><div><ol><li>Leer el documento guardado: <code>efectos</code>, disparador, condiciones y acción; la descripción es solo texto.</li><li>Registrar recursos, afinidad, tags, inventario, fase y mes antes de obtenerla.</li><li>Ejecutar el disparador correcto una sola vez y comparar el estado después; probar también una condición que no se cumpla.</li><li>Repetir con servidor compatible y en fallback. Para <code>cada_mes</code>, avanzar de un mes no final y comprobar el siguiente saldo.</li><li>Reabrir la partida y contrastar persistencia, historial y límites. Un cambio de imagen no prueba una escritura en la base.</li></ol><p>Las condiciones de adquisición local requieren atención: una condición no numérica omitida puede dar un falso positivo. Los disparadores finales o la amortiguación de daño necesitan implementación antes de presentarse como funcionales.</p></div></details>
</div></details>
        </article>
        <article class="nc-panel nc-coming" id="nc-panel-shooter" role="tabpanel" aria-labelledby="nc-tab-shooter" data-narrative-panel="shooter" hidden>
          <span class="badge warn">Próximamente</span><h3>Shooter por turnos</h3><p>Este espacio queda reservado para documentar el juego cuando tenga una implementación revisada. Todavía no se describen fases, checks, arquitectura ni efectos como si estuvieran disponibles.</p>
        </article>`;

      const buttons = [...this.querySelectorAll('[data-narrative-game]')];
      const choose = (button, focus = false) => {
        buttons.forEach(item => { const on = item === button; item.setAttribute('aria-selected', String(on)); item.tabIndex = on ? 0 : -1; });
        this.querySelectorAll('[data-narrative-panel]').forEach(panel => { panel.hidden = panel.dataset.narrativePanel !== button.dataset.narrativeGame; });
        if (focus) button.focus();
      };
      buttons.forEach((button, index) => {
        button.addEventListener('click', () => choose(button));
        button.addEventListener('keydown', event => {
          const next = { ArrowRight: (index + 1) % buttons.length, ArrowLeft: (index + buttons.length - 1) % buttons.length, Home: 0, End: buttons.length - 1 }[event.key];
          if (next !== undefined) { event.preventDefault(); choose(buttons[next], true); }
        });
      });
    }
  }
  customElements.define('juegos-narrativos', JuegosNarrativos);
})();
