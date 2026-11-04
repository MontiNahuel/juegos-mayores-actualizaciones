/* Comprueba la sesión antes de dejar entrar al panel. */
import { useState, useEffect } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { canjearTicketSSO, obtenerSesionValida } from './authService';
import { ShieldIcon, AlertTriangleIcon } from './Icons';

// Comprueba la sesión antes de dejar entrar al panel.
export default function RutaProtegidaSistemas({ children }) {
  const location = useLocation();
  const [cargandoSSO, setCargandoSSO] = useState(false);
  const [errorSSO, setErrorSSO] = useState('');
  const [ssoAutenticado, setSsoAutenticado] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const ticket = searchParams.get('ticket');
    if (!ticket) return;

    // El ticket es de un solo uso: se quita de la barra antes de canjearlo.
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
  }, []);

  if (cargandoSSO) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 font-sans">
        <div className="w-full max-w-sm space-y-4 rounded-2xl border border-white/5 bg-slate-900/50 p-6 text-center shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30">
            <ShieldIcon size={26} />
          </div>
          <h2 className="text-base font-bold text-white">Iniciando sesión segura</h2>
          <p className="text-xs text-slate-400">
            Validando ticket de acceso único con el Autenticador Central...
          </p>
          <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (errorSSO) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 font-sans">
        <div className="w-full max-w-sm space-y-5 rounded-2xl border border-white/5 bg-slate-900/50 p-6 text-center shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/30">
            <AlertTriangleIcon size={26} />
          </div>
          <h2 className="text-base font-bold text-white">Acceso SSO no autorizado</h2>
          <p className="rounded-lg border border-rose-500/20 bg-rose-950/40 p-3 text-xs text-rose-300">
            {errorSSO}
          </p>
          <Link
            to="/login"
            className="inline-block w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:bg-amber-400"
          >
            Ir al inicio de sesión manual
          </Link>
        </div>
      </div>
    );
  }

  const estaAutenticado = ssoAutenticado || Boolean(obtenerSesionValida());

  if (!estaAutenticado) {
    const search = location.search || '';
    return <Navigate to={`/login${search}`} state={{ from: location.pathname }} replace />;
  }

  return children;
}
