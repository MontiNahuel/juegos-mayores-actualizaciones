/* Cuenta qué pasó después de la decisión y permite continuar. */
// Muestra el resultado de una decision o el cierre de la partida.
import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import selloResultado from '../../../../assets/narrative/sello-resultado.png';
import type { EstadoGrafoApi, FinalizacionApi, ResultadoApi } from '../narrativeTypes';
import TituloNarrativo from '../COMPARTIDOS/TITULO_NARRATIVO/TituloNarrativo';
import BotonNarrativo from '../COMPARTIDOS/BOTON_NARRATIVO/BotonNarrativo';
import PapelUi from '../COMPARTIDOS/PAPEL_UI/PapelUi';
import { AnimacionTexto } from '../COMPARTIDOS/DIALOGO_NARRATIVO/AnimacionTexto';

// Describe los efectos sin números para la presentación adaptada.
function describirEfectos(resultado?: ResultadoApi) {
  const frases: Record<string, [string, string]> = {
    oro: ['Ahora hay más oro disponible.', 'Ahora queda menos oro.'],
    pueblo: ['La gente quedó más contenta.', 'La gente quedó más molesta.'],
    ejercito: ['La defensa del reino quedó más fuerte.', 'La defensa del reino quedó más débil.'],
    fe: ['La gente recuperó confianza.', 'La gente perdió confianza.'],
  };
  return resultado?.efectos?.map(({ accion }) =>
    accion.clave && frases[accion.clave]?.[Number(accion.valor || 0) > 0 ? 0 : 1]
  ).filter(Boolean).join(' ') || 'La decisión no produjo cambios importantes.';
}

