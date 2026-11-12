import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerEconomy } from '../../../context/PlayerEconomyContext';
import { PointsBadge } from '../PointsBadge';

/** Una sola acción para entrar, iniciar sesión o desbloquear y entrar. */
export function ChallengeAccessButton({ gameId, dateKey, onPlay, onBuyingChange }: {
  gameId: string; dateKey: string; onPlay: () => void; onBuyingChange?: (buying: boolean) => void;
}) {
  const navigate = useNavigate();
  const { isAuthenticated, puntos, costoDesbloqueoDiaPuntos: cost, isDiaDesbloqueado, desbloquearDia } = usePlayerEconomy();
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);
  const locked = !isDiaDesbloqueado(gameId, dateKey);
  const guest = !isAuthenticated;
  const insufficient = locked && !guest && puntos < cost;
  const label = buying ? 'Desbloqueando...' : !locked ? 'Resolver el día anterior' : guest ? 'Iniciar sesión / Registrarse' : 'Desbloquear y jugar';

  const play = async () => {
    if (pending.current || insufficient) return;
    if (!locked) { onPlay(); return; }
    if (guest) { navigate('/login'); return; }
    pending.current = true;
    setBuying(true);
    onBuyingChange?.(true);
    setError(null);
    try {
      const result = await desbloquearDia(gameId, dateKey);
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

  return <>
    <button type="button" onClick={play} disabled={buying || insufficient} aria-label={locked && !guest && !buying ? `${label} · ${cost} pts` : label}
      className="flex min-h-12 w-full flex-wrap items-center justify-center gap-2 rounded-xl border border-emerald-800 bg-emerald-700 px-4 py-3 text-sm font-bold text-white shadow-[0_3px_0_#065f46] transition hover:bg-emerald-800 active:translate-y-0.5 active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:opacity-50 disabled:shadow-none">
      <span>{label}</span>
      {locked && !guest && !buying && <PointsBadge points={cost} unit="pts" />}
    </button>
    {insufficient && <p role="status" className="text-sm text-amber-800">Te faltan {cost - puntos} puntos para jugar este día.</p>}
    {error && <p role="alert" className="text-sm text-rose-800">{error}</p>}
  </>;
}
