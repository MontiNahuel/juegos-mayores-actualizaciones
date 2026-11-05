/* Administra el catálogo desacoplado de acciones por universo. */
import { useState, useEffect } from 'react';
import {
  SparklesIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
  AlertTriangleIcon,
  RefreshIcon,
  XIcon,
  LayersIcon,
  UsersIcon,
} from '../Icons';

export default function AccionesTab({ universos = [] }) {
  const [universoFiltro, setUniversoFiltro] = useState(universos[0]?._id || universos[0]?.id || 'corte_medieval');
  const [acciones, setAcciones] = useState([]);
  const [operaciones, setOperaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  // Modal Crear/Editar
  const [modalAbierto, setModalAbierto] = useState(false);
  const [esEdicion, setEsEdicion] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Campos formulario
  const [id, setId] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [primitiva, setPrimitiva] = useState('modificar_recurso');
  const [permitidoEn, setPermitidoEn] = useState(['carta', 'personaje']);
  const [activo, setActivo] = useState(true);
  const [versionActual, setVersionActual] = useState(1);

  // Modal Ver Usos
  const [modalUsosAbierto, setModalUsosAbierto] = useState(false);
  const [usosData, setUsosData] = useState(null);
  const [cargandoUsos, setCargandoUsos] = useState(false);

  // Sincronizar universo por defecto si se cargan los universos
  useEffect(() => {
    if (universos.length > 0 && !universos.some((u) => (u._id || u.id) === universoFiltro)) {
      setUniversoFiltro(universos[0]._id || universos[0].id);
    }
  }, [universos]);

  // Cargar operaciones/primitivas disponibles
  const cargarOperaciones = async () => {
    try {
      const res = await fetch('/api/narrative/admin/operaciones');
      if (res.ok) {
        const data = await res.json();
        setOperaciones(data);
      }
    } catch (e) {
      console.error('Error al cargar primitivas de motor:', e);
    }
  };

  // Cargar acciones filtradas por universo
  const cargarAcciones = async (universoId) => {
    setCargando(true);
    setError('');
    try {
      const url = universoId
        ? `/api/narrative/admin/acciones?universo_id=${encodeURIComponent(universoId)}`
        : '/api/narrative/admin/acciones';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAcciones(data);
      } else {
        setError('No se pudieron cargar las acciones.');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión al cargar acciones.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarOperaciones();
  }, []);

  useEffect(() => {
    if (universoFiltro) {
      cargarAcciones(universoFiltro);
    }
  }, [universoFiltro]);

  const abrirModalNuevo = () => {
    setEsEdicion(false);
    setId('accion_' + Date.now().toString(36));
    setNombre('');
    setDescripcion('');
    setPrimitiva('modificar_recurso');
    setPermitidoEn(['carta', 'personaje']);
    setActivo(true);
    setVersionActual(1);
    setError('');
    setExito('');
    setModalAbierto(true);
  };

  const abrirModalEditar = (acc) => {
    setEsEdicion(true);
    setId(acc._id || acc.id);
    setNombre(acc.nombre || '');
    setDescripcion(acc.descripcion || '');
    setPrimitiva(acc.primitiva || 'modificar_recurso');
    setPermitidoEn(acc.permitido_en || ['carta', 'personaje']);
    setActivo(acc.activo !== undefined ? acc.activo : true);
    setVersionActual(acc.version || 1);
    setError('');
    setExito('');
    setModalAbierto(true);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!id.trim() || !nombre.trim()) {
      setError('El identificador y el nombre son obligatorios.');
      return;
    }
    setGuardando(true);
    setError('');
    setExito('');

    try {
      let res;
      if (esEdicion) {
        res = await fetch(`/api/narrative/admin/acciones/${encodeURIComponent(id)}?universo_id=${encodeURIComponent(universoFiltro)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: nombre.trim(),
            descripcion: descripcion.trim(),
            primitiva: primitiva,
            permitido_en: permitidoEn,
            activo: activo,
            expected_version: versionActual,
          }),
        });
      } else {
        res = await fetch('/api/narrative/admin/acciones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            _id: id.trim(),
            universo_id: universoFiltro,
            nombre: nombre.trim(),
            descripcion: descripcion.trim(),
            primitiva: primitiva,
            permitido_en: permitidoEn,
            activo: activo,
            version: 1,
          }),
        });
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Error al guardar la acción.');
      }

      setExito(esEdicion ? 'Acción actualizada exitosamente.' : 'Acción creada exitosamente.');
      setModalAbierto(false);
      cargarAcciones(universoFiltro);
    } catch (err) {
      setError(err.message || 'Error inesperado al guardar.');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (accionId) => {
    if (!window.confirm(`¿Seguro que deseas eliminar la acción "${accionId}"?`)) return;
    setError('');
    setExito('');
    try {
      const res = await fetch(`/api/narrative/admin/acciones/${encodeURIComponent(accionId)}?universo_id=${encodeURIComponent(universoFiltro)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'No se pudo eliminar la acción.');
      }
      setExito('Acción eliminada correctamente.');
      cargarAcciones(universoFiltro);
    } catch (err) {
      setError(err.message || 'Error al eliminar acción.');
    }
  };

  const verUsos = async (accionId) => {
    setCargandoUsos(true);
    setUsosData(null);
    setModalUsosAbierto(true);
    try {
      const res = await fetch(`/api/narrative/admin/acciones/${encodeURIComponent(accionId)}/usos`);
      if (res.ok) {
        const data = await res.json();
        setUsosData(data);
      }
    } catch (err) {
      console.error('Error al consultar usos:', err);
    } finally {
      setCargandoUsos(false);
    }
  };

  const togglePermitidoEn = (item) => {
    if (permitidoEn.includes(item)) {
      if (permitidoEn.length > 1) {
        setPermitidoEn(permitidoEn.filter((p) => p !== item));
      }
    } else {
      setPermitidoEn([...permitidoEn, item]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Filtros */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <SparklesIcon className="text-amber-400" size={22} />
            Catálogo de Acciones
          </h2>
          <p className="text-xs text-slate-400">
            Define verbos de mutación desacoplados de cartas y personajes por universo.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={universoFiltro}
            onChange={(e) => setUniversoFiltro(e.target.value)}
            className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-xs font-semibold text-slate-200 focus:border-amber-500/60 focus:outline-none"
          >
            {universos.map((u) => {
              const uid = u._id || u.id;
              return (
                <option key={uid} value={uid}>
                  {u.nombre || uid}
                </option>
              );
            })}
          </select>

          <button
            onClick={() => cargarAcciones(universoFiltro)}
            className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 transition"
            title="Recargar catálogo"
          >
            <RefreshIcon size={16} />
          </button>

          <button
            onClick={abrirModalNuevo}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
          >
            <PlusIcon size={16} />
            Nueva Acción
          </button>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangleIcon size={16} />
          <span>{error}</span>
        </div>
      )}
      {exito && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <CheckIcon size={16} />
          <span>{exito}</span>
        </div>
      )}

      {/* Grid de Acciones */}
      {cargando ? (
        <div className="py-12 text-center text-xs text-slate-500">Cargando catálogo de acciones...</div>
      ) : acciones.length === 0 ? (
        <div className="py-12 text-center rounded-2xl border border-dashed border-white/10 bg-slate-900/20">
          <SparklesIcon className="mx-auto text-slate-600 mb-2" size={32} />
          <p className="text-sm font-semibold text-slate-400">No hay acciones registradas en este universo</p>
          <p className="text-xs text-slate-500 mt-1">Crea una acción para permitir que cartas y personajes la referencien.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {acciones.map((acc) => {
            const accId = acc._id || acc.id;
            const opInfo = operaciones.find((o) => o.primitiva === acc.primitiva);
            return (
              <div
                key={accId}
                className={`relative flex flex-col justify-between rounded-2xl border p-4 transition ${
                  acc.activo
                    ? 'border-white/10 bg-slate-900/40 hover:border-amber-500/30'
                    : 'border-white/5 bg-slate-950/40 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white">{acc.nombre}</h3>
                      <p className="font-mono text-[10px] text-amber-400/80">{accId}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        acc.activo ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700/40 text-slate-400'
                      }`}
                    >
                      {acc.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-400 line-clamp-2">
                    {acc.descripcion || 'Sin descripción.'}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[10px] font-semibold text-blue-300">
                      Primitiva: {opInfo?.nombre || acc.primitiva}
                    </span>
                    {(acc.permitido_en || []).map((perm) => (
                      <span
                        key={perm}
                        className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] font-medium text-slate-400"
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                  <button
                    onClick={() => verUsos(accId)}
                    className="text-[11px] font-semibold text-slate-400 hover:text-amber-400 transition"
                  >
                    Ver referencias
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => abrirModalEditar(acc)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                      title="Editar acción"
                    >
                      <EditIcon size={14} />
                    </button>
                    <button
                      onClick={() => handleEliminar(accId)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Eliminar acción"
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear / Editar Acción */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-base font-bold text-white">
                {esEdicion ? 'Editar Acción' : 'Nueva Acción'}
              </h3>
              <button
                onClick={() => setModalAbierto(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white"
              >
                <XIcon size={18} />
              </button>
            </div>

            <form onSubmit={handleGuardar} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400">Identificador Único (ID)</label>
                <input
                  type="text"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  disabled={esEdicion}
                  placeholder="ej: tributo_real"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 font-mono text-xs text-white focus:border-amber-500/60 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400">Nombre de Catálogo</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="ej: Cobro de Tributo"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-white focus:border-amber-500/60 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400">Descripción</label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={2}
                  placeholder="Explica qué efecto produce esta acción..."
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-white focus:border-amber-500/60 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400">Primitiva del Motor</label>
                <select
                  value={primitiva}
                  onChange={(e) => setPrimitiva(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs font-semibold text-white focus:border-amber-500/60 focus:outline-none"
                >
                  {operaciones.map((op) => (
                    <option key={op.primitiva} value={op.primitiva}>
                      {op.nombre} ({op.primitiva})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-500">
                  {operaciones.find((o) => o.primitiva === primitiva)?.descripcion || ''}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Permitido vincular en</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={permitidoEn.includes('carta')}
                      onChange={() => togglePermitidoEn('carta')}
                      className="rounded border-white/20 bg-slate-950 text-amber-500"
                    />
                    Cartas
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={permitidoEn.includes('personaje')}
                      onChange={() => togglePermitidoEn('personaje')}
                      className="rounded border-white/20 bg-slate-950 text-amber-500"
                    />
                    Personajes
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="chk_activo"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="rounded border-white/20 bg-slate-950 text-amber-500"
                />
                <label htmlFor="chk_activo" className="text-xs font-semibold text-slate-300">
                  Acción activa y disponible en selectores
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-slate-300 hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : esEdicion ? 'Actualizar Acción' : 'Crear Acción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ver Usos */}
      {modalUsosAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-base font-bold text-white">Referencias de la Acción</h3>
              <button
                onClick={() => setModalUsosAbierto(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white"
              >
                <XIcon size={18} />
              </button>
            </div>

            <div className="mt-4">
              {cargandoUsos ? (
                <p className="text-xs text-slate-400 text-center py-6">Consultando referencias...</p>
              ) : !usosData || usosData.total_usos === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  Esta acción no está referenciada por ninguna carta ni personaje actualmente.
                </p>
              ) : (
                <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                  {usosData.cartas.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <LayersIcon size={14} /> Cartas ({usosData.cartas.length})
                      </p>
                      <ul className="space-y-1.5">
                        {usosData.cartas.map((c) => (
                          <li
                            key={c.id}
                            className="p-2 rounded-lg bg-slate-950/60 border border-white/5 text-xs text-slate-300 flex justify-between"
                          >
                            <span>{c.nombre}</span>
                            <span className="font-mono text-[10px] text-slate-500">{c.id}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {usosData.personajes.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <UsersIcon size={14} /> Personajes ({usosData.personajes.length})
                      </p>
                      <ul className="space-y-1.5">
                        {usosData.personajes.map((p) => (
                          <li
                            key={p.id}
                            className="p-2 rounded-lg bg-slate-950/60 border border-white/5 text-xs text-slate-300 flex justify-between"
                          >
                            <span>{p.nombre}</span>
                            <span className="font-mono text-[10px] text-slate-500">{p.id}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 border-t border-white/5 pt-3 text-right">
              <button
                onClick={() => setModalUsosAbierto(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
