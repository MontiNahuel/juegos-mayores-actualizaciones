/* Presenta un juego con su ilustración y su botón para empezar. */
import { useEffect, useRef, useState } from "react";
import { IonIcon } from "@ionic/react";
import { arrowForwardOutline } from "ionicons/icons";
import GamePreview from "./GamePreview";
import type { MenuCardGame } from "./menuGames";

const accentClasses = {
  wordle: "[--game-color:#99dcd1]",
  "sopa-letras": "[--game-color:#f0bb98]",
  sudoku: "[--game-color:#c8bbf0]",
  crucigrama: "[--game-color:#a8ccef]",
  "kings-court": "[--game-color:#ecd098]",
};

interface MenuCardProps {
  game: MenuCardGame;
  onStart: () => void;
}

// Presenta un juego con su ilustración y su botón para empezar.
const MenuCard: React.FC<MenuCardProps> = ({ game, onStart }) => {
  const cardRef = useRef<HTMLElement>(null);
  const [previewStarted, setPreviewStarted] = useState(false);

  useEffect(() => {
    const card = cardRef.current;
    // Start only when most of the card is visible; re-arm after it fully leaves.
    if (!card || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.intersectionRatio >= 0.65) setPreviewStarted(true);
          else if (!entry.isIntersecting) setPreviewStarted(false);
        }
      },
      { threshold: [0, 0.65] },
    );
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  const isNarrative = game.group === "Narrativos";

  return (
    <article
      ref={cardRef}
      className={`menu-card grid min-w-0 grid-cols-[104px_minmax(0,1fr)] gap-[22px] rounded-2xl border border-[#52647b] p-[26px] text-menu-ink max-[1001px]:grid-cols-[76px_minmax(0,1fr)] max-[1001px]:gap-[18px] max-[1001px]:p-6 max-md:grid-cols-[80px_minmax(0,1fr)] max-md:gap-x-[18px] max-md:gap-y-2.5 max-[360px]:p-5 ${accentClasses[game.id]} ${previewStarted ? "menu-card--preview" : ""} ${isNarrative ? "col-span-full bg-[#2e3c50]" : "bg-menu-panel"}`}
      aria-labelledby={`game-${game.id}`}
    >
      <div
        aria-hidden="true"
        className={`menu-card__visual flex justify-center pt-1 text-[var(--game-color)] max-md:col-start-1 max-md:row-span-2 max-md:row-start-1 max-md:self-center ${isNarrative ? "items-center" : "items-start"}`}
      >
        <GamePreview gameId={game.id} active={previewStarted} />
      </div>
      <div className="menu-card__copy flex min-w-0 flex-col items-start max-md:contents">
        <h3
          id={`game-${game.id}`}
          className="menu-card__title m-0! text-2xl! leading-[1.3]! font-bold! max-md:col-start-2 max-md:[align-self:end]"
        >
          {game.title}
        </h3>
        <p className="menu-card__skill mt-1.5 mb-0 text-base leading-normal text-[var(--game-color)] max-md:col-start-2 max-md:m-0">
          {game.skill}
        </p>
        <p className="menu-card__description mt-3.5 mb-5 max-w-[65ch] text-base leading-[1.55] text-menu-copy max-md:col-span-full max-md:my-2">
          {game.description}
        </p>
        <button
          type="button"
          aria-label={`${game.available ? "Jugar" : "Próximamente"} ${game.title}`}
          disabled={!game.available}
          onClick={onStart}
          className="menu-card__play mt-auto inline-flex min-h-12 min-w-[116px] cursor-pointer items-center justify-between gap-3.5 rounded-[9px] border-0 border-none bg-[var(--game-color)] px-[18px] py-[9px] font-[inherit] text-lg leading-normal font-bold text-[#172433] transition-colors duration-150 ease-out hover:bg-[color-mix(in_srgb,var(--game-color),white_18%)] active:bg-[#495e77] disabled:cursor-default disabled:bg-[#e5eaf0] disabled:text-[#536479] max-md:col-span-full max-md:w-auto max-md:justify-self-start"
        >
          {game.available ? "Jugar" : "Próximamente"}
          {game.available && (
            <IonIcon icon={arrowForwardOutline} aria-hidden="true" />
          )}
        </button>
      </div>
    </article>
  );
};

export default MenuCard;
