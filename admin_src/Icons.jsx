import React from 'react';

const defaultProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export const LockIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export const UnlockIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
  </svg>
);

export const UserIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const UsersIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const PhoneIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

export const CheckIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const AlertTriangleIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export const ShieldIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export const PlusIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const SearchIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export const XIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const CopyIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

export const LogOutIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export const EditIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export const LinkIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

export const ClockIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export const MailIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

export const RefreshIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

export const TagIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
    <path d="M7 7h.01" />
  </svg>
);

export const CalendarIcon = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} className={`flex-shrink-0 ${className}`} {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

