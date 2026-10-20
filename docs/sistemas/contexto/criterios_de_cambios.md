# Contexto permanente para cambios en CogniJuegos

## Objetivo principal

Realizar siempre la menor cantidad de cambios posible. Cada ajuste debe conservar el comportamiento previo que ya funciona y respetar la arquitectura existente antes de introducir componentes, estados, efectos o abstracciones nuevas.

## Reglas obligatorias

1. Leer primero el flujo y los componentes existentes; extenderlos en lugar de reemplazarlos.
2. Mantener cada cambio pequeño, localizado y fácil de revertir.
3. Evitar duplicar reglas: los valores configurables deben vivir en una única configuración o variable derivada.
4. No agregar efectos React para resolver acciones de usuario si la misma acción puede ejecutarse en el evento o respuesta que la origina.
5. Comentar brevemente toda regla nueva, indicando por qué existe y qué variable debe modificarse.
6. Mantener las responsabilidades actuales de Redux, servicios, componentes y CSS; no trasladar lógica entre capas sin necesidad.
7. No modificar archivos ajenos al pedido ni reformatear código sin relación con el cambio.
8. Verificar desktop, mobile, scroll, navegación por teclado y `prefers-reduced-motion` cuando haya UI o animaciones.
9. Ejecutar `npm run build` y `git diff --check` antes de entregar.

## Kings Court

- Conservar el flujo narrativo previo al selector de edad tanto como sea posible.
- La edad genera una configuración central; la interfaz consume esa configuración sin repetir umbrales.
- El modo para adultos mayores debe simplificar sin crear un flujo paralelo.
- Las cifras del juego pueden ocultarse, pero la edad configurada sigue siendo visible y editable.
- Las cartas mensuales pueden omitirse visualmente, pero cualquier requisito técnico del backend debe resolverse dentro del flujo existente.
- El scroll debe estar permitido cuando el contenido no entra; primero se intenta aprovechar el alto disponible sin comprimir imágenes hasta volverlas ilegibles.
- Las conversaciones conservan las herramientas globales: mazo, edad y salida de prueba.

## Criterio de entrega

Si una solución requiere muchos cambios, revisar primero si puede lograrse con una prop, una variable CSS, una función pequeña o una rama en el punto donde ya llega la información.
