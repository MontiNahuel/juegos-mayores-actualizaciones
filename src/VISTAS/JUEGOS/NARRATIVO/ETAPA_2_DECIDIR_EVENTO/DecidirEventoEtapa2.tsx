/* Muestra el evento actual y las opciones que permiten sus condiciones. */
// Presenta el evento como una escena: ilustracion, titulo y decisiones al pie.
import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { EventoApi } from '../narrativeService';
import TituloNarrativo from '../COMPARTIDOS/TITULO_NARRATIVO/TituloNarrativo';
import { API_URL } from '../../../../config/api';
import { ocultarCambiosNumericos } from '../../../../config/adaptacionEdad';
import DialogoNarrativo from '../COMPARTIDOS/DIALOGO_NARRATIVO/DialogoNarrativo';
import FondoCorte from '../COMPARTIDOS/FONDO_CORTE/FondoCorte';
import type { EstadoFondoCorte } from '../../../../config/fondoCorte';
import { imagenPrecargada } from '../../../../services/assetPreloader';
import { AnimacionTexto } from '../COMPARTIDOS/DIALOGO_NARRATIVO/AnimacionTexto';

// Busca la imagen del elemento para mostrarla en la historia.
const imagenDe = (imagen: string) => imagenPrecargada(imagen.startsWith('/') && !imagen.startsWith('//')
  ? `${API_URL}${imagen}` : imagen);

// El backend puede enviar el disparador como campo o dejar solo la marca en el texto.
const cumpleCondicion = (c: any, atributos: Record<string, number>, personajes: any[], afinidad: Record<string, number>, tags: string[], cartas: any[]) => {
  // Evalúa la comparación que pide la condición.
  const comparar = (actual: number, esperado: number) => ({ '>=': actual >= esperado, '>': actual > esperado, '<=': actual <= esperado, '<': actual < esperado, '==': actual === esperado, '!=': actual !== esperado } as Record<string, boolean>)[c.operador] ?? false;
  if (c.tipo === 'comparar_recurso') return comparar(atributos[c.clave] ?? 0, Number(c.valor));
  if (c.tipo === 'tiene_personaje') return personajes.some(/* Comprueba si algún elemento cumple esta condición. */ p => (p.id || p._id) === c.personaje_id);
  if (c.tipo === 'afinidad_personaje') return comparar(afinidad[c.personaje_id] ?? 0, Number(c.valor));
  if (c.tipo === 'tiene_tag') return tags.includes(c.tag);
  if (c.tipo === 'tiene_carta') return cartas.some(/* Comprueba si algún elemento cumple esta condición. */ x => (x.id || x._id) === c.carta_id);
  return false;
};

// Prepara el texto visible de la opción del evento.
const textoOpcion = (opcion: EventoApi['opciones'][number], indice: number, modoSimple: boolean, condiciones: any[], contexto: any) => {
  const { texto, ...datos } = opcion as EventoApi['opciones'][number] & Record<string, any>;
  const esSecreta = indice === 2 && (datos.es_secreta || /\[\s*secreto(?:\s*:[^\]]*)?\s*\]/i.test(texto));
  const limpio = texto.replace(/\s*\[\s*secreto(?:\s*:[^\]]*)?\s*\]\s*/i, ' ').trim();
  const activadores = ((datos.condiciones as any[]) || condiciones).filter(/* Conserva los elementos que cumplen esta condición. */ c => cumpleCondicion(c, contexto.atributos, contexto.personajes, contexto.afinidad, contexto.tags, contexto.cartas)).map(/* Prepara el resultado de cada elemento. */ (c: any) => {
    if (c.tipo === 'comparar_recurso') return `${c.clave} ${({ '>=': '≥', '<=': '≤', '==': '=', '!=': '≠' } as Record<string, string>)[c.operador] || c.operador} ${c.valor}`;
    if (c.tipo === 'tiene_personaje') return contexto.personajes.find(/* Busca el primer elemento que cumple esta condición. */ (p: any) => (p.id || p._id) === c.personaje_id)?.nombre || c.personaje_id;
    if (c.tipo === 'afinidad_personaje') return `${contexto.personajes.find(/* Busca el primer elemento que cumple esta condición. */ (p: any) => (p.id || p._id) === c.personaje_id)?.nombre || c.personaje_id}: afinidad ${c.operador} ${c.valor}`;
    if (c.tipo === 'tiene_tag') return `tag ${c.tag}`;
    return `carta ${c.carta_id}`;
  });
  const nombreCondicion = activadores.join(' + ') || datos.secreto;
  const etiqueta = esSecreta && nombreCondicion ? `[secreto: ${nombreCondicion}] ` : '';
  return `${etiqueta}${modoSimple ? ocultarCambiosNumericos(limpio) : limpio}`;
};

