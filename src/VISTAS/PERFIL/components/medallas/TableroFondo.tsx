/* Tablero del menú como fondo tenue de la tarjeta de medallas. */
import type { CSSProperties } from 'react';
import type { JuegoPerfil } from './perfilGames';
import './TableroFondo.css';

interface Tablero {
  cols: number;
  celdas: string[];
  relleno?: string[];
}

const TABLEROS: Record<string, Tablero> = {
  wordle: { cols: 5, celdas: ['M', 'E', 'N', 'T', 'E'] },
  sopa_letras: {
    cols: 3,
    celdas: ['S', 'O', 'L', 'A', 'M', 'R', 'P', 'A', 'Z'],
  },
  sudoku: {
    cols: 3,
    celdas: ['1', '', '3', '', '3', '', '3', '', '2'],
    relleno: ['1', '2', '3', '2', '3', '1', '3', '1', '2'],
  },
  crucigrama: {
    cols: 3,
    celdas: ['', 'S', '', 'S', 'O', 'L', '', 'L', ''],
  },
};

interface TableroFondoProps {
  juego: JuegoPerfil;
}

export function TableroFondo({ juego }: TableroFondoProps) {
  const tablero = TABLEROS[juego.id];
  if (!tablero) return null;

  const esWordle = juego.id === 'wordle';
  const estilo: CSSProperties = {
    ['--game-color' as string]: juego.acento,
    ['--tile' as string]: esWordle ? '44px' : '30px',
    ['--cols' as string]: tablero.cols,
  };

  return (
    <div
      aria-hidden="true"
      style={estilo}
      className={`perfil-tablero perfil-tablero--${juego.id} pointer-events-none absolute ${
        esWordle ? 'top-0.5' : '-top-3'
      } left-1/2 z-0 grid translate-x-[calc(-50%_-_70px)] -rotate-[5deg] grid-cols-[repeat(var(--cols),var(--tile))] gap-[3px] opacity-30 brightness-50 saturate-[.8] max-[820px]:hidden`}
    >
      {tablero.celdas.map((celda, indice) => {
        const vacia = celda === '';
        const resaltada = esWordle && indice === 2;
        const estiloCelda = resaltada
          ? { background: '#418478', color: '#fff' }
          : undefined;

        return (
          <span
            key={indice}
            style={estiloCelda}
            data-fill={juego.id === 'sudoku' && vacia ? tablero.relleno?.[indice] : undefined}
            className={`grid size-[var(--tile)] place-items-center rounded-[15%] bg-[var(--game-color)] text-[calc(var(--tile)*.42)] leading-none font-bold text-[#172433] ${
              resaltada ? "translate-y-[calc(var(--tile)*-.26)]" : ''
            } ${juego.id === 'sudoku' && vacia ? 'opacity-[.38]' : ''}`}
          >
            {celda}
          </span>
        );
      })}
    </div>
  );
}

export default TableroFondo;
