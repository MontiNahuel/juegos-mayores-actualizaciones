import React, { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { IonHeader, IonToolbar, IonIcon } from '@ionic/react';
import { logInOutline, logOutOutline, bookOutline } from 'ionicons/icons';
import { FlameIcon, StarIcon } from '../COMPONENTS/Icons/Icons';
import { IconHeart } from '../COMPONENTS/GameHeader/LivesBadge';
import { AuthModal } from '../MODALS/AuthModal';
import { usePlayerEconomy } from '../../context/PlayerEconomyContext';
import { esUsuarioAdmin, limpiarTodasLasSesiones } from '../AUTH/authUtils';
import './loginHeader.css';

export interface Usuario {
  id: number;
  name: string;
  email?: string;
  codigoAcceso?: string;
  racha?: number;
  puntos?: number;
  vidas?: number;
  tipoUsuario?: number;
  tipo_usuario?: number;
  rol?: number;
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
  ocultarSaludoEnMovil?: boolean;
  menuPrincipal?: boolean;
  ocultarSesion?: boolean;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 13) return '¡Buenos días!';
  if (hour >= 13 && hour < 20) return '¡Buenas tardes!';
  return '¡Buenas noches!';
}

export const LoginHeader: React.FC<LoginHeaderProps> = ({ onUsuarioChange, title, onBack, primaryColor = color.blue, ocultarSaludoEnMovil = false, menuPrincipal = false, ocultarSesion = false }) => {
  const economy = usePlayerEconomy();
  const navigate = useNavigate();
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
    const params = new URLSearchParams(window.location.search);
    if (params.get('abrirLogin') === 'true') {
      setShowAuthModal(true);
      params.delete('abrirLogin');
      const newQuery = params.toString() ? '?' + params.toString() : '';
      window.history.replaceState({}, '', window.location.pathname + newQuery);
    }
  }, []);

  useEffect(() => {
    const handleProgressUpdate = () => {
      try {
        const saved = localStorage.getItem('usuario') || localStorage.getItem('user');
        if (saved) {
          setUsuario(JSON.parse(saved));
        } else {
          setUsuario(null);
        }
      } catch {}
    };

    window.addEventListener('user_progress_updated', handleProgressUpdate);
    window.addEventListener('storage', handleProgressUpdate);
    return () => {
      window.removeEventListener('user_progress_updated', handleProgressUpdate);
      window.removeEventListener('storage', handleProgressUpdate);
    };
  }, []);

  // Determina si el usuario logueado posee rol de Administrador (tipoUsuario === 2)
  const esAdmin = Boolean(
    usuario &&
      (Number(usuario.tipoUsuario) === 2 ||
        Number(usuario.tipo_usuario) === 2 ||
        Number(usuario.rol) === 2 ||
        esUsuarioAdmin())
  );

  const handleLogout = () => {
    limpiarTodasLasSesiones();
    setUsuario(null);
    onUsuarioChange?.(null);
    economy.recargarEconomia();
  };

  const handleAuthSuccess = (loggedUser: Usuario) => {
    setUsuario(loggedUser);
    onUsuarioChange?.(loggedUser);
    economy.recargarEconomia();
  };

  const livesButton = (
    <button
                type="button"
                onClick={economy.abrirComprarPista}
                style={{
                  alignItems: 'center',
                  background: '#FFE4E6',
                  border: '1px solid #FECDD3',
                  borderRadius: 14,
                  color: '#BE123C',
                  cursor: 'pointer',
                  display: 'flex',
                  fontSize: 13,
                  fontWeight: 800,
                  gap: 4,
                  padding: '6px 10px',
                  transition: 'all 0.2s ease',
                }}
                className="hover:bg-rose-200 active:scale-95"
                title="Canjear 1 vida por 1 pista"
              >
                <IconHeart filled={economy.vidas > 0} size={16} />
                <span>{economy.vidas}</span>
                <span className="login-header-lives-label hidden sm:inline">
                  {economy.vidas === 1 ? 'vida' : 'vidas'}
                </span>
                <span className="login-header-lives-plus" style={{ fontSize: 10, background: '#FDA4AF', color: '#881337', padding: '1px 4px', borderRadius: 6, fontWeight: 900 }}>
                  +
                </span>
              </button>
  );

  return (
    <IonHeader style={{ boxShadow: '0 2px 10px rgba(23, 59, 99, 0.12)' }}>
      <IonToolbar style={{ '--background': '#FFFFFF', '--border-width': 0 } as CSSProperties}>
        <div
          className={`login-header-layout${title ? ' login-header-layout--titled' : ''}${ocultarSaludoEnMovil ? ' login-header-layout--compact' : ''}${usuario ? ' login-header-layout--authenticated' : ''}${menuPrincipal ? ' login-header-layout--menu' : ''}`}
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
              className="login-header-logo"
              alt="ASISTODO"
              src="/asistodo-logo.svg"
              style={{ height: 42, width: 42, flexShrink: 0 }}
            />}
            <span className="login-header-lives-left">{livesButton}</span>
            <div className="login-header-greeting" style={{ minWidth: 0 }}>
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
                    {esAdmin ? 'Panel de Administración' : 'Bienvenido a tus juegos'}
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

          {/* Lado derecho: Sesión activa (Racha + Vidas + Puntos + Salir) ó Botón Iniciar Sesión */}
          {usuario ? (
            <div
              style={{
                alignItems: 'center',
                display: 'flex',
                gap: 8,
                flexShrink: 0,
              }}
            >
              {/* Botón de Acceso al Editor Narrativo - SOLO VISIBLE SI ES ADMIN */}
              {esAdmin && (
                <button
                  type="button"
                  onClick={() => navigate('/editor-narrativo')}
                  title="Ingresar a la Suite del Editor Narrativo"
                  style={{
                    alignItems: 'center',
                    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                    border: '1.5px solid #F59E0B',
                    borderRadius: 14,
                    boxShadow: '0 3px 10px rgba(245, 158, 11, 0.25)',
                    color: '#FCD34D',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    fontSize: 13,
                    fontWeight: 800,
                    gap: 6,
                    padding: '7px 12px',
                    transition: 'all 0.15s ease',
                  }}
                  className="login-header-editor hover:scale-105 active:scale-95 hover:border-amber-400"
                >
                  <IonIcon icon={bookOutline} style={{ fontSize: 16, color: '#FCD34D' }} />
                  <span className="hidden sm:inline">Editor Narrativo</span>
                  <span className="sm:hidden">Editor</span>
                </button>
              )}

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
                <span className="login-header-stat-label hidden sm:inline">
                  {(usuario as any)?.racha === 1 ? 'día' : 'días'}
                </span>
              </div>

              <span className="login-header-lives-right">{livesButton}</span>

              {/* Puntos (Click abre Mini-Tienda) */}
              <button
                type="button"
                onClick={economy.abrirMiniTienda}
                style={{
                  alignItems: 'center',
                  background: '#E8F8F5',
                  border: '1px solid #8FD5CA',
                  borderRadius: 14,
                  color: '#17695F',
                  cursor: 'pointer',
                  display: 'flex',
                  fontSize: 13,
                  fontWeight: 800,
                  gap: 4,
                  padding: '6px 10px',
                  transition: 'all 0.2s ease',
                }}
                className="hover:bg-[#d1f2eb] active:scale-95"
                title="Puntos acumulados. Hacé clic para canjear vidas."
              >
                <StarIcon size={15} />
                <span>{economy.puntos}</span>
                <span className="login-header-stat-label hidden sm:inline">pts</span>
              </button>

              {/* Botón Salir */}
              <button
                type="button"
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
                className="login-header-logout hover:bg-slate-200 active:bg-slate-300 transition-colors"
                hidden={ocultarSesion}
              >
                <IonIcon icon={logOutOutline} style={{ fontSize: 16 }} />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="login-header-lives-right">{livesButton}</span>

              {/* Botón para abrir el Modal de Inicio de Sesión / Registro */}
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                aria-label="Iniciar sesión"
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
                className="login-header-signin active:bg-slate-800 transition-colors"
                hidden={ocultarSesion}
              >
                <IonIcon icon={logInOutline} style={{ fontSize: 18 }} />
                <span>Iniciar sesión</span>
              </button>
            </div>
          )}
        </div>
      </IonToolbar>

      {/* Modal de Acceso (Código / Registro / Admin) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </IonHeader>
  );
};

export default LoginHeader;
