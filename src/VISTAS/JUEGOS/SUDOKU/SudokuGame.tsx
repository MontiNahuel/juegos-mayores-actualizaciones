import React from 'react';
import { useSudokuGame } from './useSudokuGame';
import { SudokuBoard } from './SudokuBoard';
import { SudokuKeypad } from './SudokuKeypad';
import { SudokuCompletedModal } from './SudokuCompletedModal';
import { IconHeart, IconChevronLeft } from './SudokuIcons';

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
      {/* Barra superior con Safe Area, Centrado Matemático por Grid y SVGs */}
      <header
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)',
          paddingBottom: '10px',
        }}
        className="bg-white border-b border-[#E2E8F0] px-2 sm:px-4 sticky top-0 z-10 shadow-xs"
      >
        <div className="max-w-xl mx-auto w-full grid grid-cols-3 items-center">
          {/* Columna Izquierda: Botón Volver al Calendario */}
          <div className="flex justify-start">
            <button
              type="button"
              onClick={game.goBack}
              className="min-h-[44px] inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-[#1E3A5F] hover:bg-[#F1F5F9] active:bg-[#E2E8F0] rounded-xl font-bold text-sm sm:text-base transition-colors"
              aria-label="Volver al Calendario"
            >
              <IconChevronLeft size={19} color="#1E3A5F" />
              <span className="hidden xs:inline">Calendario</span>
            </button>
          </div>

          {/* Columna Central: Nivel de Dificultad (¡Perfectamente centrado siempre!) */}
          <div className="flex justify-center">
            <span
              className={`px-3 py-1 rounded-full text-xs sm:text-sm font-extrabold border shadow-2xs whitespace-nowrap ${diffBadge.bg} ${diffBadge.text} ${diffBadge.border}`}
            >
              {diffBadge.label}
            </span>
          </div>

          {/* Columna Derecha: Contador de Vidas con SVGs vectoriales limpios */}
          <div className="flex justify-end">
            <div className="inline-flex items-center gap-1 bg-rose-50/70 px-2 sm:px-2.5 py-1 rounded-full border border-rose-200 shadow-2xs">
              <span className="text-xs font-bold text-rose-700 hidden lg:inline">Vidas:</span>
              <div className="flex items-center gap-0.5 sm:gap-1">
                {Array.from({ length: game.maxLives }).map((_, i) => (
                  <IconHeart key={i} filled={i < game.lives} size={15} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

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
