/* Permite elegir un desafío diario de Wordle. */
import React from 'react';
import { DailyChallengeCalendar, type DayChallenge } from '../../COMPONENTS/CALENDAR';
import { CompletedModal } from '../../COMPONENTS/MODALS/CompletedModal';

export type { DayChallenge };

// Permite elegir un desafío diario de Wordle.
export const WordleCalendar: React.FC = () => {
  return (
    <DailyChallengeCalendar
      gameId="wordle"
      title="Palabra del día"
      heroBadge="¡Desafío de hoy!"
      heroSubtitle="5 letras para poner en marcha tu memoria, lenguaje y atención."
      playRoute="/juegos/wordle/jugar"
      renderCompletedModal={/* Responde a render completed modal desde este control. */ (challenge, onClose) => (
        <CompletedModal gameId="wordle" challenge={challenge} onClose={onClose} />
      )}
    />
  );
};

export default WordleCalendar;
