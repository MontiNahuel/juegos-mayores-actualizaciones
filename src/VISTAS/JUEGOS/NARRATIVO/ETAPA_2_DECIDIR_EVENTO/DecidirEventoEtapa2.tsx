/* Presenta el nodo de evento y las opciones habilitadas por el backend. */
// Presenta el evento como una escena: ilustracion, titulo y decisiones al pie.
import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { EstadoGrafoApi, EventoApi } from '../narrativeTypes';
import TituloNarrativo from '../COMPARTIDOS/TITULO_NARRATIVO/TituloNarrativo';
import { API_URL } from '../../../../config/api';
import DialogoNarrativo from '../COMPARTIDOS/DIALOGO_NARRATIVO/DialogoNarrativo';
import FondoCorte from '../COMPARTIDOS/FONDO_CORTE/FondoCorte';
import type { EstadoFondoCorte } from '../../../../config/fondoCorte';
import { imagenPrecargada } from '../../../../services/assetPreloader';
import { AnimacionTexto } from '../COMPARTIDOS/DIALOGO_NARRATIVO/AnimacionTexto';

// Busca la imagen del elemento para mostrarla en la historia.
const imagenDe = (imagen: string) => imagenPrecargada(imagen.startsWith('/') && !imagen.startsWith('//')
  ? `${API_URL}${imagen}` : imagen);

// Respeta la etiqueta de secreto confirmada por el servidor, sin recalcular requisitos.
const textoOpcion = (opcion: EventoApi['opciones'][number]) => {
  const limpio = opcion.texto.replace(/\s*\[\s*secreto(?:\s*:[^\]]*)?\s*\]\s*/i, ' ').trim();
  const etiqueta = opcion.es_secreta && opcion.secreto ? `[secreto: ${opcion.secreto}] ` : '';
  return `${etiqueta}${limpio}`;
};

