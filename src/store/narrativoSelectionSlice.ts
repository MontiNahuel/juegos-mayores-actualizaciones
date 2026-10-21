import { createSlice } from '@reduxjs/toolkit';
import { adaptarValorNegativo } from '../config/adaptacionEdad';
import { FONDO_CORTE_DEFAULT, GUARDIAS_CORTE, MANOS_CORTE, ORO_CORTE, cantidadManosPorPueblo, cantidadPorTramo, type EstadoFondoCorte } from '../config/fondoCorte';

const initialState: any = {
  jugador: {
    date: '',
    universo_id: '',
    recursos: {},
    corte_activa: [],
    afinidad: {},
    cartas_en_mano: [],
    tags_activos: [],
    mes_actual: 1,
    fase_actual: 'seleccionar_corte',
    status: 'in_progress',
    eventos_jugados: [],
    conversaciones_jugadas: [],
    historial_mensual: [],
    ultima_accion: null,
    edad: null,
    modo_mayor: false,
  },
  personajesCorte: [],
  cartasDraft: [],
  eventoActual: null,
  resultadoActual: null,
  conversacionActual: null,
  finalizacion: null,
  fondoBase: { src: FONDO_CORTE_DEFAULT, personajes: [], oro: [], manos: [] },
};

const limitar = (valor: any) => Math.max(0, Math.min(100, valor));
// Comparte umbrales y conserva cada capa de Redux hasta que cambie de tramo.
const componerFondoBase = (fondo: EstadoFondoCorte, recursos: { ejercito?: number; oro?: number; pueblo?: number }) => {
  const guardias = cantidadPorTramo(Number(recursos.ejercito));
  const oro = cantidadPorTramo(Number(recursos.oro));
  const valorPueblo = Number(recursos.pueblo);
  const manos = Number.isFinite(valorPueblo) ? cantidadManosPorPueblo(valorPueblo) : fondo.manos.length;
  if (guardias !== null && guardias !== fondo.personajes.length)
    fondo.personajes = GUARDIAS_CORTE.slice(0, guardias).map(elemento => ({ ...elemento }));
  if (oro !== null && oro !== fondo.oro.length)
    fondo.oro = ORO_CORTE.slice(0, oro).map(elemento => ({ ...elemento }));
  if (manos !== fondo.manos.length)
    fondo.manos = MANOS_CORTE.slice(0, manos).map(elemento => ({ ...elemento }));
};

// Comprueba si un efecto puede aplicarse con los recursos actuales.
const cumpleCondiciones = (condiciones: any[] = [], recursos: any) =>
  condiciones.every((condicion) => {
    if (condicion.tipo !== 'comparar_recurso' || !condicion.clave) return true;

    const actual = recursos[condicion.clave] || 0;
    const esperado = condicion.valor || 0;
    const comparaciones: any = {
      '>=': actual >= esperado,
      '>': actual > esperado,
      '<=': actual <= esperado,
      '<': actual < esperado,
      '==': actual === esperado,
    };

    return comparaciones[condicion.operador] ?? true;
  });

// Aplica los efectos inmediatos de personajes y cartas al obtenerlos.
const aplicarEfectosAlObtener = (jugador: any, elementos: any[]) => {
  elementos.forEach((elemento) => {
    const personajeId = elemento.id || elemento._id;

    if (typeof elemento.afinidad_inicial === 'number' && personajeId) {
      jugador.afinidad[personajeId] = elemento.afinidad_inicial;
    }

    elemento.efectos
      ?.filter(
        (efecto: any) =>
          efecto.disparador === 'al_obtener' &&
          cumpleCondiciones(efecto.condiciones, jugador.recursos),
      )
      .forEach((efecto: any) => {
        const accion = efecto.accion;

        if (accion?.tipo === 'modificar_recurso' && accion.clave) {
          const actual = jugador.recursos[accion.clave] || 0;
          jugador.recursos[accion.clave] = limitar(actual + adaptarValorNegativo(Number(accion.valor || 0), jugador.edad));
        }

        if (
          accion?.tipo === 'otorgar_tag' &&
          accion.tag &&
          !jugador.tags_activos.includes(accion.tag)
        ) {
          jugador.tags_activos.push(accion.tag);
        }
      });
  });
};

