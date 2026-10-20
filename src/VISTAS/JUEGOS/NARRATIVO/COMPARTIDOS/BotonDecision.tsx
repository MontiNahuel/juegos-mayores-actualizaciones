import type { ButtonHTMLAttributes } from 'react';
import grabado from '../../../../assets/narrative/decision-ornament.png';
import './botonDecision.css';

export default function BotonDecision({ children, className = '', type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} type={type} className={`boton-decision ${className}`}>
      <img className="boton-decision__grabado" src={grabado} alt="" aria-hidden="true" onError={event => { event.currentTarget.hidden = true; }} />
      <span className="boton-decision__texto">{children}</span>
    </button>
  );
}
