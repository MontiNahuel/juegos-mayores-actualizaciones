import React from 'react';
import { useSudokuGame } from './useSudokuGame';
import { SudokuBoard } from './SudokuBoard';
import { SudokuKeypad } from './SudokuKeypad';
import { SudokuCompletedModal } from './SudokuCompletedModal';

export const SudokuGame: React.FC = () => {
  const game = useSudokuGame();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between pb-[max(calc(env(safe-area-inset-bottom,0px)+32px),48px)]">
      {/* Barra superior con botón Volver y Contador de 3 Vidas */}
      <header className="bg-white border-b border-[#E2E8F0] px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <button
          type="button"
          onClick={game.goBack}
          className="min-h-[44px] min-w-[44px] flex items-center gap-1 px-3 py-2 text-[#1E3A5F] hover:bg-[#F1F5F9] rounded-xl font-bold text-base transition-colors"
        >
          ‹ <span>Calendario</span>
        </button>

        {/* Indicador visual de 3 Vidas */}
        <div className="flex items-center gap-1.5 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-200">
          <span className="text-xs font-bold text-rose-700">Vidas:</span>
          <div className="flex gap-0.5 text-base">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i}>{i < game.lives ? '❤️' : '🤍'}</span>
            ))}
          </div>
        </div>
      </header>

      {/* Área central con Tablero 9x9 y Teclado táctil */}
      <main className="flex-1 flex flex-col justify-center items-center px-3 py-2">
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
          onHint={game.useHint}
          isNotesMode={game.isNotesMode}
          hintsLeft={game.hintsLeft}
          numberCounts={game.numberCounts}
        />
      </main>

      {/* Modales de Victoria y Fin de Partida */}
      {(game.isWon || game.isGameOver) && (
        <SudokuCompletedModal
          isGameOver={game.isGameOver}
          stars={game.stars}
          dateStr={game.dateStr}
          onRestart={game.restart}
          onExit={game.goBack}
        />
      )}
    </div>
  );
};

export default SudokuGame;
