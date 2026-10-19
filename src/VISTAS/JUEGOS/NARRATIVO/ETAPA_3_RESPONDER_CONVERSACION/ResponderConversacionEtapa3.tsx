// Muestra una conversacion de corte como una escena paso a paso.
import { useEffect, useRef, useState } from 'react';
import './conversacion.css';

const API = 'http://10.16.2.19:8080';
// Recursos locales: cambiar estas rutas para reemplazar el fondo de respaldo o el PNG del titulo.
const FONDO_DE_CORTE = '/assets/narrative/conversation-hall.png';
const MARCO_TITULO = '/assets/narrative/conversation-title.png';

// Conserva las URLs completas y agrega el host del backend a las rutas relativas.
const imagenDe = (imagen: string) => imagen?.startsWith('http') ? imagen : `${API}${imagen || ''}`;

// Respaldo visual cuando falta la foto del personaje o su carga falla.
const iniciales = (nombre: string) => nombre?.split(' ').map((parte) => parte[0]).join('').slice(0, 2) || '?';

// En modo solo muestra al hablante; con espacio suficiente mantiene los dos retratos.
function Retrato({ personaje, activo, lado, solo }: any) {
  if (!personaje) return <div />;

  // 70svh es la altura del dibujo y 32rem su minimo. shrink-0 impide que se achique.
  // translate-x-[3%] mueve a la derecha y -translate-x-[3%] a la izquierda, sin rotar.
  // drop-shadow: desplazamiento horizontal, vertical, desenfoque y color de la sombra.
  // opacity-45 y grayscale apagan al personaje que no habla; z-20 prioriza al hablante.
  return (
    <div className={`relative ${activo ? 'z-20 flex' : solo ? 'z-10 hidden' : 'z-10 flex'} h-full max-w-2xl shrink-0 flex-col justify-start px-5 transition duration-500 ${solo ? 'w-full' : 'w-1/2'} ${lado === 'derecha' ? 'ml-auto mr-0 items-end' : 'ml-0 mr-auto items-start'} ${activo ? 'scale-100 opacity-100' : 'opacity-45 grayscale'}`}>
      <div className={`relative flex h-[70svh] min-h-[32rem] w-full shrink-0 items-end drop-shadow-[0_6px_12px_rgba(0,0,0,0.35)] transition duration-500 ${solo ? lado === 'derecha' ? 'translate-x-[3%] justify-end' : '-translate-x-[3%] justify-center' : 'justify-center'}`}>
        <span className="absolute inset-0 grid place-items-center text-4xl font-semibold text-amber-100/70">{iniciales(personaje.nombre)}</span>
        {personaje.imagen && <img className="relative z-10 block h-full w-auto max-w-none object-contain object-bottom" src={imagenDe(personaje.imagen)} alt={personaje.nombre} onError={(evento) => { evento.currentTarget.classList.add('hidden'); }} />}
      </div>
    </div>
  );
}

