/* Permite editar personajes de la corte y sus efectos con estilo CogniJuegos. */
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
  SparklesIcon,
} from '../Icons';
import ImageUploadField from './ImageUploadField';
import EfectosEditor from './EfectosEditor';
import CondicionesAparicionEditor from './CondicionesAparicionEditor';
import TagSelector from './TagSelector';
import { textoDelDetalle } from './erroresApi';

// Formatea de forma legible y elegante una acción dentro de la tarjeta de personaje
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
  if (!frecId) return 'Al obtener';
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

// Permite editar personajes de la corte y sus efectos.
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
  const [imagen, setImagen] = useState('/assets/narrative/personajes/default.webp');
  const [descripcion, setDescripcion] = useState('');
  const [afinidadInicial, setAfinidadInicial] = useState(50);
  const [tags, setTags] = useState([]);
  const [condicionesAparicion, setCondicionesAparicion] = useState([]);
  const [efectos, setEfectos] = useState([]);

  // Carga personajes con los datos de este paso.
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

  // Abre el formulario vacío para crear un registro.
  const abrirModalNuevo = () => {
    setEsEdicion(false);
    setId('pj_' + Date.now().toString(36));
    setUniversoId(universoFiltro || universos[0]?._id || universos[0]?.id || 'corte_medieval');
    setNombre('');
    setTitulo('');
    setImagen('/assets/narrative/personajes/default.webp');
    setDescripcion('');
    setAfinidadInicial(50);
    setTags([]);
    setCondicionesAparicion([]);
    setEfectos([]);
    setError('');
    setExito('');
    setModalAbierto(true);
  };

  // Carga el registro en el formulario de edición.
  const abrirModalEditar = (p) => {
    setEsEdicion(true);
    setId(p._id || p.id);
    setUniversoId(p.universo_id || '');
    setNombre(p.nombre || '');
    setTitulo(p.titulo || '');
    setImagen(p.imagen || '/assets/narrative/personajes/default.webp');
    setDescripcion(p.descripcion || '');
    setAfinidadInicial(p.afinidad_inicial !== undefined ? p.afinidad_inicial : 50);
    setTags(Array.isArray(p.tags) ? p.tags : []);
    setCondicionesAparicion(p.condiciones_aparicion && p.condiciones_aparicion.length > 0 ? JSON.parse(JSON.stringify(p.condiciones_aparicion)) : []);
    setEfectos(p.efectos && p.efectos.length > 0 ? JSON.parse(JSON.stringify(p.efectos)) : []);
    setError('');
    setExito('');
    setModalAbierto(true);
  };

  // Valida el formulario y guarda los cambios.
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
      nombre: nombre.trim(),
      titulo: titulo.trim(),
      imagen: imagen.trim() || '/assets/narrative/personajes/default.webp',
      descripcion: descripcion.trim(),
      pros: [],
      cons: [],
      tags: tagsPayload,
      afinidad_inicial: parseInt(afinidadInicial, 10) || 50,
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
        throw new Error(textoDelDetalle(err.detail, 'Error al guardar personaje.'));
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

  // Pide borrar el registro y actualiza la lista.
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
      {/* Barra de Filtros y Acciones (Superficie CogniJuegos #2a394c con borde #52647b) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#2a394c] p-3.5 sm:p-4 rounded-[16px] border border-[#52647b]">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector de Universo con fondo oscuro nativo #1b2737 */}
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

          {/* Buscador */}
          <div className="relative">
            <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c0cbd7]" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o rol..."
              className="pl-8.5 pr-3 py-2 rounded-[9px] border border-[#52647b] bg-[#1b2737] text-xs text-[#f3f6fa] placeholder:text-[#c0cbd7]/70 focus:outline-none focus:border-[#ecd098] focus:ring-1 focus:ring-[#ecd098] w-48 sm:w-64 transition"
            />
          </div>

          <span className="hidden xl:inline-block text-[11px] font-medium text-[#c0cbd7] pl-1">
            {personajesFiltrados.length} {personajesFiltrados.length === 1 ? 'personaje' : 'personajes'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => cargarPersonajes(universoFiltro)}
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
            <span>Nuevo Personaje</span>
          </button>
        </div>
      </div>

      {/* Grilla de Personajes (Superficie narrativa #2e3c50, paneles de 16px, borde #52647b) */}
      {cargando ? (
        <div className="py-16 text-center text-[#c0cbd7] text-xs font-semibold">
          Cargando personajes de la corte...
        </div>
      ) : personajesFiltrados.length === 0 ? (
        <div className="py-16 text-center bg-[#2a394c] rounded-[16px] border border-[#52647b] p-8 text-[#c0cbd7] text-xs">
          No se encontraron personajes. Haz clic en "Nuevo Personaje" para crear uno.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4.5">
          {personajesFiltrados.map((p) => {
            const pid = p._id || p.id;
            return (
              <div
                key={pid}
                className="bg-[#2e3c50] rounded-[16px] border border-[#52647b] hover:border-[#ecd098]/70 p-5 transition-colors duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Encabezado de la Tarjeta */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-13 h-15 rounded-[10px] bg-[#1b2737] border border-[#52647b] flex items-center justify-center text-[#c0cbd7] shrink-0 overflow-hidden shadow-inner">
                        <img
                          src={p.imagen || '/assets/narrative/personajes/default.webp'}
                          alt={p.nombre}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/assets/narrative/personajes/default.webp';
                          }}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-[#f3f6fa] leading-tight truncate">{p.nombre}</h4>
                        <span className="text-[11px] font-semibold text-[#ecd098] block mt-0.5 truncate">
                          {p.titulo || 'Consejero Real'}
                        </span>
                        <span className="text-[10px] font-mono text-[#c0cbd7] block truncate">ID: {pid}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => abrirModalEditar(p)}
                        className="p-1.5 rounded-[9px] border border-[#52647b] bg-[#1b2737] hover:bg-[#2a394c] text-[#c0cbd7] hover:text-[#f3f6fa] transition cursor-pointer"
                        title="Editar personaje"
                      >
                        <EditIcon size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEliminar(pid)}
                        className="p-1.5 rounded-[9px] border border-[#52647b] bg-[#1b2737] hover:bg-[#2a394c] hover:border-[#f0bb98] text-[#f0bb98] transition cursor-pointer"
                        title="Eliminar personaje"
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Afinidad Inicial & Universo */}
                  <div className="flex items-center gap-2 mt-3.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[9px] bg-[#1b2737] border border-[#52647b] text-[#f0bb98] text-[11px] font-bold">
                      <HeartIcon size={13} />
                      <span>Afinidad base: {p.afinidad_inicial}%</span>
                    </span>
                    <span className="text-[10px] bg-[#1b2737] border border-[#52647b] px-2 py-1 rounded-[9px] font-mono text-[#c0cbd7]">
                      {p.universo_id}
                    </span>
                  </div>

                  {/* Descripción */}
                  <p className="text-xs text-[#c0cbd7] mt-2.5 line-clamp-2 leading-relaxed">
                    {p.descripcion || 'Sin descripción.'}
                  </p>

                  {/* EFECTOS EN CONSEJO (Unificado, limpio y elegante - sin repetición) */}
                  <div className="mt-3.5 pt-3 border-t border-[#364454] space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#ecd098]">
                      <span className="flex items-center gap-1.5">
                        <SparklesIcon size={13} className="text-[#ecd098]" />
                        Efectos en Consejo
                      </span>
                      {p.efectos && p.efectos.length > 0 && (
                        <span className="text-[10px] text-[#c0cbd7] font-normal lowercase font-mono">
                          {p.efectos.length} {p.efectos.length === 1 ? 'efecto' : 'efectos'}
                        </span>
                      )}
                    </div>

                    {(!p.efectos || p.efectos.length === 0) ? (
                      <p className="text-[11px] text-[#c0cbd7]/60 italic py-1">
                        Sin efectos configurados en consejo.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {p.efectos.map((ef, idx) => {
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
                <div className="mt-4 pt-3 border-t border-[#364454] flex flex-wrap gap-1">
                  {(p.tags || []).map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-[6px] bg-[#1b2737] border border-[#52647b] font-mono text-[10px] text-[#c0cbd7] font-semibold"
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

      {/* MODAL CREAR / EDITAR PERSONAJE (Paleta CogniJuegos, diseño horizontal full-width optimizado) */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-[#151e2b]/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 lg:p-8 overflow-y-auto">
          <div className="bg-[#2a394c] rounded-[16px] border border-[#52647b] shadow-2xl w-full max-w-5xl xl:max-w-6xl 2xl:max-w-7xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Cabecera del modal (#1b2737 con divisor #364454) */}
            <div className="px-6 py-4 border-b border-[#364454] bg-[#1b2737] flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-[9px] bg-[#2a394c] border border-[#52647b] text-[#ecd098] flex items-center justify-center shrink-0">
                  <UserIcon size={20} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm sm:text-base text-[#f3f6fa] truncate">
                      {esEdicion ? `Editar: ${nombre || id}` : 'Nuevo Personaje de Corte'}
                    </h3>
                    <span className="font-mono text-[10px] bg-[#2a394c] border border-[#52647b] px-2 py-0.5 rounded-[6px] text-[#c0cbd7]">
                      {id}
                    </span>
                    {universoId && (
                      <span className="text-[10px] bg-[#2a394c] border border-[#52647b] px-2 py-0.5 rounded-[6px] font-medium text-[#ecd098] hidden sm:inline-block">
                        {universos.find((u) => (u._id || u.id) === universoId)?.nombre || universoId}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#c0cbd7] mt-0.5">Configura identidad, lealtad y mecánicas pasivas en el consejo.</p>
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

            {/* Formulario con diseño horizontal por bloques sobre superficie narrativa #2e3c50 */}
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

              {/* BLOQUE 1: IDENTIDAD, RETRATO Y TAGS (Horizontal Completo) */}
              <div className="p-5 sm:p-6 rounded-[16px] border border-[#52647b] bg-[#2e3c50] space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#364454]">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#ecd098] flex items-center gap-2">
                    <UserIcon size={14} />
                    Identidad, Retrato y Perfil
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  {/* Retrato del personaje a la izquierda */}
                  <div className="md:col-span-4 lg:col-span-3 flex justify-center md:justify-start">
                    <ImageUploadField
                      label="Retrato del Personaje"
                      categoria="personajes"
                      value={imagen}
                      onChange={setImagen}
                    />
                  </div>

                  {/* Campos de Identidad a la derecha */}
                  <div className="md:col-span-8 lg:col-span-9 space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-[#c0cbd7] uppercase tracking-wider mb-1">
                          ID Personaje
                        </label>
                        <input
                          type="text"
                          value={id}
                          onChange={(e) => setId(e.target.value)}
                          disabled={esEdicion}
                          placeholder="ej. pj_canciller_elena"
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
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-[#c0cbd7] uppercase tracking-wider">
                            Afinidad Inicial
                          </label>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-[6px] border border-[#52647b] bg-[#1b2737] text-[#ecd098]">
                            {afinidadInicial}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={afinidadInicial}
                          onChange={(e) => setAfinidadInicial(parseInt(e.target.value, 10))}
                          className="w-full accent-[#ecd098] cursor-pointer mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-[#c0cbd7] uppercase tracking-wider mb-1">
                          Nombre Completo
                        </label>
                        <input
                          type="text"
                          value={nombre}
                          onChange={(e) => setNombre(e.target.value)}
                          placeholder="ej. Elena de Valoria"
                          className="w-full px-3 py-2 rounded-[9px] border border-[#52647b] bg-[#1b2737] text-xs font-bold text-[#f3f6fa] focus:outline-none focus:border-[#ecd098] focus:ring-1 focus:ring-[#ecd098]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#c0cbd7] uppercase tracking-wider mb-1">
                          Título / Cargo
                        </label>
                        <input
                          type="text"
                          value={titulo}
                          onChange={(e) => setTitulo(e.target.value)}
                          placeholder="ej. Canciller del Reino"
                          className="w-full px-3 py-2 rounded-[9px] border border-[#52647b] bg-[#1b2737] text-xs font-semibold text-[#f3f6fa] focus:outline-none focus:border-[#ecd098] focus:ring-1 focus:ring-[#ecd098]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#c0cbd7] uppercase tracking-wider mb-1">
                        Descripción del Personaje
                      </label>
                      <textarea
                        rows={2}
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        placeholder="Personalidad, antecedentes e inclinación política..."
                        className="w-full px-3 py-2 rounded-[9px] border border-[#52647b] bg-[#1b2737] text-xs text-[#f3f6fa] focus:outline-none focus:border-[#ecd098] focus:ring-1 focus:ring-[#ecd098] leading-relaxed resize-none"
                      />
                    </div>

                    <TagSelector
                      value={tags}
                      onChange={setTags}
                      universoId={universoId || universoFiltro}
                      label="Tags Temáticos del Personaje"
                    />
                  </div>
                </div>
              </div>

              {/* BLOQUE 2: CONDICIONES DE APARICIÓN (Horizontal Full-Width) */}
              <div className="p-5 sm:p-6 rounded-[16px] border border-[#52647b] bg-[#2e3c50]">
                <CondicionesAparicionEditor
                  condiciones={condicionesAparicion}
                  onChange={setCondicionesAparicion}
                  universoId={universoId || universoFiltro}
                />
              </div>

              {/* BLOQUE 3: EFECTOS PASIVOS Y DESACOPLADOS (Horizontal Full-Width) */}
              <div className="p-5 sm:p-6 rounded-[16px] border border-[#52647b] bg-[#2e3c50]">
                <EfectosEditor
                  efectos={efectos}
                  onChange={setEfectos}
                  universoId={universoId || universoFiltro}
                  tipoEntidad="personaje"
                  recursosDisponibles={['oro', 'pueblo', 'ejercito', 'fe']}
                />
              </div>

              {/* Botones de acción fijos al fondo */}
              <div className="pt-4 border-t border-[#364454] bg-[#1b2737] -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-4 sm:p-5 flex items-center justify-between gap-3 shrink-0 rounded-b-[16px]">
                <span className="text-[11px] text-[#c0cbd7] hidden sm:inline-block">
                  Los cambios se aplican de inmediato en la simulación narrativa.
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
                    <span>{guardando ? 'Guardando...' : esEdicion ? 'Actualizar Personaje' : 'Crear Personaje'}</span>
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
