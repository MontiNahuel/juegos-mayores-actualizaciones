// Coordina las etapas de Kings Court usando el estado local del jugador.
import { useEffect, useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  avanzarMes as avanzarMesLocal,
  elegirCarta,
  finalizarPartida,
  guardarCartasDraft,
  guardarCartasIniciales,
  guardarCorte,
  guardarPersonajesCorte,
  guardarResultado,
  iniciarJugador,
  limpiarResultado,
  mostrarConversacion,
  mostrarEvento,
  registrarDecisionEvento,
  reiniciarSeleccionNarrativa,
  resolverConversacion,
} from '../../../store/narrativoSelectionSlice';
import SeleccionarCartasEtapa0y1 from './ETAPA_0_1_SELECCIONAR_CARTAS/SeleccionarCartasEtapa0y1';
import DecidirEventoEtapa2 from './ETAPA_2_DECIDIR_EVENTO/DecidirEventoEtapa2';
import ResponderConversacionEtapa3 from './ETAPA_3_RESPONDER_CONVERSACION/ResponderConversacionEtapa3';
import MostrarResultadoEtapa4 from './ETAPA_4_MOSTRAR_RESULTADO/MostrarResultadoEtapa4';
import EstadisticasPartidaEtapa5 from './ETAPA_5_ESTADISTICAS_PARTIDA/EstadisticasPartidaEtapa5';
import TransicionNarrativa from './COMPARTIDOS/TransicionNarrativa';
import './narrativo.css';
import {
  avanzarMes as avisarAvanceMes,
  decidirEvento,
  elegirCartaMensual,
  esPartidaNarrativaLocal,
  iniciarPartida,
  obtenerCortePartida,
  obtenerEstadoPartida,
  obtenerHistorialPartida,
  obtenerSetup,
  reiniciarPartida,
  responderConversacion,
} from './narrativeService';

const IMAGENES = 'http://10.16.2.19:8080';

// Normaliza las cartas y personajes para que todas las etapas usen el mismo id.
const prepararCarta = (item: any) => ({
  ...item,
  id: item.id || item._id,
  nombre: item.nombre || item.titulo,
  imagen: item.imagen?.startsWith('/') ? `${IMAGENES}${item.imagen}` : item.imagen,
});

// Crea un cierre local si un recurso se agota y aun no llego su texto final.
const finalPorRecurso = (recursos: any) => {
  const recurso = Object.entries(recursos).find(([, valor]) => Number(valor) <= 0)?.[0];
  if (!recurso) return null;

  return {
    _id: `fin_${recurso}_cero`,
    recurso_clave: recurso,
    tipo: 'derrota_recurso',
    titulo: `El reino perdio ${recurso}`,
    texto: `El valor de ${recurso} llego a cero. La corte no pudo sostener el reino.`,
    imagen: '',
    rango: 'F',
  };
};

// Muestra el efecto local de una conversacion antes de continuar el mes.
function ConsecuenciaConversacion({ decision, personajes, onContinuar }: any) {
  return (
    <section className="narrativo-panel narrativo-panel--claro mx-auto max-w-2xl text-center">
      <p className="text-sm font-medium text-slate-500">Consecuencia</p>
      <h2 className="mt-1 text-2xl font-bold text-slate-900">{decision.resultado_texto || 'La corte escucho tu decision.'}</h2>
      <div className="mt-6 space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-left">
        {decision.impacto_afinidad?.map((impacto: any) => (
          <p key={impacto.personaje_id}>
            {impacto.personaje_nombre || impacto.nombre || personajes.find((personaje: any) => personaje._id === impacto.personaje_id || personaje.id === impacto.personaje_id)?.nombre || 'Personaje'}: {impacto.delta > 0 ? '+' : ''}{impacto.delta} afinidad
          </p>
        ))}
      </div>
      <button className="mt-6 rounded bg-slate-800 px-4 py-2 text-white" onClick={onContinuar}>Continuar</button>
    </section>
  );
}

