/* Obtiene la partida del backend y entrega sus datos y acciones a la etapa visible. */
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { configuracionPorEdad, guardarEdad, leerEdad } from '../../../config/adaptacionEdad';
import { componerFondo, CORTE_VACIA } from '../../../config/fondoCorte';
import { imagenPrecargada, precargarImagenes } from '../../../services/assetPreloader';
import type { CartaApi, EstadoPartida, PersonajeApi, SetupPartida } from './narrativeTypes';
import { avanzarNodo, continuarTurno, elegirCartaMensual, iniciarPartida, obtenerSetup,
  obtenerCortePartida, obtenerEstadoPartida, obtenerEstadisticasPartida, reiniciarPartida } from './narrativeService';
import TransicionNarrativa from './COMPARTIDOS/TRANSICION_NARRATIVA/TransicionNarrativa';
import BotonNarrativo from './COMPARTIDOS/BOTON_NARRATIVO/BotonNarrativo';
import MazoUi from './COMPARTIDOS/MAZO_UI/MazoUi';
import ConfiguracionEdad from './COMPARTIDOS/CONFIGURACION_EDAD/ConfiguracionEdad';
import FondoCorte from './COMPARTIDOS/FONDO_CORTE/FondoCorte';
import CargaNarrativa, { prepararImagenes } from './COMPARTIDOS/CARGA_NARRATIVA/CargaNarrativa';
import SeleccionarCartas from './ETAPA_0_1_SELECCIONAR_CARTAS/SeleccionarCartasEtapa0y1';
import MuestraEvento from './ETAPA_0_MUESTRA_EVENTO/MuestraEventoEtapa0';
import Evento from './ETAPA_2_DECIDIR_EVENTO/DecidirEventoEtapa2';
import Conversacion from './ETAPA_3_RESPONDER_CONVERSACION/ResponderConversacionEtapa3';
import Resultado from './ETAPA_4_MOSTRAR_RESULTADO/MostrarResultadoEtapa4';
import Estadisticas from './ETAPA_5_ESTADISTICAS_PARTIDA/EstadisticasPartidaEtapa5';
import './narrativo.css';

// Cada fecha monta su propio gestor y descarta las respuestas de la visita anterior.
export default function KingsCourt() {
  const ubicacion = useLocation().state as { challenge?: { dateKey?: string } } | null;
  const date = ubicacion?.challenge?.dateKey || new Date().toISOString().slice(0, 10);
  return <Partida key={date} date={date} />;
}

