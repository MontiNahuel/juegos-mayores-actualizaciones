import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { AnimacionTexto } from '../COMPARTIDOS/DIALOGO_NARRATIVO/AnimacionTexto';

export interface EfectoResultado { texto: string; tipo: 'positivo' | 'negativo' | 'neutro' }

/** El relato termina antes de revelar, en orden, las consecuencias confirmadas. */
export default function RelatoResultado({ texto, efectos, onEfectosCompletos }: { texto: string; efectos: EfectoResultado[]; onEfectosCompletos: () => void }) {
  const raiz = useRef<HTMLDivElement>(null);
  const animacion = useRef<AnimacionTexto | null>(null);
  const [lecturaCompleta, setLecturaCompleta] = useState(false);
  const alTerminar = useRef(onEfectosCompletos);
  alTerminar.current = onEfectosCompletos;

  useLayoutEffect(() => {
    if (!raiz.current) return;
    const escritura = new AnimacionTexto(raiz.current, () => setLecturaCompleta(true), 21);
    animacion.current = escritura;
    escritura.escribirTexto('resultado');
    return () => { animacion.current = null; escritura.destruir(); };
  }, [texto]);

  useLayoutEffect(() => {
    if (!lecturaCompleta || !raiz.current) return;
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const contexto = gsap.context(() => {
      const elementos = raiz.current!.querySelectorAll<HTMLElement>('.resultado-efecto');
      const secuencia = gsap.timeline({ onComplete: () => alTerminar.current() });
      elementos.forEach((elemento, indice) => {
        const ganancia = elemento.classList.contains('resultado-efecto--positivo');
        const perdida = elemento.classList.contains('resultado-efecto--negativo');
        const brillo = ganancia ? '0 0 20px #52e66e' : perdida ? '0 0 16px #75001f' : '0 0 8px #b58a55';
        const final = ganancia ? '0 0 8px #87c978' : perdida ? '0 1px 3px #4b122333' : '0 0 0px transparent';
        secuencia.fromTo(elemento,
          { opacity: 0, scale: reducido || perdida ? 1 : 1.28, y: reducido || perdida ? 0 : -5, textShadow: reducido ? final : brillo },
          { opacity: 1, scale: 1, y: 0, textShadow: final, duration: reducido ? 0 : .55, ease: 'power3.out' },
          reducido ? 0 : indice * 1.05);
        // El corte separa las dos mitades y deja visible la pérdida.
        const corte = elemento.querySelector('.resultado-efecto__corte');
        if (perdida && corte && !reducido) {
          const inicio = indice * 1.05;
          secuencia.fromTo(corte, { scaleX: 0, opacity: 1 },
            { scaleX: 1, duration: .14, ease: 'power2.inOut' }, inicio + .22)
            .to(corte, { opacity: 0, duration: .3, ease: 'power2.out' }, inicio + .39)
            .to(elemento.querySelector('.resultado-efecto__mitad--superior'), { x: -2, y: -1, duration: .45, ease: 'power2.out' }, inicio + .32)
            .to(elemento.querySelector('.resultado-efecto__mitad--inferior'), { x: 2, y: 1, duration: .45, ease: 'power2.out' }, inicio + .32);
        }
      });
    }, raiz);
    return () => contexto.revert();
  }, [lecturaCompleta]);

  return <div ref={raiz}>
    <button type="button" className="resultado-pergamino__relato block w-full border-0 bg-transparent p-0 text-center text-[clamp(14px,2.5vw,19px)] text-inherit focus-visible:outline-2 focus-visible:outline-[#694529]"
      onClick={() => animacion.current?.acelerarTexto()} aria-label={lecturaCompleta ? undefined : 'Acelerar lectura del resultado'}>
      <span className="dialogo-narrativo__revelado relative block" data-texto={texto}>
        <span className="absolute inset-0" aria-hidden="true"><span className="dialogo-narrativo__caracteres" /><span className="dialogo-narrativo__cursor inline-block h-[1em] w-0 align-text-bottom" /></span>
        <span className="sr-only">{texto}</span>
      </span>
    </button>
    <div className="mt-[clamp(16px,3vh,28px)] border-t border-[#6e442777] pt-3 text-[clamp(15px,2.6vw,20px)] font-bold whitespace-pre-line" aria-live="polite">
      {lecturaCompleta && efectos.map((efecto, indice) => <div key={indice} className={`resultado-efecto resultado-efecto--${efecto.tipo}`}>{efecto.tipo === 'negativo' ? <>
        <span className="sr-only">{efecto.texto}</span>
        <span className="resultado-efecto__fragmentos" aria-hidden="true">
          <span className="resultado-efecto__reserva">{efecto.texto}</span>
          <span className="resultado-efecto__mitad resultado-efecto__mitad--superior">{efecto.texto}</span>
          <span className="resultado-efecto__mitad resultado-efecto__mitad--inferior">{efecto.texto}</span>
          <span className="resultado-efecto__corte" />
        </span>
      </> : efecto.texto}</div>)}
    </div>
  </div>;
}
