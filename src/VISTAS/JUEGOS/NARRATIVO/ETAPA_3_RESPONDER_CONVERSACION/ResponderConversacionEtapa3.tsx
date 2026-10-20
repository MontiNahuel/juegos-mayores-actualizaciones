// Muestra una conversacion de corte como una escena paso a paso.
import { useState } from 'react';

const API = (import.meta as any).env?.VITE_ASSETS_BASE_URL || '';

const imagenDe = (imagen: string) => imagen?.startsWith('http') ? imagen : `${API}${imagen || ''}`;

const iniciales = (nombre: string) => nombre?.split(' ').map((parte) => parte[0]).join('').slice(0, 2) || '?';

function Retrato({ personaje, activo, lado }: any) {
  if (!personaje) return <div />;

  return (
    <div className={`relative ${activo ? 'z-20 mx-auto flex 2xl:mx-0' : 'z-10 hidden 2xl:flex'} h-full w-full max-w-2xl shrink-0 flex-col justify-start px-5 transition duration-500 2xl:w-1/2 2xl:px-12 ${lado === 'derecha' ? 'items-center text-center 2xl:items-end 2xl:text-right' : 'items-center text-center 2xl:items-start 2xl:text-left'} ${activo ? 'scale-100 opacity-100' : 'opacity-45 grayscale'}`}>
      <div className={`relative flex h-[70svh] min-h-[32rem] w-full items-end justify-center transition duration-500 ${activo ? 'drop-shadow-[0_0_28px_rgba(251,191,36,0.4)]' : ''}`}>
        <span className="absolute inset-0 grid place-items-center text-4xl font-semibold text-amber-100/70">{iniciales(personaje.nombre)}</span>
        {personaje.imagen && <img className="relative z-10 block h-full w-auto max-w-none object-contain object-bottom" src={imagenDe(personaje.imagen)} alt={personaje.nombre} onError={(evento) => { evento.currentTarget.classList.add('hidden'); }} />}
      </div>
    </div>
  );
}

// ETAPA 3: alterna los dialogos y muestra las decisiones al terminar la escena.
export default function ResponderConversacionEtapa3({ conversacion, personajes, onElegir }: any) {
  const [paso, setPaso] = useState(0);
  const buscarPersonaje = (id: string) => personajes.find((personaje: any) => personaje._id === id || personaje.id === id);
  const actores = conversacion.requisitos
    .map(({ personajeId }: any) => buscarPersonaje(personajeId))
    .filter(Boolean);
  const participantes = actores.length ? actores : personajes.slice(0, 2);
  const frase = conversacion.frases[paso];
  const quienHabla = buscarPersonaje(frase?.personajeId) || participantes[paso % participantes.length] || { nombre: 'Consejero' };
  const ultimoDialogo = paso >= conversacion.frases.length - 1;
  const idActivo = quienHabla.id || quienHabla._id;

  return (
    <section className="min-h-screen p-0">
      <div className="relative isolate min-h-screen overflow-x-hidden bg-[#101827] text-slate-100">
        <img className="absolute inset-0 -z-20 h-full w-full object-cover" src="/assets/narrative/court.jpg" alt="" />
        <div className="absolute inset-0 -z-10 bg-slate-950/55" />

        <header className="relative z-40 border-b border-slate-500/50 bg-slate-950/55 px-6 py-5 text-center sm:px-10">
          <p className="text-sm font-medium text-amber-300">Consejo de la corte</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{conversacion.titulo}</h2>
        </header>

        <div className="relative z-10 flex h-[72svh] min-h-[34rem] items-start justify-between overflow-x-hidden px-2 pt-5 2xl:px-20">
          <div className="absolute inset-x-0 bottom-0 z-0 h-64 bg-gradient-to-t from-slate-950/90 to-transparent" />
          <Retrato personaje={participantes[0]} activo={[participantes[0]?.id, participantes[0]?._id].includes(idActivo)} lado="izquierda" />
          <Retrato personaje={participantes[1]} activo={[participantes[1]?.id, participantes[1]?._id].includes(idActivo)} lado="derecha" />
        </div>

        {!ultimoDialogo ? (
          <button className="group relative z-30 -mt-[20svh] block w-full border-t border-slate-500/50 bg-slate-950/95 px-8 py-7 text-left transition hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-300 md:px-20" onClick={() => setPaso((actual) => actual + 1)}>
            <p className="text-sm font-bold text-amber-300">{quienHabla.nombre}</p>
            <p className="mt-2 max-w-3xl text-lg leading-relaxed text-slate-100">{frase?.texto}</p>
            <p className="mt-4 text-sm text-slate-400 group-hover:text-amber-200">Toca para continuar</p>
          </button>
        ) : (
          <div className="relative z-30 -mt-[20svh] border-t border-slate-500/50 bg-slate-950/95 px-8 py-7 md:px-20">
            <p className="text-sm font-bold text-amber-300">{quienHabla.nombre}</p>
            <p className="mt-2 max-w-3xl text-lg leading-relaxed text-slate-100">{frase?.texto}</p>
            <div className="mt-7 grid gap-3">
              {conversacion.decisiones.map((decision: any) => (
                <button className="rounded-xl border border-slate-600 bg-slate-800 px-5 py-4 text-left font-medium text-slate-100 transition hover:border-amber-300 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-300" key={decision.opcion} onClick={() => onElegir(decision)}>
                  {decision.texto}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
