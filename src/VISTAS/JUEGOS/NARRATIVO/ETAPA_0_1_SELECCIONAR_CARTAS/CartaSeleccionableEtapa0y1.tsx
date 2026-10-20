import { useState } from 'react';
import './cartas.css';

export interface ContenidoCarta {
  id: string;
  nombre: string;
  descripcion?: string;
  texto?: string;
  categoria?: string;
  titulo?: string;
  imagen?: string | null;
}

interface Props {
  carta: ContenidoCarta;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}

// El marco transparente deja la ilustracion y el texto dentro del ornamento.
export default function CartaSeleccionableEtapa0y1({ carta, selected, disabled, onSelect }: Props) {
  const [imagenFallida, setImagenFallida] = useState<string | null>(null);
  const mostrarImagen = Boolean(carta.imagen && carta.imagen !== imagenFallida);

  return (
    <button aria-pressed={selected} className="carta-narrativa" data-selected={selected} disabled={disabled} onClick={onSelect} type="button">
      <span className="carta-narrativa__interior" data-imagen={mostrarImagen}>
        {mostrarImagen ? <img alt="" className="carta-narrativa__imagen" src={carta.imagen!} onError={() => setImagenFallida(carta.imagen!)} /> : null}
        <span className="carta-narrativa__contenido">
          {carta.categoria || carta.titulo ? <span className="carta-narrativa__categoria">{carta.categoria || carta.titulo}</span> : null}
          <span className="carta-narrativa__texto">{carta.descripcion || carta.texto}</span>
        </span>
      </span>
      <img alt="" aria-hidden="true" className="carta-narrativa__marco" src="/assets/narrative/card-frame.png" />
      <span className="carta-narrativa__nombre">{carta.nombre}</span>
      {selected ? <span className="carta-narrativa__seleccion" aria-label="Seleccionada">✓</span> : null}
    </button>
  );
}
