import type { CartaApi, ConversacionApi, EstadoPartida, EventoApi, FinalizacionApi, PersonajeApi, ResultadoApi, SetupPartida } from './narrativeService';
import { configuracionPorEdad } from '../../../config/adaptacionEdad';

// Partida de demostracion corta: seis meses, con recursos y afinidad reales en Redux.
const MESES_DE_PRUEBA = 6;
const personajes: PersonajeApi[] = [
  { _id: 'local-elena', nombre: 'Elena', titulo: 'Consejera', descripcion: 'Busca acuerdos para mantener unido al reino.' },
  { _id: 'local-rodrigo', nombre: 'Rodrigo', titulo: 'Capitán', descripcion: 'Defiende las fronteras y la seguridad de la corte.' },
  { _id: 'local-ines', nombre: 'Inés', titulo: 'Tesorera', descripcion: 'Administra las reservas para los tiempos difíciles.' },
  { _id: 'local-mateo', nombre: 'Mateo', titulo: 'Cronista', descripcion: 'Escucha al pueblo y conserva la memoria del reino.' },
];
const cartas: CartaApi[] = [
  { _id: 'local-cosecha', nombre: 'La cosecha', categoria: 'Pueblo', descripcion: 'Las aldeas ofrecen parte de sus reservas para sostener al reino.' },
  { _id: 'local-pacto', nombre: 'El pacto', categoria: 'Diplomacia', descripcion: 'Un acuerdo puede abrir caminos donde antes había fronteras.' },
  { _id: 'local-guardia', nombre: 'La guardia', categoria: 'Ejército', descripcion: 'Los centinelas traen noticias desde los límites del reino.' },
  { _id: 'local-feria', nombre: 'La feria', categoria: 'Oro', descripcion: 'Los mercaderes se reúnen para intercambiar bienes e historias.' },
  { _id: 'local-santuario', nombre: 'El santuario', categoria: 'Fe', descripcion: 'La comunidad busca un lugar donde recuperar la esperanza.' },
  { _id: 'local-puente', nombre: 'El puente', categoria: 'Obras', descripcion: 'Un antiguo paso podría volver a unir a las aldeas.' },
];
const situaciones = [
  ['Reservas para el invierno', 'Las aldeas piden ayuda para llenar sus graneros antes del frío.'],
  ['Un visitante en la frontera', 'Una delegación vecina solicita protección para cruzar tus tierras.'],
  ['El mercado de la capital', 'Los comerciantes proponen una feria para reactivar la economía.'],
  ['Las murallas antiguas', 'El capitán advierte que las defensas necesitan reparaciones.'],
  ['La fiesta del santuario', 'La comunidad desea celebrar una ceremonia abierta a todo el reino.'],
  ['El consejo de las aldeas', 'Los representantes del pueblo llegan a la corte para discutir el futuro.'],
];
const eventosDelDia = [
  { titulo: situaciones[0][0], descripcion: situaciones[0][1], categoria: 'Pueblo', tono: 'positivo' as const },
  { titulo: situaciones[2][0], descripcion: situaciones[2][1], categoria: 'Pueblo', tono: 'negativo' as const },
  { titulo: situaciones[4][0], descripcion: situaciones[4][1], categoria: 'Pueblo', tono: 'positivo' as const },
  { titulo: situaciones[1][0], descripcion: situaciones[1][1], categoria: 'Diplomacia', tono: 'neutro' as const },
];

interface CartaLocal extends CartaApi { id?: string }
interface PersonajeLocal extends PersonajeApi { id?: string }
interface EstadoLocal {
  jugador: {
    date: string;
    mes_actual: number;
    fase_actual: string;
    status: string;
    recursos: Record<string, number>;
    afinidad: Record<string, number>;
    cartas_en_mano: CartaLocal[];
    tags_activos: string[];
    eventos_jugados: string[];
    conversaciones_jugadas: string[];
    historial_mensual: { mes: number; resultado: string }[];
    edad?: number | null;
    modo_mayor?: boolean;
  };
  personajesCorte: PersonajeLocal[];
  cartasDraft: CartaLocal[];
  eventoActual: EventoApi | null;
  resultadoActual: ResultadoApi | null;
  conversacionActual: ConversacionApi | null;
  finalizacion: FinalizacionApi | null;
}

