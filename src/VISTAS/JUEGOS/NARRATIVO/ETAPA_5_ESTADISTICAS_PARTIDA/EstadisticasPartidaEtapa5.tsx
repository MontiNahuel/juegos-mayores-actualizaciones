import { useMemo, useState } from 'react';
import { API_URL } from '../../../../config/api';
import { imagenPrecargada } from '../../../../services/assetPreloader';
import type { CatalogosCronica, EstadoPartida, FinalizacionApi, HistorialPartidaApi, PersonajeApi } from '../narrativeService';
import BotonNarrativo from '../COMPARTIDOS/BOTON_NARRATIVO/BotonNarrativo';
import TituloNarrativo from '../COMPARTIDOS/TITULO_NARRATIVO/TituloNarrativo';
import { construirCronica, RECURSOS, type ClaveRecurso, type MesCronica } from './estadisticasModel';
import './estadisticas.css';

interface MiembroCorte { personaje: PersonajeApi & { id?: string }; afinidad?: number }
interface Props {
  estado: EstadoPartida;
  historial: HistorialPartidaApi;
  corte?: { corte?: MiembroCorte[]; afinidad?: Record<string, number> } | null;
  catalogos: CatalogosCronica;
  recursosIniciales?: Record<string, number>;
  personajes: MiembroCorte['personaje'][];
  finalizacion?: FinalizacionApi | null;
  modoSimple?: boolean;
  onVolver: () => void;
}

const cambioLegible = (delta: number | null | undefined, simple: boolean) =>
  delta == null ? 'Sin dato' : simple ? delta > 0 ? 'Mejoró' : delta < 0 ? 'Empeoró' : 'Se mantuvo' : delta > 0 ? `+${delta}` : String(delta);

