/* Juegos con calificación y su acento visual, alineados con el menú. */
import {
  gridOutline,
  keypadOutline,
  searchOutline,
  textOutline,
} from 'ionicons/icons';

export interface JuegoPerfil {
  /** Identificador que usa el backend en user_attempts. */
  id: string;
  /** Nombre breve para las pestañas y el selector. */
  corto: string;
  titulo: string;
  enfoque: string;
  acento: string;
  icono: string;
}

export const JUEGOS_PERFIL: JuegoPerfil[] = [
  {
    id: 'wordle',
    corto: 'Wordle',
    titulo: 'Palabra del día',
    enfoque: 'Memoria y vocabulario',
    acento: '#99dcd1',
    icono: textOutline,
  },
  {
    id: 'sopa_letras',
    corto: 'Sopa',
    titulo: 'Sopa de letras',
    enfoque: 'Atención visual y rastreo',
    acento: '#f0bb98',
    icono: searchOutline,
  },
  {
    id: 'sudoku',
    corto: 'Sudoku',
    titulo: 'Sudoku diario',
    enfoque: 'Lógica y concentración',
    acento: '#c8bbf0',
    icono: gridOutline,
  },
  {
    id: 'crucigrama',
    corto: 'Crucigrama',
    titulo: 'Crucigrama diario',
    enfoque: 'Lenguaje y recuerdos',
    acento: '#a8ccef',
    icono: keypadOutline,
  },
];
