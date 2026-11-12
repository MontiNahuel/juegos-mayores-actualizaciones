/** Rutas contrastadas con /openapi.json de la API 2.0.0 (6/11/2026). */
export const NARRATIVE_API_PATH = '/api/narrative';
export const NARRATIVE_GUEST_CREDENTIAL_PATH = '/api/auth/guest-credential';

export const NARRATIVE_GAME_PATHS = {
  setup: '/partida/setup',
  reiniciar: '/partida/reiniciar',
  historial: '/partida/historial',
  inventario: '/partida/inventario',
  corte: '/partida/corte',
  finalizacion: '/partida/finalizacion',
  iniciar: '/v2/partida/iniciar',
  elegirCarta: '/v2/partida/elegir-carta-mes',
  avanzarMes: '/v2/partida/avanzar-mes',
  estado: '/v2/partida/estado',
  avanzarNodo: '/v2/partida/avanzar-nodo',
  grafoActual: '/v2/partida/grafo-actual',
} as const;

/** Los desenlaces pertenecen al grafo: ya no existe un catálogo /admin/resultados. */
export const NARRATIVE_CATALOG_PATHS = {
  universos: '/admin/universos',
  personajes: '/admin/personajes',
  cartas: '/admin/cartas',
  eventos: '/admin/v2/eventos',
  conversaciones: '/admin/v2/conversaciones',
  eventosEspeciales: '/admin/v2/eventos-especiales',
  finalizaciones: '/admin/finalizaciones',
} as const;