// Muestra resolver evento etapa2 y conecta sus controles con la pantalla.
export default function ResolverEventoEtapa2({ evento, atributos, fondoBase, modoSimple = false, demorarDialogoPorFondo = false, enviando = false, personajes = [], afinidad = {}, tags = [], cartas = [], onElegir }: {
  evento: EventoApi;
  atributos: Record<string, number>;
  fondoBase: EstadoFondoCorte;
  modoSimple?: boolean;
  demorarDialogoPorFondo?: boolean;
  enviando?: boolean;
  personajes?: any[];
  afinidad?: Record<string, number>;
  tags?: string[];
  cartas?: any[];
  onElegir: (opcionId: string) => void;
}) {
  const [imagenFallida, setImagenFallida] = useState<string | null>(null);
  const [fondoListo, setFondoListo] = useState<string | null>(null);
  const contexto = { atributos, personajes, afinidad, tags, cartas };
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
    const demora = primeraLectura.current ? (demorarDialogoPorFondo ? 2.4 : .8) : 0;
    primeraLectura.current = false;
    animacion.current.escribirTexto(lecturaId, demora);
  }, [escenaLista, lecturaId, demorarDialogoPorFondo]);

  return (
    <section ref={escena} className="evento-escena relative isolate flex min-h-[100svh] flex-col text-slate-100 [&>.titulo-narrativo]:pt-[max(48px,calc(env(safe-area-inset-top)+40px))]" aria-label="Evento del reino">
      {!usaFondoBase && <FondoCorte
        key={fondo}
        fondo={fondoEscena}
        onLoad={/* Responde a load desde este control. */ () => setFondoListo(fondo)}
        onError={/* Responde a error desde este control. */ () => {
          if (fondo !== fondoBase.src) setImagenFallida(evento.imagen);
          else setFondoListo(fondo);
        }}
      />}
      {/* Al usar la corte, sólo queda un degradado neutro y casi imperceptible. */}
      <div className={`pointer-events-none absolute inset-0 -z-10 ${usaFondoBase ? 'bg-[linear-gradient(#0001,transparent_45%,transparent)]' : 'bg-[linear-gradient(#0004,transparent_35%,#02061744)]'}`} />
      <TituloNarrativo key={evento.id} titulo={evento.titulo} listo={escenaPresentada || escenaLista} variante="evento" permanente />
      <div className="evento-ilustracion min-h-[clamp(96px,22svh,300px)] flex-1" aria-hidden="true" />
      <DialogoNarrativo
        className={`evento-dialogo${demorarDialogoPorFondo ? ' evento-dialogo--espera-fondo' : ''}`}
        listo={escenaPresentada || escenaLista}
        intervencion={lecturaId}
        textoProgresivo
        opcionesVisibles={terminada}
        onContinuar={!terminada ? () => animacion.current?.acelerarTexto() : undefined}
        texto={evento.descripcion}
        opciones={evento.opciones.map(/* Prepara el resultado de cada elemento. */ (opcion, indice) => ({
          id: opcion.id,
          texto: textoOpcion(opcion, indice, modoSimple, opcion.condiciones || [], contexto),
          disabled: enviando,
          // Registra la opción elegida y avanza la historia.
          onElegir: () => onElegir(opcion.id),
        })).filter(/* Conserva los elementos que cumplen esta condición. */ (_, indice) => !evento.opciones[indice].bloqueada)}
        complemento={!modoSimple ? <details className="relative text-xs text-slate-300">
          <summary className="cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-amber-300">Recursos del reino</summary>
          <div className="absolute right-0 bottom-[calc(100%+12px)] w-[min(300px,80vw)] rounded-[10px] border border-slate-500 bg-[#0f172af5] p-4 shadow-[0_8px_24px_#0006]">
            {Object.entries(atributos).map(/* Prepara el resultado de cada elemento. */ ([clave, valor]) => (
              <div className="mb-2.5 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 last:mb-0" key={clave}>
                <span className="capitalize">{clave}</span>
                <strong>{valor}/100</strong>
                <progress className="col-span-full h-1.5 w-full accent-emerald-400" value={valor} max={100} aria-label={clave} />
              </div>
            ))}
          </div>
        </details> : null}
      />
    </section>
  );
}
