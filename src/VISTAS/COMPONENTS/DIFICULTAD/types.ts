export type DifficultyLevel = 1 | 2 | 3;

export interface DifficultyOptionConfig {
  level: DifficultyLevel;
  title: string;
  description: string;
  badge?: string;
  icon?: string;
  borderColor?: string;
  bgColor?: string;
  textColor?: string;
}

export interface DifficultyModalProps {
  title?: string;
  subtitle?: string;
  icon?: string;
  options?: DifficultyOptionConfig[];
  onSelectDifficulty: (level: DifficultyLevel) => void;
  onClose: () => void;
}

export const DEFAULT_DIFFICULTY_OPTIONS: DifficultyOptionConfig[] = [
  {
    level: 1,
    title: 'Fácil (Bajo)',
    description: 'Ideal para relajarse sin presiones. 7 vidas y más números iniciales revelados.',
    badge: 'Recomendado',
    icon: '🟢',
    borderColor: 'border-emerald-300 hover:border-emerald-500',
    bgColor: 'bg-emerald-50/70 hover:bg-emerald-100/80',
    textColor: 'text-emerald-950',
  },
  {
    level: 2,
    title: 'Medio',
    description: 'Equilibrio perfecto entre concentración y lógica deductiva. 5 vidas.',
    icon: '🟡',
    borderColor: 'border-amber-300 hover:border-amber-500',
    bgColor: 'bg-amber-50/70 hover:bg-amber-100/80',
    textColor: 'text-amber-950',
  },
  {
    level: 3,
    title: 'Alto (Avanzado)',
    description: 'Para ejercitar la mente y memoria al máximo. 3 vidas y tablero más exigente.',
    icon: '🔴',
    borderColor: 'border-rose-300 hover:border-rose-500',
    bgColor: 'bg-rose-50/70 hover:bg-rose-100/80',
    textColor: 'text-rose-950',
  },
];
