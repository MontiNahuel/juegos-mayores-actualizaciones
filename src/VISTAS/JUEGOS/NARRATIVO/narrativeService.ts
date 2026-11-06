/* Habla con el servidor para iniciar la historia, avanzar en grafos V2 y recuperar la partida. */
import { store } from '../../../store/store';
import { resolverRespaldoNarrativo } from './narrativeFallback';
import { API_URL } from '../../../config/api';
import { ErrorServidorNarrativo, narrativeAdminHeaders, narrativeGameHeaders } from './narrativeAuth';
import { NARRATIVE_API_PATH, NARRATIVE_CATALOG_PATHS, NARRATIVE_GAME_PATHS } from './narrativeEndpoints';

const API = `${API_URL}${NARRATIVE_API_PATH}`;

// Respaldo temporal para jugar sin servidor. Poner VITE_NARRATIVE_FALLBACK=false
// en .env.local y reiniciar Vite (o recompilar) para deshabilitar TODOS estos fallbacks.
// Activado por defecto: usa una partida local ante errores de red, timeout, HTTP 404 o 5xx.
export const HABILITAR_FALLBACK_NARRATIVO = import.meta.env.VITE_NARRATIVE_FALLBACK !== 'false';
const ESPERA_SERVIDOR_MS = 2500;
const fechasLocales = new Set<string>();

// Comprueba si la partida usa el respaldo local.
export const esPartidaNarrativaLocal = (date: string) => HABILITAR_FALLBACK_NARRATIVO && fechasLocales.has(date);

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
  opciones: { id: string; texto: string; bloqueada: boolean; es_secreta?: boolean; secreto?: string; condiciones?: any[] }[];
}

// En el motor de grafos V2 las opciones ya vienen sanitizadas directamente desde el nodo activo.
export const agregarCondicionesSecretas = async (evento: EventoApi): Promise<EventoApi> => {
  return evento;
};

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
  grafo_actual?: EstadoGrafoApi | null;
}

export interface EstadoGrafoApi {
  fase_actual: string;
  grafo_id: string;
  tipo: 'evento' | 'conversacion' | 'evento_especial';
  titulo: string;
  imagen: string;
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

// Conserva las pantallas existentes: cada nodo se presenta como evento, diálogo o resultado.
function adaptarEstadoGrafo(estado: EstadoPartida): EstadoPartida {
  if (estado.fase_actual?.toUpperCase() === 'DRAFT_MENSUAL') return {
    ...estado, grafo_actual: null, evento_actual: null, resultado_actual: null, conversacion_actual: null,
  };
  const grafo = estado.grafo_actual;
  if (!grafo) return estado;
  const nodo = grafo.nodo_actual;
  const imagen = nodo.imagen || grafo.imagen;
  const opciones = nodo.opciones.filter(/* Conserva los elementos que cumplen esta condición. */ opcion => opcion.disponible);
  const base: EstadoPartida = {
    ...estado, evento_actual: null, conversacion_actual: null, resultado_actual: null,
    recursos: grafo.recursos ?? estado.recursos, afinidad: grafo.afinidad ?? estado.afinidad,
    finalizacion: grafo.finalizacion ?? estado.finalizacion,
  };
  if (nodo.es_final) return {
    ...base,
    conversacion_actual: grafo.conversacion_actual ?? estado.conversacion_actual ?? null,
    resultado_actual: {
      titulo: grafo.titulo, texto: [nodo.texto, nodo.resultado_texto].filter(Boolean).join('\n\n'),
      imagen, tipo_resultado: 'neutro',
      efectos: nodo.impactos_recursos.map(/* Prepara el resultado de cada elemento. */ ({ recurso, delta }) => ({ accion: { clave: recurso, valor: delta } })),
    },
  };
  if (grafo.tipo === 'conversacion') return {
    ...base,
    conversacion_actual: {
      _id: grafo.grafo_id, nodo_id: nodo.id, titulo: grafo.titulo, imagen,
      requisitos: [{ personajeId: nodo.hablante_id }],
      frases: [{ personajeId: nodo.hablante_id, texto: nodo.texto }],
      decisiones: opciones.map(/* Prepara el resultado de cada elemento. */ opcion => ({ opcion: opcion.id, texto: opcion.texto, resultado_texto: '', impacto_afinidad: [] })),
    },
  };
  return {
    ...base,
    evento_actual: {
      id: grafo.grafo_id, nodo_id: nodo.id, titulo: grafo.titulo, descripcion: nodo.texto, imagen,
      opciones: opciones.map(/* Prepara el resultado de cada elemento. */ opcion => ({ id: opcion.id, texto: opcion.texto, bloqueada: false })),
    },
  };
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
  resultado?: string; // Titulo disponible en la partida local.
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
  modo_local?: boolean;
}

export interface EntradaCatalogoCronica {
  _id?: string;
  id?: string;
  nombre?: string;
  titulo?: string;
  texto?: string;
  opciones?: { id: string; texto: string }[];
  decisiones?: {
    opcion: number;
    texto: string;
    resultado_texto?: string;
    impacto_afinidad?: { personaje_id: string; delta: number }[];
  }[];
}

export interface CatalogosCronica {
  cartas: EntradaCatalogoCronica[];
  eventos: EntradaCatalogoCronica[];
  resultados: EntradaCatalogoCronica[];
  conversaciones: EntradaCatalogoCronica[];
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

export interface PreferenciaConversacion {
  probabilidad_no_repetida: number;
  excluir_ids: string[];
}

// Una vez activado el respaldo, conserva esa partida local hasta terminar o reiniciar.
// No reenvia al servidor las decisiones tomadas en la demostracion.
async function request<T>(path: string, options?: RequestInit, permitirRespaldo = true) {
  let date = '';
  try {
    const base = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost';
    date = new URL(path, base).searchParams.get('date') || '';
  } catch {}
  if (!date && typeof options?.body === 'string') {
    try {
      date = JSON.parse(options.body).date || '';
    } catch {}
  }
  // Resuelve la acción con datos locales cuando hace falta continuar sin servidor.
  const respaldo = () => resolverRespaldoNarrativo(path, options, store.getState().narrativoSelection) as T;
  // Completa la respuesta con los datos de la siguiente etapa.
  const completar = (data: T) => {
    if (path === NARRATIVE_GAME_PATHS.reiniciar) fechasLocales.delete(date);
    return data;
  };
  if (permitirRespaldo && esPartidaNarrativaLocal(date)) return completar(respaldo());

  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const authHeaders = await narrativeGameHeaders();
    // La emisión inicial de la credencial tiene su propia espera; no consume la del juego.
    timeout = setTimeout(() => controller.abort(), ESPERA_SERVIDOR_MS);
    const response = await fetch(`${API}${path}`, {
      ...options,
      credentials: 'same-origin',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...authHeaders },
    });

