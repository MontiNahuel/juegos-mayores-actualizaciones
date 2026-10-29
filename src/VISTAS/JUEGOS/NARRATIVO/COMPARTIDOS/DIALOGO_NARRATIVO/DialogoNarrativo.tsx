/* Presenta los textos y las intervenciones de los personajes. */
import type { ReactNode } from 'react';
import BotonNarrativo from '../BOTON_NARRATIVO/BotonNarrativo';

export interface OpcionDialogoNarrativo {
  id: string | number;
  texto: string;
  onElegir: () => void;
}

// Unifica relato, avance y decisiones; cada etapa aporta sólo sus datos.
export default function DialogoNarrativo({ titulo, texto, indicacion, opciones = [], complemento, onContinuar, listo = true, className = '' }: {
  titulo?: string;
  texto: ReactNode;
  indicacion?: string;
  opciones?: OpcionDialogoNarrativo[];
  complemento?: ReactNode;
  onContinuar?: () => void;
  listo?: boolean;
  className?: string;
}) {
  // Lectura vertical uniforme: hablante, texto e indicación comparten el mismo borde.
  const contenido = <>
    {titulo ? <h2 className="dialogo-narrativo__titulo m-0 text-lg font-bold leading-tight text-[#e6bd77]">{titulo}</h2> : null}
    <p className="dialogo-narrativo__texto m-0 mt-1 whitespace-pre-wrap text-base leading-snug [overflow-wrap:anywhere] sm:text-lg">{texto}</p>
    {indicacion ? <p className="dialogo-narrativo__indicacion m-0 mt-2 text-sm text-[#bc965d]">{indicacion}</p> : null}
  </>;

  return (
    <div className={`dialogo-narrativo narrativo-fade-dialogo relative z-30 shrink-0 border-t border-[#a88650]/60 bg-[#080910]/95 px-4 py-2 text-[#eaddc5] sm:px-6 sm:py-3 md:px-10 ${className}`} data-intro={listo ? 'listo' : 'cargando'} style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
      <div className="dialogo-narrativo__interior w-full">
        <div className="dialogo-narrativo__cabecera relative flex flex-col gap-1">
          {onContinuar ? (
            <button type="button" className="dialogo-narrativo__continuar block w-full cursor-pointer border-0 bg-transparent p-0 text-left text-inherit focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400" onClick={onContinuar}>{contenido}</button>
          ) : <div>{contenido}</div>}
          {complemento ? <div className="dialogo-narrativo__complemento order-first self-end">{complemento}</div> : null}
        </div>

        {opciones.length ? <div className="dialogo-narrativo__opciones mt-2 grid gap-2">
          {opciones.map(/* Prepara el resultado de cada elemento. */ (opcion) => (
            <BotonNarrativo className="boton-narrativo--decision block w-full !min-h-0 !px-4 !py-2 text-left whitespace-normal" key={opcion.id} onClick={opcion.onElegir}>
              {opcion.texto}
            </BotonNarrativo>
          ))}
        </div> : null}
      </div>
    </div>
  );
}
