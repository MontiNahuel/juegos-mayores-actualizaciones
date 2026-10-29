import React, { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { IonHeader, IonToolbar, IonIcon } from '@ionic/react';
import { logInOutline, logOutOutline } from 'ionicons/icons';
import { FlameIcon, StarIcon } from '../COMPONENTS/Icons/Icons';
import { AuthModal } from './AuthModal';
import './loginHeader.css';
import { usePlayerEconomy } from '../../context/PlayerEconomyContext';
import { IconHeart } from '../COMPONENTS/GameHeader/LivesBadge';

export interface Usuario {
  id: number;
  name: string;
  email?: string;
  codigoAcceso?: string;
  racha?: number;
  puntos?: number;
}

const color = {
  blue: '#294C6B',
  ink: '#46556D',
  paper: '#F4F6F9',
  panel: '#DEE3EA',
  teal: '#53BFC9',
  lavender: '#AFA1E8',
  coral: '#E88778',
};

interface LoginHeaderProps {
  onUsuarioChange?: (user: Usuario | null) => void;
  title?: string;
  onBack?: () => void;
  primaryColor?: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 13) return '¡Buenos días!';
  if (hour >= 13 && hour < 20) return '¡Buenas tardes!';
  return '¡Buenas noches!';
}

export const LoginHeader: React.FC<LoginHeaderProps> = ({ onUsuarioChange, title, onBack, primaryColor = color.blue }) => {
  const economy = usePlayerEconomy();
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    try {
      const saved = localStorage.getItem('usuario') || localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  useEffect(() => {
    const handleProgressUpdate = () => {
      try {
        const saved = localStorage.getItem('usuario') || localStorage.getItem('user');
        if (saved) {
          setUsuario(JSON.parse(saved));
        }
      } catch {}
    };

    window.addEventListener('user_progress_updated', handleProgressUpdate);
    return () => {
      window.removeEventListener('user_progress_updated', handleProgressUpdate);
    };
  }, []);

  const handleLogout = () => {
    setUsuario(null);
    localStorage.removeItem('usuario');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    onUsuarioChange?.(null);
  };

  const handleAuthSuccess = (loggedUser: Usuario) => {
    setUsuario(loggedUser);
    onUsuarioChange?.(loggedUser);
  };

  return (
    <IonHeader style={{ boxShadow: '0 2px 10px rgba(23, 59, 99, 0.12)' }}>
      <IonToolbar style={{ '--background': '#FFFFFF', '--border-width': 0 } as CSSProperties}>
        <div
          className={`login-header-layout${title ? ' login-header-layout--titled' : ''}`}
          style={{
            alignItems: 'center',
            justifyContent: 'space-between',
            margin: '0 auto',
            maxWidth: 1180,
            minHeight: 74,
            padding: '10px 16px',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {/* Identidad ASISTODO y Saludo */}
          <div style={{ alignItems: 'center', display: 'flex', gap: 12, minWidth: 0 }}>
            {onBack ? <button type="button" onClick={onBack} aria-label="Volver al menú principal"
              className="login-header-home" title="Volver al menú principal">
              <img alt="ASISTODO" src="/asistodo-logo.svg" style={{ height: 42, width: 42 }} />
            </button> : <img
              alt="ASISTODO"
              src="/asistodo-logo.svg"
              style={{ height: 42, width: 42, flexShrink: 0 }}
            />}
            <div style={{ minWidth: 0 }}>
              {usuario ? (
                /* Con sesión: ¡Hola, [Nombre]! */
                <>
                  <strong
                    style={{
                      color: color.blue,
                      display: 'block',
                      fontSize: 'clamp(16px, 4.2vw, 19px)',
                      fontWeight: 900,
                      lineHeight: 1.2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ¡Hola, {usuario.name}!
                  </strong>
                  <span
                    style={{
                      color: color.ink,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    Bienvenido a tus juegos
                  </span>
                </>
              ) : (
                /* Sin sesión: Saludo cálido por horario */
                <>
                  <strong
                    style={{
                      color: color.blue,
                      display: 'block',
                      fontSize: 'clamp(16px, 4.2vw, 19px)',
                      fontWeight: 900,
                      lineHeight: 1.2,
                    }}
                  >
                    {getGreeting()}
                  </strong>
                  <span
                    style={{
                      color: color.ink,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    Bienvenido a ASISTODO
                  </span>
                </>
              )}
            </div>
          </div>

          {title && <h1 className="login-header-title" style={{ color: primaryColor }}>{title}</h1>}

          <div className="login-header-actions">
          <button type="button" onClick={economy.abrirMiniTienda}
            className="login-header-lives" title="Vidas restantes. Hacé clic para abrir la Tienda de Vidas.">
            <IconHeart filled={economy.vidas > 0} size={16} />
            <span>{economy.vidas}</span>
            <span className="hidden sm:inline">{economy.vidas === 1 ? 'vida' : 'vidas'}</span>
            <span className="login-header-lives-plus" aria-hidden="true">+</span>
          </button>
          {/* Las mismas acciones y el mismo saldo de vidas en menú y calendarios. */}
          {usuario ? (
            <div
              style={{
                alignItems: 'center',
                display: 'flex',
                gap: 8,
                flexShrink: 0,
              }}
            >
              {/* Racha */}
              <div
                style={{
                  alignItems: 'center',
                  background: '#FFF6DF',
                  border: '1px solid #F3D37A',
                  borderRadius: 14,
                  color: '#855E10',
                  display: 'flex',
                  fontSize: 13,
                  fontWeight: 800,
                  gap: 4,
                  padding: '6px 10px',
                }}
                title="Días de racha consecutivos"
              >
                <FlameIcon size={16} />
                <span>{(usuario as any)?.racha ?? 1}</span>
                <span className="hidden sm:inline">
                  {(usuario as any)?.racha === 1 ? 'día' : 'días'}
                </span>
              </div>

              {/* Puntos */}
              <div
                style={{
                  alignItems: 'center',
                  background: '#E8F8F5',
                  border: '1px solid #8FD5CA',
                  borderRadius: 14,
                  color: '#17695F',
                  display: 'flex',
                  fontSize: 13,
                  fontWeight: 800,
                  gap: 4,
                  padding: '6px 10px',
                }}
                title="Puntos acumulados"
              >
                <StarIcon size={15} />
                <span>{(usuario as any)?.puntos ?? 0}</span>
                <span className="hidden sm:inline">pts</span>
              </div>

              {/* Botón Salir */}
              <button
                onClick={handleLogout}
                title="Cerrar sesión"
                style={{
                  alignItems: 'center',
                  background: '#F4F6F9',
                  border: '1px solid #DEE3EA',
                  borderRadius: 12,
                  color: '#64748B',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  fontSize: 13,
                  fontWeight: 700,
                  gap: 4,
                  padding: '7px 11px',
                }}
                className="hover:bg-slate-200 active:bg-slate-300 transition-colors"
              >
                <IonIcon icon={logOutOutline} style={{ fontSize: 16 }} />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          ) : (
            /* Botón para abrir el Modal de Inicio de Sesión / Registro */
            <button
              onClick={() => setShowAuthModal(true)}
              style={{
                alignItems: 'center',
                background: '#294C6B',
                border: 'none',
                borderRadius: 14,
                boxShadow: '0 3px 10px rgba(41, 76, 107, 0.22)',
                color: '#FFFFFF',
                cursor: 'pointer',
                display: 'inline-flex',
                fontSize: 14,
                fontWeight: 800,
                gap: 6,
                minHeight: 42,
                padding: '8px 16px',
                whiteSpace: 'nowrap',
              }}
              className="active:bg-slate-800 transition-colors"
            >
              <IonIcon icon={logInOutline} style={{ fontSize: 18 }} />
              <span>Iniciar sesión</span>
            </button>
          )}
          </div>
        </div>
      </IonToolbar>

      {/* Modal de Acceso (Código / Registro por Correo) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </IonHeader>
  );
};

export default LoginHeader;
