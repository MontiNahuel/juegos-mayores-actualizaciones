import React from 'react';
import type { DayChallenge } from '../../COMPONENTS/CALENDAR/types';
import { IconCheck, IconStarSolid } from '../../COMPONENTS/CALENDAR/icons';
import { usePlayerEconomy } from '../../../context/PlayerEconomyContext';

interface CrucigramaCompletedModalProps {
  challenge: Partial<DayChallenge> & { dateStr: string; config?: any; stars?: number };
  isGameOver?: boolean;
  onRestart?: () => void;
  onClose: () => void;
}

export const CrucigramaCompletedModal: React.FC<CrucigramaCompletedModalProps> = ({
  challenge,
  isGameOver = false,
  onRestart,
  onClose,
}) => {
  const economy = usePlayerEconomy();
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
            fontWeight: 900,
            margin: '0 0 4px',
          }}
        >
          {isGameOver ? '¡Sin Vidas Restantes!' : '¡Crucigrama Completado!'}
        </h3>
        <p style={{ color: '#64748B', fontSize: 13, margin: 0 }}>{challenge.dateStr}</p>

        {isGameOver ? (
          <div style={{ margin: '16px 0 24px' }}>
            <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.5, margin: 0 }}>
              Has consumido todas tus vidas en este crucigrama. ¡No te preocupes! Podés intentarlo nuevamente cuando quieras.
            </p>
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                gap: 4,
                justifyContent: 'center',
                margin: '12px 0 14px',
              }}
            >
              {Array.from({ length: 3 }).map((_, i) => (
                <IconStarSolid
                  key={i}
                  size={24}
                  color={i < starsCount ? '#F59E0B' : '#CBD5E1'}
                />
              ))}
            </div>

            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 14,
                display: 'flex',
                justifyContent: 'space-around',
                padding: '10px 12px',
                marginBottom: 14,
              }}
            >
              <div>
                <span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Tema</span>
                <p style={{ color: '#1E3A5F', fontSize: 14, fontWeight: 800, margin: '2px 0 0' }}>{themeTitle}</p>
              </div>
              <div style={{ borderLeft: '1px solid #E2E8F0' }} />
              <div>
                <span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Puntaje</span>
                <p style={{ color: '#17695F', fontSize: 14, fontWeight: 800, margin: '2px 0 0' }}>+{score} pts</p>
              </div>
              {formattedTime && (
                <>
                  <div style={{ borderLeft: '1px solid #E2E8F0' }} />
                  <div>
                    <span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Tiempo</span>
                    <p style={{ color: '#294C6B', fontSize: 14, fontWeight: 800, margin: '2px 0 0' }}>{formattedTime}</p>
                  </div>
                </>
              )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', textAlign: 'left', marginBottom: 16, paddingRight: 4, maxHeight: 180 }}>
              <p style={{ color: '#64748B', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 8px' }}>
                Palabras resueltas ({wordsList.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
          </>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {isGameOver && (
            <button
              type="button"
              onClick={economy.abrirMiniTienda}
              style={{
                background: '#BE123C',
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
              ❤️ Conseguir Vidas en la Tienda
            </button>
          )}

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
            Volver al calendario
          </button>
        </div>
      </div>
    </div>
  );
};
