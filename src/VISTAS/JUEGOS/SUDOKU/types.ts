export interface SudokuCell {
  row: number;
  col: number;
  value: number;       // 0 si está vacía, 1-9 si tiene número colocado
  initial: boolean;     // true si vino fija en el puzzle original
  error: boolean;       // true si colisiona o difiere de la solución
  notes: number[];      // Anotaciones en lápiz
}

export type SudokuGrid = number[][]; // Matriz 9x9 de números (0-9)

export interface SudokuConfig {
  initialBoard: SudokuGrid;
  solution: SudokuGrid;
}
