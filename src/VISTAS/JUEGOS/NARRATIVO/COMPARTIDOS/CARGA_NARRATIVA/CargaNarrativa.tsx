/* Muestra cuánto avanzó la preparación de las imágenes de la historia. */
import { useEffect } from 'react';
import BotonNarrativo from '../BOTON_NARRATIVO/BotonNarrativo';
import TituloNarrativo from '../TITULO_NARRATIVO/TituloNarrativo';
import './cargaNarrativa.css';
import { API_URL } from '../../../../../config/api';
import { FONDO_CONVERSACION, FONDO_CORTE_DEFAULT, GUARDIAS_CORTE, MANOS_CORTE, ORO_CORTE } from '../../../../../config/fondoCorte';
import { imagenPrecargada, precargarImagenes, guardarImagenesEnSegundoPlano } from '../../../../../services/assetPreloader';
import caballo from '../../../../../assets/narrative/loading-horse.png';
import marcoEvento from '../../../../../assets/narrative/event-title.png';

// Prepara las imágenes recibidas; los adornos futuros se descargan sin bloquear la entrada.
// eslint-disable-next-line react-refresh/only-export-components -- La precarga pertenece a esta pantalla de carga.
export async function prepararImagenes(datos: unknown, progreso?: (porcentaje: number) => void) {
  const imagenes: string[] = progreso ? [FONDO_CORTE_DEFAULT, FONDO_CONVERSACION, caballo, marcoEvento,
    '/assets/narrative/card-frame.png', '/assets/narrative/conversation-title.png'] : [];
  // Encuentra ilustraciones dentro de los datos sin modificar sus URLs ni sus propiedades.
  const visitar = (valor: unknown) => {
    if (!valor || typeof valor !== 'object') return;
    for (const [clave, dato] of Object.entries(valor)) {
      if (clave === 'imagen' && typeof dato === 'string' && dato)
        imagenes.push(dato.startsWith('/') && !dato.startsWith('//') ? `${API_URL}${dato}` : dato);
      else if (typeof dato === 'object') visitar(dato);
    }
  };
  visitar(datos);
  await precargarImagenes(imagenes, (completados, total) => progreso?.(total ? completados / total * 99 : 99));
  if (progreso) guardarImagenesEnSegundoPlano(['/assets/narrative/result-paper.png',
    ...[...GUARDIAS_CORTE, ...MANOS_CORTE, ...ORO_CORTE].map(elemento => elemento.src)]);
}


// Vista pura: recibe progreso e ilustración; no descarga archivos ni conoce Redux.
export default function CargaNarrativa({ porcentaje: valor, listo: preparado, mensaje, error, onReintentar, onEntrar }: {
  porcentaje: number;
  listo: boolean;
  mensaje: string;
  error: string;
  onReintentar: () => void;
  onEntrar: () => void;
}) {
  const listo = preparado && !error;
  const porcentaje = Math.round(Math.max(0, Math.min(100, valor)));
  useEffect(() => {
    if (!listo) return;
    const duracion = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 650;
    const timer = window.setTimeout(onEntrar, duracion);
    return () => window.clearTimeout(timer);
  }, [listo, onEntrar]);

  return <section
    className={`carga-narrativa fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-[#130e08]/55 px-6 text-center font-[Palatino_Linotype,Palatino,Georgia,serif] text-[#f3e8d1] backdrop-blur-[18px] ${listo ? 'carga-narrativa--lista' : ''}`}
    aria-label="Cargando el juego"
    aria-busy={!listo && !error}
  >
    <div className="w-full max-w-[34rem] pb-8">
      <TituloNarrativo titulo={error ? 'El viaje quedó en pausa' : listo ? 'La corte te espera' : 'Preparando tu llegada'} variante="evento" permanente />
      <div className="relative mx-8 mt-20 sm:mt-24">
        <div className="absolute -top-[5.4rem] h-20 w-20 -translate-x-1/2 motion-safe:transition-[left] motion-safe:duration-500 motion-safe:ease-out sm:-top-[6.4rem] sm:h-24 sm:w-24" style={{ left: `${porcentaje}%` }} aria-hidden="true">
          <img className={`carga-narrativa__caballo h-full w-full object-contain ${!listo && !error ? 'carga-narrativa__caballo--trotando' : ''}`} src={imagenPrecargada(caballo)} alt="" />
        </div>
        <div className="h-2.5 overflow-hidden rounded-full border border-[#b9924f] bg-gradient-to-b from-[#30271d] to-[#15110d] shadow-[inset_0_1px_5px_#000,0_2px_12px_#0005]"
          role="progressbar" aria-label="Preparación del juego" aria-valuemin={0} aria-valuemax={100} aria-valuenow={porcentaje}>
          <div className="h-full rounded-full bg-gradient-to-r from-[#8a6132] via-[#c9a55b] to-[#f3dda0] shadow-[0_0_14px_#d6af64a0] motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out" style={{ width: `${porcentaje}%` }} />
        </div>
      </div>
      <div className="mt-5 min-h-16 text-base leading-relaxed font-semibold text-shadow-[0_2px_3px_#000] sm:text-lg">
        {error ? <>
          <p role="alert" className="mx-auto mb-4 max-w-[34ch]">{error}</p>
          <BotonNarrativo onClick={onReintentar}>Volver a intentar</BotonNarrativo>
        </> : <>
          <p role="status" className="m-0">{listo ? 'Todo listo para comenzar.' : mensaje}</p>
          <p className="mt-1 text-sm tabular-nums text-[#d5bc85]">{porcentaje}%</p>
        </>}
      </div>
    </div>
  </section>;
}
