import React, { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { IonPage, IonContent, IonSpinner, IonIcon } from '@ionic/react';
import { alertCircleOutline, checkmarkCircleOutline, arrowForwardOutline, keyOutline } from 'ionicons/icons';
import { BrainIcon } from '../COMPONENTS/Icons/Icons';
import { API_URL } from '../../config/api';
import { guardarSesionAdmin, OPERADOR_STORAGE_KEY } from '../AUTH/authUtils';

const color = {
  blue: '#294C6B',
  ink: '#46556D',
  paper: '#F4F6F9',
  panel: '#DEE3EA',
  teal: '#53BFC9',
  lavender: '#AFA1E8',
  coral: '#E88778',
};

export const AccesoToken: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [estado, setEstado] = useState<'verificando' | 'exito' | 'error'>('verificando');
  const [mensajeError, setMensajeError] = useState<string>('');
  const [nombreUsuario, setNombreUsuario] = useState<string>('');

  useEffect(() => {
    let cancelado = false;

    if (!token || !token.trim()) {
      setEstado('error');
      setMensajeError('No se encontró el enlace de acceso o el enlace está incompleto.');
      return;
    }

    const cleanToken = token.trim();

    const validarAcceso = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/verificar-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: cleanToken }),
        });

        const data = await response.json();

        if (cancelado) return;

        if (response.ok && (data.success || data.valid) && data.user) {
          const userObj = data.user;
          const jwtToken = data.token || cleanToken;

          const tipo = Number(userObj.tipoUsuario ?? userObj.tipo_usuario ?? userObj.rol ?? 1);
          if (tipo === 2) {
            guardarSesionAdmin(userObj, jwtToken);
          } else {
            localStorage.removeItem(OPERADOR_STORAGE_KEY);
            sessionStorage.removeItem(OPERADOR_STORAGE_KEY);
            localStorage.setItem('usuario', JSON.stringify(userObj));
            localStorage.setItem('user', JSON.stringify(userObj));
            if (jwtToken) {
              localStorage.setItem('token', jwtToken);
            }
            window.dispatchEvent(new Event('user_progress_updated'));
          }

          setNombreUsuario(userObj.name || userObj.nombre || '¡Hola!');
          setEstado('exito');

          // Redirección suave al menú tras confirmar acceso
          setTimeout(() => {
            if (!cancelado) {
              navigate('/menu', { replace: true });
            }
          }, 1200);
        } else {
          setEstado('error');
          const detalle = data?.detail || data?.message || 'El enlace de acceso es inválido o ha expirado.';
          setMensajeError(detalle);
        }
      } catch (err) {
        if (cancelado) return;
        setEstado('error');
        setMensajeError('No se pudo conectar con el servidor para validar tu acceso. Revisá tu conexión.');
      }
    };

    validarAcceso();

    return () => {
      cancelado = true;
    };
  }, [token, navigate]);

  return (
    <IonPage>
      <IonContent style={{ '--background': color.blue } as CSSProperties}>
        <div
          style={{
            minHeight: '100%',
            background: color.blue,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 16px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              maxWidth: 520,
              width: '100%',
              padding: '36px 28px',
              boxShadow: '0 12px 36px rgba(0,0,0,0.22)',
              textAlign: 'center',
              boxSizing: 'border-box',
            }}
          >
            {/* Encabezado / Logo */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 76,
                height: 76,
                borderRadius: '50%',
                backgroundColor: '#EDF9FA',
                marginBottom: 20,
                color: color.teal,
              }}
            >
              <BrainIcon size={46} />
            </div>

            {/* Estado 1: Verificando */}
            {estado === 'verificando' && (
              <div>
                <h1
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: color.blue,
                    margin: '0 0 12px 0',
                  }}
                >
                  Iniciando tu sesión...
                </h1>
                <p
                  style={{
                    fontSize: 18,
                    color: color.ink,
                    lineHeight: 1.5,
                    margin: '0 0 28px 0',
                  }}
                >
                  Estamos comprobando tu enlace de acceso a los juegos de mente.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
                  <IonSpinner name="crescent" style={{ transform: 'scale(1.6)', color: color.teal }} />
                </div>
              </div>
            )}

            {/* Estado 2: Éxito */}
            {estado === 'exito' && (
              <div>
                <div style={{ color: '#16a34a', marginBottom: 12 }}>
                  <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: 56 }} />
                </div>
                <h1
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: color.blue,
                    margin: '0 0 10px 0',
                  }}
                >
                  ¡Bienvenido{nombreUsuario ? `, ${nombreUsuario}` : ''}!
                </h1>
                <p
                  style={{
                    fontSize: 18,
                    color: color.ink,
                    lineHeight: 1.5,
                    margin: '0 0 20px 0',
                  }}
                >
                  Acceso confirmado exitosamente. Te estamos llevando a tus juegos...
                </p>
              </div>
            )}

            {/* Estado 3: Error */}
            {estado === 'error' && (
              <div>
                <div style={{ color: '#dc2626', marginBottom: 12 }}>
                  <IonIcon icon={alertCircleOutline} style={{ fontSize: 56 }} />
                </div>
                <h1
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: color.blue,
                    margin: '0 0 10px 0',
                  }}
                >
                  No pudimos ingresar con este enlace
                </h1>
                <p
                  style={{
                    fontSize: 16,
                    color: '#64748b',
                    lineHeight: 1.5,
                    margin: '0 0 24px 0',
                  }}
                >
                  {mensajeError}
                </p>

                <div
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: 14,
                    padding: '16px',
                    marginBottom: 24,
                    textAlign: 'left',
                  }}
                >
                  <p
                    style={{
                      fontSize: 15,
                      color: color.ink,
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    💡 <strong>¿Qué podés hacer?</strong> Podés ingresar directamente con tu{' '}
                    <strong>código numérico de 6 dígitos</strong> o solicitar un nuevo enlace al operador.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <button
                    onClick={() => navigate('/menu?abrirLogin=true', { replace: true })}
                    style={{
                      backgroundColor: color.blue,
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 12,
                      padding: '14px 20px',
                      fontSize: 17,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      cursor: 'pointer',
                    }}
                  >
                    <IonIcon icon={keyOutline} style={{ fontSize: 20 }} />
                    Ingresar con mi código de 6 dígitos
                  </button>

                  <button
                    onClick={() => navigate('/menu', { replace: true })}
                    style={{
                      backgroundColor: 'transparent',
                      color: color.ink,
                      border: '2px solid #CBD5E1',
                      borderRadius: 12,
                      padding: '12px 20px',
                      fontSize: 16,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      cursor: 'pointer',
                    }}
                  >
                    Ir al Menú Principal
                    <IonIcon icon={arrowForwardOutline} style={{ fontSize: 18 }} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AccesoToken;

