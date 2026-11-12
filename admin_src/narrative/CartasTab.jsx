/* Permite crear, buscar y editar cartas narrativas con diseño CogniJuegos. */
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
  SparklesIcon,
} from '../Icons';
import ImageUploadField from './ImageUploadField';
import EfectosEditor from './EfectosEditor';
import CondicionesAparicionEditor from './CondicionesAparicionEditor';
import TagSelector from './TagSelector';
import { textoDelDetalle } from './erroresApi';
import { fetchNarrativeAdmin } from './api';

// Formatea de forma legible y elegante una acción dentro de la tarjeta
function formatAccionResumen(acc) {
  if (!acc) return '';
  const pid = acc.accion_id || '';
  const params = acc.parametros || {};

  if (pid === 'modificar_recurso') {
    const val = params.valor ?? 0;
    const sign = val > 0 ? `+${val}` : `${val}`;
    const unidad = params.tipo_calculo === 'porcentual' ? '%' : '';
    const clave = params.clave ? (params.clave.charAt(0).toUpperCase() + params.clave.slice(1)) : 'Recurso';
    return `${sign}${unidad} ${clave}`;
  }
  if (pid === 'amortiguar_danio') {
    const clave = params.clave ? (params.clave.charAt(0).toUpperCase() + params.clave.slice(1)) : 'Daño';
    return `Absorbe ${params.valor || 0}% de pérdidas (${clave})`;
  }
  if (pid === 'otorgar_tag') {
    return `Otorga tag #${params.tag || 'activo'}`;
  }
  if (pid === 'remover_tag') {
    return `Remueve tag #${params.tag || 'activo'}`;
  }
  if (pid === 'modificar_afinidad') {
    const val = params.valor ?? 0;
    const sign = val > 0 ? `+${val}` : `${val}`;
    return `${sign} Afinidad`;
  }
  if (pid === 'mutar_estado') {
    const val = params.valor ?? 0;
    const op = params.operacion_matematica === 'sumar' ? '+' : params.operacion_matematica === 'restar' ? '-' : '';
    return `${params.ruta || 'Estado'}: ${op}${val}`;
  }
  return `${pid} ${params.clave || params.tag || ''}`.trim();
}

