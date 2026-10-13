import React from 'react';
import type { DayChallenge } from '../../COMPONENTS/CALENDAR/types';
import { IconCheck, IconStarSolid } from '../../COMPONENTS/CALENDAR/icons';

interface SopaLetrasCompletedModalProps {
  challenge: DayChallenge;
  onClose: () => void;
}

export const SopaLetrasCompletedModal: React.FC<SopaLetrasCompletedModalProps> = ({ challenge, onClose }) => {
  const themeTitle = challenge.config?.theme || 'Palabras temáticas';
  const wordsList: string[] = challenge.config?.words || challenge.completedData?.guesses || [];
  const starsCount = challenge.stars || challenge.completedData?.stars || 3;

  return (
    <div
      style={{
        alignItems: 'center',
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        inset: 0,
        justifyContent: 'center',
        padding: '16px 16px max(calc(env(safe-area-inset-bottom, 0px) + 24px), 48px)',
        position: 'fixed',
        zIndex: 999,
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 20,
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
          maxWidth: 360,
          padding: '22px 20px',
          textAlign: 'center',
          width: '100%',
        }}
        className="calendar-shared-modal-card"
      >
        <div
          style={{
            alignItems: 'center',
            background: '#E8F8F5',
            borderRadius: 999,
            display: 'flex',
            height: 48,
            justifyContent: 'center',
            margin: '0 auto 10px',
            width: 48,
          }}
        >
          <IconCheck size={26} color="#17695F" />
        </div>

        <h3
          style={{
            color: '#294C6B',
            fontSize: 18,
            fontWeight: 900,
            margin: 0,
          }}
        >
          Desafío del {challenge.dateStr}
        </h3>

        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            margin: '12px 0',
            padding: '14px 14px',
          }}
        >
          <p
            style={{
              color: '#64748B',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.04em',
              margin: 0,
              textTransform: 'uppercase',
            }}
          >
            Tema del día
          </p>
          <p
            style={{
              color: '#294C6B',
              fontSize: 16,
              fontWeight: 800,
              margin: '4px 0 10px',
            }}
          >
            {themeTitle}
          </p>

          <p
            style={{
              color: '#64748B',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.04em',
              margin: '8px 0 6px',
              textTransform: 'uppercase',
            }}
          >
            Palabras encontradas (4 de 4)
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              justifyContent: 'center',
              marginTop: 6,
            }}
          >
            {wordsList.map((word, idx) => (
              <span
                key={idx}
                style={{
                  alignItems: 'center',
                  background: '#E8F8F5',
                  border: '1px solid #A3E5D9',
                  borderRadius: 8,
                  color: '#17695F',
                  display: 'inline-flex',
                  fontSize: 12,
                  fontWeight: 800,
                  gap: 4,
                  letterSpacing: '0.05em',
                  padding: '4px 8px',
                }}
              >
                <IconCheck size={12} color="#17695F" />
                {word}
              </span>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              gap: 4,
              justifyContent: 'center',
              marginTop: 12,
            }}
          >
            {Array.from({ length: starsCount }).map((_, i) => (
              <IconStarSolid key={i} size={20} color="#F59E0B" />
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: '#294C6B',
            border: 'none',
            borderRadius: 12,
            color: '#FFFFFF',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 800,
            padding: '12px 0',
            width: '100%',
          }}
          className="active:bg-slate-800 transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default SopaLetrasCompletedModal;
