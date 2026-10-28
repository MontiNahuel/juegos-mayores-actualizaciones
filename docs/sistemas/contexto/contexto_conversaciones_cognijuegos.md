# Contexto de conversaciones — CogniJuegos

**Actualizado:** 22 de octubre de 2026  
**Repositorio local:** `C:\Users\lparlavecchio\Documents\proyectos\CogniJuegos`  
**Repositorio remoto documentado:** `juegos-mayores-actualizaciones`

Este documento reúne el contexto persistente del proyecto y los temas confirmables en las conversaciones de Codex/ChatGPT asociadas a **APP JUEGOS / COGNIJUEGOS**. No reemplaza la documentación técnica del código.

## Alcance y fuentes

Se consultaron las conversaciones listadas dentro del proyecto COGNIJUEGOS y tareas de Codex cuya carpeta de trabajo es este repositorio. Algunas conversaciones antiguas solo devuelven mensajes del usuario o resúmenes; por eso se registran únicamente conclusiones observables y no se reconstruyen detalles ausentes.

Fuentes consultadas:

- Conversación **«Corrige error al subir main»**: interfaz del calendario, cambios de diálogo en Kings Court y error de publicación Git.
- Conversación **«Transcripción del PDF»**: pedidos de edición de imágenes; la consulta disponible no incluye respuestas ni suficiente información del PDF.
- Conversación **«Corregir imágenes de cartas»**: existe en el proyecto, pero el contenido no estuvo disponible en la lectura realizada.
- Conversación **«Busca las IP de las cámaras Hik- 蜴»**: pertenece a la misma carpeta local, pero no al proyecto APP JUEGOS; se excluye de este contexto funcional.
- Conversación actual: creación de la skill `caveman` en el perfil personal; no es una dependencia ni parte del producto CogniJuegos.

## Producto y arquitectura

CogniJuegos es una plataforma de juegos de estimulación neurocognitiva orientada a personas mayores. El producto busca una experiencia cálida, clara y accesible, que se perciba como una actividad cotidiana y no como una evaluación clínica.

El frontend documentado es React + TypeScript + Ionic + Capacitor, construido con Vite. Tailwind CSS v4 está disponible. La navegación se centraliza en `src/VISTAS/routes.tsx`; el catálogo y la decisión de navegación viven en `Menu.tsx`, mientras que `MenuCard.tsx` es presentacional. Consultar `docs/contexto_proyecto_y_guia_tecnica_gemini.md` para el mapa técnico amplio y `docs/arquitectura_base_de_datos.md` para el diseño de persistencia MongoDB.

La paleta de referencia del menú principal incluye azul profundo (`#294C6B`), superficies blancas, gris suave y acentos turquesa, coral y lavanda. Priorizar contraste, objetivos táctiles amplios, tipografía legible y diseños responsivos adecuados para adultos mayores.

## Criterios permanentes de implementación

Aplicar los criterios de `docs/sistemas/contexto/criterios_de_cambios.md`:

- Leer el flujo y los componentes existentes antes de modificar; extender lo que ya funciona.
- Mantener los cambios localizados, pequeños y fáciles de revertir.
- Evitar lógica duplicada, efectos React innecesarios y cambios fuera del pedido.
- Conservar las responsabilidades actuales entre Redux, servicios, componentes y CSS.
- Para interfaz o animaciones, considerar escritorio, móvil, scroll, teclado y `prefers-reduced-motion`.
- Antes de entregar cambios de código, ejecutar `npm run build` y `git diff --check`, según la guía del proyecto.

En Kings Court, conservar el flujo narrativo existente y su configuración central por edad. El desplazamiento debe seguir disponible cuando el contenido no entre en pantalla.

## Temas recientes confirmados en conversaciones

### Calendario de desafíos

Se pidió trasladar a la página del calendario la identidad visual del menú principal usando Tailwind. El trabajo consultado armoniza las tarjetas y controles con la paleta del producto, adapta los colores de estado y busca mantener las siete columnas legibles en móvil. El registro muestra modificaciones locales en:

- `src/VISTAS/COMPONENTS/CALENDAR/CalendarCell.tsx`
- `src/VISTAS/COMPONENTS/CALENDAR/CalendarGrid.tsx`
- `src/VISTAS/COMPONENTS/CALENDAR/CalendarHeader.tsx`
- `src/VISTAS/COMPONENTS/CALENDAR/CalendarHeroCard.tsx`
- `src/VISTAS/COMPONENTS/CALENDAR/DailyChallengeCalendar.tsx`
- `src/VISTAS/COMPONENTS/CALENDAR/icons.tsx`
- `src/VISTAS/COMPONENTS/CALENDAR/types.ts`
- `src/theme/variables.css`

El historial consultado registra que `npm run build` terminó correctamente para ese cambio. En el momento de elaborar este documento, esos archivos aparecen modificados localmente; tratar esos cambios como trabajo en curso del usuario y revisarlos antes de editarlos o descartarlos.

### Diálogo narrativo y título de Kings Court

- Se pidió que cambiar el texto del diálogo no altere el tamaño del personaje. La conversación registró un retrato con tamaño fijo según la pantalla y una verificación `git diff --check`.
- También se pidió un brillo muy tenue alrededor del contorno del PNG ornamental del título. El historial registra cambios en `TituloNarrativo.tsx` y `narrativo.css`.
- Mantener el tamaño del retrato estable entre frases y opciones; los cambios de texto no deben causar saltos de escala.
- El halo solicitado es sutil y sigue el contorno de la imagen ornamental.

### Error al subir la rama `main`

La conversación reporta estos comandos sobre un repositorio local bajo `Documents\proyectos`:

```powershell
git remote add origin https://github.com/MontiNahuel/juegos-mayores-actualizaciones.git
git branch -M main
git push -u origin main
```

El `push` respondió `error: src refspec main does not match any`. Este mensaje suele indicar que la rama aún no tiene un commit que Git pueda enviar, aunque hay que inspeccionar el estado real del repositorio antes de recomendar comandos. Confirmar el directorio actual, `git status`, la rama y los remotos; no repetir `git remote add origin` si el remoto ya existe. La conversación visible vuelve luego a tareas de interfaz y no aporta una resolución final del error.

### Imágenes y PDF

Hay pedidos de quitar fondos y mejorar imágenes asociados a una conversación llamada «Transcripción del PDF», pero el historial accesible no permite identificar el documento, las imágenes finales ni el resultado. Pedir el archivo o referencia de nuevo si una tarea futura depende de esos detalles.

## Datos que no deben copiarse a este documento

No incluir contraseñas, tokens, datos de acceso, datos personales de usuarios ni información de infraestructura ajena al producto. En particular, una conversación fuera del proyecto contiene credenciales de un sistema de cámaras y queda deliberadamente excluida.

## Cómo mantener este contexto

Al actualizar este archivo, añadir decisiones confirmadas y estado durable del producto; evitar convertir cada pedido puntual en una regla permanente. Corregir la fecha y las fuentes cuando se actualice, y mantener los detalles técnicos extensos en sus documentos especializados.
