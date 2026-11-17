/** Vuelve a la pantalla de origen; el perfil nunca es destino de sí mismo. */
export function destinoDeVuelta(state: unknown): string {
  const desde = (state as { from?: unknown } | null)?.from;
  if (typeof desde === 'string' && desde.startsWith('/') && !desde.startsWith('/perfil')) {
    return desde;
  }
  return '/menu';
}
