# 📅 Guía de Integración: Calendario de Desafíos Diarios

Este módulo implementa una arquitectura modular y reutilizable de **Calendario de Desafíos Diarios** diseñada para la plataforma *Mente Activa*.

Está concebido para que **cualquier juego cognitivo** (Wordle, Sudoku, Crucigrama, Sopa de Letras, Memoria, etc.) pueda tener su propio calendario mensual con desafíos diarios en menos de **20 líneas de código**, manteniendo una experiencia consistente, accesible y testeada para **personas mayores / adultos mayores**.

---

## 📂 Estructura del Módulo (`src/VISTAS/COMPONENTS/CALENDAR/`)

```text
src/VISTAS/COMPONENTS/CALENDAR/
├── index.ts                   # Exportaciones públicas del módulo
├── types.ts                   # Interfaces TypeScript tipadas (DayChallenge, Theme, Props)
├── icons.tsx                  # Iconografía SVG accesible (44px hit-box friendly)
├── calendarService.ts         # Orquestador de API REST, cache local y sync de fecha
├── useGameCalendar.ts         # Hook con lógica reactiva de navegación mensual y estados
├── CalendarHeader.tsx         # Barra superior con botón de retorno y título
├── CalendarHeroCard.tsx       # Tarjeta destacada superior con "¡Desafío de hoy!"
├── CalendarGrid.tsx           # Cuadrícula responsive de días (soporta meses de 5 y 6 filas)
├── CalendarCell.tsx           # Celda interactiva individual por día
├── DailyChallengeCalendar.tsx # Componente contenedor principal
└── README.md                  # Esta documentación técnica
```

---

## 🚀 Cómo Integrar el Calendario en tu Juego (Paso a Paso)

Integrar un nuevo juego (por ejemplo, **Sudoku**) requiere únicamente crear un archivo contenedor (ej. `SudokuCalendar.tsx`) que instancie `<DailyChallengeCalendar />`.

### 1. Crear la Vista del Calendario (`src/VISTAS/JUEGOS/SUDOKU/SudokuCalendar.tsx`)

```tsx
import React from 'react';
import { DailyChallengeCalendar } from '../../COMPONENTS/CALENDAR';
import { SudokuCompletedModal } from './SudokuCompletedModal';

export const SudokuCalendar: React.FC = () => {
  return (
    <DailyChallengeCalendar
      gameId="sudoku"
      title="Desafíos Diarios de Sudoku"
      heroBadge="DESAFÍO DEL DÍA"
      heroSubtitle="Poné a prueba tu concentración y lógica con el tablero de hoy."
      playRoute="/juegos/sudoku/jugar"
      renderCompletedModal={(challenge, onClose) => (
        <SudokuCompletedModal challenge={challenge} onClose={onClose} />
      )}
    />
  );
};

export default SudokuCalendar;
```

### 2. Registrar la Ruta (`src/VISTAS/routes.tsx`)

Agregá la ruta hacia tu vista de calendario y hacia la pantalla interactiva del juego:

```tsx
import SudokuCalendar from './JUEGOS/SUDOKU/SudokuCalendar';
import SudokuGame from './JUEGOS/SUDOKU/SudokuGame';

// Dentro de <Routes>:
<Route path="/juegos/sudoku" element={<SudokuCalendar />} />
<Route path="/juegos/sudoku/jugar" element={<SudokuGame />} />
```

---

## 🎮 Cómo Recibir los Datos del Desafío en tu Juego (`playRoute`)

Cuando el jugador toca un día pendiente (ya sea el de hoy o un día pasado pendiente), el calendario navega automáticamente a la ruta indicada en `playRoute` inyectando la información en el `location.state`.

En el componente de tu juego (ej. `SudokuGame.tsx`), podés extraer el desafío de la siguiente manera:

```tsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const SudokuGame: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Desafío inyectado desde el calendario
  const challenge = location.state?.challenge;

  const dayNumber = challenge?.day;         // Ej: 13
  const dateStr = challenge?.dateStr;       // Ej: "13 de Octubre"
  const dateKey = challenge?.dateKey;       // Ej: "2026-10-13"
  const gameConfig = challenge?.config;     // Configuración del backend (tablero, pistas, dificultad, etc.)

  // ... lógica de tu juego
};
```

> **Fallback Offline:** Si el usuario ingresa directamente a la ruta sin pasar por el calendario, siempre es una buena práctica consultar el endpoint `/api/challenges/today?game_id=sudoku` como fallback.

---

## 🏆 Cómo Guardar Partidas y Registrar Días Completados

El servicio centralizado `attemptsService.ts` (`src/VISTAS/JUEGOS/attemptsService.ts`) maneja automáticamente:
1. **Aislamiento por mes y año:** Las partidas quedan guardadas bajo claves `YYYY_MM` para evitar que los días de un mes contaminen a los demás.
2. **Modo Invitado (Guest):** Guarda en `localStorage` de forma instantánea y sin tocar la base de datos para no ensuciarla con partidas anónimas.
3. **Modo Usuario Autenticado:** Guarda en local y sincroniza de forma asíncrona con MongoDB vía `POST /api/games/attempts`.

### Cuando el jugador termina la partida:

