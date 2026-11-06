/* Anima el reparto y la mezcla de las cartas disponibles. */
// Reparte desde una pila central, escalonando cada carta como en el shuffle original.
export default function shuffleCartas(contenedor: HTMLDivElement | null, selector = 'button', options: { fan?: boolean } = {}) {
  if (!contenedor || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const cartas = [...contenedor.querySelectorAll<HTMLElement>(selector)];
  if (options.fan) {
    const animations = cartas.map((card, index) => {
      const x = contenedor.clientWidth / 2 - card.offsetLeft - card.offsetWidth / 2;
      const side = index - (cartas.length - 1) / 2;
      return card.animate([
        { transform: `translate3d(${x}px, 4px, 0) rotate(${-side * 10}deg) scale(.96)`, offset: 0 },
        { transform: `translate3d(${x + side * 8}px, -4px, 0) rotate(${-side * 7}deg) scale(.98)`, offset: .28 },
        { transform: 'translate3d(0, 0, 0) rotate(0deg) scale(1)', offset: 1 },
      ], { duration: 1050, delay: index * 90, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'backwards' });
    });
    return () => animations.forEach(animation => animation.cancel());
  }

  const pila = contenedor.getBoundingClientRect();
  const posiciones = cartas.map(/* Prepara el resultado de cada elemento. */ (carta) => carta.getBoundingClientRect());

  const animaciones = cartas.map(/* Prepara el resultado de cada elemento. */ (carta, indice) => {
    const posicion = posiciones[indice];
    const x = pila.left + (pila.width - posicion.width) / 2 - posicion.left;
    const y = pila.top - posicion.top;

    return carta.animate([
      { transform: `translate(${x}px, ${y}px) rotate(${indice % 2 ? -6 : 6}deg) scale(0.92)`, opacity: 0 },
      { opacity: 1, offset: 0.2 },
      { transform: 'none', opacity: 1 },
    ], {
      duration: 600, // Duracion del movimiento de cada carta.
      delay: indice * 150, // Separacion entre cartas; subir 150 hace el reparto mas lento.
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'backwards', // Conserva la posicion de la pila mientras espera su turno.
    });
  });

  // Cancela el reparto anterior si llega otra tanda o se abandona la seleccion.
  return /* Libera los recursos de este efecto cuando deja de usarse. */ () => animaciones.forEach(/* Aplica este paso a cada elemento. */ (animacion) => animacion.cancel());
}
