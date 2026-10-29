import { useEffect, useId, useRef, useState } from 'react';
import { usePlayerEconomy } from '../../../context/PlayerEconomyContext';
import { IconHeart } from '../GameHeader/LivesBadge';
import { ModalBase } from './ModalBase';
import { ErrorPista } from '../../../services/pistasService';

export interface ComprarPistaModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onComprar?: () => Promise<void>;
}

export function ComprarPistaModal({ isOpen, onClose, onComprar }: ComprarPistaModalProps) {
  const { vidas, isComprarPistaOpen, cerrarComprarPista, comprarPista, abrirMiniTienda } = usePlayerEconomy();
  const confirmar = onComprar || comprarPista;
  const tituloId = useId();
  const [comprando, setComprando] = useState(false);
  const [error, setError] = useState('');
  const enCurso = useRef(false);
  const visible = isOpen ?? isComprarPistaOpen;
  useEffect(() => { if (visible) setError(''); }, [visible]);
  const cerrar = () => {
    if (enCurso.current) return;
    setError('');
    (onClose || cerrarComprarPista)();
  };
  const comprar = async () => {
    if (enCurso.current) return;
    if (vidas < 1) { cerrar(); abrirMiniTienda(); return; }
    enCurso.current = true;
    setComprando(true);
    setError('');
    try {
      await confirmar();
      (onClose || cerrarComprarPista)();
    } catch (e) {
      setError(e instanceof ErrorPista ? e.message : 'No se pudo confirmar el canje. Volvé a intentar.');
    } finally {
      enCurso.current = false;
      setComprando(false);
    }
  };

  return <ModalBase isOpen={visible} onClose={cerrar} labelledBy={tituloId}>
    <div className="flex min-w-0 flex-col gap-4">
      <header>
        <span className="mx-auto mb-3 grid size-13 place-items-center rounded-2xl border border-amber-200 bg-amber-50 text-3xl" aria-hidden="true">💡</span>
        <h2 id={tituloId} className="m-0 text-xl leading-tight font-black! sm:text-2xl">Comprar una pista</h2>
        <p className="m-0 mt-2 text-sm leading-relaxed text-slate-600">Una ayuda para seguir jugando: canjeá una vida por una pista.</p>
      </header>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-4 text-sm font-extrabold sm:text-base" aria-label="1 vida equivale a 1 pista">
        <span className="flex flex-wrap items-center justify-center gap-1.5 text-rose-700"><IconHeart size={20} /><span>1 vida</span></span>
        <span aria-hidden="true" className="text-slate-400">→</span>
        <span className="flex flex-wrap items-center justify-center gap-1.5 text-amber-800"><span aria-hidden="true">💡</span><span>1 pista</span></span>
      </div>
      <p className="m-0 text-sm text-slate-600">Tenés <strong className="text-rose-700">{vidas} {vidas === 1 ? 'vida' : 'vidas'}</strong> disponibles.</p>
      {error && <p role="alert" className="m-0 text-sm font-semibold text-rose-700">{error}</p>}
      <button type="button" onClick={comprar} disabled={comprando}
        className="min-h-11 w-full cursor-pointer rounded-xl bg-[#294C6B] px-4 py-3 text-sm font-extrabold text-white hover:bg-[#1f3a52] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294C6B] disabled:cursor-not-allowed disabled:opacity-50">
        {comprando ? 'Canjeando...' : vidas < 1 ? 'Recargar vidas' : 'Comprar 1 pista · 1 vida'}
      </button>
      <button type="button" onClick={cerrar} disabled={comprando} className="min-h-11 w-full cursor-pointer rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:cursor-wait">Volver al juego</button>
    </div>
  </ModalBase>;
}

export default ComprarPistaModal;
