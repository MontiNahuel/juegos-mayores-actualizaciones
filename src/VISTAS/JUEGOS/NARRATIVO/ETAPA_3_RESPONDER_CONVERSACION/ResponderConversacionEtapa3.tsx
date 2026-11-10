import ImagenRetrato from './ImagenRetrato';
import { useCallback, useEffect, useRef, useState } from 'react';
import FondoConversacion from './FondoConversacion';
import { useAnimacionesConversacion } from './animacionesConversacion';
import type { ConversacionApi, PersonajeApi } from '../narrativeService';
import TituloConversacion from '../COMPARTIDOS/TITULO_NARRATIVO/TituloConversacion';
import DialogoNarrativo from '../COMPARTIDOS/DIALOGO_NARRATIVO/DialogoNarrativo';
import { API_URL } from '../../../../config/api';
import { FONDO_CONVERSACION } from '../../../../config/fondoCorte';
import { ocultarCambiosNumericos } from '../../../../config/adaptacionEdad';
import { imagenPrecargada } from '../../../../services/assetPreloader';

type PersonajeConversacion = PersonajeApi & { id?: string };
type DecisionConversacion = ConversacionApi['decisiones'][number];

interface Props {
  conversacion: ConversacionApi;
  personajes: PersonajeConversacion[];
  modoSimple?: boolean;
  enviando?: boolean;
  onElegir: (decision: DecisionConversacion) => void;
}

// Mantiene URLs absolutas y completa las imágenes del backend.
const imagenDe = (imagen: string, respaldo?: string) => {
  const absoluta = /^(https?:|blob:|data:)/.test(imagen);
  return imagenPrecargada(absoluta ? imagen : `${API_URL}${imagen}`, respaldo);
};

// Genera iniciales si no existe el retrato.
const iniciales = (nombre: string) => nombre.trim().split(/\s+/).map(parte => parte[0]).join('').slice(0, 2) || '?';

// Muestra ambos retratos o solamente al personaje que habla.
function Retrato({ personaje, activo, lado, solo }: {
  personaje?: PersonajeConversacion;
  activo: boolean;
  lado: 'izquierda' | 'derecha';
  solo: boolean;
}) {
  if (!personaje) return <div />;
  const visible = !solo || activo;
  const derecha = lado === 'derecha';
  const posicion = solo
    ? `absolute inset-y-0 ${derecha ? 'right-0' : 'left-0'} w-full`
    : 'relative w-1/2';
  const alineacion = derecha ? 'ml-auto mr-0 items-end' : 'ml-0 mr-auto items-start';
  const encuadre = solo
    ? 'justify-center'
    : 'justify-center';

  return (
    <div
      data-visible={visible}
      data-activo={activo}
      className={`conversacion-retrato ${posicion} ${alineacion} z-10 flex h-full max-w-2xl shrink-0 flex-col justify-start px-5 ${visible ? '' : 'pointer-events-none'}`}
    >
      <div className={`relative flex h-[70svh] min-h-[32rem] w-full shrink-0 items-end drop-shadow-[0_6px_12px_rgba(0,0,0,0.35)] ${encuadre}`}>
        <span className="absolute inset-0 grid place-items-center text-4xl font-semibold text-amber-100/70">{iniciales(personaje.nombre)}</span>
        {personaje.imagen && <ImagenRetrato src={imagenDe(personaje.imagen)} nombre={personaje.nombre} />}
      </div>
    </div>
  );
}

