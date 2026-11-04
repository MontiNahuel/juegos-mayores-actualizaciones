/* Permite editar precios, paquetes y puntos de los juegos. */
import { useState, useEffect } from 'react';
import {
  CoinsIcon,
  HeartIcon,
  XIcon,
  CheckIcon,
  AlertTriangleIcon,
  PlusIcon,
  TrashIcon,
  RefreshIcon,
} from './Icons';
import { OPERADOR_STORAGE_KEY } from './authService';

const JUEGOS_DEFAULT = [
  { id: 'wordle', nombre: 'Wordle', defaultPts: 50, emoji: '🟩' },
  { id: 'sopa_letras', nombre: 'Sopa de Letras', defaultPts: 50, emoji: '🔍' },
  { id: 'sudoku', nombre: 'Sudoku', defaultPts: 60, emoji: '🔢' },
  { id: 'crucigrama', nombre: 'Crucigrama', defaultPts: 70, emoji: '✏️' },
  { id: 'narrativo', nombre: 'Juego Narrativo (Crónicas)', defaultPts: 80, emoji: '👑' },
];

const CALIFICACIONES_CONFIG = [
  { id: 'S', nombre: 'Excelente / Impecable', estrellas: '3 ⭐', badge: 'bg-amber-100 text-amber-900 border-amber-300', emoji: '🏆', desc: 'Mínimos intentos o sin errores', defaultPts: 100 },
  { id: 'A', nombre: 'Muy Bueno', estrellas: '3 ⭐', badge: 'bg-emerald-100 text-emerald-900 border-emerald-300', emoji: '⭐', desc: 'Desempeño destacado', defaultPts: 90 },
  { id: 'B', nombre: 'Bueno', estrellas: '2 ⭐', badge: 'bg-blue-100 text-blue-900 border-blue-300', emoji: '✨', desc: 'Desempeño estándar', defaultPts: 75 },
  { id: 'C', nombre: 'Aprobado', estrellas: '1 ⭐', badge: 'bg-slate-100 text-slate-800 border-slate-300', emoji: '👍', desc: 'Al límite de vidas/intentos', defaultPts: 50 },
  { id: 'F', nombre: 'Derrota / Fallido', estrellas: '0 ⭐', badge: 'bg-rose-100 text-rose-900 border-rose-300', emoji: '❌', desc: 'Sin vidas restantes', defaultPts: 0 },
];

