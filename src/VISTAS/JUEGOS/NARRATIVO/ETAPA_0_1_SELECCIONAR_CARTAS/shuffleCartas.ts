// Reparte desde una pila central, escalonando cada carta como en el shuffle original.
export default function shuffleCartas(contenedor: HTMLDivElement | null) {
  if (!contenedor || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const cartas = [...contenedor.querySelectorAll('button')];
  const pila = contenedor.getBoundingClientRect();
  const posiciones = cartas.map((carta) => carta.getBoundingClientRect());

  const animaciones = cartas.map((carta, indice) => {
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
  return () => animaciones.forEach((animacion) => animacion.cancel());
}
