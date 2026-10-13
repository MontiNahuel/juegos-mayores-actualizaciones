import React from 'react';
import { useSudokuGame } from './useSudokuGame';
import { SudokuBoard } from './SudokuBoard';
import { SudokuKeypad } from './SudokuKeypad';
import { SudokuCompletedModal } from './SudokuCompletedModal';

export const SudokuGame: React.FC = () => {
  const game = useSudokuGame();

  const difficultyLabels: Record<number, { label: string; bg: string; text: string }> = {
    1: { label: '🟢 Fácil', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800' },
    2: { label: '🟡 Medio', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800' },
    3: { label: '🔴 Alto', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-800' },
  };

  const diffBadge = difficultyLabels[game.difficultyLevel] || difficultyLabels[1];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between pb-[max(calc(env(safe-area-inset-bottom,0px)+32px),48px)]">
      {/* Barra superior con botón Volver, Dificultad (1, 2, 3) y Contador de Vidas (7, 5, 3) */}
      <header className="bg-white border-b border-[#E2E8F0] px-3 sm:px-4 py-2.5 flex items-center justify-between sticky top-0 z-10 shadow-sm gap-2">
        <button
          type="button"
          onClick={game.goBack}
          className="min-h-[44px] min-w-[44px] flex items-center gap-1 px-3 py-2 text-[#1E3A5F] hover:bg-[#F1F5F9] rounded-xl font-bold text-base transition-colors"
        >
          ‹ <span>Calendario</span>
        </button>

        {/* Badge de Nivel de Dificultad (1 = Fácil, 2 = Medio, 3 = Alto) */}
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold border shadow-xs ${diffBadge.bg} ${diffBadge.text}`}
        >
          {diffBadge.label}
        </span>

        {/* Indicador visual de Vidas dinámicas según dificultad (7 en Fácil, 5 en Medio, 3 en Alto) */}
        <div className="flex items-center gap-1 sm:gap-1.5 bg-rose-50 px-2 sm:px-3 py-1 rounded-full border border-rose-200">
          <span className="text-xs font-bold text-rose-700 hidden lg:inline">Vidas:</span>
          <div className="flex gap-0.5 text-xs sm:text-sm tracking-tight">
            {Array.from({ length: game.maxLives }).map((_, i) => (
              <span key={i} className="leading-none select-none">
                {i < game.lives ? '❤️' : '🤍'}
              </span>
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
