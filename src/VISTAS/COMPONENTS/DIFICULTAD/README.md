# 🎯 Módulo Reutilizable: Selector de Dificultad

Componente modal genérico y reutilizable diseñado para que **cualquier juego** de la plataforma *Mente Activa* (Sudoku, Wordle, Crucigrama, Sopa de Letras, Memoria, etc.) pueda ofrecer selección de dificultad en 3 niveles numéricos (`1`, `2`, `3`) de forma consistente y accesible para personas mayores.

---

## 📂 Archivos (`src/VISTAS/COMPONENTS/DIFICULTAD/`)

```text
src/VISTAS/COMPONENTS/DIFICULTAD/
├── types.ts            # Type DifficultyLevel = 1 | 2 | 3 y configuraciones
├── DifficultyModal.tsx # Componente Modal con hit-targets ≥70px y alto contraste
├── index.ts            # Exportaciones públicas
└── README.md           # Esta documentación
```

---

## 🚀 Cómo Integrarlo en Cualquier Juego

Al tocar un día en el Calendario, mostrás `<DifficultyModal />` antes de iniciar la partida:

```tsx
import { DifficultyModal, DifficultyLevel } from '../../COMPONENTS/DIFICULTAD';

export const MiJuegoCalendar = () => {
  const [selectedChallenge, setSelectedChallenge] = useState<DayChallenge | null>(null);

  const handleSelectDifficulty = (level: DifficultyLevel) => {
    // level siempre será 1 (Fácil), 2 (Medio) o 3 (Alto)
    navigate('/juegos/mi-juego/jugar', {
      state: {
        challenge: selectedChallenge,
        difficultyLevel: level, // 1 | 2 | 3
      },
    });
    setSelectedChallenge(null);
  };

  return (
    <>
      <DailyChallengeCalendar
        onPlayChallenge={(challenge) => setSelectedChallenge(challenge)}
        // ...
      />

      {selectedChallenge && (
        <DifficultyModal
          title="Elegí la Dificultad"
          subtitle={selectedChallenge.dateStr}
          icon="🧩"
          onSelectDifficulty={handleSelectDifficulty}
          onClose={() => setSelectedChallenge(null)}
        />
      )}
    </>
  );
};
```

---

## 💡 Cómo Varía Cada Juego según el Nivel (`1`, `2`, `3`)

| Juego | Nivel 1 (Fácil / Bajo) | Nivel 2 (Medio) | Nivel 3 (Alto / Avanzado) |
| :--- | :--- | :--- | :--- |
| **Sudoku** | ~43 pistas visibles (+18 números) | ~35 pistas visibles (+10 números) | ~25 pistas visibles (pistas mínimas) |
| **Wordle** | Palabras de 4 letras o 6 intentos + 2 pistas | Palabras de 5 letras clásico | Palabras de 6 letras sin pistas |
| **Crucigrama** | Pistas directas con primera letra revelada | Pistas estándar | Pistas conceptuales sin letras iniciales |
| **Memoria** | 6 pares (cuadrícula 4x3) | 8 pares (cuadrícula 4x4) | 10 pares (cuadrícula 5x4) |
