/* Utilidades compartidas de la racha diaria: puntos por día, tramos y formato de texto. */

export interface TramoPuntosDiarios {
  dias: number;
  puntos: number;
}

/** Normaliza los tramos que llegan del backend: descarta datos inválidos y ordena por día. */
export function normalizarTramosDiarios(raw: unknown): TramoPuntosDiarios[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item): TramoPuntosDiarios | null => {
      if (!item || typeof item !== 'object') return null;
      const tramo = item as Record<string, unknown>;
      const dias = Number(tramo.dias);
      const puntos = Number(tramo.puntos);
      if (!Number.isFinite(dias) || dias <= 0 || !Number.isFinite(puntos) || puntos < 0) return null;
      return { dias, puntos };
    })
    .filter((tramo): tramo is TramoPuntosDiarios => tramo !== null)
    .sort((a, b) => a.dias - b.dias);
}

/** Puntos diarios del día de racha indicado según los tramos vigentes (0 si no hay tramo). */
export function puntosDelDia(racha: number, tramos: TramoPuntosDiarios[]): number {
  let puntos = 0;
  for (const tramo of tramos) {
    if (racha >= tramo.dias) puntos = tramo.puntos;
  }
  return puntos;
}

/** Texto corto de la recompensa diaria, ej. "+40 pts / día". */
export function textoPuntosPorDia(puntos: number): string {
  return `+${puntos} pts / día`;
}

/** "1 día" / "N días". */
export function textoDias(dias: number): string {
  return `${dias} ${dias === 1 ? 'día' : 'días'}`;
}

/** Texto del bonus por victoria según el modo configurado: "+10%" o "+10 pts". */
export function textoBonusVictoria(valor: number, modo: 'porcentaje' | 'puntos_fijos' | undefined): string {
  return modo === 'puntos_fijos' ? `+${valor} pts` : `+${valor}%`;
}