```tsx
import { saveFinalGameAttempt } from '../attemptsService';

// Al ganar o completar el desafío:
saveFinalGameAttempt({
  gameId: 'sudoku',
  date: dateKey,       // Formato estricto: "YYYY-MM-DD" (ej: "2026-10-13")
  day: dayNumber,      // Número del día (ej: 13)
  status: 'won',       // 'won' | 'completed' | 'lost' | 'failed'
  attempts: 1,         // Cantidad de intentos o errores
  stars: 3,            // Estrellas obtenidas (1 a 3)
  score: 150,          // Puntaje sumado (ej: estrellas * 50)
  // Campos opcionales específicos de tu juego:
  word: '...',         // Palabra si aplica
  guesses: [...],      // Registro de movimientos
});
```

---

## 🖼️ Modal Especializado de Día Completado (`renderCompletedModal`)

Al tocar un día con estado `completed` (verde menta con tilde), el calendario invoca la prop opcional `renderCompletedModal`. Esto permite que cada juego exponga sus propias métricas e información relevante:

```tsx
interface SudokuCompletedModalProps {
  challenge: DayChallenge;
  onClose: () => void;
}

export const SudokuCompletedModal: React.FC<SudokuCompletedModalProps> = ({ challenge, onClose }) => {
  return (
    <div style={{ /* backdrop con blur */ }}>
      <div style={{ /* tarjeta blanca con bordes redondeados */ }}>
        <h3>Desafío del {challenge.dateStr}</h3>
        <p>Tiempo empleado: {challenge.completedData?.timeSeconds} segundos</p>
        <p>Estrellas obtenidas: {challenge.stars} ⭐</p>
        <button onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
};
```

> **Nota:** Si no proveés `renderCompletedModal`, el calendario cuenta con un **modal universal de respaldo** que muestra la fecha, las estrellas y un mensaje de felicitación.

---

## 🎨 Paleta Cognitiva y Temas Personalizados (`theme`)

El calendario implementa una **paleta cognitiva inclusiva** diseñada especialmente para evitar la carga emocional del "semáforo rojo/verde tradicional" que suele angustiar a las personas mayores:

| Estado | Significado | Color Fondo | Color Borde | Color Texto / Ícono |
| :--- | :--- | :--- | :--- | :--- |
| **HOY** | Desafío actual en curso | `#294C6B` (Azul profundo) | `#53BFC9` (Cian activo) | `#FFFFFF` (Blanco) |
| **Completado** | Logrado con éxito | `#E8F8F5` (Verde menta) | `#53BFC9` (Borde cian) | `#17695F` (Tilde menta oscuro) |
| **Pendiente** | Días pasados jugables | `#FFF1EE` (Durazno cálido) | `#FB923C` (Naranja suave) | `#EA580C` (Play naranja vivo) |
| **Bloqueado** | Días futuros por venir | `#F8FAFC` (Gris niebla) | `#F1F5F9` (Borde sutil) | `#CBD5E1` (Candado claro) |

### Personalizar Colores para un Juego

Podés sobreescribir cualquier color mediante la prop `theme`:

```tsx
<DailyChallengeCalendar
  gameId="sopa_letras"
  // ...
  theme={{
    primaryBlue: '#4A2574',    // Color primario para el encabezado
    accentTeal: '#C084FC',     // Acento para medallas y bordes
  }}
/>
```

---

## 🌐 Requisitos en el Backend (FastAPI + MongoDB)

Para que el calendario funcione con un juego nuevo, el backend debe responder a 3 endpoints en `app/features/daily_challenges/router.py`:

1. **`GET /api/challenges/today?game_id={gameId}`**
   - Devuelve el desafío del día de hoy configurado en el servidor.
2. **`GET /api/challenges/month?year={year}&month={month}&game_id={gameId}`**
   - Devuelve la lista de desafíos de ese mes (tope exacto de días del mes).
3. **`GET /api/challenges/range?game_id={gameId}`**
   - Devuelve `{ min_date: "YYYY-MM-DD", max_date: "YYYY-MM-DD" }`.
   - **El límite inferior es dinámico:** el botón `‹` del calendario se deshabilitará automáticamente en el mes más antiguo sembrado en MongoDB. Si más adelante sembrás meses adicionales en la base de datos, el calendario crecerá hacia atrás de forma automática sin tocar el frontend.

---

## ♿ Checklist de Accesibilidad para Adultos Mayores

Al realizar modificaciones o extensiones en este módulo, tené siempre en cuenta:

1. **Áreas táctiles (*Hit Targets*) $\ge$ 44px:** Todo botón (`[ ‹ ]`, `[ › ]`, Volver, Celdas) debe tener un tamaño mínimo de `44px × 44px` para evitar pulsaciones erróneas en personas con dificultades motrices o temblores.
2. **Meses de 6 filas:** La cuadrícula utiliza `height: auto` y rellena con celdas invisibles (`trailingEmptyOffset`) los días finales de la semana para que meses que empiezan en sábado (como Agosto) nunca recorten el día 31.
3. **Despeje de botones nativos de Android (*Safe Area*):** El contenedor inferior tiene un margen de seguridad de al menos `48px` (`max(calc(env(safe-area-inset-bottom, 0px) + 28px), 48px)`) para que los botones de Atrás, Inicio y Recientes de los celulares Android nunca tapen los botones ni las celdas de la app.
4. **Tipografía y Contraste:** Mantener tamaños de fuente legibles ($\ge 11\text{px}$ en badges, $\ge 14\text{px}$ en botones y títulos) con contraste verificado sobre el fondo.
