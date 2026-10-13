# 📅 Guía de Integración: Calendario de Desafíos Diarios

Este documento sirve como guía técnica para desarrolladores de la plataforma *Mente Activa* que deseen integrar el **Calendario de Desafíos Diarios** en nuevos juegos cognitivos (Sudoku, Crucigrama, Sopa de Letras, Memoria, etc.).

El componente está diseñado de forma **agnóstica y modular**, permitiendo que cualquier juego cuente con su propio calendario mensual en menos de **20 líneas de código**, manteniendo una experiencia consistente, accesible y adaptada para **personas mayores / adultos mayores**.

---

## 📂 Ubicación del Módulo (`src/VISTAS/COMPONENTS/CALENDAR/`)

Todos los componentes reutilizables del calendario se encuentran centralizados en:

```text
src/VISTAS/COMPONENTS/CALENDAR/
├── index.ts                   # Exportaciones públicas del módulo
├── types.ts                   # Tipos e interfaces TypeScript (DayChallenge, Theme, Props)
├── icons.tsx                  # Iconografía SVG accesible (44px hit-box friendly)
├── calendarService.ts         # Orquestador de API REST, cache local y sync de fecha
├── useGameCalendar.ts         # Hook con lógica reactiva de navegación mensual y estados
├── CalendarHeader.tsx         # Barra superior con botón de retorno y título
├── CalendarHeroCard.tsx       # Tarjeta destacada superior con "¡Desafío de hoy!"
├── CalendarGrid.tsx           # Cuadrícula responsive de días (soporta meses de 5 y 6 filas)
├── CalendarCell.tsx           # Celda interactiva individual por día
├── DailyChallengeCalendar.tsx # Componente contenedor principal
└── README.md                  # Referencia rápida local
```

---

## 🚀 Cómo Integrar el Calendario en un Nuevo Juego (Paso a Paso)

Para ilustrar la integración, tomemos como ejemplo el juego **Sudoku**:

### 1. Crear la Vista del Calendario (`src/VISTAS/JUEGOS/SUDOKU/SudokuCalendar.tsx`)

Solo tenés que importar `<DailyChallengeCalendar />` y parametrizar los datos básicos de tu juego:

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

### 2. Registrar las Rutas (`src/VISTAS/routes.tsx`)

Agregá tu vista de calendario y la pantalla del juego dentro del enrutador de la aplicación:

```tsx
import SudokuCalendar from './JUEGOS/SUDOKU/SudokuCalendar';
import SudokuGame from './JUEGOS/SUDOKU/SudokuGame';

// Dentro de <Routes>:
<Route path="/juegos/sudoku" element={<SudokuCalendar />} />
<Route path="/juegos/sudoku/jugar" element={<SudokuGame />} />
```

---

## 🎮 Cómo Recibir los Datos del Desafío en tu Pantalla de Juego (`playRoute`)

Cuando el usuario hace clic en el botón *"JUGAR DESAFÍO DE HOY"* o toca una celda en estado `pending` (días pasados no completados), el calendario redirige automáticamente a `playRoute` inyectando la información del desafío en el `location.state`.

En tu componente de juego (ej: `SudokuGame.tsx`), podés acceder a esos datos usando `useLocation()` de `react-router-dom`:

```tsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const SudokuGame: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Objeto inyectado desde el calendario
  const challenge = location.state?.challenge;

  const dayNumber = challenge?.day;         // Número del día (ej: 13)
  const dateStr = challenge?.dateStr;       // Fecha legible (ej: "13 de Octubre")
  const dateKey = challenge?.dateKey;       // Clave ISO (ej: "2026-10-13")
  const gameConfig = challenge?.config;     // Configuración del desafío desde el backend (tablero, dificultad, etc.)

  // ... lógica y renderizado de tu juego
};
```

> 💡 **Fallback Offline / Acceso Directo:** Si el usuario ingresa de forma directa a la URL sin pasar por el calendario (`location.state` llega `undefined`), te recomendamos consultar como respaldo el endpoint `GET /api/challenges/today?game_id=sudoku`.

---

## 🏆 Cómo Guardar Partidas y Registrar Días Completados

El servicio centralizado `attemptsService.ts` (`src/VISTAS/JUEGOS/attemptsService.ts`) maneja toda la persistencia y reglas de negocio:

