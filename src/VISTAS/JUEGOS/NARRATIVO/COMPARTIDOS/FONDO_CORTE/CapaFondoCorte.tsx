/* Agrega o retira adornos del fondo con una transición al cambiar los recursos. */
import { useEffect, useState, type CSSProperties } from 'react';
import type { ElementoFondoCorte } from '../../../../../config/fondoCorte';
import { imagenPrecargada } from '../../../../../services/assetPreloader';

const DURACION_ELEMENTO_MS = 1400;
// Arma una clave estable para reconocer el mismo adorno del fondo.
const claveElemento = (elemento: ElementoFondoCorte) => `${elemento.id}:${elemento.x}:${elemento.y}`;

// Cada tipo de decoración tiene su profundidad y mantiene el mismo fundido de entrada/salida.
export default function CapaFondoCorte({ tipo, elementos }: {
  tipo: 'personajes' | 'oro' | 'manos';
  elementos: ElementoFondoCorte[];
}) {
  const [visible, setVisible] = useState(false);
  const [mostrados, setMostrados] = useState(/* Prepara el valor inicial al montar la pantalla. */ () => elementos.map(/* Prepara el resultado de cada elemento. */ elemento => ({ clave: claveElemento(elemento), elemento, presente: true, cargado: false })));
  useEffect(/* Sincroniza este efecto cuando cambian los datos de los que depende. */ () => {
    const frame = requestAnimationFrame(/* Aplica el cambio visual en el próximo cuadro. */ () => setVisible(true));
    return /* Libera los recursos de este efecto cuando deja de usarse. */ () => cancelAnimationFrame(frame);
  }, []);

  useEffect(/* Sincroniza este efecto cuando cambian los datos de los que depende. */ () => {
    const actuales = new Map(elementos.map(/* Prepara el resultado de cada elemento. */ elemento => [claveElemento(elemento), elemento]));
    // Un guardia que cambia de sitio sale y entra con fundido, sin deslizarse por la sala.
    setMostrados(/* Actualiza mostrados a partir del valor anterior. */ previos => [
      ...previos.map(/* Prepara el resultado de cada elemento. */ item => ({ ...item, elemento: actuales.get(item.clave) || item.elemento, presente: actuales.has(item.clave) })),
      ...elementos.filter(/* Conserva los elementos que cumplen esta condición. */ elemento => !previos.some(/* Comprueba si algún elemento cumple esta condición. */ item => item.clave === claveElemento(elemento))).map(/* Prepara el resultado de cada elemento. */ elemento => ({ clave: claveElemento(elemento), elemento, presente: true, cargado: false })),
    ]);
    const salida = window.setTimeout(/* Ejecuta este paso cuando se cumple la espera. */ () => setMostrados(/* Actualiza mostrados a partir del valor anterior. */ previos => previos.filter(/* Conserva los elementos que cumplen esta condición. */ item => item.presente)), DURACION_ELEMENTO_MS);
    return /* Libera los recursos de este efecto cuando deja de usarse. */ () => window.clearTimeout(salida);
  }, [elementos]);

  return <div className={`fondo-corte__capa fondo-corte__capa--${tipo} ${visible ? 'fondo-corte__capa--visible' : ''}`} data-cantidad={elementos.length} style={{ '--duracion-elemento': `${DURACION_ELEMENTO_MS}ms` } as CSSProperties}>
    {mostrados.map(/* Prepara el resultado de cada elemento. */ ({ clave, elemento, presente, cargado }) => <div key={clave} className={`fondo-corte__elemento ${presente && cargado ? 'fondo-corte__elemento--visible' : ''}`} style={{
      '--x': `${elemento.x}%`, '--y': `${elemento.y}%`,
      '--tamano': `${elemento.tamano}%`, '--apoyo': `-${elemento.apoyo ?? 100}%`,
      '--espejo': elemento.invertida ? -1 : 1,
      '--silueta': `url("${imagenPrecargada(elemento.src)}")`,
    } as CSSProperties}>
      <img src={imagenPrecargada(elemento.src)} alt="" draggable={false} onLoad={/* Responde a load desde este control. */ evento => {
        // Espera un frame tras cargar la imagen para que cada elemento nuevo entre con un fundido real.
        const contenedor = evento.currentTarget.parentElement;
        requestAnimationFrame(/* Aplica el cambio visual en el próximo cuadro. */ () => requestAnimationFrame(/* Aplica el cambio visual en el próximo cuadro. */ () => {
          if (contenedor?.isConnected) setMostrados(/* Actualiza mostrados a partir del valor anterior. */ previos => previos.map(/* Prepara el resultado de cada elemento. */ item => item.clave === clave ? { ...item, cargado: true } : item));
        }));
      }} />
    </div>)}
  </div>;
}
