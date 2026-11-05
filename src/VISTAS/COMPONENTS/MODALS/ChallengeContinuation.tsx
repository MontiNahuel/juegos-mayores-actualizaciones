import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCalendarMonthData } from '../CALENDAR/calendarService';
import type { DayChallenge } from '../CALENDAR/types';
import { ChallengeAccessButton } from '../CALENDAR/ChallengeAccessButton';

export interface ChallengeContinuationProps {
  gameId: string;
  dateKey: string;
  onClose: () => void;
  buying: boolean;
  onBuyingChange: (buying: boolean) => void;
}

export function ChallengeContinuation({ gameId, dateKey, onClose, buying, onBuyingChange }: ChallengeContinuationProps) {
  const navigate = useNavigate();
  const [previous, setPrevious] = useState<DayChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month - 1, day - 1);
    void getCalendarMonthData(gameId, date.getFullYear(), date.getMonth() + 1, undefined, gameId === 'crucigrama' ? 'facil' : 'standard')
      .then(({ challenges }) => {
        if (active) setPrevious(challenges.find(item => item.day === date.getDate() && item.config != null && item.status !== 'locked') ?? null);
      })
      .catch(() => { if (active) setError('No pudimos cargar el desafío anterior. Podés buscarlo en el calendario.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [gameId, dateKey]);

  const play = () => {
    if (!previous) return;
    // El calendario conserva la selección de dificultad y la reanudación existente.
    const slug = gameId === 'sopa_letras' ? 'sopa-letras' : gameId;
    navigate(`/juegos/${slug}`, { replace: true, state: { continueChallenge: previous } });
  };
  return <div className="space-y-3 border-t border-slate-200 pt-4 text-slate-700">
      {loading ? <p role="status">Buscando el desafío anterior...</p> : previous?.status === 'completed' ? <p className="text-sm">Ya completaste el desafío del día anterior. Elegí otro desde el calendario.</p> : previous ? <>
        <p className="text-sm">Resolvé el desafío del {previous.dateStr}.</p>
        <ChallengeAccessButton gameId={gameId} dateKey={previous.dateKey} onPlay={play} onBuyingChange={onBuyingChange} />
      </> : !error && <p role="status" className="text-sm">No hay un desafío disponible para el día anterior.</p>}
      {error && <p role="alert" className="text-sm text-rose-800">{error}</p>}
      <button type="button" disabled={buying} onClick={onClose} className="min-h-12 w-full rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold hover:bg-slate-200 disabled:opacity-50">Volver al calendario</button>
    </div>;
}