// Recorre el diálogo y muestra las opciones al llegar a la última frase.
export default function ResponderConversacionEtapa3({
  conversacion, personajes, modoSimple = false, enviando = false, onElegir,
}: Props) {
  // La lectura local pertenece al nodo, la introducción pertenece a toda la escena.
  const nodo = conversacion.nodo_id || conversacion._id;
  const [lectura, setLectura] = useState({ nodo, paso: 0 });
  // Ajusta la lectura antes del siguiente render, también si el grafo vuelve a un nodo visitado.
  if (lectura.nodo !== nodo) setLectura({ nodo, paso: 0 });
  const paso = lectura.nodo === nodo ? lectura.paso : 0;
  const intervencion = `${nodo}:${paso}`;
  const [escritura, setEscritura] = useState({ intervencion, completa: false });
  if (escritura.intervencion !== intervencion) setEscritura({ intervencion, completa: false });
  const lecturaCompleta = escritura.intervencion === intervencion && escritura.completa;
  const terminarLectura = useCallback((id: string) => {
    setEscritura(actual => actual.intervencion === id ? { ...actual, completa: true } : actual);
  }, []);
  const [solo, setSolo] = useState(true);
  const [fondoListo, setFondoListo] = useState(false);
  const [tituloListo, setTituloListo] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  // Confirmar otra imagen no vuelve a disparar la introducción de la conversación.
  const mostrarEscena = useCallback(() => setFondoListo(true), []);
  const prepararTitulo = useCallback(() => setTituloListo(true), []);
  const escena = useRef<HTMLDivElement>(null);

  // Detecta cuándo se superponen los retratos y deja visible uno solo.
  useEffect(() => {
    const elemento = escena.current;
    if (!elemento) return;

    // Compara el ancho natural de los retratos con el espacio disponible, sin escalarlos por el texto.
    const medir = () => {
      const imagenes = [...elemento.querySelectorAll<HTMLImageElement>('img[data-retrato-actual="true"]')];
      if (imagenes.length < 2) {
        setSolo(true);
        return;
      }
      if (imagenes.some((img) => !img.naturalHeight)) return;
      const estilo = getComputedStyle(elemento);
      const ancho = elemento.clientWidth - parseFloat(estilo.paddingLeft) - parseFloat(estilo.paddingRight);
      const alto = Math.max(...imagenes.map((img) => img.clientHeight));
      const maximo = parseFloat(getComputedStyle(imagenes[0].closest('.conversacion-retrato')!).maxWidth);
      const separacion = ancho - Math.min(ancho / 2, maximo);
      const anchoRetratos = imagenes.reduce((total, img) => total + alto * img.naturalWidth / img.naturalHeight, 0);
      setSolo(anchoRetratos >= separacion * 2);
    };
    const observador = new ResizeObserver(medir);
    observador.observe(elemento);
    elemento.addEventListener('load', medir, true);
    medir();
    return () => {
      observador.disconnect();
      elemento.removeEventListener('load', medir, true);
    };
  }, []);

  // Resuelve participantes, hablante y frase actual usando la corte existente.
  const buscarPersonaje = (id?: string) => id ? personajes.find(p => p._id === id || p.id === id) : undefined;
  const actores = conversacion.requisitos
    .map(({ personajeId }) => buscarPersonaje(personajeId))
    .filter((personaje): personaje is PersonajeConversacion => Boolean(personaje));
  const frase = conversacion.frases[paso];
  const quienHabla = buscarPersonaje(frase?.personajeId);
  // Conserva los dos lugares de la charla; un tercer hablante ocupa el segundo.
  const participantes = actores.slice(0, 2);
  if (quienHabla && !participantes.includes(quienHabla)) participantes[1] = quienHabla;
  const ultimoDialogo = paso >= conversacion.frases.length - 1;
  // Devuelve el texto visible del nodo actual de la conversación.
  const texto = (valor = '') => modoSimple ? ocultarCambiosNumericos(valor) : valor;
  // El adapter prioriza nodo.imagen; el salón sólo cubre una imagen ausente o fallida.
  const respaldo = imagenPrecargada(FONDO_CONVERSACION);
  const fondo = conversacion.imagen ? imagenDe(conversacion.imagen, respaldo) : '';
  const { animarFondo, cancelarFondo, acelerarTexto } = useAnimacionesConversacion(raiz, {
    listo: fondoListo && tituloListo,
    intervencion,
    solo,
    hablante: quienHabla?._id || quienHabla?.id || '',
  }, terminarLectura);

  return (
    <section className="min-h-[100svh] p-0">
      <div ref={raiz} data-intro={fondoListo ? 'listo' : 'cargando'} className="conversacion-escena relative isolate flex min-h-[100svh] flex-col overflow-x-hidden pt-[58px] text-slate-100">
        <FondoConversacion imagen={fondo} respaldo={respaldo} onListo={mostrarEscena} animar={animarFondo} cancelar={cancelarFondo} />
        <div className="absolute inset-0 -z-10 bg-black/25" />
        <TituloConversacion key={conversacion._id} titulo={conversacion.titulo} listo={fondoListo} onListo={prepararTitulo} animacionExterna />

        <div ref={escena} className="conversacion-personajes relative z-10 flex min-h-[calc(max(45.5svh,20.8rem)+0.25rem)] basis-0 grow items-start justify-between overflow-hidden px-2 pt-1 2xl:px-20">
          <div className="absolute inset-x-0 bottom-0 z-0 h-64 bg-gradient-to-t from-slate-950/90 to-transparent" />
          <Retrato personaje={participantes[0]} activo={Boolean(quienHabla && participantes[0] === quienHabla)} lado="izquierda" solo={solo} />
          <Retrato personaje={participantes[1]} activo={Boolean(quienHabla && participantes[1] === quienHabla)} lado="derecha" solo={solo} />
        </div>

        <DialogoNarrativo
          className="conversacion-dialogo"
          listo={fondoListo}
          intervencion={intervencion}
          animacionExterna
          textoProgresivo
          opcionesVisibles={lecturaCompleta}
          titulo={quienHabla?.nombre || (frase?.personajeId === 'narrador' ? 'Crónicas del Reino' : 'Consejero')}
          texto={texto(frase?.texto)}
          indicacion={lecturaCompleta && !ultimoDialogo ? 'Tocá para continuar ›' : undefined}
          onContinuar={!lecturaCompleta ? acelerarTexto : !ultimoDialogo ? () => setLectura({ nodo, paso: paso + 1 }) : undefined}
          opciones={ultimoDialogo ? conversacion.decisiones.map((decision) => ({
            id: decision.opcion,
            texto: texto(decision.texto),
            disabled: enviando || !lecturaCompleta,
            // Registra la opción elegida y avanza la historia.
            onElegir: () => onElegir(decision),
          })) : []}
        />
      </div>
    </section>
  );
}
