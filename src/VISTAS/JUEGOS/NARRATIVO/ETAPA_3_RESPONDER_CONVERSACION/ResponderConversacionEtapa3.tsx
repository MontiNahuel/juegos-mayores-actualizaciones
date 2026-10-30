/* Presenta la charla con los personajes y permite elegir una respuesta. */
// Conversación de corte: muestra los personajes, sus frases y las decisiones.
import { useEffect, useRef, useState } from 'react';
import TituloConversacion from '../COMPARTIDOS/TITULO_NARRATIVO/TituloConversacion';
import DialogoNarrativo from '../COMPARTIDOS/DIALOGO_NARRATIVO/DialogoNarrativo';
import { API_URL } from '../../../../config/api';
import { ocultarCambiosNumericos } from '../../../../config/adaptacionEdad';
import { imagenPrecargada } from '../../../../services/assetPreloader';

const FONDO_DE_CORTE = '/assets/narrative/conversation-hall.png';

// Mantiene URLs absolutas y completa las imágenes del backend.
const imagenDe = (imagen: string) => imagenPrecargada(/^(https?:|blob:|data:)/.test(imagen) ? imagen : `${API_URL}${imagen || ''}`);

// Genera iniciales si no existe el retrato.
const iniciales = (nombre: string) => nombre?.split(' ').map(/* Prepara el resultado de cada elemento. */ (parte) => parte[0]).join('').slice(0, 2) || '?';

// Muestra ambos retratos o solamente al personaje que habla.
function Retrato({ personaje, activo, lado, solo }: any) {
  if (!personaje) return <div />;
  const visible = !solo || activo;

  return (
    <div
      data-visible={visible}
      className={`conversacion-retrato ${solo ? `absolute inset-y-0 ${lado === 'derecha' ? 'right-0' : 'left-0'} w-full` : 'relative w-1/2'} ${activo ? 'z-20' : 'z-10'} flex h-full max-w-2xl shrink-0 flex-col justify-start px-5 ${lado === 'derecha' ? 'ml-auto mr-0 items-end' : 'ml-0 mr-auto items-start'} ${activo ? 'scale-100 opacity-100' : 'opacity-45 grayscale'} ${visible ? '' : 'pointer-events-none'}`}
    >
      <div className={`relative flex h-[70svh] min-h-[32rem] w-full shrink-0 items-end drop-shadow-[0_6px_12px_rgba(0,0,0,0.35)] transition duration-700 ease-out ${solo ? lado === 'derecha' ? 'translate-x-[2%] justify-end' : '-translate-x-[2%] justify-center' : 'justify-center'}`}>
        <span className="absolute inset-0 grid place-items-center text-4xl font-semibold text-amber-100/70">{iniciales(personaje.nombre)}</span>
        {personaje.imagen && <img className="relative z-10 block h-full w-auto max-w-none object-contain object-bottom" src={imagenDe(personaje.imagen)} alt={personaje.nombre} onError={/* Responde a error desde este control. */ (e) => e.currentTarget.classList.add('hidden')} />}
      </div>
    </div>
  );
}

