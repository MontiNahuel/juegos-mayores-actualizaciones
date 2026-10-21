export interface ElementoFondoCorte {
  id: string;
  src: string;
  x: number;
  y: number;
  tamano: number;
  apoyo?: number;
}

export interface EstadoFondoCorte {
  src: string;
  personajes: ElementoFondoCorte[];
  oro: ElementoFondoCorte[];
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

// Los huecos 31–39 y 61–69 conservan el tramo anterior, igual que con los guardias.
export const cantidadPorTramo = (valor: number) =>
  valor >= 0 && valor <= 30 ? 0 : valor >= 40 && valor <= 60 ? 1 : valor >= 70 && valor <= 100 ? 2 : null;
