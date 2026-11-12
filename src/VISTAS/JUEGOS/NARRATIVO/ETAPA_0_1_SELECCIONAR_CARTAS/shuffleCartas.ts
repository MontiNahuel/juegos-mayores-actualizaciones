import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(CustomEase);
const CURVA_REPARTO = CustomEase.create('repartoNarrativo', '.22,1,.36,1');

/** Reparte desde la pila central con la trayectoria y el ritmo del reparto original. */
export default function shuffleCartas(contenedor: HTMLDivElement | null, selector = 'button') {
  if (!contenedor || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cartas = [...contenedor.querySelectorAll<HTMLElement>(selector)];
  const pila = contenedor.getBoundingClientRect();
  const posiciones = cartas.map(carta => carta.getBoundingClientRect());

  // Se anima la envoltura: la carta conserva sus propios estados de selección y hover.
  const contexto = gsap.context(() => {
    cartas.forEach((carta, indice) => {
      const posicion = posiciones[indice];
      const x = pila.left + (pila.width - posicion.width) / 2 - posicion.left;
      const y = pila.top - posicion.top;
      const demora = indice * .15;
      gsap.set(carta, { x, y, rotation: indice % 2 ? -6 : 6, scale: .92, opacity: 0 });
      gsap.to(carta, { x: 0, y: 0, rotation: 0, scale: 1, duration: .6, delay: demora, ease: CURVA_REPARTO });
      gsap.to(carta, { opacity: 1, duration: .12, delay: demora, ease: 'none' });
    });
  }, contenedor);
  return () => contexto.revert();
}
