import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import BotonNarrativo from '../BOTON_NARRATIVO/BotonNarrativo';
import PapelUi from '../PAPEL_UI/PapelUi';
import CartaNarrativa from '../../ETAPA_0_1_SELECCIONAR_CARTAS/CartaSeleccionableEtapa0y1';
import './mazoUi.css';

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
      <button className="mazo-ui" title="Abrir posesiones" aria-label="Abrir posesiones" onClick={() => setAbierto(true)} type="button">
        <span className="mazo-ui__cartas" aria-hidden="true" />
        <span>Mazo</span>
        {mostrarCantidad ? <strong>{cantidad}</strong> : null}
      </button>

      {abierto ? createPortal(
        <div className="mazo-modal" role="dialog" aria-modal="true" aria-labelledby="mazo-titulo" onMouseDown={() => setAbierto(false)}>
          <div onMouseDown={(evento) => evento.stopPropagation()}>
            <PapelUi className="mazo-modal__papel" contenidoClassName="mazo-modal__contenido">
              <header className="mazo-modal__cabecera">
                <h2 id="mazo-titulo">Posesiones</h2>
                {mostrarCantidad ? <span>{cantidad}</span> : null}
              </header>

              <div className="mazo-modal__lista">
                {personajes.length ? <section>
                  <h3>Corte</h3>
                  <div className="mazo-modal__rejilla">
                    {personajes.map((personaje) => <CartaNarrativa key={personaje.id || personaje._id} carta={personaje} soloLectura />)}
                  </div>
                </section> : null}

                {cartas.length ? <section>
                  <h3>Cartas</h3>
                  <div className="mazo-modal__rejilla">
                    {cartas.map((carta) => <CartaNarrativa key={carta.id || carta._id} carta={carta} soloLectura />)}
                  </div>
                </section> : null}

                {!cantidad ? <p className="mazo-modal__vacio">Todavia no tienes posesiones.</p> : null}
              </div>

              <BotonNarrativo onClick={() => setAbierto(false)}>Cerrar</BotonNarrativo>
            </PapelUi>
          </div>
        </div>,
        document.body
      ) : null}
    </>
  );
}
