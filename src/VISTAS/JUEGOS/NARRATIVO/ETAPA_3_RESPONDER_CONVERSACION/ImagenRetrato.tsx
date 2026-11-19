/* Presenta el retrato y conserva su imagen anterior mientras carga la siguiente. */
import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { PersonajeApi } from '../narrativeTypes';
import { API_URL } from '../../../../config/api';
import { imagenPrecargada } from '../../../../services/assetPreloader';

interface Imagen { src: string; nombre: string }
/** Conserva las capas anteriores hasta completar el fundido, incluso al interrumpirlo. */
function ImagenRetrato({ src, nombre }: Imagen) {
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
    {capas.map(capa => <img key={capa.src} data-src={capa.src}
      className="absolute bottom-0 left-1/2 -translate-x-1/2 block h-full w-full object-contain object-bottom"
      style={{ opacity: capa.inicial }} src={capa.src} alt={capa.src === src ? nombre : ''}
      onError={evento => { evento.currentTarget.classList.add('hidden'); }} />)}
  </div>;
}

// El contenedor conserva su posición mientras la imagen cambia con un fundido.
export default function Retrato({ personaje, activo, lado }: {
  personaje?: PersonajeApi;
  activo: boolean;
  lado: 'izquierda' | 'derecha';
}) {
  if (!personaje) return <div />;

  const iniciales = personaje.nombre.trim().split(/\s+/).map(parte => parte[0]).join('').slice(0, 2) || '?';
  const imagen = personaje.imagen;
  const src = imagen && imagenPrecargada(/^(https?:|blob:|data:)/.test(imagen) ? imagen : `${API_URL}${imagen}`);

  return <div data-activo={activo}
    className={`conversacion-retrato absolute inset-y-0 z-10 flex h-full w-full flex-col justify-start px-5 lg:relative lg:w-1/2 ${lado === 'derecha' ? 'right-0 lg:items-end' : 'left-0 lg:items-start'}`}>
    <div className="relative flex h-[70svh] min-h-[32rem] w-full shrink-0 items-end justify-center drop-shadow-[0_6px_12px_rgba(0,0,0,0.35)]">
      <span className="absolute inset-0 grid place-items-center text-4xl font-semibold text-amber-100/70">{iniciales}</span>
      {src && <ImagenRetrato src={src} nombre={personaje.nombre} />}
    </div>
  </div>;
}
