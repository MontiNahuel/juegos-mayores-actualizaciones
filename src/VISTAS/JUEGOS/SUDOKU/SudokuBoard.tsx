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
    <div className="mx-auto w-full max-w-[430px] select-none rounded-2xl border border-[#8175a5] bg-[var(--app-panel)] p-1.5">
      <div className="grid grid-cols-9 gap-px overflow-hidden rounded-xl border-2 border-[#8175a5] bg-[#8175a5]">
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
            const borderR = (c + 1) % 3 === 0 && c !== 8 ? 'border-r-2 border-r-[#8175a5]' : '';
            const borderB = (r + 1) % 3 === 0 && r !== 8 ? 'border-b-2 border-b-[#8175a5]' : '';

            let bg = 'bg-white';
            if (cell.error) {
              bg = 'bg-red-100 ring-2 ring-inset ring-red-400';
            } else if (isSelected) {
              bg = 'bg-[#c8bbf0] ring-2 ring-inset ring-[#8175a5]';
            } else if (isSameNumber) {
              bg = 'bg-[#e3dcf6]';
            } else if (isSameRowOrCol || isSameBlock) {
              bg = 'bg-[#f3f0fa]';
            }

            let text = 'text-[#69588d] font-bold text-2xl';
            if (cell.initial) text = 'text-[#253247] font-black text-2xl';
            if (cell.error) text = 'text-[#DC2626] font-black text-2xl';

            return (
              <button
                key={`${r}-${c}`}
                type="button"
                onClick={/* Responde a click desde este control. */ () => onSelectCell(r, c)}
                className={`relative flex aspect-square min-w-0 items-center justify-center transition-colors duration-200 ${borderR} ${borderB} ${bg}`}
                aria-label={`Fila ${r + 1}, Columna ${c + 1}, ${cell.value > 0 ? (cell.error ? `Incorrecto ${cell.value}` : `Valor ${cell.value}`) : 'Vacío'}`}
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
