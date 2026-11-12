/* Permite editar precios, puntos y bonus por racha de los juegos. */
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
  SearchIcon,
  CrownIcon,
  GridIcon,
  PuzzleIcon,
  StarIcon,
  TrophyIcon,
  StopwatchIcon,
  ThumbsUpIcon,
  XCircleIcon,
  SparklesIcon,
} from './Icons';
import { OPERADOR_STORAGE_KEY } from './authService';

const JUEGOS_DEFAULT = [
  { id: 'wordle', nombre: 'Wordle', defaultPts: 50, Icon: GridIcon },
  { id: 'sopa_letras', nombre: 'Sopa de letras', defaultPts: 50, Icon: SearchIcon },
  { id: 'sudoku', nombre: 'Sudoku', defaultPts: 60, Icon: GridIcon },
  { id: 'crucigrama', nombre: 'Crucigrama', defaultPts: 70, Icon: PuzzleIcon },
  { id: 'narrativo', nombre: 'Crónicas narrativas', defaultPts: 80, Icon: CrownIcon },
];

const CALIFICACIONES_CONFIG = [
  {
    id: 'S',
    nombre: 'Impecable',
    estrellas: 3,
    badge: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    icono: 'text-amber-300',
    Icon: TrophyIcon,
    desc: 'Mínimos intentos o sin errores',
    defaultPts: 100,
  },
  {
    id: 'A',
    nombre: 'Muy bueno',
    estrellas: 3,
    badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    icono: 'text-emerald-300',
    Icon: StarIcon,
    desc: 'Desempeño destacado',
    defaultPts: 90,
  },
  {
    id: 'B',
    nombre: 'Bueno',
    estrellas: 2,
    badge: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    icono: 'text-blue-300',
    Icon: SparklesIcon,
    desc: 'Desempeño estándar',
    defaultPts: 75,
  },
  {
    id: 'C',
    nombre: 'Aprobado',
    estrellas: 1,
    badge: 'border-white/10 bg-white/5 text-slate-300',
    icono: 'text-slate-300',
    Icon: ThumbsUpIcon,
    desc: 'Al límite de vidas o intentos',
    defaultPts: 50,
  },
  {
    id: 'F',
    nombre: 'Fallido',
    estrellas: 0,
    badge: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
    icono: 'text-rose-300',
    Icon: XCircleIcon,
    desc: 'Sin vidas restantes',
    defaultPts: 0,
  },
];