// Recorre el diálogo y muestra las opciones al llegar a la última frase.
export default function ResponderConversacionEtapa3({ conversacion, personajes, modoSimple = false, onElegir }: any) {
  const [paso, setPaso] = useState(0);
  const [solo, setSolo] = useState(true);
  const [fondoListo, setFondoListo] = useState(false);
  const escena = useRef<HTMLDivElement>(null);

  // Detecta cuándo se superponen los retratos y deja visible uno solo.
  useEffect(/* Sincroniza este efecto cuando cambian los datos de los que depende. */ () => {
    const elemento = escena.current!;
    // Mide el espacio para acomodar el diálogo en pantalla.
    const medir = () => {
      const imagenes = [...elemento.querySelectorAll('img')];
      if (imagenes.length < 2 || imagenes.some(/* Comprueba si algún elemento cumple esta condición. */ (img) => !img.naturalHeight)) return;
      const estilo = getComputedStyle(elemento);
      const ancho = elemento.clientWidth - parseFloat(estilo.paddingLeft) - parseFloat(estilo.paddingRight);
      const alto = Math.max(...imagenes.map(/* Prepara el resultado de cada elemento. */ (img) => img.clientHeight));
      const maximo = parseFloat(getComputedStyle(imagenes[0].parentElement!.parentElement!).maxWidth);
      const separacion = ancho - Math.min(ancho / 2, maximo);
      setSolo(imagenes.reduce(/* Acumula los valores en un solo resultado. */ (total, img) => total + alto * img.naturalWidth / img.naturalHeight, 0) >= separacion * 2);
    };
    const observador = new ResizeObserver(medir);
    observador.observe(elemento);
    elemento.addEventListener('load', medir, true);
    return /* Libera los recursos de este efecto cuando deja de usarse. */ () => { observador.disconnect(); elemento.removeEventListener('load', medir, true); };
  }, []);

  // Resuelve participantes, hablante y frase actual usando la corte existente.
  const buscarPersonaje = (id: string) => personajes.find(/* Busca el primer elemento que cumple esta condición. */ (p: any) => p._id === id || p.id === id);
  const actores = conversacion.requisitos.map(/* Prepara el resultado de cada elemento. */ ({ personajeId }: any) => buscarPersonaje(personajeId)).filter(Boolean);
  const participantes = actores.length ? actores : personajes.slice(0, 2);
  const frase = conversacion.frases[paso];
  const quienHabla = buscarPersonaje(frase?.personajeId) || participantes[paso % participantes.length] || { nombre: 'Consejero' };
  const ultimoDialogo = paso >= conversacion.frases.length - 1;
  const idActivo = quienHabla.id || quienHabla._id;
  // Devuelve el texto visible del nodo actual de la conversación.
  const texto = (valor: string) => modoSimple ? ocultarCambiosNumericos(valor) : valor;
  const fondo = conversacion.imagen ? imagenDe(conversacion.imagen) : imagenPrecargada(FONDO_DE_CORTE);

  return (
    <section className="min-h-[100svh] p-0">
      <div data-intro={fondoListo ? 'listo' : 'cargando'} className="conversacion-escena relative isolate flex min-h-[100svh] flex-col overflow-x-hidden pt-[58px] text-slate-100">
        <img
          className="conversacion-fondo absolute inset-0 -z-20 h-full w-full object-cover"
          src={fondo}
          alt=""
          decoding="sync"
          onLoad={/* Responde a load desde este control. */ () => setFondoListo(true)}
          onError={/* Responde a error desde este control. */ (e) => {
            const respaldo = imagenPrecargada(FONDO_DE_CORTE);
            if (e.currentTarget.getAttribute('src') !== respaldo) e.currentTarget.src = respaldo;
            else setFondoListo(true);
          }}
        />
        <div className="absolute inset-0 -z-10 bg-black/25" />
        <TituloConversacion key={conversacion._id} titulo={conversacion.titulo} listo={fondoListo} />

        <div ref={escena} className="conversacion-personajes relative z-10 flex min-h-[calc(max(45.5svh,20.8rem)+0.25rem)] basis-0 grow items-start justify-between overflow-hidden px-2 pt-1 2xl:px-20">
          <div className="absolute inset-x-0 bottom-0 z-0 h-64 bg-gradient-to-t from-slate-950/90 to-transparent" />
          <Retrato personaje={participantes[0]} activo={[participantes[0]?.id, participantes[0]?._id].includes(idActivo)} lado="izquierda" solo={solo} />
          <Retrato personaje={participantes[1]} activo={[participantes[1]?.id, participantes[1]?._id].includes(idActivo)} lado="derecha" solo={solo} />
        </div>

        <DialogoNarrativo
          className="conversacion-dialogo"
          listo={fondoListo}
          titulo={quienHabla.nombre}
          texto={texto(frase?.texto)}
          indicacion={!ultimoDialogo ? 'Tocá para continuar ›' : undefined}
          onContinuar={!ultimoDialogo ? /* Completa este paso con los datos recibidos por la operación. */ () => setPaso(/* Actualiza paso a partir del valor anterior. */ (actual) => actual + 1) : undefined}
          opciones={ultimoDialogo ? conversacion.decisiones.map(/* Prepara el resultado de cada elemento. */ (decision: any) => ({
            id: decision.opcion,
            texto: texto(decision.texto),
            // Registra la opción elegida y avanza la historia.
            onElegir: () => onElegir(decision),
          })) : []}
        />
      </div>
    </section>
  );
}
