import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IonIcon } from '@ionic/react';
import {
  lockClosedOutline,
  shieldCheckmarkOutline,
  alertCircleOutline,
  logOutOutline,
  arrowBackOutline,
  keyOutline,
  personOutline,
} from 'ionicons/icons';
import { API_URL } from '../../config/api';
// @ts-expect-error Componente administrativo en JSX
import NarrativeAdminModal from '../../../admin_src/narrative/NarrativeAdminModal';

const OPERADOR_STORAGE_KEY = 'asistodo_operador_session';

interface AdminSession {
  user: string;
  email: string;
  token: string;
  tipoUsuario: number;
}

export default function NarrativoAdminPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Estados de autenticación
  const [verificando, setVerificando] = useState(true);
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [esUsuarioComun, setEsUsuarioComun] = useState(false);
  const [nombreUsuarioComun, setNombreUsuarioComun] = useState('');

  // Estados de formulario de login
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [cargandoLogin, setCargandoLogin] = useState(false);
  const [errorLogin, setErrorLogin] = useState('');

  // Validar y extraer token de administrador
  const obtenerSesionAdmin = useCallback((): AdminSession | null => {
    try {
      // 1. Probar sesión de operador de sistemas
      const sesionRaw =
        localStorage.getItem(OPERADOR_STORAGE_KEY) ||
        sessionStorage.getItem(OPERADOR_STORAGE_KEY);
      if (sesionRaw) {
        const parsed = JSON.parse(sesionRaw);
        const tipo = Number(parsed.tipoUsuario || parsed.rol || parsed.tipo_usuario);
        const token = parsed.token;
        if (tipo === 2 && token && typeof token === 'string' && token.split('.').length === 3) {
          try {
            const payload = JSON.parse(
              atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
            );
            if (!payload.exp || payload.exp * 1000 > Date.now()) {
              return {
                user: parsed.user || payload.name || 'Administrador',
                email: parsed.email || payload.email || '',
                token,
                tipoUsuario: 2,
              };
            }
          } catch {
            // Token corrupto
          }
        }
      }

      // 2. Probar sesión estándar de CogniJuegos en localStorage
      const userRaw = localStorage.getItem('usuario') || localStorage.getItem('user');
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token && typeof token === 'string' && token.split('.').length === 3) {
        const payload = JSON.parse(
          atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
        );
        const tipoToken = Number(payload.tipoUsuario || payload.rol || payload.tipo_usuario);
        let tipoUser = 1;
        let nombre = payload.name || '';
        let email = payload.email || '';

        if (userRaw) {
          try {
            const userObj = JSON.parse(userRaw);
            tipoUser = Number(userObj.tipoUsuario || userObj.rol || userObj.tipo_usuario);
            nombre = userObj.name || nombre;
            email = userObj.email || email;
          } catch {}
        }

        const esAdmin = tipoToken === 2 || tipoUser === 2;
        const noExpirado = !payload.exp || payload.exp * 1000 > Date.now();

        if (esAdmin && noExpirado) {
          return {
            user: nombre || 'Administrador',
            email: email,
            token,
            tipoUsuario: 2,
          };
        }
      }
    } catch (e) {
      console.error('Error al verificar sesión de administración:', e);
    }
    return null;
  }, []);

  // Verificar si hay un usuario regular logueado
  const verificarUsuarioRegular = useCallback(() => {
    try {
      const userRaw = localStorage.getItem('usuario') || localStorage.getItem('user');
      if (userRaw) {
        const userObj = JSON.parse(userRaw);
        const tipo = Number(userObj.tipoUsuario || userObj.rol || userObj.tipo_usuario || 1);
        if (tipo !== 2) {
          setEsUsuarioComun(true);
          setNombreUsuarioComun(userObj.name || userObj.email || 'Alumno');
          return;
        }
      }
    } catch {}
    setEsUsuarioComun(false);
  }, []);

  // Efecto inicial: Comprobar SSO Ticket o sesión guardada
  useEffect(() => {
    const ticketParam = searchParams.get('ticket');
    if (ticketParam) {
      setCargandoLogin(true);
      setErrorLogin('');
      fetch(`${API_URL}/api/auth/sso/canjear-ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket: ticketParam }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.token) {
            const userObj = data.user || {};
            const tipo = Number(userObj.tipoUsuario || userObj.tipo_usuario || 2);
            if (tipo === 2) {
              const session: AdminSession = {
                user: userObj.name || userObj.email || 'Operador SSO',
                email: userObj.email || '',
                token: data.token,
                tipoUsuario: 2,
              };
              localStorage.setItem(OPERADOR_STORAGE_KEY, JSON.stringify(session));
              setAdminSession(session);
            } else {
              setErrorLogin('Acceso denegado: Este ticket no pertenece a un Administrador.');
            }
          } else {
            setErrorLogin(data.detail || data.message || 'Ticket SSO inválido o expirado.');
          }
        })
        .catch(() => {
          setErrorLogin('Error de conexión al procesar ticket SSO.');
        })
        .finally(() => {
          setCargandoLogin(false);
          setVerificando(false);
        });
      return;
    }

    const sesion = obtenerSesionAdmin();
    if (sesion) {
      setAdminSession(sesion);
    } else {
      verificarUsuarioRegular();
    }
    setVerificando(false);
  }, [searchParams, obtenerSesionAdmin, verificarUsuarioRegular]);

  // Interceptor global en fetch para inyectar token Bearer de Administrador en rutas administrativas
  useEffect(() => {
    if (!adminSession?.token) return;

    const originalFetch = window.fetch;
    const token = adminSession.token;

    window.fetch = async (input, init = {}) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof Request
          ? input.url
          : '';

      if (url.includes('/api/narrative/admin') || url.includes('/api/challenges/admin')) {
        init = init || {};
        const headers = new Headers(
          init.headers || (input instanceof Request ? input.headers : {})
        );
        if (!headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        init.headers = headers;
      }

      return originalFetch(input, init);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [adminSession]);

  // Manejador de Login como Administrador
  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !passwordInput.trim()) {
      setErrorLogin('Por favor completa todos los campos.');
      return;
    }

    setCargandoLogin(true);
    setErrorLogin('');

    try {
      const res = await fetch(`${API_URL}/api/auth/login-sistemas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput.trim(),
          password: passwordInput,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || data.message || 'Credenciales incorrectas.');
      }

      const userObj = data.user || {};
      const tipo = Number(userObj.tipoUsuario || userObj.tipo_usuario || 2);

      if (tipo !== 2) {
        throw new Error('Acceso denegado: Esta cuenta no posee privilegios de Administrador.');
      }

      const session: AdminSession = {
        user: userObj.name || userObj.email || 'Operador Autorizado',
        email: userObj.email || emailInput.trim(),
        token: data.token,
        tipoUsuario: 2,
      };

      localStorage.setItem(OPERADOR_STORAGE_KEY, JSON.stringify(session));
      setAdminSession(session);
      setEsUsuarioComun(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión.';
      setErrorLogin(msg);
    } finally {
      setCargandoLogin(false);
    }
  };

  const handleLogoutAdmin = () => {
    localStorage.removeItem(OPERADOR_STORAGE_KEY);
    sessionStorage.removeItem(OPERADOR_STORAGE_KEY);
    setAdminSession(null);
    verificarUsuarioRegular();
  };

  // 1. Pantalla de carga mientras se valida sesión
  if (verificando) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-400">Verificando credenciales de seguridad...</p>
        </div>
      </div>
    );
  }

  // 2. Pantalla de Acceso Denegado si es alumno común (tipoUsuario === 1)
  if (!adminSession && esUsuarioComun) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center mb-4 border border-rose-500/20">
            <IonIcon icon={alertCircleOutline} style={{ fontSize: '32px' }} />
          </div>

          <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full">
            Acceso Denegado (403)
          </span>

          <h2 className="text-lg font-black text-white mt-3 mb-2">
            Permisos de Administrador Requeridos
          </h2>

          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Hola <strong className="text-slate-200">{nombreUsuarioComun}</strong>. Tu cuenta actual no cuenta con permisos de Operador o Administrador para gestionar el motor narrativo.
          </p>

          <div className="space-y-2">
            <button
              onClick={() => navigate('/menu')}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <IonIcon icon={arrowBackOutline} />
              <span>Volver a CogniJuegos</span>
            </button>

            <button
              onClick={() => setEsUsuarioComun(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs transition border border-amber-500/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <IonIcon icon={keyOutline} />
              <span>Ingresar con Cuenta de Administrador</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Pantalla de Login de Administrador si no está autenticado
  if (!adminSession) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center mb-3 border border-amber-500/20 shadow-inner">
              <IonIcon icon={shieldCheckmarkOutline} style={{ fontSize: '28px' }} />
            </div>

            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
              Torre de Control
            </span>

            <h2 className="text-lg font-black text-white mt-2">
              Autenticación de Administrador
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Ingresa tus credenciales de operador para configurar el juego narrativo.
            </p>
          </div>

          {errorLogin && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <IonIcon icon={alertCircleOutline} style={{ fontSize: '18px' }} className="flex-shrink-0" />
              <span>{errorLogin}</span>
            </div>
          )}

          <form onSubmit={handleSubmitLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Correo Electrónico / Usuario
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="admin@asistodo.com.ar"
                  required
                  className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
                <span className="absolute left-3 top-3 text-slate-500">
                  <IonIcon icon={personOutline} />
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
                <span className="absolute left-3 top-3 text-slate-500">
                  <IonIcon icon={lockClosedOutline} />
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={cargandoLogin}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {cargandoLogin ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <IonIcon icon={lockClosedOutline} />
                  <span>Ingresar a la Suite Narrativa</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
            <button
              type="button"
              onClick={() => navigate('/menu')}
              className="text-[11px] font-bold text-slate-400 hover:text-white transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <IonIcon icon={arrowBackOutline} />
              <span>Volver a CogniJuegos</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Pantalla Autorizada (Administrador Autenticado)
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative">
      {/* Barra superior de Administrador */}
      <div className="fixed top-3 right-3 z-50 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-800 text-xs text-white shadow-xl">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="font-bold text-[11px] text-slate-300">
          Admin: <strong className="text-white">{adminSession.user}</strong>
        </span>
        <button
          onClick={handleLogoutAdmin}
          className="ml-2 text-slate-400 hover:text-rose-400 transition cursor-pointer"
          title="Cerrar sesión de administrador"
        >
          <IonIcon icon={logOutOutline} style={{ fontSize: '15px' }} />
        </button>
      </div>

      {/* Suite Administrativa del Juego Narrativo */}
      <NarrativeAdminModal
        abierto={true}
        onCerrar={() => navigate('/menu')}
      />
    </div>
  );
}
