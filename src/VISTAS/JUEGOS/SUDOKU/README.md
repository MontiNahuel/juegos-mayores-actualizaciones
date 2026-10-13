# 🧩 Módulo de Sudoku Diario — Mente Activa

Módulo completo de **Sudoku de Desafíos Diarios** diseñado específicamente para la plataforma *Mente Activa*, adaptado para **adultos mayores y personas mayores**.

El desarrollo sigue una **arquitectura desacoplada en capas (Clean Architecture)**: toda la lógica matemática y de estado se ejecuta en la capa de **Procesos**, manteniendo las **Vistas** 100% limpias, declarativas y enfocadas en la accesibilidad.

---

## 📂 Estructura del Módulo (`src/VISTAS/JUEGOS/SUDOKU/`)

```text
src/VISTAS/JUEGOS/SUDOKU/
├── types.ts                 # Interfaces de tipos (SudokuCell, SudokuGrid, Difficulty)
├── sudokuEngine.ts           # [PROCESO] Motor matemático con librería 'sudoku' y selector de pistas
├── useSudokuGame.ts          # [PROCESO] Hook orquestador (3 vidas ❤️, celdas, dificultad, notas, victoria)
├── SudokuBoard.tsx           # [VISTA] Grilla 9x9 con división 3x3 y áreas táctiles ≥44px
├── SudokuKeypad.tsx          # [VISTA] Teclado táctil (≥44px, lápiz, borrar, contador de restantes)
├── SudokuDifficultyModal.tsx # [VISTA] Modal de selección de dificultad (Fácil / Medio / Alto)
├── SudokuCompletedModal.tsx  # [VISTA] Modales de Victoria (estrellas) y Fin de Vidas (Game Over)
├── SudokuCalendar.tsx        # [VISTA] Pantalla del Calendario conectada con el Modal de Dificultad
├── SudokuGame.tsx            # [VISTA PRINCIPAL] Vista minimalista: solo consume useSudokuGame()
├── index.ts                  # Exportaciones públicas del módulo
└── README.md                 # Esta documentación técnica
```

---

## 🎯 Flujo de Juego y Selección de Dificultad

1. **Calendario:** El usuario ve el mes y toca el día que desea jugar (ej: el día de HOY o un día pendiente).
2. **Modal Intermedio de Dificultad (`SudokuDifficultyModal`):** Antes de entrar al tablero, se abre un diálogo accesible con 3 opciones grandes:
   * 🟢 **Fácil (Bajo) [Recomendado]:** ~43 pistas iniciales reveladas. Muy fluido y relajante para personas mayores.
   * 🟡 **Medio:** ~35 pistas iniciales reveladas. Desafío estándar de deducción lógica y concentración.
   * 🔴 **Alto (Avanzado):** ~25 pistas iniciales reveladas. Desafío profundo para ejercitar la memoria de trabajo.
3. **Inicio de Partida (`SudokuGame`):** Al elegir la dificultad, se navega al tablero con la cantidad correspondiente de números y el badge identificador en la barra superior.

---

## ⚙️ Capa de Procesos vs. Capa de Vista

### 1. Procesos (`sudokuEngine.ts` & `useSudokuGame.ts`)
* **Librería npm `sudoku`:** Genera tableros garantizando matemáticamente **solución única (*Proper Sudoku*)** y sin ambigüedades.
* **Persistencia por Fecha y Dificultad:** El puzzle diario se almacena en `localStorage` bajo `sudoku_daily_puzzle_YYYY-MM-DD_DIFICULTAD`, asegurando que el usuario mantenga el mismo tablero todo el día aunque recargue.
* **Reglas Estrictas:** `hasConflict` valida colisiones en fila, columna o bloque 3x3.
* **Sistema de 3 Vidas (`❤️❤️❤️`):** Cada número incorrecto resta un corazón. A las 3 equivocaciones se activa el Game Over amigable con botón de reintentar.
* **Cálculo de Estrellas:**
  * 0 errores = 3 estrellas (⭐⭐⭐)
  * 1 error = 2 estrellas (⭐⭐)
  * 2 errores = 1 estrella (⭐)
* **Sincronización:** Guarda automáticamente el resultado al ganar o perder invocando `saveFinalGameAttempt` en `attemptsService.ts`.

### 2. Vistas
* La pantalla principal `SudokuGame.tsx` es puramente presentacional: solo invoca `useSudokuGame()`.
* **Contador de Números Restantes (1 al 9):** La botonera descuenta los números que faltan colocar y coloca un tilde verde (`✔`) al completar todos los de ese dígito.
* **Accesibilidad táctil:** Celdas y botones con tamaño $\ge 44\text{px}$, división marcada entre bloques 3x3 y margen inferior protegido (*Safe Area*) para teléfonos Android.
