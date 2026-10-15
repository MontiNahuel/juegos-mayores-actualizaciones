import { useState } from 'react';
import Card, { type CardData } from './card';

interface CardSelectionProps {
  titulo: string;
  descripcion: string;
  cartas: CardData[];
  cantidad: number;
  onConfirmar: (seleccion: CardData[]) => void;
}

export default function CardSelection({ titulo, descripcion, cartas, cantidad, onConfirmar }: CardSelectionProps) {
  const [seleccion, setSeleccion] = useState<CardData[]>([]);

  const seleccionar = (p: CardData) => {
    const esta = seleccion.some(x => x.id === p.id);

    setSeleccion(
      esta
        ? seleccion.filter(x => x.id !== p.id)
        : seleccion.length < cantidad
          ? [...seleccion, p]
          : seleccion
    );
  };

  const guardar = () => seleccion.length === cantidad && onConfirmar(seleccion);

  return (
    <section className="p-6">
      <h2 className="text-2xl font-bold">
        {titulo}
      </h2>

      <p className="mt-1 text-slate-600">
        {descripcion}
      </p>

      <p className="mt-2">
        {seleccion.length} de {cantidad} seleccionados
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cartas.map(p => {
          const selected = seleccion.some(x => x.id === p.id);

          return (
            <Card
              key={p.id}
              personaje={p}
              selected={selected}
              disabled={!selected && seleccion.length === cantidad}
              onSelect={() => seleccionar(p)}
            />
          );
        })}
      </div>

      <div className="mt-5">
        <button
          className="rounded bg-slate-800 px-4 py-2 text-white disabled:opacity-50"
          disabled={seleccion.length !== cantidad}
          onClick={guardar}
        >
          Confirmar selección
        </button>
      </div>
    </section>
  );
}
