import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { OPERADOR_STORAGE_KEY } from './LoginSistemas';
import { canjearTicketSSO } from './ssoService';
import { ShieldIcon, AlertTriangleIcon } from './Icons';

export default function RutaProtegidaSistemas({ children }) {
  const location = useLocation();
  const [cargandoSSO, setCargandoSSO] = useState(false);
  const [errorSSO, setErrorSSO] = useState('');
  const [ssoAutenticado, setSsoAutenticado] = useState(false);

  // Verificar si viene un ticket SSO descartable en la URL (?ticket=sso_tk_...)
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const ticket = searchParams.get('ticket');

      if (ticket) {
        // Limpiar inmediatamente el ticket de la barra de direcciones del navegador
        window.history.replaceState({}, document.title, window.location.pathname);
        setCargandoSSO(true);
        setErrorSSO('');

        canjearTicketSSO(ticket)
          .then(() => {
            setSsoAutenticado(true);
            setCargandoSSO(false);
          })
          .catch((err) => {
            console.error('Fallo al canjear ticket SSO:', err);
            setErrorSSO(err.message || 'El enlace de acceso expiró o es inválido.');
            setCargandoSSO(false);
          });
      }
    } catch (e) {
      console.error('Error al procesar parámetros de URL:', e);
    }
  }, []);

  // Pantalla de carga mientras se canjea el ticket efímero de 30s
  if (cargandoSSO) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto ring-1 ring-indigo-500/30 animate-pulse">
            <ShieldIcon className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Iniciando sesión segura</h2>
          <p className="text-slate-400 text-sm">
            Validando ticket de acceso único con el Autenticador Central...
          </p>
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mt-4" />
        </div>
      </div>
    );
  }

  // Pantalla de error si el ticket expiró (más de 30s) o fue reutilizado
  if (errorSSO) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-red-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto ring-1 ring-red-500/30">
            <AlertTriangleIcon className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Acceso SSO no autorizado</h2>
          <p className="text-red-300 text-sm bg-red-950/40 p-3 rounded-lg border border-red-500/20">
            {errorSSO}
          </p>
          <a
            href="/admin/login"
            className="inline-block w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-indigo-600/30 text-sm"
          >
            Ir al inicio de sesión manual
          </a>
        </div>
      </div>
    );
  }

  // Validación estándar de sesión en localStorage
  let estaAutenticado = ssoAutenticado;
  if (!estaAutenticado) {
    try {
      const sesion = localStorage.getItem(OPERADOR_STORAGE_KEY) || sessionStorage.getItem(OPERADOR_STORAGE_KEY);
      if (sesion) {
        const parsed = JSON.parse(sesion);
        const esAdmin = parsed && (parsed.tipoUsuario === 2 || parsed.tipoUsuario === '2');
        const tieneUsuario = Boolean(parsed && parsed.user);
        const token = parsed?.token;
        const esJwtValido = typeof token === 'string' &&
          token.split('.').length === 3 &&
          !token.startsWith('op_local_');

        let tokenVigente = false;
        if (esJwtValido) {
          try {
            const payloadBase64 = token.split('.')[1];
            const decodedJson = JSON.parse(
              atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'))
            );
            if (decodedJson.exp) {
              tokenVigente = decodedJson.exp * 1000 > Date.now();
            } else {
              tokenVigente = true;
            }
          } catch {
            tokenVigente = false;
          }
        }

        if (esAdmin && tieneUsuario && esJwtValido && tokenVigente) {
          estaAutenticado = true;
        } else {
          localStorage.removeItem(OPERADOR_STORAGE_KEY);
          sessionStorage.removeItem(OPERADOR_STORAGE_KEY);
          estaAutenticado = false;
        }
      }
    } catch (e) {
      console.error('Error al validar sesión de operador:', e);
      estaAutenticado = false;
    }
  }

  if (!estaAutenticado) {
    const search = location.search || '';
    return <Navigate to={`/login${search}`} state={{ from: location.pathname }} replace />;
  }

  return children;
}
