import type { EstadoPartida } from './narrativeService';

/** Puertos del commander: el backend resuelve la historia; la UI presenta una sola etapa.
 * La sincronización precede al draft porque el modo adaptado puede emitir otro comando.
 * No conoce DOM, GSAP ni tiempos de animación.
 */
interface Presentacion {
  sincronizar: (estado: EstadoPartida) => void;
  finalizar: (final: NonNullable<EstadoPartida['finalizacion']>) => void;
  resultado: (resultado: NonNullable<EstadoPartida['resultado_actual']>) => void;
  conversar: (conversacion: NonNullable<EstadoPartida['conversacion_actual']>) => void;
  evento: (evento: NonNullable<EstadoPartida['evento_actual']>) => Promise<unknown>;
  draft: (cartas: NonNullable<EstadoPartida['cartas_draft_actual']>) => Promise<unknown>;
  // Fase guardada sin contenido presentable (partidas viejas o incompletas).
  sinEtapa?: () => void;
}

// Prioridad explícita: una resolución terminal nunca queda detrás de un nodo pendiente.
export async function presentarResolucion(estado: EstadoPartida, vista: Presentacion) {
  vista.sincronizar(estado);
  if (estado.finalizacion) vista.finalizar(estado.finalizacion);
  else if (estado.resultado_actual) {
    vista.resultado(estado.resultado_actual);
    vista.sincronizar(estado);
  } else if (estado.conversacion_actual) vista.conversar(estado.conversacion_actual);
  else if (estado.evento_actual) await vista.evento(estado.evento_actual);
  else if ((!estado.fase_actual || estado.fase_actual.toUpperCase() === 'DRAFT_MENSUAL') && estado.cartas_draft_actual?.length)
    await vista.draft(estado.cartas_draft_actual);
  else vista.sinEtapa?.();
}