// ETAPA 3: alterna los dialogos y muestra las decisiones al terminar la escena.
export default function ResponderConversacionEtapa3({ conversacion, personajes, onElegir }: any) {
  const [paso, setPaso] = useState(0);
  const [solo, setSolo] = useState(true);
  // Dispara la secuencia CSS al cargar el fondo. Los tiempos se editan en conversacion.css.
  const [fondoListo, setFondoListo] = useState(false);
  const escena = useRef<HTMLDivElement>(null);

  // Breakpoint por contacto real entre imagenes, sin depender de un ancho fijo de pantalla.
  useEffect(() => {
    const elemento = escena.current!;
    // Calcula el ancho de ambos dibujos usando su proporcion original y su altura actual.
    const medir = () => {
      const imagenes = [...elemento.querySelectorAll('img')];
      if (imagenes.length < 2 || imagenes.some((imagen) => !imagen.naturalHeight)) return;
      const estilo = getComputedStyle(elemento);
      const ancho = elemento.clientWidth - parseFloat(estilo.paddingLeft) - parseFloat(estilo.paddingRight);
      const alto = Math.max(...imagenes.map((imagen) => imagen.clientHeight));
      const maximo = parseFloat(getComputedStyle(imagenes[0].parentElement!.parentElement!).maxWidth);
      const separacion = ancho - Math.min(ancho / 2, maximo);
      // Al tocarse queda solo el hablante. Restar pixeles a separacion * 2 anticipa el cambio.
      setSolo(imagenes.reduce((total, imagen) => total + alto * imagen.naturalWidth / imagen.naturalHeight, 0) >= separacion * 2);
    };
    // Recalcula al redimensionar la escena o terminar de cargar una foto.
    const observador = new ResizeObserver(medir);
    observador.observe(elemento);
    elemento.addEventListener('load', medir, true);
    return () => { observador.disconnect(); elemento.removeEventListener('load', medir, true); };
  }, []);
  // Prioriza el fondo del backend; el onError del img tambien usa el respaldo si la URL falla.
  const fondo = conversacion.imagen ? imagenDe(conversacion.imagen) : FONDO_DE_CORTE;
  // Busca sobre la corte ya guardada, sin hacer otra consulta por cada frase.
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
      {/* flex-col y min-h-screen dejan el panel abajo y permiten crecer si el texto no entra.
          El scroll lo maneja IonContent scrollY en KingsCourt; no fijar esta raiz con h-screen. */}
      <div data-intro={fondoListo ? 'listo' : 'cargando'} className="conversacion-escena relative isolate flex min-h-screen flex-col overflow-x-hidden bg-[#101827] text-slate-100">
        <img className="conversacion-fondo absolute inset-0 -z-20 h-full w-full object-cover" src={fondo} alt="" onLoad={() => setFondoListo(true)} onError={(evento) => { evento.currentTarget.src = FONDO_DE_CORTE; }} />
        {/* bg-black/25 oscurece el fondo un 25%; subir ese numero lo oscurece mas. */}
        <div className="absolute inset-0 -z-10 bg-black/25" />

        {/* 36rem limita el ancho del marco en PC; 96vw lo adapta al movil.
            aspect-[4.4/1] reserva espacio sin aumentar el scroll por la altura del PNG.
            El titulo se oculta con opacity y visibility: conserva el espacio y no desplaza la escena. */}
        <header className="relative z-40 shrink-0 px-2 py-2 text-center">
          <div className="relative mx-auto w-[min(36rem,96vw)] aspect-[4.4/1]">
            <div className="conversacion-titulo pointer-events-none absolute inset-x-0 top-0">
              <img className="block w-full" src={MARCO_TITULO} alt="" />
              {/* top-[58%] centra el texto en la placa del PNG; inset-x-[14%] deja margen a los lados.
                  !m-0 evita el margen de Ionic. !text-sm y sm:!text-xl ajustan movil y PC.
                  La fuente se cambia en .conversacion-titulo h2 del CSS. */}
              <h2 className="absolute inset-x-[14%] top-[58%] !m-0 -translate-y-1/2 text-center !text-sm !font-semibold !leading-tight tracking-wide text-[#f3e8d1] [text-shadow:0_2px_3px_black] sm:!text-xl">{conversacion.titulo}</h2>
            </div>
          </div>
        </header>

        {/* 49svh = 70svh * 0.70 y 22.4rem = 32rem * 0.70: permite cubrir como maximo el 30%.
            Para dejar 75% visible, usar 52.5svh y 24rem. Actualizar ambos si cambia la altura del dibujo.
            1.25rem compensa el pt-5. basis-0 y grow usan el espacio libre sin generar scroll extra.
            overflow-hidden recorta solo los dibujos; el texto y el scroll quedan fuera de este bloque. */}
        <div ref={escena} className="conversacion-personajes relative z-10 flex min-h-[calc(max(49svh,22.4rem)+1.25rem)] basis-0 grow items-start justify-between overflow-hidden px-2 pt-5 2xl:px-20">
          <div className="absolute inset-x-0 bottom-0 z-0 h-64 bg-gradient-to-t from-slate-950/90 to-transparent" />
          <Retrato personaje={participantes[0]} activo={[participantes[0]?.id, participantes[0]?._id].includes(idActivo)} lado="izquierda" solo={solo} />
          <Retrato personaje={participantes[1]} activo={[participantes[1]?.id, participantes[1]?._id].includes(idActivo)} lado="derecha" solo={solo} />
        </div>

        {/* Este contenedor permanece al cambiar de frase para no repetir el fade in.
            px/py ajustan los espacios; text-base y leading-normal compactan el texto en movil.
            Los prefijos sm: aplican desde 640px y md: desde 768px. */}
        <div className="conversacion-dialogo relative z-30 shrink-0">
        {!ultimoDialogo ? (
          <button className="group relative block w-full border-t border-slate-500/50 bg-slate-950/95 px-5 py-4 text-left transition hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-300 sm:px-8 sm:py-5 md:px-20" onClick={() => setPaso((actual) => actual + 1)}>
            <p className="text-sm font-bold text-amber-300">{quienHabla.nombre}</p>
            <p className="mt-2 max-w-3xl text-base leading-normal text-slate-100 sm:text-lg sm:leading-relaxed">{frase?.texto}</p>
            <p className="mt-4 text-sm text-slate-400 group-hover:text-amber-200">Toca para continuar</p>
          </button>
        ) : (
          <div className="border-t border-slate-500/50 bg-slate-950/95 px-5 py-4 sm:px-8 sm:py-5 md:px-20">
            <p className="text-sm font-bold text-amber-300">{quienHabla.nombre}</p>
            <p className="mt-2 max-w-3xl text-base leading-normal text-slate-100 sm:text-lg sm:leading-relaxed">{frase?.texto}</p>
            <div className="mt-4 grid gap-2 sm:mt-5 sm:gap-3">
              {conversacion.decisiones.map((decision: any) => (
                <button className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-left text-sm font-medium text-slate-100 transition hover:border-amber-300 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-300 sm:px-5 sm:text-base" key={decision.opcion} onClick={() => onElegir(decision)}>
                  {decision.texto}
                </button>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>
    </section>
  );
}