    if (!response.ok) {
      const detalle = await response.json().catch(/* Maneja el fallo de esta operación. */ () => null);
      throw new ErrorServidorNarrativo(response.status, detalle?.detail || `Error ${response.status}.`);
    }
    return completar(await response.json() as T);
  } catch (error) {
    // Los errores de autenticacion, validacion o conflicto siguen visibles con su mensaje real.
    if (!permitirRespaldo || !HABILITAR_FALLBACK_NARRATIVO || (error instanceof ErrorServidorNarrativo && error.status < 500 && error.status !== 404)) throw error;
    const data = respaldo();
    fechasLocales.add(date);
    return completar(data);
  } finally {
    clearTimeout(timeout);
  }
}

// Carga las opciones de preparacion de la etapa 0.
export const obtenerSetup = (date: string) => request<SetupPartida>(`${NARRATIVE_GAME_PATHS.setup}?date=${encodeURIComponent(date)}`);

// Lee solo el contenido de la fase activa para reanudar una partida existente.
export const obtenerEstadoPartida = (date: string) => request<EstadoPartida>(`${NARRATIVE_GAME_PATHS.estado}?date=${encodeURIComponent(date)}`).then(adaptarEstadoGrafo);

// Lee el historial mensual solo al abrir las estadisticas finales.
export const obtenerHistorialPartida = (date: string) => request<HistorialPartidaApi>(`${NARRATIVE_GAME_PATHS.historial}?date=${encodeURIComponent(date)}`);

// Resuelve los IDs de la bitácora con los catálogos del mismo universo.
export const obtenerCatalogosCronica = async (date: string, universoId?: string): Promise<CatalogosCronica> => {
  const vacios: CatalogosCronica = { cartas: [], eventos: [], resultados: [], conversaciones: [] };
  if (esPartidaNarrativaLocal(date)) return vacios;
  const authHeaders = narrativeAdminHeaders();
  const controller = new AbortController();
  const timeout = setTimeout(/* Ejecuta este paso cuando se cumple la espera. */ () => controller.abort(), ESPERA_SERVIDOR_MS);

  const consultas = (['cartas', 'eventos', 'conversaciones'] as const).map(async nombre => {
    const parametros = new URLSearchParams({ limit: '500' });
    if (universoId) parametros.set('universo_id', universoId);
    const respuesta = await fetch(`${API}${NARRATIVE_CATALOG_PATHS[nombre]}?${parametros}`, {
      headers: authHeaders,
      credentials: 'same-origin',
      signal: controller.signal,
    });
    if (!respuesta.ok) return [];
    return (await respuesta.json()) as EntradaCatalogoCronica[];
  });

  try {
    const [cartas, eventos, conversaciones] = await Promise.all(consultas);
    return {
      cartas: cartas || [],
      eventos: eventos || [],
      resultados: [],
      conversaciones: conversaciones || [],
    };
  } catch {
    return vacios;
  } finally {
    clearTimeout(timeout);
  }
};

