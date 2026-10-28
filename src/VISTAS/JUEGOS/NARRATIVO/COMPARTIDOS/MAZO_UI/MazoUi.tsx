import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import BotonNarrativo from '../BOTON_NARRATIVO/BotonNarrativo';
import PapelUi from '../PAPEL_UI/PapelUi';
import CartaNarrativa from '../../ETAPA_0_1_SELECCIONAR_CARTAS/CartaSeleccionableEtapa0y1';

// Abre el inventario y permite ocultar su cantidad junto con los demas numeros del juego.
export default function MazoUi({ cartas = [], personajes = [], mostrarCantidad = true }: { cartas?: any[]; personajes?: any[]; mostrarCantidad?: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const cantidad = cartas.length + personajes.length;

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (evento: KeyboardEvent) => evento.key === 'Escape' && setAbierto(false);
    document.addEventListener('keydown', cerrar);
    return () => document.removeEventListener('keydown', cerrar);
  }, [abierto]);

  return (
    <>
      <button className="mazo-ui inline-flex min-h-[42px] cursor-pointer items-center gap-2 rounded-[3px] border border-[#8f6d3f] bg-[linear-gradient(180deg,#251d17ef,#17120fef)] px-[11px] py-[7px] font-[Palatino_Linotype,Palatino,Georgia,serif] text-sm text-[#f1e1bd] shadow-[inset_0_0_0_1px_#f2d59a12,0_3px_8px_#0005] hover:border-[#d1ac68] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#e6c57e] max-md:mr-auto max-md:w-[42px] max-md:min-w-[42px] max-md:justify-center max-md:px-2" title="Abrir posesiones" aria-label="Abrir posesiones" onClick={() => setAbierto(true)} type="button">
        <span className="relative h-[23px] w-[17px] rounded-sm border border-[#d1ac68] bg-[#3a2a1d] shadow-[-3px_2px_0_#17110d,-3px_2px_0_1px_#8f6d3f]" aria-hidden="true"><span className="absolute inset-1 border border-[#d1ac6877]" /></span>
        <span className="max-md:hidden">Mazo</span>
        {mostrarCantidad ? <strong className="text-[15px] text-[#fff3d2] max-md:hidden">{cantidad}</strong> : null}
      </button>

      {abierto ? createPortal(
        <div className="fixed inset-0 z-[3000] grid place-items-center overflow-auto bg-[#07050491] p-3 backdrop-blur-[9px]" role="dialog" aria-modal="true" aria-labelledby="mazo-titulo" onMouseDown={() => setAbierto(false)}>
          <div onMouseDown={(evento) => evento.stopPropagation()}>
            <PapelUi className="w-[min(92vw,61svh,44rem)]" contenidoClassName="flex flex-col gap-[14px] text-center font-[Palatino_Linotype,Palatino,Georgia,serif] text-[#432918]">
              <header className="flex items-center justify-center gap-2.5 border-b border-[#6e442777]">
                <h2 className="mb-2 text-[clamp(20px,4vw,30px)]" id="mazo-titulo">Posesiones</h2>
                {mostrarCantidad ? <span className="grid size-[25px] place-items-center rounded-full border border-[#79502e]">{cantidad}</span> : null}
              </header>

              <div className="grid gap-2.5 overflow-y-auto text-left">
                {personajes.length ? <section>
                  <h3 className="mb-1.5 text-center">Corte</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {personajes.map((personaje) => <CartaNarrativa key={personaje.id || personaje._id} carta={personaje} soloLectura />)}
                  </div>
                </section> : null}

                {cartas.length ? <section>
                  <h3 className="mb-1.5 text-center">Cartas</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {cartas.map((carta) => <CartaNarrativa key={carta.id || carta._id} carta={carta} soloLectura />)}
                  </div>
                </section> : null}

                {!cantidad ? <p className="my-auto text-center">Todavia no tienes posesiones.</p> : null}
              </div>

              <BotonNarrativo className="self-center" onClick={() => setAbierto(false)}>Cerrar</BotonNarrativo>
            </PapelUi>
          </div>
        </div>,
        document.body
      ) : null}
    </>
  );
}