// Las líneas se interrumpen donde faltan balances; no unen meses desconocidos.
function Trayectoria({ meses, inicial, total, elegido, simple }: { meses: MesCronica[]; inicial: Partial<Record<ClaveRecurso, number>>; total: number; elegido: number; simple: boolean }) {
  const puntos = [{ numero: 0, valores: inicial }, ...meses.map(mes => ({ numero: mes.numero, valores: mes.valores }))];
  const x = (mes: number) => 75 + mes * 790 / total;
  const y = (valor: number) => 222 - Math.max(0, Math.min(100, valor)) * 1.9;
  return <figure className="m-0">
    <div className="cronica-desplazable overflow-x-auto pb-2">
      <svg className="block min-w-[900px] w-full" viewBox="0 0 900 270" role="img" aria-label="Evolución de oro, pueblo, ejército y fe durante el reinado. El detalle de cada mes está debajo.">
        {[0, 50, 100].map(valor => <g key={valor}><line x1="75" x2="865" y1={y(valor)} y2={y(valor)} stroke="#8b6a4870" /><text x="64" y={y(valor) + 5} textAnchor="end" fill="#705337" fontSize="15">{simple ? valor === 100 ? 'Alto' : valor === 50 ? 'Medio' : 'Bajo' : valor}</text></g>)}
        {Array.from({ length: total }, (_, i) => <text key={i} x={x(i + 1)} y="254" textAnchor="middle" fill="#5d442d" fontSize="14">{i + 1}</text>)}
        <line x1={x(elegido)} x2={x(elegido)} y1="27" y2="224" stroke="#6e4a2f" strokeWidth="2" strokeDasharray="4 5" />
        {RECURSOS.map(recurso => {
          const tramos: string[] = [];
          let trazo: string[] = [];
          puntos.forEach((punto, i) => {
            const valor = punto.valores[recurso.clave];
            if (valor === undefined || (i > 0 && puntos[i - 1].numero !== punto.numero - 1)) {
              if (trazo.length > 1) tramos.push(trazo.join(' '));
              trazo = [];
            }
            if (valor !== undefined) trazo.push(`${trazo.length ? 'L' : 'M'} ${x(punto.numero)} ${y(valor)}`);
          });
          if (trazo.length > 1) tramos.push(trazo.join(' '));
          return <g key={recurso.clave}>
            {tramos.map((ruta, i) => <path key={i} className="cronica-trazo" d={ruta} pathLength={1} fill="none" stroke={recurso.color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />)}
            {puntos.filter(p => p.valores[recurso.clave] !== undefined).map(p => <circle key={p.numero} cx={x(p.numero)} cy={y(p.valores[recurso.clave]!)} r={p.numero === elegido ? 6 : 3.5} fill={recurso.color} stroke="#f4e5c5" strokeWidth="2"><title>{`Mes ${p.numero || 'inicial'} · ${recurso.nombre}: ${p.valores[recurso.clave]}`}</title></circle>)}
          </g>;
        })}
      </svg>
    </div>
    <figcaption className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[#4e3926]">{RECURSOS.map(r => <span key={r.clave} className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.color }} />{r.nombre}</span>)}</figcaption>
  </figure>;
}

// Un único gráfico de cambios: cada fila es un recurso y cada columna un mes.
function Cambios({ meses, total, elegido, simple }: { meses: MesCronica[]; total: number; elegido: number; simple: boolean }) {
  const porMes = new Map(meses.map(mes => [mes.numero, mes]));
  const maximo = Math.max(15, ...meses.flatMap(mes => RECURSOS.map(r => Math.abs(mes.cambios[r.clave] || 0))));
  const columna = 780 / total;
  const x = (mes: number) => 100 + (mes - .5) * columna;
  return <figure className="m-0">
    <div className="cronica-desplazable overflow-x-auto pb-2">
      <svg className="block min-w-[900px] w-full" viewBox="0 0 900 312" role="img" aria-label="Barras mensuales de oro, pueblo, ejército y fe. Verde significa ganancia y rojo, pérdida.">
        <rect x={x(elegido) - columna / 2} y="4" width={columna} height="280" rx="6" fill="#aa824529" />
        {RECURSOS.map((r, fila) => {
          const base = 40 + fila * 62;
          return <g key={r.clave}>
            <text x="2" y={base + 5} fill="#4e3926" fontSize="17">{r.nombre}</text>
            <line x1="100" x2="880" y1={base} y2={base} stroke="#89694b88" />
            {Array.from({ length: total }, (_, i) => {
              const mes = i + 1;
              const delta = porMes.get(mes)?.cambios[r.clave];
              if (delta == null) return null;
              const alto = Math.max(delta === 0 ? 2 : 4, Math.abs(delta) * 25 / maximo);
              return <rect key={mes} className="cronica-barra" x={x(mes) - 10} y={delta > 0 ? base - alto : base} width="20" height={alto} rx="2" fill={delta > 0 ? '#477350' : delta < 0 ? '#a44d39' : '#967b58'}><title>{`Mes ${mes} · ${r.nombre}: ${cambioLegible(delta, simple)}`}</title></rect>;
            })}
          </g>;
        })}
        {Array.from({ length: total }, (_, i) => <text key={i} x={x(i + 1)} y="305" textAnchor="middle" fill="#5d442d" fontSize="14">{i + 1}</text>)}
      </svg>
    </div>
    <figcaption className="mt-1 flex flex-wrap gap-4 text-sm text-[#4e3926]"><span><i className="mr-2 inline-block h-2.5 w-2.5 bg-[#477350]" />Ganó</span><span><i className="mr-2 inline-block h-2.5 w-2.5 bg-[#a44d39]" />Perdió</span><span>La altura muestra cuánto cambió.</span></figcaption>
  </figure>;
}

function Retrato({ miembro, afinidad, simple }: { miembro: MiembroCorte; afinidad: number | null; simple: boolean }) {
  const p = miembro.personaje;
  const imagen = p.imagen?.startsWith('/') ? `${API_URL}${p.imagen}` : p.imagen;
  const trato = afinidad == null ? 'Sin afinidad registrada' : afinidad >= 70 ? 'Relación cercana' : afinidad >= 40 ? 'Relación estable' : 'Relación distante';
  return <article className="flex min-w-0 items-center gap-3 border-b border-[#8d69423f] py-3 last:border-0">
    <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-[#a8834f] bg-[#2d211b] text-2xl text-[#e4c889] shadow-[0_2px_7px_#34200d66]">{imagen ? <img src={imagenPrecargada(imagen)} alt="" className="h-full w-full object-cover object-top" /> : p.nombre.charAt(0)}</div>
    <div className="min-w-0 flex-1"><h4 className="m-0 truncate text-lg leading-tight text-[#412716]">{p.nombre}</h4><p className="m-0 truncate text-sm text-[#69513c]">{p.titulo || 'Miembro de la corte'}</p>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#a7835a55]"><span className="block h-full rounded-full bg-[#796033]" style={{ width: `${Math.max(0, Math.min(100, afinidad ?? 0))}%` }} /></div>
      <p className="mt-1 text-sm text-[#614832]">{trato}{!simple && afinidad != null ? ` · ${afinidad}/100` : ''}</p>
    </div>
  </article>;
}

export default function EstadisticasPartidaEtapa5({ estado, historial, corte, catalogos, recursosIniciales, personajes, finalizacion, modoSimple = false, onVolver }: Props) {
  const cronica = useMemo(() => construirCronica(historial, estado, recursosIniciales, catalogos), [historial, estado, recursosIniciales, catalogos]);
  const [elegido, setElegido] = useState(cronica.meses[0]?.numero || 1);
  const mes = cronica.meses.find(item => item.numero === elegido);
  const miembros = corte?.corte?.length ? corte.corte : personajes.map(personaje => ({ personaje }));
  const afinidades = corte?.afinidad || estado.afinidad || {};
  const cierre = estado.finalizacion || finalizacion;
  const nombreDePersonaje = (id: string) => miembros.find(miembro =>
    (miembro.personaje.id || miembro.personaje._id) === id)?.personaje.nombre || 'Alguien de la corte';
  const afinidadDe = (miembro: MiembroCorte) => {
    const id = miembro.personaje.id || miembro.personaje._id;
    const valor = miembro.afinidad ?? afinidades[id];
    return Number.isFinite(valor) ? Number(valor) : null;
  };

  return <section className="estadisticas-reino mx-auto w-full max-w-[1120px] pb-8 font-[Palatino_Linotype,Palatino,Georgia,serif] text-[#402918]" aria-label="Crónica del reinado">
    <TituloNarrativo titulo="Crónica del reinado" variante="evento" permanente />
    <div className="cronica-hoja cronica-entrada mt-1">
      <header className="border-b border-[#9c7547a0] pb-5 text-center">
        <p className="m-0 text-base text-[#76583a]">{cronica.meses.length === cronica.totalMeses ? 'El reinado completo' : `${cronica.meses.length} de ${cronica.totalMeses} meses en la corte`}</p>
        <h2 className="mx-auto mt-2 max-w-[27ch] text-[clamp(25px,4vw,42px)] leading-tight text-[#392312]">{cierre?.titulo || 'Así fue tu reinado'}</h2>
        {cierre?.texto && <p className="mx-auto mt-2 max-w-[65ch] text-[clamp(15px,2vw,18px)] leading-relaxed text-[#624831]">{cierre.texto}</p>}
        <p className="mx-auto mt-3 max-w-[65ch] text-[clamp(15px,2vw,18px)] leading-relaxed">Durante {cronica.meses.length} {cronica.meses.length === 1 ? 'mes' : 'meses'} tomaste {cronica.eventos} {cronica.eventos === 1 ? 'decisión' : 'decisiones'} ante los acontecimientos y participaste en {cronica.conversaciones} {cronica.conversaciones === 1 ? 'conversación' : 'conversaciones'} con tu corte.</p>
      </header>

      {cronica.meses.length ? <>
        <div className="pt-6"><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h3 className="m-0 text-[clamp(22px,3vw,30px)]">El pulso del reino</h3><p className="mt-1 text-sm text-[#6e5134]">Cómo quedaron los recursos al terminar cada mes.</p></div><p className="m-0 text-sm text-[#6e5134]">Mes seleccionado: {elegido}</p></div>
          <Trayectoria meses={cronica.meses} inicial={cronica.inicial} total={cronica.totalMeses} elegido={elegido} simple={modoSimple} />
        </div>
        <div className="mt-7 border-t border-[#9c7547a0] pt-6"><h3 className="m-0 text-[clamp(22px,3vw,30px)]">Lo que ganaste y perdiste</h3><p className="mt-1 mb-4 text-sm text-[#6e5134]">Cada columna es un mes. Elegí uno para leer qué decisión lo cambió.</p><Cambios meses={cronica.meses} total={cronica.totalMeses} elegido={elegido} simple={modoSimple} /></div>
        <nav className="cronica-meses mt-7 flex gap-1.5 overflow-x-auto pb-2" aria-label="Elegir mes del reinado">{Array.from({ length: cronica.totalMeses }, (_, i) => {
          const numero = i + 1;
          return <button key={numero} type="button" aria-label={`Mes ${numero}`} disabled={!cronica.meses.some(item => item.numero === numero)} aria-pressed={elegido === numero} onClick={() => setElegido(numero)} className="min-h-11 min-w-11 rounded-[3px] border border-[#9d7850] px-2 text-sm transition-colors hover:not-disabled:bg-[#c49c61a0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#633d1e] disabled:cursor-default disabled:opacity-35 aria-pressed:bg-[#634222] aria-pressed:text-[#f9edcf]">{numero}</button>;
        })}</nav>
        {mes ? <article className="mt-2 border-y border-[#9c7547a0] py-5" aria-live="polite">
          <h3 className="m-0 text-2xl">Mes {mes.numero}: {mes.evento || mes.resultado || 'La corte tomó una decisión'}</h3>
          <div className="mt-4 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(240px,300px)]">
            <div className="space-y-2 text-[clamp(15px,1.7vw,18px)] leading-relaxed">
              {mes.carta && <p><strong>Carta elegida:</strong> {mes.carta}</p>}
              {mes.opcion && <p><strong>Tu decisión:</strong> {mes.opcion.replace(/\[\s*secreto(?:\s*:[^\]]*)?\s*\]/i, '').trim()}</p>}
              {mes.resultado && <p><strong>Resultado:</strong> {mes.resultado}</p>}
              {mes.resultadoTexto && <p className="text-[#5c4330]">{mes.resultadoTexto}</p>}
              {mes.conversacion && <p><strong>La corte conversó sobre:</strong> {mes.conversacion}</p>}
              {mes.decision && <p><strong>Tu respuesta:</strong> {mes.decision}</p>}
              {mes.decisionResultado && <p className="text-[#5c4330]">{mes.decisionResultado}</p>}
              {mes.impactoAfinidad.length > 0 && <div className="mt-3 border-t border-[#9c754743] pt-3"><strong>Cómo afectó a la corte</strong><ul className="mt-1 list-none space-y-1 pl-0">{mes.impactoAfinidad.map((impacto, indice) => <li key={`${impacto.personajeId}-${indice}`}>{nombreDePersonaje(impacto.personajeId)}: {modoSimple ? impacto.delta > 0 ? 'la relación mejoró' : impacto.delta < 0 ? 'la relación empeoró' : 'la relación siguió igual' : `${impacto.delta > 0 ? '+' : ''}${impacto.delta} de afinidad`}</li>)}</ul></div>}
              {!mes.opcion && !mes.resultado && !mes.conversacion && <p>El registro conserva el balance de este mes, pero no el texto de la decisión.</p>}
            </div>
            <div className="self-start border-l-2 border-[#a47a48] pl-4"><h4 className="m-0 text-lg">Balance del mes</h4>{RECURSOS.map(recurso => {
              const delta = mes.cambios[recurso.clave];
              return <div key={recurso.clave} className="flex justify-between gap-4 border-b border-[#9c754743] py-1.5 text-base last:border-0"><span>{recurso.nombre}</span><strong className={delta == null ? 'text-[#735e48]' : delta > 0 ? 'text-[#356644]' : delta < 0 ? 'text-[#963e31]' : 'text-[#6f5a43]'}>{cambioLegible(delta, modoSimple)}</strong></div>;
            })}</div>
          </div>
        </article> : null}
      </> : <p className="py-10 text-center text-lg">Todavía no hay meses cerrados para dibujar el recorrido de la corte.</p>}

      <div className="mt-7 grid gap-7 border-t border-[#9c7547a0] pt-6 md:grid-cols-[minmax(0,1fr)_minmax(240px,330px)]">
        <section aria-label="La corte al finalizar"><h3 className="m-0 text-[clamp(22px,3vw,30px)]">Quienes estuvieron a tu lado</h3><p className="mt-1 text-sm text-[#6e5134]">Así terminó tu relación con cada integrante de la corte.</p>{miembros.length ? <div className="mt-3">{miembros.map(miembro => <Retrato key={miembro.personaje.id || miembro.personaje._id} miembro={miembro} afinidad={afinidadDe(miembro)} simple={modoSimple} />)}</div> : <p className="mt-4">La corte no tiene integrantes registrados.</p>}</section>
        <section aria-label="El reino al cerrar"><h3 className="m-0 text-[clamp(22px,3vw,30px)]">El reino al cerrar</h3><p className="mt-1 text-sm text-[#6e5134]">El estado con el que terminaste este recorrido.</p><div className="mt-4 space-y-4">{RECURSOS.map(recurso => {
          const valor = cronica.final[recurso.clave];
          return <div key={recurso.clave}><div className="flex justify-between gap-3"><span>{recurso.nombre}</span><strong>{valor == null ? 'Sin registro' : modoSimple ? valor >= 70 ? 'Fuerte' : valor >= 40 ? 'Estable' : 'Necesita cuidado' : `${valor}/100`}</strong></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-[#94734d4a]"><span className="block h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, valor || 0))}%`, backgroundColor: recurso.color }} /></div></div>;
        })}</div></section>
      </div>
      <div className="mt-8 flex justify-center"><BotonNarrativo onClick={onVolver}>Volver al cierre</BotonNarrativo></div>
    </div>
  </section>;
}
