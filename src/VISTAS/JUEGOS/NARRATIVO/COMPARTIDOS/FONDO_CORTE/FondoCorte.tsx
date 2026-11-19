/* Compone el escenario y anima el decorado sin mover su punto de apoyo. */
import { forwardRef, type CSSProperties } from 'react';
import { FONDO_CORTE_DEFAULT, type ElementoFondoCorte, type EstadoFondoCorte } from '../../../../../config/fondoCorte';
import { imagenPrecargada } from '../../../../../services/assetPreloader';
import './fondoCorte.css';

const capas = ['personajes', 'manos', 'oro'] as const;
const claveElemento = (elemento: ElementoFondoCorte) => `${elemento.id}:${elemento.x}:${elemento.y}`;
// Expone las capas al coordinador, que controla los tiempos de la transición.
const FondoCorte = forwardRef<HTMLDivElement, {
  fondo: EstadoFondoCorte;
  fondoAnterior?: EstadoFondoCorte;
  atenuado?: boolean;
  sinTinte?: boolean;
  fijo?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}>(function FondoCorte({ fondo, fondoAnterior = fondo, atenuado = false, sinTinte = false, fijo = false, onLoad, onError }, ref) {
  return <div ref={ref} className={`fondo-corte pointer-events-none ${fijo ? 'fixed' : 'absolute'} inset-0 ${fijo ? 'z-0' : '-z-20'}`} aria-hidden="true">
    <img data-fondo-imagen className="absolute inset-0 h-full w-full object-cover object-center" src={imagenPrecargada(fondo.src)} alt="" decoding="sync" onLoad={onLoad} onError={onError} />
    {fondo.src === FONDO_CORTE_DEFAULT && <div className="fondo-corte__plano">
      {capas.map(tipo => <CapaFondoCorte key={tipo} tipo={tipo} anteriores={fondoAnterior[tipo]} siguientes={fondo[tipo]} />)}
    </div>}
    {atenuado && <div data-fondo-tinte className="absolute inset-0 bg-[linear-gradient(#10151d55,#10151d99)]" style={{ opacity: sinTinte ? 0 : 1 }} />}
  </div>;
});

export default FondoCorte;

function CapaFondoCorte({ tipo, anteriores, siguientes }: {
  tipo: typeof capas[number];
  anteriores: ElementoFondoCorte[];
  siguientes: ElementoFondoCorte[];
}) {
  const clavesAnteriores = new Set(anteriores.map(claveElemento));
  const clavesSiguientes = new Set(siguientes.map(claveElemento));
  const salientes = anteriores.filter(elemento => !clavesSiguientes.has(claveElemento(elemento)));

  return <div className={`fondo-corte__capa fondo-corte__capa--${tipo}`}>
    {[...siguientes, ...salientes].map(elemento => {
      const clave = claveElemento(elemento);
      const estado = !clavesSiguientes.has(clave) ? 'salida' : clavesAnteriores.has(clave) ? undefined : 'entrada';
      const src = imagenPrecargada(elemento.src);
      return <div key={clave} className="fondo-corte__elemento" data-adorno={estado} style={{
        '--x': `${elemento.x}%`, '--y': `${elemento.y}%`,
        '--tamano': `${elemento.tamano}%`, '--apoyo': `-${elemento.apoyo ?? 100}%`,
        '--espejo': elemento.invertida ? -1 : 1, '--silueta': `url("${src}")`,
      } as CSSProperties}>
        <img src={src} alt="" draggable={false} />
      </div>;
    })}
  </div>;
}
