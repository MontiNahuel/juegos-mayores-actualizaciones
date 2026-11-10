import gsap from 'gsap';

/** Reparte desde una pila central; cada carta conserva su posición hasta su turno. */
export default function shuffleCartas(contenedor: HTMLDivElement | null, selector = 'button') {
  if (!contenedor || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const cartas = [...contenedor.querySelectorAll<HTMLElement>(selector)];
  const pila = contenedor.getBoundingClientRect();
  const posiciones = cartas.map(carta => carta.getBoundingClientRect());

  // El contexto revierte estilos y cancela tweens si cambia la tanda o se desmonta.
  const contexto = gsap.context(() => {
    cartas.forEach((carta, indice) => {
      const posicion = posiciones[indice];
      const x = Math.max(-120, Math.min(120, pila.left + (pila.width - posicion.width) / 2 - posicion.left));
      const y = Math.max(-80, Math.min(80, pila.top - posicion.top));
      const demora = indice * .15;
      gsap.set(carta, { x, y, opacity: 0 });
      gsap.to(carta, { x: 0, y: 0, duration: .6, delay: demora, ease: 'power3.out' });
      gsap.to(carta, { opacity: 1, duration: .12, delay: demora, ease: 'none' });
    });
  }, contenedor);
  return () => contexto.revert();
}
