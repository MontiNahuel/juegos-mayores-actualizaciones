import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldIcon,
  CrownIcon,
  CalendarIcon,
  CoinsIcon,
  HeartIcon,
  BookOpenIcon,
  SearchIcon,
  CheckIcon,
  AlertTriangleIcon,
  RefreshIcon,
  LogOutIcon,
  XIcon,
  SparklesIcon,
  LayersIcon,
} from './Icons';
import NarrativeAdminModal from './narrative/NarrativeAdminModal';
import ModalEconomia from './ModalEconomia';
import ModalAsignarEconomia from './ModalAsignarEconomia';
import ModalDesafios from './ModalDesafios';
import { OPERADOR_STORAGE_KEY } from './LoginSistemas';
import { solicitarTicketRetorno } from './ssoService';

export default function PanelJuegosAdmin() {
  const navigate = useNavigate();

  // Operador autenticado
  const [operadorInfo, setOperadorInfo] = useState({ user: 'Operador', email: '' });

  // Control de Modales
  const [modalNarrativoAbierto, setModalNarrativoAbierto] = useState(false);
  const [modalEconomiaAbierto, setModalEconomiaAbierto] = useState(false);
  const [modalAsignarAbierto, setModalAsignarAbierto] = useState(false);
  const [modalDesafiosAbierto, setModalDesafiosAbierto] = useState(false);
  const [usuarioParaAsignar, setUsuarioParaAsignar] = useState(null);

  // Notificación toast flotante
  const [toastMsg, setToastMsg] = useState('');
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Salto SSO al Autenticador Central
  const [saltandoSSO, setSaltandoSSO] = useState(false);
  const handleIrAAutenticador = async () => {
    if (saltandoSSO) return;
    setSaltandoSSO(true);
    try {
      const data = await solicitarTicketRetorno('autenticador');
      if (data && data.ticket) {
        // En producción (cognijuegos.asistodo.com.ar o cualquier host no localhost),
        // SIEMPRE apunta a https://autenticacion.asistodo.com.ar
        const isLocal =
          typeof window !== 'undefined' &&
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

        const authBase = isLocal
          ? import.meta.env.VITE_AUTH_FRONTEND_URL || 'http://localhost:5173'
          : 'https://autenticacion.asistodo.com.ar';

        window.location.href = `${authBase.replace(/\/$/, '')}/?ticket=${encodeURIComponent(data.ticket)}`;
      }
    } catch (err) {
      console.error('Error al generar salto a Autenticador:', err);
      showToast(err.message || 'No se pudo iniciar el salto al panel central');
      setSaltandoSSO(false);
    }
  };

  // Cerrar sesión
  const handleLogout = () => {
    try {
      localStorage.removeItem(OPERADOR_STORAGE_KEY);
      sessionStorage.removeItem(OPERADOR_STORAGE_KEY);
      localStorage.removeItem('usuario');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
    } catch (e) {
      console.error(e);
    }
    navigate('/login', { replace: true });
  };

  // Validar sesión al montar
  useEffect(() => {
    try {
      const sesion = localStorage.getItem(OPERADOR_STORAGE_KEY);
      if (!sesion) {
        handleLogout();
        return;
      }
      const parsed = JSON.parse(sesion);
      const token = parsed?.token;
      const esJwtValido =
        typeof token === 'string' &&
        token.split('.').length === 3 &&
        !token.startsWith('op_local_');
      const esAdmin = parsed && (parsed.tipoUsuario === 2 || parsed.tipoUsuario === '2');

      if (!esAdmin || !esJwtValido) {
        handleLogout();
        return;
      }

      setOperadorInfo(parsed);
    } catch (e) {
      console.error('Error al inicializar sesión:', e);
      handleLogout();
    }
  }, []);

  const getAuthHeaders = () => {
    const sesion = localStorage.getItem(OPERADOR_STORAGE_KEY);
    const token = sesion ? JSON.parse(sesion)?.token : operadorInfo?.token;
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  // =========================================================================
  // BÚSQUEDA Y GESTIÓN RÁPIDA DE FICHA DE JUGADOR (Consultando cuenta central)
  // =========================================================================
  const [busquedaQuery, setBusquedaQuery] = useState('');
  const [buscandoJugador, setBuscandoJugador] = useState(false);
  const [jugadorEncontrado, setJugadorEncontrado] = useState(null);
  const [errorBusqueda, setErrorBusqueda] = useState('');
  const [ajustandoRapido, setAjustandoRapido] = useState(false);

  const handleBuscarJugador = async (e) => {
    if (e) e.preventDefault();
    const query = busquedaQuery.trim();
    if (!query) {
      setErrorBusqueda('Ingresá un correo electrónico, PIN de 6 dígitos o ID.');
      return;
    }

    setBuscandoJugador(true);
    setErrorBusqueda('');
    try {
      const res = await fetch(
        `/api/admin/economy/user/search?identificador=${encodeURIComponent(query)}`,
        { headers: getAuthHeaders() }
      );
      if (res.ok) {
        const data = await res.json();
        setJugadorEncontrado(data);
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorBusqueda(err.detail || 'Jugador no encontrado en el sistema.');
        setJugadorEncontrado(null);
      }
    } catch {
      setErrorBusqueda('Error de conexión al consultar el jugador.');
      setJugadorEncontrado(null);
    } finally {
      setBuscandoJugador(false);
    }
  };

  // Ajuste rápido de vidas o puntos (+5 vidas, +100 puntos, toggle suscripción)
  const handleAjusteRapido = async ({ vidasSumar = 0, puntosSumar = 0, nuevaSub = null }) => {
    if (!jugadorEncontrado) return;
    setAjustandoRapido(true);
    try {
      const payload = {
        identificador: jugadorEncontrado.email || String(jugadorEncontrado.id),
      };
      if (vidasSumar) payload.vidas_sumar = vidasSumar;
      if (puntosSumar) payload.puntos_sumar = puntosSumar;
      if (nuevaSub) payload.suscripcion_set = nuevaSub;

      const res = await fetch('/api/admin/economy/user/adjust', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setJugadorEncontrado((prev) => ({
          ...prev,
          vidas: data.vidas,
          puntos: data.puntos,
          suscripcion: data.suscripcion,
        }));
        showToast(data.message || 'Saldo actualizado exitosamente');
      } else {
        showToast(data.detail || 'No se pudo realizar el ajuste');
      }
    } catch (e) {
      console.error(e);
      showToast('Error de comunicación con el servidor');
    } finally {
      setAjustandoRapido(false);
    }
  };

  return (
    <div className="fixed inset-0 overflow-y-auto overflow-x-hidden bg-slate-950 font-sans text-slate-100 selection:bg-amber-500/30">
      {/* Toast Flotante */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-amber-500/50 text-amber-200 text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckIcon size={16} className="text-amber-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* HEADER SUPERIOR */}
      <header className="sticky top-0 z-30 bg-slate-900/90 border-b border-slate-800/80 px-6 py-4 backdrop-blur-xl shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <CrownIcon size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-white">
                  CogniJuegos
                </h1>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Torre de Control
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Gestión Integral de Dinámicas Cognitivas y Motor Lúdico
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex flex-col text-right mr-2">
              <span className="text-xs font-bold text-slate-200">
                {operadorInfo.user || 'Administrador'}
              </span>
              <span className="text-[11px] text-slate-400">
                {operadorInfo.email || 'Sesión Activa'}
              </span>
            </div>

            {/* Volver a Juegos */}
            <button
              onClick={() => navigate('/menu')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs transition cursor-pointer"
              title="Ir al Menú de Juegos"
            >
              <span>🎮 Ir a Juegos</span>
            </button>

            {/* Salto SSO al Autenticador Central */}
            <button
              onClick={handleIrAAutenticador}
              disabled={saltandoSSO}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 text-indigo-300 font-bold text-xs transition cursor-pointer disabled:opacity-50"
              title="Ir al Autenticador Central para altas, bajas o modificaciones de cuentas"
            >
              <ShieldIcon size={15} />
              <span>{saltandoSSO ? 'Conectando...' : 'Usuarios Central (SSO)'}</span>
            </button>

            {/* Cerrar Sesión */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-red-400 font-semibold text-xs transition cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOutIcon size={15} />
              <span className="hidden md:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 space-y-8">
        {/* =========================================================================
            LOS 4 HUBS PRINCIPALES DE GESTIÓN LÚDICA
           ========================================================================= */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* HUB 1: MOTOR NARRATIVO V2 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between hover:border-amber-500/50 transition-all group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center text-slate-950 font-black shadow-md">
                  <CrownIcon size={24} />
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Crónicas de la Corte Real
                </span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Motor Narrativo V2
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Suite completa de 9 módulos para gobernar el juego roguelite narrativo: gestión de universos, cartas tácticas, personajes, dilemas, diálogos, condiciones y editor visual de nodos en grafos.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Universos
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Personajes
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Cartas
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Eventos
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Grafos V2
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Sincronización en tiempo real con MongoDB
              </span>
              <button
                type="button"
                onClick={() => setModalNarrativoAbierto(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs tracking-wide shadow-lg shadow-amber-500/20 active:scale-95 transition cursor-pointer"
              >
                Abrir Editor Narrativo →
              </button>
            </div>
          </div>

          {/* HUB 2: DESAFÍOS DIARIOS */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between hover:border-blue-500/50 transition-all group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-slate-950 font-black shadow-md">
                  <CalendarIcon size={24} />
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  Puzzles Diarios
                </span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Desafíos del Calendario
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Control de cobertura mensual para los 4 juegos diarios. Auditoría de generación procedural con cruces válidos, definiciones de la RAE y tableros deterministas con solución garantizada.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Sudoku
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Palabra del Día
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Sopa de Letras
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Crucigrama RAE
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Generador en 1 clic por mes
              </span>
              <button
                type="button"
                onClick={() => setModalDesafiosAbierto(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-slate-950 font-black text-xs tracking-wide shadow-lg shadow-blue-500/20 active:scale-95 transition cursor-pointer"
              >
                Gestionar Desafíos →
              </button>
            </div>
          </div>

          {/* HUB 3: ECONOMÍA, VIDAS Y TIENDA */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between hover:border-purple-500/50 transition-all group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-fuchsia-400 flex items-center justify-center text-slate-950 font-black shadow-md">
                  <CoinsIcon size={24} />
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
                  Reglas Globales
                </span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Economía & Sistema de Vidas
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Parámetros de vidas compartidas entre juegos: cantidad de vidas iniciales, costo de compra en puntos, recompensas otorgadas por victoria y costo en puntos para desbloquear desafíos de días pasados.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Vidas Base
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Puntos por Juego
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Desbloqueo Calendario
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Paquetes Tienda
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Reglas transversales de juego
              </span>
              <button
                type="button"
                onClick={() => setModalEconomiaAbierto(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-400 hover:to-fuchsia-400 text-slate-950 font-black text-xs tracking-wide shadow-lg shadow-purple-500/20 active:scale-95 transition cursor-pointer"
              >
                Configurar Economía →
              </button>
            </div>
          </div>

          {/* HUB 4: FICHA DE JUGADOR & SOPORTE DIRECTO (Buscador contra autenticador) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between hover:border-rose-500/50 transition-all group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-pink-400 flex items-center justify-center text-slate-950 font-black shadow-md">
                  <HeartIcon size={24} />
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
                  Soporte a Jugadores
                </span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Ficha Lúdica de Jugador
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Consultá la cuenta de cualquier alumno (por correo electrónico o PIN) para verificar su saldo de vidas, puntos acumulados y tipo de suscripción lúdica.
              </p>

              {/* Formulario de Búsqueda Rápida */}
              <form onSubmit={handleBuscarJugador} className="mt-4 flex gap-2">
                <div className="relative flex-1">
                  <SearchIcon
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={busquedaQuery}
                    onChange={(e) => setBusquedaQuery(e.target.value)}
                    placeholder="Email, PIN de 6 dígitos o ID..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-rose-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={buscandoJugador}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50"
                >
                  {buscandoJugador ? 'Buscando...' : 'Buscar'}
                </button>
              </form>

              {errorBusqueda && (
                <div className="mt-3 p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangleIcon size={14} />
                  <span>{errorBusqueda}</span>
                </div>
              )}

              {/* Ficha desplegada del jugador */}
              {jugadorEncontrado && (
                <div className="mt-4 p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-sm text-white">
                        {jugadorEncontrado.name || 'Alumno'}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {jugadorEncontrado.email} · PIN: <span className="font-mono text-amber-300">{jugadorEncontrado.codigoAcceso || '—'}</span>
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                        jugadorEncontrado.suscripcion === 'premium'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-700 text-slate-300 border-slate-600'
                      }`}
                    >
                      {jugadorEncontrado.suscripcion === 'premium' ? '★ Premium' : 'Básica'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t border-slate-700/60">
                    <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-700/40">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">
                        Vidas
                      </span>
                      <span className="text-lg font-black text-rose-400">
                        {jugadorEncontrado.vidas ?? 5} 💖
                      </span>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-700/40">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">
                        Puntos
                      </span>
                      <span className="text-lg font-black text-amber-400">
                        {jugadorEncontrado.puntos ?? 0} 🪙
                      </span>
                    </div>
                  </div>

                  {/* Acciones Rápidas */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2">
                    <button
                      type="button"
                      disabled={ajustandoRapido}
                      onClick={() => handleAjusteRapido({ vidasSumar: 5 })}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[11px] font-bold border border-rose-500/30 transition cursor-pointer"
                    >
                      +5 Vidas
                    </button>
                    <button
                      type="button"
                      disabled={ajustandoRapido}
                      onClick={() => handleAjusteRapido({ puntosSumar: 100 })}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold border border-amber-500/30 transition cursor-pointer"
                    >
                      +100 Pts
                    </button>
                    <button
                      type="button"
                      disabled={ajustandoRapido}
                      onClick={() =>
                        handleAjusteRapido({
                          nuevaSub: jugadorEncontrado.suscripcion === 'premium' ? 'basica' : 'premium',
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-[11px] font-bold border border-purple-500/30 transition cursor-pointer"
                    >
                      {jugadorEncontrado.suscripcion === 'premium' ? 'Bajar a Básica' : 'Hacer Premium'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUsuarioParaAsignar(jugadorEncontrado);
                        setModalAsignarAbierto(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-bold transition cursor-pointer ml-auto"
                    >
                      Ajuste manual...
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Herramienta de compensación & testing
              </span>
              <button
                type="button"
                onClick={() => {
                  setUsuarioParaAsignar(null);
                  setModalAsignarAbierto(true);
                }}
                className="px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold text-xs transition cursor-pointer"
              >
                Abrir Modal de Asignación →
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* =========================================================================
          MODALES DE ADMINISTRACIÓN ACTIVABLES DESDE LOS HUBS
         ========================================================================= */}
      <NarrativeAdminModal
        abierto={modalNarrativoAbierto}
        onCerrar={() => setModalNarrativoAbierto(false)}
      />

      <ModalDesafios
        abierto={modalDesafiosAbierto}
        onCerrar={() => setModalDesafiosAbierto(false)}
      />

      <ModalEconomia
        abierto={modalEconomiaAbierto}
        onCerrar={() => setModalEconomiaAbierto(false)}
        onGuardadoExitoso={() => {
          showToast('Configuración de economía actualizada');
        }}
      />

      <ModalAsignarEconomia
        abierto={modalAsignarAbierto}
        usuarioInicial={usuarioParaAsignar}
        onCerrar={() => setModalAsignarAbierto(false)}
        onActualizado={(userActualizado) => {
          if (jugadorEncontrado && jugadorEncontrado.id === userActualizado.id) {
            setJugadorEncontrado((prev) => ({
              ...prev,
              vidas: userActualizado.vidas,
              puntos: userActualizado.puntos,
              suscripcion: userActualizado.suscripcion,
            }));
          }
          showToast(`Saldo actualizado para ${userActualizado.name || 'usuario'}`);
        }}
      />
    </div>
  );
}