function formatFrecuenciaLabel(frecId) {
  if (!frecId) return 'Inmediato';
  const mapa = {
    al_obtener: 'Al obtener',
    mensual: 'Mensual',
    cada_2_meses: 'Cada 2 meses',
    cada_3_meses: 'Cada 3 meses',
    fin_de_partida: 'Fin de partida',
    al_perder: 'Al perder',
  };
  return mapa[frecId] || frecId.replace(/_/g, ' ');
}

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
  const [imagen, setImagen] = useState('/assets/narrative/cartas/default.webp');
  const [pesoDraftMensual, setPesoDraftMensual] = useState(1);
  const [tags, setTags] = useState([]);
  const [condicionesAparicion, setCondicionesAparicion] = useState([]);
  const [efectos, setEfectos] = useState([]);

  // Carga cartas desde la API
  const cargarCartas = async (uId = universoFiltro) => {
    setCargando(true);
    setError('');
    try {
      const url = uId
        ? `/api/narrative/admin/cartas?universo_id=${encodeURIComponent(uId)}`
        : '/api/narrative/admin/cartas';
      const res = await fetchNarrativeAdmin(url);
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
    setImagen('/assets/narrative/cartas/default.webp');
    setPesoDraftMensual(1);
    setTags([]);
    setCondicionesAparicion([]);
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
    setImagen(c.imagen || '/assets/narrative/cartas/default.webp');
    setPesoDraftMensual(c.peso_draft_mensual ?? 1);
    setTags(Array.isArray(c.tags) ? c.tags : []);
    setCondicionesAparicion(c.condiciones_aparicion && c.condiciones_aparicion.length > 0 ? JSON.parse(JSON.stringify(c.condiciones_aparicion)) : []);
    setEfectos(c.efectos && c.efectos.length > 0 ? JSON.parse(JSON.stringify(c.efectos)) : []);
    setError('');
    setExito('');
    setModalAbierto(true);
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

    const tagsPayload = Array.isArray(tags) ? tags : [];

    const payload = {
      _id: id.trim(),
      universo_id: universoId.trim(),
      categoria: categoria,
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      imagen: imagen.trim() || '/assets/narrative/cartas/default.webp',
      peso_draft_mensual: Math.max(0, parseFloat(pesoDraftMensual) || 0),
      tags: tagsPayload,
      condiciones_aparicion: condicionesAparicion,
      efectos: efectos.map((ef) => ({
        frecuencia_id: ef.frecuencia_id || ef.disparador || 'al_obtener',
        disparador: ef.disparador || ef.frecuencia_id || 'al_obtener',
        condiciones: ef.condiciones || [],
        acciones: (ef.acciones && ef.acciones.length > 0)
          ? ef.acciones.map((a) => ({
              accion_id: a.accion_id,
              parametros: a.parametros || {},
            }))
          : [
              {
                accion_id: ef.accion?.tipo || 'modificar_recurso',
                parametros: {
                  clave: ef.accion?.clave || 'oro',
                  valor: parseFloat(ef.accion?.valor) || 0,
                  tipo_calculo: ef.accion?.tipo_calculo || 'fijo',
                  destino: ef.accion?.destino || 'portador',
                  personaje_id: ef.accion?.personaje_id || null,
                  tag: ef.accion?.tag || null,
                },
              },
            ],
      })),
    };

    try {
      const res = await fetchNarrativeAdmin('/api/narrative/admin/cartas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(textoDelDetalle(err.detail, 'Error al guardar carta.'));
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
      const res = await fetchNarrativeAdmin(`/api/narrative/admin/cartas/${cId}`, {
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
    const cumpleCat = categoriaFiltro === 'TODAS' || c.categoria === categoriaFiltro;
    if (!cumpleCat) return false;
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      (c.nombre && c.nombre.toLowerCase().includes(q)) ||
      (c._id && c._id.toLowerCase().includes(q)) ||
      (Array.isArray(c.tags) && c.tags.some((t) => t.toLowerCase().includes(q)))
    );
  });

  const getCategoriaBadge = (cat) => {
    switch (cat) {
      case 'item':
        return 'bg-[#a8ccef]/15 text-[#a8ccef] border-[#a8ccef]/40';
      case 'bonus':
        return 'bg-[#99dcd1]/15 text-[#99dcd1] border-[#99dcd1]/40';
      case 'personaje':
        return 'bg-[#f0bb98]/15 text-[#f0bb98] border-[#f0bb98]/40';
      default:
        return 'bg-[#c0cbd7]/15 text-[#c0cbd7] border-[#52647b]';
    }
  };

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
              <option value="" className="bg-[#1b2737] text-[#f3f6fa] py-1">Todos los Universos</option>
              {universos.map((u) => (
                <option key={u._id || u.id} value={u._id || u.id} className="bg-[#1b2737] text-[#f3f6fa] py-1">
                  {u.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Categoría */}
          <div className="flex items-center gap-1 bg-[#1b2737] p-1 rounded-[9px] border border-[#52647b] text-xs font-bold">
            {['TODAS', 'item', 'bonus', 'personaje'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoriaFiltro(cat)}
                className={`px-3 py-1 rounded-[7px] transition cursor-pointer capitalize text-xs ${
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
              placeholder="Buscar por nombre o tag..."
              className="pl-8.5 pr-3 py-2 rounded-[9px] border border-[#52647b] bg-[#1b2737] text-xs text-[#f3f6fa] placeholder:text-[#c0cbd7]/70 focus:outline-none focus:border-[#ecd098] focus:ring-1 focus:ring-[#ecd098] w-48 sm:w-60 transition"
            />
          </div>

          <span className="hidden xl:inline-block text-[11px] font-medium text-[#c0cbd7] pl-1">
            {cartasFiltradas.length} {cartasFiltradas.length === 1 ? 'carta' : 'cartas'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => cargarCartas(universoFiltro)}
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
            <span>Nueva Carta</span>
          </button>
        </div>
      </div>

      {/* Grilla de Cartas */}
      {cargando ? (
        <div className="py-16 text-center text-[#c0cbd7] text-xs font-semibold">
          Cargando inventario de cartas...
        </div>
      ) : cartasFiltradas.length === 0 ? (
        <div className="py-16 text-center bg-[#2a394c] rounded-[16px] border border-[#52647b] p-8 text-[#c0cbd7] text-xs">
          No se encontraron cartas en este mazo. Haz clic en "Nueva Carta" para crear una.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4.5">
          {cartasFiltradas.map((c) => {
            const cid = c._id || c.id;
            return (
              <div
                key={cid}
                className="bg-[#2e3c50] rounded-[16px] border border-[#52647b] hover:border-[#ecd098]/70 p-5 transition-colors duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Encabezado */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-13 h-16 rounded-[10px] bg-[#1b2737] border border-[#52647b] flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                        <img
                          src={c.imagen || '/assets/narrative/cartas/default.webp'}
                          alt={c.nombre}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/assets/narrative/cartas/default.webp';
                          }}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-[5px] uppercase border tracking-wider inline-block ${getCategoriaBadge(
                            c.categoria
                          )}`}
                        >
                          {c.categoria}
                        </span>
                        <h4 className="font-bold text-sm text-[#f3f6fa] mt-1 leading-tight truncate">{c.nombre}</h4>
                        <span className="text-[10px] font-mono text-[#c0cbd7] block truncate">ID: {cid}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => abrirModalEditar(c)}
                        className="p-1.5 rounded-[9px] border border-[#52647b] bg-[#1b2737] hover:bg-[#2a394c] text-[#c0cbd7] hover:text-[#f3f6fa] transition cursor-pointer"
                        title="Editar carta"
                      >
                        <EditIcon size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEliminar(cid)}
                        className="p-1.5 rounded-[9px] border border-[#52647b] bg-[#1b2737] hover:bg-[#2a394c] hover:border-[#f0bb98] text-[#f0bb98] transition cursor-pointer"
                        title="Eliminar carta"
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Descripción */}
                  <p className="text-xs text-[#c0cbd7] mt-3 line-clamp-3 leading-relaxed">
                    {c.descripcion || 'Sin descripción.'}
                  </p>

                  {/* Efectos pasivos */}
                  <div className="mt-3.5 pt-3 border-t border-[#364454] space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#ecd098]">
                      <span className="flex items-center gap-1.5">
                        <SparklesIcon size={13} className="text-[#ecd098]" />
                        Efectos de la Carta
                      </span>
                      {c.efectos && c.efectos.length > 0 && (
                        <span className="text-[10px] text-[#c0cbd7] font-normal lowercase font-mono">
                          {c.efectos.length} {c.efectos.length === 1 ? 'efecto' : 'efectos'}
                        </span>
                      )}
                    </div>

                    {(!c.efectos || c.efectos.length === 0) ? (
                      <p className="text-[11px] text-[#c0cbd7]/60 italic py-0.5">
                        Sin efectos configurados.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {c.efectos.map((ef, idx) => {
                          const frecText = formatFrecuenciaLabel(ef.frecuencia_id || ef.disparador);
                          const accionesList = (ef.acciones && ef.acciones.length > 0)
                            ? ef.acciones.map(formatAccionResumen).filter(Boolean)
                            : [formatAccionResumen(ef.accion)].filter(Boolean);

                          return (
                            <div
                              key={idx}
                              className="p-2 rounded-[9px] bg-[#1b2737]/90 border border-[#52647b]/50 text-xs flex flex-col gap-1"
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="inline-block px-1.5 py-0.5 rounded-[5px] bg-[#ecd098]/15 border border-[#ecd098]/30 text-[10px] font-bold text-[#ecd098] tracking-wide">
                                  {frecText}
                                </span>
                              </div>
                              <div className="text-[11px] text-[#f3f6fa] pl-0.5 space-y-0.5">
                                {accionesList.length > 0 ? (
                                  accionesList.map((accDesc, aIdx) => (
                                    <div key={aIdx} className="flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#99dcd1] shrink-0" />
                                      <span className="font-medium text-[#f3f6fa]">{accDesc}</span>
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-[#c0cbd7] italic text-[10px]">Sin acciones configuradas</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div className="mt-4 pt-3 border-t border-[#364454] flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {(c.tags || []).map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-[6px] bg-[#1b2737] border border-[#52647b] font-mono text-[10px] text-[#c0cbd7] font-semibold"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] font-mono text-[#c0cbd7] bg-[#1b2737] px-2 py-0.5 rounded-[6px] border border-[#52647b]">
                    {c.universo_id}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL CREAR / EDITAR CARTA (Horizontal Full-Width CogniJuegos) */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-[#151e2b]/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 lg:p-8 overflow-y-auto">
          <div className="bg-[#2a394c] rounded-[16px] border border-[#52647b] shadow-2xl w-full max-w-5xl xl:max-w-6xl 2xl:max-w-7xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Cabecera */}
            <div className="px-6 py-4 border-b border-[#364454] bg-[#1b2737] flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-[9px] bg-[#2a394c] border border-[#52647b] text-[#ecd098] flex items-center justify-center shrink-0">
                  <LayersIcon size={20} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm sm:text-base text-[#f3f6fa] truncate">
                      {esEdicion ? `Editar Carta: ${nombre || id}` : 'Nueva Carta de Apoyo'}
                    </h3>
                    <span className="font-mono text-[10px] bg-[#2a394c] border border-[#52647b] px-2 py-0.5 rounded-[6px] text-[#c0cbd7]">
                      {id}
                    </span>
                  </div>
                  <p className="text-xs text-[#c0cbd7] mt-0.5">Configura categoría, beneficios e impacto en el reino.</p>
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

              {/* BLOQUE 1: IDENTIDAD, ILUSTRACIÓN Y METADATOS */}
              <div className="p-5 sm:p-6 rounded-[16px] border border-[#52647b] bg-[#2e3c50] space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#364454]">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#ecd098] flex items-center gap-2">
                    <LayersIcon size={14} />
                    Identidad y Arte de la Carta
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  {/* Arte de la carta a la izquierda */}
                  <div className="md:col-span-4 lg:col-span-3 flex justify-center md:justify-start">
                    <ImageUploadField
                      label="Ilustración de la Carta"
                      categoria="cartas"
                      value={imagen}
                      onChange={setImagen}
                    />
                  </div>

                  {/* Campos a la derecha */}
                  <div className="md:col-span-8 lg:col-span-9 space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-[#c0cbd7] uppercase tracking-wider mb-1">
                          ID Carta
                        </label>
                        <input
                          type="text"
                          value={id}
                          onChange={(e) => setId(e.target.value)}
                          disabled={esEdicion}
                          placeholder="ej. card_sello_real"
                          className="w-full px-3 py-2 rounded-[9px] border border-[#52647b] bg-[#1b2737] text-xs font-mono font-semibold text-[#f3f6fa] disabled:opacity-50 focus:outline-none focus:border-[#ecd098] focus:ring-1 focus:ring-[#ecd098]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#c0cbd7] uppercase tracking-wider mb-1">
                          Universo
                        </label>
                        <select
                          value={universoId}
                          onChange={(e) => setUniversoId(e.target.value)}
                          className="w-full px-3 py-2 rounded-[9px] border border-[#52647b] bg-[#1b2737] text-xs font-bold text-[#f3f6fa] [color-scheme:dark] [&>option]:bg-[#1b2737] [&>option]:text-[#f3f6fa] focus:outline-none focus:border-[#ecd098] focus:ring-1 focus:ring-[#ecd098]"
                        >
                          {universos.map((u) => (
                            <option key={u._id || u.id} value={u._id || u.id} className="bg-[#1b2737] text-[#f3f6fa]">
                              {u.nombre}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#c0cbd7] uppercase tracking-wider mb-1">
                          Categoría
                        </label>
                        <select
                          value={categoria}
                          onChange={(e) => setCategoria(e.target.value)}
                          className="w-full px-3 py-2 rounded-[9px] border border-[#52647b] bg-[#1b2737] text-xs font-bold text-[#f3f6fa] [color-scheme:dark] [&>option]:bg-[#1b2737] [&>option]:text-[#f3f6fa] focus:outline-none focus:border-[#ecd098] focus:ring-1 focus:ring-[#ecd098]"
                        >
                          <option value="item">Ítem (Herramienta / Recurso)</option>
                          <option value="bonus">Bonus (Tratado / Decreto)</option>
                          <option value="personaje">Personaje (Aliado / Recluta)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#c0cbd7] uppercase tracking-wider mb-1">
                        Nombre de la Carta
                      </label>
                      <input
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="ej. Sello Real de la Corona"
                        className="w-full px-3 py-2 rounded-[9px] border border-[#52647b] bg-[#1b2737] text-xs font-bold text-[#f3f6fa] focus:outline-none focus:border-[#ecd098] focus:ring-1 focus:ring-[#ecd098]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#c0cbd7] uppercase tracking-wider mb-1">
                        Descripción del Efecto y Lore
                      </label>
                      <textarea
                        rows={2}
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        placeholder="Permite emitir decretos supremos y confiscar bienes con autoridad real..."
                        className="w-full px-3 py-2 rounded-[9px] border border-[#52647b] bg-[#1b2737] text-xs text-[#f3f6fa] focus:outline-none focus:border-[#ecd098] focus:ring-1 focus:ring-[#ecd098] leading-relaxed resize-none"
                      />
                    </div>

                    <TagSelector
                      value={tags}
                      onChange={setTags}
                      universoId={universoId || universoFiltro}
                      label="Tags de Requisito y Mecánica"
                    />

                    <div>
                      <label className="block text-[11px] font-bold text-[#c0cbd7] uppercase tracking-wider mb-1">
                        Peso en el Draft Mensual
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.05"
                        value={pesoDraftMensual}
                        onChange={(e) => setPesoDraftMensual(e.target.value)}
                        className="w-32 px-3 py-2 rounded-[9px] border border-[#52647b] bg-[#1b2737] text-xs font-bold text-[#f3f6fa] focus:outline-none focus:border-[#ecd098] focus:ring-1 focus:ring-[#ecd098]"
                      />
                      <p className="mt-1 text-[11px] text-[#8fa0b5]">
                        1.0 = probabilidad normal. Valores bajos (ej. 0.15) hacen la carta rara; 0 la excluye del sorteo.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* BLOQUE 2: CONDICIONES DE APARICIÓN */}
              <div className="p-5 sm:p-6 rounded-[16px] border border-[#52647b] bg-[#2e3c50]">
                <CondicionesAparicionEditor
                  condiciones={condicionesAparicion}
                  onChange={setCondicionesAparicion}
                  universoId={universoId || universoFiltro}
                />
              </div>

              {/* BLOQUE 3: EFECTOS DE LA CARTA */}
              <div className="p-5 sm:p-6 rounded-[16px] border border-[#52647b] bg-[#2e3c50]">
                <EfectosEditor
                  efectos={efectos}
                  onChange={setEfectos}
                  universoId={universoId || universoFiltro}
                  tipoEntidad="carta"
                  recursosDisponibles={['oro', 'pueblo', 'ejercito', 'fe']}
                />
              </div>

              {/* Botones de acción */}
              <div className="pt-4 border-t border-[#364454] bg-[#1b2737] -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-4 sm:p-5 flex items-center justify-between gap-3 shrink-0 rounded-b-[16px]">
                <span className="text-[11px] text-[#c0cbd7] hidden sm:inline-block">
                  Los efectos y condiciones se sincronizan en vivo en el mazo.
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
                    <span>{guardando ? 'Guardando...' : esEdicion ? 'Actualizar Carta' : 'Crear Carta'}</span>
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
