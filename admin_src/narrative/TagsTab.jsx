/* Administra el catálogo de tags narrativos por universo con diseño CogniJuegos. */
import { useState, useEffect } from 'react';
import {
  TagIcon,
  PlusIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
  AlertTriangleIcon,
  RefreshIcon,
  XIcon,
  FilterIcon,
} from '../Icons';
import { textoDelDetalle } from './erroresApi';

const PALETA_COLORES = [
  { nombre: 'Dorado', hex: '#ecd098' },
  { nombre: 'Menta', hex: '#99dcd1' },
  { nombre: 'Durazno', hex: '#f0bb98' },
  { nombre: 'Lavanda', hex: '#c8bbf0' },
  { nombre: 'Celeste', hex: '#a8ccef' },
  { nombre: 'Rojo', hex: '#ef4444' },
  { nombre: 'Naranja', hex: '#f97316' },
  { nombre: 'Ámbar', hex: '#f59e0b' },
  { nombre: 'Esmeralda', hex: '#10b981' },
  { nombre: 'Teal', hex: '#14b8a6' },
  { nombre: 'Azul', hex: '#3b82f6' },
  { nombre: 'Púrpura', hex: '#8b5cf6' },
  { nombre: 'Pizarra', hex: '#64748b' },
];

export default function TagsTab({ universos = [] }) {
  const [tags, setTags] = useState([]);
  const [universoFiltro, setUniversoFiltro] = useState(
    universos[0]?._id || universos[0]?.id || 'corte_medieval'
  );
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
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [color, setColor] = useState('#ecd098');
  const [categoria, setCategoria] = useState('general');

  useEffect(() => {
    if (universos.length > 0 && !universos.some((u) => (u._id || u.id) === universoFiltro)) {
      setUniversoFiltro(universos[0]._id || universos[0].id);
    }
  }, [universos]);

  const cargarTags = async (uId = universoFiltro) => {
    setCargando(true);
    setError('');
    try {
      const url = uId
        ? `/api/narrative/admin/tags?universo_id=${encodeURIComponent(uId)}`
        : '/api/narrative/admin/tags';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTags(data);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(textoDelDetalle(errData.detail, 'No se pudieron cargar los tags.'));
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión al cargar tags.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (universoFiltro) {
      cargarTags(universoFiltro);
    }
  }, [universoFiltro]);

  const normalizarSlug = (texto) =>
    texto
      .toLowerCase()
      .trim()
      .replace(/[\s\-]+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

  const abrirCrear = () => {
    setEsEdicion(false);
    setId('');
    setNombre('');
    setDescripcion('');
    setColor('#ecd098');
    setCategoria('general');
    setError('');
    setExito('');
    setModalAbierto(true);
  };

  const abrirEditar = (t) => {
    setEsEdicion(true);
    setId(t._id || t.id);
    setNombre(t.nombre || '');
    setDescripcion(t.descripcion || '');
    setColor(t.color || '#ecd098');
    setCategoria(t.categoria || 'general');
    setError('');
    setExito('');
    setModalAbierto(true);
  };

  const guardarTag = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');

    const slugFinal = normalizarSlug(id || nombre);
    if (!slugFinal) {
      setError('El identificador (slug) o nombre es obligatorio.');
      return;
    }
    if (!nombre.trim()) {
      setError('El nombre visible del tag es obligatorio.');
      return;
    }

    setGuardando(true);
    try {
      const payload = {
        _id: slugFinal,
        universo_id: universoFiltro,
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        color: color || '#64748b',
        categoria: (categoria || 'general').trim().toLowerCase(),
        icono: 'tag',
      };

      const res = await fetch('/api/narrative/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setExito(esEdicion ? `Tag #${slugFinal} actualizado.` : `Tag #${slugFinal} creado.`);
        setModalAbierto(false);
        cargarTags(universoFiltro);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(textoDelDetalle(errData.detail, 'Error al guardar el tag.'));
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión al guardar el tag.');
    } finally {
      setGuardando(false);
    }
  };

  const eliminarTag = async (tagId) => {
    if (!confirm(`¿Eliminar el tag #${tagId} del catálogo? Las cartas o personajes que lo usen perderán su referencia.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/narrative/admin/tags/${encodeURIComponent(tagId)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setExito(`Tag #${tagId} eliminado.`);
        cargarTags(universoFiltro);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(textoDelDetalle(errData.detail, 'No se pudo eliminar el tag.'));
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión al eliminar el tag.');
    }
  };

  const categoriasPresentes = ['TODAS', ...Array.from(new Set(tags.map((t) => t.categoria || 'general'))).sort()];

  const tagsFiltrados = tags.filter((t) => {
    const cumpleCat = categoriaFiltro === 'TODAS' || (t.categoria || 'general').toLowerCase() === categoriaFiltro.toLowerCase();
    const query = busqueda.toLowerCase().trim();
    const cumpleBusqueda =
      !query ||
      (t._id || t.id).toLowerCase().includes(query) ||
      (t.nombre || '').toLowerCase().includes(query) ||
      (t.descripcion || '').toLowerCase().includes(query);
    return cumpleCat && cumpleBusqueda;
  });

  return (
    <div className="space-y-6">
      {/* Barra de Filtros y Acciones (#2a394c con borde #52647b) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#2a394c] p-3.5 sm:p-4 rounded-[16px] border border-[#52647b]">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector de Universo */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-[9px] border border-[#52647b] bg-[#1b2737] text-xs text-[#f3f6fa] focus-within:border-[#ecd098] focus-within:ring-1 focus-within:ring-[#ecd098] transition">
            <FilterIcon size={14} className="text-[#ecd098] shrink-0" />
            <select
              value={universoFiltro}
              onChange={(e) => setUniversoFiltro(e.target.value)}
              className="bg-transparent font-semibold text-[#f3f6fa] text-xs focus:outline-none cursor-pointer pr-1 [color-scheme:dark] [&>option]:bg-[#1b2737] [&>option]:text-[#f3f6fa]"
            >
              {universos.map((u) => {
                const uId = u._id || u.id;
                return (
                  <option key={uId} value={uId} className="bg-[#1b2737] text-[#f3f6fa]">
                    {u.nombre || uId}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Selector de Categoría */}
          <div className="flex items-center gap-1 bg-[#1b2737] p-1 rounded-[9px] border border-[#52647b] text-xs font-bold overflow-x-auto max-w-xs sm:max-w-md">
            {categoriasPresentes.slice(0, 5).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoriaFiltro(cat)}
                className={`px-3 py-1 rounded-[7px] transition cursor-pointer capitalize text-xs shrink-0 ${
                  categoriaFiltro === cat
                    ? 'bg-[#ecd098] text-[#172433] font-bold shadow-xs'
                    : 'text-[#c0cbd7] hover:text-[#f3f6fa] hover:bg-[#2e3c50]'
                }`}
              >
                {cat === 'TODAS' ? 'Todas' : cat}
              </button>
            ))}
          </div>

          {/* Buscador */}
          <div className="relative">
            <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c0cbd7]" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar tag por slug o nombre..."
              className="pl-8.5 pr-3 py-2 rounded-[9px] border border-[#52647b] bg-[#1b2737] text-xs text-[#f3f6fa] placeholder:text-[#c0cbd7]/70 focus:outline-none focus:border-[#ecd098] focus:ring-1 focus:ring-[#ecd098] w-48 sm:w-60 transition"
            />
          </div>

          <span className="hidden xl:inline-block text-[11px] font-medium text-[#c0cbd7] pl-1">
            {tagsFiltrados.length} {tagsFiltrados.length === 1 ? 'tag' : 'tags'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => cargarTags(universoFiltro)}
            disabled={cargando}
            className="p-2 rounded-[9px] border border-[#52647b] bg-[#1b2737] hover:bg-[#2e3c50] text-[#c0cbd7] hover:text-[#f3f6fa] transition cursor-pointer"
            title="Refrescar lista"
          >
            <RefreshIcon size={16} className={cargando ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={abrirCrear}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[9px] bg-[#ecd098] hover:bg-[#f6deb0] text-[#172433] font-bold text-xs transition cursor-pointer"
          >
            <PlusIcon size={15} />
            <span>Nuevo Tag</span>
          </button>
        </div>
      </div>

      {/* Grilla de Tags */}
      {cargando ? (
        <div className="py-16 text-center text-[#c0cbd7] text-xs font-semibold">
          Cargando catálogo de tags...
        </div>
      ) : tagsFiltrados.length === 0 ? (
        <div className="py-16 text-center bg-[#2a394c] rounded-[16px] border border-[#52647b] p-8 text-[#c0cbd7] text-xs">
          No se encontraron tags. Haz clic en "Nuevo Tag" para añadir el primero a este universo.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tagsFiltrados.map((t) => {
            const tid = t._id || t.id;
            const tagColor = t.color || '#ecd098';
            return (
              <div
                key={tid}
                className="bg-[#2e3c50] rounded-[16px] border border-[#52647b] hover:border-[#ecd098]/70 p-4 transition-colors duration-200 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: tagColor }}
                        />
                        <h4 className="font-bold text-sm text-[#f3f6fa] truncate">{t.nombre}</h4>
                      </div>
                      <span className="font-mono text-[11px] text-[#c0cbd7] block mt-0.5 truncate">
                        #{tid}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => abrirEditar(t)}
                        className="p-1.5 rounded-[9px] border border-[#52647b] bg-[#1b2737] hover:bg-[#2a394c] text-[#c0cbd7] hover:text-[#f3f6fa] transition cursor-pointer"
                        title="Editar tag"
                      >
                        <EditIcon size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => eliminarTag(tid)}
                        className="p-1.5 rounded-[9px] border border-[#52647b] bg-[#1b2737] hover:bg-[#2a394c] hover:border-[#f0bb98] text-[#f0bb98] transition cursor-pointer"
                        title="Eliminar tag"
                      >
                        <TrashIcon size={13} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#c0cbd7] mt-2.5 line-clamp-2 leading-relaxed">
                    {t.descripcion || 'Sin descripción.'}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#364454] flex items-center justify-between text-[10px]">
                  <span className="px-2 py-0.5 rounded-[5px] bg-[#1b2737] border border-[#52647b] uppercase font-bold text-[#c0cbd7]">
                    {t.categoria || 'general'}
                  </span>
                  <span
                    className="font-mono font-bold px-2 py-0.5 rounded-[5px] border"
                    style={{
                      borderColor: `${tagColor}60`,
                      backgroundColor: `${tagColor}20`,
                      color: tagColor,
                    }}
                  >
                    #{tid}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL CREAR / EDITAR TAG (Amplio y ergonómico) */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-[#151e2b]/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-[#2a394c] rounded-[16px] border border-[#52647b] shadow-2xl w-full max-w-2xl sm:max-w-3xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Cabecera */}
            <div className="px-6 py-4 border-b border-[#364454] bg-[#1b2737] flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-[9px] bg-[#2a394c] border border-[#52647b] text-[#ecd098] flex items-center justify-center shrink-0">
                  <TagIcon size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#f3f6fa] truncate">
                    {esEdicion ? `Editar Tag #${id}` : 'Nuevo Tag Narrativo'}
                  </h3>
                  <p className="text-xs text-[#c0cbd7] mt-0.5">Define identidad, color y categoría temática del tag.</p>
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

            {/* Formulario */}
            <form onSubmit={guardarTag} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
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

              <div className="p-5 rounded-[16px] border border-[#52647b] bg-[#2e3c50] space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[#c0cbd7] uppercase tracking-wider mb-1">
                      Nombre Visible *
                    </label>
                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) => {
                        setNombre(e.target.value);
                        if (!esEdicion) {
                          setId(normalizarSlug(e.target.value));
                        }
                      }}
                      placeholder="ej. Disciplina Militar"
                      required
                      className="w-full px-3 py-2 rounded-[9px] border border-[#52647b] bg-[#1b2737] text-xs font-bold text-[#f3f6fa] focus:outline-none focus:border-[#ecd098] focus:ring-1 focus:ring-[#ecd098]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#c0cbd7] uppercase tracking-wider mb-1">
                      Identificador / Slug (clave inmutable) *
                    </label>
                    <input
                      type="text"
                      value={id}
                      disabled={esEdicion}
                      onChange={(e) => setId(normalizarSlug(e.target.value))}
                      placeholder="ej. disciplina_militar"
                      required
                      className="w-full px-3 py-2 rounded-[9px] border border-[#52647b] bg-[#1b2737] text-xs font-mono font-semibold text-[#f3f6fa] disabled:opacity-50 focus:outline-none focus:border-[#ecd098] focus:ring-1 focus:ring-[#ecd098]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[#c0cbd7] uppercase tracking-wider mb-1">
                      Categoría
                    </label>
                    <input
                      type="text"
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                      placeholder="ej. militar, politica, economia, moral"
                      className="w-full px-3 py-2 rounded-[9px] border border-[#52647b] bg-[#1b2737] text-xs text-[#f3f6fa] focus:outline-none focus:border-[#ecd098] focus:ring-1 focus:ring-[#ecd098] lowercase"
                    />
                  </div>

                  {/* Vista Previa del Badge en Tiempo Real */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#c0cbd7] uppercase tracking-wider mb-1">
                      Vista Previa en Juego
                    </label>
                    <div className="h-9 px-3 rounded-[9px] border border-[#52647b] bg-[#1b2737] flex items-center justify-between">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-bold font-mono border"
                        style={{
                          backgroundColor: `${color}20`,
                          borderColor: `${color}60`,
                          color: color,
                        }}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                        #{id || 'tag_preview'}
                      </span>
                      <span className="text-[10px] text-[#c0cbd7]">{nombre || 'Nombre'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#c0cbd7] uppercase tracking-wider mb-1">
                    Descripción del Tag
                  </label>
                  <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Explica qué representa este tag o en qué mecánicas / condiciones de eventos interviene..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-[9px] border border-[#52647b] bg-[#1b2737] text-xs text-[#f3f6fa] focus:outline-none focus:border-[#ecd098] focus:ring-1 focus:ring-[#ecd098] leading-relaxed resize-none"
                  />
                </div>

                {/* Selector de Color de Paleta */}
                <div>
                  <label className="block text-[11px] font-bold text-[#c0cbd7] uppercase tracking-wider mb-2">
                    Color del Badge
                  </label>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {PALETA_COLORES.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setColor(c.hex)}
                        title={c.nombre}
                        className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                          color === c.hex ? 'scale-120 border-[#f3f6fa] shadow-md' : 'border-transparent hover:scale-110 opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                    <div className="flex items-center gap-1.5 ml-2">
                      <span className="text-[10px] text-[#c0cbd7] font-mono">Hex:</span>
                      <input
                        type="text"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        placeholder="#ecd098"
                        className="w-20 px-2 py-1 rounded-[7px] border border-[#52647b] bg-[#1b2737] text-xs font-mono text-[#f3f6fa] focus:outline-none focus:border-[#ecd098]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="pt-4 border-t border-[#364454] bg-[#1b2737] -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-4 sm:p-5 flex items-center justify-end gap-2 shrink-0 rounded-b-[16px]">
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
                  <span>{guardando ? 'Guardando...' : esEdicion ? 'Actualizar Tag' : 'Crear Tag'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
