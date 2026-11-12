import { useEffect, useRef } from "react";
import shuffleCartas from "../JUEGOS/NARRATIVO/ETAPA_0_1_SELECCIONAR_CARTAS/shuffleCartas";
import type { GameId } from "./menuGames";

const courtArtwork = new URL(
  "../../../public/assets/narrative/guardia.png",
  import.meta.url,
).href;
const courtFrame = new URL(
  "../../../public/assets/narrative/card-frame.png",
  import.meta.url,
).href;
const boards = {
  wordle: ["M", "E", "N", "T", "E"],
  "sopa-letras": ["S", "O", "L", "A", "M", "R", "P", "A", "Z"],
  sudoku: ["1", "", "3", "", "3", "", "3", "", "2"],
  crucigrama: ["", "S", "", "S", "O", "L", "", "L", ""],
};
const sudokuSolution = ["1", "2", "3", "2", "3", "1", "3", "1", "2"];

export default function GamePreview({
  gameId,
  active,
}: {
  gameId: GameId;
  active: boolean;
}) {
  const courtRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gameId === "kings-court" && active) {
      return shuffleCartas(courtRef.current, "[data-court-card]");
    }
  }, [gameId, active]);

  if (gameId === "kings-court") {
    return (
      <div
        ref={courtRef}
        className="menu-court-preview flex min-h-[90px] w-[104px] items-center justify-center gap-0 max-md:w-20"
      >
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            data-court-card=""
            className="relative block h-[66px] flex-[0_0_44px] overflow-hidden rounded-[5px] bg-[#172433] max-md:h-[57px] max-md:basis-[38px]"
          >
            <img
              className="h-full w-full origin-[50%_0] scale-[1.4] object-cover object-top"
              src={courtArtwork}
              alt=""
              loading="lazy"
              width="50"
              height="75"
            />
            <img
              className="absolute inset-0 h-full w-full"
              src={courtFrame}
              alt=""
              loading="lazy"
              width="50"
              height="75"
            />
          </span>
        ))}
      </div>
    );
  }

  const isWordle = gameId === "wordle";
  return (
    <div
      className={`menu-mini-board menu-mini-board--${gameId} grid -rotate-[5deg] max-[360px]:w-[60px] max-[360px]:gap-0.5 ${
        isWordle
          ? "w-[106px] grid-cols-5 gap-[3px] pt-7 max-[1001px]:w-20 max-md:pt-0"
          : "w-[100px] grid-cols-3 gap-1 max-[1001px]:w-[76px]"
      }`}
    >
      {boards[gameId].map((cell, index) => (
        <span
          key={index}
          className={`relative grid place-items-center rounded-[5px] bg-[var(--game-color)] leading-normal font-bold text-[#172433] ${isWordle ? "h-[34px] text-sm max-[360px]:text-[11px]" : "h-[30px] text-[17px]"}`}
          data-fill={gameId === "sudoku" ? sudokuSolution[index] : undefined}
        >
          {cell}
        </span>
      ))}
    </div>
  );
}
