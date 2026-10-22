import { useState } from 'react';
import marcoEvento from '../../../../../assets/narrative/event-title.png';
import { imagenPrecargada } from '../../../../../services/assetPreloader';

// Compartido por eventos y conversaciones. La entrada espera a que el marco este cargado.
export default function TituloNarrativo({ titulo, listo = true, permanente = false, variante = 'conversacion', onTerminar }: { titulo: string; listo?: boolean; permanente?: boolean; variante?: 'conversacion' | 'evento'; onTerminar?: () => void }) {
  const [marcoListo, setMarcoListo] = useState(false);
  const [terminado, setTerminado] = useState(false);
  const [marcoFallido, setMarcoFallido] = useState(false);
  const esEvento = variante === 'evento';

  return (
    <header className="titulo-narrativo relative z-40 shrink-0 p-2 text-center" data-intro={listo && (marcoListo || marcoFallido) ? 'listo' : 'cargando'} data-permanente={permanente} data-variante={variante}>
      {/* Mantiene el titulo accesible incluso despues de la salida visual del marco. */}
      <h2 className="sr-only">{titulo}</h2>
      <div className={`titulo-narrativo__espacio relative mx-auto ${esEvento ? 'min-h-[86px] w-[min(34rem,100%)]' : 'aspect-[4.4/1] w-[min(36rem,100%)]'}`}>
        <div className={`titulo-narrativo__arte pointer-events-none invisible opacity-0 ${esEvento ? 'relative grid min-h-[86px] place-items-center px-[clamp(24px,9vw,46px)] pt-[clamp(26px,7vw,31px)] pb-[clamp(24px,6vw,28px)]' : 'absolute inset-x-0 top-0'} ${marcoFallido ? 'inset-0 rounded-[10px] border border-[#cbb789] bg-[linear-gradient(#29251f,#100e0bcc)]' : ''}`} aria-hidden="true" hidden={terminado && !permanente} onAnimationEnd={(evento) => {
          if (evento.currentTarget !== evento.target || permanente) return;
          setTerminado(true);
          onTerminar?.();
        }}>
          {!marcoFallido && esEvento ? <span className="absolute inset-0 border-solid [border-image-slice:260_220_230_fill] [border-image-repeat:stretch] [border-width:clamp(24px,7vw,27px)_clamp(24px,9vw,40px)_clamp(23px,6vw,25px)]" style={{ borderImageSource: `url(${imagenPrecargada(marcoEvento)})` }}>
            {/* Precarga el PNG; el CSS lo divide en nueve partes para expandir el centro. */}
            <img className="hidden" src={imagenPrecargada(marcoEvento)} alt="" onLoad={() => setMarcoListo(true)} onError={() => setMarcoFallido(true)} />
          </span> : null}
          {!marcoFallido && !esEvento ? <img className="block w-full" src={imagenPrecargada('/assets/narrative/conversation-title.png')} alt="" onLoad={() => setMarcoListo(true)} onError={() => setMarcoFallido(true)} /> : null}
          <p className={`${esEvento ? 'relative max-w-full [overflow-wrap:break-word] [text-wrap:balance]' : `absolute inset-x-[14%] ${marcoFallido ? 'top-1/2' : 'top-[58%]'} -translate-y-1/2`} m-0 font-[Palatino_Linotype,Palatino,Georgia,serif] text-sm leading-[1.15] font-semibold tracking-[.025em] text-[#f3e8d1] text-shadow-[0_2px_3px_#000] sm:text-xl`}>{titulo}</p>
        </div>
      </div>
    </header>
  );
}
