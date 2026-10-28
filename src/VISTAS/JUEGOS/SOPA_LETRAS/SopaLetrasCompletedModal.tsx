import React from 'react';
import type { DayChallenge } from '../../COMPONENTS/CALENDAR/types';
import { IconCheck, IconStarSolid } from '../../COMPONENTS/CALENDAR/icons';

interface SopaLetrasCompletedModalProps {
  challenge: Partial<DayChallenge> & { dateStr?: string; config?: any; stars?: number; completedData?: any };
  isGameOver?: boolean;
  onRestart?: () => void;
  onClose: () => void;
}

export const SopaLetrasCompletedModal: React.FC<SopaLetrasCompletedModalProps> = ({
  challenge,
  isGameOver = false,
  onRestart,
  onClose,
}) => {
  const themeTitle = challenge.config?.theme || 'Palabras temáticas';
  const wordsList: string[] = challenge.config?.words || challenge.completedData?.guesses || [];
  const starsCount = challenge.stars || challenge.completedData?.stars || 3;

  return (
    <div
      style={{
        alignItems: 'center',
        background: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(4px)',
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
          borderRadius: 24,
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          maxWidth: 380,
          padding: '24px 20px 20px',
          textAlign: 'center',
          width: '100%',
        }}
        className="calendar-shared-modal-card"
      >
        <div
          style={{
            alignItems: 'center',
            background: isGameOver ? '#FEE2E2' : '#E8F8F5',
            borderRadius: 999,
            display: 'flex',
            height: 52,
            justifyContent: 'center',
            margin: '0 auto 12px',
            width: 52,
            fontSize: 28,
          }}
        >
          {isGameOver ? '💔' : <IconCheck size={28} color="#17695F" />}
        </div>

        <h3
          style={{
            color: '#1E3A5F',
            fontSize: 20,
            fontWeight: 800,
            margin: 0,
          }}
        >
          {isGameOver ? '¡Sin Vidas Restantes!' : `Desafío del ${challenge.dateStr || ''}`}
        </h3>

        {isGameOver ? (
          <div style={{ margin: '14px 0 20px' }}>
            <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.5, margin: 0 }}>
              Has consumido todas tus vidas en este intento. ¡No te preocupes! Podés intentarlo nuevamente cuando quieras.
            </p>
          </div>
        ) : (
          <div
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 16,
              margin: '14px 0',
              padding: '14px',
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
              Palabras encontradas ({wordsList.length} de {wordsList.length})
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
                <IconStarSolid key={i} size={22} color="#F59E0B" />
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {isGameOver && onRestart && (
            <button
              type="button"
              onClick={onRestart}
              style={{
                background: '#0284C7',
                border: 'none',
                borderRadius: 14,
                color: '#FFFFFF',
                cursor: 'pointer',
                fontSize: 15,
                fontWeight: 800,
                padding: '13px 0',
                width: '100%',
              }}
              className="active:opacity-90 transition-opacity"
            >
              🔄 Intentar de Nuevo
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#1E3A5F',
              border: 'none',
              borderRadius: 14,
              color: '#FFFFFF',
              cursor: 'pointer',
              fontSize: 15,
              fontWeight: 800,
              padding: '13px 0',
              width: '100%',
            }}
            className="active:opacity-90 transition-opacity"
          >
            Volver al Calendario
          </button>
        </div>
      </div>
    </div>
  );
};

export default SopaLetrasCompletedModal;
