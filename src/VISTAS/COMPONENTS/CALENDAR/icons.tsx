/* Reúne los iconos del calendario de desafíos. */
import React from 'react';

// Dibuja el icono de calendar para reutilizarlo en pantalla.
export const IconCalendar: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = '#294C6B' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="3" ry="3" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

// Dibuja el icono de check para reutilizarlo en pantalla.
export const IconCheck: React.FC<{ size?: number; color?: string; className?: string }> = ({ size = 16, color = '#17695F', className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// Dibuja el icono de lock para reutilizarlo en pantalla.
export const IconLock: React.FC<{ size?: number; color?: string; className?: string }> = ({ size = 13, color = '#CBD5E1', className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

// Dibuja el icono de play para reutilizarlo en pantalla.
export const IconPlay: React.FC<{ size?: number; color?: string; className?: string }> = ({ size = 10, color = '#EA580C', className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
    <polygon points="6 3 20 12 6 21 6 3" />
  </svg>
);

// Dibuja el icono de arrow right para reutilizarlo en pantalla.
export const IconArrowRight: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

// Dibuja el icono de star solid para reutilizarlo en pantalla.
export const IconStarSolid: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = '#F59E0B' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// Dibuja el icono de info para reutilizarlo en pantalla.
export const IconInfo: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = '#53BFC9' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

// Dibuja el icono de close para reutilizarlo en pantalla.
export const IconClose: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = '#CBD5E1' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Dibuja el icono de chevron small para reutilizarlo en pantalla.
export const IconChevronSmall: React.FC<{ size?: number; color?: string }> = ({ size = 11, color = '#294C6B' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// Dibuja el icono de chevron left para reutilizarlo en pantalla.
export const IconChevronLeft: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

// Dibuja el icono de chevron right para reutilizarlo en pantalla.
export const IconChevronRight: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// Dibuja el icono de spinner para reutilizarlo en pantalla.
export const IconSpinner: React.FC<{ size?: number; color?: string }> = ({ size = 28, color = '#294C6B' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className="motion-safe:animate-spin"
  >
    <circle cx="12" cy="12" r="9.5" stroke="#E2E8F0" strokeWidth="3" />
    <path d="M12 2.5a9.5 9.5 0 0 1 9.5 9.5" stroke={color} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// Dibuja el icono de coins para reutilizarlo en pantalla.
export const IconCoins: React.FC<{ size?: number; color?: string; className?: string }> = ({ size = 20, color = '#F59E0B', className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="8" cy="8" r="6" />
    <path d="M18 14a6 6 0 0 0-4-5.65" />
    <path d="M14 6a6 6 0 0 1 4 5.65" />
    <circle cx="16" cy="16" r="6" />
  </svg>
);

// Dibuja el icono de crown para reutilizarlo en pantalla.
export const IconCrown: React.FC<{ size?: number; color?: string; className?: string }> = ({ size = 20, color = '#F59E0B', className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
  </svg>
);
