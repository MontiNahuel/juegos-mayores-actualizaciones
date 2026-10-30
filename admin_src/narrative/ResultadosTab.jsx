/* Permite editar resultados de eventos y efectos en la partida. */
import { useState, useEffect } from 'react';
import {
  SparklesIcon,
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
  HeartIcon,
} from '../Icons';
import ImageUploadField from './ImageUploadField';

// Permite editar resultados de eventos y efectos en la partida.
export default function ResultadosTab({ universos = [], personajes = [] }) {
  const [resultados, setResultados] = useState([]);
  const [universoFiltro, setUniversoFiltro] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('TODOS');
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
  const [titulo, setTitulo] = useState('');
  const [texto, setTexto] = useState('');
  const [imagen, setImagen] = useState('/assets/narrative/resultados/default.webp');
  const [tipoResultado, setTipoResultado] = useState('positivo');
  const [efectos, setEfectos] = useState([]);
  const [afinidades, setAfinidades] = useState([]);

  // Carga resultados con los datos de este paso.
  const cargarResultados = async (uId = universoFiltro) => {
    setCargando(true);
    setError('');
    try {
      const url = uId
        ? `/api/narrative/admin/resultados?universo_id=${encodeURIComponent(uId)}`
        : '/api/narrative/admin/resultados';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setResultados(data);
      } else {
        setError('No se pudo cargar la lista de resultados.');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión al cargar resultados.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(/* Sincroniza este efecto cuando cambian los datos de los que depende. */ () => {
    cargarResultados(universoFiltro);
  }, [universoFiltro]);

  // Abre el formulario vacío para crear un registro.
  const abrirModalNuevo = () => {
    setEsEdicion(false);
    setId('res_' + Date.now().toString(36));
    setUniversoId(universoFiltro || universos[0]?._id || universos[0]?.id || 'corte_medieval');
    setTitulo('');
    setTexto('');
    setImagen('/assets/narrative/resultados/default.webp');
    setTipoResultado('positivo');
    setEfectos([{ clave: 'oro', valor: 15 }]);
    setAfinidades([]);
    setError('');
    setExito('');
    setModalAbierto(true);
  };

  // Carga el registro en el formulario de edición.
  const abrirModalEditar = (r) => {
    setEsEdicion(true);
    setId(r._id || r.id);
    setUniversoId(r.universo_id || '');
    setTitulo(r.titulo || '');
    setTexto(r.texto || '');
    setImagen(r.imagen || '/assets/narrative/resultados/default.webp');
    setTipoResultado(r.tipo_resultado || 'positivo');

    // Mapear efectos existentes
    const efs = (r.efectos || []).map(/* Prepara el resultado de cada elemento. */ (ef) => ({
      clave: ef.accion?.clave || 'oro',
      valor: ef.accion?.valor ?? 10,
    }));
    setEfectos(efs.length > 0 ? efs : []);

    // Mapear afinidades existentes
    const afs = (r.impacto_afinidad || []).map(/* Prepara el resultado de cada elemento. */ (af) => ({
      personaje_id: af.personaje_id,
      delta: af.delta,
    }));
    setAfinidades(afs);

    setError('');
    setExito('');
    setModalAbierto(true);
  };

  // Agrega efecto con los datos de este paso.
  const handleAgregarEfecto = () => {
    setEfectos([...efectos, { clave: 'pueblo', valor: 10 }]);
  };

  // Actualiza efecto con los datos de este paso.
  const handleCambiarEfecto = (idx, campo, valor) => {
    const nuevos = [...efectos];
    nuevos[idx][campo] = valor;
    setEfectos(nuevos);
  };

  // Quita efecto con los datos de este paso.
  const handleEliminarEfecto = (idx) => {
    setEfectos(efectos.filter(/* Conserva los elementos que cumplen esta condición. */ (_, i) => i !== idx));
  };

  // Agrega afinidad con los datos de este paso.
  const handleAgregarAfinidad = () => {
    const defaultPj = personajes[0]?._id || personajes[0]?.id || 'pj_canciller_elena';
    setAfinidades([...afinidades, { personaje_id: defaultPj, delta: 10 }]);
  };

  // Actualiza afinidad con los datos de este paso.
  const handleCambiarAfinidad = (idx, campo, valor) => {
    const nuevos = [...afinidades];
    nuevos[idx][campo] = valor;
    setAfinidades(nuevos);
  };

  // Quita afinidad con los datos de este paso.
  const handleEliminarAfinidad = (idx) => {
    setAfinidades(afinidades.filter(/* Conserva los elementos que cumplen esta condición. */ (_, i) => i !== idx));
  };

  // Valida el formulario y guarda los cambios.
  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!id.trim() || !titulo.trim() || !universoId.trim()) {
      setError('El identificador, el título y el universo son obligatorios.');
      return;
    }

    setGuardando(true);
    setError('');
    setExito('');

    const payload = {
      _id: id.trim(),
      universo_id: universoId.trim(),
      titulo: titulo.trim(),
      texto: texto.trim(),
      imagen: imagen.trim() || '/assets/narrative/resultados/default.webp',
      tipo_resultado: tipoResultado,
      efectos: efectos.map(/* Prepara el resultado de cada elemento. */ (ef) => ({
        disparador: 'al_obtener',
        condiciones: [],
        accion: {
          tipo: 'modificar_recurso',
          clave: ef.clave,
          valor: parseFloat(ef.valor) || 0,
          tipo_calculo: 'fijo',
        },
      })),
      impacto_afinidad: afinidades.map(/* Prepara el resultado de cada elemento. */ (af) => ({
        personaje_id: af.personaje_id,
        delta: parseInt(af.delta, 10) || 0,
      })),
    };

    try {
      const res = await fetch('/api/narrative/admin/resultados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Error al guardar resultado.');
      }

      setExito('Resultado guardado correctamente.');
      setTimeout(/* Ejecuta este paso cuando se cumple la espera. */ () => {
        setModalAbierto(false);
        cargarResultados(universoFiltro);
      }, 600);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al procesar la solicitud.');
    } finally {
      setGuardando(false);
    }
  };

  // Pide borrar el registro y actualiza la lista.
  const handleEliminar = async (rId) => {
    if (!confirm(`¿Estás seguro de eliminar el resultado "${rId}"?`)) return;
    try {
      const res = await fetch(`/api/narrative/admin/resultados/${rId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        cargarResultados(universoFiltro);
      } else {
        const err = await res.json();
        alert(err.detail || 'No se pudo eliminar el resultado.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al eliminar.');
    }
  };

  // Elige el estilo de la etiqueta según el tipo de resultado.
  const getTipoBadge = (tipo) => {
    switch (tipo) {
      case 'positivo':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'negativo':
      case 'catastrofico':
        return 'bg-rose-50 text-rose-800 border-rose-300';
      default:
        return 'bg-amber-50 text-amber-800 border-amber-300';
    }
  };

  const resultadosFiltrados = resultados.filter(/* Conserva los elementos que cumplen esta condición. */ (r) => {
    if (tipoFiltro !== 'TODOS' && r.tipo_resultado !== tipoFiltro) {
      return false;
    }
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      (r.titulo && r.titulo.toLowerCase().includes(q)) ||
      (r._id && r._id.toLowerCase().includes(q)) ||
      (r.texto && r.texto.toLowerCase().includes(q))
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
              onChange={/* Responde a change desde este control. */ (e) => setUniversoFiltro(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="">Todos los Universos</option>
              {universos.map(/* Prepara el resultado de cada elemento. */ (u) => (
                <option key={u._id || u.id} value={u._id || u.id}>
                  {u.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Tipo */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            {['TODOS', 'positivo', 'neutro', 'negativo'].map(/* Prepara el resultado de cada elemento. */ (t) => (
              <button
                key={t}
                type="button"
                onClick={/* Responde a click desde este control. */ () => setTipoFiltro(t)}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer capitalize ${
                  tipoFiltro === t ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t === 'TODOS' ? 'Todos' : t}
              </button>
            ))}
          </div>

          {/* Buscador */}
          <div className="relative">
            <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={/* Responde a change desde este control. */ (e) => setBusqueda(e.target.value)}
              placeholder="Buscar resultado por título..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#002B5E] w-48 sm:w-60"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={/* Responde a click desde este control. */ () => cargarResultados(universoFiltro)}
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
            <span>Nuevo Resultado</span>
          </button>
        </div>
      </div>

      {/* Grilla de Resultados */}
      {cargando ? (
        <div className="py-12 text-center text-slate-400 text-xs font-semibold">
          Cargando catálogo de resultados...
        </div>
      ) : resultadosFiltrados.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-2xl border border-slate-200/80 p-6 text-slate-400 text-xs">
          No se encontraron resultados en el catálogo. Haz clic en "Nuevo Resultado" para crear uno.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resultadosFiltrados.map(/* Prepara el resultado de cada elemento. */ (r) => {
            const rid = r._id || r.id;
            return (
              <div
                key={rid}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-2xs">
                        <img
                          src={r.imagen || '/assets/narrative/resultados/default.webp'}
                          alt={r.titulo}
                          onError={/* Responde a error desde este control. */ (e) => {
                            e.target.onerror = null;
                            e.target.src = '/assets/narrative/resultados/default.webp';
                          }}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${getTipoBadge(
                            r.tipo_resultado
                          )}`}
                        >
                          {r.tipo_resultado}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 mt-1 leading-tight">{r.titulo}</h4>
                        <span className="text-[9px] font-mono text-slate-400">ID: {rid}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={/* Responde a click desde este control. */ () => abrirModalEditar(r)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                        title="Editar resultado"
                      >
                        <EditIcon size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={/* Responde a click desde este control. */ () => handleEliminar(rid)}
                        className="p-1.5 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                        title="Eliminar resultado"
                      >
                        <TrashIcon size={13} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-3 line-clamp-3 leading-relaxed">
                    {r.texto || 'Sin texto descriptivo.'}
                  </p>

                  {/* Deltas de Recursos */}
                  {r.efectos && r.efectos.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Impacto en Recursos:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {r.efectos.map(/* Prepara el resultado de cada elemento. */ (ef, idx) => {
                          const a = ef.accion || {};
                          const isPos = a.valor > 0;
                          return (
                            <span
                              key={idx}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                                isPos
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              }`}
                            >
                              <CoinsIcon size={11} />
                              <span>
                                {a.clave?.toUpperCase()} {isPos ? `+${a.valor}` : a.valor}
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Deltas de Afinidad */}
                  {r.impacto_afinidad && r.impacto_afinidad.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Impacto en Afinidad:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {r.impacto_afinidad.map(/* Prepara el resultado de cada elemento. */ (af, idx) => {
                          const isPos = af.delta > 0;
                          return (
                            <span
                              key={idx}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                                isPos
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              }`}
                            >
                              <HeartIcon size={11} />
                              <span>
                                {af.personaje_id}: {isPos ? `+${af.delta}` : af.delta}
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>{r.universo_id}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL CREAR / EDITAR RESULTADO */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl w-full max-w-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Cabecera */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <SparklesIcon size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {esEdicion ? 'Editar Desenlace' : 'Nuevo Desenlace de Evento'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Define la consecuencia narrativa y el balance de recursos.</p>
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    ID Desenlace
                  </label>
                  <input
                    type="text"
                    value={id}
                    onChange={/* Responde a change desde este control. */ (e) => setId(e.target.value)}
                    disabled={esEdicion}
                    placeholder="ej. res_victoria_militar"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono font-semibold text-slate-800 disabled:bg-slate-100 disabled:text-slate-500 focus:outline-none focus:border-[#002B5E]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Universo
                  </label>
                  <select
                    value={universoId}
                    onChange={/* Responde a change desde este control. */ (e) => setUniversoId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-[#002B5E]"
                  >
                    {universos.map(/* Prepara el resultado de cada elemento. */ (u) => (
                      <option key={u._id || u.id} value={u._id || u.id}>
                        {u.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Tipo de Desenlace
                  </label>
                  <select
                    value={tipoResultado}
                    onChange={/* Responde a change desde este control. */ (e) => setTipoResultado(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-[#002B5E]"
                  >
                    <option value="positivo">Positivo (Éxito / Victoria)</option>
                    <option value="neutro">Neutro (Balance / Mitigado)</option>
                    <option value="negativo">Negativo (Pérdida / Crisis)</option>
                    <option value="catastrofico">Catastrófico (Gran Golpe)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Título del Desenlace
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={/* Responde a change desde este control. */ (e) => setTitulo(e.target.value)}
                  placeholder="ej. Victoria Aplastante en la Frontera"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-[#002B5E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Texto Narrativo que ve el Jugador
                </label>
                <textarea
                  rows={3}
                  value={texto}
                  onChange={/* Responde a change desde este control. */ (e) => setTexto(e.target.value)}
                  placeholder="Relata qué sucedió exactamente tras tomar esta decisión..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#002B5E]"
                />
              </div>

              <ImageUploadField
                label="Ilustración del Desenlace"
                categoria="resultados"
                value={imagen}
                onChange={setImagen}
                helperText="Ilustración de la escena o desenlace. Proporción panorámica recomendada (900x500 px)."
              />

              {/* SECCIÓN DE IMPACTO EN RECURSOS */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Modificadores de Recursos ({efectos.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAgregarEfecto}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#002B5E] hover:underline cursor-pointer"
                  >
                    <PlusIcon size={13} />
                    <span>Agregar Recurso</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {efectos.map(/* Prepara el resultado de cada elemento. */ (ef, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center gap-2 text-xs"
                    >
                      <select
                        value={ef.clave}
                        onChange={/* Responde a change desde este control. */ (e) => handleCambiarEfecto(idx, 'clave', e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-[11px] text-slate-800 w-36"
                      >
                        <option value="oro">Oro</option>
                        <option value="pueblo">Pueblo</option>
                        <option value="ejercito">Ejército</option>
                        <option value="fe">Fe</option>
                      </select>

                      <span className="text-[11px] text-slate-500 font-bold">Delta:</span>
                      <input
                        type="number"
                        value={ef.valor}
                        onChange={/* Responde a change desde este control. */ (e) => handleCambiarEfecto(idx, 'valor', parseFloat(e.target.value))}
                        className="w-24 px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-center"
                      />

                      <button
                        type="button"
                        onClick={/* Responde a click desde este control. */ () => handleEliminarEfecto(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer ml-auto"
                        title="Quitar efecto"
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECCIÓN DE IMPACTO EN AFINIDADES */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Impacto en Afinidad de Personajes ({afinidades.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAgregarAfinidad}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#002B5E] hover:underline cursor-pointer"
                  >
                    <PlusIcon size={13} />
                    <span>Agregar Afinidad</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {afinidades.map(/* Prepara el resultado de cada elemento. */ (af, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center gap-2 text-xs"
                    >
                      <input
                        type="text"
                        value={af.personaje_id}
                        onChange={/* Responde a change desde este control. */ (e) => handleCambiarAfinidad(idx, 'personaje_id', e.target.value)}
                        placeholder="ID Personaje (ej. pj_canciller_elena)"
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-[11px]"
                      />

                      <span className="text-[11px] text-slate-500 font-bold">Delta:</span>
                      <input
                        type="number"
                        value={af.delta}
                        onChange={/* Responde a change desde este control. */ (e) => handleCambiarAfinidad(idx, 'delta', parseInt(e.target.value, 10))}
                        className="w-20 px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-center"
                      />

                      <button
                        type="button"
                        onClick={/* Responde a click desde este control. */ () => handleEliminarAfinidad(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer ml-auto"
                        title="Quitar afinidad"
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
                  <span>{guardando ? 'Guardando...' : esEdicion ? 'Actualizar Resultado' : 'Crear Resultado'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
