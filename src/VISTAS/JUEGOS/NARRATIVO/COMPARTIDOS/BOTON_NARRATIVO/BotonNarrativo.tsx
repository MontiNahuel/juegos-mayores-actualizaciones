import type { ButtonHTMLAttributes } from 'react';

const ESTILO_BOTON = [
  'boton-narrativo min-h-[42px] rounded-[3px] border border-[#a67f49] px-4 py-2',
  'bg-[linear-gradient(180deg,#251d17_0%,#17120f_100%)] font-[Palatino_Linotype,Palatino,Georgia,serif]',
  'text-center text-[15px] leading-[1.2] text-[#f1e1bd] shadow-[inset_0_0_0_1px_#f2d59a12,0_3px_8px_#0005]',
  'cursor-pointer transition-[border-color,background,box-shadow,transform] duration-150',
  'hover:not-disabled:-translate-y-px hover:not-disabled:border-[#d1ac68] hover:not-disabled:bg-[linear-gradient(180deg,#30241b_0%,#1c1511_100%)]',
  'hover:not-disabled:shadow-[inset_0_0_0_1px_#f6dda325,0_5px_12px_#0007]',
  'focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#e6c57e] disabled:cursor-default disabled:opacity-48',
].join(' ');

// Boton comun de Kings Court.
export default function BotonNarrativo({ children, className = '', type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} type={type} className={`${ESTILO_BOTON} ${className}`}>{children}</button>;
}
