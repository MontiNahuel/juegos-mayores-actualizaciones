/* Permite listar, crear y editar universos narrativos con diseño CogniJuegos. */
import { useState, useEffect } from 'react';
import {
  CrownIcon,
  PlusIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
  AlertTriangleIcon,
  RefreshIcon,
  XIcon,
  CoinsIcon,
} from '../Icons';
import ImageUploadField from './ImageUploadField';
import { textoDelDetalle } from './erroresApi';
import { fetchNarrativeAdmin } from './api';

export default function UniversosTab({ onUniversosChange }) {
  const [universos, setUniversos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Modal Crear/Editar
  const [modalAbierto, setModalAbierto] = useState(false);
  const [esEdicion, setEsEdicion] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Campos del formulario
  const [id, setId] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [imagen, setImagen] = useState('/assets/narrative/universos/corte_medieval.webp');
  const [recursos, setRecursos] = useState([
    { clave: 'oro', nombre: 'Tesoro Real', inicial: 50, max: 100 },
    { clave: 'pueblo', nombre: 'Apoyo Popular', inicial: 50, max: 100 },
    { clave: 'ejercito', nombre: 'Fuerza Militar', inicial: 50, max: 100 },
    { clave: 'fe', nombre: 'Influencia Clerical', inicial: 50, max: 100 },
  ]);

  const cargarUniversos = async () => {
    setCargando(true);
    setError('');
    try {
      const res = await fetchNarrativeAdmin('/api/narrative/admin/universos');
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

  useEffect(() => {
    cargarUniversos();
  }, []);

  const abrirModalNuevo = () => {
    setEsEdicion(false);
    setId('');
    setNombre('');
    setDescripcion('');
    setImagen('/assets/narrative/universos/corte_medieval.webp');
    setRecursos([
      { clave: 'oro', nombre: 'Tesoro Real', inicial: 50, max: 100 },
      { clave: 'pueblo', nombre: 'Apoyo Popular', inicial: 50, max: 100 },
      { clave: 'ejercito', nombre: 'Fuerza Militar', inicial: 50, max: 100 },
      { clave: 'fe', nombre: 'Influencia Clerical', inicial: 50, max: 100 },
    ]);
    setError('');
    setExito('');
    setModalAbierto(true);
  };

  const abrirModalEditar = (u) => {
    setEsEdicion(true);
    setId(u._id || u.id);
    setNombre(u.nombre || '');
    setDescripcion(u.descripcion || '');
    setImagen(u.imagen || '/assets/narrative/universos/corte_medieval.webp');
    setRecursos(u.recursos && u.recursos.length > 0 ? JSON.parse(JSON.stringify(u.recursos)) : []);
    setError('');
    setExito('');
    setModalAbierto(true);
  };

  const handleAgregarRecurso = () => {
    setRecursos([
      ...recursos,
      { clave: 'nuevo_recurso', nombre: 'Nuevo Recurso', inicial: 50, max: 100 },
    ]);
  };

  const handleCambiarRecurso = (idx, campo, valor) => {
    const nuevos = [...recursos];
    nuevos[idx][campo] = valor;
    setRecursos(nuevos);
  };

  const handleEliminarRecurso = (idx) => {
    setRecursos(recursos.filter((_, i) => i !== idx));
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

    const payload = {
      _id: id.trim(),
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      imagen: imagen.trim() || '/assets/narrative/universos/corte_medieval.webp',
      recursos: recursos.map((r) => ({
        clave: r.clave.trim(),
        nombre: r.nombre.trim(),
        inicial: parseInt(r.inicial, 10) || 50,
        max: parseInt(r.max, 10) || 100,
      })),
      variables: {},
    };

    try {
      const res = await fetchNarrativeAdmin('/api/narrative/admin/universos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(textoDelDetalle(err.detail, 'Error al guardar universo.'));
      }

      setExito('Universo guardado correctamente.');
      setTimeout(() => {
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

  const handleEliminar = async (uId) => {
    if (!confirm(`¿Estás seguro de eliminar el universo "${uId}"? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await fetchNarrativeAdmin(`/api/narrative/admin/universos/${uId}`, {
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

  const universosFiltrados = universos.filter((u) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      (u.nombre && u.nombre.toLowerCase().includes(q)) ||
      (u._id && u._id.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Barra de Filtros y Acciones (#2a394c con borde #52647b) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#2a394c] p-3.5 sm:p-4 rounded-[16px] border border-[#52647b]">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c0cbd7]" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar universo por nombre o ID..."
              className="pl-8.5 pr-3 py-2 rounded-[9px] border border-[#52647b] bg-[#1b2737] text-xs text-[#f3f6fa] placeholder:text-[#c0cbd7]/70 focus:outline-none focus:border-[#ecd098] focus:ring-1 focus:ring-[#ecd098] w-64 sm:w-80 transition"
            />
          </div>
          <span className="hidden xl:inline-block text-[11px] font-medium text-[#c0cbd7] pl-1">
            {universosFiltrados.length} {universosFiltrados.length === 1 ? 'universo' : 'universos'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={cargarUniversos}
            disabled={cargando}
            className="p-2 rounded-[9px] border border-[#52647b] bg-[#1b2737] hover:bg-[#2e3c50] text-[#c0cbd7] hover:text-[#f3f6fa] transition cursor-pointer"
            title="Refrescar lista"
          >
            <RefreshIcon size={16} className={cargando ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={abrirModalNuevo}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[9px] bg-[#ecd098] hover:bg-[#f6deb0] text-[#172433] font-bold text-xs transition cursor-pointer"
          >
            <PlusIcon size={15} />
            <span>Nuevo Universo</span>
          </button>
        </div>
      </div>

      {/* Grilla de Universos */}
      {cargando ? (
        <div className="py-16 text-center text-[#c0cbd7] text-xs font-semibold">
          Cargando universos disponibles...
        </div>
      ) : universosFiltrados.length === 0 ? (
        <div className="py-16 text-center bg-[#2a394c] rounded-[16px] border border-[#52647b] p-8 text-[#c0cbd7] text-xs">
          No se encontraron universos. Haz clic en "Nuevo Universo" para crear el primero.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {universosFiltrados.map((u) => {
            const uid = u._id || u.id;
            return (
              <div
                key={uid}
                className="bg-[#2e3c50] rounded-[16px] border border-[#52647b] hover:border-[#ecd098]/70 overflow-hidden transition-colors duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Banner / Ilustración panorámica */}
                  <div className="relative h-40 bg-[#1b2737] border-b border-[#364454] overflow-hidden">
                    <img
                      src={u.imagen || '/assets/narrative/universos/corte_medieval.webp'}
                      alt={u.nombre}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/assets/narrative/universos/corte_medieval.webp';
                      }}
                      className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#151e2b]/95 via-[#151e2b]/30 to-transparent" />
                    
                    <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono text-[#ecd098] bg-[#1b2737]/85 border border-[#52647b] px-2 py-0.5 rounded-[5px] inline-block mb-1">
                          {uid}
                        </span>
                        <h4 className="font-bold text-base text-[#f3f6fa] truncate drop-shadow-sm">{u.nombre}</h4>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => abrirModalEditar(u)}
                          className="p-1.5 rounded-[9px] border border-[#52647b] bg-[#1b2737]/90 hover:bg-[#2a394c] text-[#c0cbd7] hover:text-[#f3f6fa] transition cursor-pointer"
                          title="Editar universo"
                        >
                          <EditIcon size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminar(uid)}
                          className="p-1.5 rounded-[9px] border border-[#52647b] bg-[#1b2737]/90 hover:bg-[#2a394c] hover:border-[#f0bb98] text-[#f0bb98] transition cursor-pointer"
                          title="Eliminar universo"
                        >
                          <TrashIcon size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Cuerpo de la tarjeta */}
                  <div className="p-5 space-y-3.5">
                    <p className="text-xs text-[#c0cbd7] leading-relaxed line-clamp-3">
                      {u.descripcion || 'Sin descripción narrativa.'}
                    </p>

                    {/* Recursos del universo */}
                    <div className="pt-3 border-t border-[#364454] space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#ecd098] flex items-center gap-1.5">
                        <CoinsIcon size={13} className="text-[#ecd098]" />
                        Recursos Base del Reino ({u.recursos?.length || 0})
                      </span>

                      <div className="grid grid-cols-2 gap-2">
                        {(u.recursos || []).map((r, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-[8px] bg-[#1b2737] border border-[#52647b]/50 text-xs flex flex-col justify-between"
                          >
                            <span className="font-bold text-[11px] text-[#f3f6fa] truncate">{r.nombre}</span>
                            <div className="flex items-center justify-between text-[10px] text-[#c0cbd7] mt-1 font-mono">
                              <span>Ini: {r.inicial}</span>
                              <span className="text-[#ecd098]">Máx: {r.max}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3 border-t border-[#364454] bg-[#1b2737]/60 flex items-center justify-between text-[11px] text-[#c0cbd7]">
                  <span>Motor V2 Activo</span>
                  <span className="w-2 h-2 rounded-full bg-[#99dcd1]" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL CREAR / EDITAR UNIVERSO (Horizontal Full-Width) */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-[#151e2b]/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 lg:p-8 overflow-y-auto">
          <div className="bg-[#2a394c] rounded-[16px] border border-[#52647b] shadow-2xl w-full max-w-5xl xl:max-w-6xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Cabecera */}
            <div className="px-6 py-4 border-b border-[#364454] bg-[#1b2737] flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-[9px] bg-[#2a394c] border border-[#52647b] text-[#ecd098] flex items-center justify-center shrink-0">
                  <CrownIcon size={20} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm sm:text-base text-[#f3f6fa] truncate">
                      {esEdicion ? `Editar Universo: ${nombre || id}` : 'Crear Nuevo Universo'}
                    </h3>
                    <span className="font-mono text-[10px] bg-[#2a394c] border border-[#52647b] px-2 py-0.5 rounded-[6px] text-[#c0cbd7]">
                      {id || 'nuevo'}
                    </span>
                  </div>
                  <p className="text-xs text-[#c0cbd7] mt-0.5">Configura los atributos y recursos base del reino.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="p-2 rounded-[9px] text-[#c0cbd7] hover:text-[#f3f6fa] hover:bg-[#2a394c] transition cursor-pointer"
                title="Cerrar modal (Esc)"
              >
                <XIcon size={18} />
              </button>
            </div>

            {/* Formulario horizontal organizado */}
            <form onSubmit={handleGuardar} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {error && (
                <div className="p-3.5 rounded-[9px] bg-[#1b2737] border border-[#f0bb98] text-[#f0bb98] text-xs font-semibold flex items-center gap-2.5">
                  <AlertTriangleIcon size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {exito && (
                <div className="p-3.5 rounded-[9px] bg-[#1b2737] border border-[#99dcd1] text-[#99dcd1] text-xs font-semibold flex items-center gap-2.5">
                  <CheckIcon size={16} className="shrink-0" />
                  <span>{exito}</span>
                </div>
              )}

              {/* BLOQUE 1: IDENTIDAD Y BANNER */}
              <div className="p-5 sm:p-6 rounded-[16px] border border-[#52647b] bg-[#2e3c50] space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#364454]">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#ecd098] flex items-center gap-2">
                    <CrownIcon size={14} />
                    Identidad y Banner del Universo
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  {/* Banner a la izquierda */}
                  <div className="md:col-span-5 lg:col-span-4 flex justify-center md:justify-start">
                    <ImageUploadField
                      label="Banner Panorámico del Universo"
                      categoria="universos"
                      value={imagen}
                      onChange={setImagen}
                    />
                  </div>

                  {/* Campos a la derecha */}
                  <div className="md:col-span-7 lg:col-span-8 space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-[#c0cbd7] uppercase tracking-wider mb-1">
                          Identificador Único (ID)
                        </label>
                        <input
                          type="text"
                          value={id}
                          onChange={(e) => setId(e.target.value)}
                          disabled={esEdicion}
                          placeholder="ej. corte_medieval"
                          className="w-full px-3 py-2 rounded-[9px] border border-[#52647b] bg-[#1b2737] text-xs font-mono font-semibold text-[#f3f6fa] disabled:opacity-50 focus:outline-none focus:border-[#ecd098] focus:ring-1 focus:ring-[#ecd098]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#c0cbd7] uppercase tracking-wider mb-1">
                          Nombre del Universo
                        </label>
                        <input
                          type="text"
                          value={nombre}
                          onChange={(e) => setNombre(e.target.value)}
                          placeholder="ej. Crónicas de la Corte Real"
                          className="w-full px-3 py-2 rounded-[9px] border border-[#52647b] bg-[#1b2737] text-xs font-bold text-[#f3f6fa] focus:outline-none focus:border-[#ecd098] focus:ring-1 focus:ring-[#ecd098]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#c0cbd7] uppercase tracking-wider mb-1">
                        Descripción Narrativa
                      </label>
                      <textarea
                        rows={3}
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        placeholder="Describe el contexto del reino, la ambientación histórica o fantástica y los desafíos..."
                        className="w-full px-3 py-2 rounded-[9px] border border-[#52647b] bg-[#1b2737] text-xs text-[#f3f6fa] focus:outline-none focus:border-[#ecd098] focus:ring-1 focus:ring-[#ecd098] leading-relaxed resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* BLOQUE 2: RECURSOS DEL REINO */}
              <div className="p-5 sm:p-6 rounded-[16px] border border-[#52647b] bg-[#2e3c50] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#364454]">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#ecd098] flex items-center gap-1.5">
                    <CoinsIcon size={14} className="text-[#ecd098]" />
                    Recursos del Reino ({recursos.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAgregarRecurso}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] bg-[#ecd098]/15 hover:bg-[#ecd098]/25 text-[#ecd098] border border-[#ecd098]/30 text-xs font-bold transition cursor-pointer"
                  >
                    <PlusIcon size={13} />
                    <span>Agregar Recurso</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {recursos.map((r, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-[10px] border border-[#52647b]/40 bg-[#1b2737] flex flex-col sm:flex-row items-center gap-3 text-xs"
                    >
                      <div className="w-full sm:w-36">
                        <label className="block text-[9px] uppercase font-bold text-[#c0cbd7] mb-0.5">Clave técnica</label>
                        <input
                          type="text"
                          value={r.clave}
                          onChange={(e) => handleCambiarRecurso(idx, 'clave', e.target.value)}
                          placeholder="ej. oro"
                          className="w-full px-2.5 py-1.5 rounded-[7px] border border-[#52647b] bg-[#151e2b] font-mono text-[11px] font-semibold text-[#f3f6fa]"
                        />
                      </div>

                      <div className="w-full sm:flex-1">
                        <label className="block text-[9px] uppercase font-bold text-[#c0cbd7] mb-0.5">Nombre visible</label>
                        <input
                          type="text"
                          value={r.nombre}
                          onChange={(e) => handleCambiarRecurso(idx, 'nombre', e.target.value)}
                          placeholder="ej. Tesoro Real"
                          className="w-full px-2.5 py-1.5 rounded-[7px] border border-[#52647b] bg-[#151e2b] text-[11px] font-bold text-[#f3f6fa]"
                        />
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-[#c0cbd7] mb-0.5">Inicial</label>
                          <input
                            type="number"
                            value={r.inicial}
                            onChange={(e) => handleCambiarRecurso(idx, 'inicial', parseInt(e.target.value, 10))}
                            className="w-16 px-2 py-1.5 rounded-[7px] border border-[#52647b] bg-[#151e2b] text-[11px] text-center font-bold text-[#f3f6fa]"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] uppercase font-bold text-[#c0cbd7] mb-0.5">Máximo</label>
                          <input
                            type="number"
                            value={r.max}
                            onChange={(e) => handleCambiarRecurso(idx, 'max', parseInt(e.target.value, 10))}
                            className="w-16 px-2 py-1.5 rounded-[7px] border border-[#52647b] bg-[#151e2b] text-[11px] text-center font-bold text-[#ecd098]"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleEliminarRecurso(idx)}
                          className="p-1.5 rounded-[7px] text-[#c0cbd7] hover:text-[#f0bb98] hover:bg-[#2a394c] transition cursor-pointer mt-3"
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
              <div className="pt-4 border-t border-[#364454] bg-[#1b2737] -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-4 sm:p-5 flex items-center justify-between gap-3 shrink-0 rounded-b-[16px]">
                <span className="text-[11px] text-[#c0cbd7] hidden sm:inline-block">
                  Las mutaciones de recursos se aplican a todas las partidas activas del universo.
                </span>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setModalAbierto(false)}
                    className="px-4 py-2 rounded-[9px] border border-[#52647b] bg-[#2a394c] hover:bg-[#2e3c50] text-[#f3f6fa] font-bold text-xs transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardando}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-[9px] bg-[#ecd098] hover:bg-[#f6deb0] text-[#172433] font-bold text-xs transition cursor-pointer disabled:opacity-60"
                  >
                    <CheckIcon size={14} />
                    <span>{guardando ? 'Guardando...' : esEdicion ? 'Actualizar Universo' : 'Crear Universo'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
