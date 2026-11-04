import { useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerEconomy } from '../../../context/PlayerEconomyContext';
import { ModalBase } from '../MODALS/ModalBase';
import type { DayChallenge } from './types';

interface Props {
  gameId: string;
  challenge: DayChallenge;
  onPlay: () => void;
  onClose: () => void;
}

/** Comparte la compra de desafíos históricos entre el calendario y el resultado. */
export function HistoricalChallengeAccess({ gameId, challenge, onPlay, onClose }: Props) {
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
    }
  };

  return (
    <ModalBase isOpen onClose={() => { if (!pending.current) onClose(); }} labelledBy={titleId}>
      <div className="space-y-4 p-2 text-slate-700">
        <h2 id={titleId} className="text-xl font-extrabold text-[#294C6B]">Desafío del {challenge.dateStr}</h2>
        {guest ? <>
          <p className="text-sm">Iniciá sesión o registrate para desbloquear desafíos de días anteriores.</p>
          <button type="button" onClick={() => navigate('/login')} className={`${button} bg-[#294C6B] text-white`}>Iniciar sesión / Registrarse</button>
        </> : <>
          <p className="text-sm">Desbloqueá este día con puntos y empezá a jugar.</p>
          <div className="flex justify-between gap-3 rounded-xl bg-slate-50 p-4 text-sm">
            <span>Tu saldo: <strong>{puntos} pts</strong></span>
            <span>Costo: <strong>{costo} pts</strong></span>
          </div>
          {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
          {puntos >= costo ? <button type="button" disabled={buying} onClick={buy} className={`${button} bg-amber-500 text-white hover:bg-amber-600`}>
            {buying ? 'Desbloqueando...' : `Desbloquear y jugar por ${costo} pts`}
          </button> : <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Te faltan {costo - puntos} puntos. Podés sumar puntos jugando los desafíos de hoy.</p>}
        </>}
        <button type="button" disabled={buying} onClick={onClose} className={`${button} bg-slate-100 hover:bg-slate-200`}>Volver</button>
      </div>
    </ModalBase>
  );
}
