# Propuesta de Proyecto: Suite de Estimulación Cognitiva y Prevención del Deterioro

Este documento recopila el marco conceptual, las mecánicas de juego recomendadas, la integración de pasatiempos clásicos y las pautas de diseño para el desarrollo de una plataforma interactiva orientada a la estimulación neurocognitiva y la prevención del deterioro cognitivo en adultos mayores.

---

## 1. Matriz Resumen de Opciones de Juego

| Minijuego | ¿Cómo es el juego? (Mecánicas y Dinámica) |
| :--- | :--- |
| **1. La Despensa y el Mercado** | Se presenta una lista de compras con cantidades y precios que luego se oculta. El jugador recorre pasillos virtuales seleccionando los artículos correctos sin repetir y, en la caja, debe calcular y entregar el dinero exacto según su presupuesto. |
| **2. La Ruta Postal** | En el centro de la pantalla se muestra brevemente un vehículo o carta (milisegundos) mientras en la periferia destella un buzón. El usuario debe identificar el objeto central y señalar la dirección periférica exacta donde apareció el buzón. |
| **3. El Semáforo de la Huerta** | Frutas desfilan hacia una canasta. El jugador debe tocar la pantalla rápidamente al ver ciertas frutas (ej. *"manzanas rojas"*) y contener la respuesta ante distractores o penalizaciones (ej. *"limones o fruta con hojas"*). La regla cambia periódicamente para forzar flexibilidad. |
| **4. El Desván del Recuerdo** | Actividad de reminiscencia y lenguaje: completar refranes populares con palabras faltantes, emparejar fotos u objetos de época con sus nombres y asociar canciones o hechos históricos. |
| **5. El Director de Orquesta** | Juego rítmico dual: con una mano se marca el pulso musical sobre la pantalla, mientras con la otra se clasifican o arrastran notas de colores hacia diferentes atriles según su altura y forma. |
| **6. El Taller del Restaurador** | Piezas de azulejos, mosaicos o platos antiguos rotos deben ser rotadas y arrastradas suavemente para reconstruir la pieza original, estimulando la percepción espacial y el encastre. |
| **7. Crucigrama Temático Adaptado** | Crucigrama con definiciones culturales y cotidianas. En lugar de un teclado completo, al tocar una celda se presentan 6 a 8 opciones de letras grandes para evitar errores por motricidad fina. |
| **8. Mini-Sudoku (Lógico / Visual)** | Cuadrículas reducidas (4x4 o 6x6) que pueden jugarse tanto con números como con iconos visuales (frutas, formas geométricas) para deducir patrones sin generar fobia al cálculo. |
| **9. Palabra Oculta (Estilo Wordle)** | El jugador tiene varios intentos para descubrir una palabra de 4 o 5 letras mediante pistas de colores (letra correcta, letra desubicada, letra ausente), complementado con pistas progresivas en caso de atasco. |

---

## 2. Detalle de los Juegos Clínicos / Ecológicos

### 1. La Despensa y el Mercado
* **Dominio principal:** Memoria de trabajo, memoria prospectiva y cálculo funcional.
* **Justificación ecológica:** Imita una actividad cotidiana básica para la independencia y autonomía en el hogar.
* **Mecánica:**
  * Fase de memorización: lista de 3 a 5 ingredientes (ej. *2 manzanas, 1 leche, 1 pan*).
  * Fase de compra: navegación visual intuitiva; el jugador debe descartar productos señuelo o con nombres parecidos.
  * Fase de caja: gestión de monedas o billetes virtuales para pagar el total.

### 2. La Ruta Postal (Velocidad de Procesamiento y UFOV)
* **Dominio principal:** Velocidad de procesamiento visual y Campo Visual Útil (*Useful Field of View* - UFOV).
* **Fundamento científico:** Basado en el protocolo del estudio clínico **ACTIVE** (NIH), el cual demostró que el entrenamiento del UFOV reduce a largo plazo la tasa de conversión a demencia.
* **Mecánica:**
  * Estímulo dual simultáneo durante 100 a 500 ms.
  * Tarea central: discriminar forma o color del objeto en foco.
  * Tarea periférica: localización espacial en visión periférica.
  * Dificultad adaptativa: el tiempo de exposición se ajusta en milisegundos según los aciertos del jugador.

### 3. El Semáforo de la Huerta (Control Inhibitorio & Go / No-Go)
* **Dominio principal:** Funciones ejecutivas, control inhibitorio y flexibilidad cognitiva.
* **Mecánica:**
  * Tarea constante de toma de decisiones rápidas: responder ante el estímulo diana (*Go*) y frenar la respuesta motora automática ante estímulos distractores (*No-Go*).
  * Cambio de regla sorpresivo (*Task Switching*): la señal sonora o visual invierte las condiciones de cosecha.