1. **Aislamiento por Mes y Año:** Las partidas se guardan bajo claves particionadas por `YYYY_MM` para evitar que los días de un mes (ej. día 1 y 9) colisionen con los de otros meses.
2. **Modo Invitado (Guest):** Guarda en `localStorage` de forma instantánea sin hacer llamadas a la base de datos (evita ensuciar MongoDB con cuentas anónimas).
3. **Modo Usuario Autenticado:** Guarda en local y sincroniza de forma asíncrona con el backend mediante `POST /api/games/attempts`.

### Guardar la Partida al Finalizar:

```tsx
import { saveFinalGameAttempt } from '../attemptsService';

// Cuando el jugador gana o completa el desafío:
saveFinalGameAttempt({
  gameId: 'sudoku',
  date: dateKey,       // Formato ISO estricto: "YYYY-MM-DD"
  day: dayNumber,      // Número del día (ej: 13)
  status: 'won',       // 'won' | 'completed' | 'lost' | 'failed'
  attempts: 1,         // Cantidad de intentos o errores cometidos
  stars: 3,            // Estrellas obtenidas (1 a 3)
  score: 150,          // Puntaje sumado (ej: estrellas * 50)
  // Campos opcionales según el juego:
  word: '...',         // Si el juego involucra palabras
  guesses: [...],      // Registro de movimientos
});
```

---

## 🖼️ Modal Especializado de Día Completado (`renderCompletedModal`)

Cuando un usuario toca un día ya completado en el calendario, se invoca la función prop `renderCompletedModal(challenge, onClose)`. Esto te permite mostrar las estadísticas específicas de tu juego:

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

> **Respaldo:** Si no definís `renderCompletedModal`, el calendario mostrará un modal genérico accesible con la fecha y las estrellas logradas.

---

## 🎨 Paleta Cognitiva Accesible y Temas (`theme`)

El calendario implementa una **paleta cognitiva amigable** pensada para evitar la ansiedad del semáforo rojo/verde tradicional:

| Estado | Significado | Color Fondo | Color Borde | Color Texto / Ícono |
| :--- | :--- | :--- | :--- | :--- |
| **HOY** | Desafío actual en curso | `#294C6B` (Azul profundo) | `#53BFC9` (Cian activo) | `#FFFFFF` (Blanco) |
| **Completado** | Logrado con éxito | `#E8F8F5` (Verde menta) | `#53BFC9` (Borde cian) | `#17695F` (Tilde menta oscuro) |
| **Pendiente** | Días pasados jugables | `#FFF1EE` (Durazno cálido) | `#FB923C` (Naranja suave) | `#EA580C` (Play naranja vivo) |
| **Bloqueado** | Días futuros por venir | `#F8FAFC` (Gris niebla) | `#F1F5F9` (Borde sutil) | `#CBD5E1` (Candado claro) |

### Personalizar Colores:

Podés inyectar colores propios mediante la propiedad `theme`:

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

Para que el backend reconozca tu juego en el calendario, asegurate de que responda a los 3 endpoints de `app/features/daily_challenges/router.py`:

1. **`GET /api/challenges/today?game_id={gameId}`**: Retorna el desafío de hoy para ese juego.
2. **`GET /api/challenges/month?year={year}&month={month}&game_id={gameId}`**: Retorna la lista de desafíos del mes consultado.
3. **`GET /api/challenges/range?game_id={gameId}`**: Retorna `{ min_date: "YYYY-MM-DD", max_date: "YYYY-MM-DD" }`.
   - **Límite elástico:** El botón `‹` del calendario se deshabilita automáticamente al llegar a la fecha `min_date` disponible en la base de datos. Si en el futuro sembrás meses más antiguos, la navegación crecerá automáticamente sin tocar código frontend.

---

## ♿ Buenas Prácticas de Accesibilidad para Adultos Mayores

1. **Áreas de Toque $\ge 44\text{px}$:** Todo botón o celda interactiva debe tener al menos `44px × 44px` de superficie táctil para personas con temblores o dificultades motrices.
2. **Meses de 6 Filas:** La grilla calcula automáticamente las celdas vacías (`trailingEmptyOffset`) para que meses que empiezan en fin de semana (como Agosto) muestren el día 31 sin recortarse.
3. **Margen Inferior para Botones Nativo del Teléfono (*Safe Area*):** Los contenedores inferiores implementan `max(calc(env(safe-area-inset-bottom, 0px) + 24px), 48px)` para evitar que los botones nativos de Android (Atrás ◁, Inicio ○, Recientes □) se superpongan con los botones del juego o teclado.
