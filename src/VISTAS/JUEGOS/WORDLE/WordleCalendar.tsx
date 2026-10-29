import React from 'react';
import { DailyChallengeCalendar, type DayChallenge } from '../../COMPONENTS/CALENDAR';
import { CompletedModal } from '../../COMPONENTS/MODALS/CompletedModal';

export type { DayChallenge };

export const WordleCalendar: React.FC = () => {
  return (
    <DailyChallengeCalendar
      gameId="wordle"
      title="Palabra del día"
      heroBadge="¡Desafío de hoy!"
      heroSubtitle="5 letras para poner en marcha tu memoria, lenguaje y atención."
      playRoute="/juegos/wordle/jugar"
      renderCompletedModal={(challenge, onClose) => (
        <CompletedModal gameId="wordle" challenge={challenge} onClose={onClose} />
      )}
    />
  );
};

export default WordleCalendar;
