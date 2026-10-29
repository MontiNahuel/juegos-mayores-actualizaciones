/* Dibuja las celdas del Sudoku con números, notas y selección. */
﻿import React from 'react';
import { SudokuCell } from './types';

interface SudokuBoardProps {
  cells: SudokuCell[][];
  selectedRow: number | null;
  selectedCol: number | null;
  onSelectCell: (row: number, col: number) => void;
}

// Dibuja las celdas del Sudoku con números, notas y selección.
export const SudokuBoard: React.FC<SudokuBoardProps> = ({
  cells,
  selectedRow,
  selectedCol,
  onSelectCell,
}) => {
  const selectedValue =
    selectedRow !== null && selectedCol !== null && cells[selectedRow]?.[selectedCol]
      ? cells[selectedRow][selectedCol].value
      : 0;

  return (
    <div className="w-full max-w-[430px] mx-auto p-1.5 bg-[#1E3A5F] rounded-2xl shadow-xl select-none">
      <div className="grid grid-cols-9 gap-[1px] bg-[#94A3B8] border-2 border-[#1E3A5F] rounded-xl overflow-hidden">
        {cells.map(/* Prepara el resultado de cada elemento. */ (rowCells, r) =>
          rowCells.map(/* Prepara el resultado de cada elemento. */ (cell, c) => {
            const isSelected = selectedRow === r && selectedCol === c;
            const isSameRowOrCol = selectedRow === r || selectedCol === c;
            const isSameBlock =
              selectedRow !== null &&
              selectedCol !== null &&
              Math.floor(selectedRow / 3) === Math.floor(r / 3) &&
              Math.floor(selectedCol / 3) === Math.floor(c / 3);

            const isSameNumber = selectedValue > 0 && cell.value === selectedValue && !isSelected;

            // División marcada para bloques 3x3
            const borderR = (c + 1) % 3 === 0 && c !== 8 ? 'border-r-2 border-r-[#1E3A5F]' : '';
            const borderB = (r + 1) % 3 === 0 && r !== 8 ? 'border-b-2 border-b-[#1E3A5F]' : '';

            let bg = 'bg-white';
            if (isSelected) bg = 'bg-[#BAE6FD] ring-2 ring-inset ring-[#0284C7]';
            else if (isSameNumber) bg = 'bg-[#E0F2FE]';
            else if (isSameRowOrCol || isSameBlock) bg = 'bg-[#F8FAFC]';

            let text = 'text-[#0284C7] font-bold text-2xl';
            if (cell.initial) text = 'text-[#1E3A5F] font-black text-2xl';
            if (cell.error) text = 'text-[#DC2626] font-bold text-2xl bg-red-100';

            return (
              <button
                key={`${r}-${c}`}
                type="button"
                onClick={/* Responde a click desde este control. */ () => onSelectCell(r, c)}
                className={`aspect-square min-w-[36px] min-h-[36px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center relative transition-colors ${borderR} ${borderB} ${bg}`}
                aria-label={`Fila ${r + 1}, Columna ${c + 1}, ${cell.value > 0 ? `Valor ${cell.value}` : 'Vacío'}`}
              >
                {cell.value > 0 ? (
                  <span className={text}>{cell.value}</span>
                ) : cell.notes.length > 0 ? (
                  <div className="grid grid-cols-3 gap-[1px] w-full h-full p-[2px] pointer-events-none">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(/* Prepara el resultado de cada elemento. */ n => (
                      <span key={n} className="text-[9px] text-[#64748B] font-bold flex items-center justify-center">
                        {cell.notes.includes(n) ? n : ''}
                      </span>
                    ))}
                  </div>
                ) : null}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
