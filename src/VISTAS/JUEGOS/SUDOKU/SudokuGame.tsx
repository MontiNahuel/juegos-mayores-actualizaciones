/* Arma la pantalla de Sudoku con tablero, teclado y controles. */
import React from 'react';
import { useSudokuGame } from './useSudokuGame';
import { SudokuBoard } from './SudokuBoard';
import { SudokuKeypad } from './SudokuKeypad';
import { CompletedModal } from '../../COMPONENTS/MODALS/CompletedModal';
import { GameHeader } from '../../COMPONENTS/GameHeader';

// Arma la pantalla de Sudoku con tablero, teclado y controles.
export const SudokuGame: React.FC = () => {
  const game = useSudokuGame();

  const difficultyLabels: Record<number, { label: string; bg: string; text: string; border: string }> = {
    1: { label: 'Nivel Inicial', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300' },
    2: { label: 'Nivel Intermedio', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300' },
    3: { label: 'Nivel Experto', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-300' },
  };

  const diffBadge = difficultyLabels[game.difficultyLevel] || difficultyLabels[1];

  return (
    <div
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
      }}
      className="min-h-dvh bg-[#F8FAFC] flex flex-col justify-between"
    >
      {/* Barra superior estandarizada con Safe Area y centrado geométrico */}
      <GameHeader
        title="Sudoku"
        onBack={game.goBack}
        backLabel="Calendario"
        onHint={game.useHint}
        hintDisabled={!game.progressReady || game.isWon}
        badges={
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border shadow-2xs whitespace-nowrap ${diffBadge.bg} ${diffBadge.text} ${diffBadge.border}`}
            >
              {diffBadge.label}
            </span>
          </div>
        }
      />

      {/* Área central con Tablero 9x9 y Teclado táctil acotado en desktop */}
      <main className="flex-1 flex flex-col justify-center items-center px-2 sm:px-4 py-2 w-full max-w-xl mx-auto">
        <SudokuBoard
          cells={game.cells}
          selectedRow={game.selectedRow}
          selectedCol={game.selectedCol}
          onSelectCell={game.selectCell}
        />

        <SudokuKeypad
          onNumber={game.inputNumber}
          onErase={game.eraseCell}
          onToggleNotes={game.toggleNotes}
          isNotesMode={game.isNotesMode}
          numberCounts={game.numberCounts}
        />
      </main>

      {/* Modal accesible de victoria */}
      {game.isWon && (
        <CompletedModal gameId="sudoku" completion={game.completion}
          dateStr={game.dateStr}
          onRestart={game.restart}
          onClose={game.goBack}
        />
      )}
    </div>
  );
};

export default SudokuGame;
