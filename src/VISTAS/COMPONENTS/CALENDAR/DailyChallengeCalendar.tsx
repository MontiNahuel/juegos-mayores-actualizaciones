import React, { useState, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { IonContent, IonPage } from '@ionic/react';
import {
  type DailyChallengeCalendarProps,
  type DayChallenge,
  type CalendarTheme,
  DEFAULT_CALENDAR_THEME,
} from './types';
import { useGameCalendar } from './useGameCalendar';
import { CalendarHeader } from './CalendarHeader';
import { CalendarHeroCard } from './CalendarHeroCard';
import { CalendarGrid } from './CalendarGrid';
import { IconInfo, IconClose, IconCheck, IconStarSolid } from './icons';

export const DailyChallengeCalendar: React.FC<DailyChallengeCalendarProps> = ({
  gameId,
  title,
  heroBadge,
  heroSubtitle,
  playRoute,
  onPlayChallenge,
  year,
  month,
  todayDay,
  theme: themeProp,
  onBack,
  renderCompletedModal,
}) => {
  const navigate = useNavigate();

  const theme: CalendarTheme = useMemo(
    () => ({ ...DEFAULT_CALENDAR_THEME, ...themeProp }),
    [themeProp]
  );

  const {
    challenges,
    todayChallenge,
    loading,
    monthName,
    year: resolvedYear,
    month: resolvedMonth,
    canGoPrev,
    canGoNext,
    goToPreviousMonth,
    goToNextMonth,
  } = useGameCalendar({
    gameId,
    year,
    month,
    todayDay,
  });

  const [selectedCompleted, setSelectedCompleted] = useState<DayChallenge | null>(null);
  const [futureNotice, setFutureNotice] = useState<string | null>(null);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/menu');
    }
  };

  const handleCellClick = (item: DayChallenge) => {
    if (item.status === 'completed') {
      setSelectedCompleted(item);
    } else if (item.status === 'pending') {
      if (onPlayChallenge) { onPlayChallenge(item); } else if (playRoute) { navigate(playRoute, {
        state: {
          challenge: {
            day: item.day,
            dateStr: item.dateStr,
            dateKey: item.dateKey,
            config: item.config,
            // Compatibilidad directa para Wordle y juegos con solución/pistas
            word: item.config?.solution || item.completedData?.word,
            hints: item.config?.hints,
          },
        },
      }); }
    } else {
      setFutureNotice(`El desafío del día ${item.day} estará disponible el ${item.dateStr}.`);
      setTimeout(() => setFutureNotice(null), 3500);
    }
  };

  return (
    <IonPage style={{ background: '#F4F6F9' }}>
      {/* Estilos responsive compartidos para todas las vistas de calendario */}
      <style>{`
        .calendar-shared-back-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #F4F6F9;
          border: 1px solid #DEE3EA;
          border-radius: 14px;
          color: #294C6B;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: background-color 0.15s ease;
        }
        .calendar-shared-back-btn:active {
          background-color: #E2E8F0;
        }
        @media (max-width: 639px) {
          .calendar-shared-back-btn {
            width: 44px;
            height: 44px;
            padding: 0;
          }
          .calendar-shared-back-btn .btn-text {
            display: none;
          }
        }
        @media (min-width: 640px) {
          .calendar-shared-back-btn {
            min-height: 44px;
            padding: 9px 18px;
            gap: 8px;
          }
          .calendar-shared-back-btn .btn-text {
            display: inline;
          }
        }
        @keyframes calendarSharedModalFade {
          from { opacity: 0; transform: scale(0.92) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .calendar-shared-modal-card {
          animation: calendarSharedModalFade 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes calendarSharedSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* --- Reglas exclusivas para celulares (< 640px) --- */
        @media (max-width: 639px) {
          .calendar-shared-container {
            padding: 12px 6px max(calc(env(safe-area-inset-bottom, 0px) + 28px), 48px) !important;
            width: 100% !important;
            box-sizing: border-box !important;
            overflow-x: hidden !important;
          }
          .calendar-shared-hero-card {
            padding: 14px 14px !important;
            border-radius: 16px !important;
            box-sizing: border-box !important;
          }
          .calendar-shared-cal-card {
            padding: 12px 6px 14px !important;
            border-radius: 16px !important;
            gap: 10px !important;
            box-sizing: border-box !important;
            width: 100% !important;
            overflow: visible !important;
          }
          .calendar-shared-cal-body {
            min-height: 222px !important;
            height: auto !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .calendar-shared-cal-grid {
            gap: 3px !important;
            grid-template-columns: repeat(7, minmax(0, 1fr)) !important;
            box-sizing: border-box !important;
            width: 100% !important;
          }
          .calendar-shared-cal-weekday {
            font-size: 10px !important;
            padding: 1px 0 !important;
            min-width: 0 !important;
            overflow: hidden !important;
          }
          .calendar-shared-cell {
            min-height: 42px !important;
            height: 42px !important;
            min-width: 0 !important;
            padding: 3px 2px 3px !important;
            border-radius: 8px !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
          }
          .calendar-shared-cal-cell-empty {
            min-height: 42px !important;
            height: 42px !important;
            border-radius: 8px !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
          }
          .calendar-shared-day-num {
            font-size: 12px !important;
            padding-left: 1px !important;
          }
          .calendar-shared-jugar-badge {
            display: none !important;
          }
          .calendar-shared-today-top-badge {
            display: none !important;
          }
          .calendar-shared-today-bottom-text {
            display: inline-block !important;
          }
          .calendar-shared-check-icon {
            width: 13px !important;
            height: 13px !important;
          }
          .calendar-shared-play-icon {
            display: inline-block !important;
            width: 10px !important;
            height: 10px !important;
          }
          .calendar-shared-lock-icon {
            width: 10px !important;
            height: 10px !important;
          }
        }

        /* --- Reglas para tablets y escritorio (>= 640px) --- */
        @media (min-width: 640px) {
          .calendar-shared-cal-body {
            min-height: 300px !important;
            height: auto !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .calendar-shared-cal-grid {
            grid-template-columns: repeat(7, minmax(0, 1fr)) !important;
          }
          .calendar-shared-today-bottom-text {
            display: none !important;
          }
          .calendar-shared-today-top-badge {
            display: inline-block !important;
          }
          .calendar-shared-play-icon {
            display: none !important;
          }
          .calendar-shared-jugar-badge {
            display: inline-flex !important;
          }
        }
      `}</style>

      {/* Header Unificado */}
      <CalendarHeader
        title={title}
        onBack={handleBack}
        primaryColor={theme.primaryBlue}
      />

      <IonContent style={{ '--background': '#F4F6F9' } as CSSProperties}>
        <div
          className="calendar-shared-container"
          style={{
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            margin: '0 auto',
            maxWidth: 560,
            padding: '16px 14px max(calc(env(safe-area-inset-bottom, 0px) + 28px), 48px)',
            userSelect: 'none',
            width: '100%',
          }}
        >
          {/* Notificación flotante para días futuros */}
          {futureNotice && (
            <div
              style={{
                alignItems: 'center',
                background: theme.primaryBlue,
                border: `1px solid ${theme.accentTeal}`,
                borderRadius: 14,
                boxShadow: '0 4px 14px rgba(41, 76, 107, 0.25)',
                color: '#FFFFFF',
                display: 'flex',
                fontSize: 13,
                fontWeight: 600,
                gap: 10,
                justifyContent: 'space-between',
                padding: '10px 14px',
              }}
            >
              <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
                <IconInfo size={19} color={theme.accentTeal} />
                <span>{futureNotice}</span>
              </div>
              <button
                onClick={() => setFutureNotice(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  padding: 4,
                }}
              >
                <IconClose size={15} color="#CBD5E1" />
              </button>
            </div>
          )}

          {/* Tarjeta Hero: Desafío de HOY */}
          <CalendarHeroCard
            todayChallenge={todayChallenge}
            heroBadge={heroBadge}
            heroSubtitle={heroSubtitle}
            theme={theme}
            onPlayClick={handleCellClick}
          />

          {/* Calendario Mensual */}
          <CalendarGrid
            challenges={challenges}
            loading={loading}
            year={resolvedYear}
            month={resolvedMonth}
            monthName={monthName}
            theme={theme}
            canGoPrev={canGoPrev}
            canGoNext={canGoNext}
            onPrevMonth={goToPreviousMonth}
            onNextMonth={goToNextMonth}
            onCellClick={handleCellClick}
          />
        </div>

        {/* Modal de Día Completado: Especializado del juego o fallback universal */}
        {selectedCompleted && (
          renderCompletedModal ? (
            renderCompletedModal(selectedCompleted, () => setSelectedCompleted(null))
          ) : (
            /* Fallback universal si el juego no proporciona modal propio */
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
                    background: theme.completedBg,
                    borderRadius: 999,
                    display: 'flex',
                    height: 48,
                    justifyContent: 'center',
                    margin: '0 auto 10px',
                    width: 48,
                  }}
                >
                  <IconCheck size={26} color={theme.completedIconColor} />
                </div>

                <h3
                  style={{
                    color: theme.primaryBlue,
                    fontSize: 18,
                    fontWeight: 900,
                    margin: 0,
                  }}
                >
                  Desafío del {selectedCompleted.dateStr}
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
                  <p style={{ color: '#64748B', fontSize: 12, margin: '4px 0' }}>
                    ¡Completado con éxito!
                  </p>
                  {selectedCompleted.stars != null && (
                    <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginTop: 8 }}>
                      {Array.from({ length: selectedCompleted.stars || 1 }).map((_, i) => (
                        <IconStarSolid key={i} size={19} color="#F59E0B" />
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setSelectedCompleted(null)}
                  style={{
                    background: theme.primaryBlue,
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
          )
        )}
      </IonContent>
    </IonPage>
  );
};

