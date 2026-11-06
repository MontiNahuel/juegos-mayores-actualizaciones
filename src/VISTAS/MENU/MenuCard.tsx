/* Presenta un juego con su ilustración y su botón para empezar. */
import { IonIcon } from '@ionic/react';
import { arrowForwardOutline } from 'ionicons/icons';
import './Menu.css';

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
const MenuCard: React.FC<MenuCardProps> = ({ game, onStart }) => (
  <article
    className={`menu-card menu-card--${game.id}${game.group === 'Narrativos' ? ' menu-card--narrative' : ''}`}
    aria-labelledby={`game-${game.id}`}
  >
    <div aria-hidden="true" className={`menu-card__visual menu-card__visual--${game.id}`}>
      {game.id === 'kings-court' ? <IonIcon icon={game.icon} /> : <div className={`menu-mini-board menu-mini-board--${game.id}`}>
        {(game.id === 'wordle' ? ['M','E','N','T','E'] : game.id === 'sudoku' ? ['1','','3','','2','','3','','1'] : game.id === 'sopa-letras' ? ['S','O','L','A','M','R','P','A','Z'] : ['','P','','S','O','L','','Z','']).map((cell,i) => <span key={i}>{cell}</span>)}
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

export default MenuCard;
