import { useState, useEffect } from 'react';
import {
  LayersIcon,
  PlusIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
  AlertTriangleIcon,
  RefreshIcon,
  XIcon,
  FilterIcon,
  CoinsIcon,
  TagIcon,
} from '../Icons';

export default function CartasTab({ universos = [] }) {
  const [cartas, setCartas] = useState([]);
  const [universoFiltro, setUniversoFiltro] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('TODAS');
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
  const [categoria, setCategoria] = useState('item');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [imagen, setImagen] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [efectos, setEfectos] = useState([]);

  const cargarCartas = async (uId = universoFiltro) => {
    setCargando(true);
    setError('');
    try {
      const url = uId
        ? `/api/narrative/admin/cartas?universo_id=${encodeURIComponent(uId)}`
        : '/api/narrative/admin/cartas';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCartas(data);
      } else {
        setError('No se pudo cargar la lista de cartas.');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión al cargar cartas.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCartas(universoFiltro);
  }, [universoFiltro]);

  const abrirModalNuevo = () => {
    setEsEdicion(false);
    setId('card_' + Date.now().toString(36));
    setUniversoId(universoFiltro || universos[0]?._id || universos[0]?.id || 'corte_medieval');
    setCategoria('item');
    setNombre('');
    setDescripcion('');
    setImagen('/assets/narrative/cards/default.webp');
    setTagsInput('');
    setEfectos([]);
    setError('');
    setExito('');
    setModalAbierto(true);
  };

  const abrirModalEditar = (c) => {
    setEsEdicion(true);
    setId(c._id || c.id);
    setUniversoId(c.universo_id || '');
    setCategoria(c.categoria || 'item');
    setNombre(c.nombre || '');
    setDescripcion(c.descripcion || '');
    setImagen(c.imagen || '');
    setTagsInput((c.tags || []).join(', '));
    setEfectos(c.efectos && c.efectos.length > 0 ? JSON.parse(JSON.stringify(c.efectos)) : []);
    setError('');
    setExito('');
    setModalAbierto(true);
  };

  const handleAgregarEfecto = () => {
    setEfectos([
      ...efectos,
      {
        disparador: 'al_obtener',
        condiciones: [],
        accion: { tipo: 'modificar_recurso', clave: 'oro', valor: 15, tipo_calculo: 'fijo' },
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

    const payload = {
      _id: id.trim(),
      universo_id: universoId.trim(),
      categoria: categoria,
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      imagen: imagen.trim() || '/assets/narrative/cards/default.webp',
      tags: tags,
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
    };

    try {
      const res = await fetch('/api/narrative/admin/cartas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Error al guardar carta.');
      }

      setExito('Carta guardada correctamente.');
      setTimeout(() => {
        setModalAbierto(false);
        cargarCartas(universoFiltro);
      }, 600);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al procesar la solicitud.');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (cId) => {
    if (!confirm(`¿Estás seguro de eliminar la carta "${cId}"?`)) return;
    try {
      const res = await fetch(`/api/narrative/admin/cartas/${cId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        cargarCartas(universoFiltro);
      } else {
        const err = await res.json();
        alert(err.detail || 'No se pudo eliminar la carta.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al eliminar.');
    }
  };

  const cartasFiltradas = cartas.filter((c) => {
    if (categoriaFiltro !== 'TODAS' && c.categoria !== categoriaFiltro) {
      return false;
    }
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      (c.nombre && c.nombre.toLowerCase().includes(q)) ||
      (c._id && c._id.toLowerCase().includes(q)) ||
      (c.tags && c.tags.some((t) => t.toLowerCase().includes(q)))
    );
  });

  const getCategoriaBadge = (cat) => {
    switch (cat) {
      case 'item':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'bonus':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'personaje':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

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

          {/* Selector de Categoría */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            {['TODAS', 'item', 'bonus', 'personaje'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoriaFiltro(cat)}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer capitalize ${
                  categoriaFiltro === cat ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {cat === 'TODAS' ? 'Todas' : cat}
              </button>
            ))}
          </div>

          {/* Buscador */}
          <div className="relative">
            <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o tag..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#002B5E] w-48 sm:w-60"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => cargarCartas(universoFiltro)}
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
            <span>Nueva Carta</span>
          </button>
        </div>
      </div>

      {/* Grilla de Cartas */}
      {cargando ? (
        <div className="py-12 text-center text-slate-400 text-xs font-semibold">
          Cargando inventario de cartas...
        </div>
      ) : cartasFiltradas.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-2xl border border-slate-200/80 p-6 text-slate-400 text-xs">
          No se encontraron cartas en este mazo. Haz clic en "Nueva Carta" para crear una.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cartasFiltradas.map((c) => {
            const cid = c._id || c.id;
            return (
              <div
                key={cid}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
              >
                <div>
                  {/* Encabezado */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200/60 flex items-center justify-center flex-shrink-0">
                        <LayersIcon size={22} />
                      </div>
                      <div>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${getCategoriaBadge(
                            c.categoria
                          )}`}
                        >
                          {c.categoria}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 mt-1 leading-tight">{c.nombre}</h4>
                        <span className="text-[9px] font-mono text-slate-400">ID: {cid}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => abrirModalEditar(c)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                        title="Editar carta"
                      >
                        <EditIcon size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEliminar(cid)}
                        className="p-1.5 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                        title="Eliminar carta"
                      >
                        <TrashIcon size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Descripción */}
                  <p className="text-xs text-slate-600 mt-3 line-clamp-3 leading-relaxed">
                    {c.descripcion || 'Sin descripción.'}
                  </p>

                  {/* Efectos pasivos */}
                  {c.efectos && c.efectos.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Efecto Pasivo:
                      </span>
                      {c.efectos.map((ef, idx) => {
                        const a = ef.accion || {};
                        return (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700"
                          >
                            <CoinsIcon size={12} className="text-amber-600" />
                            <span>
                              {ef.disparador === 'al_obtener' ? 'Inmediato' : 'Mensual'}:{' '}
                              {a.tipo === 'otorgar_tag' ? `Tag #${a.tag}` : `${a.clave} ${a.valor > 0 ? `+${a.valor}` : a.valor}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {(c.tags || []).map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-100 font-mono text-[10px] text-slate-600 font-semibold"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{c.universo_id}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL CREAR / EDITAR CARTA */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl w-full max-w-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Cabecera */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
                  <LayersIcon size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {esEdicion ? 'Editar Carta de Apoyo' : 'Nueva Carta de Apoyo'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Configura categoría, beneficios e impacto en el reino.</p>
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
                    ID Carta
                  </label>
                  <input
                    type="text"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    disabled={esEdicion}
                    placeholder="ej. card_sello_real"
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
                    Categoría
                  </label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-[#002B5E]"
                  >
                    <option value="item">Ítem (Herramienta / Recurso)</option>
                    <option value="bonus">Bonus (Tratado / Decreto)</option>
                    <option value="personaje">Personaje (Aliado / Recluta)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Nombre de la Carta
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="ej. Sello Real de la Corona"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-[#002B5E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Descripción del Efecto y Lore
                </label>
                <textarea
                  rows={2}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Permite emitir decretos supremos y confiscar bienes con autoridad real..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#002B5E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Tags de Requisito y Mecánica (separados por coma)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="ej. sello_real, autoridad, diplomacia"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-800 focus:outline-none focus:border-[#002B5E]"
                />
              </div>

              {/* SECCIÓN DE EFECTOS DE LA CARTA */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Efectos y Modificadores de la Carta ({efectos.length})
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
                        className="w-full sm:w-32 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-[11px] text-slate-800"
                      >
                        <option value="al_obtener">Al Obtener</option>
                        <option value="cada_mes">Cada Mes</option>
                        <option value="al_final_partida">Al Final</option>
                      </select>

                      <select
                        value={ef.accion?.tipo || 'modificar_recurso'}
                        onChange={(e) => handleCambiarEfecto(idx, 'tipo', e.target.value)}
                        className="w-full sm:w-36 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-[11px] text-slate-800"
                      >
                        <option value="modificar_recurso">Modificar Recurso</option>
                        <option value="otorgar_tag">Otorgar Tag</option>
                      </select>

                      {ef.accion?.tipo === 'otorgar_tag' ? (
                        <input
                          type="text"
                          value={ef.accion?.tag || ''}
                          onChange={(e) => handleCambiarEfecto(idx, 'tag', e.target.value)}
                          placeholder="Nombre del tag..."
                          className="w-full sm:flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-mono"
                        />
                      ) : (
                        <div className="flex items-center gap-2 w-full sm:flex-1">
                          <select
                            value={ef.accion?.clave || 'oro'}
                            onChange={(e) => handleCambiarEfecto(idx, 'clave', e.target.value)}
                            className="w-24 px-2 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-[11px] text-slate-800"
                          >
                            <option value="oro">Oro</option>
                            <option value="pueblo">Pueblo</option>
                            <option value="ejercito">Ejército</option>
                            <option value="fe">Fe</option>
                          </select>
                          <input
                            type="number"
                            value={ef.accion?.valor ?? 10}
                            onChange={(e) => handleCambiarEfecto(idx, 'valor', parseFloat(e.target.value))}
                            className="w-20 px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-center"
                          />
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleEliminarEfecto(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer ml-auto"
                        title="Quitar efecto"
                      >
                        <TrashIcon size={14} />
                      </button>
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
                  <span>{guardando ? 'Guardando...' : esEdicion ? 'Actualizar Carta' : 'Crear Carta'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
