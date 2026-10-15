import { IonContent, IonPage } from '@ionic/react';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { actualizarAtributos } from '../../../store/narrativoSelectionSlice';
import { GameHeader } from '../../COMPONENTS/GameHeader';
import CardSelection from './CARDSELECTION/CardSelection';
import type { CardData } from './CARDSELECTION/card';
import ConversacionActual from './ConversacionActual';
import EventoActual from './EventoActual';
import ResultadoActual from './ResultadoActual';
import {
  avanzarMes,
  decidirEvento,
  elegirCartaMensual,
  iniciarPartida,
  obtenerPartida,
  obtenerSetup,
  responderConversacion,
  type ConversacionApi,
  type EstadoPartida,
  type FinalizacionApi,
  type SetupPartida,
} from './narrativeService';

type ChallengeState = { challenge?: { dateKey?: string } };
type Decision = ConversacionApi['decisiones'][number];

const crearFinalizacion = (recursos: Record<string, number>): FinalizacionApi => {
  const recursoAgotado = Object.entries(recursos).find(([, valor]) => valor <= 0)?.[0];
  const derrota = Boolean(recursoAgotado);

  return {
    _id: derrota ? `fin_${recursoAgotado}_cero` : 'fin_victoria',
    recurso_clave: recursoAgotado || null,
    tipo: derrota ? 'derrota_recurso' : 'victoria_tiempo',
    titulo: derrota ? `El reino se quedó sin ${recursoAgotado}` : 'El reinado llega a su fin',
    texto: derrota ? `El recurso ${recursoAgotado} llegó a cero y el reino no pudo sostenerse.` : 'La corte superó los doce meses de reinado.',
    imagen: '/assets/narrative/finalizaciones/default.webp',
    rango: derrota ? 'F' : null,
  };
};

const toCard = (item: { _id: string; nombre: string; descripcion: string; imagen: string; categoria?: string; titulo?: string }): CardData => ({
  id: item._id,
  nombre: item.nombre,
  descripcion: item.descripcion,
  imagen: item.imagen,
  categoria: item.categoria === 'personaje' ? 'Personaje' : item.categoria || item.titulo,
});

function ConsecuenciaConversacion({ decision, partida, onContinuar }: {
  decision: Decision;
  partida: EstadoPartida;
  onContinuar: () => void;
}) {
  const nombres = new Map(partida.personajes_corte.map(({ _id, nombre }) => [_id, nombre]));

  return (
    <section className="mx-auto max-w-2xl p-6 text-center">
      <p className="text-sm font-medium text-slate-500">Consecuencia de la conversación</p>
      <h2 className="mt-2 text-2xl font-bold">Decisión tomada</h2>
      <p className="mt-5 text-slate-700">{decision.resultado_texto}</p>
      <div className="mt-6 grid gap-2 text-left">
        {decision.impacto_afinidad.map(({ personaje_id, delta }) => (
          <p className="rounded border border-slate-200 bg-slate-50 p-3" key={personaje_id}>
            Afinidad con {nombres.get(personaje_id) || personaje_id}: <strong>{delta > 0 ? '+' : ''}{delta}</strong>
          </p>
        ))}
      </div>
      <button className="mt-6 rounded bg-slate-800 px-4 py-2 text-white" onClick={onContinuar}>Continuar</button>
    </section>
  );
}

