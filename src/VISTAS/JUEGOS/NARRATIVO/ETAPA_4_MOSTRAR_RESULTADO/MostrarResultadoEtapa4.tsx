/* Cuenta qué pasó después de la decisión y permite continuar. */
// Muestra el resultado de una decision o el cierre de la partida.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { FinalizacionApi, ResultadoApi } from '../narrativeService';
import TituloNarrativo from '../COMPARTIDOS/TITULO_NARRATIVO/TituloNarrativo';
import BotonNarrativo from '../COMPARTIDOS/BOTON_NARRATIVO/BotonNarrativo';
import PapelUi from '../COMPARTIDOS/PAPEL_UI/PapelUi';
import RelatoResultado, { type EfectoResultado } from './RelatoResultado';

// ETAPA 4: muestra el resultado del evento o el cierre de la partida.
export default function MostrarResultadoEtapa4({ resultado, finalizacion, efectoTexto, animarSalida = false, continuando = false, onContinuar, onVerEstadisticas, cargandoEstadisticas, onTerminar, reiniciando }: {
  resultado?: ResultadoApi;
  finalizacion?: FinalizacionApi;
  efectoTexto?: string;
  animarSalida?: boolean;
  continuando?: boolean;
  onContinuar?: () => void;
  onVerEstadisticas?: () => void;
  cargandoEstadisticas?: boolean;
  onTerminar?: () => void;
  reiniciando?: boolean;
}) {
  const [saliendo, setSaliendo] = useState(false);
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
  const temporizador = useRef<number | null>(null);
  useEffect(/* Sincroniza este efecto cuando cambian los datos de los que depende. */ () => /* Completa este paso con los datos recibidos por la operación. */ () => { if (temporizador.current !== null) window.clearTimeout(temporizador.current); }, []);

  // Retira el pergamino antes de mostrar la corte; nunca duplica ni descarga su imagen.
  const continuar = () => {
    if (!onContinuar || saliendo || continuando) return;
    if (!animarSalida || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return onContinuar();
    setSaliendo(true);
    temporizador.current = window.setTimeout(onContinuar, 650);
  };

  const esFinal = Boolean(finalizacion);
  const contenido = finalizacion || resultado;

  if (!contenido) return null;

  const tipo = finalizacion
    ? finalizacion.tipo === 'victoria_tiempo' ? 'positivo' : 'negativo'
    : resultado?.tipo_resultado || 'neutro';
  const efectos: EfectoResultado[] = efectoTexto
    ? [{ texto: efectoTexto, tipo: 'neutro' }]
    : finalizacion
      ? [{ texto: finalizacion.rango ? `Rango final: ${finalizacion.rango}` : 'Partida finalizada', tipo }]
      : resultado?.efectos.length
        ? resultado.efectos.map(({ accion }) => ({
          texto: `${accion.valor > 0 ? '+' : ''}${accion.valor} ${accion.clave}`,
          tipo: accion.valor > 0 ? 'positivo' : accion.valor < 0 ? 'negativo' : 'neutro',
        }))
        : [{ texto: 'Sin cambios', tipo: 'neutro' }];

  return (
    <section className={`flex min-h-full w-full flex-col items-center text-center text-[#25170d] motion-safe:transition-opacity motion-safe:duration-[650ms] [&>.titulo-narrativo]:w-full ${saliendo ? 'opacity-0' : ''}`}>
      <TituloNarrativo titulo="Resultado" permanente variante="evento" />

      <PapelUi overlay={<img ref={sello} src="/assets/narrative/sello-resultado.png" alt="" aria-hidden="true" className="pointer-events-none absolute right-[9%] bottom-[6%] z-10 w-[22%] opacity-0" />} className="w-[min(88vw,44svh,29rem)] origin-center transition-[transform,filter] duration-280 hover:scale-[1.025] hover:drop-shadow-[0_16px_20px_#1a0d09a6]" contenidoClassName="font-[Palatino_Linotype,Book_Antiqua,Palatino,Georgia,serif] leading-[1.45] text-[#482b19] opacity-92 text-shadow-[.2px_0_currentColor]">
          <article>
            <h3 className="mb-[clamp(12px,2.5vh,24px)] font-[Copperplate,Copperplate_Gothic_Light,Palatino_Linotype,Georgia,serif] text-[clamp(18px,3.6vw,28px)] leading-[1.15] tracking-[.035em] text-[#382011]">{contenido.titulo}</h3>
            <RelatoResultado key={`${contenido.titulo}:${contenido.texto}`} texto={contenido.texto} efectos={efectos} onEfectosCompletos={() => setSelloListo(true)} />
          </article>
      </PapelUi>

      <div className="mt-2.5 flex w-[min(88vw,29rem)] flex-wrap justify-center gap-2 max-[480px]:[&_.boton-narrativo]:basis-full">
        {onContinuar && selloTerminado === identidad && <div ref={botonContinuar} className="max-[480px]:w-full"><BotonNarrativo disabled={saliendo || continuando} onClick={continuar}>{continuando ? 'Continuando...' : 'Continuar'}</BotonNarrativo></div>}
        {onVerEstadisticas && <BotonNarrativo disabled={cargandoEstadisticas} onClick={onVerEstadisticas}>{cargandoEstadisticas ? 'Cargando estadisticas...' : 'Ver estadisticas'}</BotonNarrativo>}
        {esFinal && onTerminar && <BotonNarrativo disabled={reiniciando} onClick={onTerminar}>{reiniciando ? 'Reiniciando...' : 'Terminar prueba'}</BotonNarrativo>}
      </div>
    </section>
  );
}
