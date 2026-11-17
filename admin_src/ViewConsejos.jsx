/* Consejos del carrusel del perfil: texto breve respaldado por una fuente pública. */
import { useEffect, useState } from 'react';
import {
  AlertTriangleIcon,
  CheckIcon,
  EditIcon,
  LinkIcon,
  MessageSquareIcon,
  PlusIcon,
  RefreshIcon,
  TrashIcon,
  XIcon,
} from './Icons';
import { getAuthHeaders } from './authService';

const CAMPO =
  'w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm font-semibold text-white placeholder:text-slate-600 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20';
const ETIQUETA = 'block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500';
const AYUDA = 'mt-1 text-[10px] leading-relaxed text-slate-600';

const SITUACIONES = [
  { valor: '', etiqueta: 'General (siempre disponible)' },
  { valor: 'eje_desequilibrado', etiqueta: 'Eje desequilibrado' },
  { valor: 'racha_reanudada', etiqueta: 'Racha reanudada' },
  { valor: 'mes_en_mejora', etiqueta: 'Mes en mejora' },
];

const ETIQUETA_SITUACION = Object.fromEntries(
  SITUACIONES.filter((opcion) => opcion.valor).map((opcion) => [opcion.valor, opcion.etiqueta])
);

const CONSEJO_VACIO = {
  texto: '',
  fuente: '',
  url: '',
  orden: 0,
  activo: true,
  situacion: '',
};

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

function consejoAFormulario(consejo) {
  return {
    texto: consejo.texto || '',
    fuente: consejo.fuente || '',
    url: consejo.url || '',
    orden: consejo.orden ?? 0,
    activo: Boolean(consejo.activo),
    situacion: consejo.situacion ?? '',
  };
}

function armarPayload(formulario) {
  return {
    texto: formulario.texto.trim(),
    fuente: formulario.fuente.trim(),
    url: formulario.url.trim(),
    orden: Number(formulario.orden) || 0,
    activo: Boolean(formulario.activo),
    situacion: formulario.situacion || null,
  };
}

function validarPayload(payload) {
  if (!payload.texto) return 'El consejo no puede quedar vacío.';
  if (payload.texto.length > 280) return 'El consejo admite hasta 280 caracteres.';
  if (!payload.fuente) return 'Indicá la fuente del consejo.';
  if (payload.fuente.length > 120) return 'La fuente admite hasta 120 caracteres.';
  if (!/^https?:\/\/\S+$/.test(payload.url)) {
    return 'El enlace debe empezar con http:// o https:// y no tener espacios.';
  }
  if (payload.url.length > 300) return 'El enlace admite hasta 300 caracteres.';
  if (payload.orden < 0 || payload.orden > 9999) return 'El orden debe estar entre 0 y 9999.';
  return '';
}

