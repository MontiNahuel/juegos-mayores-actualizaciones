// Presenta el evento como una escena: ilustracion, titulo y decisiones al pie.
import { useState } from 'react';
import type { EventoApi } from '../narrativeService';
import TituloNarrativo from '../COMPARTIDOS/TITULO_NARRATIVO/TituloNarrativo';
import { API_URL } from '../../../../config/api';
import { ocultarCambiosNumericos } from '../../../../config/adaptacionEdad';
import DialogoNarrativo from '../COMPARTIDOS/DIALOGO_NARRATIVO/DialogoNarrativo';
import FondoCorte from '../COMPARTIDOS/FONDO_CORTE/FondoCorte';
import type { EstadoFondoCorte } from '../../../../config/fondoCorte';

const imagenDe = (imagen: string) => imagen.startsWith('/') && !imagen.startsWith('/assets/') && !imagen.startsWith('//')
  ? `${API_URL}${imagen}` : imagen;

// El backend puede enviar el disparador como campo o dejar solo la marca en el texto.
const cumpleCondicion = (c: any, atributos: Record<string, number>, personajes: any[], afinidad: Record<string, number>, tags: string[], cartas: any[]) => {
  const comparar = (actual: number, esperado: number) => ({ '>=': actual >= esperado, '>': actual > esperado, '<=': actual <= esperado, '<': actual < esperado, '==': actual === esperado, '!=': actual !== esperado } as Record<string, boolean>)[c.operador] ?? false;
  if (c.tipo === 'comparar_recurso') return comparar(atributos[c.clave] ?? 0, Number(c.valor));
  if (c.tipo === 'tiene_personaje') return personajes.some(p => (p.id || p._id) === c.personaje_id);
  if (c.tipo === 'afinidad_personaje') return comparar(afinidad[c.personaje_id] ?? 0, Number(c.valor));
  if (c.tipo === 'tiene_tag') return tags.includes(c.tag);
  if (c.tipo === 'tiene_carta') return cartas.some(x => (x.id || x._id) === c.carta_id);
  return false;
};

const textoOpcion = (opcion: EventoApi['opciones'][number], indice: number, modoSimple: boolean, condiciones: any[], contexto: any) => {
  const { texto, ...datos } = opcion as EventoApi['opciones'][number] & Record<string, any>;
  const esSecreta = indice === 2 && (datos.es_secreta || /\[\s*secreto(?:\s*:[^\]]*)?\s*\]/i.test(texto));
  const limpio = texto.replace(/\s*\[\s*secreto(?:\s*:[^\]]*)?\s*\]\s*/i, ' ').trim();
  const activadores = ((datos.condiciones as any[]) || condiciones).filter(c => cumpleCondicion(c, contexto.atributos, contexto.personajes, contexto.afinidad, contexto.tags, contexto.cartas)).map((c: any) => {
    if (c.tipo === 'comparar_recurso') return `${c.clave} ${({ '>=': '≥', '<=': '≤', '==': '=', '!=': '≠' } as Record<string, string>)[c.operador] || c.operador} ${c.valor}`;
    if (c.tipo === 'tiene_personaje') return contexto.personajes.find((p: any) => (p.id || p._id) === c.personaje_id)?.nombre || c.personaje_id;
    if (c.tipo === 'afinidad_personaje') return `${contexto.personajes.find((p: any) => (p.id || p._id) === c.personaje_id)?.nombre || c.personaje_id}: afinidad ${c.operador} ${c.valor}`;
    if (c.tipo === 'tiene_tag') return `tag ${c.tag}`;
    return `carta ${c.carta_id}`;
  });
  const nombreCondicion = activadores.join(' + ') || datos.secreto;
  const etiqueta = esSecreta && nombreCondicion ? `[secreto: ${nombreCondicion}] ` : '';
  return `${etiqueta}${modoSimple ? ocultarCambiosNumericos(limpio) : limpio}`;
};

export default function ResolverEventoEtapa2({ evento, atributos, fondoBase, modoSimple = false, demorarDialogoPorFondo = false, personajes = [], afinidad = {}, tags = [], cartas = [], onElegir }: {
  evento: EventoApi;
  atributos: Record<string, number>;
  fondoBase: EstadoFondoCorte;
  modoSimple?: boolean;
  demorarDialogoPorFondo?: boolean;
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
  const fondoEscena = { src: fondo, personajes: [], oro: [] };
  const escenaLista = usaFondoBase || fondoListo === fondo;

  return (
    <section className="evento-escena relative isolate flex min-h-[100svh] flex-col text-slate-100 [&>.titulo-narrativo]:pt-[max(48px,calc(env(safe-area-inset-top)+40px))]" aria-label="Evento del reino">
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
      <TituloNarrativo key={evento.id} titulo={evento.titulo} listo={escenaLista} variante="evento" permanente />
      <div className="evento-ilustracion min-h-[clamp(96px,22svh,300px)] flex-1" aria-hidden="true" />
      <DialogoNarrativo
        className={`evento-dialogo${demorarDialogoPorFondo ? ' evento-dialogo--espera-fondo' : ''}`}
        listo={escenaLista}
        texto={evento.descripcion}
        opciones={evento.opciones.map((opcion, indice) => ({
          id: opcion.id,
          texto: textoOpcion(opcion, indice, modoSimple, opcion.condiciones || [], contexto),
          onElegir: () => onElegir(opcion.id),
        })).filter((_, indice) => !evento.opciones[indice].bloqueada)}
        complemento={!modoSimple ? <details className="relative text-xs text-slate-300">
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
        </details> : null}
      />
    </section>
  );
}
