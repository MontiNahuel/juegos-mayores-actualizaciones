import { store } from '../../../store/store';
import { resolverRespaldoNarrativo } from './narrativeFallback';
import { API_URL } from '../../../config/api';

const API = `${API_URL}/api/narrative`;

// Respaldo temporal para jugar sin servidor. Poner VITE_NARRATIVE_FALLBACK=false
// en .env.local y reiniciar Vite (o recompilar) para deshabilitar TODOS estos fallbacks.
// Activado por defecto: usa una partida local ante errores de red, timeout, HTTP 404 o 5xx.
export const HABILITAR_FALLBACK_NARRATIVO = import.meta.env.VITE_NARRATIVE_FALLBACK !== 'false';
const ESPERA_SERVIDOR_MS = 2500;
const fechasLocales = new Set<string>();

export const esPartidaNarrativaLocal = (date: string) => HABILITAR_FALLBACK_NARRATIVO && fechasLocales.has(date);

class ErrorServidorNarrativo extends Error {
  constructor(public status: number, mensaje: string) { super(mensaje); }
}

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
}

export interface SetupPartida {
  date: string;
  universo_id: string;
  atributos_iniciales: Record<string, number>;
  personajes_ofrecidos: PersonajeApi[];
  cartas_ofrecidas: CartaApi[];
  universo_nombre: string;
  tiene_partida_activa: boolean;
}

// Hint opcional para el motor: la ruta actual sigue funcionando si el backend aun no lo consume.
export interface PreferenciaConversacion {
  probabilidad_no_repetida: number;
  excluir_ids: string[];
}

// Una vez activado el respaldo, conserva esa partida local hasta terminar o reiniciar.
// No reenvia al servidor las decisiones tomadas en la demostracion.
async function request<T>(path: string, options?: RequestInit) {
  const date = new URL(path, API).searchParams.get('date') ||
    (typeof options?.body === 'string' ? JSON.parse(options.body).date : '');
  const respaldo = () => resolverRespaldoNarrativo(path, options, store.getState().narrativoSelection) as T;
  const completar = (data: T) => {
    if (path === '/partida/reiniciar') fechasLocales.delete(date);
    return data;
  };
  if (esPartidaNarrativaLocal(date)) return completar(respaldo());

  const controller = new AbortController();
  const timeout = HABILITAR_FALLBACK_NARRATIVO ? setTimeout(() => controller.abort(), ESPERA_SERVIDOR_MS) : undefined;
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });

    if (!response.ok) {
      const detalle = await response.json().catch(() => null);
      throw new ErrorServidorNarrativo(response.status, detalle?.detail || `Error ${response.status}.`);
    }
    return completar(await response.json() as T);
  } catch (error) {
    // Los errores de autenticacion, validacion o conflicto siguen visibles con su mensaje real.
    if (!HABILITAR_FALLBACK_NARRATIVO || (error instanceof ErrorServidorNarrativo && error.status < 500 && error.status !== 404)) throw error;
    const data = respaldo();
    fechasLocales.add(date);
    return completar(data);
  } finally {
    clearTimeout(timeout);
  }
}

// Carga las opciones de preparacion de la etapa 0.
export const obtenerSetup = (date: string) => request<SetupPartida>(`/partida/setup?date=${date}`);

// Lee solo el contenido de la fase activa para reanudar una partida existente.
export const obtenerEstadoPartida = (date: string) => request<EstadoPartida>(`/v2/partida/estado?date=${date}`);

// Lee el historial mensual solo al abrir las estadisticas finales.
export const obtenerHistorialPartida = (date: string) => request<any>(`/partida/historial?date=${date}`);

// Lee las cartas y tags que quedaron en la partida terminada.
export const obtenerInventarioPartida = (date: string) => request<any>(`/partida/inventario?date=${date}`);

// Lee los personajes de corte y sus afinidades finales.
export const obtenerCortePartida = (date: string) => request<any>(`/partida/corte?date=${date}`);

// Lee el rango y epilogo final guardados por el servidor.
export const obtenerFinalizacionPartida = (date: string) => request<any>(`/partida/finalizacion?date=${date}`);

// Elimina el avance de prueba para volver a la seleccion inicial.
export const reiniciarPartida = (date: string) => request<any>('/partida/reiniciar', {
  method: 'POST', body: JSON.stringify({ date }),
});

// Inicia el ciclo v2 y recibe solo el draft mensual.
export const iniciarPartida = (date: string, corte: string[], cartas: string[]) => request<EstadoPartida>('/v2/partida/iniciar', {
  method: 'POST', body: JSON.stringify({ date, corte_elegida_ids: corte, cartas_iniciales_ids: cartas }),
});

// Pide el evento generado por la carta mensual elegida.
export const elegirCartaMensual = (date: string, cartaId: string) => request<EstadoPartida>('/v2/partida/elegir-carta-mes', {
  method: 'POST', body: JSON.stringify({ date, carta_id: cartaId }),
});

// Pide el resultado, la conversacion o la finalizacion del evento.
export const decidirEvento = (date: string, opcionId: string, preferenciaConversacion?: PreferenciaConversacion) => request<EstadoPartida>('/v2/partida/decidir-evento', {
  method: 'POST',
  body: JSON.stringify({
    date,
    opcion_id: opcionId,
    // Solo se agrega cuando el llamador lo pide; asi se mantiene el contrato anterior por defecto.
    ...(preferenciaConversacion ? { preferencia_conversacion: preferenciaConversacion } : {}),
  }),
});

// Registra la mediacion elegida y cierra la conversacion.
export const responderConversacion = (date: string, opcionNumero: number) => request<EstadoPartida>('/v2/partida/responder-conversacion', {
  method: 'POST', body: JSON.stringify({ date, opcion_numero: opcionNumero }),
});

// Cierra el balance y recibe el nuevo draft o la finalizacion.
export const avanzarMes = (date: string) => request<EstadoPartida>('/v2/partida/avanzar-mes', {
  method: 'POST', body: JSON.stringify({ date }),
});
