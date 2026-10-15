import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DailyChallengeCalendar, DayChallenge } from '../../COMPONENTS/CALENDAR';
import { DifficultyModal, DifficultyLevel } from '../../COMPONENTS/DIFICULTAD';
import { SudokuCompletedModal } from './SudokuCompletedModal';
import { getSudokuLocalProgress } from './sudokuStorage';

export const SudokuCalendar: React.FC = () => {
  const navigate = useNavigate();
  const [selectedChallengeForPlay, setSelectedChallengeForPlay] = useState<DayChallenge | null>(null);

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
        title="Desafíos Diarios de Sudoku"
        heroBadge="DESAFÍO DEL DÍA"
        heroSubtitle="Poné a prueba tu concentración y lógica completando el tablero de hoy."
        onPlayChallenge={handlePlayChallenge}
        renderCompletedModal={(challenge, onClose) => (
          <SudokuCompletedModal
            dateStr={challenge.dateStr}
            stars={challenge.stars || 3}
            onRestart={onClose}
            onExit={onClose}
          />
        )}
        theme={{
          primaryBlue: '#1E3A5F',
          accentTeal: '#3B9EAA',
        }}
      />

      {/* Modal Reutilizable de Dificultad (Opción C - Editorial) */}
      {selectedChallengeForPlay && (
        <DifficultyModal
          title="Elegí tu Desafío"
          subtitle={selectedChallengeForPlay.dateStr}
          categoryBadge="Cuaderno de Mente Activa"
          onSelectDifficulty={handleSelectDifficulty}
          onClose={() => setSelectedChallengeForPlay(null)}
        />
      )}
    </>
  );
};

export default SudokuCalendar;
