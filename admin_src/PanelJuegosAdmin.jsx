import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CrownIcon,
  CalendarIcon,
  CoinsIcon,
  UserIcon,
  SearchIcon,
  CheckIcon,
  AlertTriangleIcon,
  ChevronRightIcon,
} from './Icons';
import AdminShell from './AdminShell';
import NarrativeAdminModal from './narrative/NarrativeAdminModal';
import ModalEconomia from './ModalEconomia';
import ModalAsignarEconomia from './ModalAsignarEconomia';
import ModalDesafios from './ModalDesafios';
import {
  getAuthHeaders,
  limpiarSesion,
  obtenerSesionValida,
  solicitarTicketRetorno,
} from './authService';

const HERRAMIENTAS = [
  {
    id: 'narrativo',
    icon: CrownIcon,
    kicker: 'Crónicas de la Corte Real',
    title: 'Motor Narrativo V2',
    desc: 'Universos, personajes, cartas, eventos y grafos del roguelite.',
    cta: 'Abrir editor',
  },
  {
    id: 'desafios',
    icon: CalendarIcon,
    kicker: 'Puzzles diarios',
    title: 'Desafíos del calendario',
    desc: 'Cobertura mensual y generación de los cuatro juegos diarios.',
    cta: 'Gestionar desafíos',
  },
  {
    id: 'economia',
    icon: CoinsIcon,
    kicker: 'Reglas globales',
    title: 'Economía y vidas',
    desc: 'Vidas iniciales, puntos, recompensas y desbloqueos.',
    cta: 'Configurar economía',
  },
  {
    id: 'jugadores',
    icon: UserIcon,
    kicker: 'Soporte',
    title: 'Ficha de jugador',
    desc: 'Buscá una cuenta y ajustá vidas, puntos o suscripción.',
    cta: 'Buscar jugador',
  },
];

