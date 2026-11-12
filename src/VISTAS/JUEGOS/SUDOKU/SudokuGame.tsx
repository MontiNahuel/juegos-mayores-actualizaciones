/* Arma la pantalla de Sudoku con tablero, teclado y controles. */
import React from 'react';
import { useSudokuGame } from './useSudokuGame';
import { SudokuBoard } from './SudokuBoard';
import { SudokuKeypad } from './SudokuKeypad';
import { CompletedModal } from '../../COMPONENTS/MODALS/CompletedModal';
import AppNavbar from '../../COMPONENTS/Navbar/AppNavbar';

// Arma la pantalla de Sudoku con tablero, teclado y controles.
export const SudokuGame: React.FC = () => {
  const game = useSudokuGame();

  const difficultyLabels: Record<number, { label: string }> = {
    1: { label: 'Nivel Inicial' },
    2: { label: 'Nivel Intermedio' },
    3: { label: 'Nivel Experto' },
  };

  const diffBadge = difficultyLabels[game.difficultyLevel] || difficultyLabels[1];

  return (
    <div
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
      }}
      className="cognitive-game cognitive-game--sudoku flex min-h-dvh flex-col justify-between"
    >
      {/* Barra superior estandarizada con Safe Area y centrado geométrico */}
      <AppNavbar view={{ kind: 'game',
title: "Sudoku",
onBack: game.goBack,
details: <>{<div className="flex items-center gap-1.5 sm:gap-2">
            <span
              className="whitespace-nowrap rounded-full border border-[#8175a5] bg-[#3b344f] px-2.5 py-0.5 text-xs font-extrabold text-[#e0d8fa]"
            >
              {diffBadge.label}
            </span>
          </div>}</>,
onHint: game.useHint,
hintDisabled: !game.progressReady || game.isWon }} />

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
        <CompletedModal gameId="sudoku" completion={game.completion} continuationDateKey={game.dateKey}
          dateStr={game.dateStr}
          onRestart={game.restart}
          onClose={game.goBack}
        />
      )}
    </div>
  );
};

export default SudokuGame;