const JUEGOS_CRONOMETRADOS = [
  { id: 'sudoku', nombre: 'Sudoku', Icon: GridIcon },
  { id: 'crucigrama', nombre: 'Crucigrama', Icon: PuzzleIcon },
  { id: 'sopa_letras', nombre: 'Sopa de letras', Icon: SearchIcon },
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

const CAMPO =
  'w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm font-semibold text-white placeholder:text-slate-600 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20';
const CAMPO_MINI =
  'w-full rounded-md border border-white/10 bg-slate-950/60 px-2 py-1 text-xs font-semibold text-slate-200 focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/20';
const ETIQUETA = 'block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500';
const AYUDA = 'mt-1 text-[10px] leading-relaxed text-slate-600';

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

function Seccion({ Icon, titulo, descripcion, accion, children }) {
  return (
    <section>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-amber-300">
            <Icon size={16} />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-white">{titulo}</h3>
            {descripcion && (
              <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-slate-500">
                {descripcion}
              </p>
            )}
          </div>
        </div>
        {accion}
      </div>
      {children}
    </section>
  );
}

// Permite editar precios, puntos y bonus por racha de los juegos.
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
  const [bonusRacha, setBonusRacha] = useState({
    activo: false,
    modo: 'porcentaje',
    tramos: [
      { dias: 10, valor: 10 },
      { dias: 15, valor: 20 },
      { dias: 20, valor: 30 },
    ],
  });

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
        if (data.bonus_racha) {
          setBonusRacha({
            activo: Boolean(data.bonus_racha.activo),
            modo: data.bonus_racha.modo === 'puntos_fijos' ? 'puntos_fijos' : 'porcentaje',
            tramos: Array.isArray(data.bonus_racha.tramos)
              ? data.bonus_racha.tramos.map((tramo) => ({
                  dias: Number(tramo.dias) || 1,
                  valor: Number(tramo.valor) || 0,
                }))
              : [],
          });
        }
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

  // Actualiza el campo editado de un tramo de racha.
  const handleTramoRachaChange = (index, campo, valor) => {
    setBonusRacha((prev) => {
      const tramos = [...prev.tramos];
      tramos[index] = {
        ...tramos[index],
        [campo]: Math.max(campo === 'dias' ? 1 : 0, parseInt(valor, 10) || 0),
      };
      return { ...prev, tramos };
    });
  };

  // Agrega un tramo de racha con datos sugeridos.
  const handleAgregarTramoRacha = () => {
    setBonusRacha((prev) => {
      const ultimoDia = prev.tramos.reduce((maximo, tramo) => Math.max(maximo, tramo.dias), 0);
      return { ...prev, tramos: [...prev.tramos, { dias: ultimoDia + 5, valor: 10 }] };
    });
  };

  // Quita el tramo de racha indicado.
  const handleEliminarTramoRacha = (index) => {
    setBonusRacha((prev) => ({
      ...prev,
      tramos: prev.tramos.filter((_, i) => i !== index),
    }));
  };

  // Valida el formulario y guarda los cambios.
  const handleGuardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setErrorMsg('');
    setExitoMsg('');

    if (bonusRacha.activo && bonusRacha.tramos.length === 0) {
      setErrorMsg('El bonus por racha activo necesita al menos un tramo.');
      setGuardando(false);
      return;
    }

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
        bonus_racha: {
          activo: Boolean(bonusRacha.activo),
          modo: bonusRacha.modo,
          tramos: [...bonusRacha.tramos]
            .filter((tramo, idx, lista) => lista.findIndex((otro) => otro.dias === tramo.dias) === idx)
            .sort((a, b) => a.dias - b.dias)
            .map((tramo) => ({
              dias: Math.max(1, parseInt(tramo.dias, 10) || 1),
              valor: Math.max(0, parseInt(tramo.valor, 10) || 0),
            })),
        },
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

  const juegoActual = JUEGOS_CRONOMETRADOS.find((j) => j.id === juegoTiempoTab);

  const contenido = cargando ? (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <RefreshIcon size={26} className="animate-spin text-slate-500" />
      <p className="text-xs font-semibold text-slate-500">Cargando configuración de economía...</p>
    </div>
  ) : (
    <>
      {(errorMsg || exitoMsg) && (
        <div className="mb-6 space-y-2">
          {errorMsg && (
            <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs font-medium text-rose-300">
              <AlertTriangleIcon size={16} className="flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {exitoMsg && (
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-medium text-emerald-300">
              <CheckIcon size={16} className="flex-shrink-0" />
              <span>{exitoMsg}</span>
            </div>
          )}
        </div>
      )}

      <form id="form-economia" onSubmit={handleGuardar} className="space-y-10">
        <Seccion
          Icon={HeartIcon}
          titulo="Vidas y canje"
          descripcion="Define con cuántas vidas arranca una cuenta y cuánto cuesta reponerlas o desbloquear contenido."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div>
              <label className={ETIQUETA}>Vidas iniciales</label>
              <input
                type="number"
                min="1"
                max="99"
                value={vidasIniciales}
                onChange={(e) => setVidasIniciales(e.target.value)}
                required
                className={`${CAMPO} mt-1.5`}
              />
              <p className={AYUDA}>Vidas de un usuario nuevo o invitado.</p>
            </div>

            <div>
              <label className={ETIQUETA}>Costo de 1 vida</label>
              <input
                type="number"
                min="1"
                value={costoVidaPuntos}
                onChange={(e) => setCostoVidaPuntos(e.target.value)}
                required
                className={`${CAMPO} mt-1.5`}
              />
              <p className={AYUDA}>Precio de referencia para reponer vidas.</p>
            </div>

            <div>
              <label className={ETIQUETA}>Tope de vidas</label>
              <input
                type="number"
                min="1"
                placeholder="Sin límite"
                value={vidasMaximas}
                onChange={(e) => setVidasMaximas(e.target.value)}
                className={`${CAMPO} mt-1.5`}
              />
              <p className={AYUDA}>Vacío si pueden acumularse sin tope.</p>
            </div>

            <div>
              <label className={ETIQUETA}>Desbloqueo de día</label>
              <input
                type="number"
                min="0"
                value={costoDesbloqueoDia}
                onChange={(e) => setCostoDesbloqueoDia(e.target.value)}
                required
                className={`${CAMPO} mt-1.5`}
              />
              <p className={AYUDA}>Puntos para abrir días anteriores.</p>
            </div>

            <div>
              <label className={ETIQUETA}>Costo por pista</label>
              <input
                type="number"
                min="0"
                value={costoPistaPuntos}
                onChange={(e) => setCostoPistaPuntos(e.target.value)}
                required
                className={`${CAMPO} mt-1.5`}
              />
              <p className={AYUDA}>Puntos que se descuentan al pedir ayuda.</p>
            </div>
          </div>
        </Seccion>

        <Seccion
          Icon={CoinsIcon}
          titulo="Puntos base por juego"
          descripcion="Recompensa que recibe el jugador al completar cada desafío diario o partida victoriosa."
        >
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {JUEGOS_DEFAULT.map(({ id, nombre, defaultPts, Icon }) => {
              const valorActual = puntosPorJuego[id] ?? defaultPts;
              return (
                <div
                  key={id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300">
                      <Icon size={15} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-200">{nombre}</p>
                      <p className="font-mono text-[10px] text-slate-600">{id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      value={valorActual}
                      onChange={(e) => handlePuntosJuegoChange(id, e.target.value)}
                      className="w-20 rounded-md border border-white/10 bg-slate-950/60 px-2 py-1 text-right text-xs font-bold text-slate-200 focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                    />
                    <span className="text-[10px] font-semibold text-amber-300">pts</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Seccion>

        <Seccion
          Icon={SparklesIcon}
          titulo="Bonus por racha"
          descripcion="Puntos extra al completar un desafío según los días consecutivos de ingreso. Se aplica solo el tramo más alto alcanzado."
          accion={
            <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300">
              <input
                type="checkbox"
                checked={bonusRacha.activo}
                onChange={(e) => setBonusRacha((prev) => ({ ...prev, activo: e.target.checked }))}
                className="rounded border-white/20 bg-slate-950 text-amber-500 focus:ring-amber-500/40"
              />
              <span>Activo</span>
            </label>
          }
        >
          <div className="space-y-2.5">
            <div className="flex flex-col gap-2 sm:max-w-xs">
              <label className={ETIQUETA}>Modo del bonus</label>
              <select
                value={bonusRacha.modo}
                onChange={(e) => setBonusRacha((prev) => ({ ...prev, modo: e.target.value }))}
                className={CAMPO}
              >
                <option value="porcentaje">Porcentaje del puntaje base</option>
                <option value="puntos_fijos">Puntos fijos por tramo</option>
              </select>
              <p className={AYUDA}>
                {bonusRacha.modo === 'porcentaje'
                  ? 'El valor de cada tramo es un porcentaje (máximo 500%).'
                  : 'El valor de cada tramo son puntos que se suman al puntaje base.'}
              </p>
            </div>

            <div className="hidden grid-cols-12 gap-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 sm:grid">
              <div className="col-span-5">Días de racha</div>
              <div className="col-span-5">
                {bonusRacha.modo === 'porcentaje' ? 'Boost (%)' : 'Puntos extra'}
              </div>
              <div className="col-span-2 text-center">Quitar</div>
            </div>

            {bonusRacha.tramos.length === 0 && (
              <div className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-xs text-slate-500">
                No hay tramos configurados. Agregá el primero para definir desde qué racha suma.
              </div>
            )}

            {bonusRacha.tramos.map((tramo, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-2.5"
              >
                <div className="col-span-6 flex items-center gap-2 sm:col-span-5">
                  <input
                    type="number"
                    min="1"
                    value={tramo.dias}
                    onChange={(e) => handleTramoRachaChange(idx, 'dias', e.target.value)}
                    className={`${CAMPO_MINI} text-right`}
                  />
                  <span className="text-[10px] font-semibold text-slate-500">días</span>
                </div>
                <div className="col-span-4 flex items-center gap-2 sm:col-span-5">
                  <input
                    type="number"
                    min="0"
                    max={bonusRacha.modo === 'porcentaje' ? 500 : 10000}
                    value={tramo.valor}
                    onChange={(e) => handleTramoRachaChange(idx, 'valor', e.target.value)}
                    className={`${CAMPO_MINI} text-right`}
                  />
                  <span className="text-[10px] font-semibold text-amber-300">
                    {bonusRacha.modo === 'porcentaje' ? '%' : 'pts'}
                  </span>
                </div>
                <div className="col-span-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => handleEliminarTramoRacha(idx)}
                    title="Eliminar este tramo"
                    className="rounded-lg p-1.5 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300"
                  >
                    <TrashIcon size={14} />
                  </button>
                </div>
              </div>
            ))}

            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handleAgregarTramoRacha}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300 transition hover:bg-amber-500/15"
              >
                <PlusIcon size={14} />
                <span>Agregar tramo</span>
              </button>
              <span className="text-[10px] text-slate-600">
                Si la racha supera varios tramos, se aplica el de más días.
              </span>
            </div>
          </div>
        </Seccion>

        <Seccion
          Icon={TrophyIcon}
          titulo="Calificación de desempeño"
          descripcion="Puntos según vidas e intentos restantes al completar la partida."
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {CALIFICACIONES_CONFIG.map((calificacion) => {
              const { id, nombre, estrellas, badge, icono, desc, defaultPts, Icon } = calificacion;
              const valor = puntosPorCalificacion[id] ?? defaultPts;
              return (
                <div
                  key={id}
                  className="flex flex-col justify-between rounded-xl border border-white/10 bg-white/[0.02] p-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-lg border text-xs font-bold ${badge}`}
                        >
                          {id}
                        </span>
                        <span className="flex items-center gap-0.5">
                          {[0, 1, 2].map((indice) => (
                            <StarIcon
                              key={indice}
                              size={11}
                              filled={indice < estrellas}
                              className={indice < estrellas ? 'text-amber-300' : 'text-slate-700'}
                            />
                          ))}
                        </span>
                      </div>
                      <Icon size={15} className={icono} />
                    </div>
                    <p className="mt-2.5 text-[11px] font-semibold text-slate-200">{nombre}</p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">{desc}</p>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 border-t border-white/5 pt-2.5">
                    <input
                      type="number"
                      min="0"
                      value={valor}
                      onChange={(e) => handlePuntosCalificacionChange(id, e.target.value)}
                      className="w-full rounded-md border border-white/10 bg-slate-950/60 px-2 py-1 text-right text-xs font-bold text-slate-200 focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                    />
                    <span className="text-[10px] font-semibold text-amber-300">pts</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Seccion>

        <Seccion
          Icon={StopwatchIcon}
          titulo="Calificación por tiempo"
          descripcion="Sudoku, crucigrama y sopa de letras no tienen Game Over por vidas: se califican según el tiempo de resolución."
          accion={
            <div className="inline-flex w-fit shrink-0 rounded-xl border border-white/10 bg-white/5 p-1">
              {JUEGOS_CRONOMETRADOS.map(({ id, nombre, Icon }) => {
                const activo = juegoTiempoTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setJuegoTiempoTab(id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
                      activo
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon size={13} />
                    <span className="whitespace-nowrap">{nombre}</span>
                    <span
                      className={`rounded-full border px-1.5 text-[9px] leading-4 ${
                        activo
                          ? 'border-slate-950/30 text-slate-900'
                          : 'border-white/10 text-slate-500'
                      }`}
                    >
                      {(escalasTiempoPorJuego[id] || []).length}
                    </span>
                  </button>
                );
              })}
            </div>
          }
        >
          <div className="space-y-2">
            <div className="hidden grid-cols-12 gap-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 sm:grid">
              <div className="col-span-1 text-center">Rango</div>
              <div className="col-span-2">Tiempo máx.</div>
              <div className="col-span-2">Puntos</div>
              <div className="col-span-2">Estrellas</div>
              <div className="col-span-4">Título / detalle</div>
              <div className="col-span-1 text-center">Quitar</div>
            </div>

            {(escalasTiempoPorJuego[juegoTiempoTab] || []).map((escala, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-2.5"
              >
                <div className="col-span-2 sm:col-span-1">
                  <input
                    type="text"
                    value={escala.grade}
                    onChange={(e) =>
                      handleEscalaFieldChange(juegoTiempoTab, idx, 'grade', e.target.value.toUpperCase())
                    }
                    title="Letra o código de calificación"
                    className="w-full rounded-md border border-amber-500/30 bg-amber-500/10 px-1 py-1 text-center text-xs font-black text-amber-300 focus:border-amber-500/60 focus:outline-none"
                  />
                </div>

                <div className="col-span-3 sm:col-span-2">
                  <input
                    type="text"
                    value={secToMMSS(escala.tiempo_max_segundos)}
                    onChange={(e) =>
                      handleEscalaFieldChange(juegoTiempoTab, idx, 'tiempo_max_segundos', e.target.value)
                    }
                    placeholder="MM:SS"
                    title="Tiempo límite o 'Sin límite'"
                    className={`${CAMPO_MINI} font-mono`}
                  />
                </div>

                <div className="col-span-2 flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    value={escala.puntos}
                    onChange={(e) => handleEscalaFieldChange(juegoTiempoTab, idx, 'puntos', e.target.value)}
                    className={`${CAMPO_MINI} text-right`}
                  />
                  <span className="text-[10px] font-semibold text-amber-300">pts</span>
                </div>

                <div className="col-span-2">
                  <select
                    value={escala.estrellas ?? 3}
                    onChange={(e) => handleEscalaFieldChange(juegoTiempoTab, idx, 'estrellas', e.target.value)}
                    className={`${CAMPO_MINI} px-1.5 text-slate-300`}
                  >
                    <option value="3">3 estrellas</option>
                    <option value="2">2 estrellas</option>
                    <option value="1">1 estrella</option>
                    <option value="0">0 estrellas</option>
                  </select>
                </div>

                <div className="col-span-3 flex flex-col gap-1 sm:col-span-4">
                  <input
                    type="text"
                    value={escala.titulo || ''}
                    onChange={(e) => handleEscalaFieldChange(juegoTiempoTab, idx, 'titulo', e.target.value)}
                    placeholder="Título"
                    className={CAMPO_MINI}
                  />
                  <input
                    type="text"
                    value={escala.descripcion || ''}
                    onChange={(e) =>
                      handleEscalaFieldChange(juegoTiempoTab, idx, 'descripcion', e.target.value)
                    }
                    placeholder="Detalle"
                    className="w-full rounded-md border border-white/10 bg-slate-950/60 px-2 py-0.5 text-[10px] text-slate-400 placeholder:text-slate-600 focus:border-amber-500/60 focus:outline-none"
                  />
                </div>

                <div className="col-span-2 flex justify-center sm:col-span-1">
                  <button
                    type="button"
                    onClick={() => handleEliminarEscala(juegoTiempoTab, idx)}
                    title="Eliminar esta calificación"
                    className="rounded-lg p-1.5 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300"
                  >
                    <TrashIcon size={14} />
                  </button>
                </div>
              </div>
            ))}

            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => handleAgregarEscala(juegoTiempoTab)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300 transition hover:bg-amber-500/15"
              >
                <PlusIcon size={14} />
                <span>Agregar rango a {juegoActual?.nombre}</span>
              </button>
              <span className="text-[10px] text-slate-600">
                Podés agregar tantos rangos como necesites.
              </span>
            </div>
          </div>
        </Seccion>

      </form>

      <div className="sticky bottom-0 z-10 -mx-4 mt-8 border-t border-white/10 bg-slate-950/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-slate-500">
            Los cambios se aplican a todos los juegos y jugadores.
          </p>
          <button
            type="submit"
            form="form-economia"
            disabled={guardando || cargando}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
          >
            {guardando ? (
              <>
                <RefreshIcon size={14} className="animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <CheckIcon size={14} />
                <span>Guardar cambios</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );

  if (embebido) return <div className="w-full">{contenido}</div>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950/80 p-3 backdrop-blur-sm sm:p-6">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl">
        <header className="flex flex-shrink-0 items-center justify-between border-b border-white/5 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-slate-950">
              <CoinsIcon size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight text-white">Economía y vidas</h2>
              <p className="text-[11px] font-medium text-slate-500">
                Parámetros globales de vidas, puntos y recompensas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
            title="Cerrar ventana"
          >
            <XIcon size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">{contenido}</div>
      </div>
    </div>
  );
}
