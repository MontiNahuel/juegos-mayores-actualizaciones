import React from 'react';
import { usePlayerEconomy } from '../../../context/PlayerEconomyContext';

/**
 * Icono de corazón SVG estilizado para contadores de vidas.
 */
export const IconHeart: React.FC<{
  filled?: boolean;
  size?: number;
  className?: string;
}> = ({ filled = true, size = 15, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? '#E11D48' : '#F1F5F9'}
    stroke={filled ? '#BE123C' : '#CBD5E1'}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`transition-all duration-300 ${filled ? 'scale-100' : 'scale-90 opacity-60'} ${className || ''}`}
    aria-hidden="true"
  >
    <path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" />
  </svg>
);

export interface LivesBadgeProps {
  /** Cantidad actual de vidas (opcional, si se omite usa el contexto global) */
  lives?: number;
  /** Cantidad máxima de vidas */
  maxLives?: number;
  /** Etiqueta de texto (por defecto: 'Vidas:') */
  label?: string;
  /** Si debe mostrar la etiqueta de texto en pantallas que lo permitan */
  showLabel?: boolean;
  /** Tamaño de cada corazón en píxeles */
  heartSize?: number;
  /** Clases CSS adicionales */
  className?: string;
  /** Callback al hacer click (por defecto abre la tienda de vidas) */
  onClick?: () => void;
}

/**
 * Componente unificado para mostrar el indicador de vidas (corazones)
 * en el GameHeader de todos los juegos cognitivos.
 */
export const LivesBadge: React.FC<LivesBadgeProps> = ({
  lives: propLives,
  maxLives = 5,
  label = 'Vidas:',
  showLabel = true,
  heartSize = 13,
  className = '',
  onClick,
}) => {
  const economy = usePlayerEconomy();
  const currentLives = propLives !== undefined ? propLives : economy.vidas;
  const safeLives = Math.max(0, currentLives);
  const isCritical = safeLives === 1;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      economy.abrirMiniTienda();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-2xs transition-all duration-200 cursor-pointer select-none ${
        isCritical
          ? 'bg-rose-100/90 border-rose-300 text-rose-800 animate-pulse'
          : safeLives === 0
          ? 'bg-slate-100 border-slate-300 text-slate-500'
          : 'bg-rose-50/80 border-rose-200 text-rose-700 hover:bg-rose-100/80 active:scale-95'
      } ${className}`}
      title={`${safeLives} vidas restantes. Hacé clic para abrir la Tienda de Vidas.`}
      aria-label={`${safeLives} vidas restantes. Hacé clic para abrir la Tienda de Vidas.`}
    >
      {showLabel && (
        <span className="text-xs font-bold hidden sm:inline">
          {label}
        </span>
      )}
      
      {/* Si tiene hasta 5 vidas, mostramos corazones individuales. Si tiene más de 5, mostramos número con corazón */}
      {maxLives <= 5 ? (
        <div className="flex items-center gap-0.5">
          {Array.from({ length: maxLives }).map((_, i) => (
            <IconHeart
              key={i}
              filled={i < safeLives}
              size={heartSize}
            />
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-1 font-bold text-xs">
          <IconHeart filled={safeLives > 0} size={heartSize} />
          <span>{safeLives}</span>
        </div>
      )}

      {/* Acceso a la tienda de vidas */}
      <span className="text-[10px] bg-rose-200/70 text-rose-800 px-1 py-0.2 rounded-full font-extrabold leading-none">
        +
      </span>
    </button>
  );
};
