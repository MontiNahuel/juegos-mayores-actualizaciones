import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface Imagen { src: string; nombre: string }
/** Conserva las capas anteriores hasta completar el fundido, incluso al interrumpirlo. */
export default function ImagenRetrato({ src, nombre }: Imagen) {
  const [capas, setCapas] = useState<(Imagen & { inicial: number })[]>([{ src, nombre, inicial: 1 }]);
  const raiz = useRef<HTMLDivElement>(null);
  if (!capas.some(capa => capa.src === src)) setCapas([...capas, { src, nombre, inicial: 0 }]);

  useLayoutEffect(() => {
    const elemento = raiz.current;
    if (!elemento) return;
    const imagenes = [...elemento.querySelectorAll('img')];
    const entrante = imagenes.find(img => img.dataset.src === src)!;
    let cancelada = false;
    let tween: gsap.core.Tween | undefined;
    const presentar = () => {
      if (cancelada) return;
      tween = gsap.to(imagenes, {
        opacity: (_, img: HTMLImageElement) => img === entrante ? 1 : 0,
        duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : .65,
        ease: 'power1.inOut', overwrite: true,
        onComplete: () => setCapas(actual => actual.filter(capa => capa.src === src)),
      });
    };
    if (entrante.complete) presentar();
    else {
      entrante.addEventListener('load', presentar, { once: true });
      entrante.addEventListener('error', presentar, { once: true });
    }
    return () => { cancelada = true; tween?.kill(); entrante.removeEventListener('load', presentar); entrante.removeEventListener('error', presentar); };
  }, [src]);

  return <div ref={raiz} className="absolute inset-0 z-10">
    {capas.map(capa => <img key={capa.src} data-src={capa.src} data-retrato-actual={capa.src === src}
      className="absolute bottom-0 left-1/2 -translate-x-1/2 block h-full w-auto max-w-none object-contain object-bottom"
      style={{ opacity: capa.inicial }} src={capa.src} alt={capa.src === src ? nombre : ''}
      onError={evento => { evento.currentTarget.classList.add('hidden'); }} />)}
  </div>;
}
