import { presentarResolucion } from './commanderNarrativo';
import type { EstadoPartida } from './narrativeService';
/* Coordina las etapas narrativas y sincroniza las decisiones de la partida. */
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_URL } from '../../../config/api';
import { configuracionPorEdad, guardarEdad, leerEdad } from '../../../config/adaptacionEdad';
import {
  actualizarFondoBase, configurarEdadNarrativa, elegirCarta, finalizarPartida,
  guardarCartasDraft, guardarCartasIniciales, guardarCorte, guardarPersonajesCorte,
  guardarResultado, iniciarJugador, limpiarResultado, mostrarConversacion, mostrarEvento,
  reiniciarSeleccionNarrativa, sincronizarPartida,
} from '../../../store/narrativoSelectionSlice';
import {
  agregarCondicionesSecretas, avanzarNodo, continuarTurno, elegirCartaMensual, esPartidaNarrativaLocal,
  iniciarPartida, obtenerCortePartida, obtenerEstadoPartida, obtenerHistorialPartida,
  reiniciarPartida, type ConversacionApi,
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
import FondoCorte from './COMPARTIDOS/FONDO_CORTE/FondoCorte';
import CargaNarrativa from './COMPARTIDOS/CARGA_NARRATIVA/CargaNarrativa';
import { CABALLO_CARGA, prepararCargaNarrativa, imagenesDelContenido } from './recursos/precargaNarrativa';
import { imagenPrecargada, precargarImagenes } from '../../../services/assetPreloader';
import { iniciarCargaNarrativa, actualizarCargaNarrativa, fallarCargaNarrativa } from '../../../store/narrativoCargaSlice';
import type { RootState } from '../../../store/store';
import { GUARDIAS_CORTE, MANOS_CORTE, ORO_CORTE, cantidadManosPorPueblo, cantidadPorTramo, type EstadoFondoCorte } from '../../../config/fondoCorte';
import './narrativo.css';

// Tiempo para ver el cambio en la corte antes de abrir la próxima escena.
const DURACION_CAMBIO_FONDO_MS = 3200;

// Unifica los datos de cada carta y completa la URL de su imagen.
const prepararCarta = (carta: any) => ({
  ...carta,
  id: carta.id || carta._id,
  nombre: carta.nombre || carta.titulo,
  imagen: carta.imagen ? imagenPrecargada(carta.imagen.startsWith('/') ? `${API_URL}${carta.imagen}` : carta.imagen) : carta.imagen,
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
  const carga = useSelector((state: RootState) => state.narrativoCarga);
  const [mostrarBuffer, setMostrarBuffer] = useState(true);
  const [intentoCarga, setIntentoCarga] = useState(0);
  // Prepara la entrada a la partida cuando la carga está lista.
  const entrarAlJuego = useCallback(() => setMostrarBuffer(false), []);
  const [setup, setSetup] = useState<any>(null);
  const [personajesDisponibles, setPersonajesDisponibles] = useState<any[]>([]);
  const [continuando, setContinuando] = useState(false);
  const [respondiendo, setRespondiendo] = useState(false);
  const respuestaEnCurso = useRef(false);
  const continuacionEnCurso = useRef(false);
  const [estadisticas, setEstadisticas] = useState<any>(null);
  const [cargandoEstadisticas, setCargandoEstadisticas] = useState(false);
  const [reiniciando, setReiniciando] = useState(false);
  const [error, setError] = useState('');
  const [edad, setEdad] = useState<number | null>(leerEdad);
  const [mostrarMuestraEvento, setMostrarMuestraEvento] = useState(false);
  const [cambioFondo, setCambioFondo] = useState(false);
  const [demorarDialogoPorFondo, setDemorarDialogoPorFondo] = useState(false);
  const temporizadorCambio = useRef<number | null>(null);
  const secuenciaCambio = useRef(0);

  useEffect(() => () => {
    secuenciaCambio.current += 1;
    if (temporizadorCambio.current !== null) window.clearTimeout(temporizadorCambio.current);
  }, []);

  const config = configuracionPorEdad(edad);
  const modoMayor = config.adaptado;
  // La pausa sólo corresponde si el cambio agrega un elemento nuevo a la corte.
  const guardiasEsperados = cantidadPorTramo(Number(juego.jugador.recursos.ejercito)) ?? juego.fondoBase.personajes.length;
  const oroEsperado = cantidadPorTramo(Number(juego.jugador.recursos.oro)) ?? juego.fondoBase.oro.length;
  const puebloActual = Number(juego.jugador.recursos.pueblo);
  const manosEsperadas = Number.isFinite(puebloActual) ? cantidadManosPorPueblo(puebloActual) : juego.fondoBase.manos.length;
  const cambioFondoPendiente = Boolean(juego.resultadoActual) &&
    (guardiasEsperados > juego.fondoBase.personajes.length || oroEsperado > juego.fondoBase.oro.length || manosEsperadas > juego.fondoBase.manos.length);
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

  // El resultado conserva la corte anterior; la nueva composición entra al mostrarla entre escenas.
  useEffect(() => {
    if (juego.resultadoActual) return;
    dispatch(actualizarFondoBase({ ejercito: juego.jugador.recursos.ejercito, oro: juego.jugador.recursos.oro, pueblo: juego.jugador.recursos.pueblo }));
  }, [dispatch, juego.jugador.recursos.ejercito, juego.jugador.recursos.oro, juego.jugador.recursos.pueblo, juego.resultadoActual]);

  // Ejecuta una petición y muestra el error sin interrumpir la partida.
  const pedir = async <T,>(accion: () => Promise<T>, mensaje: string): Promise<T | null> => {
    try {
      setError('');
      const data = await accion();
      // Si la API agregó una ilustración nueva, se prepara mientras sigue visible la escena anterior.
      await precargarImagenes(imagenesDelContenido(data));
      return data;
    } catch (e: unknown) {
      setError(`${mensaje}${e instanceof Error ? ` ${e.message}` : ''}`);
      return null;
    }
  };

  // Enriquece y guarda cada evento con sus condiciones antes de mostrarlo.
  const guardarEventoLocal = async (evento: any) => dispatch(mostrarEvento(await agregarCondicionesSecretas(evento)));

  // En modo adaptado pide el evento sin agregar la carta al mazo.
  const abrirEventoSinCarta = async (cartas: any[]) => {
    if (!cartas[0]) return;
    const data = await pedir(() => elegirCartaMensual(date, cartas[0].id || cartas[0]._id), 'No se pudo preparar la siguiente decision.');
    if (data) await mostrarEstado(data);
  };

  // Abre la selección mensual o salta al evento según la edad.
  const cargarDraft = async (cartas: any[], desdeServidor = false) => {
    const draft = cartas.map(prepararCarta);
    if ((desdeServidor ? configuracionPorEdad(leerEdad()) : config).permitirCartasMensuales) {
      setDemorarDialogoPorFondo(false);
      dispatch(guardarCartasDraft(draft));
    } else await abrirEventoSinCarta(draft);
  };

  // Recupera la etapa pendiente del servidor sin reemplazar al jugador local.
  const mostrarEstado = async (estado: EstadoPartida) => {
    if (!estado) return;
    await presentarResolucion(estado, {
      sincronizar: datos => { dispatch(sincronizarPartida(datos)); },
      finalizar: final => { dispatch(finalizarPartida(final)); },
      resultado: resultado => { dispatch(guardarResultado(resultado)); },
      conversar: conversacion => { dispatch(mostrarConversacion(conversacion)); },
      evento: guardarEventoLocal,
      draft: cartas => cargarDraft(cartas, true),
      // Una partida vieja o incompleta no tiene pantalla: sin aviso quedaba en blanco.
      sinEtapa: () => setError(`La partida quedó guardada en la fase ${estado.fase_actual || 'desconocida'} sin contenido para mostrar. Usá "Salir de prueba" para comenzar de nuevo.`),
    });
  };

  // Intenta restaurar la pantalla cuando falla la selección de carta.
  const recuperarFase = async () => {
    try { await mostrarEstado(await obtenerEstadoPartida(date)); }
    catch { /* Conserva el error original. */ }
  };

  // Carga el desafío y, si existe, restaura la partida activa.
  useEffect(() => {
    let activo = true;
    setMostrarBuffer(true);
    dispatch(iniciarCargaNarrativa(date));
    const trabajo = prepararCargaNarrativa(date, progreso => {
      if (activo) dispatch(actualizarCargaNarrativa(progreso));
    });
    // Inicializa el jugador y recupera su corte y su etapa pendiente.
    const cargar = async () => {
      try {
        const data = await trabajo.promesa;
        if (!activo) return;

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
        if (data.tiene_partida_activa && !esPartidaNarrativaLocal(date)) {
          const [estado, corte] = await Promise.all([
            pedir(() => obtenerEstadoPartida(date), 'No se pudo recuperar el contenido de la partida activa.'),
            pedir(() => obtenerCortePartida(date), 'No se pudo recuperar la corte de la partida activa.'),
          ]);
          if (!activo) return;
          if (!estado) throw new Error('No se pudo recuperar la partida activa. Volvé a intentar.');
          if (corte?.corte) dispatch(guardarPersonajesCorte(corte.corte.map(({ personaje }: any) => prepararCarta(personaje))));
          await mostrarEstado(estado);
          const fondo = (store.getState() as RootState).narrativoSelection.fondoBase as EstadoFondoCorte;
          await precargarImagenes([fondo.src, ...[...fondo.personajes, ...fondo.oro, ...fondo.manos].map(x => x.src)]);
        }
        if (activo) {
          const progreso = (store.getState() as RootState).narrativoCarga;
          dispatch(actualizarCargaNarrativa({ ...progreso, fase: 'lista', porcentaje: 100 }));
        }
      } catch (e) {
        if (activo) dispatch(fallarCargaNarrativa(e instanceof Error ? e.message : 'No se pudo preparar el juego. Revisá la conexión y volvé a intentar.'));
      }
    };
    void cargar();
    return () => { activo = false; trabajo.desconectar(); };
  }, [date, dispatch, intentoCarga]);

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
    // El servidor aplica la amortiguación del modo adaptado; el front sólo informa la dificultad.
    const dificultad = config.adaptado ? 'facil' : 'normal';
    const data = await pedir(
      () => iniciarPartida(date, jugadorActual().corte_activa, cartas.map(carta => carta.id), dificultad),
      'Las cartas quedaron elegidas, pero no se pudo pedir el siguiente draft.'
    );
    if (!data) return;
    dispatch(guardarCartasIniciales(cartas));
    await mostrarEstado(data);
  };

  // Selecciona una carta mensual y abre el evento siguiente.
  const elegirCartaDelMes = async ([carta]: any[]) => {
    const data = await pedir(() => elegirCartaMensual(date, carta.id), 'No se pudo seleccionar la carta.');
    if (!data) {
      await recuperarFase();
      return;
    }
    dispatch(elegirCarta(carta));
    await mostrarEstado(data);
  };

  // Guarda la decisión en el motor V2 de grafos y procesa el siguiente paso o desenlace.
  const decidirEventoActual = async (opcionId: string) => {
    if (respuestaEnCurso.current) return;
    respuestaEnCurso.current = true;
    setRespondiendo(true);
    const evento = juego.eventoActual;
    try {
      const data = await pedir(
        () => avanzarNodo(date, opcionId, evento?.id || evento?.nodo_id || ''),
        'No se pudo guardar la decisión.'
      );
      if (data) await mostrarEstado(data);
      const final = data?.finalizacion || finalPorRecurso(jugadorActual().recursos);
      if (final) dispatch(finalizarPartida(final));
    } finally {
      respuestaEnCurso.current = false;
      setRespondiendo(false);
    }
  };

  // Sólo intercala la corte si un recurso cruzó un umbral y agregó un asset visible.
  const continuarResultado = async () => {
    if (continuacionEnCurso.current) return;
    continuacionEnCurso.current = true;
    setContinuando(true);
    try {
      // Mantiene el resultado y el mes visibles hasta recibir la confirmación del servidor.
      const data = await pedir(() => continuarTurno(date), 'No se pudo continuar la partida. Volvé a intentar.');
      if (!data) return;
      const antesGuardias = juego.fondoBase.personajes.length;
      const antesOro = juego.fondoBase.oro.length;
      const antesManos = juego.fondoBase.manos.length;
      const despuesGuardias = guardiasEsperados;
      const despuesOro = oroEsperado;
      const despuesManos = manosEsperadas;
      if (!cambioFondoPendiente) {
        setDemorarDialogoPorFondo(false);
        dispatch(limpiarResultado());
        await mostrarEstado(data);
        return;
      }

      // Sólo el próximo evento directo espera la entrada visual de un asset nuevo.
      setDemorarDialogoPorFondo(true);
      setCambioFondo(true);
      dispatch(limpiarResultado());

      // Espera la decodificación para que el nuevo asset no aparezca de golpe al terminar la pausa.
      const secuencia = ++secuenciaCambio.current;
      const nuevos = [
        ...GUARDIAS_CORTE.slice(antesGuardias, despuesGuardias),
        ...ORO_CORTE.slice(antesOro, despuesOro),
        ...MANOS_CORTE.slice(antesManos, despuesManos),
      ];
      await precargarImagenes(nuevos.map(({ src }) => src));
      if (secuencia !== secuenciaCambio.current) return;
      const duracion = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : DURACION_CAMBIO_FONDO_MS;
      await new Promise<void>(resolve => {
        temporizadorCambio.current = window.setTimeout(resolve, duracion);
      });
      temporizadorCambio.current = null;
      if (secuencia !== secuenciaCambio.current) return;
      await mostrarEstado(data);
      setCambioFondo(false);
    } finally {
      continuacionEnCurso.current = false;
      setContinuando(false);
    }
  };

  // Envía una única decisión y conserva la intervención hasta recibir la siguiente del servidor.
  const responderActual = async (decision: ConversacionApi['decisiones'][number]) => {
    // Un doble toque no debe consumir dos nodos del grafo en el servidor.
    if (respuestaEnCurso.current) return;
    respuestaEnCurso.current = true;
    setRespondiendo(true);
    try {
      const data = await pedir(
        () => avanzarNodo(date, String(decision.opcion), juego.conversacionActual?._id || juego.conversacionActual?.nodo_id || ''),
        'No se pudo guardar la respuesta.'
      );
      if (data) await mostrarEstado(data);
    } finally {
      respuestaEnCurso.current = false;
      setRespondiendo(false);
    }
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
      const [estado, historial, corte] = await Promise.all([
        obtenerEstadoPartida(date), obtenerHistorialPartida(date),
        obtenerCortePartida(date).catch(() => null),
      ]);
      setEstadisticas({ estado, historial, corte });
    } catch (e: any) {
      setError(`No se pudieron cargar las estadisticas. ${e?.message || ''}`);
    } finally { setCargandoEstadisticas(false); }
  };

  if (!setup || mostrarBuffer) return (
    <IonPage><IonContent scrollY={false} className="narrativo-contenido" style={{ '--narrativo-fondo-base': `url("${imagenPrecargada(juego.fondoBase.src)}")` } as CSSProperties}>
      {/* Misma capa que en la partida: React conserva la imagen al terminar la carga. */}
      <FondoCorte fondo={{ ...juego.fondoBase, personajes: [], oro: [], manos: [] }} atenuado fijo />
      <CargaNarrativa porcentaje={carga.porcentaje} listo={carga.fase === 'lista'} caballo={imagenPrecargada(CABALLO_CARGA)}
        mensaje={carga.fase === 'preparando' ? 'Reuniendo las historias del reino…' : 'Preparando personajes y escenarios…'}
        error={carga.error} onReintentar={() => setIntentoCarga(intento => intento + 1)} onEntrar={entrarAlJuego} />
    </IonContent></IonPage>
  );

  const { jugador, personajesCorte: personajes, finalizacion } = juego;
  const etapa = estadisticas ? 'estadisticas' : finalizacion ? 'final' : cambioFondo ? 'cambio_fondo'
    : juego.resultadoActual ? 'resultado' : juego.conversacionActual ? 'conversacion'
    : juego.eventoActual ? 'evento' : mostrarMuestraEvento ? 'muestra_evento' : jugador.fase_actual;
  const etapaVisible = ({
    estadisticas: 'estadisticas', final: `final:${finalizacion?._id}`,
    resultado: `resultado:${jugador.mes_actual}`,
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
    case 'cambio_fondo':
      pantalla = <section className="flex-1" aria-label="La corte muestra el cambio" />;
      break;
    case 'muestra_evento':
      pantalla = <MuestraEventoEtapa0
        eventos={setup.eventos_del_dia || setup.eventos_ofrecidos || setup.cartas_evento || []}
        onContinuar={() => setMostrarMuestraEvento(false)}
      />;
      break;
    case 'estadisticas':
      pantalla = <EstadisticasPartidaEtapa5
        estado={estadisticas.estado} historial={estadisticas.historial} corte={estadisticas.corte}
        recursosIniciales={setup.atributos_iniciales}
        personajes={personajes} finalizacion={finalizacion} modoSimple={!config.mostrarNumeros}
        onVolver={() => setEstadisticas(null)}
      />;
      break;
    case 'final':
      pantalla = <MostrarResultadoEtapa4 finalizacion={finalizacion} onVerEstadisticas={verEstadisticas} cargandoEstadisticas={cargandoEstadisticas} onTerminar={salirDePrueba} reiniciando={reiniciando} />;
      break;
    case 'resultado':
      pantalla = <MostrarResultadoEtapa4 resultado={juego.resultadoActual} efectoTexto={!config.mostrarNumeros ? describirEfectos(juego.resultadoActual) : undefined} continuando={continuando} onContinuar={continuarResultado} />;
      break;
    case 'conversacion':
      // El grafo identifica la escena; el nodo sólo cambia la intervención dentro de ella.
      pantalla = <ResponderConversacionEtapa3 key={juego.conversacionActual._id} conversacion={juego.conversacionActual} personajes={personajes} modoSimple={!config.mostrarNumeros} enviando={respondiendo} onElegir={responderActual} />;
      break;
    case 'evento':
      pantalla = <DecidirEventoEtapa2 key={etapaVisible} evento={juego.eventoActual} atributos={jugador.recursos} fondoBase={juego.fondoBase} personajes={personajes} afinidad={jugador.afinidad} tags={jugador.tags_activos} cartas={jugador.cartas_en_mano} modoSimple={!config.mostrarNumeros} demorarDialogoPorFondo={demorarDialogoPorFondo} enviando={respondiendo} onElegir={decidirEventoActual} />;
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
  // La corte permanece montada bajo todas las etapas; sólo su decoración espera a preparación.
  const mostrarDecoracion = !['seleccionar_corte', 'seleccionar_cartas', 'muestra_evento'].includes(etapa);
  const fondoVisible = mostrarDecoracion ? juego.fondoBase : { ...juego.fondoBase, personajes: [], oro: [], manos: [] };
  const claseEscena = enConversacion
    ? 'narrativo-conversacion relative z-10 min-h-screen'
    : enEvento
      ? 'narrativo-evento relative z-10 min-h-full text-white'
      : 'relative z-10 isolate mx-auto flex min-h-full max-w-[1240px] flex-col gap-3 px-5 pt-[max(8px,env(safe-area-inset-top))] pb-[max(12px,env(safe-area-inset-bottom))] text-white max-md:gap-2 max-md:px-3';
  const claseHerramientas = `narrativo-herramientas flex min-h-[30px] items-center justify-end gap-2 text-xs max-md:flex-nowrap max-md:[&>p]:hidden [&>p]:mr-auto [&>p]:mb-0 [&>p]:text-shadow-[0_1px_3px_#000] ${enConversacion
    ? 'absolute inset-x-3 top-[max(8px,env(safe-area-inset-top))] z-[60]'
    : enEvento ? 'absolute inset-x-4 top-[max(8px,env(safe-area-inset-top))] z-50' : 'flex-wrap'}`;

  return (
    <IonPage>
      <IonContent scrollY={!enConversacion} className="narrativo-contenido" style={{ '--narrativo-fondo-base': `url("${imagenPrecargada(juego.fondoBase.src)}")` } as CSSProperties}>
        {/* La corte queda sin azul en eventos; las imágenes propias conservan su velo en la etapa. */}
        <FondoCorte fondo={fondoVisible} atenuado sinTinte={enEvento || etapa === 'cambio_fondo'} destacado={etapa === 'cambio_fondo'} fijo />
        <TransicionNarrativa etapa={etapaVisible}>
          <main style={modoMayor ? estiloEdad : undefined} className={`${claseEscena}${modoMayor ? ' narrativo-modo-mayor' : ''}`}>
            {error && <p role="alert" className="relative z-50 rounded border border-amber-300 bg-amber-50 p-3 text-amber-900">{error}</p>}
            <div className={claseHerramientas}>
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
