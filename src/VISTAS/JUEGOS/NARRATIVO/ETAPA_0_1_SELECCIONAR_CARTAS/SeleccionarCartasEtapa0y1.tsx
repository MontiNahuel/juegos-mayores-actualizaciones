// Permite elegir las cartas de preparacion o la carta mensual.
import { useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import CartaSeleccionableEtapa0y1 from './CartaSeleccionableEtapa0y1';
import shuffleCartas from './shuffleCartas';

// ETAPA 0 y 1: elige la corte inicial o una carta mensual.
export default function SeleccionarCartasEtapa0y1({ titulo, descripcion, cartas, cantidad, onConfirmar }: any) {
  const [seleccion, setSeleccion] = useState<any[]>([]);
  const [confirmando, setConfirmando] = useState(false);
  const mazo = useRef<HTMLDivElement>(null);
  const tanda = `${titulo}:${cartas.map((carta: any) => carta.id).join(',')}`;

  // Reparte antes de pintar cada tanda nueva; seleccionar una carta no reinicia el shuffle.
  useLayoutEffect(() => shuffleCartas(mazo.current), [tanda]);

  // Agrega o quita una carta sin superar la cantidad pedida.
  const seleccionar = (carta: any) => {
    const esta = seleccion.some((item) => item.id === carta.id);

    setSeleccion(
      esta
        ? seleccion.filter((item) => item.id !== carta.id)
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
    <section className="seleccion-cartas" style={{ '--columnas': Math.max(1, Math.min(cartas.length, 6)), '--filas-movil': Math.max(1, Math.ceil(cartas.length / 2)) } as CSSProperties}>
      <header className="seleccion-cartas__cabecera">
      <h2 className="text-2xl font-bold">
        {titulo}
      </h2>

      <p className="mt-1 text-slate-200">
        {descripcion}
      </p>

      <p className="seleccion-cartas__contador">
        {seleccion.length} de {cantidad} seleccionados
      </p>
      </header>

      <div ref={mazo} className="seleccion-cartas__mazo">
        {cartas.map((carta: any) => {
          const selected = seleccion.some((item) => item.id === carta.id);

          return (
            <CartaSeleccionableEtapa0y1
              key={carta.id}
              carta={carta}
              selected={selected}
              disabled={confirmando || (!selected && seleccion.length === cantidad)}
              onSelect={() => seleccionar(carta)}
            />
          );
        })}
      </div>

      <div className="seleccion-cartas__acciones">
        <button
          className="rounded bg-slate-800 px-4 py-2 text-white disabled:opacity-50"
          disabled={confirmando || seleccion.length !== cantidad}
          onClick={guardar}
        >
          {confirmando ? 'Confirmando...' : 'Confirmar selección'}
        </button>
      </div>
    </section>
  );
}
