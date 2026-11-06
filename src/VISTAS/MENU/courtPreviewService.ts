import { API_URL } from '../../config/api';
import type { SetupPartida } from '../JUEGOS/NARRATIVO/narrativeService';

export interface CourtPreviewCard { id: string; image: string }

// Read-only setup: never starts a game or activates its local gameplay fallback.
export async function loadCourtPreview(date: string, signal: AbortSignal): Promise<CourtPreviewCard[]> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/api/narrative/partida/setup?date=${encodeURIComponent(date)}`, {
    signal,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) throw new Error(`Court preview: ${response.status}`);
  const setup = await response.json() as SetupPartida;
  const candidates = [...(setup.cartas_ofrecidas ?? []), ...(setup.personajes_ofrecidos ?? [])];
  const seen = new Set<string>();
  const cards: CourtPreviewCard[] = [];
  for (const card of candidates) {
    if (!card.imagen) continue;
    const image = card.imagen.startsWith('/') && !card.imagen.startsWith('//') ? `${API_URL}${card.imagen}` : card.imagen;
    if (!/^(https?:\/\/|\/(?!\/))/.test(image) || seen.has(image)) continue;
    seen.add(image);
    cards.push({ id: card._id, image });
  }
  // Fisher–Yates, without replacement. Keep the chosen hand stable while scrolling.
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards.slice(0, 3);
}
