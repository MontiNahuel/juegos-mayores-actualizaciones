import React from 'react';
import { IconPencil, IconTrash, IconLightbulb, IconCheckSmall } from './SudokuIcons';

interface SudokuKeypadProps {
  onNumber: (num: number) => void;
  onErase: () => void;
  onToggleNotes: () => void;
  onHint: () => void;
  isNotesMode: boolean;
  hintsLeft: number;
  numberCounts: Record<number, number>;
}

export const SudokuKeypad: React.FC<SudokuKeypadProps> = ({
  onNumber,
  onErase,
  onToggleNotes,
  onHint,
  isNotesMode,
  hintsLeft,
  numberCounts,
}) => {
  return (
    <div className="w-full max-w-[430px] mx-auto mt-2.5 sm:mt-3 px-2 space-y-2.5">
      {/* Botones funcionales con SVGs elegantes */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={onToggleNotes}
          className={`h-11 rounded-xl font-bold flex items-center justify-center gap-1.5 text-xs sm:text-sm border shadow-xs transition-all active:scale-95 ${
            isNotesMode
              ? 'bg-[#0284C7] text-white border-[#0284C7] shadow-inner'
              : 'bg-white text-[#334155] border-[#CBD5E1] hover:bg-slate-50'
          }`}
        >
          <IconPencil size={17} color={isNotesMode ? '#FFFFFF' : '#0284C7'} />
          <span>{isNotesMode ? 'Lápiz Activo' : 'Lápiz'}</span>
        </button>

        <button
          type="button"
          onClick={onErase}
          className="h-11 rounded-xl font-bold flex items-center justify-center gap-1.5 bg-white text-[#DC2626] border border-[#FECACA] hover:bg-rose-50/60 text-xs sm:text-sm shadow-xs active:scale-95 transition-all"
        >
          <IconTrash size={17} color="#DC2626" />
          <span>Borrar</span>
        </button>

        <button
          type="button"
          onClick={onHint}
          disabled={hintsLeft <= 0}
          className="h-11 rounded-xl font-bold flex items-center justify-center gap-1.5 bg-amber-50 hover:bg-amber-100/70 text-amber-900 border border-amber-200 text-xs sm:text-sm shadow-xs active:scale-95 transition-all disabled:opacity-40"
        >
          <IconLightbulb size={17} color="#D97706" />
          <span>Pista ({hintsLeft})</span>
        </button>
      </div>

      {/* Botonera 1 al 9 con contador de completitud */}
      <div className="grid grid-cols-9 gap-1 sm:gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
          const isComplete = (numberCounts[num] || 0) >= 9;

          return (
            <button
              key={num}
              type="button"
              disabled={isComplete}
              onClick={() => onNumber(num)}
              className={`h-12 sm:h-14 min-w-[34px] sm:min-w-[38px] rounded-xl font-bold text-xl sm:text-2xl flex flex-col items-center justify-center border-2 transition-all shadow-xs active:scale-95 ${
                isComplete
                  ? 'bg-slate-100 text-slate-400 border-slate-200 opacity-40 cursor-default'
                  : 'bg-white text-[#1E3A5F] border-[#CBD5E1] hover:border-[#0284C7] active:bg-[#0284C7] active:text-white cursor-pointer'
              }`}
            >
              <span className="leading-tight">{num}</span>
              <span className="text-[10px] font-semibold leading-3 text-slate-500 flex items-center justify-center h-3">
                {isComplete ? <IconCheckSmall size={11} color="#10B981" /> : 9 - (numberCounts[num] || 0)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
