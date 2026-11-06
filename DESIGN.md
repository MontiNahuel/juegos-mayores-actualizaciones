---
name: CogniJuegos — menús cognitivos
scope: Menú principal, calendarios y navbar compartida
colors:
  ground: "#151e2b"
  surface: "#2a394c"
  narrative-surface: "#2e3c50"
  navbar: "#1b2737"
  text: "#f3f6fa"
  secondary: "#c0cbd7"
  border: "#52647b"
  mint: "#99dcd1"
  peach: "#f0bb98"
  lavender: "#c8bbf0"
  sky: "#a8ccef"
  gold: "#ecd098"
  focus: "#f3d894"
typography:
  display:
    fontFamily: "Nunito Sans, Segoe UI, sans-serif"
    fontSize: "2.125rem"
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: "Nunito Sans, Segoe UI, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Nunito Sans, Segoe UI, sans-serif"
    fontSize: "1rem"
    lineHeight: 1.55
rounded:
  panel: "16px"
  button: "9px"
---
# Diseño de los menús de CogniJuegos

## Overview
El menú principal es la referencia visual: identidad cognitiva oscura, legible y tranquila, con pequeños estímulos que invitan a jugar. Prioriza personas mayores, acciones claras y progreso real. Se evita el azul saturado en todas las superficies para que los juegos no se mezclen con el fondo.

**Alcance de esta etapa:** menú principal y navegación de calendarios. No rediseñar tableros, controles, resultados ni mecánicas de juego. La navbar de los juegos también comparte el diseño oscuro del menú, conservando indicadores, puntos y bombilla. **King’s Court queda sin cambios**, incluido su arte, su miniatura y su shuffle existentes.

## Colors
- Fondo compartido `--app-background: #151e2b` para el menú, calendarios y fallback global; tarjetas `#2a394c`, borde `#52647b`. La tarjeta narrativa existente usa `#2e3c50`.
- Navbar oscura `#1b2737`, divisor `#364454`, texto principal `#f3f6fa` y secundario `#c0cbd7`.
- Los acentos identifican juegos: menta para palabras, durazno para sopa de letras, lavanda para Sudoku, celeste para crucigrama y dorado para narrativa. No significan éxito o error.
- Acciones Jugar: fondo del acento y texto `#172433`; hover mezcla el acento con 18% de blanco.
- Foco de teclado: contorno dorado de 3px y separación de 4px en menús.

## Typography
Nunito Sans local, con su licencia OFL. Título de menú 2.125rem/700, reducido a 1.75rem en móvil; título de tarjeta 1.5rem/700; cuerpo y habilidad 1rem. Interlineado de cuerpo 1.55. No usar mayúsculas extensas ni texto pequeño como información esencial.

## Layout
Contenedor de 1180px. Menú con dos columnas en escritorio y una debajo de 768px. Encabezado compacto, clásicos y narrativa. No agregar filtros para cinco juegos, contadores irrelevantes, banners repetidos ni categorías vacías.

En móvil, la miniatura acompaña al título; descripción a todo el ancho y botón compacto de al menos 116 × 48px. Respetar los safe areas. La navegación permite títulos largos sin recortarlos y los indicadores de cuenta pueden bajar a otra fila.

## Elevation & Depth
Superficies planas y separación tonal con borde de 1px. No introducir halos, sombras duras ni elevación exagerada para destacar tarjetas.

## Shapes
Paneles con radio de 16px. Botones Jugar con radio de 9px; controles de sesión de 10px. Mantener áreas táctiles cómodas sin estirar las acciones a todo el ancho de la tarjeta.

## Components
### Navbar única
`AppNavbar` es la única implementación de `IonHeader`/`IonToolbar`. `NavbarView` define los contextos:

| Estado | Contenido | Tema en esta etapa |
| --- | --- | --- |
| `menu` | Marca, saludo, racha/saldo y acceso/salida | Oscuro, referencia principal |
| `calendar` | Regreso, título y progreso real si hay sesión | Oscuro, coherente con el menú |
| `game` | Regreso, título, indicadores, puntos animados y acciones del juego | Oscuro, igual que el menú |

`useNavbarSession` es el único controlador de acceso, modal y sincronización mediante `storage`/`user_progress_updated`. El saldo proviene de `PlayerEconomyContext`. Todos los juegos, calendarios, menú y resultados usan `AppNavbar` directamente. Se elimina `GameHeader`; la navbar común incorpora la bombilla y sus estados mediante `onHint`/`hintDisabled`.

Documentación del contrato y estados: `src/VISTAS/COMPONENTS/Navbar/README.md`.

### Tarjetas y movimiento existente
Conservar títulos, descripciones y rutas reales. Cada miniatura clásica demuestra su juego al entrar al 65% en pantalla y se rearma al salir completamente. No mover tarjetas ni controles. Reduce Motion conserva feedback suave de color/opacidad sin desplazamiento. La miniatura narrativa conserva la implementación existente; no se modifica en esta etapa.

## Do's and Don'ts
- Mantener contraste, lectura clara, foco visible y etiquetas explícitas.
- Mostrar racha y saldo únicamente si hay sesión; no inventar progreso ni promesas médicas.
- Reutilizar `AppNavbar` con un contexto tipado; no crear otra navbar para una pantalla nueva.
- Implementar estructura y estados con Tailwind; reservar CSS para fuente, integración Ionic, foco y animaciones.
- Los tokens de menú están en `src/theme/variables.css`. Las utilidades de títulos tienen prioridad explícita frente a la tipografía de Ionic.
- Aplicar esta guía primero a los menús. No extenderla a los juegos ni tocar King’s Court sin una instrucción posterior.
