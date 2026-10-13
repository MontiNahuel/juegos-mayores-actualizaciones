import React, { useState } from 'react';
import type { CSSProperties } from 'react';
import { IonHeader, IonToolbar } from '@ionic/react';
import { FlameIcon, StarIcon } from '../COMPONENTS/Icons/Icons';

export interface Usuario {
  id: number;
  name: string;
  email?: string;
  codigoAcceso?: string;
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
}

export const LoginHeader: React.FC<LoginHeaderProps> = ({ onUsuarioChange }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    try {
      const saved = localStorage.getItem('usuario') || localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [codigoInput, setCodigoInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = codigoInput.trim();
    if (!cleanCode) return;
    setLoading(true);
    setError(null);

    const tryFetch = async (url: string) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: cleanCode }),
      });
      return await res.json();
    };

    try {
      let data;
      try {
        data = await tryFetch('/api/auth/ingresar-codigo');
      } catch {
        data = await tryFetch('http://localhost:8080/api/auth/ingresar-codigo');
      }

      if (data && data.success && data.user) {
        setUsuario(data.user);
        localStorage.setItem('usuario', JSON.stringify(data.user));
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        setCodigoInput('');
        onUsuarioChange?.(data.user);
      } else {
        setError(data?.detail || data?.message || 'Código no válido');
      }
    } catch {
      setError('No se pudo conectar al servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUsuario(null);
    localStorage.removeItem('usuario');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    onUsuarioChange?.(null);
  };

  return (
    <IonHeader style={{ boxShadow: '0 1px 8px rgba(23, 59, 99, 0.14)' }}>
      <IonToolbar style={{ '--background': '#FFFFFF', '--border-width': 0 } as CSSProperties}>
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            justifyContent: 'space-between',
            margin: '0 auto',
            maxWidth: 1180,
            minHeight: 76,
            padding: '10px 16px',
          }}
        >
          {/* Identidad ASISTODO */}
          <div style={{ alignItems: 'center', display: 'flex', gap: 12 }}>
            <img alt="ASISTODO" src="/asistodo-logo.svg" style={{ height: 44, width: 44, flexShrink: 0 }} />
            <div>
              <strong style={{ color: color.blue, display: 'block', fontSize: 20, lineHeight: 1.2 }}>ASISTODO</strong>
              <span className="hidden sm:inline" style={{ color: color.ink, fontSize: 13 }}>
                Juegos de estimulación cognitiva
              </span>
            </div>
          </div>

          {/* Sesión iniciada: Nombre, saludo, mensaje de gimnasia mental y métricas */}
          {usuario ? (
            <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
              <div style={{ color: color.ink, fontSize: 13, textAlign: 'right' }}>
                <strong style={{ color: color.blue, display: 'block', fontSize: 15 }}>Hola, {usuario.name}</strong>
                <span style={{ fontSize: 12, opacity: 0.9 }}>Tu gimnasia mental de hoy</span>
              </div>
              <div
                style={{
                  alignItems: 'center',
                  background: '#FFF6DF',
                  border: '1px solid #F3D37A',
                  borderRadius: 16,
                  color: '#855E10',
                  display: 'flex',
                  fontWeight: 700,
                  gap: 5,
                  padding: '6px 9px',
                  fontSize: 13,
                }}
              >
                <FlameIcon size={17} /> {(usuario as any)?.racha ?? 1} {(usuario as any)?.racha === 1 ? 'día' : 'días'}
              </div>
              <div
                style={{
                  alignItems: 'center',
                  background: '#E8F8F5',
                  border: '1px solid #8FD5CA',
                  borderRadius: 16,
                  color: '#17695F',
                  display: 'flex',
                  fontWeight: 700,
                  gap: 5,
                  padding: '6px 9px',
                  fontSize: 13,
                }}
              >
                <StarIcon size={16} /> {(usuario as any)?.puntos ?? 0} pts
              </div>
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
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '6px 10px',
                }}
                className="hover:bg-slate-200 active:bg-slate-300 transition-colors"
              >
                Salir
              </button>
            </div>
          ) : (
            /* Sin sesión: Campo para ingresar código de alumno */
            <form
              onSubmit={handleLogin}
              style={{ alignItems: 'flex-end', display: 'flex', flexDirection: 'column', gap: 4 }}
            >
              <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Código de alumno"
                  value={codigoInput}
                  onChange={(e) => {
                    setCodigoInput(e.target.value);
                    if (error) setError(null);
                  }}
                  disabled={loading}
                  style={{
                    background: '#F4F6F9',
                    border: error ? '1px solid #EF4444' : '1px solid #CBD5E1',
                    borderRadius: 12,
                    color: '#294C6B',
                    fontSize: 13,
                    fontWeight: 700,
                    outline: 'none',
                    padding: '8px 12px',
                    width: 140,
                  }}
                />
                <button
                  type="submit"
                  disabled={loading || !codigoInput.trim()}
                  style={{
                    alignItems: 'center',
                    background: '#294C6B',
                    border: 'none',
                    borderRadius: 12,
                    color: '#FFFFFF',
                    cursor: loading ? 'default' : 'pointer',
                    display: 'inline-flex',
                    fontSize: 13,
                    fontWeight: 700,
                    padding: '8px 14px',
                    whiteSpace: 'nowrap',
                    opacity: loading || !codigoInput.trim() ? 0.7 : 1,
                  }}
                  className="active:bg-slate-800 transition-colors"
                >
                  {loading ? 'Entrando...' : 'Ingresar'}
                </button>
              </div>
              {error && (
                <span style={{ color: '#DC2626', fontSize: 11, fontWeight: 700 }}>
                  {error}
                </span>
              )}
            </form>
          )}
        </div>
      </IonToolbar>
    </IonHeader>
  );
};

export default LoginHeader;
