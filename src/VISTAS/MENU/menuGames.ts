export type GameId =
  "wordle" | "sopa-letras" | "sudoku" | "crucigrama" | "kings-court";
export type GameGroup = "Clásicos" | "Narrativos";

export interface MenuCardGame {
  id: GameId;
  path: string;
  group: GameGroup;
  title: string;
  skill: string;
  description: string;
  available: boolean;
}

const games: MenuCardGame[] = [
  {
    id: "wordle",
    path: "/juegos/wordle",
    group: "Clásicos",
    title: "Palabra del día",
    skill: "Memoria y vocabulario",
    description:
      "Encontrá la palabra y poné a trabajar tu memoria con pistas claras.",
    available: true,
  },
  {
    id: "sopa-letras",
    path: "/juegos/sopa-letras",
    group: "Clásicos",
    title: "Sopa de letras",
    skill: "Atención visual y rastreo",
    description:
      "Buscá 4 palabras temáticas en una cuadrícula clara y entretenida.",
    available: true,
  },
  {
    id: "sudoku",
    path: "/juegos/sudoku",
    group: "Clásicos",
    title: "Sudoku diario",
    skill: "Lógica y concentración",
    description:
      "Tableros adaptados con 3 niveles de dificultad para entrenar sin apuro.",
    available: true,
  },
  {
    id: "crucigrama",
    path: "/juegos/crucigrama",
    group: "Clásicos",
    title: "Crucigrama diario",
    skill: "Lenguaje y recuerdos",
    description:
      "Crucigrama 7x7 con pistas claras para ejercitar tu vocabulario y memoria.",
    available: true,
  },
  {
    id: "kings-court",
    path: "/juegos/kings-court",
    group: "Narrativos",
    title: "King's Court",
    skill: "Decisión y memoria",
    description: "Elegí a los miembros de tu corte para comenzar la historia.",
    available: true,
  },
];

export const gameSections = (["Clásicos", "Narrativos"] as const).map(
  (title) => ({
    title,
    games: games.filter((game) => game.group === title),
  }),
);
