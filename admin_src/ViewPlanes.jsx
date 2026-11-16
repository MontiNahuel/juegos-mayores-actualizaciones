/* Catálogo de planes de suscripción: visibilidad para el jugador y habilitación de compra. */
import { useEffect, useState } from 'react';
import {
  AlertTriangleIcon,
  CheckIcon,
  EditIcon,
  PlusIcon,
  RefreshIcon,
  ShoppingBagIcon,
  TrashIcon,
  XIcon,
} from './Icons';
import { getAuthHeaders } from './authService';

const CAMPO =
  'w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm font-semibold text-white placeholder:text-slate-600 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20';
const ETIQUETA = 'block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500';
const AYUDA = 'mt-1 text-[10px] leading-relaxed text-slate-600';

const PLAN_VACIO = {
  codigo: '',
  nombre: '',
  descripcion: '',
  monto: '',
  moneda: 'ARS',
  descuento_anual_pct: 0,
  beneficios: '',
  orden: 0,
  visible: true,
  habilitado: false,
};

function formatearPrecio(precio, periodo = 'mensual') {
  const monto = Number(precio?.monto);
  if (!Number.isFinite(monto)) return 'Sin precio';
  try {
    const texto = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: precio?.moneda || 'ARS',
      maximumFractionDigits: 2,
    }).format(monto);
    return `${texto} / ${periodo === 'anual' ? 'año' : 'mes'}`;
  } catch {
    return `${precio?.moneda || 'ARS'} ${monto}`;
  }
}

function formatearDescuento(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return '0';
  return String(Number(numero.toFixed(2)));
}

function planAFormulario(plan) {
  return {
    codigo: plan.codigo,
    nombre: plan.nombre,
    descripcion: plan.descripcion || '',
    monto: plan.precio?.monto == null ? '' : String(plan.precio.monto),
    moneda: plan.precio?.moneda || 'ARS',
    descuento_anual_pct: plan.descuento_anual_pct ?? 0,
    beneficios: (plan.beneficios || []).join('\n'),
    orden: plan.orden ?? 0,
    visible: Boolean(plan.visible),
    habilitado: Boolean(plan.habilitado),
  };
}

