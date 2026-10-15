import { useDispatch, useSelector } from 'react-redux';
import { mostrarEvento } from '../../../store/eventosSlice';
import { limpiarResultado } from '../../../store/resultadosSlice';
import type { RootState } from '../../../store/store';

export default function ResultadoActual() {
  const dispatch = useDispatch();
  const resultado = useSelector((state: RootState) => state.resultados.actual);
  const { mazo, actual } = useSelector((state: RootState) => state.eventos);

  if (!resultado) return null;

  const color = {
    positivo: 'border-emerald-300 bg-emerald-50',
    negativo: 'border-rose-300 bg-rose-50',
    neutro: 'border-slate-300 bg-slate-50',
  }[resultado.tipo];

  const continuar = () => {
    const disponibles = mazo.filter((evento) => evento.id !== actual.id);
    const siguiente = disponibles[Math.floor(Math.random() * disponibles.length)];
    dispatch(limpiarResultado());
    dispatch(mostrarEvento(siguiente.id));
  };

  return (
    <section className="p-6 text-center">
      <h2 className="text-2xl font-bold">Resultado</h2>
      <div className="mt-4 flex h-48 items-center justify-center rounded border bg-slate-900 text-white">
        {resultado.imagen}
      </div>
      <p className="mx-auto mt-6 max-w-md text-slate-700">{resultado.texto}</p>
      <p className={`mt-6 rounded border p-3 font-bold ${color}`}>{resultado.impacto}</p>
      <button className="mt-6 rounded bg-slate-800 px-4 py-2 text-white" onClick={continuar}>
        Continuar
      </button>
    </section>
  );
}
