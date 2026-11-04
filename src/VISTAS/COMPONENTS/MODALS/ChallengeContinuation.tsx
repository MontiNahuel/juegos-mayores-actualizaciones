import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerEconomy } from '../../../context/PlayerEconomyContext';
import { getCalendarMonthData } from '../CALENDAR/calendarService';
import type { DayChallenge } from '../CALENDAR/types';
import { HistoricalChallengeAccess } from '../CALENDAR/HistoricalChallengeAccess';
import { PointsBadge } from '../PointsBadge';

export interface ChallengeContinuationProps {
  gameId: string;
  dateKey: string;
  onClose: () => void;
  onBuyingChange?: (buying: boolean) => void;
}

export function ChallengeContinuation({ gameId, dateKey, onClose, onBuyingChange }: ChallengeContinuationProps) {
  const navigate = useNavigate();
  const { isDiaDesbloqueado, costoDesbloqueoDiaPuntos } = usePlayerEconomy();
  const [previous, setPrevious] = useState<DayChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    let active = true;
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month - 1, day - 1);
    void getCalendarMonthData(gameId, date.getFullYear(), date.getMonth() + 1, undefined, gameId === 'crucigrama' ? 'facil' : 'standard')
      .then(({ challenges }) => {
        if (active) setPrevious(challenges.find(item => item.day === date.getDate() && item.config != null && item.status !== 'locked') ?? null);
      })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [gameId, dateKey]);

  const play = () => {
    if (!previous) return;
    // El calendario conserva la selección de dificultad y la reanudación existente.
    const slug = gameId === 'sopa_letras' ? 'sopa-letras' : gameId;
    navigate(`/juegos/${slug}`, { replace: true, state: { continueChallenge: previous } });
  };
  const locked = previous && !isDiaDesbloqueado(gameId, previous.dateKey);

  if (buying && previous) return <HistoricalChallengeAccess inline gameId={gameId} challenge={previous} onPlay={play} onClose={() => setBuying(false)} onBuyingChange={onBuyingChange} />;

  return <div className="space-y-3 border-t border-slate-200 pt-4 text-slate-700">
      {loading ? <p role="status">Buscando el desafío anterior...</p> : previous?.status === 'completed' ? <p className="text-sm">Ya completaste el desafío del día anterior. Elegí otro desde el calendario.</p> : previous ? <>
        <p className="text-sm">Resolvé el desafío del {previous.dateStr}.</p>
        <button type="button" onClick={() => locked ? setBuying(true) : play()} aria-label={locked ? `Desbloquear día anterior · ${costoDesbloqueoDiaPuntos} pts` : 'Resolver el día anterior'} className="flex min-h-12 w-full flex-wrap items-center justify-center gap-2 rounded-xl border border-emerald-800 bg-emerald-700 px-4 py-3 text-sm font-bold text-white shadow-[0_3px_0_#065f46] transition hover:bg-emerald-800 active:translate-y-0.5 active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
          <span>{locked ? 'Desbloquear día anterior' : 'Resolver el día anterior'}</span>
          {locked && <PointsBadge points={costoDesbloqueoDiaPuntos} unit="pts" />}
        </button>
      </> : <p role="status" className="text-sm">{error ? 'No pudimos cargar el desafío anterior. Podés buscarlo en el calendario.' : 'No hay un desafío disponible para el día anterior.'}</p>}
      <button type="button" onClick={onClose} className="min-h-12 w-full rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold hover:bg-slate-200">Volver al calendario</button>
    </div>;
}
