import React, { useState, useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import {
  closeOutline,
  keyOutline,
  personAddOutline,
  checkmarkCircle,
  alertCircleOutline,
  mailOutline,
  refreshOutline,
  pencilOutline,
  shieldCheckmarkOutline,
  arrowBackOutline,
} from 'ionicons/icons';
import type { Usuario } from './LoginHeader';
import { migrateGuestProgressToNewUser } from '../JUEGOS/attemptsService';
import { API_URL } from '../../config/api';
import { guardarSesionAdmin } from '../AUTH/authUtils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: Usuario) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [tab, setTab] = useState<'register' | 'code' | 'admin'>('register');

  // Estado pestaña Código / Acceso Alumno
  const [codeEmailInput, setCodeEmailInput] = useState('');
  const [codigoInput, setCodigoInput] = useState('');
  const [loadingCode, setLoadingCode] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  // Estado pestaña Registro
  const [registerStep, setRegisterStep] = useState<'form' | 'verify'>('form');
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [verifyCodeInput, setVerifyCodeInput] = useState('');
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingResend, setLoadingResend] = useState(false);
  const [errorRegister, setErrorRegister] = useState<string | null>(null);
  const [errorVerify, setErrorVerify] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Estado pestaña Administrador
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [errorAdmin, setErrorAdmin] = useState<string | null>(null);

  // Pantalla de éxito post-registro con código asignado
  const [registeredUser, setRegisteredUser] = useState<Usuario | null>(null);

  // Temporizador para reenvío de código anti-spam (60s)
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // 1. Ingreso con correo y clave de 6 dígitos
  const handleLoginCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = codeEmailInput.trim().toLowerCase();
    const cleanCode = codigoInput.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorCode('Por favor, ingresá un correo electrónico válido.');
      return;
    }
    if (!cleanCode) {
      setErrorCode('Por favor, ingresá tu clave de 6 dígitos.');
      return;
    }

    setLoadingCode(true);
    setErrorCode(null);

    const tryFetch = async (url: string) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, codigo: cleanCode }),
      });
      return await res.json();
    };

    try {
      const data = await tryFetch(`${API_URL}/api/auth/ingresar-codigo`);

      if (data && data.success && data.user) {
        const tipo = Number(data.user.tipoUsuario ?? data.user.tipo_usuario ?? data.user.rol ?? 1);
        if (tipo === 2) {
          guardarSesionAdmin(data.user, data.token || '');
        } else {
          localStorage.removeItem('asistodo_operador_session');
          sessionStorage.removeItem('asistodo_operador_session');
          localStorage.setItem('usuario', JSON.stringify(data.user));
          localStorage.setItem('user', JSON.stringify(data.user));
          if (data.token) {
            localStorage.setItem('token', data.token);
          }
          window.dispatchEvent(new Event('user_progress_updated'));
        }
        setCodeEmailInput('');
        setCodigoInput('');
        onSuccess(data.user);
        onClose();
      } else {
        setErrorCode(data?.detail || data?.message || 'Correo o clave de 6 dígitos no válida. Revisá los datos ingresados.');
      }
    } catch {
      setErrorCode('No se pudo conectar con el servidor. Revisá tu conexión.');
    } finally {
      setLoadingCode(false);
    }
  };

  // 2. Ingreso como Administrador con Correo y Contraseña
  const handleLoginAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = adminEmailInput.trim().toLowerCase();
    const cleanPassword = adminPasswordInput.trim();
    if (!cleanEmail || !cleanPassword) return;

    setLoadingAdmin(true);
    setErrorAdmin(null);

    try {
      const res = await fetch(`${API_URL}/api/auth/login-sistemas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password: cleanPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.message || 'Credenciales de administrador incorrectas.');
      }

      if (data && data.success && data.user) {
        const tipo = Number(data.user.tipoUsuario ?? data.user.tipo_usuario ?? data.user.rol ?? 2);
        if (tipo !== 2) {
          throw new Error('Acceso denegado: Se requieren permisos de administrador.');
        }

        guardarSesionAdmin(data.user, data.token || '');
        setAdminEmailInput('');
        setAdminPasswordInput('');
        onSuccess(data.user);
        onClose();
      } else {
        throw new Error(data?.detail || data?.message || 'No se pudo iniciar sesión.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al conectar con el servidor.';
      setErrorAdmin(msg);
    } finally {
      setLoadingAdmin(false);
    }
  };

  // 3. Registro: Paso 1 - Enviar Nombre y Email
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = nameInput.trim();
    const cleanEmail = emailInput.trim().toLowerCase();

    if (!cleanName) {
      setErrorRegister('Por favor, ingresá tu nombre.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorRegister('Por favor, ingresá un correo electrónico válido.');
      return;
    }

    setLoadingRegister(true);
    setErrorRegister(null);
    setInfoMessage(null);

    const tryRegister = async (url: string) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.detail || json?.message || 'No se pudo completar el registro.');
      }
      return json;
    };

    try {
      const data = await tryRegister(`${API_URL}/api/auth/register`);

      if (data && data.success) {
        if (data.status === 'PENDIENTE_VERIFICACION') {
          setPendingEmail(cleanEmail);
          setRegisterStep('verify');
          setVerifyCodeInput('');
          setErrorVerify(null);
          setResendCooldown(60);
          setInfoMessage(data.message || 'Te enviamos tu código de 6 dígitos a tu correo.');
        } else if (data.user) {
          // Pre-activada por admin o modo directo
          localStorage.setItem('usuario', JSON.stringify(data.user));
          if (data.token) localStorage.setItem('token', data.token);
          if (data.user.id) await migrateGuestProgressToNewUser(data.user.id);
          setRegisteredUser(data.user);
        }
      } else {
        setErrorRegister(data?.detail || data?.message || 'No se pudo registrar la cuenta.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al conectar con el servidor.';
      setErrorRegister(msg);
    } finally {
      setLoadingRegister(false);
    }
  };

  // 4. Registro: Paso 2 - Confirmar código de 6 dígitos recibido por correo
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = verifyCodeInput.trim();
    if (!cleanCode) return;

    setLoadingVerify(true);
    setErrorVerify(null);

    const tryVerify = async (url: string) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pendingEmail,
          codigo: cleanCode,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.detail || json?.message || 'Código incorrecto.');
      }
      return json;
    };

    try {
      const data = await tryVerify(`${API_URL}/api/auth/verificar-codigo-registro`);

      if (data && data.success && data.user) {
        localStorage.setItem('usuario', JSON.stringify(data.user));
        if (data.token) {
          localStorage.setItem('token', data.token);
        }

        if (data.user.id) {
          await migrateGuestProgressToNewUser(data.user.id);
        }

        setRegisteredUser(data.user);
      } else {
        setErrorVerify(data?.detail || data?.message || 'Código incorrecto. Revisá el correo que recibiste.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al verificar el código.';
      setErrorVerify(msg);
    } finally {
      setLoadingVerify(false);
    }
  };

  // 5. Reenviar código al correo pendiente
  const handleResendCode = async () => {
    if (resendCooldown > 0 || loadingResend || !pendingEmail) return;

    setLoadingResend(true);
    setErrorVerify(null);
    setInfoMessage(null);

    const tryResend = async (url: string) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingEmail }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.detail || json?.message || 'No se pudo reenviar el código.');
      }
      return json;
    };

    try {
      const data = await tryResend(`${API_URL}/api/auth/reenviar-codigo-registro`);
      setResendCooldown(60);
      setInfoMessage(data?.message || `Código reenviado con éxito a ${pendingEmail}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al reenviar el correo.';
      setErrorVerify(msg);
    } finally {
      setLoadingResend(false);
    }
  };

  // 6. Corregir email (volver al paso 1 manteniendo el nombre)
  const handleBackToEditEmail = () => {
    setRegisterStep('form');
    setErrorRegister(null);
    setErrorVerify(null);
    setInfoMessage(null);
  };

  // Cierre final tras completar registro
  const handleFinishRegister = () => {
    if (registeredUser) {
      onSuccess(registeredUser);
    }
    onClose();
  };

  return (
    <div
      style={{
        alignItems: 'center',
        background: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        inset: 0,
        justifyContent: 'center',
        padding: '16px 16px max(calc(env(safe-area-inset-bottom, 0px) + 24px), 48px)',
        position: 'fixed',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 22,
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25)',
          maxWidth: 420,
          padding: '24px 22px',
          width: '100%',
          boxSizing: 'border-box',
        }}
        className="calendar-shared-modal-card"
      >
        {/* Cabecera del Modal */}
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <h2
            style={{
              color: '#294C6B',
              fontSize: 20,
              fontWeight: 900,
              margin: 0,
            }}
          >
            {registeredUser
              ? '¡Cuenta creada!'
              : tab === 'admin'
              ? 'Acceso Administrador'
              : 'Acceso a la plataforma'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              alignItems: 'center',
              background: '#F1F5F9',
              border: 'none',
              borderRadius: 999,
              color: '#64748B',
              cursor: 'pointer',
              display: 'flex',
              height: 36,
              justifyContent: 'center',
              width: 36,
            }}
            title="Cerrar"
          >
            <IonIcon icon={closeOutline} style={{ fontSize: 22 }} />
          </button>
        </div>

        {/* Caso 1: Pantalla de confirmación de registro con el código generado */}
        {registeredUser ? (
          <div
            style={{
              textAlign: 'center',
              minHeight: 330,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                alignItems: 'center',
                background: '#E8F8F5',
                borderRadius: 999,
                color: '#17695F',
                display: 'flex',
                height: 56,
                justifyContent: 'center',
                margin: '0 auto 12px',
                width: 56,
              }}
            >
              <IonIcon icon={checkmarkCircle} style={{ fontSize: 36 }} />
            </div>

            <h3 style={{ color: '#294C6B', fontSize: 18, fontWeight: 900, margin: '0 0 6px' }}>
              ¡Bienvenido/a, {registeredUser.name}!
            </h3>
            <p style={{ color: '#64748B', fontSize: 13, margin: '0 0 16px', lineHeight: 1.4 }}>
              Tu cuenta ha sido creada exitosamente. Este es tu código personal para ingresar:
            </p>

            <div
              style={{
                background: '#F8FAFC',
                border: '2px dashed #53BFC9',
                borderRadius: 16,
                padding: '14px 16px',
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  color: '#64748B',
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                Tu código de alumno
              </span>
              <strong
                style={{
                  color: '#294C6B',
                  display: 'block',
                  fontSize: 28,
                  fontWeight: 900,
                  letterSpacing: '0.2em',
                  marginTop: 4,
                }}
              >
                {registeredUser.codigoAcceso || '123456'}
              </strong>
            </div>

            <p style={{ color: '#64748B', fontSize: 12, margin: '0 0 20px' }}>
              Anotá este código en un lugar seguro. Con tu correo y este código vas a poder ingresar fácilmente desde cualquier celular o computadora.
            </p>

            <button
              type="button"
              onClick={handleFinishRegister}
              style={{
                background: '#294C6B',
                border: 'none',
                borderRadius: 14,
                color: '#FFFFFF',
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: 800,
                padding: '13px 0',
                width: '100%',
              }}
              className="active:bg-slate-800 transition-colors"
            >
              ¡Comenzar a jugar!
            </button>
          </div>
        ) : (
          /* Caso 2: Pestañas de Ingreso / Registro / Admin */
          <>
            {/* Selector de pestañas para Alumnos */}
            {tab !== 'admin' && (
              <div
                style={{
                  background: '#F1F5F9',
                  borderRadius: 14,
                  display: 'grid',
                  gap: 4,
                  gridTemplateColumns: '1fr 1fr',
                  padding: 4,
                  marginBottom: 18,
                }}
              >
                <button
                  type="button"
                  onClick={() => setTab('register')}
                  style={{
                    alignItems: 'center',
                    background: tab === 'register' ? '#294C6B' : 'transparent',
                    border: 'none',
                    borderRadius: 10,
                    color: tab === 'register' ? '#FFFFFF' : '#475569',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    fontSize: 13,
                    fontWeight: 800,
                    gap: 6,
                    justifyContent: 'center',
                    padding: '9px 10px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <IonIcon icon={personAddOutline} style={{ fontSize: 16 }} />
                  <span>Crear mi cuenta</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTab('code')}
                  style={{
                    alignItems: 'center',
                    background: tab === 'code' ? '#294C6B' : 'transparent',
                    border: 'none',
                    borderRadius: 10,
                    color: tab === 'code' ? '#FFFFFF' : '#475569',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    fontSize: 13,
                    fontWeight: 800,
                    gap: 6,
                    justifyContent: 'center',
                    padding: '9px 10px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <IonIcon icon={keyOutline} style={{ fontSize: 16 }} />
                  <span>Tengo mi cuenta</span>
                </button>
              </div>
            )}

            {/* Pestaña: Crear mi cuenta */}
            {tab === 'register' && (
              <>
                {registerStep === 'form' ? (
                  /* Paso 1: Ingreso de Nombre y Correo */
                  <form
                    onSubmit={handleRegister}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: 280,
                    }}
                  >
                    <div>
                      <p
                        style={{
                          color: '#64748B',
                          fontSize: 13,
                          lineHeight: 1.4,
                          margin: '0 0 14px',
                          textAlign: 'center',
                        }}
                      >
                        Completá tus datos para registrarte. Te enviaremos tu código personal a tu correo para activar tu cuenta:
                      </p>

                      {/* Campo Nombre */}
                      <div style={{ marginBottom: 12 }}>
                        <label
                          style={{
                            color: '#294C6B',
                            display: 'block',
                            fontSize: 13,
                            fontWeight: 800,
                            marginBottom: 5,
                          }}
                        >
                          Tu nombre
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: Marta"
                          value={nameInput}
                          onChange={(e) => {
                            setNameInput(e.target.value);
                            if (errorRegister) setErrorRegister(null);
                          }}
                          disabled={loadingRegister}
                          style={{
                            background: '#F8FAFC',
                            border: '1.5px solid #CBD5E1',
                            borderRadius: 12,
                            color: '#294C6B',
                            fontSize: 15,
                            fontWeight: 700,
                            outline: 'none',
                            padding: '10px 14px',
                            width: '100%',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      {/* Campo Email */}
                      <div style={{ marginBottom: 14 }}>
                        <label
                          style={{
                            color: '#294C6B',
                            display: 'block',
                            fontSize: 13,
                            fontWeight: 800,
                            marginBottom: 5,
                          }}
                        >
                          Tu correo electrónico
                        </label>
                        <input
                          type="email"
                          placeholder="Ej: marta@correo.com"
                          value={emailInput}
                          onChange={(e) => {
                            setEmailInput(e.target.value);
                            if (errorRegister) setErrorRegister(null);
                          }}
                          disabled={loadingRegister}
                          style={{
                            background: '#F8FAFC',
                            border: '1.5px solid #CBD5E1',
                            borderRadius: 12,
                            color: '#294C6B',
                            fontSize: 15,
                            fontWeight: 700,
                            outline: 'none',
                            padding: '10px 14px',
                            width: '100%',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      {errorRegister && (
                        <div
                          style={{
                            alignItems: 'center',
                            background: '#FEF2F2',
                            border: '1px solid #FECACA',
                            borderRadius: 10,
                            color: '#DC2626',
                            display: 'flex',
                            fontSize: 12,
                            fontWeight: 700,
                            gap: 6,
                            marginBottom: 14,
                            padding: '8px 12px',
                          }}
                        >
                          <IonIcon icon={alertCircleOutline} style={{ fontSize: 16, flexShrink: 0 }} />
                          <span>{errorRegister}</span>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loadingRegister || !nameInput.trim() || !emailInput.trim()}
                      style={{
                        background: '#294C6B',
                        border: 'none',
                        borderRadius: 14,
                        color: '#FFFFFF',
                        cursor: loadingRegister ? 'default' : 'pointer',
                        fontSize: 15,
                        fontWeight: 800,
                        opacity: loadingRegister || !nameInput.trim() || !emailInput.trim() ? 0.7 : 1,
                        padding: '13px 0',
                        width: '100%',
                      }}
                      className="active:bg-slate-800 transition-colors"
                    >
                      {loadingRegister ? 'Creando cuenta...' : 'Crear mi cuenta y recibir código'}
                    </button>
                  </form>
                ) : (
                  /* Paso 2: Validación del código de 6 dígitos */
                  <form
                    onSubmit={handleVerifyCode}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: 280,
                    }}
                  >
                    <div>
                      <div style={{ textAlign: 'center', marginBottom: 12 }}>
                        <span
                          style={{
                            color: '#64748B',
                            display: 'block',
                            fontSize: 12,
                            margin: '0 0 4px',
                          }}
                        >
                          Enviamos tu código de 6 dígitos a:
                        </span>
                        <div
                          style={{
                            alignItems: 'center',
                            background: '#F1F5F9',
                            borderRadius: 10,
                            color: '#294C6B',
                            display: 'inline-flex',
                            fontSize: 13,
                            fontWeight: 800,
                            gap: 6,
                            padding: '6px 12px',
                            maxWidth: '100%',
                            wordBreak: 'break-all',
                          }}
                        >
                          <IonIcon icon={mailOutline} style={{ fontSize: 16, flexShrink: 0 }} />
                          <span>{pendingEmail}</span>
                        </div>
                      </div>

                      {/* Input de código de 6 dígitos */}
                      <div style={{ marginBottom: 12, textAlign: 'center' }}>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={10}
                          placeholder="000000"
                          value={verifyCodeInput}
                          onChange={(e) => {
                            setVerifyCodeInput(e.target.value);
                            if (errorVerify) setErrorVerify(null);
                          }}
                          disabled={loadingVerify}
                          style={{
                            background: '#F8FAFC',
                            border: errorVerify ? '2px solid #EF4444' : '2px solid #CBD5E1',
                            borderRadius: 14,
                            color: '#294C6B',
                            fontSize: 26,
                            fontWeight: 900,
                            letterSpacing: '0.22em',
                            outline: 'none',
                            padding: '10px 14px',
                            textAlign: 'center',
                            width: '100%',
                            maxWidth: 240,
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      {/* Aviso de spam amigable */}
                      <div
                        style={{
                          background: '#FFFBEB',
                          border: '1px solid #FDE68A',
                          borderRadius: 10,
                          color: '#92400E',
                          fontSize: 11,
                          lineHeight: 1.4,
                          padding: '7px 10px',
                          marginBottom: 10,
                          textAlign: 'center',
                        }}
                      >
                        💡 Si no lo encontrás en tu bandeja principal, revisá la carpeta de <strong>Correo no deseado o Spam</strong>.
                      </div>

                      {infoMessage && (
                        <div
                          style={{
                            alignItems: 'center',
                            background: '#F0FDF4',
                            border: '1px solid #BBF7D0',
                            borderRadius: 10,
                            color: '#166534',
                            display: 'flex',
                            fontSize: 12,
                            fontWeight: 700,
                            gap: 6,
                            marginBottom: 10,
                            padding: '6px 10px',
                          }}
                        >
                          <IonIcon icon={checkmarkCircle} style={{ fontSize: 16, flexShrink: 0 }} />
                          <span>{infoMessage}</span>
                        </div>
                      )}

                      {errorVerify && (
                        <div
                          style={{
                            alignItems: 'center',
                            background: '#FEF2F2',
                            border: '1px solid #FECACA',
                            borderRadius: 10,
                            color: '#DC2626',
                            display: 'flex',
                            fontSize: 12,
                            fontWeight: 700,
                            gap: 6,
                            marginBottom: 10,
                            padding: '8px 12px',
                          }}
                        >
                          <IonIcon icon={alertCircleOutline} style={{ fontSize: 16, flexShrink: 0 }} />
                          <span>{errorVerify}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <button
                        type="submit"
                        disabled={loadingVerify || !verifyCodeInput.trim()}
                        style={{
                          background: '#294C6B',
                          border: 'none',
                          borderRadius: 14,
                          color: '#FFFFFF',
                          cursor: loadingVerify ? 'default' : 'pointer',
                          fontSize: 15,
                          fontWeight: 800,
                          opacity: loadingVerify || !verifyCodeInput.trim() ? 0.7 : 1,
                          padding: '12px 0',
                          width: '100%',
                          marginBottom: 10,
                        }}
                        className="active:bg-slate-800 transition-colors"
                      >
                        {loadingVerify ? 'Verificando...' : 'Activar cuenta y comenzar'}
                      </button>

                      {/* Botones secundarios: Reenviar y Cambiar correo */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 8,
                        }}
                      >
                        <button
                          type="button"
                          onClick={handleResendCode}
                          disabled={resendCooldown > 0 || loadingResend}
                          style={{
                            alignItems: 'center',
                            background: 'transparent',
                            border: 'none',
                            color: resendCooldown > 0 ? '#94A3B8' : '#294C6B',
                            cursor: resendCooldown > 0 ? 'default' : 'pointer',
                            display: 'inline-flex',
                            fontSize: 12,
                            fontWeight: 700,
                            gap: 4,
                            padding: '4px 0',
                          }}
                        >
                          <IonIcon icon={refreshOutline} style={{ fontSize: 14 }} />
                          <span>
                            {loadingResend
                              ? 'Enviando...'
                              : resendCooldown > 0
                                ? `Reenviar (${resendCooldown}s)`
                                : 'Reenviar código'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={handleBackToEditEmail}
                          style={{
                            alignItems: 'center',
                            background: 'transparent',
                            border: 'none',
                            color: '#64748B',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            fontSize: 12,
                            fontWeight: 700,
                            gap: 4,
                            padding: '4px 0',
                          }}
                        >
                          <IonIcon icon={pencilOutline} style={{ fontSize: 14 }} />
                          <span>Cambiar correo</span>
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </>
            )}

            {/* Pestaña: Tengo mi cuenta */}
            {tab === 'code' && (
              <form
                onSubmit={handleLoginCode}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: 280,
                }}
              >
                <div>
                  <p
                    style={{
                      color: '#64748B',
                      fontSize: 13,
                      lineHeight: 1.4,
                      margin: '0 0 16px',
                      textAlign: 'center',
                    }}
                  >
                    Ingresá tu correo electrónico y tu clave de 6 dígitos para acceder a tu cuenta:
                  </p>

                  {/* Campo Correo Electrónico */}
                  <div style={{ marginBottom: 14 }}>
                    <label
                      style={{
                        color: '#294C6B',
                        display: 'block',
                        fontSize: 13,
                        fontWeight: 800,
                        marginBottom: 5,
                        textAlign: 'left',
                      }}
                    >
                      Tu correo electrónico
                    </label>
                    <input
                      type="email"
                      placeholder="Ej: marta@correo.com"
                      value={codeEmailInput}
                      onChange={(e) => {
                        setCodeEmailInput(e.target.value);
                        if (errorCode) setErrorCode(null);
                      }}
                      disabled={loadingCode}
                      style={{
                        background: '#F8FAFC',
                        border: errorCode && (!codeEmailInput.trim() || !codeEmailInput.includes('@'))
                          ? '2px solid #EF4444'
                          : '1.5px solid #CBD5E1',
                        borderRadius: 12,
                        color: '#294C6B',
                        fontSize: 15,
                        fontWeight: 700,
                        outline: 'none',
                        padding: '10px 14px',
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Campo Clave PIN de 6 dígitos */}
                  <div style={{ marginBottom: 16 }}>
                    <label
                      style={{
                        color: '#294C6B',
                        display: 'block',
                        fontSize: 13,
                        fontWeight: 800,
                        marginBottom: 5,
                        textAlign: 'left',
                      }}
                    >
                      Tu clave de 6 dígitos
                    </label>
                    <div style={{ textAlign: 'center' }}>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={10}
                        placeholder="000000"
                        value={codigoInput}
                        onChange={(e) => {
                          setCodigoInput(e.target.value);
                          if (errorCode) setErrorCode(null);
                        }}
                        disabled={loadingCode}
                        style={{
                          background: '#F8FAFC',
                          border: errorCode ? '2px solid #EF4444' : '2px solid #CBD5E1',
                          borderRadius: 14,
                          color: '#294C6B',
                          fontSize: 24,
                          fontWeight: 900,
                          letterSpacing: '0.22em',
                          outline: 'none',
                          padding: '10px 14px',
                          textAlign: 'center',
                          width: '100%',
                          maxWidth: 240,
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  {errorCode && (
                    <div
                      style={{
                        alignItems: 'center',
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        borderRadius: 10,
                        color: '#DC2626',
                        display: 'flex',
                        fontSize: 12,
                        fontWeight: 700,
                        gap: 6,
                        marginBottom: 14,
                        padding: '8px 12px',
                      }}
                    >
                      <IonIcon icon={alertCircleOutline} style={{ fontSize: 16, flexShrink: 0 }} />
                      <span>{errorCode}</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loadingCode || !codigoInput.trim() || !codeEmailInput.trim()}
                  style={{
                    background: '#294C6B',
                    border: 'none',
                    borderRadius: 14,
                    color: '#FFFFFF',
                    cursor: loadingCode || !codigoInput.trim() || !codeEmailInput.trim() ? 'default' : 'pointer',
                    fontSize: 15,
                    fontWeight: 800,
                    opacity: loadingCode || !codigoInput.trim() || !codeEmailInput.trim() ? 0.7 : 1,
                    padding: '13px 0',
                    width: '100%',
                  }}
                  className="active:bg-slate-800 transition-colors"
                >
                  {loadingCode ? 'Ingresando...' : 'Ingresar'}
                </button>
              </form>
            )}

            {/* Pestaña: Acceso Administrador (Correo y Contraseña) */}
            {tab === 'admin' && (
              <form
                onSubmit={handleLoginAdmin}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: 280,
                }}
              >
                <div>
                  <div style={{ textAlign: 'center', marginBottom: 14 }}>
                    <div
                      style={{
                        alignItems: 'center',
                        background: '#FEF3C7',
                        borderRadius: 999,
                        color: '#B45309',
                        display: 'flex',
                        height: 48,
                        justifyContent: 'center',
                        margin: '0 auto 8px',
                        width: 48,
                      }}
                    >
                      <IonIcon icon={shieldCheckmarkOutline} style={{ fontSize: 26 }} />
                    </div>
                    <h3 style={{ color: '#294C6B', fontSize: 16, fontWeight: 900, margin: '0 0 4px' }}>
                      Ingreso de Administrador
                    </h3>
                    <p style={{ color: '#64748B', fontSize: 12, margin: 0 }}>
                      Acceso para docentes y operadores del sistema
                    </p>
                  </div>

                  {/* Campo Email */}
                  <div style={{ marginBottom: 12 }}>
                    <label
                      style={{
                        color: '#294C6B',
                        display: 'block',
                        fontSize: 12,
                        fontWeight: 800,
                        marginBottom: 4,
                      }}
                    >
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      placeholder="admin@asistodo.com.ar"
                      value={adminEmailInput}
                      onChange={(e) => {
                        setAdminEmailInput(e.target.value);
                        if (errorAdmin) setErrorAdmin(null);
                      }}
                      disabled={loadingAdmin}
                      required
                      style={{
                        background: '#F8FAFC',
                        border: '1.5px solid #CBD5E1',
                        borderRadius: 12,
                        color: '#294C6B',
                        fontSize: 14,
                        fontWeight: 600,
                        outline: 'none',
                        padding: '10px 14px',
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Campo Contraseña */}
                  <div style={{ marginBottom: 14 }}>
                    <label
                      style={{
                        color: '#294C6B',
                        display: 'block',
                        fontSize: 12,
                        fontWeight: 800,
                        marginBottom: 4,
                      }}
                    >
                      Contraseña
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={adminPasswordInput}
                      onChange={(e) => {
                        setAdminPasswordInput(e.target.value);
                        if (errorAdmin) setErrorAdmin(null);
                      }}
                      disabled={loadingAdmin}
                      required
                      style={{
                        background: '#F8FAFC',
                        border: '1.5px solid #CBD5E1',
                        borderRadius: 12,
                        color: '#294C6B',
                        fontSize: 14,
                        fontWeight: 600,
                        outline: 'none',
                        padding: '10px 14px',
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {errorAdmin && (
                    <div
                      style={{
                        alignItems: 'center',
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        borderRadius: 10,
                        color: '#DC2626',
                        display: 'flex',
                        fontSize: 12,
                        fontWeight: 700,
                        gap: 6,
                        marginBottom: 14,
                        padding: '8px 12px',
                      }}
                    >
                      <IonIcon icon={alertCircleOutline} style={{ fontSize: 16, flexShrink: 0 }} />
                      <span>{errorAdmin}</span>
                    </div>
                  )}
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loadingAdmin || !adminEmailInput.trim() || !adminPasswordInput.trim()}
                    style={{
                      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                      border: '1.5px solid #F59E0B',
                      borderRadius: 14,
                      color: '#FCD34D',
                      cursor: loadingAdmin ? 'default' : 'pointer',
                      fontSize: 15,
                      fontWeight: 800,
                      opacity: loadingAdmin || !adminEmailInput.trim() || !adminPasswordInput.trim() ? 0.7 : 1,
                      padding: '12px 0',
                      width: '100%',
                      boxShadow: '0 2px 8px rgba(245, 158, 11, 0.25)',
                      marginBottom: 10,
                    }}
                    className="hover:brightness-110 active:scale-95 transition-all"
                  >
                    {loadingAdmin ? 'Verificando...' : 'Ingresar como Administrador'}
                  </button>

                  <div style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setTab('code')}
                      style={{
                        alignItems: 'center',
                        background: 'transparent',
                        border: 'none',
                        color: '#64748B',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        fontSize: 12,
                        fontWeight: 700,
                        gap: 4,
                      }}
                    >
                      <IonIcon icon={arrowBackOutline} style={{ fontSize: 14 }} />
                      <span>Volver al ingreso de alumnos</span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Acceso para Administrador / Docente al pie cuando se está en pestañas de alumnos */}
            {tab !== 'admin' && (
              <div
                style={{
                  marginTop: 14,
                  textAlign: 'center',
                  borderTop: '1px solid #F1F5F9',
                  paddingTop: 10,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setTab('admin');
                    setErrorAdmin(null);
                  }}
                  style={{
                    alignItems: 'center',
                    background: 'transparent',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    fontSize: 11,
                    fontWeight: 700,
                    gap: 4,
                  }}
                  className="hover:text-slate-600 transition-colors"
                >
                  <IonIcon icon={shieldCheckmarkOutline} style={{ fontSize: 13 }} />
                  <span>Acceso para Administrador / Docente</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
