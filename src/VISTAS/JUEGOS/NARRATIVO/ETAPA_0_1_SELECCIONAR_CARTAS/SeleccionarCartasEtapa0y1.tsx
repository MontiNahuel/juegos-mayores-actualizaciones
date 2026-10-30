/* Guía la elección de personajes y cartas antes de tomar decisiones. */
// Permite elegir las cartas de preparacion o la carta mensual.
import { useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import CartaSeleccionableEtapa0y1 from './CartaSeleccionableEtapa0y1';
import shuffleCartas from './shuffleCartas';
import BotonNarrativo from '../COMPARTIDOS/BOTON_NARRATIVO/BotonNarrativo';

// ETAPA 0 y 1: elige la corte inicial o una carta mensual.
export default function SeleccionarCartasEtapa0y1({ titulo, descripcion, cartas, cantidad, onConfirmar }: any) {
  const [seleccion, setSeleccion] = useState<any[]>([]);
  const [confirmando, setConfirmando] = useState(false);
  const mazo = useRef<HTMLDivElement>(null);
  const tanda = `${titulo}:${cartas.map(/* Prepara el resultado de cada elemento. */ (carta: any) => carta.id).join(',')}`;

  // Reparte antes de pintar cada tanda nueva; seleccionar una carta no reinicia el shuffle.
  useLayoutEffect(/* Ajusta la vista antes de mostrar el cambio. */ () => shuffleCartas(mazo.current), [tanda]);

  // Agrega o quita una carta sin superar la cantidad pedida.
  const seleccionar = (carta: any) => {
    const esta = seleccion.some(/* Comprueba si algún elemento cumple esta condición. */ (item) => item.id === carta.id);

    setSeleccion(
      esta
        ? seleccion.filter(/* Conserva los elementos que cumplen esta condición. */ (item) => item.id !== carta.id)
        : seleccion.length < cantidad
          ? [...seleccion, carta]
          : seleccion
    );
  };

  // Confirma solamente cuando se completo la cantidad requerida.
  const guardar = async () => {
    if (confirmando || seleccion.length !== cantidad) return;

    setConfirmando(true);
    try {
      await onConfirmar(seleccion);
    } finally {
      setConfirmando(false);
    }
  };

  return (
    <section className="my-auto w-full text-center text-white max-md:my-0" style={{ '--columnas': Math.max(1, Math.min(cartas.length, 6)) } as CSSProperties}>
      <header className="w-full text-center">
      <h2 className="m-0 text-2xl font-bold max-md:text-base max-md:font-normal">
        {titulo}
      </h2>

      <p className="mt-1 text-slate-200">
        {descripcion}
      </p>

      <p className="mt-1 mb-0 text-[13px] text-[#e1d8bb]">
        {seleccion.length} de {cantidad} seleccionados
      </p>
      </header>

      <div ref={mazo} className="mx-auto my-4 grid w-[clamp(150px,55vw,210px)] grid-cols-1 items-start justify-center gap-3 md:w-full md:[grid-template-columns:repeat(var(--columnas),minmax(0,1fr))] md:[max-width:min(100%,calc(var(--columnas)*min(220px,(100svh-240px)*2/3)))]">
        {cartas.map(/* Prepara el resultado de cada elemento. */ (carta: any) => {
          const selected = seleccion.some(/* Comprueba si algún elemento cumple esta condición. */ (item) => item.id === carta.id);

          return (
            <CartaSeleccionableEtapa0y1
              key={carta.id}
              carta={carta}
              selected={selected}
              disabled={confirmando || (!selected && seleccion.length === cantidad)}
              onSelect={/* Responde a select desde este control. */ () => seleccionar(carta)}
            />
          );
        })}
      </div>

      <div className="mx-auto w-[clamp(150px,55vw,210px)] text-center md:w-auto">
        <BotonNarrativo
          className="max-md:w-full"
          disabled={confirmando || seleccion.length !== cantidad}
          onClick={guardar}
        >
          {confirmando ? 'Confirmando...' : 'Confirmar selección'}
        </BotonNarrativo>
      </div>
    </section>
  );
}
