import { useState } from 'react';
import marcoEvento from '../../../../assets/narrative/event-title.png';
import './tituloNarrativo.css';

// Compartido por eventos y conversaciones. La entrada espera a que el marco este cargado.
export default function TituloNarrativo({ titulo, listo = true, permanente = false, variante = 'conversacion' }: { titulo: string; listo?: boolean; permanente?: boolean; variante?: 'conversacion' | 'evento' }) {
  const [marcoListo, setMarcoListo] = useState(false);
  const [terminado, setTerminado] = useState(false);
  const [marcoFallido, setMarcoFallido] = useState(false);

  return (
    <header className="titulo-narrativo" data-intro={listo && (marcoListo || marcoFallido) ? 'listo' : 'cargando'} data-permanente={permanente} data-variante={variante} data-marco={marcoFallido ? 'fallido' : 'imagen'}>
      {/* Mantiene el titulo accesible incluso despues de la salida visual del marco. */}
      <h2 className="sr-only">{titulo}</h2>
      <div className="titulo-narrativo__espacio">
        <div className="titulo-narrativo__arte" aria-hidden="true" hidden={terminado && !permanente} onAnimationEnd={() => { if (!permanente) setTerminado(true); }}>
          {!marcoFallido && <img src={variante === 'evento' ? marcoEvento : '/assets/narrative/conversation-title.png'} alt="" onLoad={() => setMarcoListo(true)} onError={() => setMarcoFallido(true)} />}
          <p>{titulo}</p>
        </div>
      </div>
    </header>
  );
}