// ETAPA 4: muestra el resultado del evento o el cierre de la partida.
export default function MostrarResultadoEtapa4({ resultado: recibido, grafo, finalizacion, modoSimple = false, continuando = false, onContinuar, onVerEstadisticas, cargandoEstadisticas, onTerminar, reiniciando }: {
  resultado?: ResultadoApi;
  grafo?: EstadoGrafoApi;
  finalizacion?: FinalizacionApi;
  modoSimple?: boolean;
  continuando?: boolean;
  onContinuar?: () => void;
  onVerEstadisticas?: () => void;
  cargandoEstadisticas?: boolean;
  onTerminar?: () => void;
  reiniciando?: boolean;
}) {
  const nodo = grafo?.nodo_actual;
  const resultado: ResultadoApi | undefined = grafo && nodo?.es_final ? {
    titulo: grafo.titulo, texto: [...new Set([nodo.texto, nodo.resultado_texto].map(texto => texto?.trim()).filter(Boolean))].join('\n\n'),
    imagen: nodo.imagen || grafo.imagen, tipo_resultado: 'neutro',
    efectos: nodo.impactos_recursos.map(({ recurso, delta }) => ({ accion: { clave: recurso, valor: delta } })),
  } : recibido;
  const [selloListo, setSelloListo] = useState(false);
  const sello = useRef<HTMLImageElement>(null);
  const botonContinuar = useRef<HTMLDivElement>(null);
  const [selloTerminado, setSelloTerminado] = useState<string | null>(null);
  const identidad = `${finalizacion?._id || resultado?.titulo || ''}:${finalizacion?.texto || resultado?.texto || ''}`;
  useLayoutEffect(() => { setSelloListo(false); }, [identidad]);
  // El sello cae únicamente después de presentar la última consecuencia.
  useLayoutEffect(() => {
    if (!selloListo || !sello.current) return;
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const contexto = gsap.context(() => {
      gsap.fromTo(sello.current, { opacity: 0, scale: reducido ? 1 : 1.65, rotation: -13 }, {
        opacity: .82, scale: 1, rotation: -9, duration: reducido ? 0 : .24, ease: 'power4.in',
        onComplete: () => setSelloTerminado(identidad),
      });
    });
    return () => contexto.revert();
  }, [selloListo, identidad]);
  // El control aparece después del impacto, nunca antes de que termine el sello.
  useLayoutEffect(() => {
    if (selloTerminado !== identidad || !botonContinuar.current) return;
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const contexto = gsap.context(() => {
      gsap.fromTo(botonContinuar.current, { autoAlpha: 0 }, {
        autoAlpha: 1, delay: .5, duration: reducido ? 0 : .7, ease: 'sine.out',
      });
    });
    return () => contexto.revert();
  }, [selloTerminado, identidad]);
  const esFinal = Boolean(finalizacion);
  const contenido = finalizacion || resultado;

  if (!contenido) return null;

  const tipo = finalizacion
    ? finalizacion.tipo === 'victoria_tiempo' ? 'positivo' : 'negativo'
    : resultado?.tipo_resultado || 'neutro';
  const efectos: EfectoResultado[] = modoSimple && resultado
    ? [{ texto: describirEfectos(resultado), tipo: 'neutro' }]
    : finalizacion
      ? [{ texto: finalizacion.rango ? `Rango final: ${finalizacion.rango}` : 'Partida finalizada', tipo }]
      : resultado?.efectos.length
        ? resultado.efectos.map(({ accion }) => ({
          texto: `${accion.valor > 0 ? '+' : ''}${accion.valor} ${accion.clave}`,
          tipo: accion.valor > 0 ? 'positivo' : accion.valor < 0 ? 'negativo' : 'neutro',
        }))
        : [{ texto: 'Sin cambios', tipo: 'neutro' }];

  return (
    <section className={`flex min-h-full w-full flex-col items-center text-center text-[#25170d] motion-safe:transition-opacity motion-safe:duration-[650ms] [&>.titulo-narrativo]:w-full`}>
      <TituloNarrativo titulo="Resultado" permanente variante="evento" />

      <PapelUi overlay={<img ref={sello} src={selloResultado} alt="" aria-hidden="true" className="pointer-events-none absolute right-[9%] bottom-[6%] z-10 w-[22%] opacity-0" />} className="w-[min(88vw,44svh,29rem)] origin-center transition-[transform,filter] duration-280 hover:scale-[1.025] hover:drop-shadow-[0_16px_20px_#1a0d09a6]" contenidoClassName="font-[Palatino_Linotype,Book_Antiqua,Palatino,Georgia,serif] leading-[1.45] text-[#482b19] opacity-92 text-shadow-[.2px_0_currentColor]">
          <article>
            <h3 className="mb-[clamp(12px,2.5vh,24px)] font-[Copperplate,Copperplate_Gothic_Light,Palatino_Linotype,Georgia,serif] text-[clamp(18px,3.6vw,28px)] leading-[1.15] tracking-[.035em] text-[#382011]">{contenido.titulo}</h3>
            <RelatoResultado key={`${contenido.titulo}:${contenido.texto}`} texto={contenido.texto} efectos={efectos} onEfectosCompletos={() => setSelloListo(true)} />
          </article>
      </PapelUi>

      <div className="mt-2.5 flex w-[min(88vw,29rem)] flex-wrap justify-center gap-2 max-[480px]:[&_.boton-narrativo]:basis-full">
        {onContinuar && selloTerminado === identidad && <div ref={botonContinuar} className="max-[480px]:w-full"><BotonNarrativo disabled={continuando} onClick={onContinuar}>{continuando ? 'Continuando...' : 'Continuar'}</BotonNarrativo></div>}
        {onVerEstadisticas && <BotonNarrativo disabled={cargandoEstadisticas} onClick={onVerEstadisticas}>{cargandoEstadisticas ? 'Cargando estadisticas...' : 'Ver estadisticas'}</BotonNarrativo>}
        {esFinal && onTerminar && <BotonNarrativo disabled={reiniciando} onClick={onTerminar}>{reiniciando ? 'Reiniciando...' : 'Terminar prueba'}</BotonNarrativo>}
      </div>
    </section>
  );
}

interface EfectoResultado { texto: string; tipo: 'positivo' | 'negativo' | 'neutro' }

