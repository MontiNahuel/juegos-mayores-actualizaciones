import { useState } from 'react';
import marcoEvento from '../../../../../assets/narrative/event-title.png';
import './tituloNarrativo.css';

// Compartido por eventos y conversaciones. La entrada espera a que el marco este cargado.
export default function TituloNarrativo({ titulo, listo = true, permanente = false, variante = 'conversacion', onTerminar }: { titulo: string; listo?: boolean; permanente?: boolean; variante?: 'conversacion' | 'evento'; onTerminar?: () => void }) {
  const [marcoListo, setMarcoListo] = useState(false);
  const [terminado, setTerminado] = useState(false);
  const [marcoFallido, setMarcoFallido] = useState(false);

  return (
    <header className="titulo-narrativo" data-intro={listo && (marcoListo || marcoFallido) ? 'listo' : 'cargando'} data-permanente={permanente} data-variante={variante} data-marco={marcoFallido ? 'fallido' : 'imagen'}>
      {/* Mantiene el titulo accesible incluso despues de la salida visual del marco. */}
      <h2 className="sr-only">{titulo}</h2>
      <div className="titulo-narrativo__espacio">
        <div className="titulo-narrativo__arte" aria-hidden="true" hidden={terminado && !permanente} onAnimationEnd={(evento) => {
          if (evento.currentTarget !== evento.target || permanente) return;
          setTerminado(true);
          onTerminar?.();
        }}>
          {!marcoFallido && variante === 'evento' ? <span className="titulo-narrativo__evento-marco" style={{ borderImageSource: `url(${marcoEvento})` }}>
            {/* Precarga el PNG; el CSS lo divide en nueve partes para expandir el centro. */}
            <img src={marcoEvento} alt="" onLoad={() => setMarcoListo(true)} onError={() => setMarcoFallido(true)} />
          </span> : null}
          {!marcoFallido && variante === 'conversacion' ? <img className="titulo-narrativo__conversacion-imagen" src="/assets/narrative/conversation-title.png" alt="" onLoad={() => setMarcoListo(true)} onError={() => setMarcoFallido(true)} /> : null}
          <p>{titulo}</p>
        </div>
      </div>
    </header>
  );
}
