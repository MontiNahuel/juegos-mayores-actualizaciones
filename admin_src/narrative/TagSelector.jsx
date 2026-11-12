/* Componente reutilizable para seleccionar y crear tags narrativos con badges de color y estilo CogniJuegos. */
import { useState, useEffect, useRef } from 'react';
import { TagIcon, PlusIcon, XIcon, CheckIcon, RefreshIcon } from '../Icons';

export default function TagSelector({
  value = [],
  onChange,
  universoId = 'corte_medieval',
  label = 'Tags Temáticos y Mecánicos',
  helperText = 'Selecciona tags del catálogo o escribe para crear uno nuevo.',
  permitirCrear = true,
}) {
  const [catalogoTags, setCatalogoTags] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const [creando, setCreando] = useState(false);
  const contenedorRef = useRef(null);

  // Cargar tags del universo
  const cargarTags = async () => {
    if (!universoId) return;
    setCargando(true);
    try {
      const res = await fetch(`/api/narrative/admin/tags?universo_id=${encodeURIComponent(universoId)}`);
      if (res.ok) {
        const data = await res.json();
        setCatalogoTags(data);
      }
    } catch (e) {
      console.error('Error al cargar catálogo de tags:', e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTags();
  }, [universoId]);

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    const clickAfuera = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setDropdownAbierto(false);
      }
    };
    document.addEventListener('mousedown', clickAfuera);
    return () => document.removeEventListener('mousedown', clickAfuera);
  }, []);

  const tagsSeleccionados = Array.isArray(value) ? value : [];

  // Mapa de tags del catálogo para acceso rápido
  const tagsMap = new Map(catalogoTags.map((t) => [t._id || t.id, t]));

  // Normalizar slug
  const normalizarSlug = (texto) =>
    texto
      .toLowerCase()
      .trim()
      .replace(/[\s\-]+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

  const slugBuscado = normalizarSlug(busqueda);

  // Filtrar catálogo excluyendo ya seleccionados
  const opcionesFiltradas = catalogoTags.filter((t) => {
    const id = t._id || t.id;
    if (tagsSeleccionados.includes(id)) return false;
    if (!busqueda.trim()) return true;
    const matchId = id.toLowerCase().includes(slugBuscado);
    const matchNombre = (t.nombre || '').toLowerCase().includes(busqueda.toLowerCase().trim());
    const matchCat = (t.categoria || '').toLowerCase().includes(busqueda.toLowerCase().trim());
    return matchId || matchNombre || matchCat;
  });

  const existeExacto = catalogoTags.some((t) => (t._id || t.id) === slugBuscado);

  const agregarTag = (tagId) => {
    if (!tagsSeleccionados.includes(tagId)) {
      onChange([...tagsSeleccionados, tagId]);
    }
    setBusqueda('');
  };

  const removerTag = (tagId) => {
    onChange(tagsSeleccionados.filter((t) => t !== tagId));
  };

  const crearYAsignarTag = async () => {
    if (!slugBuscado) return;
    setCreando(true);
    try {
      const payload = {
        _id: slugBuscado,
        universo_id: universoId,
        nombre: busqueda.trim(),
        descripcion: 'Creado desde el selector rápido',
        categoria: 'rol',
        color: '#ecd098',
      };
      const res = await fetch('/api/narrative/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await cargarTags();
        agregarTag(slugBuscado);
        setBusqueda('');
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || 'No se pudo crear el tag.');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión al crear el tag.');
    } finally {
      setCreando(false);
    }
  };

  return (
    <div ref={contenedorRef} className="space-y-1.5 relative">
      {label && (
        <label className="text-xs font-bold text-[#c0cbd7] uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <TagIcon size={14} className="text-[#ecd098]" />
            {label}
          </span>
          <button
            type="button"
            onClick={cargarTags}
            title="Recargar catálogo de tags"
            className="text-[#c0cbd7] hover:text-[#f3f6fa] transition-colors"
          >
            <RefreshIcon size={11} className={cargando ? 'animate-spin' : ''} />
          </button>
        </label>
      )}

      {/* Chips de tags seleccionados */}
      <div className="min-h-[42px] p-2 rounded-[9px] border border-[#52647b] bg-[#1b2737] flex flex-wrap items-center gap-1.5 focus-within:border-[#ecd098] transition-colors">
        {tagsSeleccionados.map((tId) => {
          const info = tagsMap.get(tId);
          const color = info?.color || '#ecd098';
          const nombreVisible = info?.nombre || tId;
          return (
            <span
              key={tId}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-semibold border transition-all"
              style={{
                backgroundColor: `${color}15`,
                borderColor: `${color}50`,
                color: '#f3f6fa',
              }}
            >
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: color }}
              />
              <span className="font-mono text-[11px]">#{tId}</span>
              {info?.nombre && info.nombre.toLowerCase() !== tId.toLowerCase() && (
                <span className="text-[10px] text-[#c0cbd7]">({nombreVisible})</span>
              )}
              <button
                type="button"
                onClick={() => removerTag(tId)}
                className="ml-0.5 text-[#c0cbd7] hover:text-[#f0bb98] transition-colors"
                title={`Quitar #${tId}`}
              >
                <XIcon size={12} />
              </button>
            </span>
          );
        })}

        {/* Input de búsqueda / combobox */}
        <div className="relative flex-1 min-w-[140px]">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setDropdownAbierto(true);
            }}
            onFocus={() => setDropdownAbierto(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (opcionesFiltradas.length > 0) {
                  agregarTag(opcionesFiltradas[0]._id || opcionesFiltradas[0].id);
                } else if (permitirCrear && slugBuscado) {
                  crearYAsignarTag();
                }
              } else if (e.key === 'Escape') {
                setDropdownAbierto(false);
              }
            }}
            placeholder={tagsSeleccionados.length === 0 ? 'Buscar o crear tags...' : '+ agregar tag...'}
            className="w-full bg-transparent text-xs text-[#f3f6fa] placeholder-[#c0cbd7]/60 focus:outline-none font-mono py-0.5"
          />
        </div>
      </div>

      {helperText && <p className="text-[10px] text-[#c0cbd7]">{helperText}</p>}

      {/* Dropdown de opciones */}
      {dropdownAbierto && (
        <div className="relative z-30">
          <div className="absolute left-0 right-0 top-1 max-h-56 overflow-y-auto rounded-[9px] border border-[#52647b] bg-[#1b2737] shadow-2xl p-1.5 space-y-1">
            {opcionesFiltradas.length === 0 && !slugBuscado && (
              <div className="p-3 text-center text-xs text-[#c0cbd7]">
                Todos los tags disponibles del catálogo ya fueron agregados.
              </div>
            )}

            {opcionesFiltradas.map((t) => {
              const id = t._id || t.id;
              const color = t.color || '#ecd098';
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => agregarTag(id)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-[6px] text-left hover:bg-[#2a394c] transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-[#f3f6fa] group-hover:text-[#ecd098]">
                          #{id}
                        </span>
                        {t.nombre && (
                          <span className="text-xs text-[#c0cbd7] font-sans">
                            {t.nombre}
                          </span>
                        )}
                      </div>
                      {t.descripcion && (
                        <p className="text-[10px] text-[#c0cbd7] line-clamp-1 font-sans">
                          {t.descripcion}
                        </p>
                      )}
                    </div>
                  </div>
                  {t.categoria && (
                    <span className="text-[10px] uppercase font-semibold text-[#c0cbd7] bg-[#2a394c] px-2 py-0.5 rounded-[4px] border border-[#52647b]">
                      {t.categoria}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Opción de crear al vuelo si no existe exacto */}
            {permitirCrear && slugBuscado && !existeExacto && (
              <div className="pt-1 border-t border-[#364454]">
                <button
                  type="button"
                  onClick={crearYAsignarTag}
                  disabled={creando}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-[6px] text-left bg-[#2a394c] border border-[#ecd098]/40 text-[#ecd098] hover:bg-[#2e3c50] text-xs font-semibold transition-colors"
                >
                  <PlusIcon size={14} />
                  <span>
                    {creando ? 'Creando tag...' : `Crear nuevo tag "#${slugBuscado}" en el catálogo`}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