/** El relato termina antes de revelar, en orden, las consecuencias confirmadas. */
function RelatoResultado({ texto, efectos, onEfectosCompletos }: { texto: string; efectos: EfectoResultado[]; onEfectosCompletos: () => void }) {
  const raiz = useRef<HTMLDivElement>(null);
  const animacion = useRef<AnimacionTexto | null>(null);
  const [lecturaCompleta, setLecturaCompleta] = useState(false);
  const alTerminar = useRef(onEfectosCompletos);
  alTerminar.current = onEfectosCompletos;

  useLayoutEffect(() => {
    if (!raiz.current) return;
    const escritura = new AnimacionTexto(raiz.current, () => setLecturaCompleta(true));
    animacion.current = escritura;
    escritura.escribirTexto('resultado');
    return () => { animacion.current = null; escritura.destruir(); };
  }, [texto]);

  useLayoutEffect(() => {
    if (!lecturaCompleta || !raiz.current) return;
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const contexto = gsap.context(() => {
      const elementos = raiz.current!.querySelectorAll<HTMLElement>('.resultado-efecto');
      const secuencia = gsap.timeline({ onComplete: () => alTerminar.current() });
      elementos.forEach((elemento, indice) => {
        const ganancia = elemento.classList.contains('resultado-efecto--positivo');
        const perdida = elemento.classList.contains('resultado-efecto--negativo');
        const brillo = ganancia ? '0 0 20px #52e66e' : perdida ? '0 0 16px #75001f' : '0 0 8px #b58a55';
        const final = ganancia ? '0 0 8px #87c978' : perdida ? '0 1px 3px #4b122333' : '0 0 0px transparent';
        secuencia.fromTo(elemento,
          { opacity: 0, scale: reducido || perdida ? 1 : 1.28, y: reducido || perdida ? 0 : -5, textShadow: reducido ? final : brillo },
          { opacity: 1, scale: 1, y: 0, textShadow: final, duration: reducido ? 0 : .55, ease: 'power3.out' },
          reducido ? 0 : indice * 1.05);
        // El corte separa las dos mitades y deja visible la pérdida.
        const corte = elemento.querySelector('.resultado-efecto__corte');
        if (perdida && corte && !reducido) {
          const inicio = indice * 1.05;
          secuencia.fromTo(corte, { scaleX: 0, opacity: 1 },
            { scaleX: 1, duration: .14, ease: 'power2.inOut' }, inicio + .22)
            .to(corte, { opacity: 0, duration: .3, ease: 'power2.out' }, inicio + .39)
            .to(elemento.querySelector('.resultado-efecto__mitad--superior'), { x: -2, y: -1, duration: .45, ease: 'power2.out' }, inicio + .32)
            .to(elemento.querySelector('.resultado-efecto__mitad--inferior'), { x: 2, y: 1, duration: .45, ease: 'power2.out' }, inicio + .32);
        }
      });
    }, raiz);
    return () => contexto.revert();
  }, [lecturaCompleta]);

  return <div ref={raiz}>
    <button type="button" className="resultado-pergamino__relato block w-full border-0 bg-transparent p-0 text-center text-[clamp(14px,2.5vw,19px)] text-inherit focus-visible:outline-2 focus-visible:outline-[#694529]"
      onClick={() => animacion.current?.acelerarTexto()} aria-label={lecturaCompleta ? undefined : 'Acelerar lectura del resultado'}>
      <span className="dialogo-narrativo__revelado relative block" data-texto={texto}>
        <span className="dialogo-narrativo__texto-visible absolute inset-0" aria-hidden="true"><span className="dialogo-narrativo__caracteres" /><span className="dialogo-narrativo__cursor inline-block h-[1em] w-0 align-text-bottom" /></span>
        <span className="sr-only">{texto}</span>
      </span>
    </button>
    <div className="mt-[clamp(16px,3vh,28px)] border-t border-[#6e442777] pt-3 text-[clamp(15px,2.6vw,20px)] font-bold whitespace-pre-line" aria-live="polite" aria-hidden={!lecturaCompleta} style={{ visibility: lecturaCompleta ? 'visible' : 'hidden' }}>
      {efectos.map((efecto, indice) => <div key={indice} className={`resultado-efecto resultado-efecto--${efecto.tipo}`}>{efecto.tipo === 'negativo' ? <>
        <span className="sr-only">{efecto.texto}</span>
        <span className="resultado-efecto__fragmentos" aria-hidden="true">
          <span className="resultado-efecto__reserva">{efecto.texto}</span>
          <span className="resultado-efecto__mitad resultado-efecto__mitad--superior">{efecto.texto}</span>
          <span className="resultado-efecto__mitad resultado-efecto__mitad--inferior">{efecto.texto}</span>
          <span className="resultado-efecto__corte" />
        </span>
      </> : efecto.texto}</div>)}
    </div>
  </div>;
}
