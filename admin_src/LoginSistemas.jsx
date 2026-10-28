import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LockIcon, ShieldIcon, AlertTriangleIcon } from './Icons';

export const OPERADOR_STORAGE_KEY = 'asistodo_operador_session';

export default function LoginSistemas() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [cargando, setCargando] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ticketParam = params.get('ticket');

    if (ticketParam) {
      setCargando(true);
      setErrorMsg('');

      fetch('/api/auth/sso/canjear-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket: ticketParam }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.token) {
            const sessionData = {
              user: data.user?.name || data.user?.email || 'Administrador SSO',
              email: data.user?.email || '',
              token: data.token,
              tipoUsuario: 2,
              loginTime: new Date().toISOString(),
            };
            localStorage.setItem(OPERADOR_STORAGE_KEY, JSON.stringify(sessionData));
            navigate('/', { replace: true });
          } else {
            setErrorMsg(data.detail || data.message || 'Ticket SSO inválido o expirado.');
          }
        })
        .catch((err) => {
          console.error('Error al canjear ticket SSO:', err);
          setErrorMsg('Error de conexión al canjear ticket SSO.');
        })
        .finally(() => {
          setCargando(false);
        });
      return;
    }

    try {
      localStorage.removeItem(OPERADOR_STORAGE_KEY);
      sessionStorage.removeItem(OPERADOR_STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const u = usuario.trim().toLowerCase();
    const p = password.trim();

    if (!u || !p) {
      setErrorMsg('Por favor completá todos los campos.');
      return;
    }

    try {
      localStorage.removeItem(OPERADOR_STORAGE_KEY);
      sessionStorage.removeItem(OPERADOR_STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
    setCargando(true);
    const emailAEnviar = u.includes('@') ? u : (u === 'admin' ? 'admin@sistemas.com' : `${u}@sistemas.com`);

    try {
      const response = await fetch('/api/auth/login-sistemas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailAEnviar, password: p }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.token) {
        const rolUsuario = Number(data.user?.tipoUsuario);
        if (rolUsuario !== 2) {
          localStorage.removeItem(OPERADOR_STORAGE_KEY);
          sessionStorage.removeItem(OPERADOR_STORAGE_KEY);
          setErrorMsg('Acceso denegado: esta cuenta no posee rol de operador de sistemas.');
          return;
        }

        if (typeof data.token !== 'string' || data.token.split('.').length !== 3) {
          localStorage.removeItem(OPERADOR_STORAGE_KEY);
          sessionStorage.removeItem(OPERADOR_STORAGE_KEY);
          setErrorMsg('Token de autenticación inválido emitido por el servidor.');
          return;
        }

        const sessionData = {
          user: data.user?.name || data.user?.email || u,
          email: data.user?.email || emailAEnviar,
          token: data.token,
          tipoUsuario: 2,
          loginTime: new Date().toISOString(),
        };

        localStorage.setItem(OPERADOR_STORAGE_KEY, JSON.stringify(sessionData));
        navigate('/', { replace: true });
        return;
      } else {
        localStorage.removeItem(OPERADOR_STORAGE_KEY);
        sessionStorage.removeItem(OPERADOR_STORAGE_KEY);
        setErrorMsg(data?.detail || data?.message || 'Usuario o clave de operador incorrectos.');
      }
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      setErrorMsg('Error de conexión con el servidor. Verificá que el backend esté en ejecución.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#002B5E] to-blue-600 flex items-center justify-center text-white shadow-lg border border-blue-400/20">
            <ShieldIcon size={30} />
          </div>
        </div>
        <h1 className="mt-4 text-center text-2xl font-black text-white tracking-tight">
          Torre de Control
        </h1>
        <p className="mt-1 text-center text-xs text-slate-400">
          Mayores Actualizaciones · Acceso para Operadores
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800/90 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-700/80">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {errorMsg && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 flex items-start gap-3">
                <AlertTriangleIcon size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-red-200">{errorMsg}</div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Correo o Identificador
              </label>
              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="admin@sistemas.com"
                disabled={cargando}
                className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Contraseña de Seguridad
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={cargando}
                className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg shadow-blue-600/30 transition disabled:opacity-60 cursor-pointer"
            >
              {cargando ? (
                <span>Validando credenciales...</span>
              ) : (
                <>
                  <LockIcon size={16} />
                  <span>Ingresar al Sistema</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