// Muestra resolver evento etapa2 y conecta sus controles con la pantalla.
export default function ResolverEventoEtapa2({ evento: recibido, grafo, atributos, fondoBase, enviando = false, onElegir }: {
  evento?: EventoApi;
  grafo?: EstadoGrafoApi;
  atributos: Record<string, number>;
  fondoBase: EstadoFondoCorte;
  enviando?: boolean;
  onElegir: (opcionId: string) => void;
}) {
  const evento: EventoApi = grafo ? {
    id: grafo.grafo_id, nodo_id: grafo.nodo_actual.id, titulo: grafo.titulo,
    descripcion: grafo.nodo_actual.texto, imagen: grafo.nodo_actual.imagen || grafo.imagen,
    opciones: grafo.nodo_actual.opciones.map(opcion => ({ ...opcion, bloqueada: !opcion.disponible })),
  } : recibido!;
  const [imagenFallida, setImagenFallida] = useState<string | null>(null);
  const [fondoListo, setFondoListo] = useState<string | null>(null);
  const fondo = evento.imagen && evento.imagen !== imagenFallida ? imagenDe(evento.imagen) : fondoBase.src;
  const usaFondoBase = fondo === fondoBase.src;
  const fondoEscena = { src: fondo, personajes: [], oro: [], manos: [] };
  const escenaLista = usaFondoBase || fondoListo === fondo;
  const escena = useRef<HTMLElement>(null);
  const animacion = useRef<AnimacionTexto | null>(null);
  const lecturaId = JSON.stringify([evento.id, evento.nodo_id, evento.descripcion]);
  const [lecturaCompleta, setLecturaCompleta] = useState('');
  const [escenaPresentada, setEscenaPresentada] = useState(false);
  const primeraLectura = useRef(true);
  const entradaPresentada = useRef(false);
  const contextoEntrada = useRef<gsap.Context | null>(null);
  const terminada = lecturaCompleta === lecturaId;

  // La escena se revela una sola vez por grafo, cuando su fondo está disponible.
  // El fondo de la corte permanece debajo mientras aparece el evento.
  useLayoutEffect(() => {
    if (!escena.current) return;
    const elemento = escena.current;
    const contexto = gsap.context(() => { gsap.set(elemento, { opacity: 0 }); }, elemento);
    contextoEntrada.current = contexto;
    entradaPresentada.current = false;
    return () => { contextoEntrada.current = null; contexto.revert(); };
  }, []);

  useLayoutEffect(() => {
    if (!escenaLista || entradaPresentada.current || !escena.current) return;
    entradaPresentada.current = true;
    setEscenaPresentada(true);
    const elemento = escena.current;
    contextoEntrada.current?.add(() => {
      const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      gsap.to(elemento, { opacity: 1, duration: reducido ? 0 : .8, ease: 'power2.out', data: 'evento:entrada' });
    });
  }, [escenaLista]);

  useLayoutEffect(() => {
    if (!escena.current) return;
    const coordinador = new AnimacionTexto(escena.current, setLecturaCompleta);
    animacion.current = coordinador;
    return () => { coordinador.destruir(); animacion.current = null; };
  }, [lecturaId]);

  useLayoutEffect(() => {
    if (!escenaLista || !animacion.current) return;
    const demora = primeraLectura.current ? .8 : 0;
    primeraLectura.current = false;
    animacion.current.escribirTexto(lecturaId, demora);
  }, [escenaLista, lecturaId]);

  return (
    <section ref={escena} className="evento-escena relative isolate flex min-h-[100svh] flex-col text-slate-100 [&>.titulo-narrativo]:pt-[max(48px,calc(env(safe-area-inset-top)+40px))]" aria-label="Evento del reino">
      {!usaFondoBase && <FondoCorte
        key={fondo}
        fondo={fondoEscena}
        onLoad={() => setFondoListo(fondo)}
        onError={() => {
          if (fondo !== fondoBase.src) setImagenFallida(evento.imagen);
          else setFondoListo(fondo);
        }}
      />}
      {/* Al usar la corte, sólo queda un degradado neutro y casi imperceptible. */}
      <div className={`pointer-events-none absolute inset-0 -z-10 ${usaFondoBase ? 'bg-[linear-gradient(#0001,transparent_45%,transparent)]' : 'bg-[linear-gradient(#0004,transparent_35%,#02061744)]'}`} />
      <TituloNarrativo key={evento.id} titulo={evento.titulo} listo={escenaPresentada || escenaLista} variante="evento" permanente />
      <div className="evento-ilustracion min-h-[clamp(96px,22svh,300px)] flex-1" aria-hidden="true" />
      <DialogoNarrativo
        className="evento-dialogo"
        listo={escenaPresentada || escenaLista}
        intervencion={lecturaId}
        textoProgresivo
        opcionesVisibles={terminada}
        onContinuar={!terminada ? () => animacion.current?.acelerarTexto() : undefined}
        texto={evento.descripcion}
        opciones={evento.opciones.map(opcion => ({
          id: opcion.id,
          texto: textoOpcion(opcion),
          disabled: enviando,
          // Registra la opción elegida y avanza la historia.
          onElegir: () => onElegir(opcion.id),
        })).filter((_, indice) => !evento.opciones[indice].bloqueada)}
        complemento={<details className="relative text-xs text-slate-300">
          <summary className="cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-amber-300">Recursos del reino</summary>
          <div className="absolute right-0 bottom-[calc(100%+12px)] w-[min(300px,80vw)] rounded-[10px] border border-slate-500 bg-[#0f172af5] p-4 shadow-[0_8px_24px_#0006]">
            {Object.entries(atributos).map(([clave, valor]) => (
              <div className="mb-2.5 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 last:mb-0" key={clave}>
                <span className="capitalize">{clave}</span>
                <strong>{valor}/100</strong>
                <progress className="col-span-full h-1.5 w-full accent-emerald-400" value={valor} max={100} aria-label={clave} />
              </div>
            ))}
          </div>
        </details>}
      />
    </section>
  );
}
