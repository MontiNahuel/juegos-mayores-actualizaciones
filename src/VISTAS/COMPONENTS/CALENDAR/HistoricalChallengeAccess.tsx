import { useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerEconomy } from '../../../context/PlayerEconomyContext';
import { ModalBase } from '../MODALS/ModalBase';
import type { DayChallenge } from './types';
import { PointsBadge } from '../PointsBadge';

interface Props {
  gameId: string;
  challenge: DayChallenge;
  onPlay: () => void;
  onClose: () => void;
  inline?: boolean;
  onBuyingChange?: (buying: boolean) => void;
}

/** Comparte la compra de desafíos históricos entre el calendario y el resultado. */
export function HistoricalChallengeAccess({ gameId, challenge, onPlay, onClose, inline = false, onBuyingChange }: Props) {
  const { puntos, costoDesbloqueoDiaPuntos: costo, desbloquearDia } = usePlayerEconomy();
  const navigate = useNavigate();
  const titleId = useId();
  const pending = useRef(false);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const guest = !localStorage.getItem('token') && !sessionStorage.getItem('token');
  const button = 'min-h-12 w-full rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-50';

  const buy = async () => {
    if (pending.current) return;
    pending.current = true;
    setBuying(true);
    onBuyingChange?.(true);
    setError(null);
    try {
      const result = await desbloquearDia(gameId, challenge.dateKey);
      if (result.success) onPlay();
      else setError(result.message);
    } catch {
      setError('No se pudo desbloquear el desafío. Volvé a intentarlo.');
    } finally {
      pending.current = false;
      setBuying(false);
      onBuyingChange?.(false);
    }
  };

  const content = (
      <div className="space-y-4 p-2 text-slate-700">
        <h2 id={titleId} className="text-xl font-extrabold text-[#294C6B]">Desafío del {challenge.dateStr}</h2>
        {guest ? <>
          <p className="text-sm">Iniciá sesión o registrate para desbloquear desafíos de días anteriores.</p>
          <button type="button" onClick={() => navigate('/login')} className={`${button} bg-[#294C6B] text-white`}>Iniciar sesión / Registrarse</button>
        </> : <>
          <p className="text-sm">Desbloqueá este día con puntos y empezá a jugar.</p>
          <div className="flex justify-between gap-3 rounded-xl bg-slate-50 p-4 text-sm">
            <div className="space-y-1"><p>Tu saldo</p><PointsBadge points={puntos} unit="pts" /></div>
            <div className="space-y-1"><p>Costo</p><PointsBadge points={costo} unit="pts" /></div>
          </div>
          {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
          {puntos >= costo ? <button type="button" disabled={buying} onClick={buy} aria-label={buying ? 'Desbloqueando...' : `Desbloquear y jugar por ${costo} pts`} className={`${button} flex flex-wrap items-center justify-center gap-2 bg-emerald-700 text-white hover:bg-emerald-800`}>
            {buying ? 'Desbloqueando...' : <><span>Desbloquear y jugar</span><PointsBadge points={costo} unit="pts" /></>}
          </button> : <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Te faltan {costo - puntos} puntos. Podés sumar puntos jugando los desafíos de hoy.</p>}
        </>}
        <button type="button" disabled={buying} onClick={onClose} className={`${button} bg-slate-100 hover:bg-slate-200`}>Volver</button>
      </div>
  );
  return inline ? content : <ModalBase isOpen onClose={() => { if (!pending.current) onClose(); }} labelledBy={titleId}>{content}</ModalBase>;
}