// Controla cada etapa sin reemplazar al jugador con respuestas del servidor.
export default function KingsCourt() {
  const challenge = (useLocation().state as any)?.challenge;
  const date = challenge?.dateKey || new Date().toISOString().slice(0, 10);
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

  // Lee la foto mas reciente del jugador despues de cada accion de Redux.
  const jugadorActual = () => (store.getState() as any).narrativoSelection.jugador;

  // Informa errores de red sin revertir las decisiones tomadas localmente.
  const pedir = async (accion: any, mensaje: string) => {
    try {
      setError('');
      return await accion();
    } catch (error: any) {
      setError(`${mensaje}${error?.message ? ` ${error.message}` : ''}`);
      return null;
    }
  };

  // Recupera solo la pantalla pendiente cuando el servidor ya avanzo de fase.
  const recuperarFaseServidor = async () => {
    try {
      const estado = await obtenerEstadoPartida(date);

      if (estado.finalizacion) dispatch(finalizarPartida(estado.finalizacion));
      else if (estado.resultado_actual) dispatch(guardarResultado(estado.resultado_actual));
      else if (estado.conversacion_actual) dispatch(mostrarConversacion(estado.conversacion_actual));
      else if (estado.evento_actual) dispatch(mostrarEvento(estado.evento_actual));
      else if (estado.cartas_draft_actual) dispatch(guardarCartasDraft(estado.cartas_draft_actual.map(prepararCarta)));
    } catch {
      // Conserva el error original si tampoco se puede recuperar la fase.
    }
  };

  // Borra esta prueba en servidor y Redux antes de volver al calendario.
  const salirDePrueba = async () => {
    if (reiniciando) return;

    setReiniciando(true);
    const data = await pedir(
      () => reiniciarPartida(date),
      'No se pudo reiniciar la partida de prueba.'
    );

    if (data) {
      dispatch(reiniciarSeleccionNarrativa());
      navigate('/juegos/kings-court', { replace: true });
    }

    setReiniciando(false);
  };

  // Carga solo la configuracion necesaria para comenzar una partida nueva.
  useEffect(() => {
    const cargar = async () => {
      const data = await pedir(() => obtenerSetup(date), 'No se pudo cargar el desafio de hoy.');
      if (!data) return;

      setSetup(data);
      setPersonajesDisponibles(data.personajes_ofrecidos.map(prepararCarta));
      if (jugadorActual().date !== date) {
        dispatch(iniciarJugador({
          date,
          universo_id: data.universo_id || data.personajes_ofrecidos?.[0]?.universo_id || 'corte_medieval',
          recursos: data.atributos_iniciales || { oro: 50, pueblo: 50, ejercito: 50, fe: 50 },
        }));
      }

      // El respaldo lee el mismo Redux; recuperarlo otra vez duplicaria los efectos del resultado.
      if (!data.tiene_partida_activa || esPartidaNarrativaLocal(date)) return;

      const [estado, corte] = await Promise.all([
        pedir(() => obtenerEstadoPartida(date), 'No se pudo recuperar el contenido de la partida activa.'),
        pedir(() => obtenerCortePartida(date), 'No se pudo recuperar la corte de la partida activa.'),
      ]);
      if (!estado) return;

      if (corte?.corte) dispatch(guardarPersonajesCorte(corte.corte.map(({ personaje }: any) => prepararCarta(personaje))));

      // Solo toma el contenido necesario para mostrar la fase. El jugador sigue local.
      if (estado.resultado_actual) dispatch(guardarResultado(estado.resultado_actual));
      else if (estado.cartas_draft_actual) dispatch(guardarCartasDraft(estado.cartas_draft_actual.map(prepararCarta)));
      else if (estado.evento_actual) dispatch(mostrarEvento(estado.evento_actual));
      else if (estado.conversacion_actual) dispatch(mostrarConversacion(estado.conversacion_actual));
      else if (estado.finalizacion) dispatch(finalizarPartida(estado.finalizacion));
    };

    void cargar();
  }, [date, dispatch]);

  // Inicia la partida despues de guardar las cartas iniciales en Redux.
  const comenzarPartida = async (cartas: any[]) => {
    const data = await pedir(
      () => iniciarPartida(date, jugadorActual().corte_activa, cartas.map((carta) => carta.id)),
      'Las cartas quedaron elegidas, pero no se pudo pedir el siguiente draft.'
    );

    if (!data) return;

    dispatch(guardarCartasIniciales(cartas));
    if (data.cartas_draft_actual) dispatch(guardarCartasDraft(data.cartas_draft_actual.map(prepararCarta)));
  };

  // Guarda la carta mensual localmente y pide solo el evento que sigue.
  const elegirCartaDelMes = async ([carta]: any[]) => {
    const data = await pedir(
      () => elegirCartaMensual(date, carta.id),
      'No se pudo seleccionar la carta.'
    );

    if (!data) {
      await recuperarFaseServidor();
      return;
    }

    dispatch(elegirCarta(carta));
    if (data.evento_actual) dispatch(mostrarEvento(data.evento_actual));
  };

  // Registra la decision local y toma solo el resultado del evento elegido.
  const decidirEventoActual = async (opcionId: string) => {
    const evento = juego.eventoActual;
    dispatch(registrarDecisionEvento({ evento_id: evento?.id || evento?._id, opcion_id: opcionId }));

    const data = await pedir(
      () => decidirEvento(date, opcionId),
      'La decision fue guardada, pero no se pudo cargar su resultado.'
    );

    if (data?.resultado_actual) dispatch(guardarResultado(data.resultado_actual));
    if (data?.conversacion_actual) setConversacionPendiente(data.conversacion_actual);

    const cierreLocal = finalPorRecurso(jugadorActual().recursos);
    if (data?.finalizacion || cierreLocal) dispatch(finalizarPartida(data?.finalizacion || cierreLocal));
  };

  // Avanza el mes en Redux y pide solamente el proximo draft o el final v2.
  const avanzarAlMesSiguiente = async () => {
    dispatch(avanzarMesLocal());

    const data = await pedir(
      () => avisarAvanceMes(date),
      'El mes avanzo localmente, pero no se pudieron cargar las nuevas cartas.'
    );

    if (data?.finalizacion) dispatch(finalizarPartida(data.finalizacion));
    else if (data?.cartas_draft_actual) dispatch(guardarCartasDraft(data.cartas_draft_actual.map(prepararCarta)));
  };

  // Muestra la conversacion que el motor v2 resolvio para este evento.
  const continuarDespuesResultado = () => {
    dispatch(limpiarResultado());

    if (conversacionPendiente) {
      dispatch(mostrarConversacion(conversacionPendiente));
      setConversacionPendiente(null);
      return;
    }

    void avanzarAlMesSiguiente();
  };

  // Aplica la afinidad local y registra la decision en el backend para el historial.
  const responderConversacionActual = async (decision: any) => {
    const conversacion = juego.conversacionActual;
    dispatch(resolverConversacion({ conversacionId: conversacion._id, decision }));
    setDecisionConversacion(decision);

    await pedir(
      () => responderConversacion(date, decision.opcion),
      'La respuesta quedo aplicada localmente, pero no se pudo guardar en el historial.'
    );
  };

  // Consulta en paralelo la foto final y la trazabilidad solo al pedir estadisticas.
  const verEstadisticas = async () => {
    if (cargandoEstadisticas) return;

    setCargandoEstadisticas(true);
    try {
      setError('');
      const [estado, historial] = await Promise.all([
        obtenerEstadoPartida(date),
        obtenerHistorialPartida(date),
      ]);
      setEstadisticas({ estado, historial });
    } catch (error: any) {
      setError(`No se pudieron cargar las estadisticas. ${error?.message || ''}`);
    } finally {
      setCargandoEstadisticas(false);
    }
  };

  if (!setup) return (
    <IonPage>
      <IonContent scrollY className="narrativo-contenido">
        <p className="p-6 text-white">Cargando desafio narrativo...</p>
        {error && <p role="alert" className="px-6 text-amber-900">{error}</p>}
      </IonContent>
    </IonPage>
  );

  const jugador = juego.jugador;
  const personajes = juego.personajesCorte;
  const cartasIniciales = setup.cartas_ofrecidas.map(prepararCarta);
  const finalizacion = juego.finalizacion;
  const enConversacion = Boolean(juego.conversacionActual) && !estadisticas && !finalizacion && !decisionConversacion && !juego.resultadoActual;
  const enEvento = Boolean(juego.eventoActual) && !enConversacion && !estadisticas && !finalizacion && !decisionConversacion && !juego.resultadoActual;
  const etapaVisible = estadisticas ? 'estadisticas'
    : finalizacion ? `final:${finalizacion._id}`
    : decisionConversacion ? `consecuencia:${jugador.mes_actual}`
    : juego.resultadoActual ? `resultado:${jugador.mes_actual}`
    : enConversacion ? `conversacion:${juego.conversacionActual._id}`
    : enEvento ? `evento:${juego.eventoActual.id || juego.eventoActual._id}`
    : `${jugador.fase_actual}:${jugador.mes_actual}`;

  return (
    <IonPage>
      <IonContent scrollY className={enConversacion ? undefined : 'narrativo-contenido'}>
        <TransicionNarrativa etapa={etapaVisible}>
        <main className={enConversacion ? 'min-h-screen bg-slate-950' : enEvento ? 'narrativo-evento' : 'narrativo-escena'}>
      {error && <p role="alert" className="rounded border border-amber-300 bg-amber-50 p-3 text-amber-900">{error}</p>}
      {!enConversacion && <div className="narrativo-herramientas">
        {esPartidaNarrativaLocal(date) && <p role="status" title="Partida local de seis meses. El progreso dura mientras la app esté abierta.">Prueba sin servidor</p>}
        {!finalizacion && <button className="rounded border border-slate-300 bg-slate-950/60 px-3 py-1.5 text-sm text-white disabled:opacity-50" disabled={reiniciando} onClick={salirDePrueba}>{reiniciando ? 'Saliendo...' : 'Salir de prueba'}</button>}
      </div>}

      {estadisticas ? <EstadisticasPartidaEtapa5 estado={estadisticas.estado} historial={estadisticas.historial} onVolver={() => setEstadisticas(null)} /> : null}

      {!estadisticas && finalizacion ? <MostrarResultadoEtapa4 finalizacion={finalizacion} onVerEstadisticas={verEstadisticas} cargandoEstadisticas={cargandoEstadisticas} onTerminar={salirDePrueba} reiniciando={reiniciando} /> : null}

      {!estadisticas && !finalizacion && decisionConversacion ? (
        <ConsecuenciaConversacion
          decision={decisionConversacion}
          personajes={personajes}
          onContinuar={() => {
            setDecisionConversacion(null);
            void avanzarAlMesSiguiente();
          }}
        />
      ) : null}

      {!estadisticas && !finalizacion && !decisionConversacion && juego.resultadoActual ? (
        <MostrarResultadoEtapa4 resultado={juego.resultadoActual} onContinuar={continuarDespuesResultado} />
      ) : null}

      {!estadisticas && !finalizacion && !decisionConversacion && !juego.resultadoActual && juego.conversacionActual ? (
        <ResponderConversacionEtapa3
          conversacion={juego.conversacionActual}
          personajes={personajes}
          onElegir={responderConversacionActual}
        />
      ) : null}

      {!estadisticas && !finalizacion && !decisionConversacion && !juego.resultadoActual && !juego.conversacionActual && juego.eventoActual ? (
        <DecidirEventoEtapa2 key={juego.eventoActual.id || juego.eventoActual._id} evento={juego.eventoActual} atributos={jugador.recursos} onElegir={decidirEventoActual} />
      ) : null}

      {!estadisticas && !finalizacion && !decisionConversacion && !juego.resultadoActual && !juego.conversacionActual && !juego.eventoActual && jugador.fase_actual === 'seleccionar_corte' ? (
        <SeleccionarCartasEtapa0y1
          titulo="Forma tu corte"
          descripcion="Elegí tres personajes para comenzar el desafio."
          cartas={personajesDisponibles}
          cantidad={3}
          onConfirmar={(seleccion: any[]) => dispatch(guardarCorte(seleccion))}
        />
      ) : null}

      {!estadisticas && !finalizacion && !decisionConversacion && !juego.resultadoActual && !juego.conversacionActual && !juego.eventoActual && jugador.fase_actual === 'seleccionar_cartas' ? (
        <SeleccionarCartasEtapa0y1
          titulo="Prepara el reino"
          descripcion="Elegí tres cartas para comenzar la partida."
          cartas={cartasIniciales}
          cantidad={3}
          onConfirmar={comenzarPartida}
        />
      ) : null}

      {!estadisticas && !finalizacion && !decisionConversacion && !juego.resultadoActual && !juego.conversacionActual && !juego.eventoActual && jugador.fase_actual === 'draft_mensual' ? (
        <SeleccionarCartasEtapa0y1
          titulo={`Mes ${jugador.mes_actual}`}
          descripcion="Elegí una carta para afrontar el proximo evento."
          cartas={juego.cartasDraft.map(prepararCarta)}
          cantidad={1}
          onConfirmar={elegirCartaDelMes}
        />
      ) : null}
        </main>
        </TransicionNarrativa>
      </IonContent>
    </IonPage>
  );
}
