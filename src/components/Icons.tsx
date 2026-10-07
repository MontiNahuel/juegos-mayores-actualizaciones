import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const FlameIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12.75 2.25c.3 0 .58.17.71.44.82 1.68 2.04 3.73 3.54 5.31 1.63 1.72 3 3.75 3 6.25 0 4.42-3.58 8-8 8s-8-3.58-8-8c0-3.57 2.14-6.44 4.39-8.49.5-.46 1.28-.43 1.74.07.28.31.42.72.39 1.14-.14 1.74.34 3.1 1.19 3.95.19.19.46.28.73.23.27-.05.5-.22.62-.47 1.13-2.36 1.4-5.26.69-8.43zm-2.75 12c-1.38 0-2.5 1.12-2.5 2.5 0 1.66 1.34 3 3 3s3-1.34 3-3c0-1.1-.9-2-2-2-.3 0-.6.1-.85.25.22-.44.35-.93.35-1.45 0-.72-.38-1.3-.92-1.3h-.08z" />
  </svg>
);

export const StarIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

export const PlayIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M8 5.14v13.72a1 1 0 001.55.83l11-6.86a1 1 0 000-1.66l-11-6.86A1 1 0 008 5.14z" />
  </svg>
);

export const BrainIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-5.04z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-5.04z" />
  </svg>
);

export const CalendarCheckIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="M9 16l2 2 4-4" />
  </svg>
);

export const SparklesIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 2l1.9 4.9L18 8.8l-4.1 1.9L12 15.6l-1.9-4.9L6 8.8l4.1-1.9L12 2zm7 13l.9 2.3 2.1.9-2.1.9-.9 2.3-.9-2.3-2.1-.9 2.1-.9.9-2.3zM5 14l.9 2.3 2.1.9-2.1.9-.9 2.3-.9-2.3-2.1-.9 2.1-.9.9-2.3z" />
  </svg>
);

export const WordleIllustration: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 260 140" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="260" height="140" rx="16" fill="#EEF2F6" />
    {/* Grid of Wordle tiles */}
    <g transform="translate(42, 22)">
      {/* Row 1 */}
      <rect x="0" y="0" width="32" height="32" rx="6" fill="#10B981" />
      <text x="16" y="22" fill="white" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">P</text>
      <rect x="36" y="0" width="32" height="32" rx="6" fill="#F59E0B" />
      <text x="52" y="22" fill="white" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">A</text>
      <rect x="72" y="0" width="32" height="32" rx="6" fill="#94A3B8" />
      <text x="88" y="22" fill="white" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">N</text>
      <rect x="108" y="0" width="32" height="32" rx="6" fill="#10B981" />
      <text x="124" y="22" fill="white" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">E</text>
      <rect x="144" y="0" width="32" height="32" rx="6" fill="#10B981" />
      <text x="160" y="22" fill="white" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">L</text>

      {/* Row 2 (Success row) */}
      <rect x="0" y="38" width="32" height="32" rx="6" fill="#059669" />
      <text x="16" y="60" fill="white" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">P</text>
      <rect x="36" y="38" width="32" height="32" rx="6" fill="#059669" />
      <text x="52" y="60" fill="white" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">L</text>
      <rect x="72" y="38" width="32" height="32" rx="6" fill="#059669" />
      <text x="88" y="60" fill="white" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">A</text>
      <rect x="108" y="38" width="32" height="32" rx="6" fill="#059669" />
      <text x="124" y="60" fill="white" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">Z</text>
      <rect x="144" y="38" width="32" height="32" rx="6" fill="#059669" />
      <text x="160" y="60" fill="white" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">A</text>
    </g>
  </svg>
);

