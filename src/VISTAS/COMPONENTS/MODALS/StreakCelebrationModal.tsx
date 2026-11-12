/* Celebra una vez al día la racha de ingresos confirmada por el servidor con confeti y fuegos artificiales. */
import { useEffect, useId, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { flame } from 'ionicons/icons';
import { usePlayerEconomy } from '../../../context/PlayerEconomyContext';
import { getSessionUser } from '../../AUTH/sessionStore';
import { SuccessFireworks } from '../ANIMATIONS/SuccessFireworks';
import { ModalBase } from './ModalBase';

const STORAGE_PREFIX = 'cognijuegos_racha_celebrada_';

const CONFETTI_PIECES = [
  { left: '8%', delay: '0s', duration: '2.4s', color: '#0DAD93', rotate: '-18deg' },
  { left: '18%', delay: '0.2s', duration: '2.7s', color: '#E9A916', rotate: '22deg' },
  { left: '29%', delay: '0.1s', duration: '2.2s', color: '#EC4899', rotate: '-30deg' },
  { left: '41%', delay: '0.35s', duration: '2.5s', color: '#0EA5E9', rotate: '15deg' },
  { left: '53%', delay: '0.05s', duration: '2.8s', color: '#8B5CF6', rotate: '-12deg' },
  { left: '66%', delay: '0.25s', duration: '2.3s', color: '#F97316', rotate: '28deg' },
  { left: '78%', delay: '0.15s', duration: '2.6s', color: '#0DAD93', rotate: '-25deg' },
  { left: '89%', delay: '0.3s', duration: '2.4s', color: '#E9A916', rotate: '20deg' },
];

export function StreakCelebrationModal() {
  const { isAuthenticated, isLoading, racha, rachaUltimaFecha } = usePlayerEconomy();
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!isAuthenticated || isLoading || racha <= 0 || !rachaUltimaFecha) {
      setOpen(false);
      return;
    }

    const user = getSessionUser();
    const userId = user?.id != null ? String(user.id) : 'actual';
    const storageKey = `${STORAGE_PREFIX}${userId}`;

    try {
      if (localStorage.getItem(storageKey) === rachaUltimaFecha) return;
      localStorage.setItem(storageKey, rachaUltimaFecha);
    } catch {
      // Si el almacenamiento está bloqueado, se muestra igual en esta sesión de memoria.
    }

    setOpen(true);
  }, [isAuthenticated, isLoading, racha, rachaUltimaFecha]);

  const unidad = racha === 1 ? 'día' : 'días';

  return (
    <ModalBase isOpen={open} onClose={() => setOpen(false)} labelledBy={titleId}>
      <style>{`
        @keyframes streakConfettiFall {
          0% { transform: translateY(-16px) rotate(0deg); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translateY(230px) rotate(220deg); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .streak-confetti-piece { animation: none !important; opacity: 0.4; }
        }
      `}</style>
      <div className="relative isolate overflow-hidden p-6 text-center text-slate-700 sm:p-7">
        <SuccessFireworks />

        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 overflow-hidden" aria-hidden="true">
          {CONFETTI_PIECES.map((piece, idx) => (
            <span
              key={idx}
              className="streak-confetti-piece absolute top-0 block h-3.5 w-2 rounded-xs"
              style={{
                left: piece.left,
                backgroundColor: piece.color,
                transform: `rotate(${piece.rotate})`,
                animation: `streakConfettiFall ${piece.duration} ease-out ${piece.delay} infinite`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 mx-auto mb-3 flex h-18 w-18 items-center justify-center rounded-3xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-100 text-amber-500 shadow-sm">
          <IonIcon icon={flame} className="text-4xl" aria-hidden="true" />
        </div>

        <h2 id={titleId} className="relative z-10 m-0 text-2xl font-black text-[#294C6B]">
          ¡Felicidades!
        </h2>

        <div className="relative z-10 mt-3 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-4">
          <p className="m-0 text-sm font-bold tracking-wide text-amber-900 uppercase">
            Tus días de racha
          </p>
          <p className="m-0 mt-1 text-4xl font-black text-amber-600 tabular-nums">
            {racha} {unidad}
          </p>
        </div>

        <p className="relative z-10 mt-4 mb-5 text-sm leading-relaxed font-medium text-slate-600">
          {racha === 1
            ? '¡Empezaste una nueva racha hoy! Entrá todos los días para seguir sumando.'
            : `¡Llevás ${racha} días seguidos ingresando a CogniJuegos! Tu constancia mantiene tu mente activa.`}
        </p>

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="relative z-10 min-h-12 w-full cursor-pointer rounded-xl bg-[#294C6B] px-5 py-3 text-base font-extrabold text-white shadow-sm transition-colors hover:bg-[#1f3a52] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294C6B]"
        >
          ¡Vamos a jugar!
        </button>
      </div>
    </ModalBase>
  );
}

export default StreakCelebrationModal;
