import { useEffect, useState, type CSSProperties } from 'react';
import type { ElementoFondoCorte } from '../../../../../config/fondoCorte';
import { imagenPrecargada } from '../../../../../services/assetPreloader';

const DURACION_ELEMENTO_MS = 1400;
const claveElemento = (elemento: ElementoFondoCorte) => `${elemento.id}:${elemento.x}:${elemento.y}`;

// Cada tipo de decoración tiene su profundidad y mantiene el mismo fundido de entrada/salida.
export default function CapaFondoCorte({ tipo, elementos }: {
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
