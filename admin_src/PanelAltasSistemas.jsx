import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldIcon,
  LogOutIcon,
  CheckIcon,
  AlertTriangleIcon,
  RefreshIcon,
  CalendarIcon,
  BookOpenIcon,
  LayersIcon,
} from './Icons';
import { OPERADOR_STORAGE_KEY } from './LoginSistemas';
import NarrativeAdminModal from './narrative/NarrativeAdminModal';

export default function PanelAltasSistemas() {
  const navigate = useNavigate();

  // Operador autenticado
  const [operadorInfo, setOperadorInfo] = useState({ user: 'Operador' });

  // Pestaña principal activa: 'narrative' (por defecto) o 'desafios'
  const [seccionActiva, setSeccionActiva] = useState('narrative');

  // Modal del Juego Narrativo
  const [modalNarrativoAbierto, setModalNarrativoAbierto] = useState(true);

  // Notificación toast flotante
  const [toastMsg, setToastMsg] = useState('');
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Estado para Generación de Desafíos Diarios
  const [desafiosJuego, setDesafiosJuego] = useState('sudoku');
  const [desafiosAnio, setDesafiosAnio] = useState(2026);
  const [mesesDesafios, setMesesDesafios] = useState([]);
  const [cargandoDesafios, setCargandoDesafios] = useState(false);
  const [generandoMes, setGenerandoMes] = useState(null);
  const [errorDesafios, setErrorDesafios] = useState('');
  const [exitoDesafios, setExitoDesafios] = useState('');

  const getAuthHeaders = () => {
    const sesion = localStorage.getItem(OPERADOR_STORAGE_KEY);
    const token = sesion ? JSON.parse(sesion)?.token : operadorInfo?.token;
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const cargarEstadoDesafios = async (anio = desafiosAnio, juego = desafiosJuego) => {
    setCargandoDesafios(true);
    setErrorDesafios('');
    try {
      const res = await fetch(`/api/challenges/admin/status?year=${anio}&game_id=${juego}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setMesesDesafios(data.months || []);
      } else {
        setErrorDesafios('No se pudo cargar el estado de desafíos.');
      }
    } catch (e) {
      console.error(e);
      setErrorDesafios('Error al conectar con el servidor.');
    } finally {
      setCargandoDesafios(false);
    }
  };

  const handleGenerarMes = async (mesNumero) => {
    setGenerandoMes(mesNumero);
    setErrorDesafios('');
    setExitoDesafios('');
    try {
      const res = await fetch(
        `/api/challenges/admin/generate-month?year=${desafiosAnio}&month=${mesNumero}&game_id=${desafiosJuego}`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
        }
      );
      if (res.ok) {
        const data = await res.json();
        setExitoDesafios(`¡Mes de ${data.month_name || mesNumero} generado con éxito (${data.generated_count || 30} desafíos)!`);
        await cargarEstadoDesafios(desafiosAnio, desafiosJuego);
        showToast(`Desafíos de ${data.month_name || 'mes'} generados correctamente.`);
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorDesafios(data.detail || data.message || 'Error al generar los desafíos del mes.');
      }
    } catch (e) {
      console.error(e);
      setErrorDesafios('Error de conexión al generar mes.');
    } finally {
      setGenerandoMes(null);
    }
  };

  useEffect(() => {
    const sesion = localStorage.getItem(OPERADOR_STORAGE_KEY);
    if (!sesion) {
      navigate('/login');
      return;
    }
    try {
      const parsed = JSON.parse(sesion);
      setOperadorInfo(parsed);
    } catch {
      localStorage.removeItem(OPERADOR_STORAGE_KEY);
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (seccionActiva === 'desafios') {
      cargarEstadoDesafios(desafiosAnio, desafiosJuego);
    }
  }, [seccionActiva, desafiosAnio, desafiosJuego]);

  const handleLogout = () => {
    localStorage.removeItem(OPERADOR_STORAGE_KEY);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Toast Flotante */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2 animate-bounce">
          <CheckIcon size={16} className="text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* HEADER PRINCIPAL */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#002B5E] to-blue-600 flex items-center justify-center text-white shadow-md">
              <ShieldIcon size={20} />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 leading-tight">
                Torre de Control · Gestión de Juegos
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Configuración del Juego Narrativo y Generación de Desafíos Diarios
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Aviso informativo de Usuarios */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-[11px] text-slate-600 font-medium border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Usuarios centralizados en <strong>Autenticador</strong></span>
            </div>

            <div className="text-right hidden sm:block border-l border-slate-200 pl-3">
              <p className="text-xs font-bold text-slate-800 leading-tight">{operadorInfo.user}</p>
              <p className="text-[10px] text-slate-500 font-medium">{operadorInfo.email || 'Operador Autorizado'}</p>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOutIcon size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* SUB-HEADER CON PESTAÑAS DE GESTIÓN */}
      <div className="bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2 py-2">
            <button
              onClick={() => {
                setSeccionActiva('narrative');
                setModalNarrativoAbierto(true);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                seccionActiva === 'narrative'
                  ? 'bg-[#002B5E] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <BookOpenIcon size={16} />
              <span>Juego Narrativo (Corte Real)</span>
            </button>

            <button
              onClick={() => setSeccionActiva('desafios')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                seccionActiva === 'desafios'
                  ? 'bg-[#002B5E] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <CalendarIcon size={16} />
              <span>Desafíos Diarios</span>
            </button>
          </div>

          {seccionActiva === 'narrative' && !modalNarrativoAbierto && (
            <button
              onClick={() => setModalNarrativoAbierto(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition shadow-xs cursor-pointer"
            >
              <BookOpenIcon size={14} />
              <span>Abrir Editor Narrativo</span>
            </button>
          )}
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {seccionActiva === 'narrative' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 mx-auto flex items-center justify-center mb-4 border border-amber-200">
              <BookOpenIcon size={32} />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2">
              Suite de Configuración — Crónicas de la Corte Real
            </h2>
            <p className="text-sm text-slate-600 max-w-xl mx-auto mb-6">
              Edita universos, personajes, cartas, desenlaces, eventos interactivos, árboles de diálogo y genera los desafíos narrativos del mes.
            </p>
            <button
              onClick={() => setModalNarrativoAbierto(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#002B5E] text-white font-bold text-sm shadow-md hover:bg-slate-900 transition cursor-pointer"
            >
              <BookOpenIcon size={18} />
              <span>Abrir Editor Narrativo (7 Módulos ABM)</span>
            </button>
          </div>
        )}

        {seccionActiva === 'desafios' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <CalendarIcon size={18} className="text-[#002B5E]" />
                  <span>Cobertura y Generación de Desafíos Mensuales</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Genera tableros diarios con semillas deterministas para cada mes del año.
                </p>
              </div>

              {/* Selector de Juego y Año */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setDesafiosJuego('sudoku')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      desafiosJuego === 'sudoku'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Sudoku
                  </button>
                  <button
                    type="button"
                    onClick={() => setDesafiosJuego('wordle')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      desafiosJuego === 'wordle'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Wordle
                  </button>
                  <button
                    type="button"
                    onClick={() => setDesafiosJuego('sopa_letras')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      desafiosJuego === 'sopa_letras'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Sopa de Letras
                  </button>
                  <button
                    type="button"
                    onClick={() => setDesafiosJuego('crucigrama')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      desafiosJuego === 'crucigrama'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Crucigrama
                  </button>
                </div>

                <select
                  value={desafiosAnio}
                  onChange={(e) => {
                    const anio = parseInt(e.target.value, 10);
                    setDesafiosAnio(anio);
                    cargarEstadoDesafios(anio, desafiosJuego);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <option value={2025}>Año 2025</option>
                  <option value={2026}>Año 2026</option>
                  <option value={2027}>Año 2027</option>
                </select>

                <button
                  type="button"
                  onClick={() => cargarEstadoDesafios(desafiosAnio, desafiosJuego)}
                  disabled={cargandoDesafios}
                  className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                  title="Refrescar cobertura"
                >
                  <RefreshIcon size={16} className={cargandoDesafios ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Notificaciones */}
            {errorDesafios && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangleIcon size={16} />
                <span>{errorDesafios}</span>
              </div>
            )}
            {exitoDesafios && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckIcon size={16} />
                <span>{exitoDesafios}</span>
              </div>
            )}

            {/* Grilla de Meses */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {mesesDesafios.map((mes) => {
                const estaGenerando = generandoMes === mes.month;
                return (
                  <div
                    key={mes.month}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      mes.is_complete
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : mes.status === 'partial'
                        ? 'bg-amber-50/40 border-amber-200'
                        : 'bg-slate-50/60 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-xs text-slate-800">
                        {mes.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          mes.is_complete
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : mes.status === 'partial'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-slate-100 text-slate-600 border-slate-300'
                        }`}
                      >
                        {mes.total_challenges} / {mes.expected_days}
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-3">
                      <div
                        className={`h-full transition-all duration-300 ${
                          mes.is_complete ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(
                              ((mes.total_challenges || 0) /
                                (mes.expected_days || 30)) *
                                100
                            )
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-medium">
                        {mes.is_complete ? 'Completo' : mes.status === 'partial' ? 'Incompleto' : 'Sin generar'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleGenerarMes(mes.month)}
                        disabled={estaGenerando || generandoMes !== null}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold transition shadow-xs cursor-pointer ${
                          estaGenerando
                            ? 'bg-slate-200 text-slate-500 cursor-wait'
                            : mes.is_complete
                            ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                            : 'bg-[#002B5E] text-white hover:bg-slate-900'
                        }`}
                      >
                        {estaGenerando
                          ? 'Generando...'
                          : mes.is_complete
                          ? 'Regenerar'
                          : 'Generar Mes'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* MODAL JUEGO NARRATIVO */}
      <NarrativeAdminModal
        abierto={modalNarrativoAbierto}
        onCerrar={() => setModalNarrativoAbierto(false)}
      />
    </div>
  );
}
