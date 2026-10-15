import React from 'react';
import { useNavigate } from 'react-router-dom';

export interface GameHeaderProps {
  /** Título principal del juego (ej: "Palabra del día", "Sudoku", "Crucigrama 7x7", "Sopa de letras") */
  title: string;
  /** Subtítulo opcional o texto complementario */
  subtitle?: React.ReactNode;
  /** Ranura para badges informativos (dificultad, vidas, cronómetro, chips de tema) */
  badges?: React.ReactNode;
  /** Callback personalizado al presionar volver atrás */
  onBack?: () => void;
  /** Ruta a la que debe navegar al volver atrás (por defecto: vuelve al calendario del juego o anterior) */
  backRoute?: string;
  /** Texto del botón de volver (por defecto: "Calendario", en móviles chicos se oculta para no apretar el centro) */
  backLabel?: string;
  /** Ranura para acción secundaria a la derecha (antes del logo, ej: botón de pistas o lista de pistas) */
  rightAction?: React.ReactNode;
  /** Si debe mostrar el logo institucional de Asistodo a la derecha (por defecto: true) */
  showLogo?: boolean;
  /** Clases CSS adicionales */
  className?: string;
  /** Estilos inline adicionales para el header */
  style?: React.CSSProperties;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  title,
  subtitle,
  badges,
  onBack,
  backRoute,
  backLabel = 'Calendario',
  rightAction,
  showLogo = true,
  className = '',
  style,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backRoute) {
      navigate(backRoute);
    } else {
      navigate(-1);
    }
  };

  return (
    <>
      <style>{`
        .game-header-back-btn {
          align-items: center;
          display: inline-flex;
          justify-content: center;
          background: #F4F6F9;
          border: 1px solid #DEE3EA;
          border-radius: 14px;
          color: #294C6B;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: background-color 0.15s ease, transform 0.1s ease;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        .game-header-back-btn:active {
          background-color: #E2E8F0;
          transform: scale(0.97);
        }
        @media (max-width: 639px) {
          .game-header-back-btn {
            width: 44px;
            height: 44px;
            padding: 0;
          }
          .game-header-back-btn .btn-label {
            display: none;
          }
        }
        @media (min-width: 640px) {
          .game-header-back-btn {
            min-height: 44px;
            padding: 8px 16px;
            gap: 6px;
          }
          .game-header-back-btn .btn-label {
            display: inline;
          }
        }
      `}</style>

      <header
        className={`game-header-root bg-white border-b border-[#E2E8F0] sticky top-0 z-30 shadow-xs ${className}`}
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)',
          paddingBottom: '8px',
          paddingLeft: '12px',
          paddingRight: '12px',
          width: '100%',
          ...style,
        }}
      >
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            margin: '0 auto',
            maxWidth: 1180,
            minHeight: 52,
            width: '100%',
          }}
        >
          {/* Columna Izquierda: Botón para volver atrás (ancho flexible balanceado) */}
          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              flex: '1 1 0',
              justifyContent: 'flex-start',
            }}
          >
            <button
              type="button"
              onClick={handleBack}
              aria-label={backLabel ? `Volver a ${backLabel}` : 'Volver atrás'}
              className="game-header-back-btn"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#294C6B"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
              <span className="btn-label">{backLabel}</span>
            </button>
          </div>

          {/* Columna Central: Título y Badges/Widgets en el centro geométrico absoluto */}
          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              flex: '0 0 auto',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '0 8px',
              textAlign: 'center',
            }}
          >
            <h1
              style={{
                color: '#294C6B',
                fontSize: 'clamp(16px, 4.2vw, 20px)',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                margin: 0,
                textAlign: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              {title}
            </h1>

            {(subtitle || badges) && (
              <div
                style={{
                  alignItems: 'center',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  justifyContent: 'center',
                  marginTop: 3,
                }}
              >
                {subtitle}
                {badges}
              </div>
            )}
          </div>

          {/* Columna Derecha: Ranura de utilidades y Logo de Asistodo (ancho flexible balanceado) */}
          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              flex: '1 1 0',
              gap: 8,
              justifyContent: 'flex-end',
            }}
          >
            {rightAction}

            {showLogo && (
              <img
                src="/asistodo-logo.svg"
                alt="ASISTODO"
                style={{
                  display: 'block',
                  flexShrink: 0,
                  height: 40,
                  objectFit: 'contain',
                  width: 40,
                }}
              />
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default GameHeader;
