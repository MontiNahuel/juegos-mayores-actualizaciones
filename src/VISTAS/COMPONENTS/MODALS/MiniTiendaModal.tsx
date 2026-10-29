import { useId, useRef, useState } from 'react';
import { usePlayerEconomy, type TiendaPaquete } from '../../../context/PlayerEconomyContext';
import { IconHeart } from '../GameHeader/LivesBadge';
import { ModalBase } from './ModalBase';
import { PaqueteVidas } from './TIENDA/PaqueteVidas';
import { SaldoTienda } from './TIENDA/SaldoTienda';

export interface MiniTiendaModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function MiniTiendaModal({ isOpen, onClose }: MiniTiendaModalProps) {
  const { isMiniTiendaOpen, cerrarMiniTienda, vidas, puntos, paquetesTienda, canjearVidas } = usePlayerEconomy();
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tipo: 'exito' | 'error'; mensaje: string } | null>(null);
  const comprando = useRef(false);
  const tituloId = useId();
  const cerrar = () => {
    if (comprando.current) return;
    setFeedback(null);
    (onClose || cerrarMiniTienda)();
  };
  const canjear = async (paquete: TiendaPaquete) => {
    if (comprando.current) return;
    comprando.current = true;
    setProcesandoId(paquete.id);
    setFeedback(null);
    try {
      const resultado = await canjearVidas(paquete.id);
      setFeedback({ tipo: resultado.success ? 'exito' : 'error', mensaje: resultado.message });
    } catch {
      setFeedback({ tipo: 'error', mensaje: 'No se pudo confirmar el canje. Revisá la conexión.' });
    } finally {
      comprando.current = false;
      setProcesandoId(null);
    }
  };

  return <ModalBase isOpen={isOpen ?? isMiniTiendaOpen} onClose={cerrar} labelledBy={tituloId}>
    <div className="flex min-w-0 flex-col gap-4">
      <header>
        <span className="mx-auto mb-2.5 grid size-13 place-items-center rounded-[18px] border-2 border-rose-200 bg-rose-50" aria-hidden="true"><IconHeart size={28} /></span>
        <h2 id={tituloId} className="m-0 text-xl leading-tight font-black! sm:text-2xl">Tienda de Vidas</h2>
        <p className="m-0 mt-1 text-[13px] leading-relaxed font-medium text-slate-600">Usá tus puntos acumulados para recuperar vidas y seguir jugando a todos los juegos.</p>
      </header>
      <SaldoTienda puntos={puntos} vidas={vidas} />
      {feedback && <p role={feedback.tipo === 'error' ? 'alert' : 'status'} className={`m-0 rounded-xl border px-3 py-2.5 text-sm font-bold [overflow-wrap:anywhere] ${feedback.tipo === 'exito' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>{feedback.mensaje}</p>}
      <div className="flex min-w-0 flex-col gap-2.5" aria-label="Paquetes de vidas">
        {paquetesTienda.map(paquete => <PaqueteVidas key={paquete.id} paquete={paquete} puntos={puntos} procesandoId={procesandoId} onCanjear={canjear} />)}
      </div>
      <p className="m-0 rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 text-left text-xs leading-relaxed text-green-800">💡 <strong>¿Cómo ganar más puntos?</strong> Cada vez que juegues y ganes cualquier desafío diario, acumularás puntos de forma automática.</p>
      <button type="button" onClick={cerrar} disabled={procesandoId !== null} className="min-h-11 w-full cursor-pointer rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm font-extrabold text-slate-700 transition-colors hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:cursor-wait disabled:opacity-60">Volver a jugar</button>
    </div>
  </ModalBase>;
}

export default MiniTiendaModal;
