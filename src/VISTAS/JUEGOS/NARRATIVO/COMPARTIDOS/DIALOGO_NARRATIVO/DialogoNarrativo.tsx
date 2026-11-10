/* Presenta los textos y las intervenciones de los personajes. */
import { useLayoutEffect, useRef, type ReactNode } from 'react';
import BotonNarrativo from '../BOTON_NARRATIVO/BotonNarrativo';

export interface OpcionDialogoNarrativo {
  id: string | number;
  texto: string;
  onElegir: () => void;
  disabled?: boolean;
}

interface Props {
  titulo?: string;
  texto: ReactNode;
  indicacion?: string;
  opciones?: OpcionDialogoNarrativo[];
  complemento?: ReactNode;
  onContinuar?: () => void;
  listo?: boolean;
  className?: string;
  intervencion?: string;
}

// Mantiene el panel de lectura mientras cambia su contenido o las opciones disponibles.
export default function DialogoNarrativo({
  titulo, texto, indicacion, opciones = [], complemento, onContinuar,
  listo = true, className = '', intervencion,
}: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const intervencionAnterior = useRef(intervencion);
  // Sincroniza foco y scroll antes de pintar la nueva intervención, sin repetir la introducción.
  useLayoutEffect(() => {
    if (intervencion && intervencionAnterior.current !== intervencion && panel.current) {
      panel.current.scrollTop = 0;
      panel.current.focus({ preventScroll: true });
    }
    intervencionAnterior.current = intervencion;
  }, [intervencion]);

  // Lectura vertical uniforme: hablante, texto e indicación comparten el mismo borde.
  const contenido = <>
    {titulo ? <h2 className="dialogo-narrativo__titulo m-0 text-lg font-bold leading-tight text-[#e6bd77]">{titulo}</h2> : null}
    <p className="dialogo-narrativo__texto m-0 mt-1 whitespace-pre-wrap text-base leading-snug [overflow-wrap:anywhere] sm:text-lg">{texto}</p>
    {indicacion ? <p className="dialogo-narrativo__indicacion m-0 mt-2 text-sm text-[#bc965d]">{indicacion}</p> : null}
  </>;

  return (
    <div
      ref={panel}
      tabIndex={intervencion ? -1 : undefined}
      role={intervencion ? 'region' : undefined}
      aria-label={intervencion ? 'Diálogo' : undefined}
      className={`dialogo-narrativo narrativo-fade-dialogo relative z-30 shrink-0 border-t border-[#a88650]/60 bg-[#080910]/95 px-4 py-2 text-[#eaddc5] sm:px-6 sm:py-3 md:px-10 ${className}`}
      data-intro={listo ? 'listo' : 'cargando'}
      style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
    >
      <div key={intervencion} className={`dialogo-narrativo__interior w-full${intervencion ? ' dialogo-narrativo__intervencion' : ''}`}>
        <div className="dialogo-narrativo__cabecera relative flex flex-col gap-1">
          {onContinuar ? (
            <button type="button" className="dialogo-narrativo__continuar block w-full cursor-pointer border-0 bg-transparent p-0 text-left text-inherit focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400" onClick={onContinuar}>{contenido}</button>
          ) : <div>{contenido}</div>}
          {complemento ? <div className="dialogo-narrativo__complemento order-first self-end">{complemento}</div> : null}
        </div>

        {opciones.length ? <div className="dialogo-narrativo__opciones mt-2 grid gap-2">
          {opciones.map((opcion) => (
            <BotonNarrativo
              key={opcion.id}
              className="boton-narrativo--decision block w-full !min-h-0 !px-4 !py-2 text-left whitespace-normal"
              disabled={opcion.disabled}
              onClick={opcion.onElegir}
            >
              {opcion.texto}
            </BotonNarrativo>
          ))}
        </div> : null}
      </div>
    </div>
  );
}