export default function ViewConsejos({ onAviso }) {
  const [consejos, setConsejos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formulario, setFormulario] = useState(null);
  const [consejoEditado, setConsejoEditado] = useState('');
  const [porEliminar, setPorEliminar] = useState('');
  const [ocupadoId, setOcupadoId] = useState('');

  const cargar = async () => {
    setCargando(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/profile/tips', { headers: getAuthHeaders() });
      if (res.ok) {
        setConsejos(await res.json());
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.detail || 'No se pudieron cargar los consejos.');
      }
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

  const abrirNuevo = () => {
    setErrorMsg('');
    setConsejoEditado('');
    setFormulario({ ...CONSEJO_VACIO, orden: consejos.length * 10 });
  };

  const abrirEdicion = (consejo) => {
    setErrorMsg('');
    setConsejoEditado(consejo.id);
    setFormulario(consejoAFormulario(consejo));
  };

  const cerrarFormulario = () => {
    setFormulario(null);
    setConsejoEditado('');
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!formulario) return;
    setErrorMsg('');

    const payload = armarPayload(formulario);
    const invalido = validarPayload(payload);
    if (invalido) {
      setErrorMsg(invalido);
      return;
    }

    setGuardando(true);
    try {
      const esNuevo = !consejoEditado;
      const url = esNuevo
        ? '/api/admin/profile/tips'
        : `/api/admin/profile/tips/${encodeURIComponent(consejoEditado)}`;
      const res = await fetch(url, {
        method: esNuevo ? 'POST' : 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(data.detail || 'No se pudo guardar el consejo.');
        return;
      }
      onAviso?.(esNuevo ? 'Consejo agregado' : 'Consejo actualizado');
      cerrarFormulario();
      await cargar();
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al guardar el consejo.');
    } finally {
      setGuardando(false);
    }
  };

  const alternarActivo = async (consejo) => {
    setErrorMsg('');
    setOcupadoId(consejo.id);
    try {
      const res = await fetch(
        `/api/admin/profile/tips/${encodeURIComponent(consejo.id)}`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ ...armarPayload(consejoAFormulario(consejo)), activo: !consejo.activo }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setConsejos((prev) => prev.map((item) => (item.id === data.id ? data : item)));
      } else {
        setErrorMsg(data.detail || 'No se pudo actualizar el consejo.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al actualizar el consejo.');
    } finally {
      setOcupadoId('');
    }
  };

  const eliminar = async (id) => {
    setErrorMsg('');
    setOcupadoId(id);
    try {
      const res = await fetch(`/api/admin/profile/tips/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setPorEliminar('');
        if (consejoEditado === id) cerrarFormulario();
        onAviso?.(data.message || 'Consejo eliminado');
        await cargar();
      } else {
        setErrorMsg(data.detail || 'No se pudo eliminar el consejo.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al eliminar el consejo.');
    } finally {
      setOcupadoId('');
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white">Consejos del perfil</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            Alimentan el carrusel «Sabías que…» del perfil. Cada consejo lleva su fuente con
            enlace para que el jugador pueda verificarlo. Los inactivos quedan guardados pero no
            se muestran.
          </p>
        </div>
        <button
          type="button"
          onClick={abrirNuevo}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-amber-400"
        >
          <PlusIcon size={14} />
          Nuevo consejo
        </button>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs font-medium text-rose-300">
          <AlertTriangleIcon size={16} className="flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {formulario && (
        <form
          onSubmit={guardar}
          className="rounded-2xl border border-amber-500/30 bg-slate-900/60 p-5"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white">
                {consejoEditado ? 'Editar consejo' : 'Nuevo consejo'}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                El texto se muestra tal cual en el carrusel; conviene una sola idea por consejo.
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
            <div className="md:col-span-2 xl:col-span-4">
              <label className={ETIQUETA}>Consejo</label>
              <textarea
                value={formulario.texto}
                onChange={(e) => setFormulario((prev) => ({ ...prev, texto: e.target.value }))}
                rows={3}
                maxLength={280}
                required
                placeholder="Entrenar la memoria con desafíos cortos y variados ayuda a sostenerla en el tiempo."
                className={`${CAMPO} mt-1.5 resize-y font-normal`}
              />
              <p className={AYUDA}>{formulario.texto.length} de 280 caracteres.</p>
            </div>

            <div className="md:col-span-2">
              <label className={ETIQUETA}>Fuente</label>
              <input
                type="text"
                value={formulario.fuente}
                onChange={(e) => setFormulario((prev) => ({ ...prev, fuente: e.target.value }))}
                maxLength={120}
                required
                placeholder="Wilson et al., JAMA, 2002"
                className={`${CAMPO} mt-1.5`}
              />
              <p className={AYUDA}>Autor, publicación y año tal como se lee en el carrusel.</p>
            </div>

            <div className="md:col-span-2 xl:col-span-4">
              <label className={ETIQUETA}>Enlace de la fuente</label>
              <input
                type="url"
                value={formulario.url}
                onChange={(e) => setFormulario((prev) => ({ ...prev, url: e.target.value }))}
                maxLength={300}
                required
                placeholder="https://doi.org/10.1001/jama.287.6.742"
                className={`${CAMPO} mt-1.5 font-normal`}
              />
              <p className={AYUDA}>Se abre en otra pestaña. Preferí el DOI del trabajo.</p>
            </div>

            <div className="md:col-span-2 xl:col-span-3">
              <label className={ETIQUETA}>Situación</label>
              <select
                value={formulario.situacion}
                onChange={(e) => setFormulario((prev) => ({ ...prev, situacion: e.target.value }))}
                className={`${CAMPO} mt-1.5`}
              >
                {SITUACIONES.map((opcion) => (
                  <option key={opcion.valor} value={opcion.valor}>
                    {opcion.etiqueta}
                  </option>
                ))}
              </select>
              <p className={AYUDA}>
                Si el progreso del jugador coincide, el consejo se muestra con un motivo que usa sus
                números. Los generales quedan para cualquier momento.
              </p>
            </div>

            <div>
              <label className={ETIQUETA}>Orden</label>
              <input
                type="number"
                min="0"
                max="9999"
                value={formulario.orden}
                onChange={(e) => setFormulario((prev) => ({ ...prev, orden: e.target.value }))}
                className={`${CAMPO} mt-1.5`}
              />
              <p className={AYUDA}>Menor número aparece primero.</p>
            </div>

            <div className="md:col-span-2 xl:col-span-4">
              <Interruptor
                activo={formulario.activo}
                onChange={(valor) => setFormulario((prev) => ({ ...prev, activo: valor }))}
                etiqueta="Visible en el perfil"
                descripcion="Los inactivos se guardan en la colección pero no se envían al jugador."
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
                  {consejoEditado ? 'Guardar cambios' : 'Agregar consejo'}
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {cargando ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <RefreshIcon size={26} className="animate-spin text-slate-500" />
          <p className="text-xs font-semibold text-slate-500">Cargando consejos...</p>
        </div>
      ) : consejos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 px-6 py-14 text-center">
          <MessageSquareIcon size={28} className="mx-auto text-slate-600" />
          <p className="mt-3 text-sm font-semibold text-slate-300">Todavía no hay consejos</p>
          <p className="mt-1 text-xs text-slate-500">
            Agregá el primero para que el perfil muestre el carrusel «Sabías que…».
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {consejos.map((consejo) => (
            <article
              key={consejo.id}
              className="flex flex-col rounded-2xl border border-white/10 bg-slate-900/50 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-amber-300">
                    <MessageSquareIcon size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm leading-relaxed text-slate-200">{consejo.texto}</p>
                    <a
                      href={consejo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300/90 hover:text-amber-200"
                    >
                      <LinkIcon size={11} />
                      {consejo.fuente}
                    </a>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    consejo.activo
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : 'border-white/10 bg-white/5 text-slate-500'
                  }`}
                >
                  {consejo.activo ? 'Visible' : 'Oculto'}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-slate-600">
                {consejo.situacion && (
                  <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 font-bold text-amber-300">
                    {ETIQUETA_SITUACION[consejo.situacion] ?? consejo.situacion}
                  </span>
                )}
                <span>Orden {consejo.orden}</span>
                <span className="font-mono text-slate-600">· {consejo.id}</span>
                {consejo.updated_at && (
                  <span className="ml-auto">
                    Editado {new Date(consejo.updated_at).toLocaleDateString('es-AR')}
                  </span>
                )}
              </div>

              <div className="mt-4 border-t border-white/5 pt-3">
                <Interruptor
                  activo={Boolean(consejo.activo)}
                  onChange={() => alternarActivo(consejo)}
                  disabled={ocupadoId === consejo.id}
                  etiqueta="Visible en el perfil"
                  descripcion="Se incluye en el carrusel del jugador."
                />
              </div>

              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => abrirEdicion(consejo)}
                  disabled={ocupadoId === consejo.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
                >
                  <EditIcon size={13} />
                  Editar
                </button>
                {porEliminar === consejo.id ? (
                  <span className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => eliminar(consejo.id)}
                      disabled={ocupadoId === consejo.id}
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
                    onClick={() => setPorEliminar(consejo.id)}
                    title="Eliminar consejo"
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
