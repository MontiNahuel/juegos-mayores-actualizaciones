import { useEffect, useRef, useState } from 'react';
import { loadCourtPreview, type CourtPreviewCard } from './courtPreviewService';
import shuffleCartas from '../JUEGOS/NARRATIVO/ETAPA_0_1_SELECCIONAR_CARTAS/shuffleCartas';

const artwork = new URL('../../../public/assets/narrative/guardia.png', import.meta.url).href;
const frame = new URL('../../../public/assets/narrative/card-frame.png', import.meta.url).href;
const back = new URL('../../../public/assets/cartas/default.webp', import.meta.url).href;
const fallback: CourtPreviewCard[] = [
  { id: 'back-left', image: back }, { id: 'local-art', image: artwork }, { id: 'back-right', image: back },
];

export default function CourtPreview({ active }: { active: boolean }) {
  const deckRef = useRef<HTMLDivElement>(null);
  const [cards, setCards] = useState(fallback);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;
    const timeout = window.setTimeout(() => controller.abort(), 5000);
    const today = new Date();
    const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    void loadCourtPreview(date, controller.signal).then(result => {
      if (mounted && result.length) setCards([...result, ...fallback].slice(0, 3));
    }).catch(() => { /* Keep local art when offline or not authorized. */ }).finally(() => clearTimeout(timeout));
    return () => { mounted = false; clearTimeout(timeout); controller.abort(); };
  }, []);

  useEffect(() => {
    const deck = deckRef.current;
    if (!active || !deck) return;
    let canceled = false;
    let stop: (() => void) | undefined;
    // Decode before dealing so a slow image never appears halfway through a shuffle.
    void Promise.allSettled([...deck.querySelectorAll('img')].map(image => image.decode())).then(() => {
      if (!canceled) stop = shuffleCartas(deck, '[data-court-card]', { fan: true });
    });
    return () => { canceled = true; stop?.(); };
  }, [active, cards]);

  return <div ref={deckRef} className="menu-court-preview">
    {cards.map(card => <span key={card.id} data-court-card="">
      <img className="menu-court-preview__art" src={card.image} alt="" loading="lazy" width="50" height="75"
        onError={event => { if (event.currentTarget.getAttribute('src') !== back) event.currentTarget.src = back; }} />
      <img className="menu-court-preview__frame" src={frame} alt="" loading="lazy" width="50" height="75" />
    </span>)}
  </div>;
}
