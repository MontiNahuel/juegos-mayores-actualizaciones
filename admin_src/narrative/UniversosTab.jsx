/* Permite editar universos con sus recursos y reglas iniciales. */
import { useState, useEffect } from 'react';
import {
  CrownIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
  AlertTriangleIcon,
  CoinsIcon,
  RefreshIcon,
  XIcon,
} from '../Icons';
import ImageUploadField from './ImageUploadField';

// Permite editar universos con sus recursos y reglas iniciales.
export default function UniversosTab({ onUniversosChange }) {
  const [universos, setUniversos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  // Modal Crear/Editar
  const [modalAbierto, setModalAbierto] = useState(false);
  const [esEdicion, setEsEdicion] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Campos del formulario
  const [id, setId] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [imagen, setImagen] = useState('/assets/narrative/universos/default.webp');
  const [icono, setIcono] = useState('crown');
  const [recursos, setRecursos] = useState([
    { clave: 'oro', nombre: 'Tesoro Real', icono: 'coins', min: 0, max: 100, inicial: 50 },
    { clave: 'pueblo', nombre: 'Apoyo Popular', icono: 'users', min: 0, max: 100, inicial: 50 },
    { clave: 'ejercito', nombre: 'Fuerza Militar', icono: 'shield', min: 0, max: 100, inicial: 50 },
    { clave: 'fe', nombre: 'Fervor Religioso', icono: 'church', min: 0, max: 100, inicial: 50 },
  ]);

  // Carga universos con los datos de este paso.
  const cargarUniversos = async () => {
    setCargando(true);
    setError('');
    try {
      const res = await fetch('/api/narrative/admin/universos');
      if (res.ok) {
        const data = await res.json();
        setUniversos(data);
        if (onUniversosChange) onUniversosChange(data);
      } else {
        setError('No se pudo cargar la lista de universos.');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión al cargar universos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(/* Sincroniza este efecto cuando cambian los datos de los que depende. */ () => {
    cargarUniversos();
  }, []);

  // Abre el formulario vacío para crear un registro.
  const abrirModalNuevo = () => {
    setEsEdicion(false);
    setId('universo_' + Date.now().toString(36));
    setNombre('');
    setDescripcion('');
    setImagen('/assets/narrative/universos/default.webp');
    setIcono('crown');
    setRecursos([
      { clave: 'oro', nombre: 'Tesoro Real', icono: 'coins', min: 0, max: 100, inicial: 50 },
      { clave: 'pueblo', nombre: 'Apoyo Popular', icono: 'users', min: 0, max: 100, inicial: 50 },
      { clave: 'ejercito', nombre: 'Fuerza Militar', icono: 'shield', min: 0, max: 100, inicial: 50 },
      { clave: 'fe', nombre: 'Fervor Religioso', icono: 'church', min: 0, max: 100, inicial: 50 },
    ]);
    setError('');
    setExito('');
    setModalAbierto(true);
  };

  // Carga el registro en el formulario de edición.
  const abrirModalEditar = (u) => {
    setEsEdicion(true);
    setId(u._id || u.id);
    setNombre(u.nombre || '');
    setDescripcion(u.descripcion || '');
    setImagen(u.imagen || '/assets/narrative/universos/default.webp');
    setIcono(u.icono || 'crown');
    setRecursos(u.recursos && u.recursos.length > 0 ? JSON.parse(JSON.stringify(u.recursos)) : []);
    setError('');
    setExito('');
    setModalAbierto(true);
  };

  // Agrega recurso con los datos de este paso.
  const handleAgregarRecurso = () => {
    setRecursos([
      ...recursos,
      { clave: 'recurso_' + (recursos.length + 1), nombre: 'Nuevo Atributo', icono: 'coins', min: 0, max: 100, inicial: 50 },
    ]);
  };

  // Quita recurso con los datos de este paso.
  const handleEliminarRecurso = (index) => {
    setRecursos(recursos.filter(/* Conserva los elementos que cumplen esta condición. */ (_, idx) => idx !== index));
  };

  // Actualiza recurso con los datos de este paso.
  const handleCambiarRecurso = (index, campo, valor) => {
    const nuevos = [...recursos];
    nuevos[index] = { ...nuevos[index], [campo]: valor };
    setRecursos(nuevos);
  };

  // Valida el formulario y guarda los cambios.
  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!id.trim() || !nombre.trim()) {
      setError('El identificador y el nombre son obligatorios.');
      return;
    }
    if (recursos.length === 0) {
      setError('Debes configurar al menos un recurso para el universo.');
      return;
    }

    setGuardando(true);
    setError('');
    setExito('');

    const payload = {
      _id: id.trim(),
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      icono: icono.trim() || 'crown',
      imagen: imagen.trim() || '/assets/narrative/universos/default.webp',
      recursos: recursos.map(/* Prepara el resultado de cada elemento. */ (r) => ({
        clave: r.clave.trim().toLowerCase(),
        nombre: r.nombre.trim(),
        icono: r.icono || 'coins',
        min: parseInt(r.min, 10) || 0,
        max: parseInt(r.max, 10) || 100,
        inicial: parseInt(r.inicial, 10) || 50,
      })),
    };

    try {
      const res = await fetch('/api/narrative/admin/universos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Error al guardar universo.');
      }

      setExito('Universo guardado correctamente.');
      setTimeout(/* Ejecuta este paso cuando se cumple la espera. */ () => {
        setModalAbierto(false);
        cargarUniversos();
      }, 600);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al procesar la solicitud.');
    } finally {
      setGuardando(false);
    }
  };

  // Pide borrar el registro y actualiza la lista.
  const handleEliminar = async (uId) => {
    if (!confirm(`¿Estás seguro de eliminar el universo "${uId}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/narrative/admin/universos/${uId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        cargarUniversos();
      } else {
        const err = await res.json();
        alert(err.detail || 'No se pudo eliminar el universo.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al eliminar.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado de pestaña */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
              <CrownIcon size={18} />
            </span>
            <h3 className="font-bold text-sm text-slate-900">Universos y Reinos Configurados</h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Define la ambientación, las reglas básicas del reino y los recursos que los jugadores deberán equilibrar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={cargarUniversos}
            disabled={cargando}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
            title="Refrescar lista"
          >
            <RefreshIcon size={16} className={cargando ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={abrirModalNuevo}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#002B5E] hover:bg-slate-900 text-white font-bold text-xs shadow-xs transition cursor-pointer"
          >
            <PlusIcon size={15} />
            <span>Nuevo Universo</span>
          </button>
        </div>
      </div>

      {/* Notificaciones */}
      {error && !modalAbierto && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertTriangleIcon size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Grilla de Universos */}
      {cargando ? (
        <div className="py-12 text-center text-slate-400 text-xs font-semibold">
          Cargando universos...
        </div>
      ) : universos.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-2xl border border-slate-200/80 p-6 text-slate-400 text-xs">
          No hay universos configurados. Haz clic en "Nuevo Universo" para comenzar.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {universos.map(/* Prepara el resultado de cada elemento. */ (u) => {
            const uid = u._id || u.id;
            return (
              <div
                key={uid}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-slate-200 bg-amber-50 flex-shrink-0 flex items-center justify-center shadow-2xs">
                        <img
                          src={u.imagen || '/assets/narrative/universos/default.webp'}
                          alt={u.nombre}
                          onError={/* Responde a error desde este control. */ (e) => {
                            e.target.onerror = null;
                            e.target.src = '/assets/narrative/universos/default.webp';
                          }}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{u.nombre}</h4>
                        <span className="text-[10px] font-mono font-semibold text-slate-400">ID: {uid}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={/* Responde a click desde este control. */ () => abrirModalEditar(u)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                        title="Editar universo"
                      >
                        <EditIcon size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={/* Responde a click desde este control. */ () => handleEliminar(uid)}
                        className="p-1.5 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                        title="Eliminar universo"
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    {u.descripcion || 'Sin descripción detallada.'}
                  </p>

                  {/* Recursos configurados */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Recursos del Reino ({u.recursos?.length || 0})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {(u.recursos || []).map(/* Prepara el resultado de cada elemento. */ (r) => (
                        <div
                          key={r.clave}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-1.5"
                        >
                          <CoinsIcon size={13} className="text-amber-600" />
                          <span className="font-bold text-slate-800">{r.nombre}</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            (ini: {r.inicial} / máx: {r.max})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span>Icono: {u.icono || 'crown'}</span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold text-[10px]">
                    Activo
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL CREAR / EDITAR UNIVERSO */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl w-full max-w-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Cabecera */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <CrownIcon size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {esEdicion ? 'Editar Universo' : 'Crear Nuevo Universo'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Configura los atributos y recursos base del reino.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={/* Responde a click desde este control. */ () => setModalAbierto(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <XIcon size={18} />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleGuardar} className="flex-1 overflow-y-auto p-5 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangleIcon size={15} />
                  <span>{error}</span>
                </div>
              )}
              {exito && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                  <CheckIcon size={15} />
                  <span>{exito}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Identificador Único (ID)
                  </label>
                  <input
                    type="text"
                    value={id}
                    onChange={/* Responde a change desde este control. */ (e) => setId(e.target.value)}
                    disabled={esEdicion}
                    placeholder="ej. corte_medieval"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono font-semibold text-slate-800 disabled:bg-slate-100 disabled:text-slate-500 focus:outline-none focus:border-[#002B5E]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Nombre del Universo
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={/* Responde a change desde este control. */ (e) => setNombre(e.target.value)}
                    placeholder="ej. Crónicas de la Corte Real"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#002B5E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Descripción Narrativa
                </label>
                <textarea
                  rows={2}
                  value={descripcion}
                  onChange={/* Responde a change desde este control. */ (e) => setDescripcion(e.target.value)}
                  placeholder="Describe el contexto del reino..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#002B5E]"
                />
              </div>

              <ImageUploadField
                label="Banner / Ilustración del Universo"
                categoria="universos"
                value={imagen}
                onChange={setImagen}
                helperText="Banner panorámico del universo. Resolución recomendada: 1200x600 px."
              />

              {/* SECCIÓN DE RECURSOS DINÁMICOS */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Recursos del Reino ({recursos.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAgregarRecurso}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#002B5E] hover:underline cursor-pointer"
                  >
                    <PlusIcon size={13} />
                    <span>Agregar Recurso</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {recursos.map(/* Prepara el resultado de cada elemento. */ (r, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-center gap-2 text-xs"
                    >
                      <input
                        type="text"
                        value={r.clave}
                        onChange={/* Responde a change desde este control. */ (e) => handleCambiarRecurso(idx, 'clave', e.target.value)}
                        placeholder="Clave (ej. oro)"
                        className="w-full sm:w-28 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-[11px] font-semibold text-slate-800"
                      />
                      <input
                        type="text"
                        value={r.nombre}
                        onChange={/* Responde a change desde este control. */ (e) => handleCambiarRecurso(idx, 'nombre', e.target.value)}
                        placeholder="Nombre visible"
                        className="w-full sm:flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-800"
                      />
                      <div className="flex items-center gap-1.5 w-full sm:w-auto">
                        <span className="text-[10px] text-slate-400 font-bold">Ini:</span>
                        <input
                          type="number"
                          value={r.inicial}
                          onChange={/* Responde a change desde este control. */ (e) => handleCambiarRecurso(idx, 'inicial', parseInt(e.target.value, 10))}
                          className="w-14 px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] text-center font-bold"
                        />
                        <span className="text-[10px] text-slate-400 font-bold">Máx:</span>
                        <input
                          type="number"
                          value={r.max}
                          onChange={/* Responde a change desde este control. */ (e) => handleCambiarRecurso(idx, 'max', parseInt(e.target.value, 10))}
                          className="w-14 px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] text-center font-bold"
                        />
                        <button
                          type="button"
                          onClick={/* Responde a click desde este control. */ () => handleEliminarRecurso(idx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer ml-auto"
                          title="Quitar recurso"
                        >
                          <TrashIcon size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={/* Responde a click desde este control. */ () => setModalAbierto(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#002B5E] hover:bg-slate-900 text-white font-bold text-xs shadow-xs transition cursor-pointer disabled:opacity-60"
                >
                  <CheckIcon size={14} />
                  <span>{guardando ? 'Guardando...' : esEdicion ? 'Actualizar Universo' : 'Crear Universo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
