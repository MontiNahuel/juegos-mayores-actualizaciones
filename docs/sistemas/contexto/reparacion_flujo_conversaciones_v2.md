# Continuidad visual de conversaciones V2

## Qué mostró el historial

- `10d47a1` introdujo la conversación como escena: un fondo y un título,
  retratos con tamaño estable y lectura local de frases. El panel permanecía
  montado entre frases para no repetir su entrada.
- `4cd8763` mantuvo esa continuidad y añadió el fundido entre retratos usando
  opacidad y visibilidad. El diseño adapta uno o dos retratos al espacio real.
- `b8632a1` consolidó la migración al motor V2. El adaptador entrega una frase
  por nodo y el backend resuelve las opciones y el siguiente paso.
- En `90e0770`, la clave de la pantalla de conversación incluía `nodo_id`.
  Cada respuesta V2 desmontaba toda la escena: se perdían los retratos y volvían
  a empezar las demoras del fondo, título y panel. El adaptador además convertía
  al hablante actual en el único requisito, perdiendo el orden del reparto.

## Reparación

La identidad de la escena es `grafo_id` (`conversacion._id` en la vista).
La identidad de la intervención es `nodo_id` más el índice de frase local.
React conserva la escena y sólo renueva el contenido del panel al cambiar
la intervención. No se incorpora una librería ni un segundo motor narrativo.

El servicio conserva los requisitos si el servidor los incluye. Redux acumula
los participantes recibidos de la misma conversación en orden de entrada;
una conversación diferente inicia otro reparto. No se consultan catálogos
administrativos ni se anticipan ramas del grafo. Si el servidor sólo entrega
al hablante, los demás aparecen cuando efectivamente intervienen.

Los retratos conservan su tamaño entre intervenciones. El texto se revela con
escritura, fundido y desplazamiento coordinados; con movimiento reducido aparece
completo. El panel recupera su inicio
y el foco al cambiar de intervención. Se desactiva el anclaje del scroll para
que el navegador no arrastre la nueva frase hacia las opciones anteriores.

La respuesta se bloquea mientras su petición está en curso; ante un error,
la intervención permanece y permite reintentar. Una conversación confirmada
limpia el resultado anterior para que no siga ocultándola.

## Validación

Pruebas de servicio, reducer y pantalla: reparto, identidad del DOM entre nodos,
lectura local y retorno a un nodo, narrador, bloqueo de doble respuesta,
reintento, foco y scroll. Se conservan las pruebas de continuación mensual.

Revisión visual con una escena de prueba y arte local en 1440×900, 425×595,
390×844 y 390×600, incluyendo lectura ampliada, opciones largas y teclado.
No se verificó una partida contra un backend activo. La escena de prueba fue
temporal y no forma parte de las rutas del producto.

En Node con Web Storage experimental, las pruebas se ejecutan con:
`NODE_OPTIONS=--no-experimental-webstorage npm run test.unit -- --run src/VISTAS/JUEGOS/NARRATIVO`.

## Pasada de legibilidad

Se nombraron los tipos de personajes, decisiones y props, se separó el encuadre
del retrato del marcado y se reemplazaron comentarios automáticos por comentarios
de intención. KingsCourt ya no conserva el estado ni la pantalla local de
consecuencias que habían quedado sin uso tras V2. Los reducers usados por la
prueba local se mantienen.

La imagen del retrato usa su URL como identidad: si falló y el lugar pasa a otro
personaje, la imagen nueva no hereda el estado oculto de la anterior.
La guía HTML distingue esta reparación implementada de la propuesta del
coordinador del 6/11, que sigue siendo material de referencia.

## Iteración de fondos y movimiento con Impeccable

El salón `public/assets/narrative/conversation-hall.png` conserva el mismo blob
que en `10d47a1`, pero funciona como respaldo: si el nodo V2 trae imagen, se usa
esa imagen. El adaptador no confunde la portada general del grafo con el fondo
del nodo. Una respuesta sin imagen y una descarga fallida usan el salón.
El salón está entre los recursos de la precarga inicial.
La consulta a la caché admite un respaldo explícito: un 404 detectado durante la
precarga tampoco se convierte en un píxel transparente en lugar del salón.

`FondoConversacion` mantiene como máximo dos imágenes: la visible y la entrante.
La nueva empieza oculta, se revela al cargar y retira la anterior cuando el
coordinador GSAP confirma su fundido de 420 ms. Una carga atrasada no confirma un nodo más reciente. Si
falla también el respaldo, la lectura sigue disponible. Las capas se identifican
por URL y no duplican el resto de la escena.

El historial sirve como referencia de intención, no como receta de tiempos.
La nueva entrada presenta retratos desde 320 ms durante 480 ms y diálogo desde
620 ms durante 360 ms. El título acompaña durante 2600 ms. La escena está lista
para leer en menos de un segundo y no repite su introducción entre nodos.
La alternancia de retratos usa opacidad durante 320 ms y conserva el color,
sin animar un filtro sobre las ilustraciones. El texto queda limitado a 72ch
y el interior del panel a 1100 px en pantallas amplias.

Con movimiento reducido no hay demoras ni interpolación: fondo, retratos, diálogo
e intervención pasan directamente al estado final. El título conserva una
permanencia de 2500 ms. La misma secuencia
se respeta con lectura ampliada.

## Coordinación de animaciones: Mediator + GSAP