// Conserva datos confirmados; selección, lectura y animaciones pertenecen a las etapas.
function Partida({ date }: { date: string }) {
  const navigate = useNavigate();
  // Datos de la partida. Los recursos y las consecuencias siempre los confirma el backend.
  const [setup, setSetup] = useState<SetupPartida | null>(null);
  const [estado, setEstado] = useState<EstadoPartida>({});
  const [personajes, setPersonajes] = useState<PersonajeApi[]>([]);
  const [cartas, setCartas] = useState<CartaApi[]>([]);
  // Estado de presentación: preparación inicial, carga, errores y animaciones.
  const [preparacion, setPreparacion] = useState<'muestra' | 'corte' | 'cartas'>('muestra');
  const [edad, setEdad] = useState(leerEdad);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [porcentaje, setPorcentaje] = useState(0);
  const [mostrarCarga, setMostrarCarga] = useState(true);
  const [intento, setIntento] = useState(0);
  const [verEstadisticas, setVerEstadisticas] = useState(false);
  const [estadisticas, setEstadisticas] = useState<Awaited<ReturnType<typeof obtenerEstadisticasPartida>> | null>(null);
  const [fondo, setFondo] = useState(CORTE_VACIA);
  const [cambioFondo, setCambioFondo] = useState(false);
  const [demorarDialogo, setDemorarDialogo] = useState(false);
  // El ref bloquea el segundo clic inmediatamente, antes del siguiente render.
  const enCurso = useRef(false);
  const activo = useRef(true);
  const config = configuracionPorEdad(edad);
  const grafo = estado.fase_actual?.toUpperCase() === 'DRAFT_MENSUAL' ? null : estado.grafo_actual;
  const finalizacion = estado.finalizacion ?? grafo?.finalizacion;
  const hayResultado = Boolean(estado.resultado_actual || grafo?.nodo_actual.es_final);
  const hayConversacion = grafo?.tipo === 'conversacion' || Boolean(estado.conversacion_actual);
  const hayEvento = Boolean(grafo || estado.evento_actual);

  // Acepta los mapas del servidor completos; un nodo intermedio puede omitirlos.
  const recibir = useCallback(async (respuesta: EstadoPartida, seleccionarAutomaticamente = true) => {
    if (!activo.current) return;
    const primeraCarta = respuesta.cartas_draft_actual?.[0];
    const esDraft = respuesta.fase_actual?.toUpperCase() === 'DRAFT_MENSUAL';
    const omitirSeleccion = !configuracionPorEdad(leerEdad()).permitirCartasMensuales;

    // La recuperación de un error sólo consulta: no debe enviar otra selección automática.
    if (seleccionarAutomaticamente && esDraft && primeraCarta && omitirSeleccion) {
      respuesta = await elegirCartaMensual(date, primeraCarta._id);
    }
    await prepararImagenes(respuesta);
    if (!activo.current) return;
    setEstado(anterior => ({ ...respuesta,
      mes_actual: respuesta.mes_actual ?? anterior.mes_actual,
      recursos: respuesta.recursos ?? respuesta.grafo_actual?.recursos ?? anterior.recursos,
      afinidad: respuesta.afinidad ?? respuesta.grafo_actual?.afinidad ?? anterior.afinidad,
    }));
  }, [date]);

  // Recupera preparación, corte y escena; nunca crea una partida ficticia si falla la red.
  useEffect(() => {
    let vigente = true;
    activo.current = true;
    setMostrarCarga(true);
    setPorcentaje(0);
    setError('');
    const cargar = async () => {
      try {
        const datos = await obtenerSetup(date);
        const [partida, corte] = datos.tiene_partida_activa
          ? await Promise.all([obtenerEstadoPartida(date), obtenerCortePartida(date)]) : [null, null];
        await prepararImagenes([datos, partida, corte], valor => { if (vigente) setPorcentaje(valor); });
        if (!vigente) return;
        setSetup(datos);
        setPersonajes(corte?.corte.map(miembro => miembro.personaje) ?? []);
        setEstado({ recursos: datos.atributos_iniciales });
        setFondo(componerFondo(partida?.recursos ?? datos.atributos_iniciales));
        if (partida) await recibir(partida);
        if (vigente) setPorcentaje(100);
      } catch (fallo) {
        if (vigente) setError(fallo instanceof Error ? fallo.message : 'No se pudo cargar la partida.');
      }
    };
    void cargar();
    return () => { vigente = false; activo.current = false; };
  }, [date, intento, recibir]);

  // El resultado conserva la decoración anterior hasta que el jugador lo termine de leer.
  useEffect(() => {
    if (!hayResultado && !cambioFondo) setFondo(anterior => componerFondo(estado.recursos, anterior));
  }, [estado.recursos, hayResultado, cambioFondo]);

  // Serializa todas las acciones; si una mutación falla, consulta el estado sin repetir el POST.
  const ejecutar = async (accion: () => Promise<void>, recuperar = true) => {
    if (enCurso.current) return;
    enCurso.current = true;
    setOcupado(true);
    setError('');
    try { await accion(); }
    catch (fallo) {
      if (!activo.current) return;
      setError(fallo instanceof Error ? fallo.message : 'No se pudo completar la acción.');
      if (recuperar) {
        try { await recibir(await obtenerEstadoPartida(date), false); }
        catch { /* Mantiene el error original y la última pantalla confirmada. */ }
      }
    } finally {
      enCurso.current = false;
      if (activo.current) { setOcupado(false); setCambioFondo(false); }
    }
  };

  // Sólo la entrada de nuevos adornos intercala la pausa visual de la corte.
  const continuar = () => ejecutar(async () => {
    const siguiente = await continuarTurno(date);
    const nuevoFondo = componerFondo(estado.recursos, fondo);
    const nuevos = [...nuevoFondo.personajes.slice(fondo.personajes.length),
      ...nuevoFondo.oro.slice(fondo.oro.length), ...nuevoFondo.manos.slice(fondo.manos.length)];
    await precargarImagenes(nuevos.map(elemento => elemento.src));
    if (!activo.current) return;
    setDemorarDialogo(nuevos.length > 0);
    if (nuevos.length) {
      setCambioFondo(true);
      setFondo(nuevoFondo);
      const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const duracion = reducirMovimiento ? 0 : 3200;
      await new Promise(resolve => setTimeout(resolve, duracion));
    }
    if (activo.current) await recibir(siguiente);
  });
  // Eventos y conversaciones envían la misma intención al backend.
  const responder = (opcion: string) => ejecutar(async () => {
    const grafoId = grafo?.grafo_id || estado.evento_actual?.id || estado.conversacion_actual?._id || '';
    const respuesta = await avanzarNodo(date, opcion, grafoId);
    await recibir(respuesta);
  });
  // Reinicia el desafío únicamente tras la confirmación del servidor.
  const salir = () => ejecutar(async () => {
    await reiniciarPartida(date);
    if (activo.current) navigate('/juegos/kings-court', { replace: true });
  }, false);
  // La edad sólo cambia la presentación y la selección automática del modo adaptado.
  const cambiarEdad = (valor: number) => {
    guardarEdad(valor);
    setEdad(valor);
    if (!configuracionPorEdad(valor).permitirCartasMensuales && estado.fase_actual?.toUpperCase() === 'DRAFT_MENSUAL')
      void ejecutar(() => recibir(estado));
  };
  // La corte aún es una elección local: se envía junto con las cartas iniciales.
  const confirmarCorte = (seleccion: PersonajeApi[]) => {
    setPersonajes(seleccion);
    setPreparacion('cartas');
  };

  // Guarda las cartas visibles únicamente después de confirmar el inicio en el servidor.
  const comenzarPartida = (seleccion: CartaApi[]) => ejecutar(async () => {
    const corteIds = personajes.map(personaje => personaje._id);
    const cartaIds = seleccion.map(carta => carta._id);
    const respuesta = await iniciarPartida(date, corteIds, cartaIds);
    await recibir(respuesta);
    if (activo.current) setCartas(seleccion);
  });

  // La etapa exige una carta; el gestor envía su ID y conserva la respuesta confirmada.
  const confirmarCartaMensual = ([carta]: CartaApi[]) => ejecutar(async () => {
    if (!carta) return;
    const respuesta = await elegirCartaMensual(date, carta._id);
    await recibir(respuesta);
    if (!activo.current) return;
    setCartas(anteriores => [...anteriores, carta]);
    setDemorarDialogo(false);
  });

  // Al abrir la pantalla, el gestor pide sus datos al backend.
  useEffect(() => {
    if (!verEstadisticas) return;
    let vigente = true;
    setEstadisticas(null);
    setError('');
    obtenerEstadisticasPartida(date)
      .then(datos => { if (vigente) setEstadisticas(datos); })
      .catch(fallo => {
        if (vigente) setError(fallo instanceof Error ? fallo.message : 'No se pudieron cargar las estadísticas.');
      });
    return () => { vigente = false; };
  }, [date, verEstadisticas]);

  // Retira la carga cuando su animación confirma que las imágenes están preparadas.
  const entrar = useCallback(() => setMostrarCarga(false), []);

  // La prioridad evita ocultar un final o un resultado detrás de una escena pendiente.
  // Esta elección sólo decide qué dibujar; no hace avanzar la partida.
  let etapa: string = 'desconocida';
  if (verEstadisticas) etapa = 'estadisticas';
  else if (finalizacion) etapa = 'final';
  else if (cambioFondo) etapa = 'cambio_fondo';
  else if (hayResultado) etapa = 'resultado';
  else if (hayConversacion) etapa = 'conversacion';
  else if (hayEvento) etapa = 'evento';
  else if (estado.fase_actual?.toUpperCase() === 'DRAFT_MENSUAL') etapa = 'draft';
  else if (!estado.fase_actual && !setup?.tiene_partida_activa) etapa = preparacion;

  const etapaVisible = `${etapa}:${grafo?.grafo_id || estado.conversacion_actual?._id || estado.evento_actual?.id || estado.mes_actual || ''}`;
  const modoSimple = !config.mostrarNumeros;
  let pantalla: ReactNode = null;
  if (setup) switch (etapa) {
    case 'muestra':
      pantalla = <MuestraEvento eventos={setup.eventos_del_dia ?? []} onContinuar={() => setPreparacion('corte')} />;
      break;
    case 'corte':
      pantalla = <SeleccionarCartas key={etapaVisible} enviando={ocupado} titulo="Forma tu corte" descripcion="Elegí tres personajes para comenzar el desafio." cartas={setup.personajes_ofrecidos} cantidad={3}
      onConfirmar={confirmarCorte} />;
      break;
    case 'cartas':
      pantalla = <SeleccionarCartas key={etapaVisible} enviando={ocupado} titulo="Prepara el reino" descripcion="Elegí tres cartas para comenzar la partida." cartas={setup.cartas_ofrecidas} cantidad={3}
      onConfirmar={comenzarPartida} />;
      break;
    case 'draft':
      pantalla = <SeleccionarCartas key={etapaVisible} enviando={ocupado} titulo={`Mes ${estado.mes_actual}`} descripcion="Elegí una carta para afrontar el proximo evento." cartas={estado.cartas_draft_actual ?? []} cantidad={1}
      onConfirmar={confirmarCartaMensual} />;
      break;
    case 'evento':
      pantalla = <Evento key={etapaVisible} evento={estado.evento_actual ?? undefined} grafo={grafo ?? undefined} atributos={estado.recursos ?? {}} fondoBase={fondo}
      modoSimple={modoSimple} demorarDialogoPorFondo={demorarDialogo} enviando={ocupado} onElegir={responder} />;
      break;
    case 'conversacion':
      pantalla = <Conversacion key={etapaVisible} conversacion={estado.conversacion_actual ?? undefined} grafo={grafo ?? undefined} personajes={personajes}
      modoSimple={modoSimple} enviando={ocupado} onElegir={responder} />;
      break;
    case 'resultado':
    case 'final':
      pantalla = <Resultado resultado={estado.resultado_actual ?? undefined} grafo={grafo ?? undefined} finalizacion={finalizacion ?? undefined}
      modoSimple={modoSimple} continuando={ocupado} onContinuar={finalizacion ? undefined : continuar} reiniciando={ocupado} onTerminar={salir}
      onVerEstadisticas={finalizacion ? () => setVerEstadisticas(true) : undefined} />;
      break;
    case 'estadisticas':
      pantalla = estadisticas
        ? <Estadisticas {...estadisticas} recursosIniciales={setup.atributos_iniciales} cartas={cartas}
            personajes={personajes} finalizacion={finalizacion} modoSimple={modoSimple} onVolver={() => setVerEstadisticas(false)} />
        : <section aria-label="Estadísticas">
            <p role="status">{error ? 'No se pudieron cargar las estadísticas.' : 'Cargando estadísticas...'}</p>
            <BotonNarrativo onClick={() => setVerEstadisticas(false)}>Volver al cierre</BotonNarrativo>
          </section>;
      break;
    case 'cambio_fondo':
      pantalla = <section className="flex-1" aria-label="La corte muestra el cambio" />;
      break;
    default:
      pantalla = <p role="alert">La fase {estado.fase_actual} no tiene contenido para mostrar. Volvé a intentar o salí de prueba.
      <BotonNarrativo disabled={ocupado} onClick={() => ejecutar(async () => recibir(await obtenerEstadoPartida(date)))}>Volver a intentar</BotonNarrativo></p>;
  }

  const enConversacion = etapa === 'conversacion';
  const enEvento = etapa === 'evento';
  const fondoVisible = mostrarCarga || ['muestra', 'corte', 'cartas'].includes(etapa) ? CORTE_VACIA : fondo;
  const estiloEdad = {
    '--narrativo-texto-adaptado': `${config.tamanioTexto}px`, '--narrativo-control-adaptado': `${config.altoControl}px`,
    '--narrativo-personaje-visible-svh': `${70 * config.fraccionVisiblePersonaje}svh`,
    '--narrativo-personaje-visible-rem': `${32 * config.fraccionVisiblePersonaje}rem`,
  } as CSSProperties;
  const claseEscena = enConversacion ? 'narrativo-conversacion relative z-10 min-h-screen'
    : enEvento ? 'narrativo-evento relative z-10 min-h-full text-white'
    : 'relative z-10 isolate mx-auto flex min-h-full max-w-[1240px] flex-col gap-3 px-5 pt-[max(8px,env(safe-area-inset-top))] pb-[max(12px,env(safe-area-inset-bottom))] text-white max-md:gap-2 max-md:px-3';
  const claseHerramientas = `narrativo-herramientas flex min-h-[30px] items-center justify-end gap-2 text-xs max-md:flex-nowrap max-md:[&>p]:hidden [&>p]:mr-auto [&>p]:mb-0 [&>p]:text-shadow-[0_1px_3px_#000] ${enConversacion
    ? 'absolute inset-x-3 top-[max(8px,env(safe-area-inset-top))] z-[60]'
    : enEvento ? 'absolute inset-x-4 top-[max(8px,env(safe-area-inset-top))] z-50' : 'flex-wrap'}`;

  return <IonPage><IonContent scrollY={!enConversacion} className="narrativo-contenido" style={{ '--narrativo-fondo-base': `url("${imagenPrecargada(fondo.src)}")` } as CSSProperties}>
    <FondoCorte fondo={fondoVisible} atenuado sinTinte={enEvento || cambioFondo} destacado={cambioFondo} fijo />
    {mostrarCarga || !setup ? <CargaNarrativa porcentaje={porcentaje} listo={porcentaje === 100} mensaje={porcentaje ? 'Preparando personajes y escenarios…' : 'Reuniendo las historias del reino…'}
      error={error} onReintentar={() => setIntento(valor => valor + 1)} onEntrar={entrar} />
      : <TransicionNarrativa etapa={etapaVisible}>
        <main style={config.adaptado ? estiloEdad : undefined} className={`${claseEscena}${config.adaptado ? ' narrativo-modo-mayor' : ''}`}>
          {error && <p role="alert" className="relative z-50 rounded border border-amber-300 bg-amber-50 p-3 text-amber-900">{error}</p>}
          <div className={claseHerramientas}>
            <MazoUi cartas={config.permitirCartasMensuales ? cartas : []} personajes={personajes} mostrarCantidad={config.mostrarNumeros} />
            <ConfiguracionEdad edad={edad} onGuardar={cambiarEdad} />
            {!finalizacion && <BotonNarrativo disabled={ocupado} onClick={salir}>{ocupado ? 'Esperando...' : 'Salir de prueba'}</BotonNarrativo>}
          </div>
          {pantalla}
        </main>
      </TransicionNarrativa>}
  </IonContent></IonPage>;
}
