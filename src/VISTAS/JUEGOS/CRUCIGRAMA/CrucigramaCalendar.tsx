import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DailyChallengeCalendar, type DayChallenge } from '../../COMPONENTS/CALENDAR';
import { DifficultyModal, type DifficultyOptionConfig } from '../../COMPONENTS/DIFICULTAD';
import { CrucigramaCompletedModal } from '../../MODALS/CrucigramaCompletedModal';
import { loadActiveCrucigrama, type CrucigramaDifficulty } from './crucigramaStorage';

export type { DayChallenge };

const CRUCIGRAMA_DIFFICULTY_OPTIONS: DifficultyOptionConfig[] = [
  {
    level: 1,
    title: 'Fácil',
    description: 'Tablero 7x7 con pistas claras. Ideal para ejercitar el vocabulario.',
    stars: '★☆☆',
    badge: 'Recomendado',
    leftBorderColor: 'border-l-emerald-500',
    leftBorderHex: '#10B981',
    actionBgColor: 'bg-emerald-50',
    actionTextColor: 'text-emerald-700',
    actionHoverBgColor: 'group-hover:bg-emerald-600',
  },
  {
    level: 2,
    title: 'Difícil',
    description: 'Tablero 11x11 con más palabras y cruces. Para mentes entrenadas.',
    stars: '★★★',
    leftBorderColor: 'border-l-rose-500',
    leftBorderHex: '#F43F5E',
    actionBgColor: 'bg-rose-50',
    actionTextColor: 'text-rose-700',
    actionHoverBgColor: 'group-hover:bg-rose-600',
  },
];

const DIFFICULTY_BY_LEVEL: Record<number, CrucigramaDifficulty> = {
  1: 'facil',
  2: 'dificil',
};

export const CrucigramaCalendar: React.FC = () => {
  const navigate = useNavigate();
  const [selectedChallengeForPlay, setSelectedChallengeForPlay] = useState<DayChallenge | null>(null);

  const handlePlayChallenge = (challenge: DayChallenge) => {
    // Si ya existe una partida en curso guardada, reanudar sin volver a preguntar la dificultad
    if (loadActiveCrucigrama(challenge.dateKey, 'facil')) {
      navigate('/juegos/crucigrama/jugar', {
        state: { challenge, difficulty: 'facil' },
      });
      return;
    }
    if (loadActiveCrucigrama(challenge.dateKey, 'dificil')) {
      navigate('/juegos/crucigrama/jugar', {
        state: { challenge, difficulty: 'dificil' },
      });
      return;
    }

    setSelectedChallengeForPlay(challenge);
  };

  const handleSelectDifficulty = (level: number) => {
    if (!selectedChallengeForPlay) return;

    const difficulty = DIFFICULTY_BY_LEVEL[level] || 'facil';

    navigate('/juegos/crucigrama/jugar', {
      state: {
        challenge: selectedChallengeForPlay,
        difficulty,
      },
    });

    setSelectedChallengeForPlay(null);
  };

  return (
    <>
      <DailyChallengeCalendar
        gameId="crucigrama"
        title="Crucigrama diario"
        heroBadge="¡Desafío de hoy!"
        heroSubtitle="Elegí tu dificultad: crucigrama 7x7 fácil o 11x11 difícil con pistas claras."
        difficulty="facil"
        onPlayChallenge={handlePlayChallenge}
        renderCompletedModal={(challenge, onClose) => (
          <CrucigramaCompletedModal challenge={challenge} onClose={onClose} />
        )}
      />

      {/* Modal Reutilizable de Dificultad */}
      {selectedChallengeForPlay && (
        <DifficultyModal
          title="Elegí tu Dificultad"
          subtitle={selectedChallengeForPlay.dateStr}
          categoryBadge="Cuaderno de Mente Activa"
          options={CRUCIGRAMA_DIFFICULTY_OPTIONS}
          onSelectDifficulty={handleSelectDifficulty}
          onClose={() => setSelectedChallengeForPlay(null)}
        />
      )}
    </>
  );
};

export default CrucigramaCalendar;
