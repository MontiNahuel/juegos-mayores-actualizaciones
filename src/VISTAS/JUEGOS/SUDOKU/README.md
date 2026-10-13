# 🧩 Módulo de Sudoku Diario — Mente Activa

Módulo completo de **Sudoku de Desafíos Diarios** diseñado específicamente para la plataforma *Mente Activa*, adaptado para **adultos mayores y personas mayores**.

El desarrollo sigue una **arquitectura desacoplada en capas (Clean Architecture)**: toda la lógica matemática y de estado se ejecuta en la capa de **Procesos**, manteniendo las **Vistas** 100% limpias, declarativas y enfocadas en la accesibilidad.

---

## 📂 Estructura del Módulo (`src/VISTAS/JUEGOS/SUDOKU/`)

```text
src/VISTAS/JUEGOS/SUDOKU/
├── types.ts                 # Interfaces de tipos (SudokuCell, SudokuGrid, SudokuConfig)
├── sudokuEngine.ts           # [PROCESO] Motor matemático con librería 'sudoku' y validador de reglas
├── useSudokuGame.ts          # [PROCESO] Hook orquestador (3 vidas ❤️, celdas, notas, victoria, intentos)
├── SudokuBoard.tsx           # [VISTA] Grilla 9x9 con división 3x3 y resaltado cognitivo suave
├── SudokuKeypad.tsx          # [VISTA] Teclado táctil (≥44px, lápiz, borrar, contador de restantes)
├── SudokuCompletedModal.tsx  # [VISTA] Modales de Victoria (estrellas) y Fin de Vidas (Game Over)
├── SudokuCalendar.tsx        # [VISTA] Entrada al Calendario mensual con DailyChallengeCalendar
├── SudokuGame.tsx            # [VISTA PRINCIPAL] Vista minimalista: solo importa el proceso y conecta la UI
├── index.ts                  # Exportaciones públicas del módulo
└── README.md                 # Esta documentación técnica
```

---

## ⚙️ Capa de Procesos vs. Capa de Vista

### 1. Procesos (`sudokuEngine.ts` & `useSudokuGame.ts`)
* **Librería npm `sudoku`:** Genera tableros garantizando matemáticamente **solución única (*Proper Sudoku*)** y sin ambigüedades.
* **Persistencia por Fecha (`dateKey`):** El puzzle diario queda indexado por fecha en `localStorage` (`sudoku_daily_puzzle_YYYY-MM-DD`) para que el usuario siempre juegue el mismo tablero del día, aun si recarga la página.
* **Reglas Estrictas:** `hasConflict` verifica colisiones en fila, columna o bloque 3x3.
* **Sistema de 3 Vidas (`❤️❤️❤️`):**
  * Cada equivocación descuenta un corazón.
  * Si llega a 0 vidas, se activa el estado de Game Over permitiendo reintentar o volver.
* **Cálculo de Estrellas:**
  * 0 errores = 3 estrellas (⭐⭐⭐)
  * 1 error = 2 estrellas (⭐⭐)
  * 2 errores = 1 estrella (⭐)
* **Sincronización:** Persiste el resultado final automáticamente mediante `saveFinalGameAttempt` en `attemptsService.ts`.

### 2. Vistas (`SudokuGame.tsx`, `SudokuBoard.tsx`, `SudokuKeypad.tsx`)
* La vista principal `SudokuGame.tsx` **no tiene cálculos ni bucles matemáticos**. Simplemente consume:
  ```tsx
  const game = useSudokuGame();
  ```
  y delega la presentación a los subcomponentes.

---

## ♿ Accesibilidad y Ergonomía para Adultos Mayores

1. **Hit Targets $\ge 44\text{px}$:** Celdas del tablero y botones de la botonera cumplen con el tamaño táctil mínimo recomendado por la W3C para evitar pulsaciones erróneas.
2. **Contador de Números Restantes:** La botonera del 1 al 9 muestra cuántos números faltan colocar de cada dígito; al completar los 9 de un número, el botón se atenúa con un tilde verde (`✔`), aliviando la memoria de trabajo.
3. **Resaltado Cognitivo Suave:**
   * Al pulsar una celda, se destacan suavemente su fila, columna, bloque 3x3 y todas las celdas con el mismo número.
4. **Despeje de Barra Android (*Safe Area*):** Margen inferior protegido de al menos `48px` para evitar solapamientos con botones de navegación del sistema operativo móvil.

---

## 🚀 Integración y Rutas

Registrado en `src/VISTAS/routes.tsx`:
* `/juegos/sudoku`: Pantalla del Calendario de Desafíos.
* `/juegos/sudoku/jugar`: Partida interactiva del día.

Registrado en `src/VISTAS/MENU/Menu.tsx`:
* Tarjeta de **Sudoku** habilitada (`available: true`) con navegación directa al calendario.
