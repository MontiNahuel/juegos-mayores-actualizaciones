import { useEffect, useRef, useState } from 'react';
import { prepararImagenes } from '../COMPARTIDOS/CARGA_NARRATIVA/CargaNarrativa';
import type { CartaApi, EstadoPartida, PersonajeApi, SetupPartida } from '../narrativeTypes';
import {
  obtenerDatosIniciales, obtenerEstadoPartida, obtenerEstadisticasPartida,
  iniciarPartida, elegirCartaMensual, avanzarNodo, continuarTurno, reiniciarPartida,
} from './narrativeService';

type VistaEstadisticas = { datos?: Awaited<ReturnType<typeof obtenerEstadisticasPartida>>; error?: string };

// Los nodos parciales pueden omitir el mes y los saldos confirmados previamente.
function reconciliarEstado(respuesta: EstadoPartida, anterior: EstadoPartida): EstadoPartida {
  const { grafo_actual: grafo } = respuesta;
  return {
    ...respuesta,
    mes_actual: respuesta.mes_actual ?? anterior.mes_actual,
    recursos: respuesta.recursos ?? grafo?.recursos ?? anterior.recursos,
    afinidad: respuesta.afinidad ?? grafo?.afinidad ?? anterior.afinidad,
  };
}

// Coordina las lecturas y decisiones de una partida montada para una única fecha.
export function usePartidaNarrativa(date: string) {
  const [setup, setSetup] = useState<SetupPartida | null>(null);
  const [estado, setEstado] = useState<EstadoPartida>({});
  const [personajes, setPersonajes] = useState<PersonajeApi[]>([]);
  const [cartas, setCartas] = useState<CartaApi[]>([]);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [porcentaje, setPorcentaje] = useState(0);
  const [intento, setIntento] = useState(0);
  const [estadisticas, setEstadisticas] = useState<VistaEstadisticas | null>(null);
  // El ref bloquea el segundo clic inmediatamente, antes del siguiente render.
  const enCurso = useRef(false);
  const activo = useRef(true);
  const esDraft = estado.fase_actual?.toUpperCase() === 'DRAFT_MENSUAL';
  const grafo = esDraft ? null : estado.grafo_actual;
  const idEscena = grafo?.grafo_id || estado.conversacion_actual?._id || estado.evento_actual?.id;
  const hayResultado = Boolean(estado.resultado_actual || grafo?.nodo_actual.es_final);

  // Precarga la escena antes de aplicar una respuesta durante la partida.
  const recibir = async (respuesta: EstadoPartida) => {
    if (!activo.current) return;
    await prepararImagenes(respuesta);
    if (activo.current) setEstado(anterior => reconciliarEstado(respuesta, anterior));
  };

  // Recupera preparación, corte y escena; nunca crea una partida ficticia si falla la red.
  useEffect(() => {
    let vigente = true;
    activo.current = true;
    setPorcentaje(0);
    setError('');
    const cargar = async () => {
      try {
        const { setup: datos, partida, corte } = await obtenerDatosIniciales(date);
        await prepararImagenes([datos, partida, corte], valor => { if (vigente) setPorcentaje(valor); });
        if (!vigente) return;
        const estadoInicial = reconciliarEstado(partida ?? {}, { recursos: datos.atributos_iniciales });
        setSetup(datos);
        setPersonajes(corte?.corte.map(miembro => miembro.personaje) ?? []);
        setEstado(estadoInicial);
        setPorcentaje(100);
      } catch (fallo) {
        if (vigente) setError(fallo instanceof Error ? fallo.message : 'No se pudo cargar la partida.');
      }
    };
    void cargar();
    return () => { vigente = false; activo.current = false; };
  }, [date, intento]);

  // Cada apertura tiene su propia solicitud. Una respuesta tardía sólo actualiza su apertura.
  const abrirEstadisticas = async () => {
    const pendiente: VistaEstadisticas = {};
    setEstadisticas(pendiente);
    setError('');
    let respuesta: VistaEstadisticas;
    try {
      respuesta = { datos: await obtenerEstadisticasPartida(date) };
    } catch (fallo) {
      respuesta = { error: fallo instanceof Error ? fallo.message : 'No se pudieron cargar las estadísticas.' };
    }
    if (activo.current) setEstadisticas(actual => actual === pendiente ? respuesta : actual);
  };
  const cerrarEstadisticas = () => setEstadisticas(null);

  // Serializa todas las acciones; si una mutación falla, consulta el estado sin repetir el POST.
  const ejecutar = async (accion: (recuperarEstado: () => Promise<EstadoPartida>) => Promise<void>, recuperar = true) => {
    if (enCurso.current) return;
    enCurso.current = true;
    setOcupado(true);
    setError('');
    // Una acción comparte su consulta de recuperación, incluso si la solicita el servicio.
    let consulta: Promise<EstadoPartida> | undefined;
    const recuperarEstado = () => consulta ??= obtenerEstadoPartida(date).catch(error => {
      consulta = undefined; // Un fallo transitorio permite un nuevo intento de recuperación.
      throw error;
    });
    try { await accion(recuperarEstado); }
    catch (fallo) {
      if (!activo.current) return;
      setError(fallo instanceof Error ? fallo.message : 'No se pudo completar la acción.');
      if (recuperar) {
        try { await recibir(await recuperarEstado()); }
        catch { /* Mantiene el error original y la última pantalla confirmada. */ }
      }
    } finally {
      enCurso.current = false;
      if (activo.current) setOcupado(false);
    }
  };

  // Continúa el turno después de preparar la transición visual de la corte.
  const continuar = () => ejecutar(async (recuperarEstado) => {
    const siguiente = await continuarTurno(date, recuperarEstado);
    await recibir(siguiente);
  });
  // Eventos y conversaciones envían la misma intención al backend.
  const responder = (opcion: string) => ejecutar(async () => recibir(await avanzarNodo(date, opcion, idEscena || '')));
  // Reintento de lectura: hace una sola consulta y muestra el fallo si no responde.
  const recargarEstado = () => ejecutar(async () => recibir(await obtenerEstadoPartida(date)), false);

  // Reinicia el desafío únicamente tras la confirmación del servidor.
  const reiniciar = (alReiniciar: () => void) => ejecutar(async () => {
    await reiniciarPartida(date);
    if (activo.current) alReiniciar();
  }, false);

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
  });

  return {
    setup, estado, personajes, setPersonajes, cartas, ocupado, error, porcentaje, estadisticas,
    esDraft, grafo, idEscena, hayResultado, abrirEstadisticas, cerrarEstadisticas,
    continuar, responder, recargarEstado, reiniciar, comenzarPartida, confirmarCartaMensual,
    reintentarCarga: () => setIntento(valor => valor + 1),
  };
}
