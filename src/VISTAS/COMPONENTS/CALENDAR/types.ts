/* Define la forma de los datos de calendar para que sus piezas se entiendan. */
import type React from 'react';

export interface DayChallenge {
  day: number;
  dateStr: string; // Ej: '9 de Octubre'
  dayName: string; // Ej: 'Viernes'
  dateKey: string; // Ej: '2026-10-09'
  config?: any; // Configuración del desafío desde el backend (solución, pistas, grilla, etc.)
  status: 'completed' | 'pending' | 'locked';
  attempts?: number;
  stars?: number;
  score?: number;
  isToday?: boolean;
  completedData?: any; // Datos registrados al completar (palabra, intentos, tiempo, etc.)
}

export interface CompletedRecord {
  day?: number;
  attempts?: number;
  stars?: number;
  word?: string;
  timeSeconds?: number;
  score?: number;
  dateStr?: string;
  completedAt?: string;
  [key: string]: any;
}

export interface CalendarTheme {
  primaryBlue: string;
  accentTeal: string;
  todayBg: string;
  todayBorder: string;
  todayText: string;
  completedBg: string;
  completedBorder: string;
  completedText: string;
  completedIconColor: string;
  pendingBg: string;
  pendingBorder: string;
  pendingText: string;
  pendingIconColor: string;
  lockedBg: string;
  lockedBorder: string;
  lockedText: string;
  lockedIconColor: string;
}

export const DEFAULT_CALENDAR_THEME: CalendarTheme = {
  primaryBlue: '#294C6B',
  accentTeal: '#53BFC9',
  todayBg: '#294C6B',
  todayBorder: '#53BFC9',
  todayText: '#FFFFFF',
  completedBg: '#E8F8F5',
  completedBorder: '#53BFC9',
  completedText: '#17695F',
  completedIconColor: '#17695F',
  pendingBg: '#FFF3F0',
  pendingBorder: '#E88778',
  pendingText: '#925044',
  pendingIconColor: '#925044',
  lockedBg: '#F4F6F9',
  lockedBorder: '#DEE3EA',
  lockedText: '#69778D',
  lockedIconColor: '#69778D',
};

export interface DailyChallengeCalendarProps {
  gameId: string;
  title: string;
  heroBadge?: string;
  heroSubtitle: string;
  difficulty?: string;
  playRoute?: string;
  onPlayChallenge?: (challenge: DayChallenge) => void;
  year?: number;
  month?: number;
  todayDay?: number;
  theme?: Partial<CalendarTheme>;
  onBack?: () => void;
  renderCompletedModal?: (challenge: DayChallenge, onClose: () => void) => React.ReactNode;
}
