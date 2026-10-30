/* Presenta un juego con su ilustración y su botón para empezar. */
import type { CSSProperties } from 'react';
import { IonBadge, IonButton, IonIcon } from '@ionic/react';
import { play } from 'ionicons/icons';
import { BrainIcon } from '../COMPONENTS/Icons/Icons';

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

const color = { ink: '#46556D', panel: '#DEE3EA' };

const styles: Record<string, CSSProperties> = {
  card: { background: '#FFFFFF', border: '1px solid #D5DCE5', borderRadius: 8, overflow: 'hidden' },
  visual: { alignItems: 'center', background: color.panel, display: 'flex', height: 144, justifyContent: 'center', position: 'relative' },
  brain: { color: '#FFFFFF', left: 15, position: 'absolute', top: 14 },
  tag: { borderRadius: 20, bottom: 14, left: 15, padding: '7px 13px', position: 'absolute' },
  copy: { padding: '18px 18px 20px' },
  description: { color: color.ink, fontSize: 16, lineHeight: 1.45, margin: '8px 0 0' },
};

// Presenta un juego con su ilustración y su botón para empezar.
const MenuCard: React.FC<MenuCardProps> = ({ game, onStart }) => (
  <article style={styles.card} className={game.group === 'Narrativos' ? 'md:col-span-2' : undefined}>
    <div aria-hidden="true" style={styles.visual}>
      <div style={styles.brain}><BrainIcon className="" size={24} /></div>
      <IonIcon icon={game.icon} style={{ color: game.accent, fontSize: 64 }} />

    </div>
    <div style={styles.copy}>
      <p style={{ color: game.accent, fontSize: 14, fontWeight: 800, margin: '0 0 6px' }}>{game.skill}</p>
      <h3 style={{ color: color.ink, fontSize: 22, lineHeight: 1.2, margin: 0 }}>{game.title}</h3>
      <p style={styles.description}>{game.description}</p>
      <IonButton
        aria-label={`${game.available ? 'Jugar' : 'Próximamente'} ${game.title}`}
        disabled={!game.available}
        fill={game.available ? 'solid' : 'outline'}
        onClick={/* Responde a click desde este control. */ () => onStart(game.id)}
        style={{ margin: '16px 0 0', '--border-radius': '6px' } as CSSProperties}
      >
        {game.available && <IonIcon icon={play} slot="start" />}
        {game.available ? 'Jugar' : 'Próximamente'}
      </IonButton>
    </div>
  </article>
);

export default MenuCard;
