/* Reúne dibujos reutilizables para acciones e ilustraciones. */
import React from 'react';

const defaultProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

// Dibuja el icono de lock para reutilizarlo en pantalla.
export const LockIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

// Dibuja el icono de unlock para reutilizarlo en pantalla.
export const UnlockIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
  </svg>
);

// Dibuja el icono de user para reutilizarlo en pantalla.
export const UserIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// Dibuja el icono de users para reutilizarlo en pantalla.
export const UsersIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

// Dibuja el icono de phone para reutilizarlo en pantalla.
export const PhoneIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

// Dibuja el icono de check para reutilizarlo en pantalla.
export const CheckIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// Dibuja el icono de alert triangle para reutilizarlo en pantalla.
export const AlertTriangleIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// Dibuja el icono de shield para reutilizarlo en pantalla.
export const ShieldIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

// Dibuja el icono de plus para reutilizarlo en pantalla.
export const PlusIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// Dibuja el icono de search para reutilizarlo en pantalla.
export const SearchIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

// Dibuja el icono de x para reutilizarlo en pantalla.
export const XIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Dibuja el icono de copy para reutilizarlo en pantalla.
export const CopyIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

// Dibuja el icono de log out para reutilizarlo en pantalla.
export const LogOutIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

// Dibuja el icono de edit para reutilizarlo en pantalla.
export const EditIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

// Dibuja el icono de link para reutilizarlo en pantalla.
export const LinkIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

// Dibuja el icono de clock para reutilizarlo en pantalla.
export const ClockIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

// Dibuja el icono de mail para reutilizarlo en pantalla.
export const MailIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

// Dibuja el icono de refresh para reutilizarlo en pantalla.
export const RefreshIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

// Dibuja el icono de tag para reutilizarlo en pantalla.
export const TagIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
    <path d="M7 7h.01" />
  </svg>
);

// Dibuja el icono de calendar para reutilizarlo en pantalla.
export const CalendarIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

// Dibuja el icono de book open para reutilizarlo en pantalla.
export const BookOpenIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

// Dibuja el icono de crown para reutilizarlo en pantalla.
export const CrownIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5v-2z" />
  </svg>
);

// Dibuja el icono de layers para reutilizarlo en pantalla.
export const LayersIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

// Dibuja el icono de trash para reutilizarlo en pantalla.
export const TrashIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

// Dibuja el icono de coins para reutilizarlo en pantalla.
export const CoinsIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <circle cx="8" cy="8" r="6" />
    <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
    <path d="M7 6h1v4H7" />
    <path d="m16.71 13.88.7.71-2.82 2.82" />
  </svg>
);

// Dibuja el icono de heart para reutilizarlo en pantalla.
export const HeartIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

// Dibuja el icono de sparkles para reutilizarlo en pantalla.
export const SparklesIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);

// Dibuja el icono de menu para reutilizarlo en pantalla.
export const MenuIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="18" x2="20" y2="18" />
  </svg>
);

// Dibuja el icono de filter para reutilizarlo en pantalla.
export const FilterIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

// Dibuja el icono de chevron right para reutilizarlo en pantalla.
export const ChevronRightIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// Dibuja el icono de message square para reutilizarlo en pantalla.
export const MessageSquareIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

// Dibuja el icono de file text para reutilizarlo en pantalla.
export const FileTextIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

// Dibuja el icono de image para reutilizarlo en pantalla.
export const ImageIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </svg>
);

// Dibuja el icono de upload cloud para reutilizarlo en pantalla.
export const UploadCloudIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="M12 12v9" />
    <path d="m16 16-4-4-4 4" />
  </svg>
);

// Dibuja el icono de skull para reutilizarlo en pantalla.
export const SkullIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <path d="m12.5 17-.5-1-.5 1h1z" />
    <path d="M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z" />
    <circle cx="9" cy="12" r="1" />
    <circle cx="15" cy="12" r="1" />
  </svg>
);




// Dibuja el icono de git branch para reutilizarlo en pantalla.
export const GitBranchIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <line x1="6" y1="3" x2="6" y2="15" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M18 9a9 9 0 0 1-9 9" />
  </svg>
);

// Dibuja una grilla de tres por tres para los juegos de tablero.
export const GridIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <line x1="15" y1="3" x2="15" y2="21" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="15" x2="21" y2="15" />
  </svg>
);

// Dibuja una pieza de rompecabezas para el crucigrama.
export const PuzzleIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.77c.24-.24.581-.353.917-.303.515.077.877.528 1.073 1.01a2.5 2.5 0 1 0 3.259-3.259c-.482-.196-.933-.558-1.01-1.073-.05-.336.062-.676.303-.917l1.525-1.525A2.402 2.402 0 0 1 12 1.998c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z" />
  </svg>
);

// Dibuja una estrella rellena o vacía según la calificación.
export const StarIcon = ({ size = 16, className = '', filled = false, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    {...defaultProps}
    fill={filled ? 'currentColor' : 'none'}
    className={`flex-shrink-0 ${className}`}
    {...props}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// Dibuja un trofeo para la calificación destacada.
export const TrophyIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

// Dibuja una bolsa de compras para la mini-tienda.
export const ShoppingBagIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <path d="M3 6h18" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

// Dibuja un cronómetro para las escalas de tiempo.
export const StopwatchIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <circle cx="12" cy="14" r="8" />
    <path d="M12 10v4l2 2" />
    <path d="M10 2h4" />
    <path d="m12 2 0 4" />
  </svg>
);

// Dibuja un pulgar arriba para la calificación aprobada.
export const ThumbsUpIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <path d="M7 10v12" />
    <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
  </svg>
);

// Dibuja un círculo con cruz para la calificación fallida.
export const XCircleIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </svg>
);
