import React from 'react';
import { DailyChallengeCalendar } from '../../COMPONENTS/CALENDAR';
import { SudokuCompletedModal } from './SudokuCompletedModal';

export const SudokuCalendar: React.FC = () => {
  return (
    <DailyChallengeCalendar
      gameId="sudoku"
      title="Desafíos Diarios de Sudoku"
      heroBadge="DESAFÍO DEL DÍA"
      heroSubtitle="Poné a prueba tu concentración y lógica completando el tablero de hoy."
      playRoute="/juegos/sudoku/jugar"
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
  );
};

export default SudokuCalendar;