const draft = (mes: number) => Array.from({ length: 3 }, (_, i) => cartas[(mes + i - 1) % cartas.length]);

function conversacionDe(estado: EstadoLocal): ConversacionApi {
  const corte = estado.personajesCorte.length ? estado.personajesCorte : personajes;
  const [primero, segundo] = corte;
  const id = (p: PersonajeLocal) => p.id || p._id;
  const [tema, necesidad] = situaciones[(estado.jugador.mes_actual - 1) % situaciones.length];
  return {
    _id: `local-conversacion-${estado.jugador.mes_actual}`,
    // El tema mensual mantiene variadas las conversaciones del respaldo sin cambiar su estructura.
    titulo: tema, imagen: '',
    requisitos: [primero, segundo].filter(Boolean).map(p => ({ personajeId: id(p) })),
    frases: [
      { personajeId: id(primero), texto: `${necesidad} El pueblo necesita ver que escuchamos sus preocupaciones.` },
      { personajeId: id(segundo || primero), texto: 'También debemos cuidar las reservas. ¿Qué camino elegimos?' },
    ],
    decisiones: [
      { opcion: 1, texto: 'Escuchar primero a las aldeas.', resultado_texto: 'La corte organizará una audiencia con el pueblo.', impacto_afinidad: [{ personaje_id: id(primero), delta: 8 }] },
      { opcion: 2, texto: 'Preparar un plan antes de prometer ayuda.', resultado_texto: 'La corte revisará los recursos antes de actuar.', impacto_afinidad: [{ personaje_id: id(segundo || primero), delta: 8 }] },
    ],
  };
}

// Cadencia determinista: evita pruebas inestables y conserva el 50% previo (meses pares).
// Con 75% habilita tres de cada cuatro meses y nunca repite el id ya registrado.
function debeOfrecerConversacion(estado: EstadoLocal, probabilidad: number) {
  const mes = estado.jugador.mes_actual;
  const id = `local-conversacion-${mes}`;
  const umbralPorMes = [0, .75, .25, .5][mes % 4];
  return !estado.jugador.conversaciones_jugadas.includes(id) && umbralPorMes < probabilidad;
}

function finalDe(estado: EstadoLocal): FinalizacionApi | null {
  const agotado = Object.entries(estado.jugador.recursos).find(([, valor]) => valor <= 0)?.[0];
  if (!agotado && estado.jugador.mes_actual <= MESES_DE_PRUEBA) return null;
  return {
    _id: 'local-final', recurso_clave: agotado || null,
    tipo: agotado ? 'derrota_recurso' : 'victoria_tiempo',
    titulo: agotado ? 'El reino necesita un nuevo comienzo' : 'Un reino que mira al futuro',
    texto: agotado ? `El recurso ${agotado} se agotó. Tu corte recordará las decisiones de este reinado.` : 'Completaste los seis meses de prueba. La corte y las aldeas celebran la continuidad del reino.',
    imagen: '', rango: agotado ? 'F' : 'A',
  };
}

