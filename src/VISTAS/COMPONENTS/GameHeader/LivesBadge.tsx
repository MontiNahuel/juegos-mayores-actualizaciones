import React from 'react';

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
  /** Cantidad actual de vidas */
  lives: number;
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
}

/**
 * Componente unificado para mostrar el indicador de vidas (corazones)
 * en el GameHeader de todos los juegos cognitivos.
 */
export const LivesBadge: React.FC<LivesBadgeProps> = ({
  lives,
  maxLives = 5,
  label = 'Vidas:',
  showLabel = true,
  heartSize = 13,
  className = '',
}) => {
  const safeLives = Math.max(0, Math.min(lives, maxLives));
  const isCritical = safeLives === 1;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-2xs transition-colors duration-200 select-none ${
        isCritical
          ? 'bg-rose-100/90 border-rose-300 text-rose-800 animate-pulse'
          : 'bg-rose-50/80 border-rose-200 text-rose-700'
      } ${className}`}
      title={`${safeLives} de ${maxLives} vidas restantes`}
      aria-label={`${safeLives} de ${maxLives} vidas restantes`}
    >
      {showLabel && (
        <span className="text-xs font-bold hidden sm:inline">
          {label}
        </span>
      )}
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxLives }).map((_, i) => (
          <IconHeart
            key={i}
            filled={i < safeLives}
            size={heartSize}
          />
        ))}
      </div>
    </div>
  );
};
