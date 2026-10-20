import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ADAPTACION_EDAD_HABILITADA, REGLAS_EDAD } from '../../../../../config/adaptacionEdad';
import BotonNarrativo from '../BOTON_NARRATIVO/BotonNarrativo';
import PapelUi from '../PAPEL_UI/PapelUi';
import './configuracionEdad.css';

// Permite guardar la edad localmente y cambiarla cuando sea necesario.
export default function ConfiguracionEdad({ edad, onGuardar }: { edad: number | null; onGuardar: (edad: number) => void }) {
  const [abierto, setAbierto] = useState(edad === null);
  const [valor, setValor] = useState(edad || REGLAS_EDAD.edadMayor);

  if (!ADAPTACION_EDAD_HABILITADA) return null;

  const guardar = () => {
    onGuardar(valor);
    setAbierto(false);
  };

  return <>
    <button className="edad-ui" type="button" onClick={() => setAbierto(true)}>Edad {edad || '?'}</button>
    {abierto ? createPortal(
      <div className="edad-modal" role="dialog" aria-modal="true" aria-labelledby="edad-titulo">
        <PapelUi className="edad-modal__papel" contenidoClassName="edad-modal__contenido">
          <h2 id="edad-titulo">Configura tu experiencia</h2>
          <p>Indica tu edad para adaptar la claridad y el ritmo de los juegos.</p>
          <output htmlFor="edad-rango">{valor} años</output>
          <input
            id="edad-rango"
            type="range"
            min={REGLAS_EDAD.edadMinima}
            max={REGLAS_EDAD.edadMaxima}
            value={valor}
            onChange={(evento) => setValor(Number(evento.target.value))}
          />
          <div className="edad-modal__limites"><span>{REGLAS_EDAD.edadMinima}</span><span>{REGLAS_EDAD.edadMaxima}</span></div>
          <BotonNarrativo onClick={guardar}>Guardar edad</BotonNarrativo>
        </PapelUi>
      </div>, document.body
    ) : null}
  </>;
}
