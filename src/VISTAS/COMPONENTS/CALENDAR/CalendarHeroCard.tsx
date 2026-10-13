import React from 'react';
import type { DayChallenge, CalendarTheme } from './types';
import { IconArrowRight } from './icons';

interface CalendarHeroCardProps {
  todayChallenge: DayChallenge;
  heroBadge?: string;
  heroSubtitle: string;
  theme: CalendarTheme;
  onPlayClick: (challenge: DayChallenge) => void;
}

export const CalendarHeroCard: React.FC<CalendarHeroCardProps> = ({
  todayChallenge,
  heroBadge = '¡Desafío de hoy!',
  heroSubtitle,
  theme,
  onPlayClick,
}) => {
  const isCompleted = todayChallenge.status === 'completed';

  return (
    <div
      className="calendar-shared-hero-card"
      style={{
        background: 'linear-gradient(135deg, #294C6B 0%, #1A344A 100%)',
        border: '1px solid #3A5F82',
        borderRadius: 20,
        boxShadow: '0 4px 16px rgba(41, 76, 107, 0.22)',
        boxSizing: 'border-box',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        padding: '18px 20px',
        position: 'relative',
        width: '100%',
      }}
    >
      <div>
        <span
          style={{
            background: theme.accentTeal,
            borderRadius: 999,
            color: '#1A344A',
            display: 'inline-block',
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: '0.04em',
            marginBottom: 8,
            padding: '3px 10px',
            textTransform: 'uppercase',
          }}
        >
          {heroBadge}
        </span>
        <h2
          style={{
            fontSize: 'clamp(20px, 4.8vw, 24px)',
            fontWeight: 900,
            lineHeight: 1.15,
            margin: 0,
          }}
        >
          {todayChallenge.dayName} {todayChallenge.dateStr}
        </h2>
        <p
          style={{
            color: '#DCE9F2',
            fontSize: 13,
            lineHeight: 1.35,
            margin: '6px 0 0',
          }}
        >
          {heroSubtitle}
        </p>
      </div>

      <button
        onClick={() => onPlayClick(todayChallenge)}
        style={{
          alignItems: 'center',
          background: '#FFFFFF',
          border: 'none',
          borderRadius: 14,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          color: theme.primaryBlue,
          cursor: 'pointer',
          display: 'flex',
          fontSize: 14,
          fontWeight: 900,
          gap: 8,
          justifyContent: 'center',
          marginTop: 14,
          padding: '13px 18px',
          transition: 'transform 0.1s ease',
          width: '100%',
        }}
        className="active:scale-98"
      >
        <span>
          {isCompleted ? 'VER RESULTADO DE HOY' : 'JUGAR DESAFÍO DE HOY'}
        </span>
        <IconArrowRight size={17} color={theme.primaryBlue} />
      </button>
    </div>
  );
};
