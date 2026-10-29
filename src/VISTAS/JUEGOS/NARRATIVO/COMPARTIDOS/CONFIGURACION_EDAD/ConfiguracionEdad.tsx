/* Permite guardar la edad para adaptar la experiencia narrativa. */
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ADAPTACION_EDAD_HABILITADA, REGLAS_EDAD } from '../../../../../config/adaptacionEdad';
import BotonNarrativo from '../BOTON_NARRATIVO/BotonNarrativo';
import PapelUi from '../PAPEL_UI/PapelUi';

// Permite guardar la edad localmente y cambiarla cuando sea necesario.
export default function ConfiguracionEdad({ edad, onGuardar }: { edad: number | null; onGuardar: (edad: number) => void }) {
  const [abierto, setAbierto] = useState(edad === null);
  const [valor, setValor] = useState(edad || REGLAS_EDAD.edadMayor);

  if (!ADAPTACION_EDAD_HABILITADA) return null;

  // Confirma la selección y avisa a la pantalla que continúa.
  const guardar = () => {
    onGuardar(valor);
    setAbierto(false);
  };

  return <>
    <button className="edad-ui min-h-[42px] cursor-pointer rounded-[3px] border border-[#8f6d3f] bg-[#1b1511ef] px-[11px] py-[7px] font-[Palatino_Linotype,Palatino,Georgia,serif] text-[#f1e1bd] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#e6c57e] max-md:min-w-[42px] max-md:px-[7px] max-md:text-xs" type="button" onClick={/* Responde a click desde este control. */ () => setAbierto(true)}>Edad {edad || '?'}</button>
    {abierto ? createPortal(
      <div className="fixed inset-0 z-[3100] grid place-items-center bg-[#07050491] p-3 backdrop-blur-[9px]" role="dialog" aria-modal="true" aria-labelledby="edad-titulo" onClick={/* Responde a click desde este control. */ event => { if (event.target === event.currentTarget) setAbierto(false); }}>
        <PapelUi className="w-[min(92vw,58svh,34rem)]" contenidoClassName="flex flex-col justify-center gap-4 text-center font-[Palatino_Linotype,Palatino,Georgia,serif] text-[#432918]">
          <h2 className="m-0 text-[clamp(24px,5vw,34px)]" id="edad-titulo">Configura tu experiencia</h2>
          <p className="m-0 text-[clamp(17px,3vw,20px)] leading-normal">Indica tu edad para adaptar la claridad y el ritmo de los juegos.</p>
          <output className="text-[clamp(28px,7vw,42px)] font-bold" htmlFor="edad-rango">{valor} años</output>
          <input className="min-h-11 w-full cursor-pointer accent-[#6d4327]"
            id="edad-rango"
            type="range"
            min={REGLAS_EDAD.edadMinima}
            max={REGLAS_EDAD.edadMaxima}
            value={valor}
            onChange={/* Responde a change desde este control. */ (evento) => setValor(Number(evento.target.value))}
          />
          <div className="-mt-4 flex justify-between"><span>{REGLAS_EDAD.edadMinima}</span><span>{REGLAS_EDAD.edadMaxima}</span></div>
          <BotonNarrativo className="min-h-[52px] self-center text-lg" onClick={guardar}>Guardar edad</BotonNarrativo>
        </PapelUi>
      </div>, document.body
    ) : null}
  </>;
}