export default function PanelJuegosAdmin() {
  const navigate = useNavigate();

  const [vista, setVista] = useState('resumen');
  const [operadorInfo, setOperadorInfo] = useState({ user: 'Operador', email: '' });

  const [modalAsignarAbierto, setModalAsignarAbierto] = useState(false);
  const [usuarioParaAsignar, setUsuarioParaAsignar] = useState(null);

  const [toastMsg, setToastMsg] = useState('');
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

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

  const handleLogout = () => {
    limpiarSesion();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    const sesion = obtenerSesionValida();
    if (!sesion) {
      handleLogout();
      return;
    }
    setOperadorInfo(sesion);
  }, []);

  const abrirHerramienta = (id) => setVista(id);

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

  const claseBotonRapido =
    'rounded-lg border px-3 py-1.5 text-[11px] font-bold transition disabled:opacity-50';

  return (
    <>
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-slate-900 px-4 py-3 text-xs font-bold text-amber-200 shadow-2xl">
          <CheckIcon size={16} className="text-amber-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      <AdminShell
        active={vista}
        onNavigate={setVista}
        onOpenTool={abrirHerramienta}
        operador={operadorInfo}
        onSSO={handleIrAAutenticador}
        saltandoSSO={saltandoSSO}
        onLogout={handleLogout}
      >
        {vista === 'jugadores' ? (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white">Ficha lúdica</h2>
              <p className="mt-1 text-sm text-slate-400">
                Consultá una cuenta por correo, PIN de seis dígitos o ID para revisar y ajustar su
                saldo.
              </p>
            </div>

            <form onSubmit={handleBuscarJugador} className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <SearchIcon
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="text"
                  value={busquedaQuery}
                  onChange={(e) => setBusquedaQuery(e.target.value)}
                  placeholder="Email, PIN de 6 dígitos o ID..."
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-3 pl-10 pr-3 text-sm text-white placeholder-slate-500 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
              <button
                type="submit"
                disabled={buscandoJugador}
                className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
              >
                {buscandoJugador ? 'Buscando...' : 'Buscar'}
              </button>
            </form>

            {errorBusqueda && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 px-3 py-2.5 text-xs text-rose-300">
                <AlertTriangleIcon size={15} />
                <span>{errorBusqueda}</span>
              </div>
            )}

            {jugadorEncontrado && (
              <article className="max-w-3xl rounded-2xl border border-white/5 bg-slate-900/50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {jugadorEncontrado.name || 'Alumno'}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {jugadorEncontrado.email} · PIN:{' '}
                      <span className="font-mono text-amber-300">
                        {jugadorEncontrado.codigoAcceso || '—'}
                      </span>
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                      jugadorEncontrado.suscripcion === 'premium'
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                        : 'border-white/10 bg-white/5 text-slate-400'
                    }`}
                  >
                    {jugadorEncontrado.suscripcion === 'premium' ? 'Premium' : 'Básica'}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/5 bg-slate-950/40 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Vidas
                    </p>
                    <p className="mt-1 text-2xl font-black text-rose-400">
                      {jugadorEncontrado.vidas ?? 5}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-slate-950/40 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Puntos
                    </p>
                    <p className="mt-1 text-2xl font-black text-amber-400">
                      {jugadorEncontrado.puntos ?? 0}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/5 pt-4">
                  <button
                    type="button"
                    disabled={ajustandoRapido}
                    onClick={() => handleAjusteRapido({ vidasSumar: 5 })}
                    className={`${claseBotonRapido} border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20`}
                  >
                    +5 vidas
                  </button>
                  <button
                    type="button"
                    disabled={ajustandoRapido}
                    onClick={() => handleAjusteRapido({ puntosSumar: 100 })}
                    className={`${claseBotonRapido} border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20`}
                  >
                    +100 puntos
                  </button>
                  <button
                    type="button"
                    disabled={ajustandoRapido}
                    onClick={() =>
                      handleAjusteRapido({
                        nuevaSub: jugadorEncontrado.suscripcion === 'premium' ? 'basica' : 'premium',
                      })
                    }
                    className={`${claseBotonRapido} border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20`}
                  >
                    {jugadorEncontrado.suscripcion === 'premium'
                      ? 'Pasar a básica'
                      : 'Hacer premium'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUsuarioParaAsignar(jugadorEncontrado);
                      setModalAsignarAbierto(true);
                    }}
                    className={`${claseBotonRapido} ml-auto border-white/10 bg-white/5 text-slate-300 hover:bg-white/10`}
                  >
                    Ajuste manual...
                  </button>
                </div>
              </article>
            )}
          </section>
        ) : vista === 'narrativo' ? (
          <NarrativeAdminModal
            embebido
            abierto
            onCerrar={() => setVista('resumen')}
          />
        ) : vista === 'desafios' ? (
          <ModalDesafios embebido abierto onCerrar={() => setVista('resumen')} />
        ) : vista === 'economia' ? (
          <ModalEconomia
            embebido
            abierto
            onCerrar={() => setVista('resumen')}
            onGuardadoExitoso={() => showToast('Configuración de economía actualizada')}
          />
        ) : (
          <section className="space-y-8">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white">Panel de juegos</h2>
              <p className="mt-1 text-sm text-slate-400">
                Herramientas de operación para el motor lúdico y la economía de los jugadores.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {HERRAMIENTAS.map(({ id, icon: Icon, kicker, title, desc, cta }) => (
                <article
                  key={id}
                  className="flex flex-col rounded-2xl border border-white/5 bg-slate-900/50 p-5 transition hover:border-amber-500/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-amber-300">
                      <Icon size={19} />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                      {kicker}
                    </p>
                  </div>
                  <h3 className="mt-4 text-base font-bold text-white">{title}</h3>
                  <p className="mt-1 flex-1 text-sm leading-relaxed text-slate-400">{desc}</p>
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => abrirHerramienta(id)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 transition hover:bg-amber-400"
                    >
                      {cta}
                      <ChevronRightIcon size={14} />
                    </button>
                    {id === 'jugadores' && (
                      <button
                        type="button"
                        onClick={() => {
                          setUsuarioParaAsignar(null);
                          setModalAsignarAbierto(true);
                        }}
                        className="text-[11px] font-semibold text-slate-500 transition hover:text-slate-300"
                      >
                        Ajuste manual de saldo
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </AdminShell>

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
    </>
  );
}
