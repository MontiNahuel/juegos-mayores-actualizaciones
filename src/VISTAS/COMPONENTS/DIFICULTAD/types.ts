/* Define la forma de los datos de dificultad para que sus piezas se entiendan. */
export type DifficultyLevel = 1 | 2 | 3;

export interface DifficultyOptionConfig {
  level: DifficultyLevel;
  title: string;
  description: string;
  stars?: string;
  badge?: string;
  lives?: number;
  leftBorderColor: string;
  leftBorderHex?: string;
  actionBgColor: string;
  actionTextColor: string;
  actionHoverBgColor: string;
}

export interface DifficultyModalProps {
  title?: string;
  subtitle?: string;
  categoryBadge?: string;
  icon?: string;
  options?: DifficultyOptionConfig[];
  onSelectDifficulty: (level: DifficultyLevel) => void;
  onClose: () => void;
}

export const DEFAULT_DIFFICULTY_OPTIONS: DifficultyOptionConfig[] = [
  {
    level: 1,
    title: 'Nivel Inicial',
    description: 'Ideal para novatos. Una partida tranquila para empezar sin apuro.',
    stars: '★☆☆',
    badge: 'Recomendado',
    leftBorderColor: 'border-l-emerald-500',
    leftBorderHex: '#10B981',
    actionBgColor: 'bg-emerald-50',
    actionTextColor: 'text-emerald-700',
    actionHoverBgColor: 'group-hover:bg-emerald-600',
  },
  {
    level: 2,
    title: 'Nivel Intermedio',
    description: 'Para jugadores con experiencia. Un desafío equilibrado de lógica y deducción.',
    stars: '★★☆',
    leftBorderColor: 'border-l-amber-500',
    leftBorderHex: '#F59E0B',
    actionBgColor: 'bg-amber-50',
    actionTextColor: 'text-amber-700',
    actionHoverBgColor: 'group-hover:bg-amber-600',
  },
  {
    level: 3,
    title: 'Nivel Experto',
    description: 'Solo para quienes buscan un reto de verdad. Máxima exigencia para ejercitar la mente.',
    stars: '★★★',
    leftBorderColor: 'border-l-rose-500',
    leftBorderHex: '#F43F5E',
    actionBgColor: 'bg-rose-50',
    actionTextColor: 'text-rose-700',
    actionHoverBgColor: 'group-hover:bg-rose-600',
  },
];
