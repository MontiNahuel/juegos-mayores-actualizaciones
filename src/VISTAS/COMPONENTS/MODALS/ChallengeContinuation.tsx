import { useEffect, useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerEconomy } from '../../../context/PlayerEconomyContext';
import { getCalendarMonthData } from '../CALENDAR/calendarService';
import type { DayChallenge } from '../CALENDAR/types';
import { HistoricalChallengeAccess } from '../CALENDAR/HistoricalChallengeAccess';
import { ModalBase } from './ModalBase';

export interface ChallengeContinuationProps {
  gameId: string;
  dateKey: string;
  onClose: () => void;
}

export function ChallengeContinuation({ gameId, dateKey, onClose }: ChallengeContinuationProps) {
  const navigate = useNavigate();
  const titleId = useId();
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

  if (buying && previous) return <HistoricalChallengeAccess gameId={gameId} challenge={previous} onPlay={play} onClose={() => setBuying(false)} />;

  return <ModalBase isOpen onClose={onClose} labelledBy={titleId}>
    <div className="space-y-4 p-2 text-slate-700">
      <h2 id={titleId} className="text-xl font-extrabold text-[#294C6B]">¿Seguimos jugando?</h2>
      {loading ? <p role="status">Buscando el desafío anterior...</p> : previous?.status === 'completed' ? <p className="text-sm">Ya completaste el desafío del día anterior. Elegí otro desde el calendario.</p> : previous ? <>
        <p className="text-sm">Resolvé el desafío del {previous.dateStr}.</p>
        <button type="button" onClick={() => locked ? setBuying(true) : play()} className="min-h-12 w-full rounded-xl bg-[#294C6B] px-4 py-3 text-sm font-bold text-white hover:bg-[#1E364D]">
          {locked ? `Desbloquear día anterior · ${costoDesbloqueoDiaPuntos} pts` : 'Resolver el día anterior'}
        </button>
      </> : <p role="status" className="text-sm">{error ? 'No pudimos cargar el desafío anterior. Podés buscarlo en el calendario.' : 'No hay un desafío disponible para el día anterior.'}</p>}
      <button type="button" onClick={onClose} className="min-h-12 w-full rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold hover:bg-slate-200">Volver al calendario</button>
    </div>
  </ModalBase>;
}