const narrativoSelectionSlice = createSlice({
  name: 'narrativoSelection',
  initialState,
  reducers: {
    // Crea el estado local del jugador con los recursos iniciales del universo.
    iniciarJugador: (state, action: { payload: any }) => {
      state.jugador = { ...initialState.jugador, ...action.payload };
      state.personajesCorte = [];
      state.cartasDraft = [];
      state.eventoActual = null;
      state.resultadoActual = null;
      state.conversacionActual = null;
      state.finalizacion = null;
      state.fondoBase = { ...initialState.fondoBase };
      componerFondoBase(state.fondoBase, state.jugador.recursos);
    },

    // Actualiza la adaptacion sin reiniciar la partida en curso.
    configurarEdadNarrativa: (state, action: { payload: any }) => {
      state.jugador.edad = action.payload.edad;
      state.jugador.modo_mayor = action.payload.modo_mayor;
    },

    // Guarda los tres personajes elegidos para formar la corte.
    guardarCorte: (state, action: { payload: any }) => {
      state.personajesCorte = action.payload;
      state.jugador.corte_activa = action.payload.map((personaje: any) => personaje.id);
      aplicarEfectosAlObtener(state.jugador, action.payload);
      state.jugador.fase_actual = 'seleccionar_cartas';
      state.jugador.ultima_accion = 'elegir_corte';
    },

    // Guarda los datos visuales de la corte al retomar una partida activa.
    guardarPersonajesCorte: (state, action: { payload: any }) => {
      state.personajesCorte = action.payload;
    },

    // Guarda las cartas iniciales antes de comenzar el primer mes.
    guardarCartasIniciales: (state, action: { payload: any }) => {
      state.jugador.cartas_en_mano = action.payload;
      aplicarEfectosAlObtener(state.jugador, action.payload);
      state.jugador.fase_actual = 'draft_mensual';
      state.jugador.ultima_accion = 'elegir_cartas_iniciales';
    },

    // Guarda solo las tres cartas necesarias para el siguiente draft.
    guardarCartasDraft: (state, action: { payload: any }) => {
      state.cartasDraft = action.payload || [];
      state.jugador.fase_actual = 'draft_mensual';
    },

    // Agrega la carta elegida al inventario local antes de pedir el evento.
    elegirCarta: (state, action: { payload: any }) => {
      state.jugador.cartas_en_mano.push(action.payload);
      aplicarEfectosAlObtener(state.jugador, [action.payload]);
      state.cartasDraft = [];
      state.jugador.fase_actual = 'decidir_evento';
      state.jugador.ultima_accion = { tipo: 'elegir_carta', id: action.payload.id };
    },

    // Guarda el evento puntual que el servidor sorteo para este mes.
    mostrarEvento: (state, action: { payload: any }) => {
      state.eventoActual = action.payload;
      state.jugador.fase_actual = 'decidir_evento';
    },

    // Conserva el fondo base y su decoración entre pantallas, incluido el resultado.
    actualizarFondoBase: (state, action: { payload: { ejercito?: number; oro?: number; pueblo?: number } }) => {
      componerFondoBase(state.fondoBase, action.payload);
    },

    // Registra la opcion del evento antes de solicitar su resultado.
    registrarDecisionEvento: (state, action: { payload: any }) => {
      const { evento_id, opcion_id } = action.payload;
      state.jugador.eventos_jugados.push(evento_id);
      state.jugador.ultima_accion = { tipo: 'decidir_evento', id: opcion_id };
    },

    // Aplica localmente los cambios del resultado sin reemplazar todo el jugador.
    guardarResultado: (state, action: { payload: any }) => {
      const resultado = action.payload;
      state.resultadoActual = resultado;
      state.eventoActual = null;
      state.jugador.fase_actual = 'mostrar_resultado';

      resultado?.efectos?.forEach(({ accion }: any) => {
        if (!accion?.clave) return;
        const actual = state.jugador.recursos[accion.clave] || 0;
        state.jugador.recursos[accion.clave] = limitar(actual + adaptarValorNegativo(accion.valor, state.jugador.edad));
      });
      state.jugador.historial_mensual.push({
        mes: state.jugador.mes_actual,
        resultado: resultado?.titulo || 'Resultado',
      });
    },

    // Cierra la pantalla de resultado para seguir con conversacion o balance.
    limpiarResultado: (state) => {
      state.resultadoActual = null;
    },

    // Guarda una conversacion posible elegida para este mes.
    mostrarConversacion: (state, action: { payload: any }) => {
      state.conversacionActual = action.payload;
      state.jugador.fase_actual = 'responder_conversacion';
    },

    // Aplica la afinidad de la decision y marca la conversacion como usada.
    resolverConversacion: (state, action: { payload: any }) => {
      const { conversacionId, decision } = action.payload;
      state.conversacionActual = null;
      state.jugador.conversaciones_jugadas.push(conversacionId);
      state.jugador.ultima_accion = { tipo: 'responder_conversacion', id: decision.opcion };

      decision.impacto_afinidad?.forEach(({ personaje_id, delta }: any) => {
        const actual = state.jugador.afinidad[personaje_id] || 50;
        state.jugador.afinidad[personaje_id] = limitar(actual + adaptarValorNegativo(delta, state.jugador.edad));
      });
    },

    // Avanza el estado local y deja listas las cartas del proximo mes.
    avanzarMes: (state) => {
      state.jugador.mes_actual += 1;
      state.jugador.fase_actual = 'draft_mensual';
      state.jugador.ultima_accion = 'avanzar_mes';
    },

    // Muestra el final puntual que llega al terminar la partida.
    finalizarPartida: (state, action: { payload: any }) => {
      state.finalizacion = action.payload;
      state.jugador.status = 'game_over';
      state.jugador.fase_actual = 'finalizada';
    },

    reiniciarSeleccionNarrativa: () => initialState,
  },
});

export const {
  iniciarJugador,
  configurarEdadNarrativa,
  guardarCorte,
  guardarPersonajesCorte,
  guardarCartasIniciales,
  guardarCartasDraft,
  elegirCarta,
  mostrarEvento,
  actualizarFondoBase,
  registrarDecisionEvento,
  guardarResultado,
  limpiarResultado,
  mostrarConversacion,
  resolverConversacion,
  avanzarMes,
  finalizarPartida,
  reiniciarSeleccionNarrativa,
} = narrativoSelectionSlice.actions;

export default narrativoSelectionSlice.reducer;
