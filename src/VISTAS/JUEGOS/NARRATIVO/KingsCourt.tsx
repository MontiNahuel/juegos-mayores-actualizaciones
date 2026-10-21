import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_URL } from '../../../config/api';
import { configuracionPorEdad, guardarEdad, leerEdad } from '../../../config/adaptacionEdad';
import {
  avanzarMes as avanzarMesLocal, configurarEdadNarrativa, elegirCarta, finalizarPartida,
  guardarCartasDraft, guardarCartasIniciales, guardarCorte, guardarPersonajesCorte,
  guardarResultado, iniciarJugador, limpiarResultado, mostrarConversacion, mostrarEvento,
  registrarDecisionEvento, reiniciarSeleccionNarrativa, resolverConversacion,
} from '../../../store/narrativoSelectionSlice';
import {
  avanzarMes as avisarAvanceMes, decidirEvento, elegirCartaMensual, esPartidaNarrativaLocal,
  iniciarPartida, obtenerCortePartida, obtenerEstadoPartida, obtenerHistorialPartida,
  obtenerSetup, reiniciarPartida, responderConversacion,
} from './narrativeService';
import SeleccionarCartasEtapa0y1 from './ETAPA_0_1_SELECCIONAR_CARTAS/SeleccionarCartasEtapa0y1';
import MuestraEventoEtapa0 from './ETAPA_0_MUESTRA_EVENTO/MuestraEventoEtapa0';
import DecidirEventoEtapa2 from './ETAPA_2_DECIDIR_EVENTO/DecidirEventoEtapa2';
import ResponderConversacionEtapa3 from './ETAPA_3_RESPONDER_CONVERSACION/ResponderConversacionEtapa3';
import MostrarResultadoEtapa4 from './ETAPA_4_MOSTRAR_RESULTADO/MostrarResultadoEtapa4';
import EstadisticasPartidaEtapa5 from './ETAPA_5_ESTADISTICAS_PARTIDA/EstadisticasPartidaEtapa5';
import TransicionNarrativa from './COMPARTIDOS/TRANSICION_NARRATIVA/TransicionNarrativa';
import BotonNarrativo from './COMPARTIDOS/BOTON_NARRATIVO/BotonNarrativo';
import MazoUi from './COMPARTIDOS/MAZO_UI/MazoUi';
import ConfiguracionEdad from './COMPARTIDOS/CONFIGURACION_EDAD/ConfiguracionEdad';
import './narrativo.css';

// Unifica los datos de cada carta y completa la URL de su imagen.
const prepararCarta = (carta: any) => ({
  ...carta,
  id: carta.id || carta._id,
  nombre: carta.nombre || carta.titulo,
  imagen: carta.imagen?.startsWith('/') ? `${API_URL}${carta.imagen}` : carta.imagen,
});

// Genera una derrota si alguno de los recursos llega a cero.
const finalPorRecurso = (recursos: any) => {
  const recurso = Object.keys(recursos).find(clave => Number(recursos[clave]) <= 0);
  return recurso ? {
    _id: `fin_${recurso}_cero`, recurso_clave: recurso, tipo: 'derrota_recurso',
    titulo: `El reino perdio ${recurso}`,
    texto: `El valor de ${recurso} llego a cero. La corte no pudo sostener el reino.`,
    imagen: '', rango: 'F',
  } : null;
};

// Cuenta los cambios sin números y con palabras fáciles de entender.
const describirEfectos = (resultado: any) => {
  const frases: Record<string, [string, string]> = {
    oro: ['Ahora hay más oro disponible.', 'Ahora queda menos oro.'],
    pueblo: ['La gente quedó más contenta.', 'La gente quedó más molesta.'],
    ejercito: ['La defensa del reino quedó más fuerte.', 'La defensa del reino quedó más débil.'],
    fe: ['La gente recuperó confianza.', 'La gente perdió confianza.'],
  };

  return resultado?.efectos?.map(({ accion }: any) => {
    const valor = Number(accion?.valor || 0);
    return frases[accion?.clave]?.[valor > 0 ? 0 : 1];
  }).filter(Boolean).join(' ') || 'La decisión no produjo cambios importantes.';
};