export const SudokuIllustration: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 260 140" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="260" height="140" rx="16" fill="#F0FDF4" />
    <g transform="translate(70, 16)">
      {/* 4x4 mini grid */}
      <rect x="0" y="0" width="120" height="108" rx="8" fill="white" stroke="#CBD5E1" strokeWidth="2" />
      <line x1="60" y1="0" x2="60" y2="108" stroke="#002B5E" strokeWidth="3" />
      <line x1="0" y1="54" x2="120" y2="54" stroke="#002B5E" strokeWidth="3" />
      <line x1="30" y1="0" x2="30" y2="108" stroke="#E2E8F0" strokeWidth="1.5" />
      <line x1="90" y1="0" x2="90" y2="108" stroke="#E2E8F0" strokeWidth="1.5" />
      <line x1="0" y1="27" x2="120" y2="27" stroke="#E2E8F0" strokeWidth="1.5" />
      <line x1="0" y1="81" x2="120" y2="81" stroke="#E2E8F0" strokeWidth="1.5" />

      {/* Sample numbers with clear contrast */}
      <text x="15" y="20" fill="#002B5E" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">1</text>
      <text x="45" y="20" fill="#64748B" fontSize="16" textAnchor="middle" fontFamily="sans-serif">·</text>
      <text x="75" y="20" fill="#002B5E" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">3</text>
      <text x="105" y="20" fill="#64748B" fontSize="16" textAnchor="middle" fontFamily="sans-serif">4</text>

      <text x="15" y="47" fill="#64748B" fontSize="16" textAnchor="middle" fontFamily="sans-serif">3</text>
      <text x="45" y="47" fill="#059669" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">4</text>
      <text x="75" y="47" fill="#64748B" fontSize="16" textAnchor="middle" fontFamily="sans-serif">·</text>
      <text x="105" y="47" fill="#002B5E" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">2</text>

      <text x="15" y="74" fill="#002B5E" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">2</text>
      <text x="45" y="74" fill="#64748B" fontSize="16" textAnchor="middle" fontFamily="sans-serif">·</text>
      <text x="75" y="74" fill="#059669" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">4</text>
      <text x="105" y="74" fill="#64748B" fontSize="16" textAnchor="middle" fontFamily="sans-serif">1</text>

      <text x="15" y="101" fill="#64748B" fontSize="16" textAnchor="middle" fontFamily="sans-serif">·</text>
      <text x="45" y="101" fill="#002B5E" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">1</text>
      <text x="75" y="101" fill="#64748B" fontSize="16" textAnchor="middle" fontFamily="sans-serif">2</text>
      <text x="105" y="101" fill="#002B5E" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">3</text>
    </g>
  </svg>
);

export const CrosswordIllustration: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 260 140" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="260" height="140" rx="16" fill="#F8FAFC" />
    <g transform="translate(68, 20)">
      {/* Crucigrama tiles */}
      <rect x="0" y="0" width="30" height="30" rx="4" fill="white" stroke="#CBD5E1" strokeWidth="2" />
      <text x="15" y="21" fill="#002B5E" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">S</text>

      <rect x="32" y="0" width="30" height="30" rx="4" fill="white" stroke="#CBD5E1" strokeWidth="2" />
      <text x="47" y="21" fill="#002B5E" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">O</text>

      <rect x="64" y="0" width="30" height="30" rx="4" fill="#002B5E" stroke="#002B5E" strokeWidth="2" />
      <text x="79" y="21" fill="white" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">L</text>

      <rect x="64" y="32" width="30" height="30" rx="4" fill="white" stroke="#CBD5E1" strokeWidth="2" />
      <text x="79" y="53" fill="#002B5E" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">U</text>

      <rect x="64" y="64" width="30" height="30" rx="4" fill="white" stroke="#CBD5E1" strokeWidth="2" />
      <text x="79" y="85" fill="#002B5E" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">N</text>

      <rect x="96" y="64" width="30" height="30" rx="4" fill="white" stroke="#CBD5E1" strokeWidth="2" />
      <text x="111" y="85" fill="#002B5E" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">A</text>
    </g>
  </svg>
);

export const RouteIllustration: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 260 140" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="260" height="140" rx="16" fill="#EFF6FF" />
    <g transform="translate(60, 22)">
      {/* Circular target area for UFOV visual field */}
      <circle cx="70" cy="48" r="46" stroke="#93C5FD" strokeWidth="2" strokeDasharray="4 4" fill="white" />
      <circle cx="70" cy="48" r="24" stroke="#3B82F6" strokeWidth="2" fill="#DBEAFE" />
      {/* Center target vehicle/mail */}
      <rect x="60" y="40" width="20" height="16" rx="3" fill="#1D4ED8" />
      <path d="M60 43 L70 50 L80 43" stroke="white" strokeWidth="1.5" />
      {/* Peripheral mailbox alert */}
      <circle cx="106" cy="24" r="10" fill="#EF4444" />
      <text x="106" y="28" fill="white" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">!</text>
    </g>
  </svg>
);
