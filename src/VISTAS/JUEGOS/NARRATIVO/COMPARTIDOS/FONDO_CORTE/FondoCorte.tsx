/* Compone el escenario de la corte con su fondo y sus capas. */
import { FONDO_CORTE_DEFAULT, type EstadoFondoCorte } from '../../../../../config/fondoCorte';
import { useEffect, useState, type CSSProperties } from 'react';
import type { ElementoFondoCorte } from '../../../../../config/fondoCorte';
import './fondoCorte.css';
import { imagenPrecargada } from '../../../../../services/assetPreloader';

// Imagen y decoración comparten encuadre y oscurecido; nunca se mezclan con otra escena.
export default function FondoCorte({ fondo, atenuado = false, sinTinte = false, destacado = false, fijo = false, onLoad, onError }: {
  fondo: EstadoFondoCorte;
  atenuado?: boolean;
  sinTinte?: boolean;
  destacado?: boolean;
  fijo?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}) {
  const esFondoDefault = fondo.src === FONDO_CORTE_DEFAULT;

  return <div className={`fondo-corte pointer-events-none ${fijo ? 'fixed' : 'absolute'} inset-0 ${fijo ? 'z-0' : '-z-20'}`} aria-hidden="true">
    <img className={`absolute inset-0 h-full w-full object-cover object-center motion-safe:transition-[filter] motion-safe:duration-1000 ${destacado ? 'brightness-[1.16]' : ''}`} src={imagenPrecargada(fondo.src)} alt="" decoding="sync" onLoad={onLoad} onError={onError} />
    {esFondoDefault && <div className="fondo-corte__plano">
      <CapaFondoCorte tipo="personajes" elementos={fondo.personajes} />
      <CapaFondoCorte tipo="manos" elementos={fondo.manos} />
      <CapaFondoCorte tipo="oro" elementos={fondo.oro} />
    </div>}
    {atenuado && <div className={`absolute inset-0 bg-[linear-gradient(#10151d55,#10151d99)] motion-safe:transition-opacity motion-safe:duration-1000 ${sinTinte ? 'opacity-0' : 'opacity-100'}`} />}
  </div>;
}

const DURACION_ELEMENTO_MS = 1400;
// Arma una clave estable para reconocer el mismo adorno del fondo.
const claveElemento = (elemento: ElementoFondoCorte) => `${elemento.id}:${elemento.x}:${elemento.y}`;

// Cada tipo de decoración tiene su profundidad y mantiene el mismo fundido de entrada/salida.
function CapaFondoCorte({ tipo, elementos }: {
  tipo: 'personajes' | 'oro' | 'manos';
  elementos: ElementoFondoCorte[];
}) {
  const [visible, setVisible] = useState(false);
  const [mostrados, setMostrados] = useState(() => elementos.map(elemento => ({ clave: claveElemento(elemento), elemento, presente: true, cargado: false })));
  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const actuales = new Map(elementos.map(elemento => [claveElemento(elemento), elemento]));
    // Un guardia que cambia de sitio sale y entra con fundido, sin deslizarse por la sala.
    setMostrados(previos => [
      ...previos.map(item => ({ ...item, elemento: actuales.get(item.clave) || item.elemento, presente: actuales.has(item.clave) })),
      ...elementos.filter(elemento => !previos.some(item => item.clave === claveElemento(elemento))).map(elemento => ({ clave: claveElemento(elemento), elemento, presente: true, cargado: false })),
    ]);
    const salida = window.setTimeout(() => setMostrados(previos => previos.filter(item => item.presente)), DURACION_ELEMENTO_MS);
    return () => window.clearTimeout(salida);
  }, [elementos]);

  return <div className={`fondo-corte__capa fondo-corte__capa--${tipo} ${visible ? 'fondo-corte__capa--visible' : ''}`} data-cantidad={elementos.length} style={{ '--duracion-elemento': `${DURACION_ELEMENTO_MS}ms` } as CSSProperties}>
    {mostrados.map(({ clave, elemento, presente, cargado }) => <div key={clave} className={`fondo-corte__elemento ${presente && cargado ? 'fondo-corte__elemento--visible' : ''}`} style={{
      '--x': `${elemento.x}%`, '--y': `${elemento.y}%`,
      '--tamano': `${elemento.tamano}%`, '--apoyo': `-${elemento.apoyo ?? 100}%`,
      '--espejo': elemento.invertida ? -1 : 1,
      '--silueta': `url("${imagenPrecargada(elemento.src)}")`,
    } as CSSProperties}>
      <img src={imagenPrecargada(elemento.src)} alt="" draggable={false} onLoad={evento => {
        // Espera un frame tras cargar la imagen para que cada elemento nuevo entre con un fundido real.
        const contenedor = evento.currentTarget.parentElement;
        requestAnimationFrame(() => requestAnimationFrame(() => {
          if (contenedor?.isConnected) setMostrados(previos => previos.map(item => item.clave === clave ? { ...item, cargado: true } : item));
        }));
      }} />
    </div>)}
  </div>;
}