// Usa el estado actual de Redux: una caida del servidor no reinicia el mes ni los recursos.
// No escribe en el backend ni persiste partidas; el respaldo dura mientras la app esta abierta.
export function resolverRespaldoNarrativo(path: string, options: RequestInit | undefined, estado: EstadoLocal): unknown {
  const url = new URL(path, 'http://local');
  const body = typeof options?.body === 'string' ? JSON.parse(options.body) : {};
  const date = url.searchParams.get('date') || body.date;
  const jugador = estado.jugador;
  const mes = jugador.mes_actual;
  const foto: EstadoPartida & { modo_local: boolean } = {
    modo_local: true, mes_actual: Math.min(mes, MESES_DE_PRUEBA), fase_actual: jugador.fase_actual,
    status: jugador.status, recursos: jugador.recursos, afinidad: jugador.afinidad,
    evento_actual: estado.eventoActual, resultado_actual: estado.resultadoActual,
    conversacion_actual: estado.conversacionActual, finalizacion: estado.finalizacion,
    ...(jugador.fase_actual === 'draft_mensual' ? { cartas_draft_actual: estado.cartasDraft.length ? estado.cartasDraft : draft(mes) } : {}),
  };

  switch (url.pathname) {
    case '/partida/setup': {
      const setup: SetupPartida = {
        date, universo_id: 'corte_local', universo_nombre: 'Reino de prueba',
        atributos_iniciales: { oro: 50, pueblo: 50, ejercito: 50, fe: 50 },
        personajes_ofrecidos: personajes, cartas_ofrecidas: cartas,
        eventos_del_dia: eventosDelDia,
        tiene_partida_activa: jugador.date === date && jugador.fase_actual !== 'seleccionar_corte',
      };
      return setup;
    }
    case '/v2/partida/iniciar':
      return { cartas_draft_actual: draft(mes) };
    case '/v2/partida/elegir-carta-mes': {
      const [titulo, descripcion] = situaciones[(mes - 1) % situaciones.length];
      const carta = estado.cartasDraft.find(c => (c.id || c._id) === body.carta_id);
      const evento: EventoApi = {
        id: `local-evento-${mes}`, titulo, imagen: '',
        descripcion: `${jugador.modo_mayor ? '' : carta ? `${carta.nombre}: ` : ''}${descripcion}`,
        opciones: [
          { id: 'local-ayudar', texto: 'Destinar reservas a la comunidad (−12 oro, +8 pueblo, +4 fe).', bloqueada: false },
          { id: 'local-organizar', texto: 'Organizar un esfuerzo compartido (+6 oro, −4 pueblo, +3 ejército).', bloqueada: false },
        ],
      };
      return { evento_actual: evento };
    }
    case '/v2/partida/decidir-evento': {
      const ayudar = body.opcion_id === 'local-ayudar' || estado.eventoActual?.opciones[0]?.id === body.opcion_id;
      const cambios: [string, number][] = ayudar ? [['oro', -12], ['pueblo', 8], ['fe', 4]] : [['oro', 6], ['pueblo', -4], ['ejercito', 3]];
      const resultado: ResultadoApi = {
        titulo: ayudar ? 'Ayuda a las aldeas' : 'Un esfuerzo compartido',
        texto: ayudar ? 'Las reservas llegaron a las aldeas. El pueblo agradece tu apoyo.' : 'La corte coordinó una jornada de trabajo. Las reservas y las defensas mejoraron.',
        imagen: '', tipo_resultado: 'neutro',
        efectos: cambios.map(([clave, valor]) => ({ accion: { clave, valor } })),
      };
      const perfilEdad = configuracionPorEdad(jugador.edad ?? null);
      // El hint opcional usa la misma forma que el servicio real; sin hint manda la regla central por edad.
      const probabilidad = body.preferencia_conversacion?.probabilidad_no_repetida
        ?? perfilEdad.probabilidadConversacionNoRepetida;
      return {
        resultado_actual: resultado,
        ...(debeOfrecerConversacion(estado, probabilidad) ? { conversacion_actual: conversacionDe(estado) } : {}),
      };
    }
    case '/v2/partida/responder-conversacion':
      return foto;
    case '/v2/partida/avanzar-mes': {
      const finalizacion = finalDe(estado);
      return finalizacion ? { finalizacion } : { cartas_draft_actual: draft(mes) };
    }
    case '/v2/partida/estado':
      return foto;
    case '/partida/corte':
      return { corte: estado.personajesCorte.map(personaje => ({ personaje, afinidad: jugador.afinidad[personaje.id || personaje._id] ?? 50 })) };
    case '/partida/historial':
      return {
        modo_local: true, mes_actual: foto.mes_actual, status: jugador.status,
        historial_mensual: jugador.historial_mensual.map((registro, i) => ({
          ...registro, evento_id: jugador.eventos_jugados[i], resultado_id: registro.resultado,
          conversacion_id: jugador.conversaciones_jugadas.find(id => id === `local-conversacion-${registro.mes}`),
        })),
      };
    case '/partida/inventario':
      return { cartas: jugador.cartas_en_mano, tags: jugador.tags_activos };
    case '/partida/finalizacion':
      return { finalizacion: estado.finalizacion };
    case '/partida/reiniciar':
      return { reiniciada: true };
    default:
      throw new Error(`No hay respaldo narrativo para ${url.pathname}.`);
  }
}
