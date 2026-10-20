import { useState } from 'react';
import './cartas.css';

// El marco transparente deja la ilustracion y el texto dentro del ornamento.
export default function CartaSeleccionableEtapa0y1({ carta, selected = false, disabled = false, onSelect, soloLectura = false }: any) {
  const [imagenFallida, setImagenFallida] = useState<string | null>(null);
  const mostrarImagen = Boolean(carta.imagen && carta.imagen !== imagenFallida);
  const esItem = Boolean(carta.categoria);
  // Los items invierten nombre/categoria para respetar las zonas limitadas del marco.
  const etiquetaInterior = esItem ? carta.nombre : carta.titulo;
  const etiquetaMarco = esItem ? carta.categoria : carta.nombre;
  const contenido = <>
    <span className="carta-narrativa__interior" data-imagen={mostrarImagen}>
      {mostrarImagen ? <img alt="" className="carta-narrativa__imagen" src={carta.imagen} onError={() => setImagenFallida(carta.imagen)} /> : null}
      <span className="carta-narrativa__contenido">
        {etiquetaInterior ? <span className="carta-narrativa__categoria">{etiquetaInterior}</span> : null}
        <span className="carta-narrativa__texto">{carta.descripcion || carta.texto}</span>
      </span>
    </span>
    <img alt="" aria-hidden="true" className="carta-narrativa__marco" src="/assets/narrative/card-frame.png" />
    <span className="carta-narrativa__nombre">{etiquetaMarco}</span>
    {selected ? <span className="carta-narrativa__seleccion" aria-label="Seleccionada">✓</span> : null}
  </>;

  if (soloLectura) return <article className="carta-narrativa carta-narrativa--lectura">{contenido}</article>;

  return (
    <button aria-pressed={selected} className="carta-narrativa" data-selected={selected} disabled={disabled} onClick={onSelect} type="button">
      {contenido}
    </button>
  );
}
