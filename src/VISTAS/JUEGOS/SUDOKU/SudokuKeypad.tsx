import React from 'react';

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
    <div className="w-full max-w-[430px] mx-auto mt-3 px-2 space-y-2.5">
      {/* Botones funcionales */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={onToggleNotes}
          className={`h-11 rounded-xl font-bold flex items-center justify-center gap-1.5 text-sm border shadow-sm transition-all active:scale-95 ${
            isNotesMode
              ? 'bg-[#0284C7] text-white border-[#0284C7]'
              : 'bg-white text-[#334155] border-[#CBD5E1]'
          }`}
        >
          ✏️ <span>Lápiz {isNotesMode ? 'Activado' : ''}</span>
        </button>

        <button
          type="button"
          onClick={onErase}
          className="h-11 rounded-xl font-bold flex items-center justify-center gap-1.5 bg-white text-[#DC2626] border border-[#FECACA] text-sm shadow-sm active:scale-95 transition-all"
        >
          🗑️ <span>Borrar</span>
        </button>

        <button
          type="button"
          onClick={onHint}
          disabled={hintsLeft <= 0}
          className="h-11 rounded-xl font-bold flex items-center justify-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 text-sm shadow-sm active:scale-95 transition-all disabled:opacity-40"
        >
          💡 <span>Pista ({hintsLeft})</span>
        </button>
      </div>

      {/* Botonera 1 al 9 con contador de completitud */}
      <div className="grid grid-cols-9 gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
          const isComplete = (numberCounts[num] || 0) >= 9;

          return (
            <button
              key={num}
              type="button"
              disabled={isComplete}
              onClick={() => onNumber(num)}
              className={`h-13 sm:h-14 min-w-[36px] rounded-xl font-bold text-2xl flex flex-col items-center justify-center border-2 transition-all shadow-sm active:scale-95 ${
                isComplete
                  ? 'bg-slate-100 text-slate-400 border-slate-200 opacity-40'
                  : 'bg-white text-[#1E3A5F] border-[#CBD5E1] hover:border-[#0284C7] active:bg-[#0284C7] active:text-white'
              }`}
            >
              <span>{num}</span>
              <span className="text-[10px] font-normal leading-3 text-slate-500">
                {isComplete ? '✔' : 9 - (numberCounts[num] || 0)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
