import { useRef } from 'react';
import type { ReactNode } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const FORMAS_RASGADO = [
  'polygon(0 0,100% 0,100% 1.5%,91% 2.4%,82% 1.3%,72% 2.2%,62% 1.4%,52% 2.5%,42% 1.5%,32% 2.3%,22% 1.4%,11% 2.4%,0 1.6%)',
  'polygon(0 0,100% 0,100% 25%,91% 26.2%,82% 24.7%,72% 25.8%,62% 24.8%,52% 26.3%,42% 25.1%,32% 26%,22% 24.8%,11% 25.9%,0 25.2%)',
  'polygon(0 0,100% 0,100% 51%,91% 52.2%,82% 50.7%,72% 51.8%,62% 50.8%,52% 52.3%,42% 51.1%,32% 52%,22% 50.8%,11% 51.9%,0 51.2%)',
  'polygon(0 0,100% 0,100% 77%,91% 78.2%,82% 76.7%,72% 77.8%,62% 76.8%,52% 78.3%,42% 77.1%,32% 78%,22% 76.8%,11% 77.9%,0 77.2%)',
  'polygon(0 0,100% 0,100% 100%,91% 100%,82% 100%,72% 100%,62% 100%,52% 100%,42% 100%,32% 100%,22% 100%,11% 100%,0 100%)',
];

// Papel reutilizable: la imagen y el contenido llegan por props.
export default function PapelUi({ children, className = '', contenidoClassName = '', imagen = '/assets/narrative/result-paper.png' }: {
  children: ReactNode;
  className?: string;
  contenidoClassName?: string;
  imagen?: string;
}) {
  const papel = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const movimiento = gsap.matchMedia();
    movimiento.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.timeline()
        .set('.papel-ui__entrada', { visibility: 'visible' })
        .fromTo('.papel-ui__entrada', { opacity: 0, y: -6, scale: .995, rotation: -.3, clipPath: FORMAS_RASGADO[0] }, { opacity: 1, y: 0, scale: 1, rotation: .12, clipPath: FORMAS_RASGADO[1], duration: .34, ease: 'sine.out' })
        .to('.papel-ui__entrada', { rotation: -.08, clipPath: FORMAS_RASGADO[2], duration: .34, ease: 'sine.inOut' })
        .to('.papel-ui__entrada', { rotation: .04, clipPath: FORMAS_RASGADO[3], duration: .34, ease: 'sine.inOut' })
        .to('.papel-ui__entrada', { rotation: 0, clipPath: FORMAS_RASGADO[4], duration: .38, ease: 'sine.out' })
        .from('.papel-ui__contenido', { opacity: 0, y: 5, filter: 'blur(1px)', duration: .55, ease: 'sine.out' }, '-=.08');
    });
    movimiento.add('(prefers-reduced-motion: reduce)', () => gsap.set('.papel-ui__entrada', { opacity: 1, visibility: 'visible', clipPath: 'none' }));
    return () => movimiento.revert();
  }, { scope: papel });

  return (
    <div ref={papel} className={`papel-ui relative aspect-[1028/1450] shrink-0 drop-shadow-[0_10px_12px_#1c0f0870] ${className}`}>
      <div className="papel-ui__entrada invisible absolute inset-0 opacity-0 [will-change:clip-path,transform,opacity]">
        <img className="pointer-events-none absolute inset-0 h-full w-full object-fill sepia-[.08] saturate-[.86] contrast-[.98]" src={imagen} alt="" aria-hidden="true" />
        <div className={`papel-ui__contenido absolute inset-[12%_13%_11%] overflow-y-auto [scrollbar-color:#7a4b27_transparent] [scrollbar-width:thin] ${contenidoClassName}`}>{children}</div>
      </div>
    </div>
  );
}
