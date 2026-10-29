/* Define el fondo de la corte y sus adornos según los recursos del reino. */
export interface ElementoFondoCorte {
  id: string;
  src: string;
  x: number;
  y: number;
  tamano: number;
  apoyo?: number;
  invertida?: boolean;
}

export interface EstadoFondoCorte {
  src: string;
  personajes: ElementoFondoCorte[];
  oro: ElementoFondoCorte[];
  manos: ElementoFondoCorte[];
}

export const FONDO_CORTE_DEFAULT = '/assets/narrative/court.jpg';

// Coordenadas porcentuales de court.jpg (1920 × 1080), antes del recorte de object-cover.
// La fuga marca el fondo de la sala; aumentar y acerca un elemento hacia el espectador.
export const FUGA_CORTE = { x: 50, y: 62 };
export const GUARDIAS_CORTE: ElementoFondoCorte[] = [
  { id: 'guardia-1', src: '/assets/narrative/guardia.png', x: FUGA_CORTE.x - 30, y: FUGA_CORTE.y + 12, tamano: 24 },
  { id: 'guardia-2', src: '/assets/narrative/guardia-2.png', x: FUGA_CORTE.x + 22, y: FUGA_CORTE.y + 12, tamano: 24 },
];
// Cada pila mira hacia el centro. apoyo descuenta el margen transparente al apoyar la imagen.
export const ORO_CORTE: ElementoFondoCorte[] = [
  { id: 'oro-izquierda', src: '/assets/narrative/oro-izquierda.png', x: FUGA_CORTE.x - 36, y: FUGA_CORTE.y + 29, tamano: 28, apoyo: 93 },
  { id: 'oro-derecha', src: '/assets/narrative/oro-derecha.png', x: FUGA_CORTE.x + 36, y: FUGA_CORTE.y + 29, tamano: 28, apoyo: 96 },
];

// Ancladas al vano central de court.jpg; se revelan de izquierda a derecha.
export const MANOS_CORTE: ElementoFondoCorte[] = [
  { id: 'mano-1', src: '/assets/narrative/hands.png', x: 44.7, y: 55.8, tamano: 4.5 },
  { id: 'mano-2', src: '/assets/narrative/hands-2.png', x: 46.2, y: 55.8, tamano: 4.5, invertida: true },
  { id: 'mano-3', src: '/assets/narrative/hands.png', x: 47.7, y: 55.8, tamano: 4.5 },
  { id: 'mano-4', src: '/assets/narrative/hands-2.png', x: 49.2, y: 55.8, tamano: 4.5, invertida: true },
];

// La gente abandona la corte en tramos; cada caída suma una silueta en la ventana.
export const cantidadManosPorPueblo = (pueblo: number) =>
  pueblo <= 0 ? 4 : pueblo <= 20 ? 3 : pueblo <= 30 ? 2 : pueblo <= 40 ? 1 : 0;

// Los huecos 31–39 y 61–69 conservan el tramo anterior, igual que con los guardias.
export const cantidadPorTramo = (valor: number) =>
  valor >= 0 && valor <= 30 ? 0 : valor >= 40 && valor <= 60 ? 1 : valor >= 70 && valor <= 100 ? 2 : null;
