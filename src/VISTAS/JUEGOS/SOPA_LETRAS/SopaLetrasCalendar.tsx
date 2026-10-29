import React from 'react';
import { DailyChallengeCalendar, type DayChallenge } from '../../COMPONENTS/CALENDAR';
import { SopaLetrasCompletedModal } from '../../MODALS/SopaLetrasCompletedModal';

export type { DayChallenge };

export const SopaLetrasCalendar: React.FC = () => {
  return (
    <DailyChallengeCalendar
      gameId="sopa_letras"
      title="Sopa de letras"
      heroBadge="¡Desafío de hoy!"
      heroSubtitle="4 palabras temáticas para ejercitar tu atención visual, rastreo y memoria."
      playRoute="/juegos/sopa-letras/jugar"
      renderCompletedModal={(challenge, onClose) => (
        <SopaLetrasCompletedModal challenge={challenge} onClose={onClose} />
      )}
    />
  );
};

export default SopaLetrasCalendar;
