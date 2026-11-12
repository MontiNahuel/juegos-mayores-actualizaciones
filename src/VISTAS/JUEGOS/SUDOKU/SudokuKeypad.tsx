/* Muestra números y acciones para escribir, borrar o anotar. */
import React from 'react';
import { IconPencil, IconTrash, IconCheckSmall } from './SudokuIcons';

interface SudokuKeypadProps {
  onNumber: (num: number) => void;
  onErase: () => void;
  onToggleNotes: () => void;
  isNotesMode: boolean;
  numberCounts: Record<number, number>;
}

// Muestra números y acciones para escribir, borrar o anotar.
export const SudokuKeypad: React.FC<SudokuKeypadProps> = ({
  onNumber,
  onErase,
  onToggleNotes,
  isNotesMode,
  numberCounts,
}) => {
  return (
    <div className="w-full max-w-[430px] mx-auto mt-2.5 sm:mt-3 px-2 space-y-2.5">
      {/* Botones funcionales con SVGs elegantes */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onToggleNotes}
          className={`h-11 rounded-xl font-bold flex items-center justify-center gap-1.5 text-xs sm:text-sm border shadow-xs transition-all active:scale-95 ${
            isNotesMode
              ? 'border-[#69588d] bg-[#69588d] text-white shadow-inner'
              : 'bg-[var(--app-text)] text-[#253247] border-[#cbd3df] hover:bg-white'
          }`}
        >
          <IconPencil size={17} color={isNotesMode ? '#FFFFFF' : '#69588d'} />
          <span>{isNotesMode ? 'Lápiz Activo' : 'Lápiz'}</span>
        </button>

        <button
          type="button"
          onClick={onErase}
          className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-[#a96f79] bg-[#3d2e3b] px-3 text-xs font-bold text-[#ffd9df] transition-all active:scale-95 hover:bg-[#4a3543] sm:text-sm"
        >
          <IconTrash size={17} color="#ffd9df" />
          <span>Borrar</span>
        </button>


      </div>

      {/* Botonera 1 al 9 con contador de completitud */}
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(/* Prepara el resultado de cada elemento. */ (num) => {
          const isComplete = (numberCounts[num] || 0) >= 9;

          return (
            <button
              key={num}
              type="button"
              disabled={isComplete}
              onClick={/* Responde a click desde este control. */ () => onNumber(num)}
              className={`flex h-12 min-w-0 flex-col items-center justify-center rounded-xl border-2 font-bold text-xl transition-all active:scale-95 sm:h-14 sm:text-2xl ${
                isComplete
                  ? 'cursor-default border-[#526176] bg-[var(--app-panel-raised)] text-[#aeb9c8] opacity-60'
                  : 'cursor-pointer border-[#cbd3df] bg-[var(--app-text)] text-[#253247] hover:border-[#8175a5] active:bg-[#c8bbf0] active:text-[#253247]'
              }`}
            >
              <span className="leading-tight">{num}</span>
              <span className="flex h-3 items-center justify-center text-xs leading-3 font-semibold text-[#526176]">
                {isComplete ? <IconCheckSmall size={11} color="#17695f" /> : 9 - (numberCounts[num] || 0)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