// Coordina la partida: carga datos, ejecuta acciones y muestra la etapa actual.
export default function KingsCourt() {
  const date = (useLocation().state as any)?.challenge?.dateKey || new Date().toISOString().slice(0, 10);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const store = useStore();
  const juego = useSelector((state: any) => state.narrativoSelection);
  const [setup, setSetup] = useState<any>(null);
  const [personajesDisponibles, setPersonajesDisponibles] = useState<any[]>([]);
  const [decisionConversacion, setDecisionConversacion] = useState<any>(null);
  const [conversacionPendiente, setConversacionPendiente] = useState<any>(null);
  const [estadisticas, setEstadisticas] = useState<any>(null);
  const [cargandoEstadisticas, setCargandoEstadisticas] = useState(false);
  const [reiniciando, setReiniciando] = useState(false);
  const [error, setError] = useState('');
  const [edad, setEdad] = useState<number | null>(leerEdad);
  const [mostrarMuestraEvento, setMostrarMuestraEvento] = useState(false);

  const config = configuracionPorEdad(edad);
  const modoMayor = config.adaptado;
  // Lee el jugador actualizado de Redux, incluso después de un dispatch.
  const jugadorActual = () => (store.getState() as any).narrativoSelection.jugador;

  const estiloEdad = {
    '--narrativo-texto-adaptado': `${config.tamanioTexto}px`,
    '--narrativo-control-adaptado': `${config.altoControl}px`,
    '--narrativo-personaje-visible-svh': `${70 * config.fraccionVisiblePersonaje}svh`,
    '--narrativo-personaje-visible-rem': `${32 * config.fraccionVisiblePersonaje}rem`,
  } as CSSProperties;

  // Sincroniza la edad y el modo de juego con Redux.
  useEffect(() => {
    dispatch(configurarEdadNarrativa({ edad, modo_mayor: modoMayor }));
  }, [dispatch, edad, modoMayor]);

  // Ejecuta una petición y muestra el error sin interrumpir la partida.
  const pedir = async <T,>(accion: () => Promise<T>, mensaje: string): Promise<T | null> => {
    try {
      setError('');
      return await accion();
    } catch (e: any) {
      setError(`${mensaje}${e?.message ? ` ${e.message}` : ''}`);
      return null;
    }
  };

  // En modo adaptado pide el evento sin agregar la carta al mazo.
  const abrirEventoSinCarta = async (cartas: any[]) => {
    if (!cartas[0]) return;
    const data = await pedir(() => elegirCartaMensual(date, cartas[0].id || cartas[0]._id), 'No se pudo preparar la siguiente decision.');
    if (data?.evento_actual) dispatch(mostrarEvento(data.evento_actual));
  };

  // Abre la selección mensual o salta al evento según la edad.
  const cargarDraft = async (cartas: any[], desdeServidor = false) => {
    const draft = cartas.map(prepararCarta);
    if ((desdeServidor ? configuracionPorEdad(leerEdad()) : config).permitirCartasMensuales)
      dispatch(guardarCartasDraft(draft));
    else await abrirEventoSinCarta(draft);
  };

  // Recupera la etapa pendiente del servidor sin reemplazar al jugador local.
  const mostrarEstado = async (estado: any, priorizarDraft = false) => {
    if (!estado) return;
    if (priorizarDraft && estado.resultado_actual) dispatch(guardarResultado(estado.resultado_actual));
    else if (priorizarDraft && estado.cartas_draft_actual) await cargarDraft(estado.cartas_draft_actual, true);
    else if (estado.finalizacion) dispatch(finalizarPartida(estado.finalizacion));
    else if (estado.resultado_actual) dispatch(guardarResultado(estado.resultado_actual));
    else if (estado.conversacion_actual) dispatch(mostrarConversacion(estado.conversacion_actual));
    else if (estado.evento_actual) dispatch(mostrarEvento(estado.evento_actual));
    else if (estado.cartas_draft_actual) await cargarDraft(estado.cartas_draft_actual, true);
  };

  // Intenta restaurar la pantalla cuando falla la selección de carta.
  const recuperarFase = async () => {
    try { await mostrarEstado(await obtenerEstadoPartida(date)); }
    catch { /* Conserva el error original. */ }
  };

  // Carga el desafío y, si existe, restaura la partida activa.
  useEffect(() => {
    // Inicializa el jugador y recupera su corte y su etapa pendiente.
    const cargar = async () => {
      const data = await pedir(() => obtenerSetup(date), 'No se pudo cargar el desafio de hoy.');
      if (!data) return;

      setSetup(data);
      // La muestra abre una sola vez al comenzar; una partida restaurada conserva su etapa real.
      setMostrarMuestraEvento(!data.tiene_partida_activa);
      setPersonajesDisponibles(data.personajes_ofrecidos.map(prepararCarta));
      if (jugadorActual().date !== date) {
        const edadGuardada = leerEdad();
        dispatch(iniciarJugador({
          date,
          universo_id: data.universo_id || data.personajes_ofrecidos?.[0]?.universo_id || 'corte_medieval',
          recursos: data.atributos_iniciales || { oro: 50, pueblo: 50, ejercito: 50, fe: 50 },
          edad: edadGuardada,
          modo_mayor: configuracionPorEdad(edadGuardada).adaptado,
        }));
      }
      if (!data.tiene_partida_activa || esPartidaNarrativaLocal(date)) return;

      const [estado, corte] = await Promise.all([
        pedir(() => obtenerEstadoPartida(date), 'No se pudo recuperar el contenido de la partida activa.'),
        pedir(() => obtenerCortePartida(date), 'No se pudo recuperar la corte de la partida activa.'),
      ]);
      if (!estado) return;
      if (corte?.corte) dispatch(guardarPersonajesCorte(corte.corte.map(({ personaje }: any) => prepararCarta(personaje))));
      await mostrarEstado(estado, true);
    };
    void cargar();
  }, [date, dispatch]);

  // Reinicia la prueba en el servidor y vuelve al calendario.
  const salirDePrueba = async () => {
    if (reiniciando) return;
    setReiniciando(true);
    const data = await pedir(() => reiniciarPartida(date), 'No se pudo reiniciar la partida de prueba.');
    if (data) {
      dispatch(reiniciarSeleccionNarrativa());
      navigate('/juegos/kings-court', { replace: true });
    }
    setReiniciando(false);
  };

  // Envía la corte y las cartas iniciales; luego carga el primer mes.
  const comenzarPartida = async (cartas: any[]) => {
    const data = await pedir(
      () => iniciarPartida(date, jugadorActual().corte_activa, cartas.map(carta => carta.id)),
      'Las cartas quedaron elegidas, pero no se pudo pedir el siguiente draft.'
    );
    if (!data) return;
    dispatch(guardarCartasIniciales(cartas));
    if (data.cartas_draft_actual) await cargarDraft(data.cartas_draft_actual);
  };

  // Selecciona una carta mensual y abre el evento siguiente.
  const elegirCartaDelMes = async ([carta]: any[]) => {
    const data = await pedir(() => elegirCartaMensual(date, carta.id), 'No se pudo seleccionar la carta.');
    if (!data) {
      await recuperarFase();
      return;
    }
    dispatch(elegirCarta(carta));
    if (data.evento_actual) dispatch(mostrarEvento(data.evento_actual));
  };

  // Guarda la decisión y procesa resultado, conversación y posible final.
  const decidirEventoActual = async (opcionId: string) => {
    const evento = juego.eventoActual;
    dispatch(registrarDecisionEvento({ evento_id: evento?.id || evento?._id, opcion_id: opcionId }));
    const preferencia = modoMayor ? {
      probabilidad_no_repetida: config.probabilidadConversacionNoRepetida,
      excluir_ids: jugadorActual().conversaciones_jugadas,
    } : undefined;
    const data = await pedir(
      () => decidirEvento(date, opcionId, preferencia),
      'La decision fue guardada, pero no se pudo cargar su resultado.'
    );
    if (data?.resultado_actual) dispatch(guardarResultado(data.resultado_actual));
    if (data?.conversacion_actual) setConversacionPendiente(data.conversacion_actual);
    const final = data?.finalizacion || finalPorRecurso(jugadorActual().recursos);
    if (final) dispatch(finalizarPartida(final));
  };

  // Avanza el mes localmente y busca las próximas cartas o el final.
  const avanzarMes = async () => {
    dispatch(avanzarMesLocal());
    const data = await pedir(() => avisarAvanceMes(date), 'El mes avanzo localmente, pero no se pudieron cargar las nuevas cartas.');
    if (data?.finalizacion) dispatch(finalizarPartida(data.finalizacion));
    else if (data?.cartas_draft_actual) await cargarDraft(data.cartas_draft_actual);
  };

  // Después del resultado muestra la conversación pendiente o avanza.
  const continuarResultado = () => {
    dispatch(limpiarResultado());
    if (conversacionPendiente) {
      dispatch(mostrarConversacion(conversacionPendiente));
      setConversacionPendiente(null);
    } else void avanzarMes();
  };

  // Aplica la respuesta a la conversación y la registra en el servidor.
  const responderActual = async (decision: any) => {
    dispatch(resolverConversacion({ conversacionId: juego.conversacionActual._id, decision }));
    setDecisionConversacion(decision);
    await pedir(() => responderConversacion(date, decision.opcion), 'La respuesta quedo aplicada localmente, pero no se pudo guardar en el historial.');
  };

  // Guarda la nueva edad y adapta el draft que esté abierto.
  const cambiarEdad = (nuevaEdad: number) => {
    guardarEdad(nuevaEdad);
    setEdad(nuevaEdad);
    if (!configuracionPorEdad(nuevaEdad).permitirCartasMensuales && juego.jugador.fase_actual === 'draft_mensual' && juego.cartasDraft.length)
      void abrirEventoSinCarta(juego.cartasDraft);
  };

  // Consulta en paralelo el estado y el historial de la partida.
  const verEstadisticas = async () => {
    if (cargandoEstadisticas) return;
    setCargandoEstadisticas(true);
    try {
      setError('');
      const [estado, historial] = await Promise.all([obtenerEstadoPartida(date), obtenerHistorialPartida(date)]);
      setEstadisticas({ estado, historial });
    } catch (e: any) {
      setError(`No se pudieron cargar las estadisticas. ${e?.message || ''}`);
    } finally { setCargandoEstadisticas(false); }
  };

  if (!setup) return (
    <IonPage><IonContent scrollY className="narrativo-contenido">
      <p className="p-6 text-white">Cargando desafio narrativo...</p>
      {error && <p role="alert" className="px-6 text-amber-900">{error}</p>}
    </IonContent></IonPage>
  );

  const { jugador, personajesCorte: personajes, finalizacion } = juego;
  const etapa = estadisticas ? 'estadisticas' : finalizacion ? 'final' : decisionConversacion ? 'consecuencia'
    : juego.resultadoActual ? 'resultado' : juego.conversacionActual ? 'conversacion'
    : juego.eventoActual ? 'evento' : mostrarMuestraEvento ? 'muestra_evento' : jugador.fase_actual;
  const etapaVisible = ({
    estadisticas: 'estadisticas', final: `final:${finalizacion?._id}`,
    consecuencia: `consecuencia:${jugador.mes_actual}`, resultado: `resultado:${jugador.mes_actual}`,
    conversacion: `conversacion:${juego.conversacionActual?._id}`,
    evento: `evento:${juego.eventoActual?.id || juego.eventoActual?._id}`,
  } as Record<string, string>)[etapa] || `${etapa}:${jugador.mes_actual}`;

  // Reutiliza la misma pantalla para las tres selecciones de cartas.
  const seleccionar = (titulo: string, descripcion: string, cartas: any[], cantidad: number, onConfirmar: any) => (
    <SeleccionarCartasEtapa0y1 key={etapa} {...{ titulo, descripcion, cartas, cantidad, onConfirmar }} />
  );

  let pantalla: ReactNode = null;
  // Elige una única pantalla según la fase actual de la partida.
  switch (etapa) {
    case 'muestra_evento':
      pantalla = <MuestraEventoEtapa0
        eventos={setup.eventos_del_dia || setup.eventos_ofrecidos || setup.cartas_evento || []}
        onContinuar={() => setMostrarMuestraEvento(false)}
      />;
      break;
    case 'estadisticas':
      pantalla = <EstadisticasPartidaEtapa5 estado={estadisticas.estado} historial={estadisticas.historial} modoSimple={!config.mostrarNumeros} onVolver={() => setEstadisticas(null)} />;
      break;
    case 'final':
      pantalla = <MostrarResultadoEtapa4 finalizacion={finalizacion} onVerEstadisticas={verEstadisticas} cargandoEstadisticas={cargandoEstadisticas} onTerminar={salirDePrueba} reiniciando={reiniciando} />;
      break;
    case 'consecuencia': {
      // Traduce los cambios de afinidad a texto simple o numérico.
      const efectoTexto = decisionConversacion.impacto_afinidad?.map((impacto: any) => {
        const personaje = personajes.find((p: any) => p.id === impacto.personaje_id || p._id === impacto.personaje_id);
        const nombre = impacto.personaje_nombre || impacto.nombre || personaje?.nombre || 'Personaje';
        return config.mostrarNumeros
          ? `${nombre}: ${impacto.delta > 0 ? '+' : ''}${impacto.delta} afinidad`
          : `${nombre}: ${impacto.delta < 0 ? 'La relacion necesita cuidado' : 'La relacion se fortalecio'}`;
      }).join('\n');
      pantalla = <MostrarResultadoEtapa4
        resultado={{ titulo: 'Consecuencia', texto: decisionConversacion.resultado_texto || 'La corte escucho tu decision.', imagen: '', tipo_resultado: 'neutro' as const, efectos: [] }}
        efectoTexto={efectoTexto}
        onContinuar={() => { setDecisionConversacion(null); void avanzarMes(); }}
      />;
      break;
    }
    case 'resultado':
      pantalla = <MostrarResultadoEtapa4 resultado={juego.resultadoActual} efectoTexto={!config.mostrarNumeros ? describirEfectos(juego.resultadoActual) : undefined} onContinuar={continuarResultado} />;
      break;
    case 'conversacion':
      pantalla = <ResponderConversacionEtapa3 conversacion={juego.conversacionActual} personajes={personajes} modoSimple={!config.mostrarNumeros} onElegir={responderActual} />;
      break;
    case 'evento':
      pantalla = <DecidirEventoEtapa2 key={juego.eventoActual.id || juego.eventoActual._id} evento={juego.eventoActual} atributos={jugador.recursos} modoSimple={!config.mostrarNumeros} onElegir={decidirEventoActual} />;
      break;
    case 'seleccionar_corte':
      pantalla = seleccionar('Forma tu corte', 'Elegí tres personajes para comenzar el desafio.', personajesDisponibles, 3, (cartas: any[]) => dispatch(guardarCorte(cartas)));
      break;
    case 'seleccionar_cartas':
      pantalla = seleccionar('Prepara el reino', 'Elegí tres cartas para comenzar la partida.', setup.cartas_ofrecidas.map(prepararCarta), 3, comenzarPartida);
      break;
    case 'draft_mensual':
      if (config.permitirCartasMensuales)
        pantalla = seleccionar(`Mes ${jugador.mes_actual}`, 'Elegí una carta para afrontar el proximo evento.', juego.cartasDraft.map(prepararCarta), 1, elegirCartaDelMes);
  }

  const enConversacion = etapa === 'conversacion';
  const enEvento = etapa === 'evento';
  const claseEscena = enConversacion ? 'narrativo-conversacion min-h-screen bg-slate-950' : enEvento ? 'narrativo-evento' : 'narrativo-escena';

  return (
    <IonPage>
      <IonContent scrollY className={enConversacion ? undefined : 'narrativo-contenido'}>
        <TransicionNarrativa etapa={etapaVisible}>
          <main style={modoMayor ? estiloEdad : undefined} className={`${claseEscena}${modoMayor ? ' narrativo-modo-mayor' : ''}`}>
            {error && <p role="alert" className="rounded border border-amber-300 bg-amber-50 p-3 text-amber-900">{error}</p>}
            <div className="narrativo-herramientas">
              {esPartidaNarrativaLocal(date) && <p role="status" title="Partida local de seis meses. El progreso dura mientras la app esté abierta.">Prueba sin servidor</p>}
              <MazoUi cartas={config.permitirCartasMensuales ? jugador.cartas_en_mano : []} personajes={personajes} mostrarCantidad={config.mostrarNumeros} />
              <ConfiguracionEdad edad={edad} onGuardar={cambiarEdad} />
              {!finalizacion && <BotonNarrativo disabled={reiniciando} onClick={salirDePrueba}>{reiniciando ? 'Saliendo...' : 'Salir de prueba'}</BotonNarrativo>}
            </div>
            {pantalla}
          </main>
        </TransicionNarrativa>
      </IonContent>
    </IonPage>
  );
}
