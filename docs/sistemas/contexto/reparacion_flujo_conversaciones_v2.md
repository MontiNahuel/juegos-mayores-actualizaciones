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

Los retratos conservan las transiciones y el tamaño originales. El texto nuevo
entra en 240 ms; con movimiento reducido, en 1 ms. El panel recupera su inicio
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
