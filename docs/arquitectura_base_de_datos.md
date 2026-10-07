# Arquitectura de Datos: MongoDB para Plataforma de Juegos Cognitivos

## 1. Decisión de Arquitectura

* **Motor:** MongoDB (NoSQL).
* **Patrón de persistencia:** **1 documento por partida / intento** en `user_attempts`.
* **Descarte del Bucket Pattern:** Se descarta agrupar intentos en arrays dentro del usuario para evitar sobrecarga de red al consultar el juego del día, eliminar la complejidad de operadores posicionales (`$`) en actualizaciones en tiempo real y prevenir bloqueos de concurrencia entre juegos simultáneos.

---

## 2. Mapa de Colecciones

```
┌─────────────────────────────────────────────────────────────┐
│                    COLECCIONES DE MONGODB                   │
├───────────────────────────────┬─────────────────────────────┤
│ 1. users                      │ Perfil, rachas y resumen de │
│                               │ progreso en campaña.        │
├───────────────────────────────┼─────────────────────────────┤
│ 2. daily_challenges           │ Calendario diario de retos  │
│                               │ (Wordle, Sudoku, etc.).     │
├───────────────────────────────┼─────────────────────────────┤
│ 3. game_levels                │ Catálogo estático de los    │
│                               │ 500 niveles de campaña.     │
├───────────────────────────────┼─────────────────────────────┤
│ 4. user_attempts              │ Partida activa / intentos   │
│                               │ del usuario (1 doc = 1 game)│
└───────────────────────────────┴─────────────────────────────┘
```

---

## 3. Especificación de Colecciones y Esquemas (JSON)

### Colección 1: `users`
Mantiene los datos del jugador, sus rachas activas y el nivel alcanzado en cada juego.

```json
{
  "_id": ObjectId("665a1b2c3d4e5f6a7b8c9d01"),
  "name": "Beatriz Gómez",
  "birth_year": 1952,
  "role": "patient",
  "caregiver_email": "familiar@correo.com",
  
  // Rachas del desafío diario
  "streaks": {
    "wordle": {
      "current_streak": 5,
      "max_streak": 14,
      "last_played_date": "2026-10-01"
    },
    "sudoku": {
      "current_streak": 2,
      "max_streak": 8,
      "last_played_date": "2026-09-30"
    }
  },
  
  // Progreso resumido en modo campaña (los 500 niveles)
  "campaign_progress": {
    "wordle": {
      "unlocked_level": 15,
      "total_stars": 41
    },
    "crucigrama": {
      "unlocked_level": 4,
      "total_stars": 10
    }
  },
  
  "created_at": ISODate("2026-01-10T12:00:00Z")
}
```

---

### Colección 2: `daily_challenges`
Contiene los desafíos diarios programados por fecha. El campo `config` es polimórfico (se adapta a cada tipo de juego).

```json
{
  "_id": ObjectId("665a1b2c3d4e5f6a7b8c9d10"),
  "game_id": "wordle",
  "date": "2026-10-01",
  "difficulty": "standard",
  
  "config": {
    "solution": "PLAZA",
    "word_length": 5,
    "max_attempts": 6,
    "hints": [
      "Espacio público al aire libre con bancos y árboles",
      "Empieza con la letra P"
    ]
  },
  
  "created_at": ISODate("2026-09-01T00:00:00Z")
}
```

> **Índice Único Obligatorio:**
> ```javascript
> db.daily_challenges.createIndex(
>   { game_id: 1, date: 1, difficulty: 1 },
>   { unique: true }
> );
> ```

---

### Colección 3: `game_levels`
Almacena la definición estática de los 500 niveles del modo campaña para cada juego.

```json
{
  "_id": ObjectId("665a1b2c3d4e5f6a7b8c9d20"),
  "game_id": "wordle",
  "level_number": 1,
  "world": "Mundo 1: El Jardín",
  
  "config": {
    "solution": "CASA",
    "word_length": 4,
    "max_attempts": 6,
    "clue": "Lugar donde vive una familia"
  },
  
  "rewards": {
    "stars_threshold": {
      "three_stars": 2, // Intentos máximos para 3 estrellas
      "two_stars": 4,
      "one_star": 6
    }
  }
}
```

> **Índice Único Obligatorio:**
> ```javascript
> db.game_levels.createIndex(
>   { game_id: 1, level_number: 1 },
>   { unique: true }
> );
> ```

---

### Colección 4: `user_attempts`
Representa la sesión o partida individual. Sirve para guardar el progreso en tiempo real y permitir que el usuario reanude su partida si cierra la app.

```json
{
  "_id": ObjectId("665a1b2c3d4e5f6a7b8c9d30"),
  "user_id": ObjectId("665a1b2c3d4e5f6a7b8c9d01"),
  "game_id": "wordle",
  "mode": "daily", // 'daily' | 'campaign'
  "challenge_id": ObjectId("665a1b2c3d4e5f6a7b8c9d10"), // Referencia al reto del día o nivel
  "date": "2026-10-01",
  
  "status": "in_progress", // 'in_progress' | 'completed' | 'failed'
  
  // Estado interactivo de la partida
  "state": {
    "guesses": [
      { "word": "BARCO", "result": ["absent", "absent", "present", "absent", "absent"] },
      { "word": "PLATO", "result": ["correct", "correct", "correct", "absent", "absent"] }
    ],
    "remaining_attempts": 4,
    "hints_revealed": 1
  },
  
  "score": 0,
  "updated_at": ISODate("2026-10-01T10:15:00Z")
}
```

> **Índices Obligatorios para Máximo Rendimiento:**
> ```javascript
> // Para consultar y reanudar la partida del día en < 1ms:
> db.user_attempts.createIndex(
>   { user_id: 1, challenge_id: 1 },
>   { unique: true }
> );
> 
> // Para listar partidas recientes:
> db.user_attempts.createIndex(
>   { user_id: 1, date: -1 }
> );
> ```

---

## 4. Flujo Operativo del Backend

1. **Obtener el juego de hoy:**
   * El cliente consulta `GET /api/games/wordle/today`.
   * El backend busca en `daily_challenges` la fecha actual (excluyendo el campo `solution` de la respuesta).
   * El backend busca en `user_attempts` si el usuario ya inició la partida para devolver su progreso actual (`state.guesses`).
2. **Validar intento:**
   * El cliente envía `POST /api/games/wordle/guess` con la palabra propuesta.
   * El backend evalúa las letras, actualiza `state.guesses` y reduce `remaining_attempts`.
   * Si acierta o agota intentos, actualiza `status` a `'completed'` o `'failed'`, y calcula la racha en `users.streaks`.
