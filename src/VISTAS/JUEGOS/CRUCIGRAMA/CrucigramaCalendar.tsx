import React from 'react';
import { DailyChallengeCalendar, type DayChallenge } from '../../COMPONENTS/CALENDAR';
import { CrucigramaCompletedModal } from './CrucigramaCompletedModal';

export type { DayChallenge };

export const CrucigramaCalendar: React.FC = () => {
  return (
    <DailyChallengeCalendar
      gameId="crucigrama"
      title="Crucigrama diario"
      heroBadge="¡Desafío de hoy!"
      heroSubtitle="Crucigrama 7x7 con pistas claras para ejercitar vocabulario, memoria y concentración."
      playRoute="/juegos/crucigrama/jugar"
      renderCompletedModal={(challenge, onClose) => (
        <CrucigramaCompletedModal challenge={challenge} onClose={onClose} />
      )}
    />
  );
};

export default CrucigramaCalendar;
