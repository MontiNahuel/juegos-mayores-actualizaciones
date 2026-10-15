import React from 'react';
import type { DayChallenge } from '../../COMPONENTS/CALENDAR/types';
import { IconCheck, IconStarSolid } from '../../COMPONENTS/CALENDAR/icons';

interface CrucigramaCompletedModalProps {
  challenge: Partial<DayChallenge> & { dateStr: string; config?: any };
  onClose: () => void;
}

export const CrucigramaCompletedModal: React.FC<CrucigramaCompletedModalProps> = ({ challenge, onClose }) => {
  const themeTitle = challenge.config?.theme || 'Crucigrama cotidiano';
  const wordsList: any[] = challenge.config?.words || [];
  const starsCount = challenge.stars || challenge.completedData?.stars || 3;
  const score = challenge.score || challenge.completedData?.score || 100;
  const timeTaken = challenge.completedData?.gameData?.timeTaken || challenge.config?.timeTaken;

  const formatTime = (secs?: number) => {
    if (!secs || isNaN(secs)) return null;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formattedTime = formatTime(timeTaken);

  return (
    <div
      style={{
        alignItems: 'center',
        background: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        inset: 0,
        justifyContent: 'center',
        padding: '16px 16px max(calc(env(safe-area-inset-bottom, 0px) + 24px), 32px)',
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
          maxWidth: 420,
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 20px 20px',
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
            height: 52,
            justifyContent: 'center',
            margin: '0 auto 12px',
            width: 52,
          }}
        >
          <IconCheck size={28} color="#17695F" />
        </div>

        <h3
          style={{
            color: '#294C6B',
            fontSize: 20,
            fontWeight: 900,
            margin: 0,
          }}
        >
          ¡Crucigrama Completado!
        </h3>

        <p
          style={{
            color: '#64748B',
            fontSize: 13,
            margin: '4px 0 12px',
          }}
        >
          Desafío del {challenge.dateStr}
        </p>

        {/* Estrellas */}
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            gap: 6,
            justifyContent: 'center',
            marginBottom: 14,
          }}
        >
          {[1, 2, 3].map((starIdx) => (
            <IconStarSolid
              key={starIdx}
              size={26}
              color={starIdx <= starsCount ? '#F59E0B' : '#E2E8F0'}
            />
          ))}
        </div>

        {/* Datos clave: Puntos y Tiempo */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: formattedTime ? '1fr 1fr' : '1fr',
            gap: 10,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 14,
              padding: '10px 12px',
            }}
          >
            <span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
              Puntaje
            </span>
            <p style={{ color: '#294C6B', fontSize: 18, fontWeight: 900, margin: '2px 0 0' }}>
              {score} pts
            </p>
          </div>
          {formattedTime && (
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 14,
                padding: '10px 12px',
              }}
            >
              <span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                Tiempo
              </span>
              <p style={{ color: '#294C6B', fontSize: 18, fontWeight: 900, margin: '2px 0 0' }}>
                {formattedTime}
              </p>
            </div>
          )}
        </div>

        {/* Tema y Palabras resueltas */}
        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 16,
            padding: '12px 14px',
            textAlign: 'left',
            overflowY: 'auto',
            maxHeight: 200,
            marginBottom: 16,
          }}
        >
          <p
            style={{
              color: '#64748B',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.04em',
              margin: '0 0 4px',
              textTransform: 'uppercase',
            }}
          >
            Tema: {themeTitle}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {wordsList.map((w, idx) => {
              const wordStr = typeof w === 'string' ? w : w.word;
              const rawClue = typeof w === 'object' && w.clue ? w.clue : '';
              const clueStr = rawClue.replace(/^Definici[oó]n\s*[:\-]?\s*/i, '').trim();
              const dirBadge = typeof w === 'object' && w.direction ? (w.direction === 'horizontal' ? 'H' : 'V') : '';
              return (
                <div key={idx} style={{ fontSize: 13, borderBottom: idx < wordsList.length - 1 ? '1px dashed #E2E8F0' : 'none', paddingBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {dirBadge && (
                      <span style={{ background: '#294C6B', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 5px', borderRadius: 4 }}>
                        {dirBadge}{w.number || ''}
                      </span>
                    )}
                    <strong style={{ color: '#0F172A', letterSpacing: '0.05em' }}>{wordStr}</strong>
                  </div>
                  {clueStr && (
                    <p style={{ color: '#475569', fontSize: 12, margin: '2px 0 0', lineHeight: 1.35 }}>
                      {clueStr}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            background: '#294C6B',
            border: 'none',
            borderRadius: 14,
            color: '#FFFFFF',
            cursor: 'pointer',
            fontSize: 15,
            fontWeight: 800,
            padding: '14px',
            width: '100%',
          }}
        >
          Volver al calendario
        </button>
      </div>
    </div>
  );
};
