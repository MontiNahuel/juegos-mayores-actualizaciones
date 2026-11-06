/* Presenta un juego con su ilustración y su botón para empezar. */
import { useEffect, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { arrowForwardOutline } from 'ionicons/icons';
import shuffleCartas from '../JUEGOS/NARRATIVO/ETAPA_0_1_SELECCIONAR_CARTAS/shuffleCartas';
import './Menu.css';

const courtArtwork = new URL('../../../public/assets/narrative/guardia.png', import.meta.url).href;
const courtFrame = new URL('../../../public/assets/narrative/card-frame.png', import.meta.url).href;

export type GameGroup = 'Clásicos' | 'Narrativos' | 'Puzzles';

export interface MenuCardGame {
  id: string;
  group: GameGroup;
  title: string;
  skill: string;
  description: string;
  icon: string;
  accent: string;
  available?: boolean;
}

interface MenuCardProps {
  game: MenuCardGame;
  onStart: (id: string) => void;
}

// Presenta un juego con su ilustración y su botón para empezar.
const MenuCard: React.FC<MenuCardProps> = ({ game, onStart }) => {
  const cardRef = useRef<HTMLElement>(null);
  const courtRef = useRef<HTMLDivElement>(null);
  const [previewStarted, setPreviewStarted] = useState(false);

  useEffect(() => {
    const card = cardRef.current;
    // Start only when most of the card is visible; re-arm after it fully leaves.
    if (!card || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.intersectionRatio >= 0.65) setPreviewStarted(true);
        else if (!entry.isIntersecting) setPreviewStarted(false);
      }
    }, { threshold: [0, 0.65] });
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (game.id === 'kings-court' && previewStarted) {
      return shuffleCartas(courtRef.current, '[data-court-card]');
    }
  }, [game.id, previewStarted]);

  return (
  <article
    ref={cardRef}
    className={`menu-card menu-card--${game.id}${previewStarted ? ' menu-card--preview' : ''}${game.group === 'Narrativos' ? ' menu-card--narrative' : ''}`}
    aria-labelledby={`game-${game.id}`}
  >
    <div aria-hidden="true" className={`menu-card__visual menu-card__visual--${game.id}`}>
      {game.id === 'kings-court' ? <div ref={courtRef} className="menu-court-preview">
        {[0,1,2].map(index => <span key={index} data-court-card="">
          <img className="menu-court-preview__art" src={courtArtwork} alt="" loading="lazy" width="50" height="75" />
          <img className="menu-court-preview__frame" src={courtFrame} alt="" loading="lazy" width="50" height="75" />
        </span>)}
      </div> : <div className={`menu-mini-board menu-mini-board--${game.id}`}>
        {(game.id === 'wordle' ? ['M','E','N','T','E'] : game.id === 'sudoku' ? ['1','','3','','3','','3','','2'] : game.id === 'sopa-letras' ? ['S','O','L','A','M','R','P','A','Z'] : ['','S','','S','O','L','','L','']).map((cell,i) => <span key={i} data-fill={game.id === 'sudoku' ? ['1','2','3','2','3','1','3','1','2'][i] : undefined}>{cell}</span>)}
      </div>}
    </div>
    <div className="menu-card__copy">
      <h3 id={`game-${game.id}`} className="menu-card__title">{game.title}</h3>
      <p className="menu-card__skill">{game.skill}</p>
      <p className="menu-card__description">{game.description}</p>
      <button
        type="button"
        aria-label={`${game.available ? 'Jugar' : 'Próximamente'} ${game.title}`}
        disabled={!game.available}
        onClick={() => onStart(game.id)}
        className="menu-card__play"
      >
        {game.available ? 'Jugar' : 'Próximamente'}
        {game.available && <IonIcon icon={arrowForwardOutline} aria-hidden="true" />}
      </button>
    </div>
  </article>
  );
};

export default MenuCard;
