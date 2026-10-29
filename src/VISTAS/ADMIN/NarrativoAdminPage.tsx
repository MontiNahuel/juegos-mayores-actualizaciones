import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  obtenerSesionAdmin,
  guardarSesionAdmin,
  limpiarTodasLasSesiones,
  type AdminSession,
} from '../AUTH/authUtils';

// @ts-expect-error Componente administrativo en JSX
import NarrativeAdminModal from '../../../admin_src/narrative/NarrativeAdminModal';
// @ts-expect-error Componente administrativo en JSX
import ModalEconomia from '../../../admin_src/ModalEconomia';
// @ts-expect-error Componente administrativo en JSX
import ModalAsignarEconomia from '../../../admin_src/ModalAsignarEconomia';

export default function NarrativoAdminPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [adminSession, setAdminSession] = useState<AdminSession | null>(() => obtenerSesionAdmin());
  const [modalActivo, setModalActivo] = useState<'narrativo' | 'economia' | 'asignar'>('narrativo');

  // Formulario de login embebido
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorLogin, setErrorLogin] = useState<string | null>(null);
  const [cargandoLogin, setCargandoLogin] = useState(false);

  // Escuchar cambios de sesión reactivos
  useEffect(() => {
    const handleStorageUpdate = () => {
      const ses = obtenerSesionAdmin();
      setAdminSession(ses);
    };
    window.addEventListener('user_progress_updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('user_progress_updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  // Canjear ticket SSO si viene por URL ?ticket=...
  useEffect(() => {
    const ticketParam = searchParams.get('ticket');
    if (ticketParam && !adminSession) {
      setCargandoLogin(true);
      setErrorLogin(null);
      fetch('/api/auth/sso/canjear-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket: ticketParam }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success && data.token) {
            guardarSesionAdmin(data.user || { name: 'Admin SSO', email: '' }, data.token);
            setAdminSession(obtenerSesionAdmin());
          } else {
            setErrorLogin(data?.detail || data?.message || 'Ticket SSO inválido o expirado.');
          }
        })
        .catch(() => {
          setErrorLogin('Error de conexión al canjear ticket.');
        })
        .finally(() => {
          setCargandoLogin(false);
        });
    }
  }, [searchParams, adminSession]);

  // Interceptor en fetch para inyectar token de admin en rutas administrativas
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

      if (
        url.includes('/api/narrative/admin') ||
        url.includes('/api/challenges/admin') ||
        url.includes('/api/economy')
      ) {
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

  // Iniciar sesión desde el formulario
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();
    if (!cleanEmail || !cleanPass) return;

    setCargandoLogin(true);
    setErrorLogin(null);

    try {
      const res = await fetch('/api/auth/login-sistemas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPass }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.message || 'Credenciales incorrectas.');
      }

      if (data && data.success && data.user) {
        guardarSesionAdmin(data.user, data.token || '');
        setAdminSession(obtenerSesionAdmin());
      } else {
        throw new Error(data?.detail || data?.message || 'No se pudo iniciar sesión.');
      }
    } catch (err: any) {
      setErrorLogin(err.message || 'Error al iniciar sesión de administrador.');
    } finally {
      setCargandoLogin(false);
    }
  };

  const handleCerrarSesion = () => {
    limpiarTodasLasSesiones();
    setAdminSession(null);
  };

  // 1. Si no está autenticado: Formulario de Login directo
  if (!adminSession) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-amber-500/30">
        <div className="w-full max-w-md bg-slate-900/90 border border-amber-500/30 rounded-2xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />

          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl shadow-inner shadow-amber-500/10">
              🛡️
            </div>
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">
              Torre de Control
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Panel Administrativo de Juegos y Narrativa
            </p>
          </div>

          {errorLogin && (
            <div className="mb-5 p-3 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 text-sm flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>{errorLogin}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Correo Administrador
              </label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="admin@cognijuegos.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Contraseña / PIN
              </label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={cargandoLogin}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
            >
              {cargandoLogin ? 'Verificando acceso...' : 'Ingresar al Panel'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <button
              type="button"
              onClick={() => navigate('/menu')}
              className="text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
            >
              ← Volver al menú de juegos
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Si está autenticado: Toolbar superior + Modales / Vistas administrativas
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative text-slate-100">
      {/* Barra de Navegación de Torre de Control */}
      <header className="sticky top-0 z-50 bg-slate-900/95 border-b border-amber-500/30 px-6 py-3 backdrop-blur-md flex items-center justify-between flex-wrap gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-xl">
            👑
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Torre de Control
              </span>
              <span className="text-xs text-slate-400">
                {adminSession.email || adminSession.user}
              </span>
            </div>
            <h1 className="text-base font-black text-slate-100 leading-tight">
              Gestión de CogniJuegos
            </h1>
          </div>
        </div>

        {/* Pestañas de herramientas */}
        <div className="flex items-center gap-2 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
          <button
            type="button"
            onClick={() => setModalActivo('narrativo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              modalActivo === 'narrativo'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-300 hover:text-slate-100 hover:bg-slate-700/50'
            }`}
          >
            📖 Editor Narrativo
          </button>
          <button
            type="button"
            onClick={() => setModalActivo('economia')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              modalActivo === 'economia'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-300 hover:text-slate-100 hover:bg-slate-700/50'
            }`}
          >
            💎 Economía y Vidas
          </button>
          <button
            type="button"
            onClick={() => setModalActivo('asignar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              modalActivo === 'asignar'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-300 hover:text-slate-100 hover:bg-slate-700/50'
            }`}
          >
            👥 Asignar a Usuario
          </button>
        </div>

        {/* Acciones de salida */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/menu')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
          >
            🎮 Ir al Juego
          </button>
          <button
            type="button"
            onClick={handleCerrarSesion}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 transition-all cursor-pointer"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Área Principal de Contenido Administrativo */}
      <main className="flex-1 p-4 flex flex-col items-center justify-center relative">
        {modalActivo === 'narrativo' && (
          <NarrativeAdminModal
            abierto={true}
            onCerrar={() => navigate('/menu')}
          />
        )}

        {modalActivo === 'economia' && (
          <ModalEconomia
            abierto={true}
            onCerrar={() => setModalActivo('narrativo')}
            onGuardadoExitoso={() => {}}
          />
        )}

        {modalActivo === 'asignar' && (
          <ModalAsignarEconomia
            abierto={true}
            onCerrar={() => setModalActivo('narrativo')}
            onActualizado={() => {}}
          />
        )}
      </main>
    </div>
  );
}
