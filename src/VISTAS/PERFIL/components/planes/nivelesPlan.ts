/* Nivel visual del plan según su posición en el catálogo: el más alto es oro. */
export type Nivel = 'bronce' | 'plata' | 'oro';

export const NIVELES: Record<Nivel, { etiqueta: string; pips: number }> = {
  bronce: { etiqueta: 'Nivel bronce', pips: 1 },
  plata: { etiqueta: 'Nivel plata', pips: 2 },
  oro: { etiqueta: 'Nivel oro', pips: 3 },
};

/** El plan más alto del orden es oro; con tres o más, el anterior es plata. */
export function nivelDe(indice: number, total: number): Nivel {
  if (indice === total - 1) return 'oro';
  if (total > 2 && indice === total - 2) return 'plata';
  return 'bronce';
}
