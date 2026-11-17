/* Tipos de los datos narrativos recibidos del servidor y usados por las vistas. */
export interface PersonajeApi {
  _id: string;
  universo_id?: string;
  nombre: string;
  titulo: string;
  descripcion: string;
  imagen?: string | null;
  texto?: string;
}

export interface CartaApi {
  _id: string;
  categoria: string;
  nombre: string;
  descripcion: string;
  imagen?: string | null;
  texto?: string;
}

export interface EventoApi {
  id: string;
  nodo_id?: string;
  titulo: string;
  descripcion: string;
  imagen: string;
  opciones: { id: string; texto: string; bloqueada: boolean; es_secreta?: boolean; secreto?: string }[];
}

export interface ResultadoApi {
  titulo: string;
  texto: string;
  imagen: string;
  tipo_resultado: 'positivo' | 'negativo' | 'neutro';
  efectos: { accion: { clave: string | null; valor: number } }[];
}

export interface FinalizacionApi {
  _id: string;
  recurso_clave: string | null;
  tipo: 'derrota_recurso' | 'derrota_general' | 'victoria_tiempo';
  titulo: string;
  texto: string;
  imagen: string;
  rango: string | null;
}

export interface ConversacionApi {
  _id: string;
  nodo_id?: string;
  titulo: string;
  imagen: string;
  requisitos: { personajeId: string }[];
  frases: { personajeId: string; texto: string }[];
  decisiones: {
    opcion: number | string;
    texto: string;
  }[];
}

// Una respuesta parcial puede omitir saldos. Omitido no significa cero.
export interface EstadoPartida {
  mes_actual?: number;
  fase_actual?: string;
  status?: string;
  recursos?: Record<string, number>;
  afinidad?: Record<string, number>;
  cartas_draft_actual?: CartaApi[];
  evento_actual?: EventoApi | null;
  resultado_actual?: ResultadoApi | null;
  conversacion_actual?: ConversacionApi | null;
  finalizacion?: FinalizacionApi | null;
  grafo_actual?: EstadoGrafoApi | null;
}

// El grafo es una escena; nodo_actual contiene la intervención o decisión visible.
// disponible y es_final los decide el backend, no la interfaz.
export interface EstadoGrafoApi {
  fase_actual: string;
  grafo_id: string;
  tipo: 'evento' | 'conversacion' | 'evento_especial';
  titulo: string;
  imagen: string;
  requisitos?: string[];
  nodo_actual: {
    id: string;
    hablante_id: string;
    texto: string;
    imagen?: string | null;
    es_final: boolean;
    opciones: { id: string; texto: string; disponible: boolean; motivo_bloqueo?: string | null }[];
    resultado_texto: string;
    impactos_recursos: { recurso: string; delta: number }[];
    impactos_afinidad: { personaje_id: string; delta: number }[];
    impactos_tags: string[];
  };
  recursos?: Record<string, number> | null;
  afinidad?: Record<string, number> | null;
  finalizacion?: FinalizacionApi | null;
  status: string;
  conversacion_actual?: ConversacionApi | null;
}

export interface HistorialMesApi {
  mes: number;
  carta_elegida_id?: string | null;
  evento_id?: string | null;
  opcion_elegida_id?: string | null;
  resultado_id?: string | null;
  conversacion_id?: string | null;
  decision_conversacion_opcion?: number | null;
  recursos_fin_mes?: Record<string, number>;
  resultado?: string;
  resultado_texto?: string;
  evento_titulo?: string;
  opcion_texto?: string;
  conversacion_titulo?: string;
  decision_texto?: string;
  decision_resultado_texto?: string;
  impacto_afinidad?: { personaje_id: string; delta: number }[];
}

export interface HistorialPartidaApi {
  historial_mensual: HistorialMesApi[];
  mes_actual?: number;
  status?: string;
}

export interface SetupPartida {
  date: string;
  universo_id: string;
  atributos_iniciales: Record<string, number>;
  personajes_ofrecidos: PersonajeApi[];
  cartas_ofrecidas: CartaApi[];
  // Resumen opcional usado solo por la muestra inicial del ciclo.
  eventos_del_dia?: { titulo?: string; nombre?: string; descripcion?: string; categoria_evento?: string; categoria?: string; tono?: 'positivo' | 'negativo' | 'neutro' }[];
  universo_nombre: string;
  tiene_partida_activa: boolean;
}

