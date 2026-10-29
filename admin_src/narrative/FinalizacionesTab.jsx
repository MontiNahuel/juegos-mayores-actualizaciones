/* Permite configurar finales según el universo y sus recursos. */
import { useState, useEffect } from 'react';
import {
  SkullIcon,
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
  CrownIcon,
  SparklesIcon,
} from '../Icons';
import ImageUploadField from './ImageUploadField';

const TIPOS_FINALIZACION = [
  { id: 'derrota_recurso', label: 'Derrota por Agotamiento de Recurso (≤ 0)' },
  { id: 'derrota_narrativa', label: 'Derrota Narrativa por Evento / Diálogo' },
  { id: 'victoria_especial', label: 'Victoria Especial / Final Alternativo' },
];

const RANGOS = ['F', 'D', 'C', 'B', 'A', 'S'];

// Permite configurar finales según el universo y sus recursos.
export default function FinalizacionesTab({ universos = [] }) {
  const [finalizaciones, setFinalizaciones] = useState([]);
  const [universoFiltro, setUniversoFiltro] = useState('');
  const [recursoFiltro, setRecursoFiltro] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [sembrando, setSembrando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  // Modal Crear/Editar
  const [modalAbierto, setModalAbierto] = useState(false);
  const [esEdicion, setEsEdicion] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Campos del formulario
  const [id, setId] = useState('');
  const [universoId, setUniversoId] = useState('');
  const [recursoClave, setRecursoClave] = useState('');
  const [tipo, setTipo] = useState('derrota_recurso');
  const [titulo, setTitulo] = useState('');
  const [texto, setTexto] = useState('');
  const [imagen, setImagen] = useState('/assets/narrative/finalizaciones/default.webp');
  const [rango, setRango] = useState('F');

  // Recursos disponibles para el filtro actual
  const recursosFiltroDisponibles = universoFiltro
    ? universos.find(/* Busca el primer elemento que cumple esta condición. */ (u) => (u._id || u.id) === universoFiltro)?.recursos || []
    : Array.from(new Set(universos.flatMap(/* Prepara y reúne los resultados de cada elemento. */ (u) => u.recursos || []).map(/* Prepara el resultado de cada elemento. */ (r) => r.clave))).map(/* Prepara el resultado de cada elemento. */ (clave) => {
        const item = universos.flatMap(/* Prepara y reúne los resultados de cada elemento. */ (u) => u.recursos || []).find(/* Busca el primer elemento que cumple esta condición. */ (r) => r.clave === clave);
        return item || { clave, nombre: clave };
      });

  // Recursos válidos EXCLUSIVAMENTE para el universo seleccionado actualmente en el modal
  const universoModal = universos.find(/* Busca el primer elemento que cumple esta condición. */ (u) => (u._id || u.id) === universoId);
  const recursosModalDisponibles = universoModal?.recursos || [];

  // Carga finalizaciones con los datos de este paso.
  const cargarFinalizaciones = async (uId = universoFiltro, rClave = recursoFiltro) => {
    setCargando(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (uId) params.append('universo_id', uId);
      if (rClave) params.append('recurso_clave', rClave);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`/api/narrative/admin/finalizaciones${qs}`);
      if (res.ok) {
        const data = await res.json();
        setFinalizaciones(data);
      } else {
        setError('No se pudo cargar la lista de finalizaciones.');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión al cargar finalizaciones.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(/* Sincroniza este efecto cuando cambian los datos de los que depende. */ () => {
    cargarFinalizaciones(universoFiltro, recursoFiltro);
  }, [universoFiltro, recursoFiltro]);

  // Abre el formulario vacío para crear un registro.
  const abrirModalNuevo = () => {
    const uDefecto = universoFiltro || universos[0]?._id || universos[0]?.id || 'corte_medieval';
    const uObj = universos.find(/* Busca el primer elemento que cumple esta condición. */ (u) => (u._id || u.id) === uDefecto);
    const primerRec = uObj?.recursos?.[0]?.clave || 'oro';

    setEsEdicion(false);
    setId(`fin_${uDefecto}_${primerRec}_cero`);
    setUniversoId(uDefecto);
    setRecursoClave(primerRec);
    setTipo('derrota_recurso');
    setTitulo('');
    setTexto('');
    setImagen('/assets/narrative/finalizaciones/default.webp');
    setRango('F');
    setError('');
    setExito('');
    setModalAbierto(true);
  };

  // Carga el registro en el formulario de edición.
  const abrirModalEditar = (fin) => {
    setEsEdicion(true);
    setId(fin._id || fin.id);
    setUniversoId(fin.universo_id || '');
    setRecursoClave(fin.recurso_clave || '');
    setTipo(fin.tipo || 'derrota_recurso');
    setTitulo(fin.titulo || '');
    setTexto(fin.texto || '');
    setImagen(fin.imagen || '/assets/narrative/finalizaciones/default.webp');
    setRango(fin.rango || 'F');
    setError('');
    setExito('');
    setModalAbierto(true);
  };

  // Cambia el universo y ajusta los recursos del formulario.
  const handleCambioUniversoModal = (nuevoUid) => {
    setUniversoId(nuevoUid);
    const uObj = universos.find(/* Busca el primer elemento que cumple esta condición. */ (u) => (u._id || u.id) === nuevoUid);
    const primerRec = uObj?.recursos?.[0]?.clave || '';
    setRecursoClave(primerRec);
    if (!esEdicion) {
      setId(`fin_${nuevoUid}_${primerRec || 'recurso'}_cero`);
    }
  };

  // Actualiza el recurso elegido para configurar el final.
  const handleCambioRecursoModal = (nuevoRec) => {
    setRecursoClave(nuevoRec);
    if (!esEdicion) {
      setId(`fin_${universoId}_${nuevoRec || 'recurso'}_cero`);
    }
  };

  // Crea las finalizaciones iniciales para los universos configurados.
  const autoSembrarFinalizaciones = async () => {
    const targetUniverso = universoFiltro || universos[0]?._id || universos[0]?.id || 'corte_medieval';
    const nombreU = universos.find(/* Busca el primer elemento que cumple esta condición. */ (u) => (u._id || u.id) === targetUniverso)?.nombre || targetUniverso;
    if (!window.confirm(`¿Deseas autogenerar las finalizaciones base para todos los recursos del universo "${nombreU}"?`)) {
      return;
    }
    setSembrando(true);
    setError('');
    setExito('');
    try {
      const res = await fetch(`/api/narrative/admin/universos/${encodeURIComponent(targetUniverso)}/sembrar-finalizaciones`, {
        method: 'POST'
      });
      if (res.ok) {
        const creadas = await res.json();
        setExito(`Finalizaciones sincronizadas para "${nombreU}" (${creadas.length} registradas en catálogo).`);
        cargarFinalizaciones(universoFiltro, recursoFiltro);
      } else {
        const errData = await res.json().catch(/* Maneja el fallo de esta operación. */ () => ({}));
        setError(errData.detail || 'Error al sembrar finalizaciones.');
      }
    } catch (e) {
      console.error(e);
      setError('Error de conexión al sembrar.');
    } finally {
      setSembrando(false);
    }
  };

  // Guarda finalizacion con los datos de este paso.
  const guardarFinalizacion = async (e) => {
    e.preventDefault();
    if (!id.trim() || !titulo.trim() || !universoId) {
      setError('El ID, el Universo y el Título son obligatorios.');
      return;
    }

    setGuardando(true);
    setError('');
    setExito('');

    const payload = {
      _id: id.trim(),
      universo_id: universoId,
      recurso_clave: recursoClave.trim() || null,
      tipo,
      titulo: titulo.trim(),
      texto: texto.trim(),
      imagen: imagen || '/assets/narrative/finalizaciones/default.webp',
      rango: rango || 'F',
    };

    try {
      const res = await fetch('/api/narrative/admin/finalizaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setExito(esEdicion ? 'Finalización actualizada con éxito.' : 'Finalización creada con éxito.');
        setModalAbierto(false);
        cargarFinalizaciones(universoFiltro, recursoFiltro);
      } else {
        const errData = await res.json().catch(/* Maneja el fallo de esta operación. */ () => ({}));
        setError(errData.detail || 'Error al guardar la finalización.');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión al guardar.');
    } finally {
      setGuardando(false);
    }
  };

  // Quita finalizacion con los datos de este paso.
  const eliminarFinalizacion = async (finId) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar la finalización "${finId}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/narrative/admin/finalizaciones/${encodeURIComponent(finId)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setExito('Finalización eliminada correctamente.');
        cargarFinalizaciones(universoFiltro, recursoFiltro);
      } else {
        const errData = await res.json().catch(/* Maneja el fallo de esta operación. */ () => ({}));
        setError(errData.detail || 'Error al eliminar finalización.');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión al eliminar.');
    }
  };

  const finalizacionesFiltradas = finalizaciones.filter(/* Conserva los elementos que cumplen esta condición. */ (fin) => {
    const matchBusqueda =
      fin.titulo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      fin.texto?.toLowerCase().includes(busqueda.toLowerCase()) ||
      fin._id?.toLowerCase().includes(busqueda.toLowerCase()) ||
      fin.universo_id?.toLowerCase().includes(busqueda.toLowerCase()) ||
      fin.recurso_clave?.toLowerCase().includes(busqueda.toLowerCase());
    return matchBusqueda;
  });

  return (
    <div className="space-y-6">
      {/* Barra de Controles y Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Selector de Universo */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs">
            <CrownIcon size={14} className="text-slate-500" />
            <select
              value={universoFiltro}
              onChange={/* Responde a change desde este control. */ (e) => {
                setUniversoFiltro(e.target.value);
                setRecursoFiltro('');
              }}
              className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="">Todos los Universos</option>
              {universos.map(/* Prepara el resultado de cada elemento. */ (u) => (
                <option key={u._id || u.id} value={u._id || u.id}>
                  {u.nombre} ({u._id || u.id})
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Recurso */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs">
            <CoinsIcon size={14} className="text-slate-500" />
            <select
              value={recursoFiltro}
              onChange={/* Responde a change desde este control. */ (e) => setRecursoFiltro(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="">Todos los Recursos</option>
              {recursosFiltroDisponibles.map(/* Prepara el resultado de cada elemento. */ (r) => (
                <option key={r.clave} value={r.clave}>
                  {r.nombre || r.clave} ({r.clave})
                </option>
              ))}
            </select>
          </div>

          {/* Buscador */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs flex-1 min-w-[200px]">
            <SearchIcon size={14} className="text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por título, universo o recurso..."
              value={busqueda}
              onChange={/* Responde a change desde este control. */ (e) => setBusqueda(e.target.value)}
              className="bg-transparent text-slate-700 font-medium outline-none w-full placeholder:text-slate-400"
            />
            {busqueda && (
              <button
                type="button"
                onClick={/* Responde a click desde este control. */ () => setBusqueda('')}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <XIcon size={12} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón Autogenerar Finalizaciones Base para el Universo */}
          <button
            type="button"
            onClick={autoSembrarFinalizaciones}
            disabled={sembrando}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
            title="Generar finales de derrota para los recursos de este universo que aún no tengan finalización"
          >
            <SparklesIcon size={14} className={sembrando ? 'animate-spin' : 'text-amber-600'} />
            <span className="hidden sm:inline">Generar Finales Base</span>
          </button>

          <button
            type="button"
            onClick={/* Responde a click desde este control. */ () => cargarFinalizaciones(universoFiltro, recursoFiltro)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
            title="Refrescar lista"
          >
            <RefreshIcon size={16} className={cargando ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={abrirModalNuevo}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition shadow-xs cursor-pointer"
          >
            <PlusIcon size={14} />
            <span>Nueva Finalización</span>
          </button>
        </div>
      </div>

      {/* Alertas Globales */}
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangleIcon size={16} />
            <span>{error}</span>
          </div>
          <button type="button" onClick={/* Responde a click desde este control. */ () => setError('')} className="cursor-pointer">
            <XIcon size={14} />
          </button>
        </div>
      )}

      {exito && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckIcon size={16} />
            <span>{exito}</span>
          </div>
          <button type="button" onClick={/* Responde a click desde este control. */ () => setExito('')} className="cursor-pointer">
            <XIcon size={14} />
          </button>
        </div>
      )}

      {/* Listado en Cuadrícula */}
      {cargando ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
          <RefreshIcon size={24} className="animate-spin text-[#002B5E]" />
          <p className="text-xs font-semibold">Cargando finalizaciones asociadas a cada universo...</p>
        </div>
      ) : finalizacionesFiltradas.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300 p-8">
          <SkullIcon size={36} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No hay finalizaciones para el filtro actual</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
            Cada universo tiene sus propias finalizaciones personalizadas. Puedes autogenerar las plantillas base con un clic.
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={autoSembrarFinalizaciones}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition cursor-pointer"
            >
              <SparklesIcon size={14} />
              <span>Autogenerar para este Universo</span>
            </button>
            <button
              type="button"
              onClick={abrirModalNuevo}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition cursor-pointer"
            >
              <PlusIcon size={14} />
              <span>Crear Manualmente</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {finalizacionesFiltradas.map(/* Prepara el resultado de cada elemento. */ (fin) => {
            const uInfo = universos.find(/* Busca el primer elemento que cumple esta condición. */ (u) => (u._id || u.id) === fin.universo_id);
            const uNombre = uInfo?.nombre || fin.universo_id;

            return (
              <div
                key={fin._id || fin.id}
                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col"
              >
                {/* Cabecera con Imagen */}
                <div className="relative h-40 bg-slate-900 overflow-hidden">
                  <img
                    src={fin.imagen || '/assets/narrative/finalizaciones/default.webp'}
                    alt={fin.titulo}
                    className="w-full h-full object-cover opacity-90 hover:scale-105 transition duration-300"
                    onError={/* Responde a error desde este control. */ (e) => {
                      e.target.src = '/assets/narrative/finalizaciones/default.webp';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                  {/* Badges superiores */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-900/90 backdrop-blur-xs text-amber-300 border border-amber-500/30 truncate max-w-[170px]">
                      {uNombre}
                    </span>

                    <span className="text-xs font-black px-2 py-0.5 rounded-md bg-red-950/80 text-red-300 border border-red-500/40">
                      Rango {fin.rango || 'F'}
                    </span>
                  </div>

                  {/* Título en la imagen */}
                  <div className="absolute bottom-2.5 left-3 right-3">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-red-300">
                      {fin.tipo}
                    </span>
                    <h4 className="text-sm font-black text-white leading-tight drop-shadow-xs">
                      {fin.titulo}
                    </h4>
                  </div>
                </div>

                {/* Cuerpo de la Tarjeta */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    {/* Recurso Clave y Universo */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {fin.recurso_clave ? (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-red-50 border border-red-200/60 text-red-800 text-[10px] font-bold">
                          <SkullIcon size={12} className="text-red-500" />
                          <span>Recurso:</span>
                          <strong className="uppercase">{fin.recurso_clave} ≤ 0</strong>
                        </div>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-semibold">
                          Sin recurso asignado
                        </span>
                      )}

                      <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-mono">
                        univ: {fin.universo_id}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {fin.texto}
                    </p>
                  </div>

                  {/* Acciones */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400 truncate max-w-[140px]" title={fin._id}>
                      {fin._id}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={/* Responde a click desde este control. */ () => abrirModalEditar(fin)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-[#002B5E] hover:bg-slate-100 transition cursor-pointer"
                        title="Editar finalización"
                      >
                        <EditIcon size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={/* Responde a click desde este control. */ () => eliminarFinalizacion(fin._id || fin.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Eliminar finalización"
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear / Editar */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl w-full max-w-2xl my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Cabecera Modal */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-red-600/30 text-red-400 border border-red-500/30 flex items-center justify-center">
                  <SkullIcon size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black">
                    {esEdicion ? 'Editar Finalización de Universo' : 'Nueva Finalización de Universo'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Define la derrota o desenlace específico para el universo seleccionado
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={/* Responde a click desde este control. */ () => setModalAbierto(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer p-1"
              >
                <XIcon size={18} />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={guardarFinalizacion} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Universo y Recurso (Filtrado estricto) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Universo Asociado *
                  </label>
                  <select
                    value={universoId}
                    disabled={esEdicion}
                    onChange={/* Responde a change desde este control. */ (e) => handleCambioUniversoModal(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold focus:bg-white focus:border-[#002B5E] outline-none cursor-pointer disabled:opacity-60"
                  >
                    {universos.map(/* Prepara el resultado de cada elemento. */ (u) => (
                      <option key={u._id || u.id} value={u._id || u.id}>
                        {u.nombre} ({u._id || u.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Recurso Agotado de este Universo
                  </label>
                  <select
                    value={recursoClave}
                    onChange={/* Responde a change desde este control. */ (e) => handleCambioRecursoModal(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold focus:bg-white focus:border-[#002B5E] outline-none cursor-pointer"
                  >
                    <option value="">(Sin recurso / Victoria especial)</option>
                    {recursosModalDisponibles.map(/* Prepara el resultado de cada elemento. */ (r) => (
                      <option key={r.clave} value={r.clave}>
                        {r.nombre || r.clave} ({r.clave})
                      </option>
                    ))}
                  </select>
                  {recursosModalDisponibles.length === 0 && (
                    <span className="text-[10px] text-amber-600 block mt-0.5">
                      Este universo no tiene recursos configurados aún.
                    </span>
                  )}
                </div>
              </div>

              {/* ID y Tipo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    ID Único (namespaced) *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={esEdicion}
                    value={id}
                    onChange={/* Responde a change desde este control. */ (e) => setId(e.target.value)}
                    placeholder="ej: fin_granjero_oro_cero"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-mono disabled:opacity-60 focus:bg-white focus:border-[#002B5E] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Tipo de Desenlace
                  </label>
                  <select
                    value={tipo}
                    onChange={/* Responde a change desde este control. */ (e) => setTipo(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold focus:bg-white focus:border-[#002B5E] outline-none cursor-pointer"
                  >
                    {TIPOS_FINALIZACION.map(/* Prepara el resultado de cada elemento. */ (t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Rango y Título */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Rango
                  </label>
                  <select
                    value={rango}
                    onChange={/* Responde a change desde este control. */ (e) => setRango(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-bold focus:bg-white focus:border-[#002B5E] outline-none cursor-pointer"
                  >
                    {RANGOS.map(/* Prepara el resultado de cada elemento. */ (rg) => (
                      <option key={rg} value={rg}>
                        Rango {rg}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Título del Desenlace *
                  </label>
                  <input
                    type="text"
                    required
                    value={titulo}
                    onChange={/* Responde a change desde este control. */ (e) => setTitulo(e.target.value)}
                    placeholder={`ej: Embargo de la Granja, Bancarrota, etc.`}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-bold focus:bg-white focus:border-[#002B5E] outline-none"
                  />
                </div>
              </div>

              {/* Texto / Relato */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Relato Narrativo de la Finalización
                </label>
                <textarea
                  rows={4}
                  value={texto}
                  onChange={/* Responde a change desde este control. */ (e) => setTexto(e.target.value)}
                  placeholder="Describe qué ocurrió en este universo particular al agotarse el recurso o alcanzar este final..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:bg-white focus:border-[#002B5E] outline-none leading-relaxed"
                />
              </div>

              {/* Subida de Imagen con optimizador WebP */}
              <ImageUploadField
                label="Ilustración de la Finalización (WebP)"
                value={imagen}
                onChange={setImagen}
                categoria="finalizaciones"
                placeholder="/assets/narrative/finalizaciones/default.webp"
              />

              {/* Vista previa en miniatura */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 border border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                  Vista Previa del Banner de Derrota ({universoModal?.nombre || universoId})
                </span>
                <div className="flex gap-4 items-center">
                  <div className="w-24 h-16 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 border border-slate-700">
                    <img
                      src={imagen || '/assets/narrative/finalizaciones/default.webp'}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={/* Responde a error desde este control. */ (e) => {
                        e.target.src = '/assets/narrative/finalizaciones/default.webp';
                      }}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-red-400">Rango {rango}</span>
                      <span className="text-xs font-bold text-white">{titulo || '(Sin título aún)'}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5">
                      {texto || '(El relato del final se mostrará aquí para el estudiante)'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
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
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {guardando ? (
                    <>
                      <RefreshIcon size={14} className="animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon size={14} />
                      <span>{esEdicion ? 'Actualizar Finalización' : 'Crear Finalización'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
