import React from 'react';
import type { DayChallenge } from '../COMPONENTS/CALENDAR/types';
import { IconCheck, IconStarSolid } from '../COMPONENTS/CALENDAR/icons';

interface WordleCompletedModalProps {
  challenge: DayChallenge;
  onClose: () => void;
}

export const WordleCompletedModal: React.FC<WordleCompletedModalProps> = ({ challenge, onClose }) => {
  const wordDiscovered = challenge.completedData?.word || challenge.config?.solution || 'HOGAR';
  const attemptsUsed = challenge.attempts || challenge.completedData?.attempts || 1;
  const starsCount = challenge.stars || challenge.completedData?.stars || 1;

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
            padding: '12px 14px',
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
            Palabra descubierta
          </p>
          <p
            style={{
              color: '#17695F',
              fontSize: 24,
              fontWeight: 900,
              letterSpacing: '0.12em',
              margin: '6px 0',
            }}
          >
            {wordDiscovered}
          </p>
          <p
            style={{
              color: '#475569',
              fontSize: 12,
              margin: 0,
            }}
          >
            Resuelto en <strong>{attemptsUsed}</strong> de 6 intentos
          </p>

          <div
            style={{
              display: 'flex',
              gap: 3,
              justifyContent: 'center',
              marginTop: 8,
            }}
          >
            {Array.from({ length: starsCount }).map((_, i) => (
              <IconStarSolid key={i} size={19} color="#F59E0B" />
            ))}
          </div>
        </div>

        <p
          style={{
            color: '#64748B',
            fontSize: 12,
            marginBottom: 16,
            marginTop: 0,
          }}
        >
          Este desafío ya fue completado y registrado en tu gimnasia cognitiva.
        </p>

        <button
          onClick={onClose}
          style={{
            background: '#294C6B',
            border: 'none',
            borderRadius: 12,
            color: '#FFFFFF',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 800,
            padding: '11px 0',
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
