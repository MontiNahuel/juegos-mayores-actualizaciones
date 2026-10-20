import type { ButtonHTMLAttributes } from 'react';
import './botonNarrativo.css';

// Boton comun de Kings Court.
export default function BotonNarrativo({ children, className = '', type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} type={type} className={`boton-narrativo ${className}`}>{children}</button>;
}
