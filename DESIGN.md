---
name: CogniJuegos — menú experimental
description: Una mesa de juegos cognitivos en azules, limitada al menú principal y su navbar.
colors:
  marine-ink: "#15365b"
  marine-hero: "#153f88"
  marine-challenge: "#2056bb"
  cobalt-action: "#2159cf"
  slate-copy: "#4e6680"
  ice-ground: "#edf4fc"
  white-surface: "#fff"
  pale-action: "#edf4ff"
  narrative-surface: "#dceafa"
  cyan-piece: "#b9eeff"
  pale-piece: "#e4edff"
  cyan-focus: "#b7edff"
  blue-focus: "#1f70d1"
  chip-border: "#b7cae1"
typography:
  display:
    fontFamily: "Nunito Sans, Segoe UI, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Nunito Sans, Segoe UI, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Nunito Sans, Segoe UI, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Nunito Sans, Segoe UI, sans-serif"
    fontSize: "1rem"
    lineHeight: 1.55
  label:
    fontFamily: "Nunito Sans, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    lineHeight: 1.5
rounded:
  mini-cell: "5px"
  game-action: "9px"
  control: "10px"
  panel: "16px"
  chip: "24px"
spacing:
  compact: "8px"
  control: "10px"
  inline: "16px"
  grid: "20px"
  section: "24px"
  panel: "26px"
  generous: "32px"
  page: "36px"
  hero: "40px"
components:
  button-light:
    backgroundColor: "{colors.white-surface}"
    textColor: "#184897"
    rounded: "{rounded.control}"
    padding: "12px 20px"
  button-play:
    backgroundColor: "{colors.pale-action}"
    textColor: "#194fac"
    rounded: "{rounded.game-action}"
    padding: "9px 16px"
  button-narrative:
    backgroundColor: "{colors.cobalt-action}"
    textColor: "{colors.white-surface}"
    rounded: "{rounded.game-action}"
    padding: "9px 16px"
  chip:
    backgroundColor: "transparent"
    textColor: "#284c75"
    rounded: "{rounded.chip}"
    padding: "9px 20px"
  chip-selected:
    backgroundColor: "{colors.cobalt-action}"
    textColor: "{colors.white-surface}"
    rounded: "{rounded.chip}"
    padding: "9px 20px"
  game-card:
    backgroundColor: "{colors.white-surface}"
    textColor: "{colors.marine-ink}"
    rounded: "{rounded.panel}"
    padding: "26px"
  navbar:
    backgroundColor: "{colors.white-surface}"
    textColor: "{colors.marine-ink}"
    padding: "16px 36px"
---

# Design System: CogniJuegos — menú experimental

## Overview

**Creative North Star: "La mesa de juegos cognitivos"**

Un espacio amable y lúdico para público general, con azules cognitivos, piezas reconocibles y controles claros. El tono cercano en español acompaña la elección de juegos sin inventar recompensas, progreso ni beneficios clínicos. La identidad ASISTODO conserva su logo existente.

Este sistema experimental describe exclusivamente el menú principal y la navbar activada por `menuPrincipal`. No establece una migración visual para los juegos, sus calendarios, el editor narrativo ni el modal de autenticación. La implementación final en `src/VISTAS/MENU/Menu.css` y sus componentes es la fuente de esta documentación.

**Key Characteristics:**
- Fondo azul hielo, superficies blancas y bienvenida marina.
- Nunito Sans legible, jerarquía clara y controles cómodos.
- Tableros pequeños de letras y números como firma visual.
- Puntos y racha reales; composición que envuelve en pantallas estrechas.

## Colors

Azules marinos y cobalto dan estructura; celestes y cian hacen visibles las piezas de juego. Los valores normativos están en el frontmatter.

### Primary
- **Marine Ink:** títulos, marca y texto principal.
- **Marine Hero / Marine Challenge:** dos planos contiguos de la bienvenida.
- **Cobalt Action:** filtro seleccionado y acción narrativa.

### Secondary
- **Cyan Piece / Pale Piece:** piezas del hero y tableros en miniatura.
- **Cyan Focus / Blue Focus:** selección de texto y foco visible adaptado al fondo.

### Neutral
- **Ice Ground:** fondo del contenido.
- **White Surface:** navbar, tarjetas clásicas y botón del hero.
- **Slate Copy:** descripciones y textos secundarios.
- **Pale Action:** botones de juegos y contador de puntos.
- **Narrative Surface:** tarjeta narrativa de ancho completo.
- **Chip Border:** contorno de filtros sin seleccionar.

**The Real Progress Rule.** Puntos y racha representan los datos de cuenta existentes; nunca se dibujan premios ni avances ficticios.

## Typography

**Display Font:** Nunito Sans, con Segoe UI y sans-serif como alternativas.
**Body Font:** la misma familia, sin segundo sistema tipográfico.

La variante variable se aloja en `src/assets/fonts/NunitoSans-Variable.ttf`, con licencia OFL en el mismo directorio y `font-display: swap`. La familia está limitada al menú y su navbar.

