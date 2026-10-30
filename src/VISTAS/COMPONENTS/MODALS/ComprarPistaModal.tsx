import { useEffect, useId, useRef, useState } from 'react';
import { usePlayerEconomy } from '../../../context/PlayerEconomyContext';
import { ModalBase } from './ModalBase';

export interface ComprarPistaModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onComprar?: () => Promise<void>;
}

export function ComprarPistaModal({ isOpen, onClose, onComprar }: ComprarPistaModalProps) {
  const { puntos, costoPistaPuntos, isComprarPistaOpen, cerrarComprarPista, comprarPista } = usePlayerEconomy();
  const tituloId = useId();
  const [comprando, setComprando] = useState(false);
  const [error, setError] = useState('');
  const enCurso = useRef(false);
  const visible = isOpen ?? isComprarPistaOpen;
  useEffect(() => { if (visible) setError(''); }, [visible]);
  const cerrar = onClose || cerrarComprarPista;
  const comprar = async () => {
    if (enCurso.current || puntos < costoPistaPuntos) return;
    enCurso.current = true;
    setComprando(true); setError('');
    try {
      await (onComprar || comprarPista)();
      cerrar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo confirmar la compra.');
    } finally {
      enCurso.current = false; setComprando(false);
    }
  };

  return <ModalBase isOpen={visible} onClose={cerrar} labelledBy={tituloId}>
    <div className="flex min-w-0 flex-col gap-4">
      <header>
        <span className="mx-auto mb-3 grid size-13 place-items-center rounded-2xl border border-amber-200 bg-amber-50 text-3xl" aria-hidden="true">💡</span>
        <h2 id={tituloId} className="m-0 text-xl leading-tight font-black! sm:text-2xl">Comprar una pista</h2>
        <p className="m-0 mt-2 text-sm leading-relaxed text-slate-600">Canjeá tus puntos por una ayuda para seguir jugando.</p>
      </header>
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-4 font-extrabold text-amber-800">
        1 pista · {costoPistaPuntos} puntos
      </div>
      <p className="m-0 text-sm text-slate-600">Tenés <strong>{puntos} puntos</strong> disponibles.</p>
      {puntos < costoPistaPuntos && <p className="m-0 text-sm text-amber-800">No tenés suficientes puntos para esta pista.</p>}
      {error && <p role="alert" className="m-0 text-sm font-semibold text-rose-700">{error}</p>}
      <button type="button" onClick={comprar} disabled={comprando || puntos < costoPistaPuntos}
        className="min-h-11 w-full cursor-pointer rounded-xl bg-[#294C6B] px-4 py-3 text-sm font-extrabold text-white hover:bg-[#1f3a52] disabled:cursor-not-allowed disabled:opacity-50">
        {comprando ? 'Comprando...' : `Comprar 1 pista · ${costoPistaPuntos} puntos`}
      </button>
      <button type="button" onClick={cerrar} className="min-h-11 w-full cursor-pointer rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200">Volver al juego</button>
    </div>
  </ModalBase>;
}

export default ComprarPistaModal;
