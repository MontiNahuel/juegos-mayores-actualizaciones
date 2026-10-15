import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../../../store/store';
import {
  guardarPrimeraSeleccion,
  guardarSegundaSeleccion,
} from '../../../../store/narrativoSelectionSlice';
import Card, { type PersonajeCard } from './card';
import EventoActual from '../EventoActual';

export interface Desafio {
  id: string;
  personajes: PersonajeCard[];
}

export default function CardSelection({ desafio }: { desafio: Desafio }) {
  const dispatch = useDispatch();
  const state = useSelector((s: RootState) => s.narrativoSelection);

  const fase = state.desafioId === desafio.id ? state.phase : 'primera';
  const [seleccion, setSeleccion] = useState<PersonajeCard[]>([]);

  const seleccionar = (p: PersonajeCard) => {
    const esta = seleccion.some(x => x.id === p.id);

    setSeleccion(
      esta
        ? seleccion.filter(x => x.id !== p.id)
        : seleccion.length < 3
          ? [...seleccion, p]
          : seleccion
    );
  };

  const guardar = () => {
    if (seleccion.length !== 3) return;

    const accion =
      fase === 'primera'
        ? guardarPrimeraSeleccion
        : guardarSegundaSeleccion;

    dispatch(accion({
      desafioId: desafio.id,
      personajes: seleccion
    }));

    setSeleccion([]);
  };

  if (fase === 'completa') return <EventoActual />;

  return (
    <section className="p-6">
      <h2 className="text-2xl font-bold">
        Elegí tu {fase} corte
      </h2>

      <p className="mt-1 text-slate-600">
        Elegí tres personajes.
      </p>

      <p className="mt-2">
        {seleccion.length} de 3 seleccionados
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {desafio.personajes.map(p => {
          const selected = seleccion.some(x => x.id === p.id);

          return (
            <Card
              key={p.id}
              personaje={p}
              selected={selected}
              disabled={!selected && seleccion.length === 3}
              onSelect={() => seleccionar(p)}
            />
          );
        })}
      </div>

      <div className="mt-5">
        <button
          className="rounded bg-slate-800 px-4 py-2 text-white disabled:opacity-50"
          disabled={seleccion.length !== 3}
          onClick={guardar}
        >
          Confirmar {fase} selección
        </button>
      </div>
    </section>
  );
}
