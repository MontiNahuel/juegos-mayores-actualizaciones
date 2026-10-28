import { useState, useEffect } from 'react';
import {
  CalendarIcon,
  RefreshIcon,
  CheckIcon,
  AlertTriangleIcon,
  SparklesIcon,
  CrownIcon,
  ClockIcon,
  XIcon,
} from '../Icons';

export default function CalendarioTab({ universos = [] }) {
  const anioActual = new Date().getFullYear();
  const [anio, setAnio] = useState(anioActual);
  const [universoId, setUniversoId] = useState('corte_medieval');
  const [meses, setMeses] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [generandoMes, setGenerandoMes] = useState(null);
  const [generandoTodo, setGenerandoTodo] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  // Sincronizar universo por defecto si cambia la lista
  useEffect(() => {
    if (universos.length > 0 && !universos.some((u) => (u._id || u.id) === universoId)) {
      setUniversoId(universos[0]._id || universos[0].id);
    }
  }, [universos]);

  // Cargar estado de desafíos del año
  const cargarEstadoCalendario = async (targetAnio = anio) => {
    setCargando(true);
    setError('');
    try {
      const res = await fetch(`/api/challenges/admin/status?year=${targetAnio}&game_id=narrativo`);
      if (res.ok) {
        const data = await res.json();
        setMeses(data.months || []);
      } else {
        setError('No se pudo cargar el estado del calendario de desafíos.');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión al cargar calendario.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEstadoCalendario(anio);
  }, [anio]);

  // Generar un solo mes
  const handleGenerarMes = async (numMes, nombreMes) => {
    setGenerandoMes(numMes);
    setError('');
    setExito('');
    try {
      const res = await fetch(
        `/api/narrative/admin/generar-mes?year=${anio}&month=${numMes}&universo_id=${encodeURIComponent(
          universoId
        )}`,
        {
          method: 'POST',
        }
      );

      if (res.ok) {
        const data = await res.json();
        setExito(
          `¡Mes de ${nombreMes || numMes} (${anio}) generado exitosamente con ${
            data.desafios_creados
          } desafíos diarios!`
        );
        await cargarEstadoCalendario(anio);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.detail || 'Error al generar los desafíos del mes.');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión al generar mes.');
    } finally {
      setGenerandoMes(null);
    }
  };

  // Generar todo el año (los 12 meses)
  const handleGenerarTodoElAnio = async () => {
    if (
      !window.confirm(
        `¿Desea generar los desafíos de todo el año ${anio} para el universo "${universoId}"? Esta operación puede demorar unos segundos.`
      )
    ) {
      return;
    }

    setGenerandoTodo(true);
    setError('');
    setExito('');
    let exitosos = 0;

    try {
      for (let m = 1; m <= 12; m++) {
        setGenerandoMes(m);
        const res = await fetch(
          `/api/narrative/admin/generar-mes?year=${anio}&month=${m}&universo_id=${encodeURIComponent(
            universoId
          )}`,
          {
            method: 'POST',
          }
        );
        if (res.ok) {
          exitosos++;
        }
      }

      setExito(`¡Año ${anio} generado con éxito (${exitosos}/12 meses procesados)!`);
      await cargarEstadoCalendario(anio);
    } catch (err) {
      console.error(err);
      setError('Ocurrió un error durante la generación del año completo.');
    } finally {
      setGenerandoMes(null);
      setGenerandoTodo(false);
    }
  };

  // Métricas calculadas
  const totalGenerados = meses.reduce((acc, m) => acc + (m.generated_count || 0), 0);
  const totalDias = meses.reduce((acc, m) => acc + (m.days_in_month || 0), 0);
  const mesesCompletos = meses.filter((m) => m.is_complete).length;
  const porcentajeGlobal = totalDias > 0 ? Math.round((totalGenerados / totalDias) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Barra de Controles y Filtros */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de Universo Temático */}
          <div className="flex items-center gap-2">
            <CrownIcon size={16} className="text-[#002B5E]" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Universo:</span>
            <select
              value={universoId}
              onChange={(e) => setUniversoId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#002B5E]/20"
            >
              {universos.map((u) => (
                <option key={u._id || u.id} value={u._id || u.id}>
                  {u.nombre} ({u._id || u.id})
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Año */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {[anioActual - 1, anioActual, anioActual + 1, anioActual + 2].map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => setAnio(yr)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  anio === yr
                    ? 'bg-[#002B5E] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => cargarEstadoCalendario(anio)}
            title="Refrescar calendario"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <RefreshIcon size={16} />
          </button>
        </div>

        {/* Botón de Generar Todo el Año */}
        <button
          type="button"
          onClick={handleGenerarTodoElAnio}
          disabled={generandoTodo || generandoMes !== null}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#002B5E] to-indigo-900 text-white font-bold text-xs shadow-xs hover:from-[#001D40] hover:to-indigo-950 transition disabled:opacity-50 cursor-pointer"
        >
          <SparklesIcon size={16} />
          <span>
            {generandoTodo
              ? `Generando mes ${generandoMes}...`
              : `Generar Año Completo (${anio})`}
          </span>
        </button>
      </div>

      {/* Alertas */}
      {exito && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckIcon size={16} className="text-emerald-600" />
            <span>{exito}</span>
          </div>
          <button onClick={() => setExito('')} className="text-emerald-600 hover:text-emerald-800 cursor-pointer">
            <XIcon size={14} />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangleIcon size={16} className="text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-600 hover:text-rose-800 cursor-pointer">
            <XIcon size={14} />
          </button>
        </div>
      )}

      {/* Tarjetas de Métricas del Año */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
            <CalendarIcon size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Desafíos Generados ({anio})
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-black text-slate-900">{totalGenerados}</span>
              <span className="text-xs font-semibold text-slate-400">/ {totalDias} días</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
            <CheckIcon size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Meses Completos
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-black text-slate-900">{mesesCompletos}</span>
              <span className="text-xs font-semibold text-slate-400">/ 12 meses</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
            <SparklesIcon size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Progreso Anual
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-black text-slate-900">{porcentajeGlobal}%</span>
              <span className="text-xs font-semibold text-slate-400">cobertura</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de los 12 Meses del Año */}
      {cargando ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center text-slate-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-[#002B5E] mb-3" />
          <p className="text-xs font-semibold">Cargando estado mensual del calendario...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {meses.map((m) => {
            const porcentajeMes =
              m.days_in_month > 0
                ? Math.round((m.generated_count / m.days_in_month) * 100)
                : 0;
            const estaGenerando = generandoMes === m.month;

            return (
              <div
                key={m.month}
                className={`bg-white rounded-2xl border p-5 shadow-xs transition flex flex-col justify-between ${
                  m.is_complete
                    ? 'border-emerald-200/90'
                    : m.generated_count > 0
                    ? 'border-amber-200/90'
                    : 'border-slate-200/90'
                }`}
              >
                <div>
                  {/* Cabecera del Mes */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-black text-slate-900">{m.name}</span>
                    {m.is_complete ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <CheckIcon size={11} /> Listo
                      </span>
                    ) : m.generated_count > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                        <ClockIcon size={11} /> Parcial
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        Pendiente
                      </span>
                    )}
                  </div>

                  {/* Conteo de Días y Barra */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Desafíos listos:</span>
                      <span className="font-bold text-slate-800">
                        {m.generated_count} / {m.days_in_month} días
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          m.is_complete
                            ? 'bg-emerald-500'
                            : m.generated_count > 0
                            ? 'bg-amber-500'
                            : 'bg-transparent'
                        }`}
                        style={{ width: `${porcentajeMes}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Botón de Acción */}
                <button
                  type="button"
                  onClick={() => handleGenerarMes(m.month, m.name)}
                  disabled={estaGenerando || generandoTodo}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs ${
                    m.is_complete
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      : 'bg-[#002B5E] hover:bg-[#001D40] text-white'
                  } disabled:opacity-50`}
                >
                  {estaGenerando ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-current border-t-transparent" />
                      <span>Generando...</span>
                    </>
                  ) : m.is_complete ? (
                    <>
                      <RefreshIcon size={13} />
                      <span>Regenerar Mes</span>
                    </>
                  ) : (
                    <>
                      <SparklesIcon size={13} />
                      <span>Generar Mes ({m.days_in_month} días)</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Nota Explicativa */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed flex items-start gap-3">
        <SparklesIcon size={18} className="text-[#002B5E] flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-800 block mb-0.5">
            ¿Cómo funciona el Generador Diario para el Juego Narrativo?
          </strong>
          Cada día del calendario generado crea un desafío diario oficial en la colección{' '}
          <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[11px] font-mono text-slate-800">
            daily_challenges
          </code>{' '}
          (identificado por fecha <code className="text-slate-800">YYYY-MM-DD</code> y{' '}
          <code className="text-slate-800">game_id: 'narrativo'</code>). Al generarse, el sistema sortea 5 personajes iniciales de corte, 5 cartas iniciales de apoyo y vincula el pool completo de eventos mensuales, cartas de rotación y diálogos del universo seleccionado.
        </div>
      </div>
    </div>
  );
}
