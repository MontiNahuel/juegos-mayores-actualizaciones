import type { ConversacionApi, PersonajeApi } from './narrativeService';

export default function ConversacionActual({ conversacion, personajes, onElegir }: {
  conversacion: ConversacionApi;
  personajes: PersonajeApi[];
  onElegir: (opcion: ConversacionApi['decisiones'][number]) => void;
}) {
  const corte = new Map(personajes.map((personaje) => [personaje._id, personaje]));
  const actores = conversacion.requisitos.map(({ personajeId }) => corte.get(personajeId)).filter(Boolean) as PersonajeApi[];

  return (
    <section className="mx-auto max-w-4xl p-6">
      <p className="text-sm font-medium text-slate-500">Conversación de corte</p>
      <h2 className="mt-1 text-2xl font-bold text-slate-900">{conversacion.titulo}</h2>

      <div className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="grid grid-cols-2 gap-4 border-b border-slate-200 p-5">
          {actores.map((actor) => (
            <div className="flex items-center gap-3" key={actor._id}>
              {actor.imagen && <img className="h-14 w-14 rounded-full object-cover" src={`http://10.16.2.29:8080${actor.imagen}`} alt={actor.nombre} />}
              <div>
                <p className="font-semibold text-slate-900">{actor.nombre}</p>
                <p className="text-sm text-slate-500">{actor.titulo}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3 p-5">
          {conversacion.frases.map((frase, index) => {
            const actor = corte.get(frase.personajeId);
            return (
              <p className={`max-w-xl rounded-lg p-4 text-slate-700 ${index % 2 ? 'ml-auto bg-slate-100' : 'bg-amber-50'}`} key={`${frase.personajeId}-${index}`}>
                <span className="mr-2 font-semibold text-slate-900">{actor?.nombre}:</span>{frase.texto}
              </p>
            );
          })}
        </div>

        <div className="grid gap-3 border-t border-slate-200 p-5">
          {conversacion.decisiones.map((decision) => (
            <button className="rounded-lg border border-slate-300 p-4 text-left font-medium text-slate-800 transition hover:border-amber-500 hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500" key={decision.opcion} onClick={() => onElegir(decision)}>
              {decision.texto}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
