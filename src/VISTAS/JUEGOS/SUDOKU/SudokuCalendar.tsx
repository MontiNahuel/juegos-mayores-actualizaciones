/* Permite elegir fecha y dificultad para jugar al Sudoku. */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DailyChallengeCalendar, type DayChallenge } from '../../COMPONENTS/CALENDAR';
import { DifficultyModal, type DifficultyLevel } from '../../COMPONENTS/DIFICULTAD';
import { CompletedModal } from '../../COMPONENTS/MODALS/CompletedModal';
import { getSudokuLocalProgress } from './sudokuStorage';

// Permite elegir fecha y dificultad para jugar al Sudoku.
export const SudokuCalendar: React.FC = () => {
  const navigate = useNavigate();
  const [selectedChallengeForPlay, setSelectedChallengeForPlay] = useState<DayChallenge | null>(null);

  // Prepara el desafío elegido antes de abrir el juego.
  const handlePlayChallenge = (challenge: DayChallenge) => {
    // Si ya existe una partida en curso guardada, reanudar de inmediato sin volver a preguntar la dificultad
    const saved = getSudokuLocalProgress(challenge.dateKey);
    if (saved && saved.status === 'in_progress') {
      navigate('/juegos/sudoku/jugar', {
        state: {
          challenge,
          difficultyLevel: saved.difficultyLevel,
        },
      });
      return;
    }

    setSelectedChallengeForPlay(challenge);
  };

  // Abre el juego con la dificultad que eligió el jugador.
  const handleSelectDifficulty = (level: DifficultyLevel) => {
    if (!selectedChallengeForPlay) return;

    navigate('/juegos/sudoku/jugar', {
      state: {
        challenge: selectedChallengeForPlay,
        difficultyLevel: level, // 1 = Fácil, 2 = Medio, 3 = Alto
      },
    });

    setSelectedChallengeForPlay(null);
  };

  return (
    <>
      <DailyChallengeCalendar
        gameId="sudoku"
        title="Sudoku diario"
        heroBadge="¡Desafío de hoy!"
        heroSubtitle="Poné a prueba tu concentración y lógica completando el tablero de hoy."
        onPlayChallenge={handlePlayChallenge}
        renderCompletedModal={/* Responde a render completed modal desde este control. */ (challenge, onClose) => (
          <CompletedModal gameId="sudoku"
            dateStr={challenge.dateStr}
            stars={challenge.stars ?? 3}
            onRestart={onClose}
            onClose={onClose}
          />
        )}
      />

      {/* Modal Reutilizable de Dificultad (Opción C - Editorial) */}
      {selectedChallengeForPlay && (
        <DifficultyModal
          title="Elegí tu Desafío"
          subtitle={selectedChallengeForPlay.dateStr}
          categoryBadge="Cuaderno de Mente Activa"
          onSelectDifficulty={handleSelectDifficulty}
          onClose={/* Responde a close desde este control. */ () => setSelectedChallengeForPlay(null)}
        />
      )}
    </>
  );
};

export default SudokuCalendar;