`CoordinadorAnimacionConversacion` recibe cambios visuales y la carga de una
imagen. Es el único objeto que crea y cancela las animaciones de esta escena.
Los componentes conservan datos y disponibilidad de recursos; los efectos
visuales no envían decisiones ni avanzan la partida.

Se usa GSAP, ya instalado, y `@gsap/react`. El hook `useAnimacionesConversacion`
crea el coordinador dentro de `useGSAP` y lo destruye al desmontar. Su contexto
GSAP registra también las animaciones creadas por eventos de carga posteriores.
Los selectores están limitados a la raíz de esa conversación.

Hay tres secuencias con responsabilidades distintas:

- Entrada: timeline con etiquetas `titulo`, `personajes` y `lectura`. Se crea una
  vez, cuando el fondo y el marco del título están disponibles, incluso si alguno
  tuvo que usar su respaldo. Los tiempos viven en `RITMO`.
- Intervención: al cambiar texto, hablante o disposición, cancela la secuencia
  anterior con `kill()`, conserva el valor visual actual y anima el nuevo objetivo.
  No reinicia la entrada ni altera las dimensiones de los retratos.
- Fondo: conserva la capa anterior mientras carga la siguiente; su retiro se
  confirma en `onComplete` de GSAP. Al cambiar el recurso se cancela la confirmación
  pendiente. No depende de `animationend` ni de un temporizador de React.

`gsap.matchMedia` observa movimiento reducido. Si cambia durante una animación,
se completan las secuencias pendientes y los siguientes cambios son inmediatos.
Volver al modo normal no repite la presentación. La salida revierte timelines,
estilos y contextos para tolerar StrictMode y evitar callbacks después del cierre.

Las conversaciones ya no ejecutan fades CSS simultáneos a GSAP. El CSS conserva
layout, foco y ocultación de imágenes pendientes; las animaciones compartidas de
eventos y resultados siguen con su implementación propia.

Validación específica: reemplazo de intervención sin reiniciar entrada,
confirmación de una sola imagen, cambio de preferencia durante el fundido,
limpieza de callbacks/estilos y aislamiento de otra escena montada.
Referencias: https://gsap.com/resources/React/ y https://gsap.com/docs/v3/GSAP/Timeline/.

## Lectura progresiva integrada · 10 nov 2026

El Mediator coordina ahora la escritura junto con el fundido y el desplazamiento
del cuerpo del diálogo. Se ejecutan en la misma timeline: no hay intervalos ni
un render de React por letra. `RITMO.texto` agrupa velocidad (28 grafemas por
segundo), fundido (240 ms), desplazamiento (4 px), scroll (220 ms) y margen inferior.
La primera frase espera a la entrada del panel; las siguientes empiezan en su
intervención sin repetir la introducción.

La escritura usa `Intl.Segmenter` y `textContent`: tildes, caracteres combinados
y emoji aparecen completos y el relato nunca se interpreta como HTML. Un cursor
invisible permite seguir la línea activa. Sólo se crea un nuevo tween de scroll
cuando cambia de línea y hace falta desplazar el panel. El fundido, el movimiento
y la escritura comparten el ritmo del coordinador. Si el jugador usa rueda,
tacto o teclas de desplazamiento, el seguimiento automático se pausa hasta la
próxima intervención.

Tocar cualquier parte del área del texto acelera su timeline a 4× (+300%), sin
completar la frase de golpe ni avanzar el nodo. Los toques repetidos no acumulan
multiplicadores; la siguiente frase vuelve al ritmo normal. El scroll acompaña
la misma velocidad. Las decisiones se vuelven visibles al completar la lectura; mientras
tanto se mantienen inertes y deshabilitadas, reservando su espacio. En frases
intermedias, una vez terminada la escritura, otro toque permite continuar. No hay avance automático.

La reserva CSS del texto completo evita cambios de altura. El texto visual es
`aria-hidden`; un único texto completo permanece disponible para lectores de
pantalla, sin anunciar cada letra. Nombre e indicación de lectura permanecen
visibles durante el scroll. El cuerpo del texto conserva su elemento al terminar la última frase: cambiarlo
por otro contenedor borraba lo escrito por GSAP. El botón de la guía ofrece la misma acción para teclado, pero todo el área
de lectura responde al toque; tabular no desplaza un botón del
alto de toda la frase. Su espacio se reserva también al finalizar.

Los componentes compartidos declaran `animacionExterna` para no ejecutar fades
CSS al mismo tiempo que GSAP. El modo de movimiento reducido omite escritura,
fundido, desplazamiento y seguimiento, manteniendo el texto completo desde el
principio. Cambiar la preferencia durante la lectura completa lo pendiente.

Pruebas específicas: aceleración a 4× sin avance ni finalización instantánea, decisiones bloqueadas durante la
escritura, preservación del nodo de texto al finalizar, grafemas completos,
fundido/desplazamiento simultáneos, scroll de la línea, pausa manual, reemplazo
de frase y cancelación de la lectura anterior.

La aceleración se aplica con `timeScale` a la escritura y al scroll pendiente.
Sólo `touchmove`, rueda o teclas de desplazamiento pausan el seguimiento: un
simple toque para acelerar no lo desactiva. El gesto no afecta las opciones,
que siguen inertes hasta terminar la frase. El botón de teclado detiene la
propagación para que su acción se ejecute una sola vez.
