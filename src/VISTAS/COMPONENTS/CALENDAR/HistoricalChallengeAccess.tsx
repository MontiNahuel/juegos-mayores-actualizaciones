import { useId, useState } from 'react';
import { ModalBase } from '../MODALS/ModalBase';
import { ChallengeAccessButton } from './ChallengeAccessButton';
import type { DayChallenge } from './types';

/** El calendario conserva la selección de día; el resultado muestra la acción directamente. */
export function HistoricalChallengeAccess({ gameId, challenge, onPlay, onClose }: {
  gameId: string; challenge: DayChallenge; onPlay: () => void; onClose: () => void;
}) {
  const titleId = useId();
  const [buying, setBuying] = useState(false);
  return <ModalBase isOpen onClose={() => { if (!buying) onClose(); }} labelledBy={titleId}>
    <div className="space-y-4 p-2 text-slate-700">
      <h2 id={titleId} className="text-xl font-extrabold text-[#294C6B]">Desafío del {challenge.dateStr}</h2>
      <ChallengeAccessButton gameId={gameId} dateKey={challenge.dateKey} onPlay={onPlay} onBuyingChange={setBuying} />
      <button type="button" disabled={buying} onClick={onClose} className="min-h-12 w-full rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold hover:bg-slate-200 disabled:opacity-50">Volver</button>
    </div>
  </ModalBase>;
}
