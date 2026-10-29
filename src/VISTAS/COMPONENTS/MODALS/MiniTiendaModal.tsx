/* Muestra paquetes de vidas y permite canjearlos por puntos. */
import { useId, useRef, useState } from 'react';
import { usePlayerEconomy, type TiendaPaquete } from '../../../context/PlayerEconomyContext';
import { IconHeart } from '../GameHeader/LivesBadge';
import { ModalBase } from './ModalBase';
import { PaqueteVidas } from './TIENDA/PaqueteVidas';
import { SaldoTienda } from './TIENDA/SaldoTienda';

export interface MiniTiendaModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  recarga?: { vidas: number; costo: number; onRestaurar: () => Promise<void> };
}

// Muestra paquetes de vidas y permite canjearlos por puntos.
export function MiniTiendaModal({ isOpen, onClose, recarga }: MiniTiendaModalProps) {
  const { isMiniTiendaOpen, cerrarMiniTienda, vidas, puntos, paquetesTienda, canjearVidas } = usePlayerEconomy();
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tipo: 'exito' | 'error'; mensaje: string } | null>(null);
  const comprando = useRef(false);
  const tituloId = useId();
  // Limpia los avisos y cierra esta ventana.
  const cerrar = () => {
    setFeedback(null);
    (onClose || cerrarMiniTienda)();
  };
  // Canjea el paquete elegido y muestra si la compra pudo hacerse.
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
  // Confirma la recarga de vidas y muestra si no pudo completarse.
  const restaurar = async () => {
    if (!recarga || comprando.current) return;
    comprando.current = true;
    setProcesandoId('recarga'); setFeedback(null);
    try { await recarga.onRestaurar(); }
    catch (error) { setFeedback({ tipo: 'error', mensaje: error instanceof Error ? error.message : 'No se pudo restaurar las vidas.' }); }
    finally { comprando.current = false; setProcesandoId(null); }
  };

  return <ModalBase isOpen={isOpen ?? isMiniTiendaOpen} onClose={cerrar} labelledBy={tituloId}>
    <div className="flex min-w-0 flex-col gap-4">
      <header>
        <span className="mx-auto mb-2.5 grid size-13 place-items-center rounded-[18px] border-2 border-rose-200 bg-rose-50" aria-hidden="true"><IconHeart size={28} /></span>
        <h2 id={tituloId} className="m-0 text-xl leading-tight font-black! sm:text-2xl">Tienda de Vidas</h2>
        <p className="m-0 mt-1 text-[13px] leading-relaxed font-medium text-slate-600">{recarga ? 'Restaurá las 4 vidas de esta partida y continuá donde estabas.' : 'Usá tus puntos acumulados para recuperar vidas y seguir jugando a todos los juegos.'}</p>
      </header>
      <SaldoTienda puntos={puntos} vidas={recarga?.vidas ?? vidas} />
      {feedback && <p role={feedback.tipo === 'error' ? 'alert' : 'status'} className={`m-0 rounded-xl border px-3 py-2.5 text-sm font-bold [overflow-wrap:anywhere] ${feedback.tipo === 'exito' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>{feedback.mensaje}</p>}
      {recarga ? <button type="button" onClick={restaurar} disabled={procesandoId !== null || puntos < recarga.costo}
        className="min-h-12 rounded-xl bg-rose-700 px-4 py-3 font-bold text-white disabled:opacity-50">
        {procesandoId ? 'Restaurando...' : `Restaurar 4 vidas · ${recarga.costo} puntos`}
      </button> : <div className="flex min-w-0 flex-col gap-2.5" aria-label="Paquetes de vidas">
        {paquetesTienda.map(/* Prepara el resultado de cada elemento. */ paquete => <PaqueteVidas key={paquete.id} paquete={paquete} puntos={puntos} procesandoId={procesandoId} onCanjear={canjear} />)}
      </div>}
      {recarga && puntos < recarga.costo && <p className="m-0 text-sm text-rose-700">Necesitás {recarga.costo} puntos para continuar.</p>}
      <p className="m-0 rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 text-left text-xs leading-relaxed text-green-800">💡 <strong>¿Cómo ganar más puntos?</strong> Cada vez que juegues y ganes cualquier desafío diario, acumularás puntos de forma automática.</p>
      <button type="button" onClick={cerrar} className="min-h-11 w-full cursor-pointer rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm font-extrabold text-slate-700 transition-colors hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600">{recarga?.vidas === 0 ? 'No restaurar · finalizar partida' : 'Volver a jugar'}</button>
    </div>
  </ModalBase>;
}

export default MiniTiendaModal;
