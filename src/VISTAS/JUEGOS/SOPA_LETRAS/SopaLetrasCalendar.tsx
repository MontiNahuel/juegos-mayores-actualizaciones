/* Abre la sopa de letras desde su calendario de desafíos. */
import React from 'react';
import { DailyChallengeCalendar, type DayChallenge } from '../../COMPONENTS/CALENDAR';
import { CompletedModal } from '../../COMPONENTS/MODALS/CompletedModal';

export type { DayChallenge };

// Abre la sopa de letras desde su calendario de desafíos.
export const SopaLetrasCalendar: React.FC = () => {
  return (
    <DailyChallengeCalendar
      gameId="sopa_letras"
      title="Sopa de letras"
      heroBadge="¡Desafío de hoy!"
      heroSubtitle="4 palabras temáticas para ejercitar tu atención visual, rastreo y memoria."
      playRoute="/juegos/sopa-letras/jugar"
      renderCompletedModal={/* Responde a render completed modal desde este control. */ (challenge, onClose) => (
        <CompletedModal gameId="sopa_letras" challenge={challenge} onClose={onClose} />
      )}
    />
  );
};

export default SopaLetrasCalendar;
