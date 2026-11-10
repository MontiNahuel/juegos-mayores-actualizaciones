/* Presenta los títulos de la historia con su marco y decoración. */
import gsap from 'gsap';
import { useLayoutEffect, useRef, useState } from 'react';
import marcoEvento from '../../../../../assets/narrative/event-title.png';
import { imagenPrecargada } from '../../../../../services/assetPreloader';

interface Props {
  titulo: string;
  listo?: boolean;
  permanente?: boolean;
  variante?: 'conversacion' | 'evento';
  onTerminar?: () => void;
  onListo?: () => void;
  animacionExterna?: boolean;
}

// Notifica la carga del marco; la conversación puede delegar todo su movimiento en GSAP.
export default function TituloNarrativo({
  titulo, listo = true, permanente = false, variante = 'conversacion',
  onTerminar, onListo, animacionExterna = false,
}: Props) {
  const [marcoListo, setMarcoListo] = useState(false);
  const [terminado, setTerminado] = useState(false);
  const [marcoFallido, setMarcoFallido] = useState(false);
  const esEvento = variante === 'evento';
  const arte = useRef<HTMLDivElement>(null);
  const alTerminar = useRef(onTerminar);
  alTerminar.current = onTerminar;
  // El coordinador controla conversaciones; los títulos autónomos poseen su propia timeline.
  useLayoutEffect(() => {
    if (animacionExterna || !listo || !(marcoListo || marcoFallido)) return;
    const contexto = gsap.context(() => {
      const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const secuencia = gsap.timeline();
      secuencia.fromTo(arte.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: reducido ? 0 : .76 });
      if (!permanente) secuencia.to(arte.current, { autoAlpha: 0, duration: reducido ? 0 : .55,
        onComplete: () => { setTerminado(true); alTerminar.current?.(); } }, 2.85);
    });
    return () => contexto.revert();
  }, [animacionExterna, listo, marcoListo, marcoFallido, permanente]);

  // Tanto un marco disponible como su respaldo permiten iniciar la presentación.
  const confirmarMarco = () => { setMarcoListo(true); onListo?.(); };
  const recuperarMarco = () => { setMarcoFallido(true); onListo?.(); };

  return (
    <header className="titulo-narrativo relative z-40 shrink-0 p-2 text-center" data-intro={listo && (marcoListo || marcoFallido) ? 'listo' : 'cargando'} data-permanente={permanente} data-variante={variante} data-animacion={animacionExterna ? 'externa' : 'gsap'}>
      {/* Mantiene el titulo accesible incluso despues de la salida visual del marco. */}
      <h2 className="sr-only">{titulo}</h2>
      <div className={`titulo-narrativo__espacio relative mx-auto ${esEvento ? 'min-h-[86px] w-[min(34rem,100%)]' : 'aspect-[4.4/1] w-[min(36rem,100%)]'}`}>
        <div ref={arte} className={`titulo-narrativo__arte pointer-events-none invisible opacity-0 ${esEvento ? 'relative grid min-h-[86px] place-items-center px-[clamp(24px,9vw,46px)] pt-[clamp(26px,7vw,31px)] pb-[clamp(24px,6vw,28px)]' : 'absolute inset-x-0 top-0'} ${marcoFallido ? 'inset-0 rounded-[10px] border border-[#cbb789] bg-[linear-gradient(#29251f,#100e0bcc)]' : ''}`} aria-hidden="true" hidden={terminado && !permanente}>
          {!marcoFallido && esEvento ? <span className="titulo-narrativo__marco-evento absolute inset-0 border-solid [border-image-slice:260_220_230_fill] [border-image-repeat:stretch] [border-width:clamp(24px,7vw,27px)_clamp(24px,9vw,40px)_clamp(23px,6vw,25px)]" style={{ borderImageSource: `url(${imagenPrecargada(marcoEvento)})` }}>
            {/* Precarga el PNG; el CSS lo divide en nueve partes para expandir el centro. */}
            <img className="hidden" src={imagenPrecargada(marcoEvento)} alt="" onLoad={confirmarMarco} onError={recuperarMarco} />
          </span> : null}
          {!marcoFallido && !esEvento ? <img className="block w-full" src={imagenPrecargada('/assets/narrative/conversation-title.png')} alt="" onLoad={confirmarMarco} onError={recuperarMarco} /> : null}
          <p className={`${esEvento ? 'relative max-w-full [overflow-wrap:break-word] [text-wrap:balance]' : `absolute inset-x-[14%] ${marcoFallido ? 'top-1/2' : 'top-[58%]'} -translate-y-1/2`} m-0 font-[Palatino_Linotype,Palatino,Georgia,serif] text-sm leading-[1.15] font-semibold tracking-[.025em] text-[#f3e8d1] text-shadow-[0_2px_3px_#000] sm:text-xl`}>{titulo}</p>
        </div>
      </div>
    </header>
  );
}
