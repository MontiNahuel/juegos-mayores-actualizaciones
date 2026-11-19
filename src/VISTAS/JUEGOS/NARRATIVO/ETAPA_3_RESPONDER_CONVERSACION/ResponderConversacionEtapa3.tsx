/* Presenta la conversación recibida y coordina retratos, lectura y opciones. */
import './conversacion.css';
import Retrato from './ImagenRetrato';
import { useCallback, useRef, useState } from 'react';
import FondoConversacion from './FondoConversacion';
import { useAnimacionesConversacion } from '../COMPARTIDOS/DIALOGO_NARRATIVO/animacionesNarrativas';
import type { ConversacionApi, EstadoGrafoApi, PersonajeApi } from '../narrativeTypes';
import TituloNarrativo from '../COMPARTIDOS/TITULO_NARRATIVO/TituloNarrativo';
import DialogoNarrativo from '../COMPARTIDOS/DIALOGO_NARRATIVO/DialogoNarrativo';
import { API_URL } from '../../../../config/api';
import { FONDO_CONVERSACION } from '../../../../config/fondoCorte';
import { imagenPrecargada } from '../../../../services/assetPreloader';

type PersonajeConversacion = PersonajeApi & { id?: string };

interface Props {
  conversacion?: ConversacionApi;
  grafo?: EstadoGrafoApi;
  personajes: PersonajeConversacion[];
  enviando?: boolean;
  onElegir: (opcion: string) => void;
}

// Mantiene URLs absolutas y completa las imágenes del backend.
const imagenDe = (imagen: string, respaldo?: string) => {
  const absoluta = /^(https?:|blob:|data:)/.test(imagen);
  return imagenPrecargada(absoluta ? imagen : `${API_URL}${imagen}`, respaldo);
};

// Recorre el diálogo y muestra las opciones al llegar a la última frase.
export default function ResponderConversacionEtapa3({
  conversacion: recibida, grafo, personajes, enviando = false, onElegir,
}: Props) {
  // El grafo ya contiene la intervención y las opciones resueltas por el servidor.
  const nodoActual = grafo?.nodo_actual;
  const idConversacion = grafo?.grafo_id ?? recibida?._id ?? '';
  const nodo = nodoActual?.id || recibida?.nodo_id || idConversacion;
  const frases = nodoActual
    ? [{ personajeId: nodoActual.hablante_id, texto: nodoActual.texto }]
    : recibida?.frases ?? [];
  const participantesIds = grafo
    ? [...new Set([...(grafo.requisitos ?? []), nodoActual?.hablante_id].filter(Boolean))]
    : recibida?.requisitos.map(requisito => requisito.personajeId) ?? [];
  const decisiones = nodoActual
    ? nodoActual.opciones.filter(opcion => opcion.disponible).map(opcion => ({ opcion: opcion.id, texto: opcion.texto }))
    : recibida?.decisiones ?? [];
  // Cada nodo comienza por su primera frase y habilita las opciones al terminar la escritura.
  const [lectura, setLectura] = useState({ nodo, paso: 0, completa: false });
  if (lectura.nodo !== nodo) setLectura({ nodo, paso: 0, completa: false });
  const paso = lectura.nodo === nodo ? lectura.paso : 0;
  const intervencion = `${nodo}:${paso}`;
  const lecturaCompleta = lectura.nodo === nodo && lectura.completa;
  const terminarLectura = useCallback((id: string) => {
    setLectura(actual => `${actual.nodo}:${actual.paso}` === id ? { ...actual, completa: true } : actual);
  }, []);
  const [fondoListo, setFondoListo] = useState(false);
  const [tituloListo, setTituloListo] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  // Confirmar otra imagen no vuelve a disparar la introducción de la conversación.
  const mostrarEscena = useCallback(() => setFondoListo(true), []);
  const prepararTitulo = useCallback(() => setTituloListo(true), []);
  // Resuelve participantes, hablante y frase actual usando la corte existente.
  const buscarPersonaje = (id?: string) => id ? personajes.find(p => p._id === id || p.id === id) : undefined;
  const actores = participantesIds
    .map(personajeId => buscarPersonaje(personajeId))
    .filter((personaje): personaje is PersonajeConversacion => Boolean(personaje));
  const frase = frases[paso];
  const quienHabla = buscarPersonaje(frase?.personajeId);
  // Conserva los dos lugares de la charla; un tercer hablante ocupa el segundo.
  const participantes = actores.slice(0, 2);
  if (quienHabla && !participantes.includes(quienHabla)) participantes[1] = quienHabla;
  const ultimoDialogo = paso >= frases.length - 1;
  // El nodo aporta la imagen; el salón cubre una imagen ausente o fallida.
  const respaldo = imagenPrecargada(FONDO_CONVERSACION);
  const imagen = nodoActual ? nodoActual.imagen : recibida?.imagen;
  const fondo = imagen ? imagenDe(imagen, respaldo) : '';
  const { animarFondo, cancelarFondo, acelerarTexto } = useAnimacionesConversacion(raiz, {
    listo: fondoListo && tituloListo,
    intervencion,
  }, terminarLectura);

  return (
    <section className="min-h-[100svh] p-0">
      <div ref={raiz} data-intro={fondoListo ? 'listo' : 'cargando'} className="conversacion-escena relative isolate flex min-h-[100svh] flex-col overflow-x-hidden pt-[58px] text-slate-100">
        <FondoConversacion imagen={fondo} respaldo={respaldo} onListo={mostrarEscena} animar={animarFondo} cancelar={cancelarFondo} />
        <div className="absolute inset-0 -z-10 bg-black/25" />
        <TituloNarrativo variante="conversacion" key={idConversacion} titulo={grafo?.titulo ?? recibida?.titulo ?? ''} listo={fondoListo} onListo={prepararTitulo} animacionExterna />

        <div className="conversacion-personajes relative z-10 flex min-h-[calc(max(45.5svh,20.8rem)+0.25rem)] basis-0 grow items-start justify-between overflow-hidden px-2 pt-1 2xl:px-20">
          <div className="absolute inset-x-0 bottom-0 z-0 h-64 bg-gradient-to-t from-slate-950/90 to-transparent" />
          <Retrato personaje={participantes[0]} activo={Boolean(quienHabla && participantes[0] === quienHabla)} lado="izquierda" />
          <Retrato personaje={participantes[1]} activo={Boolean(quienHabla && participantes[1] === quienHabla)} lado="derecha" />
        </div>

        <DialogoNarrativo
          className="conversacion-dialogo"
          listo={fondoListo}
          intervencion={intervencion}
          animacionExterna
          textoProgresivo
          opcionesVisibles={lecturaCompleta}
          titulo={quienHabla?.nombre || (frase?.personajeId === 'narrador' ? 'Crónicas del Reino' : 'Consejero')}
          texto={frase?.texto || ''}
          indicacion={lecturaCompleta && !ultimoDialogo ? 'Tocá para continuar ›' : undefined}
          onContinuar={!lecturaCompleta ? acelerarTexto : !ultimoDialogo ? () => setLectura({ nodo, paso: paso + 1, completa: false }) : undefined}
          opciones={ultimoDialogo ? decisiones.map((decision) => ({
            id: decision.opcion,
            texto: decision.texto,
            disabled: enviando || !lecturaCompleta,
            // Registra la opción elegida y avanza la historia.
            onElegir: () => onElegir(String(decision.opcion)),
          })) : []}
        />
      </div>
    </section>
  );
}