### Hierarchy
- **Display:** título principal; baja a 2.375rem hasta 1000px y a 2rem hasta 767px.
- **Headline:** título del catálogo; baja a 1.625rem hasta 767px.
- **Title:** nombres de juegos; los títulos de grupo usan 1.25rem, peso 700 y altura 1.3.
- **Body:** descripciones de tarjetas; las descripciones de sección usan altura 1.5. Ambas limitan su longitud a 65ch.
- **Label:** habilidad de cada juego. La navbar usa 15px para acciones y cifras; las cifras usan números tabulares.
- **Hero supporting text:** introducción a 1.125rem y altura 1.6, reducida a 1rem en móvil. El título del desafío usa 1.75rem y altura 1.2, reducido a 1.5rem en móvil.

## Layout

Contenido y navbar comparten un ancho máximo de 1180px, centrado. El contenido usa laterales de 36px en escritorio y 20px hasta 767px, con espacio inferior que contempla `safe-area-inset-bottom`. El hero divide su espacio en 1.15fr / 1fr; el catálogo presenta dos columnas iguales con separación de 20px. La tarjeta narrativa ocupa ambas columnas.

Hasta 1000px desaparece el saludo de la navbar; tarjetas y hero reducen su relleno. Hasta 767px, hero y catálogo pasan a una columna, la separación del catálogo baja a 16px y el pie se apila. Los filtros siempre envuelven. La navbar y sus acciones también envuelven: puede crecer verticalmente para preservar los contadores. En móvil se ocultan los textos auxiliares de sesión, puntos y días, conservando cifras y etiquetas accesibles. Hasta 359px se reducen laterales, separación y ancho de las miniaturas.

**The Menu Boundary Rule.** Aplicar estos patrones dentro del menú y su navbar; cualquier extensión a otros destinos requiere una decisión explícita de diseño.

## Elevation & Depth

Las superficies principales son planas: separación tonal, contraste de fondos y espacio producen profundidad sin sombras de tarjeta. Las piezas del hero tienen una sombra suave (`0 5px 12px #123b8666`) que refuerza su carácter tangible. La navbar declara `box-shadow: none` y se separa con una línea azul clara.

**The Piece Depth Rule.** La sombra pertenece a las piezas del hero; las tarjetas del catálogo permanecen planas.

## Shapes

Paneles de esquinas cómodas, botones compactos y filtros redondos. Las celdas usan radios pequeños; los botones de juego y piezas del hero comparten radio de 9px, los controles generales 10px y hero/tarjetas 16px. Los filtros usan 24px. El hero recorta sus dos fondos con `overflow: hidden`.

Los tableros se inclinan −5° y las letras del hero −4°; piezas alternas se desplazan verticalmente. Son formas construidas con HTML/CSS, sin imágenes rasterizadas. Se conserva el SVG del logo de ASISTODO.

## Components

### Buttons

Acciones claras con texto en peso 700 y flecha direccional. El botón claro del hero tiene altura mínima de 48px; las acciones de tarjeta, 44px. El botón de tarjeta se oscurece al pasar y presionar; su estado deshabilitado usa fondo gris claro y texto apagado. La acción narrativa usa cobalto y texto blanco.

El foco de botones y enlaces es un contorno de 3px separado 4px; cambia a cian dentro del hero. El código no añade animaciones ni transiciones.

### Chips

Filtros por habilidad con borde de 1px, altura mínima de 44px y selección expresada mediante `aria-pressed`. El seleccionado usa cobalto con texto blanco; el reposo tiene fondo transparente y el hover un lavado azul claro. En móvil, el relleno horizontal baja de 20px a 16px.

### Cards / Containers

Tarjetas clásicas blancas, sin sombra, con ilustración a la izquierda y texto/acción a la derecha. Su cuadrícula interna parte de 104px / espacio restante y separación de 22px. Hasta 1000px usa 76px y separación de 18px; hasta 359px usa 60px y separación de 14px. El botón se mantiene al final de la columna de texto. La variante narrativa usa un plano azul claro y un icono de personas.

### Navigation

Logo existente, marca y subtítulo a la izquierda; saludo flexible y acciones a la derecha. Puntos sobre un fondo azul pálido, racha autenticada con icono y botón de sesión blanco con borde. La altura es mínima, nunca fija: 88px en escritorio y 78px en móvil. El estado de carga de puntos muestra una elipsis y tiene etiqueta accesible. `LoginHeader` conserva los datos reales y el comportamiento de inicio/cierre de sesión.

### Miniature boards

Wordle muestra cinco letras, con una pieza elevada y cobalto; sopa de letras, sudoku y crucigrama usan nueve celdas. Cian, azul pálido y vacíos oscuros identifican cada juego. Las miniaturas y las letras del hero son decorativas (`aria-hidden`); el nombre y la habilidad permanecen como texto real.

## Do's and Don'ts

### Do:
- **Do** conservar la identidad ASISTODO y la voz cercana en español.
- **Do** mantener los contadores reales y permitir que la navbar envuelva.
- **Do** usar texto legible, foco visible y controles de al menos 44px en este menú.
- **Do** preservar las miniaturas de letras y números como ilustraciones decorativas.

### Don't:
- **Don't** aplicar este experimento a los juegos o calendarios por extensión automática.
- **Don't** inventar recompensas, progreso ni afirmaciones clínicas.
- **Don't** añadir sombras a las tarjetas a partir de la sombra de las piezas del hero.
- **Don't** sustituir el logo existente ni presentar un icono sin nombre accesible como único control.
