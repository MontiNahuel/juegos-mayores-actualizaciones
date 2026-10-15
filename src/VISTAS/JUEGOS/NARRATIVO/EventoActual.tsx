import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../../store/store';
import { mostrarResultado } from '../../../store/resultadosSlice';
import ResultadoActual from './ResultadoActual';

const indicadores = [
  { clave: 'oro', nombre: 'Tesoro', icono: '🪙' },
  { clave: 'comida', nombre: 'Graneros', icono: '🌾' },
  { clave: 'orden', nombre: 'Orden', icono: '🛡️' },
  { clave: 'moral', nombre: 'Moral', icono: '♥' },
] as const;

export default function EventoActual() {
  const dispatch = useDispatch();
  const { actual } = useSelector((state: RootState) => state.eventos);
  const corte = useSelector((state: RootState) => state.narrativoSelection.primeraSeleccion);
  const atributos = useSelector((state: RootState) => state.narrativoSelection.atributos);
  const resultado = useSelector((state: RootState) => state.resultados.actual);

  // La tercera opción depende de la primera corte elegida.
  const puedeUsarSecreta = corte.some((personaje) => personaje.id === actual.opcionSecreta.requiere);
  const opciones = puedeUsarSecreta ? [...actual.opciones, actual.opcionSecreta.texto] : actual.opciones;

  const elegir = () => {
    dispatch(mostrarResultado(actual.resultadoId));
  };

  if (resultado) return <ResultadoActual />;

  return (
    <section className="p-6">
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {indicadores.map(({ clave, nombre, icono }) => {
          const valor = atributos[clave];

          return (
            <div className="rounded border bg-white p-3" key={clave}>
              <p className="text-sm text-slate-600">{icono} {nombre}</p>
              <p className="font-bold">{valor}/100</p>
              <div className="mt-2 h-1.5 rounded bg-slate-200">
                <div className="h-full rounded bg-emerald-600" style={{ width: `${valor}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="text-2xl font-bold">{actual.titulo}</h2>
      <div className="mt-4 flex h-48 items-center justify-center rounded border bg-slate-900 text-white">
        {actual.imagen}
      </div>
      <p className="mt-4 text-slate-700">{actual.texto}</p>

      <div className="mt-4 grid gap-3">
        {opciones.map((opcion) => (
          <button className="rounded border border-slate-400 p-4 text-left" key={opcion} onClick={elegir}>
            {opcion}
          </button>
        ))}
      </div>
    </section>
  );
}
