// Muestra el resultado de una decision o el cierre de la partida.
import type { FinalizacionApi, ResultadoApi } from '../narrativeService';
import TituloNarrativo from '../COMPARTIDOS/TITULO_NARRATIVO/TituloNarrativo';
import BotonNarrativo from '../COMPARTIDOS/BOTON_NARRATIVO/BotonNarrativo';
import PapelUi from '../COMPARTIDOS/PAPEL_UI/PapelUi';

// ETAPA 4: muestra el resultado del evento o el cierre de la partida.
export default function MostrarResultadoEtapa4({ resultado, finalizacion, efectoTexto, onContinuar, onVerEstadisticas, cargandoEstadisticas, onTerminar, reiniciando }: {
  resultado?: ResultadoApi;
  finalizacion?: FinalizacionApi;
  efectoTexto?: string;
  onContinuar?: () => void;
  onVerEstadisticas?: () => void;
  cargandoEstadisticas?: boolean;
  onTerminar?: () => void;
  reiniciando?: boolean;
}) {
  const esFinal = Boolean(finalizacion);
  const contenido = finalizacion || resultado;

  if (!contenido) return null;

  const tipo = finalizacion
    ? finalizacion.tipo === 'victoria_tiempo' ? 'positivo' : 'negativo'
    : resultado?.tipo_resultado || 'neutro';
  const efecto = efectoTexto || (finalizacion
    ? finalizacion.rango ? `Rango final: ${finalizacion.rango}` : 'Partida finalizada'
    : resultado?.efectos.map(({ accion }) => `${accion.valor > 0 ? '+' : ''}${accion.valor} ${accion.clave}`).join(', ') || 'Sin cambios');

  return (
    <section className="flex min-h-full w-full flex-col items-center text-center text-[#25170d] [&>.titulo-narrativo]:w-full">
      <TituloNarrativo titulo="Resultado" permanente variante="evento" />

      <PapelUi className="w-[min(88vw,44svh,29rem)] origin-center transition-[transform,filter] duration-280 hover:scale-[1.025] hover:drop-shadow-[0_16px_20px_#1a0d09a6]" contenidoClassName="font-[Palatino_Linotype,Book_Antiqua,Palatino,Georgia,serif] leading-[1.45] text-[#482b19] opacity-92 mix-blend-multiply text-shadow-[.2px_0_currentColor]">
          <article>
            <h3 className="mb-[clamp(12px,2.5vh,24px)] font-[Copperplate,Copperplate_Gothic_Light,Palatino_Linotype,Georgia,serif] text-[clamp(18px,3.6vw,28px)] leading-[1.15] tracking-[.035em] text-[#382011]">{contenido.titulo}</h3>
            <p className="resultado-pergamino__relato m-0 text-[clamp(14px,2.5vw,19px)]">{contenido.texto}</p>
            <p className={`mt-[clamp(16px,3vh,28px)] border-t border-[#6e442777] pt-3 text-[clamp(13px,2.2vw,17px)] font-bold whitespace-pre-line ${tipo === 'positivo' ? 'text-[#31592e]' : tipo === 'negativo' ? 'text-[#792f25]' : 'text-[#53351f]'}`}>{efecto}</p>
          </article>
      </PapelUi>

      <div className="mt-2.5 flex w-[min(88vw,29rem)] flex-wrap justify-center gap-2 max-[480px]:[&_.boton-narrativo]:basis-full">
        {onContinuar && <BotonNarrativo onClick={onContinuar}>Continuar</BotonNarrativo>}
        {onVerEstadisticas && <BotonNarrativo disabled={cargandoEstadisticas} onClick={onVerEstadisticas}>{cargandoEstadisticas ? 'Cargando estadisticas...' : 'Ver estadisticas'}</BotonNarrativo>}
        {esFinal && onTerminar && <BotonNarrativo disabled={reiniciando} onClick={onTerminar}>{reiniciando ? 'Reiniciando...' : 'Terminar prueba'}</BotonNarrativo>}
      </div>
    </section>
  );
}
