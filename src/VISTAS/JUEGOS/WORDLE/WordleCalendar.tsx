import React from 'react';
import { DailyChallengeCalendar, type DayChallenge } from '../../COMPONENTS/CALENDAR';
import { WordleCompletedModal } from '../../MODALS/WordleCompletedModal';

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
        <WordleCompletedModal challenge={challenge} onClose={onClose} />
      )}
    />
  );
};

export default WordleCalendar;
