import type { EventoApi } from './narrativeService';

export default function EventoActual({ evento, atributos, onElegir }: {
  evento: EventoApi;
  atributos: Record<string, number>;
  onElegir: (opcionId: string) => void;
}) {
  return (
    <section className="p-6">
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Object.entries(atributos).map(([clave, valor]) => {

          return (
            <div className="rounded border bg-white p-3" key={clave}>
              <p className="text-sm capitalize text-slate-600">{clave}</p>
              <p className="font-bold">{valor}/100</p>
              <div className="mt-2 h-1.5 rounded bg-slate-200">
                <div className="h-full rounded bg-emerald-600" style={{ width: `${valor}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="text-2xl font-bold">{evento.titulo}</h2>
      <div className="mt-4 flex h-48 items-center justify-center rounded border bg-slate-900 text-white">
        {evento.imagen}
      </div>
      <p className="mt-4 text-slate-700">{evento.descripcion}</p>

      <div className="mt-4 grid gap-3">
        {evento.opciones.filter((opcion) => !opcion.bloqueada).map((opcion) => (
          <button className="rounded border border-slate-400 p-4 text-left" key={opcion.id} onClick={() => onElegir(opcion.id)}>
            {opcion.texto}
          </button>
        ))}
      </div>
    </section>
  );
}
