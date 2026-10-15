import { useState, useEffect } from 'react';
import {
  UserIcon,
  PlusIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
  AlertTriangleIcon,
  HeartIcon,
  RefreshIcon,
  XIcon,
  FilterIcon,
  CoinsIcon,
} from '../Icons';

export default function PersonajesTab({ universos = [] }) {
  const [personajes, setPersonajes] = useState([]);
  const [universoFiltro, setUniversoFiltro] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  // Modal Crear/Editar
  const [modalAbierto, setModalAbierto] = useState(false);
  const [esEdicion, setEsEdicion] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Campos del formulario
  const [id, setId] = useState('');
  const [universoId, setUniversoId] = useState('');
  const [nombre, setNombre] = useState('');
  const [titulo, setTitulo] = useState('');
  const [imagen, setImagen] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [afinidadInicial, setAfinidadInicial] = useState(50);
  const [tagsInput, setTagsInput] = useState('');
  const [prosInput, setProsInput] = useState('');
  const [consInput, setConsInput] = useState('');
  const [efectos, setEfectos] = useState([]);

  const cargarPersonajes = async (uId = universoFiltro) => {
    setCargando(true);
    setError('');
    try {
      const url = uId
        ? `/api/narrative/admin/personajes?universo_id=${encodeURIComponent(uId)}`
        : '/api/narrative/admin/personajes';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPersonajes(data);
      } else {
        setError('No se pudo cargar la lista de personajes.');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión al cargar personajes.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPersonajes(universoFiltro);
  }, [universoFiltro]);

  const abrirModalNuevo = () => {
    setEsEdicion(false);
    setId('pj_' + Date.now().toString(36));
    setUniversoId(universoFiltro || universos[0]?._id || universos[0]?.id || 'corte_medieval');
    setNombre('');
    setTitulo('');
    setImagen('/assets/narrative/characters/default.webp');
    setDescripcion('');
    setAfinidadInicial(50);
    setTagsInput('');
    setProsInput('');
    setConsInput('');
    setEfectos([]);
    setError('');
    setExito('');
    setModalAbierto(true);
  };

  const abrirModalEditar = (p) => {
    setEsEdicion(true);
    setId(p._id || p.id);
    setUniversoId(p.universo_id || '');
    setNombre(p.nombre || '');
    setTitulo(p.titulo || '');
    setImagen(p.imagen || '');
    setDescripcion(p.descripcion || '');
    setAfinidadInicial(p.afinidad_inicial !== undefined ? p.afinidad_inicial : 50);
    setTagsInput((p.tags || []).join(', '));
    setProsInput((p.pros || []).join('\n'));
    setConsInput((p.cons || []).join('\n'));
    setEfectos(p.efectos && p.efectos.length > 0 ? JSON.parse(JSON.stringify(p.efectos)) : []);
    setError('');
    setExito('');
    setModalAbierto(true);
  };

  const handleAgregarEfecto = () => {
    setEfectos([
      ...efectos,
      {
        disparador: 'cada_mes',
        condiciones: [],
        accion: { tipo: 'modificar_recurso', clave: 'oro', valor: 10, tipo_calculo: 'fijo' },
      },
    ]);
  };

  const handleCambiarEfecto = (index, campo, valor) => {
    const nuevos = [...efectos];
    if (campo === 'disparador') {
      nuevos[index].disparador = valor;
    } else {
      nuevos[index].accion = { ...nuevos[index].accion, [campo]: valor };
    }
    setEfectos(nuevos);
  };

  const handleEliminarEfecto = (index) => {
    setEfectos(efectos.filter((_, idx) => idx !== index));
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!id.trim() || !nombre.trim() || !universoId.trim()) {
      setError('El identificador, el nombre y el universo son obligatorios.');
      return;
    }

    setGuardando(true);
    setError('');
    setExito('');

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const pros = prosInput
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean);

    const cons = consInput
      .split('\n')
      .map((c) => c.trim())
      .filter(Boolean);

    const payload = {
      _id: id.trim(),
      universo_id: universoId.trim(),
      nombre: nombre.trim(),
      titulo: titulo.trim(),
      imagen: imagen.trim() || '/assets/narrative/characters/default.webp',
      descripcion: descripcion.trim(),
      pros: pros,
      cons: cons,
      tags: tags,
      afinidad_inicial: parseInt(afinidadInicial, 10) || 50,
      efectos: efectos.map((ef) => ({
        disparador: ef.disparador,
        condiciones: [],
        accion: {
          tipo: ef.accion.tipo || 'modificar_recurso',
          clave: ef.accion.clave || 'oro',
          valor: parseFloat(ef.accion.valor) || 0,
          tipo_calculo: ef.accion.tipo_calculo || 'fijo',
          tag: ef.accion.tag || null,
        },
      })),
      conversaciones: [],
    };

    try {
      const res = await fetch('/api/narrative/admin/personajes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Error al guardar personaje.');
      }

      setExito('Personaje guardado correctamente.');
      setTimeout(() => {
        setModalAbierto(false);
        cargarPersonajes(universoFiltro);
      }, 600);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al procesar la solicitud.');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (pId) => {
    if (!confirm(`¿Estás seguro de eliminar el personaje "${pId}"?`)) return;
    try {
      const res = await fetch(`/api/narrative/admin/personajes/${pId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        cargarPersonajes(universoFiltro);
      } else {
        const err = await res.json();
        alert(err.detail || 'No se pudo eliminar el personaje.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al eliminar.');
    }
  };

  const personajesFiltrados = personajes.filter((p) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      (p.nombre && p.nombre.toLowerCase().includes(q)) ||
      (p.titulo && p.titulo.toLowerCase().includes(q)) ||
      (p._id && p._id.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Barra de Filtros y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector de Universo */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs">
            <FilterIcon size={14} className="text-slate-500" />
            <select
              value={universoFiltro}
              onChange={(e) => setUniversoFiltro(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="">Todos los Universos</option>
              {universos.map((u) => (
                <option key={u._id || u.id} value={u._id || u.id}>
                  {u.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Buscador */}
          <div className="relative">
            <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o rol..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#002B5E] w-48 sm:w-60"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => cargarPersonajes(universoFiltro)}
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
            <span>Nuevo Personaje</span>
          </button>
        </div>
      </div>

      {/* Grilla de Personajes */}
      {cargando ? (
        <div className="py-12 text-center text-slate-400 text-xs font-semibold">
          Cargando personajes de la corte...
        </div>
      ) : personajesFiltrados.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-2xl border border-slate-200/80 p-6 text-slate-400 text-xs">
          No se encontraron personajes. Haz clic en "Nuevo Personaje" para crear uno.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {personajesFiltrados.map((p) => {
            const pid = p._id || p.id;
            return (
              <div
                key={pid}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
              >
                <div>
                  {/* Encabezado de la Tarjeta */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 flex-shrink-0 overflow-hidden font-bold">
                        <UserIcon size={22} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 leading-tight">{p.nombre}</h4>
                        <span className="text-[11px] font-semibold text-amber-700 block mt-0.5">
                          {p.titulo || 'Consejero Real'}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400">ID: {pid}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => abrirModalEditar(p)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                        title="Editar personaje"
                      >
                        <EditIcon size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEliminar(pid)}
                        className="p-1.5 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                        title="Eliminar personaje"
                      >
                        <TrashIcon size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Afinidad Inicial & Universo */}
                  <div className="flex items-center gap-2 mt-3.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold">
                      <HeartIcon size={13} />
                      <span>Afinidad base: {p.afinidad_inicial}%</span>
                    </span>
                    <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-lg font-mono text-slate-600">
                      {p.universo_id}
                    </span>
                  </div>

                  {/* Descripción */}
                  <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
                    {p.descripcion || 'Sin descripción.'}
                  </p>

                  {/* Pros y Contras */}
                  <div className="mt-3 space-y-1.5 pt-2.5 border-t border-slate-100 text-[11px]">
                    {(p.pros || []).slice(0, 2).map((pro, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-emerald-700">
                        <CheckIcon size={13} className="flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{pro}</span>
                      </div>
                    ))}
                    {(p.cons || []).slice(0, 2).map((con, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-rose-600">
                        <AlertTriangleIcon size={13} className="flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{con}</span>
                      </div>
                    ))}
                  </div>

                  {/* Efectos pasivos */}
                  {p.efectos && p.efectos.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                      {p.efectos.map((ef, idx) => {
                        const a = ef.accion || {};
                        return (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60"
                          >
                            <CoinsIcon size={11} />
                            <span>
                              {ef.disparador}: {a.clave} {a.valor > 0 ? `+${a.valor}` : a.valor}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-1">
                  {(p.tags || []).map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-100 font-mono text-[10px] text-slate-600 font-semibold"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL CREAR / EDITAR PERSONAJE */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl w-full max-w-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Cabecera */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <UserIcon size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {esEdicion ? 'Editar Personaje de Corte' : 'Nuevo Personaje de Corte'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Configura identidad, lealtad y pasivas en el consejo.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalAbierto(false)}
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    ID Personaje
                  </label>
                  <input
                    type="text"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    disabled={esEdicion}
                    placeholder="ej. pj_canciller_elena"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono font-semibold text-slate-800 disabled:bg-slate-100 disabled:text-slate-500 focus:outline-none focus:border-[#002B5E]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Universo
                  </label>
                  <select
                    value={universoId}
                    onChange={(e) => setUniversoId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-[#002B5E]"
                  >
                    {universos.map((u) => (
                      <option key={u._id || u.id} value={u._id || u.id}>
                        {u.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Afinidad Inicial
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={afinidadInicial}
                      onChange={(e) => setAfinidadInicial(parseInt(e.target.value, 10))}
                      className="flex-1"
                    />
                    <span className="w-10 text-center font-bold text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg py-1">
                      {afinidadInicial}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="ej. Elena de Valoria"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-[#002B5E]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Título o Cargo en Corte
                  </label>
                  <input
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="ej. Canciller del Reino"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#002B5E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Descripción del Personaje
                </label>
                <textarea
                  rows={2}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Personalidad, antecedentes e inclinación política..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#002B5E]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Ventajas / Pros (una por línea)
                  </label>
                  <textarea
                    rows={2}
                    value={prosInput}
                    onChange={(e) => setProsInput(e.target.value)}
                    placeholder="+15% de oro en eventos comerciales&#10;Desbloquea opciones diplomáticas"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 font-mono text-[11px] focus:outline-none focus:border-[#002B5E]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Desventajas / Contras (una por línea)
                  </label>
                  <textarea
                    rows={2}
                    value={consInput}
                    onChange={(e) => setConsInput(e.target.value)}
                    placeholder="-5 de apoyo popular cuando se priorizan tropas"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 font-mono text-[11px] focus:outline-none focus:border-[#002B5E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Tags Temáticos (separados por coma)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="ej. diplomacia, comercio, noble"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-800 focus:outline-none focus:border-[#002B5E]"
                />
              </div>

              {/* SECCIÓN DE EFECTOS PASIVOS */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Efectos Pasivos de Regla ({efectos.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAgregarEfecto}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#002B5E] hover:underline cursor-pointer"
                  >
                    <PlusIcon size={13} />
                    <span>Agregar Efecto</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {efectos.map((ef, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-center gap-2 text-xs"
                    >
                      <select
                        value={ef.disparador}
                        onChange={(e) => handleCambiarEfecto(idx, 'disparador', e.target.value)}
                        className="w-full sm:w-36 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-[11px] text-slate-800"
                      >
                        <option value="cada_mes">Cada Mes</option>
                        <option value="al_obtener">Al Reclutar</option>
                        <option value="al_final_partida">Al Finalizar</option>
                      </select>

                      <select
                        value={ef.accion?.clave || 'oro'}
                        onChange={(e) => handleCambiarEfecto(idx, 'clave', e.target.value)}
                        className="w-full sm:w-28 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-[11px] text-slate-800"
                      >
                        <option value="oro">Oro</option>
                        <option value="pueblo">Pueblo</option>
                        <option value="ejercito">Ejército</option>
                        <option value="fe">Fe</option>
                      </select>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-[11px] text-slate-500 font-bold">Delta:</span>
                        <input
                          type="number"
                          value={ef.accion?.valor ?? 10}
                          onChange={(e) => handleCambiarEfecto(idx, 'valor', parseFloat(e.target.value))}
                          className="w-20 px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-center"
                        />
                        <button
                          type="button"
                          onClick={() => handleEliminarEfecto(idx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer ml-auto"
                          title="Quitar efecto"
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
                  onClick={() => setModalAbierto(false)}
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
                  <span>{guardando ? 'Guardando...' : esEdicion ? 'Actualizar Personaje' : 'Crear Personaje'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
