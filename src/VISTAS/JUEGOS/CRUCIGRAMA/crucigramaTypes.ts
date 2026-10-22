export interface WordDef {
  id: string;
  number: number;
  direction: 'horizontal' | 'vertical';
  word: string;
  length: number;
  row: number;
  col: number;
  coords: [number, number][];
  clue: string;
}

export interface CellDef {
  row: number;
  col: number;
  is_block: boolean;
  letter: string;
  number?: number | null;
  across_num?: number | null;
  down_num?: number | null;
}

export const cleanClueText = (clue = '') => clue.replace(/^Definici[oó]n\s*[:\-]?\s*/i, '').trim();