### 4. El Desván del Recuerdo (Terapia de Reminiscencia)
* **Dominio principal:** Memoria semántica, evocación léxica y memoria biográfica.
* **Mecánica:**
  * Preguntas contextualizadas por década o entorno sociocultural (música tradicional, objetos cotidianos de los años 50-80, dichos populares).
  * Fomenta emociones positivas y reduce la ansiedad ante el entrenamiento cognitivo.

### 5. El Director de Orquesta (Dual-Tasking)
* **Dominio principal:** Atención dividida y coordinación visuomotora.
* **Fundamento científico:** Inspirado en investigaciones de estimulación dual (como *NeuroRacer* de Adam Gazzaley), fundamentales para la prevención de caídas y la preservación de la multitarea.
* **Mecánica:** Coordinación bimanual o estímulo audio-visual cruzado.

### 6. El Taller del Restaurador (Visoespacial y Gnosias)
* **Dominio principal:** Razonamiento visoespacial, rotación mental y praxias constructivas.
* **Mecánica:** Encastre tipo rompecabezas o tangram simplificado, con retroalimentación magnética suave para no penalizar el temblor de pulso.

---

## 3. Integración de Juegos Clásicos: Crucigrama, Sudoku y Wordle

### ¿Tiene sentido incorporarlos?
**Sí, absolutamente.** Aunque no sustituyen a las mecánicas de velocidad de procesamiento, cumplen un rol estratégico vital:

1. **Alta adherencia y creación de hábito:** Muchos adultos mayores rechazan las pruebas clínicas porque parecen evaluaciones médicas. En cambio, los crucigramas y sudokus son parte de su rutina de ocio y les generan confianza.
2. **Reserva Cognitiva:** Estudios longitudinales (ej. estudio *PROTECT*, Universidad de Exeter / King's College) evidencian que los pasatiempos regulares de palabras y números se asocian con cerebros biológicamente más jóvenes.
3. **Estrategia "Caballo de Troya":** El usuario entra a la aplicación motivado por resolver su crucigrama o su palabra del día. La plataforma aprovecha esa sesión para intercalar 3 a 5 minutos de ejercicios de velocidad periférica o memoria de trabajo.

### Pautas de Adaptación para Evitar la Frustración:
* **Crucigrama:**
  * Evitar teclados QWERTY diminutos.
  * Usar bancos de letras reducidos (6-8 letras en pantalla) al tocar cada celda.
  * Contenido con definiciones directas, sin juegos de palabras excesivamente crípticos.
* **Sudoku:**
  * Iniciar con formatos **4x4** o **6x6** con pistas lógicas visibles.
  * Modo visual alternativo (sustituir números por colores, frutas o notas musicales) para personas con bloqueo ante las matemáticas.
* **Wordle / Palabra Oculta:**
  * Modo de 4 letras para nivel inicial y 5 letras para avanzado.
  * Teclado en pantalla con teclas de gran formato y alto contraste.
  * Botón de ayuda que desbloquea una consonante o vocal tras el 3.er fallo consecutivo.

---

## 4. Principios de Accesibilidad y Diseño UX/UI

Para garantizar que la experiencia sea terapéutica y no estresante:

* **Zero-Frustration Design (Diseño sin penalización):**
  * Prohibidos los sonidos estridentes de error o cruces rojas gigantescas.
  * Si el usuario se equivoca, la respuesta es constructiva (*"¡Casi! Probemos de nuevo"* o *"Aquí tienes una pista"*).
* **Dificultad Dinámica Adaptativa (Escalera o Staircase):**
  * 3 aciertos seguidos elevan sutilmente el desafío; 1 fallo reduce la velocidad o simplifica los distractores.
* **Ergonomía Táctil y Visual:**
  * Botones con área táctil mínima de 60x60 px.
  * Cumplimiento de contraste WCAG AAA.
  * Priorizar toques directos (*taps*) sobre gestos complejos de arrastre prolongado o pellizco.
  * Soporte de instrucciones por audio con voz clara y ritmo pausado.

---

## 5. Arquitectura Sugerida para el Proyecto

1. **Formato:** Web App Progresiva (PWA) optimizada para Tablets (10 pulg. o más), accesible vía enlace web sin requerir instalaciones complejas.
2. **Frontend:** React / Vite con librerías de interfaz ligeras y soporte de Canvas/WebGL (ej. Pixi.js / Phaser) para minijuegos interactivos.
3. **Telemetría Clínica:** Registro en milisegundos de tiempos de respuesta, tasa de aciertos y omisiones para generar un perfil evolutivo del usuario.
4. **Módulo Cuidador/Familiar:** Panel donde un familiar o profesional puede observar la regularidad de juego y detectar posibles alertas de declive sostenido.
