import { FONDO_CORTE_DEFAULT, type EstadoFondoCorte } from '../../../../../config/fondoCorte';
import CapaFondoCorte from './CapaFondoCorte';
import './fondoCorte.css';

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
    <img className={`absolute inset-0 h-full w-full object-cover object-center motion-safe:transition-[filter] motion-safe:duration-1000 ${destacado ? 'brightness-[1.16]' : ''}`} src={fondo.src} alt="" decoding="sync" onLoad={onLoad} onError={onError} />
    {esFondoDefault && <div className="fondo-corte__plano">
      <CapaFondoCorte tipo="personajes" elementos={fondo.personajes} />
      <CapaFondoCorte tipo="manos" elementos={fondo.manos} />
      <CapaFondoCorte tipo="oro" elementos={fondo.oro} />
    </div>}
    {atenuado && <div className={`absolute inset-0 bg-[linear-gradient(#10151d55,#10151d99)] motion-safe:transition-opacity motion-safe:duration-1000 ${sinTinte ? 'opacity-0' : 'opacity-100'}`} />}
  </div>;
}