function Interruptor({ activo, onChange, etiqueta, descripcion, disabled = false }) {
  return (
    <label
      className={`flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 ${
        disabled ? 'cursor-wait opacity-70' : 'cursor-pointer'
      }`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={activo}
        aria-label={etiqueta}
        disabled={disabled}
        onClick={() => onChange(!activo)}
        className={`mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full border px-0.5 transition ${
          activo ? 'border-amber-400/60 bg-amber-500' : 'border-white/10 bg-slate-700'
        }`}
      >
        <span
          className={`h-3.5 w-3.5 rounded-full bg-white transition ${activo ? 'translate-x-3.5' : ''}`}
        />
      </button>
      <span className="min-w-0">
        <span className="block text-xs font-semibold text-slate-200">{etiqueta}</span>
        <span className="mt-0.5 block text-[10px] leading-relaxed text-slate-500">
          {descripcion}
        </span>
      </span>
    </label>
  );
}

export default function ViewPlanes({ onAviso }) {
  const [planes, setPlanes] = useState([]);
  const [config, setConfig] = useState({ anual_habilitado: false });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardandoConfig, setGuardandoConfig] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formulario, setFormulario] = useState(null);
  const [esNuevo, setEsNuevo] = useState(false);
  const [porEliminar, setPorEliminar] = useState('');
  const [ocupadoCodigo, setOcupadoCodigo] = useState('');

  const cargar = async () => {
    setCargando(true);
    setErrorMsg('');
    try {
      const [resPlanes, resConfig] = await Promise.all([
        fetch('/api/admin/subscription/plans', { headers: getAuthHeaders() }),
        fetch('/api/admin/subscription/settings', { headers: getAuthHeaders() }),
      ]);
      if (resPlanes.ok) {
        setPlanes(await resPlanes.json());
      } else {
        const err = await resPlanes.json().catch(() => ({}));
        setErrorMsg(err.detail || 'No se pudieron cargar los planes.');
      }
      if (resConfig.ok) setConfig(await resConfig.json());
    } catch (e) {
      console.error(e);
      setErrorMsg('Error al conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const alternarAnuales = async (valor) => {
    setErrorMsg('');
    setGuardandoConfig(true);
    try {
      const res = await fetch('/api/admin/subscription/settings', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ anual_habilitado: valor }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setConfig(data);
        onAviso?.(valor ? 'Membresías anuales activadas' : 'Membresías anuales desactivadas');
      } else {
        setErrorMsg(data.detail || 'No se pudo actualizar la configuración.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al actualizar la configuración.');
    } finally {
      setGuardandoConfig(false);
    }
  };

  const abrirNuevo = () => {
    setErrorMsg('');
    setEsNuevo(true);
    setFormulario({ ...PLAN_VACIO, orden: planes.length });
  };

  const abrirEdicion = (plan) => {
    setErrorMsg('');
    setEsNuevo(false);
    setFormulario(planAFormulario(plan));
  };

  const cerrarFormulario = () => {
    setFormulario(null);
    setEsNuevo(false);
  };

  const armarPayload = () => {
    const beneficios = String(formulario.beneficios)
      .split('\n')
      .map((linea) => linea.trim())
      .filter(Boolean);
    return {
      nombre: formulario.nombre.trim(),
      descripcion: formulario.descripcion.trim(),
      precio: {
        monto: formulario.monto === '' ? null : Number(formulario.monto),
        moneda: formulario.moneda.trim().toUpperCase(),
      },
      descuento_anual_pct:
        formulario.descuento_anual_pct === '' ? 0 : Number(formulario.descuento_anual_pct),
      beneficios,
      orden: Number(formulario.orden) || 0,
      visible: Boolean(formulario.visible),
      habilitado: Boolean(formulario.habilitado),
    };
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!formulario) return;
    setErrorMsg('');

    if (esNuevo && !/^[a-z0-9][a-z0-9_-]{1,31}$/.test(formulario.codigo.trim())) {
      setErrorMsg('El código debe tener 2 a 32 caracteres en minúsculas, números, guion o guion bajo.');
      return;
    }
    if (formulario.nombre.trim().length < 2) {
      setErrorMsg('El nombre del plan necesita al menos 2 caracteres.');
      return;
    }
    if (formulario.monto !== '' && Number(formulario.monto) < 0) {
      setErrorMsg('El precio no puede ser negativo.');
      return;
    }
    const descuento = Number(formulario.descuento_anual_pct);
    if (formulario.descuento_anual_pct !== '' && (descuento < 0 || descuento > 100)) {
      setErrorMsg('El descuento anual debe estar entre 0 y 100.');
      return;
    }
    if (!/^[A-Za-z]{3}$/.test(formulario.moneda.trim())) {
      setErrorMsg('La moneda debe ser un código de 3 letras, por ejemplo ARS.');
      return;
    }

    setGuardando(true);
    try {
      const payload = armarPayload();
      const url = esNuevo
        ? '/api/admin/subscription/plans'
        : `/api/admin/subscription/plans/${encodeURIComponent(formulario.codigo)}`;
      const res = await fetch(url, {
        method: esNuevo ? 'POST' : 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(esNuevo ? { ...payload, codigo: formulario.codigo.trim() } : payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        onAviso?.(esNuevo ? `Plan "${data.nombre}" creado` : `Plan "${data.nombre}" actualizado`);
        cerrarFormulario();
        await cargar();
      } else {
        setErrorMsg(data.detail || 'No se pudo guardar el plan.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al guardar el plan.');
    } finally {
      setGuardando(false);
    }
  };

  const alternar = async (plan, campo) => {
    setErrorMsg('');
    setOcupadoCodigo(plan.codigo);
    try {
      const res = await fetch(
        `/api/admin/subscription/plans/${encodeURIComponent(plan.codigo)}`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ [campo]: !plan[campo] }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setPlanes((prev) => prev.map((item) => (item.codigo === data.codigo ? data : item)));
      } else {
        setErrorMsg(data.detail || 'No se pudo actualizar el plan.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al actualizar el plan.');
    } finally {
      setOcupadoCodigo('');
    }
  };

  const eliminar = async (codigo) => {
    setErrorMsg('');
    setOcupadoCodigo(codigo);
    try {
      const res = await fetch(
        `/api/admin/subscription/plans/${encodeURIComponent(codigo)}`,
        { method: 'DELETE', headers: getAuthHeaders() }
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setPorEliminar('');
        if (formulario && !esNuevo && formulario.codigo === codigo) cerrarFormulario();
        onAviso?.(data.message || 'Plan eliminado');
        await cargar();
      } else {
        setErrorMsg(data.detail || 'No se pudo eliminar el plan.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al eliminar el plan.');
    } finally {
      setOcupadoCodigo('');
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white">Planes de suscripción</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            Definí los planes que ve el jugador al tocar «Mejorar suscripción». El precio es
            mensual y el anual se calcula con doce meses menos el descuento de cada plan. La compra
            queda en espera de la pasarela de pagos: mientras no esté habilitada, el botón se
            muestra deshabilitado.
          </p>
        </div>
        <button
          type="button"
          onClick={abrirNuevo}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-amber-400"
        >
          <PlusIcon size={14} />
          Nuevo plan
        </button>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs font-medium text-rose-300">
          <AlertTriangleIcon size={16} className="flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="rounded-2xl border border-amber-500/20 bg-slate-900/50 p-4">
        <Interruptor
          activo={config.anual_habilitado}
          onChange={alternarAnuales}
          disabled={guardandoConfig}
          etiqueta="Membresías anuales"
          descripcion="Muestra el selector Mensual / Anual en el perfil. El precio anual se calcula con doce meses menos el descuento de cada plan."
        />
      </div>

      {formulario && (
        <form
          onSubmit={guardar}
          className="rounded-2xl border border-amber-500/30 bg-slate-900/60 p-5"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white">
                {esNuevo ? 'Nuevo plan' : `Editar “${formulario.nombre || formulario.codigo}”`}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                {esNuevo
                  ? 'El código es estable y no se puede cambiar después de crear el plan.'
                  : 'El código del plan no se edita.'}
              </p>
            </div>
            <button
              type="button"
              onClick={cerrarFormulario}
              title="Cerrar formulario"
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <XIcon size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className={ETIQUETA}>Código</label>
              <input
                type="text"
                value={formulario.codigo}
                onChange={(e) =>
                  setFormulario((prev) => ({ ...prev, codigo: e.target.value.toLowerCase() }))
                }
                disabled={!esNuevo}
                required
                placeholder="premium_mensual"
                className={`${CAMPO} mt-1.5 disabled:opacity-50`}
              />
              <p className={AYUDA}>Minúsculas, números, guion o guion bajo.</p>
            </div>

            <div>
              <label className={ETIQUETA}>Nombre visible</label>
              <input
                type="text"
                value={formulario.nombre}
                onChange={(e) => setFormulario((prev) => ({ ...prev, nombre: e.target.value }))}
                required
                maxLength={60}
                placeholder="Premium"
                className={`${CAMPO} mt-1.5`}
              />
              <p className={AYUDA}>Es el título que lee el jugador.</p>
            </div>

            <div>
              <label className={ETIQUETA}>Monto mensual</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formulario.monto}
                onChange={(e) => setFormulario((prev) => ({ ...prev, monto: e.target.value }))}
                placeholder="Sin precio"
                className={`${CAMPO} mt-1.5`}
              />
              <p className={AYUDA}>Importe del cobro mensual. Vacío si todavía no tiene precio.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={ETIQUETA}>Moneda</label>
                <input
                  type="text"
                  value={formulario.moneda}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, moneda: e.target.value.toUpperCase() }))
                  }
                  maxLength={3}
                  required
                  className={`${CAMPO} mt-1.5 uppercase`}
                />
              </div>
              <div>
                <label className={ETIQUETA}>Descuento anual (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={formulario.descuento_anual_pct}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, descuento_anual_pct: e.target.value }))
                  }
                  className={`${CAMPO} mt-1.5`}
                />
                <p className={AYUDA}>0 deja el anual sin descuento.</p>
              </div>
            </div>

            <div className="md:col-span-2 xl:col-span-3">
              <label className={ETIQUETA}>Descripción</label>
              <input
                type="text"
                value={formulario.descripcion}
                onChange={(e) =>
                  setFormulario((prev) => ({ ...prev, descripcion: e.target.value }))
                }
                maxLength={240}
                placeholder="Todo lo del plan básico, sin límites diarios"
                className={`${CAMPO} mt-1.5`}
              />
            </div>

            <div>
              <label className={ETIQUETA}>Orden</label>
              <input
                type="number"
                min="0"
                max="999"
                value={formulario.orden}
                onChange={(e) => setFormulario((prev) => ({ ...prev, orden: e.target.value }))}
                className={`${CAMPO} mt-1.5`}
              />
              <p className={AYUDA}>Menor número aparece primero.</p>
            </div>

            <div className="md:col-span-2 xl:col-span-4">
              <label className={ETIQUETA}>Beneficios</label>
              <textarea
                value={formulario.beneficios}
                onChange={(e) =>
                  setFormulario((prev) => ({ ...prev, beneficios: e.target.value }))
                }
                rows={4}
                placeholder={'Sin publicidad\nAcceso anticipado a desafíos\nEstadísticas completas'}
                className={`${CAMPO} mt-1.5 resize-y font-normal`}
              />
              <p className={AYUDA}>Un beneficio por línea. Máximo 8.</p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:col-span-2 xl:col-span-4 xl:grid-cols-2">
              <Interruptor
                activo={formulario.visible}
                onChange={(valor) => setFormulario((prev) => ({ ...prev, visible: valor }))}
                etiqueta="Visible para el jugador"
                descripcion="Aparece en la sección de planes del perfil."
              />
              <Interruptor
                activo={formulario.habilitado}
                onChange={(valor) => setFormulario((prev) => ({ ...prev, habilitado: valor }))}
                etiqueta="Compra habilitada"
                descripcion="Activa el botón de compra; sin pasarela, el jugador verá que está en integración."
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-white/5 pt-4">
            <button
              type="button"
              onClick={cerrarFormulario}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
            >
              {guardando ? (
                <>
                  <RefreshIcon size={14} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <CheckIcon size={14} />
                  {esNuevo ? 'Crear plan' : 'Guardar cambios'}
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {cargando ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <RefreshIcon size={26} className="animate-spin text-slate-500" />
          <p className="text-xs font-semibold text-slate-500">Cargando planes...</p>
        </div>
      ) : planes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 px-6 py-14 text-center">
          <ShoppingBagIcon size={28} className="mx-auto text-slate-600" />
          <p className="mt-3 text-sm font-semibold text-slate-300">Todavía no hay planes</p>
          <p className="mt-1 text-xs text-slate-500">
            Creá el primero para que el jugador vea opciones al mejorar su suscripción.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {planes.map((plan) => (
            <article
              key={plan.codigo}
              className="flex flex-col rounded-2xl border border-white/10 bg-slate-900/50 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-amber-300">
                    <ShoppingBagIcon size={18} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-white">{plan.nombre}</h3>
                    <p className="font-mono text-[10px] text-slate-500">{plan.codigo}</p>
                  </div>
                </div>
                <span className="shrink-0 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-bold tabular-nums text-amber-300">
                  {formatearPrecio(plan.precio)}
                </span>
              </div>

              {plan.descripcion && (
                <p className="mt-3 text-xs leading-relaxed text-slate-400">{plan.descripcion}</p>
              )}

              {plan.beneficios?.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {plan.beneficios.map((beneficio) => (
                    <li key={beneficio} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                      <CheckIcon size={12} className="mt-0.5 shrink-0 text-emerald-400" />
                      <span>{beneficio}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    plan.visible
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : 'border-white/10 bg-white/5 text-slate-500'
                  }`}
                >
                  {plan.visible ? 'Visible' : 'Oculto'}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    plan.habilitado
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                      : 'border-white/10 bg-white/5 text-slate-500'
                  }`}
                >
                  {plan.habilitado ? 'Compra habilitada' : 'Próximamente'}
                </span>
                <span className="ml-auto text-[10px] font-semibold text-slate-600">
                  Orden {plan.orden}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                <span className="font-semibold text-slate-300">
                  Anual: {formatearPrecio(plan.precio_anual, 'anual')}
                </span>
                {Number(plan.descuento_anual_pct) > 0 ? (
                  <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-300">
                    −{formatearDescuento(plan.descuento_anual_pct)}%
                  </span>
                ) : (
                  <span className="text-slate-500">Sin descuento anual</span>
                )}
                {!config.anual_habilitado && (
                  <span className="text-slate-500">· No se ofrece todavía</span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 border-t border-white/5 pt-3 sm:grid-cols-2">
                <Interruptor
                  activo={plan.visible}
                  onChange={() => alternar(plan, 'visible')}
                  etiqueta="Visible para el jugador"
                  descripcion="Se muestra en el modal de planes."
                />
                <Interruptor
                  activo={plan.habilitado}
                  onChange={() => alternar(plan, 'habilitado')}
                  etiqueta="Compra habilitada"
                  descripcion="Habilita el botón de compra."
                />
              </div>

              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => abrirEdicion(plan)}
                  disabled={ocupadoCodigo === plan.codigo}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
                >
                  <EditIcon size={13} />
                  Editar
                </button>
                {porEliminar === plan.codigo ? (
                  <span className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => eliminar(plan.codigo)}
                      disabled={ocupadoCodigo === plan.codigo}
                      className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-[11px] font-bold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
                    >
                      Confirmar baja
                    </button>
                    <button
                      type="button"
                      onClick={() => setPorEliminar('')}
                      className="text-[11px] font-semibold text-slate-500 transition hover:text-slate-300"
                    >
                      Cancelar
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPorEliminar(plan.codigo)}
                    title="Eliminar plan"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-1.5 text-[11px] font-bold text-rose-400 transition hover:bg-rose-500/15"
                  >
                    <TrashIcon size={13} />
                    Eliminar
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
