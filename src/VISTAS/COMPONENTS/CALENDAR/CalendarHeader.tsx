import React from 'react';
import type { CSSProperties } from 'react';
import { IonHeader, IonToolbar } from '@ionic/react';

interface CalendarHeaderProps {
  title: string;
  onBack: () => void;
  primaryColor?: string;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  title,
  onBack,
  primaryColor = '#294C6B',
}) => {
  return (
    <IonHeader style={{ boxShadow: '0 1px 8px rgba(23, 59, 99, 0.14)' }}>
      <IonToolbar style={{ '--background': '#FFFFFF', '--border-width': 0 } as CSSProperties}>
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            margin: '0 auto',
            maxWidth: 1180,
            minHeight: 76,
            padding: '10px 16px',
            width: '100%',
          }}
        >
          {/* Columna Izquierda: Botón para volver al Menú */}
          <div style={{ alignItems: 'center', display: 'flex', flex: '1 1 0', justifyContent: 'flex-start' }}>
            <button
              onClick={onBack}
              aria-label="Volver al Menú Principal"
              className="calendar-shared-back-btn"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke={primaryColor}
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
              <span className="btn-text">Menú</span>
            </button>
          </div>

          {/* Columna Central: Título */}
          <div style={{ flex: '0 0 auto', padding: '0 8px', textAlign: 'center' }}>
            <h1
              style={{
                color: primaryColor,
                fontSize: 'clamp(17px, 4.5vw, 21px)',
                fontWeight: 800,
                lineHeight: 1.2,
                margin: 0,
                textAlign: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              {title}
            </h1>
          </div>

          {/* Columna Derecha: Logo ASISTODO */}
          <div style={{ alignItems: 'center', display: 'flex', flex: '1 1 0', justifyContent: 'flex-end' }}>
            <img
              alt="ASISTODO"
              src="/asistodo-logo.svg"
              style={{ display: 'block', height: 44, width: 44, objectFit: 'contain' }}
            />
          </div>
        </div>
      </IonToolbar>
    </IonHeader>
  );
};