// Lee las cartas y tags que quedaron en la partida terminada.
export const obtenerInventarioPartida = (date: string) => request<any>(`${NARRATIVE_GAME_PATHS.inventario}?date=${encodeURIComponent(date)}`);

// Lee los personajes de corte y sus afinidades finales.
export const obtenerCortePartida = (date: string) => request<any>(`${NARRATIVE_GAME_PATHS.corte}?date=${encodeURIComponent(date)}`);

// Lee el rango y epilogo final guardados por el servidor.
export const obtenerFinalizacionPartida = (date: string) => request<any>(`${NARRATIVE_GAME_PATHS.finalizacion}?date=${encodeURIComponent(date)}`);

// Elimina el avance de prueba para volver a la seleccion inicial.
export const reiniciarPartida = (date: string) => request<any>(NARRATIVE_GAME_PATHS.reiniciar, {
  method: 'POST', body: JSON.stringify({ date }),
});

// Inicia el ciclo v2 y recibe solo el draft mensual.
export const iniciarPartida = (date: string, corte: string[], cartas: string[]) => request<EstadoPartida>(NARRATIVE_GAME_PATHS.iniciar, {
  method: 'POST', body: JSON.stringify({ date, corte_elegida_ids: corte, cartas_iniciales_ids: cartas }),
});

// Pide el evento generado por la carta mensual elegida (motor de grafos V2).
export const elegirCartaMensual = (date: string, cartaId: string) => request<EstadoPartida>(NARRATIVE_GAME_PATHS.elegirCarta, {
  method: 'POST', body: JSON.stringify({ date, carta_id: cartaId }),
}).then(adaptarEstadoGrafo);

// Eventos y conversaciones del motor de grafos V2 usan el mismo endpoint interactivo e IDs de opción.
export const avanzarNodo = async (date: string, opcionId: string, grafoAnteriorId: string): Promise<EstadoPartida> => {
  // Una partida de servidor no puede cambiar de motor al fallar una decisión.
  const grafo = await request<EstadoGrafoApi>(NARRATIVE_GAME_PATHS.avanzarNodo, {
    method: 'POST', body: JSON.stringify({ date, opcion_id: opcionId }),
  }, esPartidaNarrativaLocal(date));
  // Al encadenar otro grafo la respuesta omite los impactos del anterior.
  if (grafo.grafo_id !== grafoAnteriorId) {
    return adaptarEstadoGrafo(await request<EstadoPartida>(`${NARRATIVE_GAME_PATHS.estado}?date=${encodeURIComponent(date)}`, undefined, esPartidaNarrativaLocal(date)));
  }
  return adaptarEstadoGrafo({ grafo_actual: grafo, fase_actual: grafo.fase_actual });
};

// Cierra el balance y recibe el nuevo draft o la finalizacion.
export const avanzarMes = (date: string) => request<EstadoPartida>(NARRATIVE_GAME_PATHS.avanzarMes, {
  method: 'POST', body: JSON.stringify({ date }),
}, esPartidaNarrativaLocal(date));

const continuaciones = new Map<string, Promise<EstadoPartida>>();

/** Continuar confirma la fase real: una conversación pendiente nunca cierra el mes. */
export function continuarTurno(date: string): Promise<EstadoPartida> {
  const pendiente = continuaciones.get(date);
  if (pendiente) return pendiente;
  const leerEstado = () => request<EstadoPartida>(`${NARRATIVE_GAME_PATHS.estado}?date=${encodeURIComponent(date)}`, undefined, false).then(adaptarEstadoGrafo);
  const continuar = async () => {
    if (esPartidaNarrativaLocal(date)) return avanzarMes(date);
    const estado = await leerEstado();
    if (estado.finalizacion) return estado;
    if (estado.fase_actual?.toUpperCase() !== 'BALANCE_MES') return { ...estado, resultado_actual: null };
    try { return await avanzarMes(date); }
    catch (error) {
      // Si el servidor confirmó antes del timeout, recuperar sin repetir pasivos ni el POST.
      try {
        const actual = await leerEstado();
        if (actual.mes_actual !== estado.mes_actual || actual.fase_actual !== estado.fase_actual || actual.finalizacion) {
          return actual.fase_actual?.toUpperCase() === 'BALANCE_MES' ? actual : { ...actual, resultado_actual: null };
        }
      } catch { /* Conserva el rechazo original si tampoco se puede recuperar el estado. */ }
      throw error;
    }
  };
  const tarea = continuar().finally(() => continuaciones.delete(date));
  continuaciones.set(date, tarea);
  return tarea;
}
