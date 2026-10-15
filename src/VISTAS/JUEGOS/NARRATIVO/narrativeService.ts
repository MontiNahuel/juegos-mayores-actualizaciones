const API = 'http://10.16.2.29:8080/api/narrative/partida';

export interface PersonajeApi {
  _id: string;
  nombre: string;
  titulo: string;
  descripcion: string;
  imagen: string;
}

export interface CartaApi {
  _id: string;
  categoria: string;
  nombre: string;
  descripcion: string;
  imagen: string;
}

export interface EventoApi {
  id: string;
  titulo: string;
  descripcion: string;
  imagen: string;
  opciones: { id: string; texto: string; bloqueada: boolean }[];
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
  titulo: string;
  imagen: string;
  requisitos: { personajeId: string }[];
  frases: { personajeId: string; texto: string }[];
  decisiones: {
    opcion: number;
    texto: string;
    resultado_texto: string;
    impacto_afinidad: { personaje_id: string; delta: number }[];
  }[];
}

export interface EstadoPartida {
  run: {
    recursos: Record<string, number>;
    afinidad: Record<string, number>;
    status: string;
    fase_actual?: string;
    finalizacion?: FinalizacionApi | null;
  };
  personajes_corte: PersonajeApi[];
  cartas_draft_actual: CartaApi[];
  evento_actual: EventoApi | null;
  resultado_actual: ResultadoApi | null;
  conversacion_actual: ConversacionApi | null;
  finalizacion?: FinalizacionApi | null;
}

export interface SetupPartida {
  atributos_iniciales: Record<string, number>;
  personajes_ofrecidos: PersonajeApi[];
  cartas_ofrecidas: CartaApi[];
  universo_nombre: string;
  tiene_partida_activa: boolean;
}

async function request<T>(path: string, options?: RequestInit) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });

  if (!response.ok) throw new Error('No se pudo cargar la partida narrativa.');
  return response.json() as Promise<T>;
}

export const obtenerSetup = (date: string) => request<SetupPartida>(`/setup?date=${date}`);
export const obtenerPartida = (date: string) => request<EstadoPartida>(`/activa?date=${date}`);
export const iniciarPartida = (date: string, corte: string[], cartas: string[]) => request<EstadoPartida>('/iniciar', {
  method: 'POST', body: JSON.stringify({ date, corte_elegida_ids: corte, cartas_iniciales_ids: cartas }),
});
export const elegirCartaMensual = (date: string, cartaId: string) => request<EstadoPartida>('/elegir-carta-mes', {
  method: 'POST', body: JSON.stringify({ date, carta_id: cartaId }),
});
export const decidirEvento = (date: string, opcionId: string) => request<EstadoPartida>('/decidir-evento', {
  method: 'POST', body: JSON.stringify({ date, opcion_id: opcionId }),
});
export const responderConversacion = (date: string, opcionNumero: number) => request<EstadoPartida>('/responder-conversacion', {
  method: 'POST', body: JSON.stringify({ date, opcion_numero: opcionNumero }),
});
export const avanzarMes = (date: string) => request<EstadoPartida>('/avanzar-mes', {
  method: 'POST', body: JSON.stringify({ date }),
});
