/* Administra el catálogo de frecuencias por universo en un documento con array. */
import { useState, useEffect } from 'react';
import {
  ClockIcon,
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

export default function FrecuenciasTab({ universos = [] }) {
  const [universoFiltro, setUniversoFiltro] = useState(universos[0]?._id || universos[0]?.id || 'corte_medieval');
  const [documentoFrec, setDocumentoFrec] = useState(null);
  const [eventosMotor, setEventosMotor] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  // Modal Item Crear/Editar
  const [modalAbierto, setModalAbierto] = useState(false);
  const [esEdicion, setEsEdicion] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Campos item
  const [itemId, setItemId] = useState('');
  const [nombre, setNombre] = useState('');
  const [eventoMotor, setEventoMotor] = useState('inicio_mes');
  const [cada, setCada] = useState(1);
  const [desfase, setDesfase] = useState(0);
  const [conteoDesde, setConteoDesde] = useState('adquisicion');
  const [activo, setActivo] = useState(true);

  // Modal Ver Usos
  const [modalUsosAbierto, setModalUsosAbierto] = useState(false);
  const [usosData, setUsosData] = useState(null);
  const [cargandoUsos, setCargandoUsos] = useState(false);

  useEffect(() => {
    if (universos.length > 0 && !universos.some((u) => (u._id || u.id) === universoFiltro)) {
      setUniversoFiltro(universos[0]._id || universos[0].id);
    }
  }, [universos]);

  const cargarEventosMotor = async () => {
    try {
      const res = await fetch('/api/narrative/admin/eventos-motor');
      if (res.ok) {
        const data = await res.json();
        setEventosMotor(data);
      }
    } catch (e) {
      console.error('Error al cargar eventos motor:', e);
    }
  };

  const cargarFrecuencias = async (universoId) => {
    setCargando(true);
    setError('');
    try {
      const res = await fetch(`/api/narrative/admin/frecuencias?universo_id=${encodeURIComponent(universoId)}`);
      if (res.ok) {
        const data = await res.json();
        setDocumentoFrec(data);
      } else {
        setError('No se pudo cargar el catálogo de frecuencias.');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión al cargar frecuencias.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEventosMotor();
  }, []);

  useEffect(() => {
    if (universoFiltro) {
      cargarFrecuencias(universoFiltro);
    }
  }, [universoFiltro]);

  const abrirModalNuevo = () => {
    setEsEdicion(false);
    setItemId('frec_' + Date.now().toString(36));
    setNombre('');
    setEventoMotor('inicio_mes');
    setCada(1);
    setDesfase(0);
    setConteoDesde('adquisicion');
    setActivo(true);
    setError('');
    setExito('');
    setModalAbierto(true);
  };

  const abrirModalEditar = (item) => {
    setEsEdicion(true);
    setItemId(item.id);
    setNombre(item.nombre);
    setEventoMotor(item.evento_motor);
    setCada(item.cada || 1);
    setDesfase(item.desfase || 0);
    setConteoDesde(item.conteo_desde || 'adquisicion');
    setActivo(item.activo !== undefined ? item.activo : true);
    setError('');
    setExito('');
    setModalAbierto(true);
  };

  const handleGuardarItem = async (e) => {
    e.preventDefault();
    if (!itemId.trim() || !nombre.trim()) {
      setError('El identificador y el nombre de la frecuencia son obligatorios.');
      return;
    }
    setGuardando(true);
    setError('');
    setExito('');

    const itemsActuales = [...(documentoFrec?.items || [])];
    const nuevoItem = {
      id: itemId.trim(),
      nombre: nombre.trim(),
      evento_motor: eventoMotor,
      cada: eventoMotor === 'inicio_mes' ? parseInt(cada, 10) || 1 : 1,
      desfase: eventoMotor === 'inicio_mes' ? parseInt(desfase, 10) || 0 : 0,
      conteo_desde: conteoDesde,
      activo: activo,
    };

    let nuevosItems;
    if (esEdicion) {
      nuevosItems = itemsActuales.map((it) => (it.id === itemId ? nuevoItem : it));
    } else {
      if (itemsActuales.some((it) => it.id === nuevoItem.id)) {
        setError(`Ya existe una frecuencia con el ID '${nuevoItem.id}'.`);
        setGuardando(false);
        return;
      }
      nuevosItems = [...itemsActuales, nuevoItem];
    }

    try {
      const res = await fetch(`/api/narrative/admin/frecuencias/${encodeURIComponent(universoFiltro)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: nuevosItems,
          expected_version: documentoFrec?.version,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Error al guardar frecuencias.');
      }

      setExito('Frecuencias actualizadas exitosamente.');
      setModalAbierto(false);
      cargarFrecuencias(universoFiltro);
    } catch (err) {
      setError(err.message || 'Error inesperado al guardar.');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarItem = async (idAEliminar) => {
    if (!window.confirm(`¿Seguro que deseas eliminar la frecuencia "${idAEliminar}"?`)) return;
    setError('');
    setExito('');

    // Verificar usos antes de eliminar
    try {
      const resUsos = await fetch(`/api/narrative/admin/frecuencias/${encodeURIComponent(idAEliminar)}/usos?universo_id=${encodeURIComponent(universoFiltro)}`);
      if (resUsos.ok) {
        const dataUsos = await resUsos.json();
        if (dataUsos.total_usos > 0) {
          setError(`No se puede eliminar la frecuencia "${idAEliminar}" porque está en uso por ${dataUsos.total_usos} entidad(es). Desactívala en su lugar.`);
          return;
        }
      }

      const nuevosItems = (documentoFrec?.items || []).filter((it) => it.id !== idAEliminar);
      const res = await fetch(`/api/narrative/admin/frecuencias/${encodeURIComponent(universoFiltro)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: nuevosItems,
          expected_version: documentoFrec?.version,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Error al eliminar frecuencia.');
      }

      setExito('Frecuencia eliminada.');
      cargarFrecuencias(universoFiltro);
    } catch (err) {
      setError(err.message || 'Error al eliminar frecuencia.');
    }
  };

  const verUsos = async (frecId) => {
    setCargandoUsos(true);
    setUsosData(null);
    setModalUsosAbierto(true);
    try {
      const res = await fetch(`/api/narrative/admin/frecuencias/${encodeURIComponent(frecId)}/usos?universo_id=${encodeURIComponent(universoFiltro)}`);
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

  const items = documentoFrec?.items || [];

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <ClockIcon className="text-amber-400" size={22} />
            Catálogo de Frecuencias
          </h2>
          <p className="text-xs text-slate-400">
            Array de periodicidades y disparadores configurables sin modificar código Python.
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
            onClick={() => cargarFrecuencias(universoFiltro)}
            className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 transition"
            title="Recargar frecuencias"
          >
            <RefreshIcon size={16} />
          </button>

          <button
            onClick={abrirModalNuevo}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
          >
            <PlusIcon size={16} />
            Nueva Frecuencia
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

      {/* Grid de Frecuencias */}
      {cargando ? (
        <div className="py-12 text-center text-xs text-slate-500">Cargando catálogo de frecuencias...</div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center rounded-2xl border border-dashed border-white/10 bg-slate-900/20">
          <ClockIcon className="mx-auto text-slate-600 mb-2" size={32} />
          <p className="text-sm font-semibold text-slate-400">No hay frecuencias configuradas para este universo</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`relative flex flex-col justify-between rounded-2xl border p-4 transition ${
                item.activo
                  ? 'border-white/10 bg-slate-900/40 hover:border-amber-500/30'
                  : 'border-white/5 bg-slate-950/40 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white">{item.nombre}</h3>
                    <p className="font-mono text-[10px] text-amber-400/80">{item.id}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      item.activo ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700/40 text-slate-400'
                    }`}
                  >
                    {item.activo ? 'Activa' : 'Inactiva'}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Evento motor:</span>
                    <span className="font-semibold text-amber-300">{item.evento_motor}</span>
                  </div>

                  {item.evento_motor === 'inicio_mes' && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Intervalo:</span>
                        <span className="font-medium text-slate-200">Cada {item.cada} mes(es)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Conteo desde:</span>
                        <span className="font-medium text-slate-200">
                          {item.conteo_desde === 'adquisicion' ? 'Adquisición de carta' : 'Inicio de partida'}
                        </span>
                      </div>
                      {item.desfase > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Desfase inicial:</span>
                          <span className="font-medium text-slate-200">{item.desfase} mes(es)</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                <button
                  onClick={() => verUsos(item.id)}
                  className="text-[11px] font-semibold text-slate-400 hover:text-amber-400 transition"
                >
                  Ver referencias
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => abrirModalEditar(item)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                    title="Editar frecuencia"
                  >
                    <EditIcon size={14} />
                  </button>
                  <button
                    onClick={() => handleEliminarItem(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="Eliminar frecuencia"
                  >
                    <TrashIcon size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear / Editar Frecuencia */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-base font-bold text-white">
                {esEdicion ? 'Editar Frecuencia' : 'Nueva Frecuencia'}
              </h3>
              <button
                onClick={() => setModalAbierto(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white"
              >
                <XIcon size={18} />
              </button>
            </div>

            <form onSubmit={handleGuardarItem} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400">Identificador (ID)</label>
                <input
                  type="text"
                  value={itemId}
                  onChange={(e) => setItemId(e.target.value)}
                  disabled={esEdicion}
                  placeholder="ej: cada_2_meses"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 font-mono text-xs text-white focus:border-amber-500/60 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400">Nombre Legible</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="ej: Cada 2 meses desde adquisición"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-white focus:border-amber-500/60 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400">Evento de Motor</label>
                <select
                  value={eventoMotor}
                  onChange={(e) => setEventoMotor(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs font-semibold text-white focus:border-amber-500/60 focus:outline-none"
                >
                  {eventosMotor.map((ev) => (
                    <option key={ev.evento_motor} value={ev.evento_motor}>
                      {ev.nombre} ({ev.evento_motor})
                    </option>
                  ))}
                </select>
              </div>

              {eventoMotor === 'inicio_mes' && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/40 border border-white/5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400">Intervalo (meses)</label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={cada}
                      onChange={(e) => setCada(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-white font-bold text-center focus:border-amber-500/60 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400">Desfase (meses)</label>
                    <input
                      type="number"
                      min={0}
                      max={12}
                      value={desfase}
                      onChange={(e) => setDesfase(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-white font-bold text-center focus:border-amber-500/60 focus:outline-none"
                    />
                  </div>

                  <div className="col-span-2 mt-1">
                    <label className="block text-xs font-semibold text-slate-400">Base de cálculo</label>
                    <select
                      value={conteoDesde}
                      onChange={(e) => setConteoDesde(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs font-semibold text-white focus:border-amber-500/60 focus:outline-none"
                    >
                      <option value="adquisicion">Mes en que se adquiere la carta/personaje</option>
                      <option value="inicio_partida">Mes 1 (inicio absoluto de la partida)</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="chk_frec_activo"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="rounded border-white/20 bg-slate-950 text-amber-500"
                />
                <label htmlFor="chk_frec_activo" className="text-xs font-semibold text-slate-300">
                  Frecuencia activa para selección en cartas y personajes
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
                  {guardando ? 'Guardando...' : esEdicion ? 'Actualizar Frecuencia' : 'Crear Frecuencia'}
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
              <h3 className="text-base font-bold text-white">Referencias de la Frecuencia</h3>
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
                  Esta frecuencia no está referenciada por ninguna carta ni personaje actualmente.
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