export default function KingsCourt() {
  const challenge = (useLocation().state as ChallengeState | null)?.challenge;
  const date = challenge?.dateKey || new Date().toISOString().slice(0, 10);
  const dispatch = useDispatch();
  const [setup, setSetup] = useState<SetupPartida | null>(null);
  const [partida, setPartida] = useState<EstadoPartida | null>(null);
  const [corte, setCorte] = useState<CardData[]>([]);
  const [etapa, setEtapa] = useState<'corte' | 'cartas'>('corte');
  const [resultadoVisto, setResultadoVisto] = useState(false);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [error, setError] = useState('');

  const guardarPartida = (estado: EstadoPartida) => {
    setPartida(estado);
    setResultadoVisto(false);
    dispatch(actualizarAtributos(estado.run.recursos));
  };

  // Todas las decisiones del jugador actualizan el mismo estado de partida.
  const actualizarPartida = async (operacion: () => Promise<EstadoPartida>, mensaje = 'No se pudo actualizar la partida.') => {
    try {
      setError('');
      guardarPartida(await operacion());
      return true;
    } catch {
      setError(mensaje);
      return false;
    }
  };

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await obtenerSetup(date);
        setSetup(data);
        dispatch(actualizarAtributos(data.atributos_iniciales));
        if (data.tiene_partida_activa) guardarPartida(await obtenerPartida(date));
      } catch {
        setError('No se pudo cargar el desafío narrativo de hoy.');
      }
    };

    void cargar();
  }, [date, dispatch]);

  const iniciar = (cartas: CardData[]) => actualizarPartida(() =>
    iniciarPartida(date, corte.map(({ id }) => id), cartas.map(({ id }) => id)),
  );

  const responder = async (opcion: Decision) => {
    const respondida = await actualizarPartida(
      () => responderConversacion(date, opcion.opcion),
      'No se pudo guardar la decisión de la conversación.',
    );
    if (respondida) setDecision(opcion);
  };

  if (error) return <p className="p-6 text-center text-rose-700">{error}</p>;
  if (!setup) return <p className="p-6 text-center">Cargando desafío...</p>;

  const recursoAgotado = partida && Object.values(partida.run.recursos).some((valor) => valor <= 0);
  const partidaFinalizada = partida && (partida.run.status === 'game_over' || partida.run.fase_actual === 'FINALIZADA' || recursoAgotado);
  const finalizacion = partida && (partida.finalizacion || partida.run.finalizacion || crearFinalizacion(partida.run.recursos));
  let contenido;

  if (!partida && etapa === 'corte') {
    contenido = <CardSelection key="corte" titulo="Elegí tu corte" descripcion="Elegí tres miembros para la corte." cartas={setup.personajes_ofrecidos.map(toCard)} cantidad={3} onConfirmar={(seleccion) => { setCorte(seleccion); setEtapa('cartas'); }} />;
  } else if (!partida) {
    contenido = <CardSelection key="cartas-iniciales" titulo="Elegí tus cartas" descripcion="Elegí tres cartas iniciales. Algunas pueden sumar un personaje." cartas={setup.cartas_ofrecidas.map(toCard)} cantidad={3} onConfirmar={iniciar} />;
  } else if (partidaFinalizada) {
    // El backend determina el fin; esta pantalla sirve tanto para victoria como derrota.
    contenido = <ResultadoActual finalizacion={finalizacion || crearFinalizacion(partida.run.recursos)} />;
  } else if (decision) {
    contenido = <ConsecuenciaConversacion decision={decision} partida={partida} onContinuar={() => { setDecision(null); void actualizarPartida(() => avanzarMes(date)); }} />;
  } else if (partida.resultado_actual && !resultadoVisto) {
    // El resultado se lee antes de abrir la conversación que pudo disparar el evento.
    contenido = <ResultadoActual resultado={partida.resultado_actual} onContinuar={() => partida.conversacion_actual ? setResultadoVisto(true) : void actualizarPartida(() => avanzarMes(date))} />;
  } else if (partida.conversacion_actual) {
    contenido = <ConversacionActual conversacion={partida.conversacion_actual} personajes={partida.personajes_corte} onElegir={responder} />;
  } else if (partida.evento_actual) {
    contenido = <EventoActual evento={partida.evento_actual} atributos={partida.run.recursos} onElegir={(opcionId) => void actualizarPartida(() => decidirEvento(date, opcionId))} />;
  } else {
    contenido = <CardSelection key={partida.cartas_draft_actual.map(({ _id }) => _id).join('-')} titulo="Carta del mes" descripcion="Elegí una de las tres cartas. Después comenzará el próximo evento." cartas={partida.cartas_draft_actual.map(toCard)} cantidad={1} onConfirmar={([carta]) => actualizarPartida(() => elegirCartaMensual(date, carta.id))} />;
  }

  return (
    <IonPage>
      <GameHeader backLabel="Calendario" backRoute="/juegos/kings-court" title={setup.universo_nombre} />
      <IonContent>{contenido}</IonContent>
    </IonPage>
  );
}
