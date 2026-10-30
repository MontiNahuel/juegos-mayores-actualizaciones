import { useState, useEffect } from 'react';
import {
  CalendarIcon,
  XIcon,
  RefreshIcon,
  CheckIcon,
  AlertTriangleIcon,
  LayersIcon,
} from './Icons';
import ModalDisenadorCrucigrama from './ModalDisenadorCrucigrama';
import { OPERADOR_STORAGE_KEY } from './LoginSistemas';

export default function ModalDesafios({ abierto, onCerrar }) {
  const [modalDisenadorAbierto, setModalDisenadorAbierto] = useState(false);
  const [desafiosJuego, setDesafiosJuego] = useState('sudoku');
  const [desafiosAnio, setDesafiosAnio] = useState(2026);
  const [mesesDesafios, setMesesDesafios] = useState([]);
  const [cargandoDesafios, setCargandoDesafios] = useState(false);
  const [generandoMes, setGenerandoMes] = useState(null);
  const [errorDesafios, setErrorDesafios] = useState('');
  const [exitoDesafios, setExitoDesafios] = useState('');

  const getAuthHeaders = () => {
    const sesion = localStorage.getItem(OPERADOR_STORAGE_KEY);
    const token = sesion ? JSON.parse(sesion)?.token : null;
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
    } catch {
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
      const data = await res.json();
      if (res.ok && data.success) {
        setExitoDesafios(`¡Mes de ${data.month_name || mesNumero} generado con éxito (${data.generated_count || 0} desafíos)!`);
        await cargarEstadoDesafios(desafiosAnio, desafiosJuego);
      } else {
        setErrorDesafios(data.detail || data.message || 'Error al generar los desafíos del mes.');
      }
    } catch {
      setErrorDesafios('Error de conexión al generar mes.');
    } finally {
      setGenerandoMes(null);
    }
  };

  useEffect(() => {
    if (abierto) {
      cargarEstadoDesafios(desafiosAnio, desafiosJuego);
    }
  }, [abierto]);

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-700/80 max-h-[90vh] flex flex-col text-slate-100 animate-scale-in">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-xs">
              <CalendarIcon size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-100 leading-tight">
                Cobertura de Desafíos Diarios
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Auditoría y generación automática de puzzles mensuales
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            <XIcon size={16} />
          </button>
        </div>

        {/* Selector de Juego y Año */}
        <div className="py-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setDesafiosJuego('sudoku');
                cargarEstadoDesafios(desafiosAnio, 'sudoku');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                desafiosJuego === 'sudoku'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              🧩 Sudoku
            </button>
            <button
              type="button"
              onClick={() => {
                setDesafiosJuego('wordle');
                cargarEstadoDesafios(desafiosAnio, 'wordle');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                desafiosJuego === 'wordle'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              📝 Palabra del Día
            </button>
            <button
              type="button"
              onClick={() => {
                setDesafiosJuego('sopa_letras');
                cargarEstadoDesafios(desafiosAnio, 'sopa_letras');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                desafiosJuego === 'sopa_letras'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              🔍 Sopa de Letras
            </button>
            <button
              type="button"
              onClick={() => {
                setDesafiosJuego('crucigrama');
                cargarEstadoDesafios(desafiosAnio, 'crucigrama');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                desafiosJuego === 'crucigrama'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              📰 Crucigrama
            </button>
          </div>

          <div className="flex items-center gap-2">
            {desafiosJuego === 'crucigrama' && (
              <button
                type="button"
                onClick={() => setModalDisenadorAbierto(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 text-xs font-bold transition cursor-pointer"
                title="Diseñar máscaras de tableros 7x7 y 11x11"
              >
                <LayersIcon size={14} />
                Diseñar máscaras
              </button>
            )}

            <select
              value={desafiosAnio}
              onChange={(e) => {
                const anio = parseInt(e.target.value, 10);
                setDesafiosAnio(anio);
                cargarEstadoDesafios(anio, desafiosJuego);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value={2026}>Año 2026</option>
              <option value={2027}>Año 2027</option>
            </select>

            <button
              type="button"
              onClick={() => cargarEstadoDesafios(desafiosAnio, desafiosJuego)}
              disabled={cargandoDesafios}
              className="p-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              title="Refrescar cobertura"
            >
              <RefreshIcon size={16} className={cargandoDesafios ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Notificaciones */}
        {errorDesafios && (
          <div className="mt-3 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertTriangleIcon size={16} />
            <span>{errorDesafios}</span>
          </div>
        )}
        {exitoDesafios && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckIcon size={16} />
            <span>{exitoDesafios}</span>
          </div>
        )}

        {/* Grilla de los 12 Meses */}
        <div className="flex-1 overflow-y-auto py-4">
          {cargandoDesafios ? (
            <div className="py-12 text-center text-slate-400 text-xs font-semibold">
              Cargando estado de cobertura...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {mesesDesafios.map((mes) => {
                const estaGenerando = generandoMes === mes.month;

                return (
                  <div
                    key={mes.month}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      mes.is_complete
                        ? 'bg-emerald-950/20 border-emerald-500/30'
                        : mes.status === 'partial'
                        ? 'bg-amber-950/20 border-amber-500/30'
                        : 'bg-slate-800/40 border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-xs text-slate-200">
                        {mes.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          mes.is_complete
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : mes.status === 'partial'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-slate-700 text-slate-400 border-slate-600'
                        }`}
                      >
                        {mes.is_complete
                          ? `✓ ${mes.generated_count}/${mes.days_in_month}`
                          : `${mes.generated_count}/${mes.days_in_month} días`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-700/50">
                      <span className="text-[11px] text-slate-400">
                        {mes.is_complete ? 'Listo para jugar' : 'Sin publicar'}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleGenerarMes(mes.month)}
                        disabled={estaGenerando || generandoMes !== null}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold transition shadow-xs cursor-pointer ${
                          estaGenerando
                            ? 'bg-slate-700 text-slate-400 cursor-wait'
                            : mes.is_complete
                            ? 'bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700'
                            : 'bg-amber-500 text-slate-950 font-black hover:bg-amber-400'
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
          )}
        </div>

        {/* Pie del modal */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
          <span className="text-[11px] text-slate-400 font-medium">
            {desafiosJuego === 'crucigrama'
              ? '💡 Los crucigramas se generan con Backtracking algorítmico, cruces válidos 7x7 y definiciones limpias de la RAE.'
              : desafiosJuego === 'sudoku'
              ? '💡 Los tableros de Sudoku se generan con semilla determinista garantizando solución única.'
              : desafiosJuego === 'wordle'
              ? '💡 Las palabras de Wordle se toman del banco ordenado por frecuencia real en español.'
              : '💡 Las sopas de letras se generan procedimentalmente a partir de más de 60 temas culturales.'}
          </span>
          <button
            type="button"
            onClick={onCerrar}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>

      <ModalDisenadorCrucigrama
        abierto={modalDisenadorAbierto}
        onCerrar={() => setModalDisenadorAbierto(false)}
      />
    </div>
  );
}
