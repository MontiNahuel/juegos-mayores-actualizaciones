/* Permite que el personal entre al panel de administración. */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CrownIcon, LockIcon, AlertTriangleIcon } from './Icons';
import {
  canjearTicketSSO,
  irAlMenuDeJuegos,
  limpiarSesion,
  loginSistemas,
} from './authService';

// Permite que el personal entre al panel de administración.
export default function LoginSistemas() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [cargando, setCargando] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ticketParam = params.get('ticket');

    if (ticketParam) {
      setCargando(true);
      setErrorMsg('');

      canjearTicketSSO(ticketParam)
        .then(() => navigate('/juegos', { replace: true }))
        .catch((err) => {
          setErrorMsg(err.message || 'Ticket SSO inválido o expirado.');
        })
        .finally(() => {
          setCargando(false);
        });
      return;
    }

    limpiarSesion();
  }, [navigate]);

  // Envía las credenciales y prepara la sesión de administración.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setCargando(true);

    try {
      await loginSistemas(usuario, password);
      navigate('/juegos', { replace: true });
    } catch (err) {
      const mensaje =
        err instanceof TypeError
          ? 'Error de conexión con el servidor. Verificá que el backend esté en ejecución.'
          : err.message || 'Error al iniciar sesión de administrador.';
      setErrorMsg(mensaje);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-950 px-4 py-12 font-sans text-slate-100 selection:bg-amber-500/30">
      <div className="mx-auto w-full max-w-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20">
            <CrownIcon size={22} />
          </div>
          <div>
            <p className="text-lg font-black tracking-tight text-white">CogniJuegos</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-400/80">
              Torre de Control
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-white/5 bg-slate-900/50 p-6">
          <h1 className="text-base font-bold text-white">Acceso de operadores</h1>
          <p className="mt-1 text-xs text-slate-500">
            Ingresá con tu cuenta de sistemas para administrar el motor lúdico.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {errorMsg && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300">
                <AlertTriangleIcon size={15} className="mt-0.5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Correo o identificador
              </label>
              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="admin@sistemas.com"
                disabled={cargando}
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={cargando}
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-400 disabled:opacity-60"
            >
              <LockIcon size={15} />
              <span>{cargando ? 'Validando credenciales...' : 'Ingresar'}</span>
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={irAlMenuDeJuegos}
            className="text-xs font-semibold text-slate-500 transition hover:text-amber-400"
          >
            ← Volver al menú de juegos
          </button>
        </div>
      </div>
    </div>
  );
}