const JUEGOS_CRONOMETRADOS = [
  { id: 'sudoku', nombre: 'Sudoku', emoji: '🔢', badge: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  { id: 'crucigrama', nombre: 'Crucigrama', emoji: '📝', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { id: 'sopa_letras', nombre: 'Sopa de Letras', emoji: '🔍', badge: 'bg-amber-50 text-amber-800 border-amber-200' },
];

const DEFAULT_ESCALAS_TIEMPO_FRONT = {
  sudoku: [
    { grade: 'S', tiempo_max_segundos: 180, puntos: 100, estrellas: 3, titulo: '¡Impecable!', descripcion: 'Menos de 03:00' },
    { grade: 'A', tiempo_max_segundos: 300, puntos: 90, estrellas: 3, titulo: '¡Excelente!', descripcion: '03:01 a 05:00' },
    { grade: 'B', tiempo_max_segundos: 480, puntos: 75, estrellas: 2, titulo: '¡Muy Bueno!', descripcion: '05:01 a 08:00' },
    { grade: 'C', tiempo_max_segundos: 720, puntos: 50, estrellas: 1, titulo: '¡Buen Trabajo!', descripcion: '08:01 a 12:00' },
    { grade: 'D', tiempo_max_segundos: 999999, puntos: 25, estrellas: 1, titulo: '¡Completado!', descripcion: 'Más de 12:00' },
  ],
  crucigrama: [
    { grade: 'S', tiempo_max_segundos: 240, puntos: 100, estrellas: 3, titulo: '¡Impecable!', descripcion: 'Menos de 04:00' },
    { grade: 'A', tiempo_max_segundos: 420, puntos: 90, estrellas: 3, titulo: '¡Excelente!', descripcion: '04:01 a 07:00' },
    { grade: 'B', tiempo_max_segundos: 600, puntos: 75, estrellas: 2, titulo: '¡Muy Bueno!', descripcion: '07:01 a 10:00' },
    { grade: 'C', tiempo_max_segundos: 900, puntos: 50, estrellas: 1, titulo: '¡Buen Trabajo!', descripcion: '10:01 a 15:00' },
    { grade: 'D', tiempo_max_segundos: 999999, puntos: 25, estrellas: 1, titulo: '¡Completado!', descripcion: 'Más de 15:00' },
  ],
  sopa_letras: [
    { grade: 'S', tiempo_max_segundos: 120, puntos: 100, estrellas: 3, titulo: '¡Impecable!', descripcion: 'Menos de 02:00' },
    { grade: 'A', tiempo_max_segundos: 240, puntos: 90, estrellas: 3, titulo: '¡Excelente!', descripcion: '02:01 a 04:00' },
    { grade: 'B', tiempo_max_segundos: 360, puntos: 75, estrellas: 2, titulo: '¡Muy Bueno!', descripcion: '04:01 a 06:00' },
    { grade: 'C', tiempo_max_segundos: 600, puntos: 50, estrellas: 1, titulo: '¡Buen Trabajo!', descripcion: '06:01 a 10:00' },
    { grade: 'D', tiempo_max_segundos: 999999, puntos: 25, estrellas: 1, titulo: '¡Completado!', descripcion: 'Más de 10:00' },
  ],
};

const secToMMSS = (sec) => {
  if (!sec || sec >= 999990) return 'Sin límite';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const mmssToSec = (str) => {
  if (!str || str.toLowerCase().includes('sin') || str.toLowerCase().includes('limite')) return 999999;
  const parts = str.split(':');
  if (parts.length === 2) {
    return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
  }
  return parseInt(str, 10) || 0;
};

// Permite editar precios, paquetes y puntos de los juegos.
export default function ModalEconomia({ abierto, onCerrar, onGuardadoExitoso, embebido = false }) {
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [exitoMsg, setExitoMsg] = useState('');

  // Estados de configuración
  const [vidasIniciales, setVidasIniciales] = useState(5);
  const [costoVidaPuntos, setCostoVidaPuntos] = useState(50);
  const [costoDesbloqueoDia, setCostoDesbloqueoDia] = useState(100);
  const [vidasMaximas, setVidasMaximas] = useState('');
  const [costoPistaPuntos, setCostoPistaPuntos] = useState(20);
  const [puntosPorCalificacion, setPuntosPorCalificacion] = useState({
    S: 100,
    A: 90,
    B: 75,
    C: 50,
    F: 0,
  });
  const [juegoTiempoTab, setJuegoTiempoTab] = useState('sudoku');
  const [escalasTiempoPorJuego, setEscalasTiempoPorJuego] = useState(DEFAULT_ESCALAS_TIEMPO_FRONT);
  const [puntosPorJuego, setPuntosPorJuego] = useState({
    wordle: 50,
    sopa_letras: 50,
    sudoku: 60,
    crucigrama: 70,
    narrativo: 80,
  });
  const [paquetesTienda, setPaquetesTienda] = useState([]);

  // Arma las cabeceras con la sesión para consultar el panel.
  const getAuthHeaders = () => {
    const sesion = localStorage.getItem(OPERADOR_STORAGE_KEY);
    const token = sesion ? JSON.parse(sesion)?.token : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  // Carga configuracion con los datos de este paso.
  const cargarConfiguracion = async () => {
    setCargando(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/economy/config', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setVidasIniciales(data.vidas_iniciales ?? 5);
        setCostoVidaPuntos(data.costo_vida_puntos ?? 50);
        setCostoDesbloqueoDia(data.costo_desbloqueo_dia_puntos ?? 100);
        setCostoPistaPuntos(data.costo_pista_puntos ?? 20);
        if (data.puntos_por_calificacion) {
          setPuntosPorCalificacion({
            S: data.puntos_por_calificacion.S ?? 100,
            A: data.puntos_por_calificacion.A ?? 90,
            B: data.puntos_por_calificacion.B ?? 75,
            C: data.puntos_por_calificacion.C ?? 50,
            F: data.puntos_por_calificacion.F ?? 0,
          });
        }
        if (data.escalas_tiempo_por_juego) {
          setEscalasTiempoPorJuego(data.escalas_tiempo_por_juego);
        }
        setVidasMaximas(data.vidas_maximas != null ? String(data.vidas_maximas) : '');
        setPuntosPorJuego(
          data.puntos_por_juego || {
            wordle: 50,
            sopa_letras: 50,
            sudoku: 60,
            crucigrama: 70,
            narrativo: 80,
          }
        );
        setPaquetesTienda(data.paquetes_tienda || []);
      } else {
        const err = await res.json().catch(/* Maneja el fallo de esta operación. */ () => ({}));
        setErrorMsg(err.detail || 'No se pudo cargar la configuración de economía.');
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Error al conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(/* Sincroniza este efecto cuando cambian los datos de los que depende. */ () => {
    if (abierto) {
      cargarConfiguracion();
      setErrorMsg('');
      setExitoMsg('');
    }
  }, [abierto]);

  if (!abierto) return null;

  // Actualiza los puntos configurados para una calificación (S, A, B, C, F)
  const handlePuntosCalificacionChange = (grade, valor) => {
    const num = Math.max(0, parseInt(valor, 10) || 0);
    setPuntosPorCalificacion((prev) => ({
      ...prev,
      [grade]: num,
    }));
  };

  // Manejadores para Calificación por Tiempo (Sin Vidas)
  const handleEscalaFieldChange = (gameId, index, field, value) => {
    setEscalasTiempoPorJuego((prev) => {
      const list = [...(prev[gameId] || [])];
      if (!list[index]) return prev;
      let finalVal = value;
      if (field === 'tiempo_max_segundos') {
        finalVal = mmssToSec(value);
      } else if (field === 'puntos' || field === 'estrellas') {
        finalVal = Math.max(0, parseInt(value, 10) || 0);
      }
      list[index] = { ...list[index], [field]: finalVal };
      return { ...prev, [gameId]: list };
    });
  };

  const handleAgregarEscala = (gameId) => {
    setEscalasTiempoPorJuego((prev) => {
      const list = [...(prev[gameId] || [])];
      const nueva = {
        grade: 'NUEVA',
        tiempo_max_segundos: 600,
        puntos: 40,
        estrellas: 1,
        titulo: '¡Buen intento!',
        descripcion: 'Tiempo adicional',
      };
      return { ...prev, [gameId]: [...list, nueva] };
    });
  };

  const handleEliminarEscala = (gameId, index) => {
    setEscalasTiempoPorJuego((prev) => {
      const list = [...(prev[gameId] || [])];
      list.splice(index, 1);
      return { ...prev, [gameId]: list };
    });
  };

  // Actualiza los puntos que entrega el juego al completarlo.
  const handlePuntosJuegoChange = (juegoId, valor) => {
    const num = Math.max(0, parseInt(valor, 10) || 0);
    setPuntosPorJuego(/* Actualiza puntos por juego a partir del valor anterior. */ (prev) => ({
      ...prev,
      [juegoId]: num,
    }));
  };

  // Actualiza el campo editado de un paquete de vidas.
  const handlePaqueteChange = (index, campo, valor) => {
    setPaquetesTienda(/* Actualiza paquetes tienda a partir del valor anterior. */ (prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [campo]: valor };
      return copy;
    });
  };

  // Quita paquete con los datos de este paso.
  const handleEliminarPaquete = (index) => {
    setPaquetesTienda(/* Actualiza paquetes tienda a partir del valor anterior. */ (prev) => prev.filter(/* Conserva los elementos que cumplen esta condición. */ (_, i) => i !== index));
  };

  // Agrega paquete con los datos de este paso.
  const handleAgregarPaquete = () => {
    const nuevoId = `pack_${paquetesTienda.length + 1}`;
    setPaquetesTienda(/* Actualiza paquetes tienda a partir del valor anterior. */ (prev) => [
      ...prev,
      {
        id: nuevoId,
        vidas: 1,
        puntos: costoVidaPuntos,
        popular: false,
        badge: '',
        descuento: '',
      },
    ]);
  };

  // Valida el formulario y guarda los cambios.
  const handleGuardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setErrorMsg('');
    setExitoMsg('');

    try {
      const payload = {
        vidas_iniciales: Math.max(1, parseInt(vidasIniciales, 10) || 5),
        costo_vida_puntos: Math.max(1, parseInt(costoVidaPuntos, 10) || 50),
        costo_desbloqueo_dia_puntos: Math.max(0, parseInt(costoDesbloqueoDia, 10) || 100),
        costo_pista_puntos: Math.max(0, parseInt(costoPistaPuntos, 10) || 20),
        puntos_por_calificacion: {
          S: Math.max(0, parseInt(puntosPorCalificacion.S, 10) || 0),
          A: Math.max(0, parseInt(puntosPorCalificacion.A, 10) || 0),
          B: Math.max(0, parseInt(puntosPorCalificacion.B, 10) || 0),
          C: Math.max(0, parseInt(puntosPorCalificacion.C, 10) || 0),
          F: Math.max(0, parseInt(puntosPorCalificacion.F, 10) || 0),
        },
        escalas_tiempo_por_juego: escalasTiempoPorJuego,
        puntos_por_juego: puntosPorJuego,
        paquetes_tienda: paquetesTienda.map(/* Prepara el resultado de cada elemento. */ (p, idx) => ({
          id: p.id || `pack_${idx + 1}`,
          vidas: Math.max(1, parseInt(p.vidas, 10) || 1),
          puntos: Math.max(1, parseInt(p.puntos, 10) || 1),
          popular: Boolean(p.popular),
          badge: p.badge ? p.badge.trim() : null,
          descuento: p.descuento ? p.descuento.trim() : null,
        })),
        vidas_maximas: vidasMaximas.trim() ? parseInt(vidasMaximas, 10) : null,
      };

      const res = await fetch('/api/admin/economy/config', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setExitoMsg('¡Configuración de economía y vidas guardada exitosamente!');
        if (onGuardadoExitoso) onGuardadoExitoso(data);
        setTimeout(/* Ejecuta este paso cuando se cumple la espera. */ () => setExitoMsg(''), 4000);
      } else {
        const err = await res.json().catch(/* Maneja el fallo de esta operación. */ () => ({}));
        setErrorMsg(err.detail || 'No se pudo guardar la configuración.');
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Error al guardar la configuración.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      className={
        embebido
          ? 'w-full'
          : 'fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden'
      }
    >
      <div
        className={
          embebido
            ? 'bg-white rounded-2xl border border-white/10 shadow-xl w-full flex flex-col overflow-hidden'
            : 'bg-white rounded-3xl border border-slate-200/80 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150'
        }
      >
        
        {/* Cabecera del Modal */}
        {!embebido && (
          <header className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-700 flex items-center justify-center border border-amber-300/40 shadow-xs">
                <CoinsIcon size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900 leading-tight">
                    Configuración Global de Economía & Vidas
                  </h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <HeartIcon size={11} className="text-rose-500 fill-rose-500" />
                    Vidas & Puntos
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Gestioná las vidas de nuevos usuarios, la tasa de canje en la mini-tienda y las recompensas por juego
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onCerrar}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
              title="Cerrar ventana"
            >
              <XIcon size={20} />
            </button>
          </header>
        )}

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cargando ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <RefreshIcon size={28} className="animate-spin text-slate-400" />
              <p className="text-xs font-semibold text-slate-500">Cargando configuración de economía...</p>
            </div>
          ) : (
            <form id="form-economia" onSubmit={handleGuardar} className="space-y-6">
              
              {/* Alertas */}
              {errorMsg && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs text-rose-800 font-medium animate-in fade-in">
                  <AlertTriangleIcon size={16} className="text-rose-600 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              {exitoMsg && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 font-medium animate-in fade-in">
                  <CheckIcon size={16} className="text-emerald-600 flex-shrink-0" />
                  <span>{exitoMsg}</span>
                </div>
              )}

              {/* SECCIÓN 1: Vidas Iniciales y Costo Base */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5 space-y-4">
                <div className="flex items-center gap-2">
                  <HeartIcon size={18} className="text-rose-500 fill-rose-500" />
                  <h3 className="text-sm font-bold text-slate-800">
                    1. Vidas Iniciales y Costo Base
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Vidas Iniciales por Cuenta
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={vidasIniciales}
                      onChange={/* Responde a change desde este control. */ (e) => setVidasIniciales(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#002B5E] focus:outline-hidden font-semibold text-slate-900"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Vidas con las que arranca un usuario nuevo o invitado.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Costo Base de 1 Vida (Puntos)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={costoVidaPuntos}
                      onChange={/* Responde a change desde este control. */ (e) => setCostoVidaPuntos(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#002B5E] focus:outline-hidden font-semibold text-slate-900"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Precio de referencia por vida en la mini-tienda.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tope Máximo de Vidas (Opcional)
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Sin límite"
                      value={vidasMaximas}
                      onChange={/* Responde a change desde este control. */ (e) => setVidasMaximas(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#002B5E] focus:outline-hidden font-semibold text-slate-900"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Dejar vacío si las vidas pueden acumularse sin límite.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Costo Desbloqueo Día (Pts)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={costoDesbloqueoDia}
                      onChange={/* Responde a change desde este control. */ (e) => setCostoDesbloqueoDia(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#002B5E] focus:outline-hidden font-semibold text-slate-900"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Puntos para desbloquear días anteriores (Suscripción Básica).
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Costo por Pista (Pts)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={costoPistaPuntos}
                      onChange={(e) => setCostoPistaPuntos(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#002B5E] focus:outline-hidden font-semibold text-slate-900"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Puntos descontados al pedir una pista en cualquier juego.
                    </p>
                  </div>
                </div>
              </div>



              {/* SECCIÓN 2: Calificación por Tiempo (Sin Vidas en Sudoku, Crucigrama, Sopa de Letras) */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⏱️</span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">
                        2. Calificación por Tiempo (Sin Vidas) por Juego
                      </h3>
                      <p className="text-xs text-slate-500">
                        En Sudoku, Crucigrama y Sopa de Letras no hay Game Over por vidas. Los jugadores reciben su calificación y puntos según el tiempo en que completan el desafío.
                      </p>
                    </div>
                  </div>
                  <span className="self-start sm:self-auto text-[11px] font-bold text-indigo-800 bg-indigo-100 border border-indigo-300 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                    Cronómetro & Calificación
                  </span>
                </div>

                {/* Pestañas de juego */}
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  {JUEGOS_CRONOMETRADOS.map((j) => (
                    <button
                      key={j.id}
                      type="button"
                      onClick={() => setJuegoTiempoTab(j.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                        juegoTiempoTab === j.id
                          ? 'bg-[#002B5E] text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{j.emoji}</span>
                      <span>{j.nombre}</span>
                      <span className="text-[10px] opacity-75">
                        ({(escalasTiempoPorJuego[j.id] || []).length})
                      </span>
                    </button>
                  ))}
                </div>

                {/* Lista de escalas para el juego seleccionado */}
                <div className="space-y-2.5">
                  <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-500 uppercase px-2">
                    <div className="col-span-2 sm:col-span-1 text-center">Rango</div>
                    <div className="col-span-3 sm:col-span-2">Tiempo Máx (MM:SS)</div>
                    <div className="col-span-2 sm:col-span-2">Puntos (pts)</div>
                    <div className="col-span-2 sm:col-span-2">Estrellas</div>
                    <div className="col-span-3 sm:col-span-4">Título / Detalle</div>
                    <div className="col-span-2 sm:col-span-1 text-center">Acción</div>
                  </div>

                  {(escalasTiempoPorJuego[juegoTiempoTab] || []).map((escala, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs hover:border-slate-300 transition"
                    >
                      {/* Rango / Letra */}
                      <div className="col-span-2 sm:col-span-1">
                        <input
                          type="text"
                          value={escala.grade}
                          onChange={(e) => handleEscalaFieldChange(juegoTiempoTab, idx, 'grade', e.target.value.toUpperCase())}
                          className="w-full text-center px-1 py-1 text-xs font-black bg-amber-50 border border-amber-300 text-amber-900 rounded-lg focus:ring-2 focus:ring-[#002B5E] focus:outline-hidden"
                          title="Letra o código de calificación (ej: S, A, B, C, D)"
                        />
                      </div>

                      {/* Tiempo Máx */}
                      <div className="col-span-3 sm:col-span-2">
                        <input
                          type="text"
                          value={secToMMSS(escala.tiempo_max_segundos)}
                          onChange={(e) => handleEscalaFieldChange(juegoTiempoTab, idx, 'tiempo_max_segundos', e.target.value)}
                          placeholder="MM:SS o Sin límite"
                          className="w-full px-2 py-1 text-xs font-bold font-mono bg-slate-50 border border-slate-300 text-slate-800 rounded-lg focus:ring-2 focus:ring-[#002B5E] focus:outline-hidden"
                          title="Tiempo límite en minutos y segundos (ej: 03:00) o 'Sin límite'"
                        />
                      </div>

                      {/* Puntos */}
                      <div className="col-span-2 sm:col-span-2 flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          value={escala.puntos}
                          onChange={(e) => handleEscalaFieldChange(juegoTiempoTab, idx, 'puntos', e.target.value)}
                          className="w-full text-right px-2 py-1 text-xs font-black bg-slate-50 border border-slate-300 text-slate-800 rounded-lg focus:ring-2 focus:ring-[#002B5E] focus:outline-hidden"
                        />
                        <span className="text-[10px] font-bold text-amber-700">pts</span>
                      </div>

                      {/* Estrellas */}
                      <div className="col-span-2 sm:col-span-2">
                        <select
                          value={escala.estrellas ?? 3}
                          onChange={(e) => handleEscalaFieldChange(juegoTiempoTab, idx, 'estrellas', e.target.value)}
                          className="w-full px-1.5 py-1 text-xs font-bold bg-slate-50 border border-slate-300 text-slate-800 rounded-lg focus:ring-2 focus:ring-[#002B5E] focus:outline-hidden"
                        >
                          <option value="3">3 ⭐⭐⭐</option>
                          <option value="2">2 ⭐⭐</option>
                          <option value="1">1 ⭐</option>
                          <option value="0">0 ⭐</option>
                        </select>
                      </div>

                      {/* Título y Descripción */}
                      <div className="col-span-3 sm:col-span-4 flex flex-col gap-1">
                        <input
                          type="text"
                          value={escala.titulo || ''}
                          onChange={(e) => handleEscalaFieldChange(juegoTiempoTab, idx, 'titulo', e.target.value)}
                          placeholder="Título (ej: ¡Impecable!)"
                          className="w-full px-2 py-0.5 text-xs font-bold bg-slate-50 border border-slate-200 text-slate-800 rounded focus:ring-1 focus:ring-[#002B5E] focus:outline-hidden"
                        />
                        <input
                          type="text"
                          value={escala.descripcion || ''}
                          onChange={(e) => handleEscalaFieldChange(juegoTiempoTab, idx, 'descripcion', e.target.value)}
                          placeholder="Descripción (ej: Menos de 03:00)"
                          className="w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 text-slate-600 rounded focus:ring-1 focus:ring-[#002B5E] focus:outline-hidden"
                        />
                      </div>

                      {/* Botón Eliminar */}
                      <div className="col-span-2 sm:col-span-1 flex justify-center">
                        <button
                          type="button"
                          onClick={() => handleEliminarEscala(juegoTiempoTab, idx)}
                          title="Eliminar esta calificación"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          <TrashIcon size={14} />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="pt-2 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => handleAgregarEscala(juegoTiempoTab)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#002B5E] hover:text-[#001D40] bg-white border border-[#002B5E]/30 hover:border-[#002B5E] px-3 py-1.5 rounded-xl shadow-2xs transition"
                    >
                      <PlusIcon size={14} />
                      <span>Agregar Calificación a {JUEGOS_CRONOMETRADOS.find(j => j.id === juegoTiempoTab)?.nombre}</span>
                    </button>
                    <span className="text-[11px] text-slate-400">
                      Podés agregar tantas escalas como necesites.
                    </span>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: Puntaje por Calificación de Desempeño */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏆</span>
                    <h3 className="text-sm font-bold text-slate-800">
                      2. Puntaje por Calificación de Desempeño (S, A, B, C, F)
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
                    Puntuación Dinámica
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Configurá cuántos puntos gana el usuario según la calificación obtenida (evaluada en base a vidas e intentos restantes al completar la partida).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                  {CALIFICACIONES_CONFIG.map((c) => {
                    const valor = puntosPorCalificacion[c.id] ?? c.defaultPts;
                    return (
                      <div
                        key={c.id}
                        className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between shadow-xs hover:border-slate-300 transition"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center border shadow-2xs ${c.badge}`}>
                                {c.id}
                              </span>
                              <span className="text-xs font-bold text-slate-800">{c.estrellas}</span>
                            </div>
                            <span className="text-sm">{c.emoji}</span>
                          </div>

                          <div className="text-[11px] font-bold text-slate-800 leading-tight mb-1">
                            {c.nombre}
                          </div>
                          <div className="text-[10px] text-slate-400 mb-3">
                            {c.desc}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                          <input
                            type="number"
                            min="0"
                            value={valor}
                            onChange={(e) => handlePuntosCalificacionChange(c.id, e.target.value)}
                            className="w-full text-right px-2 py-1 text-xs font-black bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B5E] focus:outline-hidden text-slate-900"
                          />
                          <span className="text-[11px] font-bold text-amber-700">pts</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECCIÓN 3: Puntos Base de Respaldo por Juego */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5 space-y-4">
                <div className="flex items-center gap-2">
                  <CoinsIcon size={18} className="text-amber-600" />
                  <h3 className="text-sm font-bold text-slate-800">
                    4. Puntos Base de Respaldo por Juego
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Definí cuántos puntos gana el usuario automáticamente cada vez que completa un desafío diario o partida victoriosa.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {JUEGOS_DEFAULT.map(/* Prepara el resultado de cada elemento. */ (jg) => {
                    const valorActual = puntosPorJuego[jg.id] ?? jg.defaultPts;
                    return (
                      <div
                        key={jg.id}
                        className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{jg.emoji}</span>
                          <div>
                            <div className="text-xs font-bold text-slate-900">{jg.nombre}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{jg.id}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 w-24">
                          <input
                            type="number"
                            min="0"
                            value={valorActual}
                            onChange={/* Responde a change desde este control. */ (e) => handlePuntosJuegoChange(jg.id, e.target.value)}
                            className="w-full text-right px-2 py-1 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B5E] focus:outline-hidden"
                          />
                          <span className="text-[11px] font-bold text-amber-700">pts</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECCIÓN 3: Paquetes de la Mini-Tienda */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🛍️</span>
                    <h3 className="text-sm font-bold text-slate-800">
                      5. Paquetes de la Mini-Tienda (Canje de Vidas)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleAgregarPaquete}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition shadow-2xs cursor-pointer"
                  >
                    <PlusIcon size={14} />
                    <span>Agregar Paquete</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {paquetesTienda.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                      No hay paquetes configurados. Hacé clic en "Agregar Paquete".
                    </div>
                  ) : (
                    paquetesTienda.map(/* Prepara el resultado de cada elemento. */ (pack, idx) => (
                      <div
                        key={idx}
                        className={`bg-white border rounded-xl p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-2xs transition ${
                          pack.popular ? 'border-amber-400 ring-1 ring-amber-300/50 bg-amber-50/20' : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center font-mono">
                            #{idx + 1}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-600">Otorga:</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="1"
                                value={pack.vidas}
                                onChange={/* Responde a change desde este control. */ (e) => handlePaqueteChange(idx, 'vidas', parseInt(e.target.value, 10) || 1)}
                                className="w-16 px-2 py-1 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg text-center"
                              />
                              <span className="text-xs font-bold text-rose-600">vidas</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-600">Por:</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="1"
                                value={pack.puntos}
                                onChange={/* Responde a change desde este control. */ (e) => handlePaqueteChange(idx, 'puntos', parseInt(e.target.value, 10) || 1)}
                                className="w-20 px-2 py-1 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg text-center"
                              />
                              <span className="text-xs font-bold text-amber-700">pts</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                          <input
                            type="text"
                            placeholder="Badge ej: Popular"
                            value={pack.badge || ''}
                            onChange={/* Responde a change desde este control. */ (e) => handlePaqueteChange(idx, 'badge', e.target.value)}
                            className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-lg w-28 placeholder:text-slate-400"
                          />
                          <input
                            type="text"
                            placeholder="Ahorro ej: Ahorrá 30 pts"
                            value={pack.descuento || ''}
                            onChange={/* Responde a change desde este control. */ (e) => handlePaqueteChange(idx, 'descuento', e.target.value)}
                            className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-lg w-32 placeholder:text-slate-400"
                          />

                          <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer px-2 py-1 rounded-lg hover:bg-slate-100">
                            <input
                              type="checkbox"
                              checked={Boolean(pack.popular)}
                              onChange={/* Responde a change desde este control. */ (e) => handlePaqueteChange(idx, 'popular', e.target.checked)}
                              className="rounded-sm text-[#002B5E] focus:ring-[#002B5E]"
                            />
                            <span>Destacado</span>
                          </label>

                          <button
                            type="button"
                            onClick={/* Responde a click desde este control. */ () => handleEliminarPaquete(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Eliminar este paquete"
                          >
                            <TrashIcon size={15} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </form>
          )}
        </div>

        {/* Footer de Acciones */}
        <footer className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="text-[11px] text-slate-500 font-medium">
            Los cambios se sincronizan en tiempo real para todos los juegos y jugadores.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCerrar}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              {embebido ? 'Volver' : 'Cancelar'}
            </button>
            <button
              type="submit"
              form="form-economia"
              disabled={guardando || cargando}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#002B5E] hover:bg-slate-900 rounded-xl transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              {guardando ? (
                <>
                  <RefreshIcon size={14} className="animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <CheckIcon size={14} />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
}
