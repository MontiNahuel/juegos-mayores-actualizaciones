/* Permite editar conversaciones, respuestas y cambios de afinidad. */
import { useState, useEffect } from 'react';
import {
  MessageSquareIcon,
  PlusIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
  AlertTriangleIcon,
  RefreshIcon,
  XIcon,
  FilterIcon,
  UsersIcon,
  HeartIcon,
} from '../Icons';
import ImageUploadField from './ImageUploadField';

// Permite editar conversaciones, respuestas y cambios de afinidad.
export default function ConversacionesTab({ universos = [], personajes = [] }) {
  const [conversaciones, setConversaciones] = useState([]);
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
  const [titulo, setTitulo] = useState('');
  const [imagen, setImagen] = useState('/assets/narrative/conversaciones/default.webp');
  const [reqPj1, setReqPj1] = useState('');
  const [reqPj2, setReqPj2] = useState('');
  const [frases, setFrases] = useState([]);
  const [decisiones, setDecisiones] = useState([]);

  // Cargar lista de conversaciones
  const cargarConversaciones = async (uId = universoFiltro) => {
    setCargando(true);
    setError('');
    try {
      const url = uId
        ? `/api/narrative/admin/conversaciones?universo_id=${encodeURIComponent(uId)}`
        : '/api/narrative/admin/conversaciones';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setConversaciones(data);
      } else {
        setError('No se pudo cargar la lista de conversaciones.');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión al cargar conversaciones.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(/* Sincroniza este efecto cuando cambian los datos de los que depende. */ () => {
    cargarConversaciones(universoFiltro);
  }, [universoFiltro]);

  // Mapa de personajes para nombres rápidos
  const mapaPersonajes = personajes.reduce(/* Acumula los valores en un solo resultado. */ (acc, p) => {
    acc[p._id || p.id] = p;
    return acc;
  }, {});

  // Abre el formulario vacío para crear un registro.
  const abrirModalNuevo = () => {
    setEsEdicion(false);
    const newId = 'conv_' + Date.now().toString(36);
    setId(newId);
    const u = universoFiltro || universos[0]?._id || universos[0]?.id || 'corte_medieval';
    setUniversoId(u);
    setTitulo('');
    setImagen('/assets/narrative/conversaciones/default.webp');

    // Seleccionar por defecto los primeros dos personajes del universo
    const p1 = personajes[0]?._id || personajes[0]?.id || '';
    const p2 = personajes[1]?._id || personajes[1]?.id || p1;
    setReqPj1(p1);
    setReqPj2(p2);

    // Plantilla inicial de diálogo
    setFrases([
      {
        personajeId: p1,
        texto: 'Majestad, debemos resolver esta disputa sin demora.',
      },
      {
        personajeId: p2,
        texto: 'Coincido, pero nuestras prioridades deben ser claras.',
      },
    ]);

    // Plantilla inicial de 2 decisiones con impacto cruzado
    setDecisiones([
      {
        opcion: 1,
        texto: `Respaldar la postura de ${mapaPersonajes[p1]?.nombre || 'Personaje 1'}`,
        resultado_texto: `${mapaPersonajes[p1]?.nombre || 'El primer miembro'} asiente con satisfacción.`,
        impacto_afinidad: [
          { personaje_id: p1, delta: 15 },
          { personaje_id: p2, delta: -10 },
        ],
      },
      {
        opcion: 2,
        texto: `Dar la razón a ${mapaPersonajes[p2]?.nombre || 'Personaje 2'}`,
        resultado_texto: `${mapaPersonajes[p2]?.nombre || 'El segundo miembro'} agradece tu criterio.`,
        impacto_afinidad: [
          { personaje_id: p1, delta: -10 },
          { personaje_id: p2, delta: 15 },
        ],
      },
    ]);

    setError('');
    setExito('');
    setModalAbierto(true);
  };

  // Carga el registro en el formulario de edición.
  const abrirModalEditar = (conv) => {
    setEsEdicion(true);
    setId(conv._id || conv.id);
    setUniversoId(conv.universo_id || '');
    setTitulo(conv.titulo || '');
    setImagen(conv.imagen || '/assets/narrative/conversaciones/default.webp');

    const reqs = conv.requisitos || [];
    setReqPj1(reqs[0]?.personajeId || '');
    setReqPj2(reqs[1]?.personajeId || '');

    setFrases((conv.frases || []).map(/* Prepara el resultado de cada elemento. */ (f) => ({ ...f })));

    setDecisiones(
      (conv.decisiones || []).map(/* Prepara el resultado de cada elemento. */ (d) => ({
        opcion: d.opcion ?? 1,
        texto: d.texto || '',
        resultado_texto: d.resultado_texto || '',
        impacto_afinidad: (d.impacto_afinidad || []).map(/* Prepara el resultado de cada elemento. */ (ia) => ({ ...ia })),
      }))
    );

    setError('');
    setExito('');
    setModalAbierto(true);
  };

  // Manejo de Frases de Diálogo
  const agregarFrase = () => {
    // Alternar quién habla según la última frase
    const ultimoPj = frases[frases.length - 1]?.personajeId;
    const proximoPj = ultimoPj === reqPj1 ? reqPj2 : reqPj1;

    setFrases([...frases, { personajeId: proximoPj || reqPj1, texto: '' }]);
  };

  // Quita frase con los datos de este paso.
  const eliminarFrase = (idx) => {
    setFrases(frases.filter(/* Conserva los elementos que cumplen esta condición. */ (_, i) => i !== idx));
  };

  // Actualiza frase con los datos de este paso.
  const actualizarFrase = (idx, campo, valor) => {
    setFrases(/* Actualiza frases a partir del valor anterior. */ (prev) =>
      prev.map(/* Prepara el resultado de cada elemento. */ (f, i) => (i === idx ? { ...f, [campo]: valor } : f))
    );
  };

  // Manejo de Decisiones
  const agregarDecision = () => {
    const num = decisiones.length + 1;
    setDecisiones([
      ...decisiones,
      {
        opcion: num,
        texto: '',
        resultado_texto: '',
        impacto_afinidad: [
          { personaje_id: reqPj1, delta: 10 },
          { personaje_id: reqPj2, delta: -10 },
        ],
      },
    ]);
  };

  // Quita decision con los datos de este paso.
  const eliminarDecision = (idx) => {
    setDecisiones(decisiones.filter(/* Conserva los elementos que cumplen esta condición. */ (_, i) => i !== idx));
  };

  // Actualiza decision con los datos de este paso.
  const actualizarDecision = (idx, campo, valor) => {
    setDecisiones(/* Actualiza decisiones a partir del valor anterior. */ (prev) =>
      prev.map(/* Prepara el resultado de cada elemento. */ (d, i) => (i === idx ? { ...d, [campo]: valor } : d))
    );
  };

  // Agrega impacto afinidad con los datos de este paso.
  const agregarImpactoAfinidad = (decIdx) => {
    setDecisiones(/* Actualiza decisiones a partir del valor anterior. */ (prev) =>
      prev.map(/* Prepara el resultado de cada elemento. */ (d, i) => {
        if (i !== decIdx) return d;
        return {
          ...d,
          impacto_afinidad: [
            ...d.impacto_afinidad,
            { personaje_id: reqPj1 || '', delta: 10 },
          ],
        };
      })
    );
  };

  // Quita impacto afinidad con los datos de este paso.
  const eliminarImpactoAfinidad = (decIdx, impIdx) => {
    setDecisiones(/* Actualiza decisiones a partir del valor anterior. */ (prev) =>
      prev.map(/* Prepara el resultado de cada elemento. */ (d, i) => {
        if (i !== decIdx) return d;
        return {
          ...d,
          impacto_afinidad: d.impacto_afinidad.filter(/* Conserva los elementos que cumplen esta condición. */ (_, ii) => ii !== impIdx),
        };
      })
    );
  };

  // Actualiza impacto afinidad con los datos de este paso.
  const actualizarImpactoAfinidad = (decIdx, impIdx, campo, valor) => {
    setDecisiones(/* Actualiza decisiones a partir del valor anterior. */ (prev) =>
      prev.map(/* Prepara el resultado de cada elemento. */ (d, i) => {
        if (i !== decIdx) return d;
        const nuevosImpactos = d.impacto_afinidad.map(/* Prepara el resultado de cada elemento. */ (imp, ii) =>
          ii === impIdx ? { ...imp, [campo]: valor } : imp
        );
        return { ...d, impacto_afinidad: nuevosImpactos };
      })
    );
  };

  // Guardar Conversación
  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!id.trim() || !titulo.trim()) {
      setError('Por favor complete el ID y el título de la conversación.');
      return;
    }

    if (!reqPj1 || !reqPj2) {
      setError('Debe seleccionar los 2 personajes de corte requeridos para la conversación.');
      return;
    }

    if (reqPj1 === reqPj2) {
      setError('Los dos personajes involucrados deben ser distintos.');
      return;
    }

    if (frases.length === 0) {
      setError('Debe incluir al menos una línea de diálogo.');
      return;
    }

    if (decisiones.length === 0) {
      setError('Debe incluir al menos una decisión de mediación para el rey.');
      return;
    }

    setGuardando(true);
    setError('');

    const payload = {
      _id: id.trim(),
      universo_id: universoId,
      titulo: titulo.trim(),
      imagen: imagen.trim() || '/assets/narrative/conversaciones/default.webp',
      requisitos: [{ personajeId: reqPj1 }, { personajeId: reqPj2 }],
      frases: frases.map(/* Prepara el resultado de cada elemento. */ (f) => ({
        personajeId: f.personajeId,
        texto: f.texto.trim(),
      })),
      decisiones: decisiones.map(/* Prepara el resultado de cada elemento. */ (d, idx) => ({
        opcion: idx + 1,
        texto: d.texto.trim(),
        condiciones: [],
        resultado_texto: d.resultado_texto.trim(),
        impacto_afinidad: d.impacto_afinidad.map(/* Prepara el resultado de cada elemento. */ (ia) => ({
          personaje_id: ia.personaje_id,
          delta: parseInt(ia.delta, 10) || 0,
        })),
      })),
    };

    try {
      const res = await fetch('/api/narrative/admin/conversaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setExito(`Conversación "${titulo}" guardada correctamente.`);
        setModalAbierto(false);
        cargarConversaciones(universoFiltro);
      } else {
        const errData = await res.json().catch(/* Maneja el fallo de esta operación. */ () => ({}));
        setError(errData.detail || 'Error al guardar la conversación.');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión con el servidor.');
    } finally {
      setGuardando(false);
    }
  };

  // Eliminar Conversación
  const handleEliminar = async (convId, convTitulo) => {
    if (!window.confirm(`¿Está seguro de eliminar la conversación "${convTitulo}" (${convId})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/narrative/admin/conversaciones/${encodeURIComponent(convId)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setExito(`Conversación "${convTitulo}" eliminada.`);
        cargarConversaciones(universoFiltro);
      } else {
        const errData = await res.json().catch(/* Maneja el fallo de esta operación. */ () => ({}));
        setError(errData.detail || 'Error al eliminar conversación.');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión al eliminar conversación.');
    }
  };

  // Filtrado en memoria
  const conversacionesFiltradas = conversaciones.filter(/* Conserva los elementos que cumplen esta condición. */ (c) => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    const enTitulo = (c.titulo || '').toLowerCase().includes(q);
    const enId = (c._id || c.id || '').toLowerCase().includes(q);
    const enRequisitos = (c.requisitos || []).some(/* Comprueba si algún elemento cumple esta condición. */ (r) =>
      (r.personajeId || '').toLowerCase().includes(q)
    );
    const enFrases = (c.frases || []).some(/* Comprueba si algún elemento cumple esta condición. */ (f) =>
      (f.texto || '').toLowerCase().includes(q)
    );
    return enTitulo || enId || enRequisitos || enFrases;
  });

  return (
    <div className="space-y-6">
      {/* Barra de Controles Superior */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <FilterIcon size={16} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Universo:</span>
          </div>

          <select
            value={universoFiltro}
            onChange={/* Responde a change desde este control. */ (e) => setUniversoFiltro(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#002B5E]/20"
          >
            <option value="">Todos los Universos</option>
            {universos.map(/* Prepara el resultado de cada elemento. */ (u) => (
              <option key={u._id || u.id} value={u._id || u.id}>
                {u.nombre}
              </option>
            ))}
          </select>

          <div className="relative min-w-[220px]">
            <SearchIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por título, ID o personajes..."
              value={busqueda}
              onChange={/* Responde a change desde este control. */ (e) => setBusqueda(e.target.value)}
              className="text-xs w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 font-medium text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#002B5E]/20"
            />
          </div>

          <button
            type="button"
            onClick={/* Responde a click desde este control. */ () => cargarConversaciones(universoFiltro)}
            title="Refrescar lista"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <RefreshIcon size={16} />
          </button>
        </div>

        <button
          type="button"
          onClick={abrirModalNuevo}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#002B5E] text-white font-bold text-xs shadow-xs hover:bg-[#001D40] transition cursor-pointer"
        >
          <PlusIcon size={16} />
          <span>Crear Diálogo de Corte</span>
        </button>
      </div>

      {/* Alertas */}
      {exito && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckIcon size={16} className="text-emerald-600" />
            <span>{exito}</span>
          </div>
          <button onClick={/* Responde a click desde este control. */ () => setExito('')} className="text-emerald-600 hover:text-emerald-800 cursor-pointer">
            <XIcon size={14} />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangleIcon size={16} className="text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={/* Responde a click desde este control. */ () => setError('')} className="text-rose-600 hover:text-rose-800 cursor-pointer">
            <XIcon size={14} />
          </button>
        </div>
      )}

      {/* Listado de Conversaciones */}
      {cargando ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center text-slate-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-[#002B5E] mb-3" />
          <p className="text-xs font-semibold">Cargando diálogos de corte...</p>
        </div>
      ) : conversacionesFiltradas.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center text-slate-400">
          <MessageSquareIcon size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No se encontraron conversaciones</p>
          <p className="text-xs text-slate-400 mt-1">
            {busqueda
              ? 'Prueba ajustando los términos de búsqueda.'
              : 'Agrega dilemas y diálogos entre los personajes de la corte.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {conversacionesFiltradas.map(/* Prepara el resultado de cada elemento. */ (conv) => {
            const reqs = conv.requisitos || [];
            const pj1 = mapaPersonajes[reqs[0]?.personajeId];
            const pj2 = mapaPersonajes[reqs[1]?.personajeId];
            const numFrases = (conv.frases || []).length;
            const numDecisiones = (conv.decisiones || []).length;

            return (
              <div
                key={conv._id || conv.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Cabecera con Imagen */}
                  <div className="relative h-32 bg-slate-900 overflow-hidden flex items-center justify-center">
                    <img
                      src={conv.imagen || '/assets/narrative/conversaciones/default.webp'}
                      alt={conv.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-80"
                      onError={/* Responde a error desde este control. */ (e) => {
                        e.target.onerror = null;
                        e.target.src = '/assets/narrative/conversaciones/default.webp';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-black/40 to-black/20" />

                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/20">
                        {conv.universo_id}
                      </span>
                      <span className="text-[10px] font-mono text-slate-300 bg-black/50 px-2 py-0.5 rounded">
                        {conv._id || conv.id}
                      </span>
                    </div>

                    <div className="absolute bottom-2 left-3 right-3">
                      <h3 className="text-sm font-black text-white truncate drop-shadow-sm">
                        {conv.titulo}
                      </h3>
                    </div>
                  </div>

                  {/* Cuerpo */}
                  <div className="p-5 space-y-4">
                    {/* Personajes Requeridos */}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                        Interlocutores Requeridos:
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                          <UsersIcon size={14} className="text-[#002B5E]" />
                          <span className="text-xs font-bold text-slate-800 truncate">
                            {pj1?.nombre || reqs[0]?.personajeId || 'P1'}
                          </span>
                        </div>

                        <span className="text-xs font-black text-slate-400">vs</span>

                        <div className="flex-1 p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                          <UsersIcon size={14} className="text-indigo-600" />
                          <span className="text-xs font-bold text-slate-800 truncate">
                            {pj2?.nombre || reqs[1]?.personajeId || 'P2'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Previa de Diálogo */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                        <span>Diálogo ({numFrases} líneas)</span>
                      </div>

                      <div className="space-y-1.5">
                        {(conv.frases || []).slice(0, 2).map(/* Prepara el resultado de cada elemento. */ (fr, fidx) => {
                          const hablante = mapaPersonajes[fr.personajeId]?.nombre || fr.personajeId;
                          return (
                            <div
                              key={fidx}
                              className="p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-xs"
                            >
                              <span className="font-black text-[10px] text-[#002B5E] block mb-0.5">
                                {hablante}:
                              </span>
                              <p className="text-[11px] text-slate-600 font-medium italic truncate">
                                "{fr.texto}"
                              </p>
                            </div>
                          );
                        })}
                        {numFrases > 2 && (
                          <p className="text-[10px] text-slate-400 text-center font-medium">
                            + {numFrases - 2} líneas más en la conversación...
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Decisiones Preview */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <HeartIcon size={13} className="text-rose-500" />
                        <span>{numDecisiones} Opciones de Mediación</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pie con Acciones */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Fase 3 de la Ronda Mensual
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={/* Responde a click desde este control. */ () => abrirModalEditar(conv)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition cursor-pointer"
                    >
                      <EditIcon size={13} />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={/* Responde a click desde este control. */ () => handleEliminar(conv._id || conv.id, conv.titulo)}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
                      title="Eliminar conversación"
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CREAR / EDITAR CONVERSACIÓN                                         */}
      {/* ========================================================================= */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Cabecera */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#002B5E] text-white flex items-center justify-center">
                  <MessageSquareIcon size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {esEdicion ? 'Editar Diálogo de Corte' : 'Nuevo Diálogo de Corte'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Interacciones y tensiones entre dos miembros de la corte activa del jugador
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={/* Responde a click desde este control. */ () => setModalAbierto(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              >
                <XIcon size={18} />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleGuardar} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Sección 1: Datos Básicos y Requisitos */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  1. Configuración de Escenario e Interlocutores
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Identificador (ID) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={esEdicion}
                      value={id}
                      onChange={/* Responde a change desde este control. */ (e) => setId(e.target.value)}
                      placeholder="conv_disputa_recursos"
                      className="text-xs w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-800 disabled:opacity-60 focus:ring-2 focus:ring-[#002B5E]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Universo Temático <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={universoId}
                      onChange={/* Responde a change desde este control. */ (e) => setUniversoId(e.target.value)}
                      className="text-xs w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:ring-2 focus:ring-[#002B5E]/20"
                    >
                      {universos.map(/* Prepara el resultado de cada elemento. */ (u) => (
                        <option key={u._id || u.id} value={u._id || u.id}>
                          {u.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Título de la Situación <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={titulo}
                      onChange={/* Responde a change desde este control. */ (e) => setTitulo(e.target.value)}
                      placeholder="Ej: Presupuesto de Campaña Militar"
                      className="text-xs w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:ring-2 focus:ring-[#002B5E]/20"
                    />
                  </div>
                </div>

                <ImageUploadField
                  label="Ilustración / Escenario del Diálogo"
                  categoria="conversaciones"
                  value={imagen}
                  onChange={setImagen}
                  helperText="Fondo o ilustración del encuentro entre los personajes. Si no subes una, se usará la de fallback."
                />

                {/* Selección de los 2 Personajes Requeridos */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <UsersIcon size={15} className="text-[#002B5E]" />
                    <span>Los dos personajes que deben estar en la Corte para que ocurra:</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Primer Interlocutor:
                      </label>
                      <select
                        value={reqPj1}
                        onChange={/* Responde a change desde este control. */ (e) => setReqPj1(e.target.value)}
                        className="text-xs w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                      >
                        <option value="">Seleccionar Personaje 1...</option>
                        {personajes.map(/* Prepara el resultado de cada elemento. */ (pj) => (
                          <option key={pj._id || pj.id} value={pj._id || pj.id}>
                            {pj.nombre} ({pj.titulo})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Segundo Interlocutor:
                      </label>
                      <select
                        value={reqPj2}
                        onChange={/* Responde a change desde este control. */ (e) => setReqPj2(e.target.value)}
                        className="text-xs w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                      >
                        <option value="">Seleccionar Personaje 2...</option>
                        {personajes.map(/* Prepara el resultado de cada elemento. */ (pj) => (
                          <option key={pj._id || pj.id} value={pj._id || pj.id}>
                            {pj.nombre} ({pj.titulo})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ruta o URL de Imagen de Escenario
                  </label>
                  <input
                    type="text"
                    value={imagen}
                    onChange={/* Responde a change desde este control. */ (e) => setImagen(e.target.value)}
                    placeholder="/assets/narrative/conversations/sala_reuniones.webp"
                    className="text-xs w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-800 focus:ring-2 focus:ring-[#002B5E]/20"
                  />
                </div>
              </div>

              {/* Sección 2: Frases del Diálogo */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                      2. Líneas de Diálogo Entre Ambos
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Guion de la conversación previa a la intervención del monarca
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={agregarFrase}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                  >
                    <PlusIcon size={14} />
                    <span>Agregar Línea</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {frases.map(/* Prepara el resultado de cada elemento. */ (fr, fidx) => (
                    <div
                      key={fidx}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-3"
                    >
                      <div className="sm:w-1/3 w-full">
                        <select
                          value={fr.personajeId}
                          onChange={/* Responde a change desde este control. */ (e) => actualizarFrase(fidx, 'personajeId', e.target.value)}
                          className="text-xs w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-800"
                        >
                          <option value={reqPj1}>
                            {mapaPersonajes[reqPj1]?.nombre || reqPj1 || 'Personaje 1'}
                          </option>
                          <option value={reqPj2}>
                            {mapaPersonajes[reqPj2]?.nombre || reqPj2 || 'Personaje 2'}
                          </option>
                        </select>
                      </div>

                      <div className="sm:flex-1 w-full">
                        <input
                          type="text"
                          value={fr.texto}
                          onChange={/* Responde a change desde este control. */ (e) => actualizarFrase(fidx, 'texto', e.target.value)}
                          placeholder="Texto que dice el personaje..."
                          className="text-xs w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-medium text-slate-800 focus:ring-2 focus:ring-[#002B5E]/20"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={/* Responde a click desde este control. */ () => eliminarFrase(fidx)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer self-end sm:self-center"
                        title="Eliminar línea"
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sección 3: Decisiones del Jugador */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                      3. Decisiones de Mediación e Impacto en Afinidad
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Opciones que el jugador puede elegir para inclinar la balanza
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={agregarDecision}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                  >
                    <PlusIcon size={14} />
                    <span>Agregar Decisión</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {decisiones.map(/* Prepara el resultado de cada elemento. */ (dec, decIdx) => (
                    <div
                      key={decIdx}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-black uppercase tracking-wider text-[#002B5E] bg-[#002B5E]/10 px-2.5 py-1 rounded-lg">
                          Opción {decIdx + 1}
                        </span>

                        <button
                          type="button"
                          onClick={/* Responde a click desde este control. */ () => eliminarDecision(decIdx)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Eliminar esta opción"
                        >
                          <TrashIcon size={14} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Texto de la opción de respuesta:
                          </label>
                          <input
                            type="text"
                            value={dec.texto}
                            onChange={/* Responde a change desde este control. */ (e) => actualizarDecision(decIdx, 'texto', e.target.value)}
                            placeholder="Ej: Respaldar la propuesta del Canciller..."
                            className="text-xs w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Respuesta / Narrativa de conclusión:
                          </label>
                          <input
                            type="text"
                            value={dec.resultado_texto}
                            onChange={/* Responde a change desde este control. */ (e) =>
                              actualizarDecision(decIdx, 'resultado_texto', e.target.value)
                            }
                            placeholder="Ej: Elena agradece la confianza mientras Marcus se retira..."
                            className="text-xs w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800"
                          />
                        </div>
                      </div>

                      {/* Impactos en Afinidad */}
                      <div className="pt-2 border-t border-slate-200/70 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                            <HeartIcon size={12} className="text-rose-500" />
                            <span>Impactos de Afinidad de esta opción</span>
                          </span>

                          <button
                            type="button"
                            onClick={/* Responde a click desde este control. */ () => agregarImpactoAfinidad(decIdx)}
                            className="text-[10px] font-bold text-[#002B5E] hover:underline cursor-pointer"
                          >
                            + Modificar Afinidad
                          </button>
                        </div>

                        <div className="space-y-2">
                          {dec.impacto_afinidad.map(/* Prepara el resultado de cada elemento. */ (imp, impIdx) => (
                            <div
                              key={impIdx}
                              className="p-2 rounded-xl bg-white border border-slate-200 flex items-center gap-3 text-xs"
                            >
                              <div className="flex-1">
                                <select
                                  value={imp.personaje_id}
                                  onChange={/* Responde a change desde este control. */ (e) =>
                                    actualizarImpactoAfinidad(
                                      decIdx,
                                      impIdx,
                                      'personaje_id',
                                      e.target.value
                                    )
                                  }
                                  className="text-xs w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-700"
                                >
                                  {personajes.map(/* Prepara el resultado de cada elemento. */ (pj) => (
                                    <option key={pj._id || pj.id} value={pj._id || pj.id}>
                                      {pj.nombre} ({pj.titulo})
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-bold text-slate-500">
                                  Delta:
                                </span>
                                <input
                                  type="number"
                                  value={imp.delta}
                                  onChange={/* Responde a change desde este control. */ (e) =>
                                    actualizarImpactoAfinidad(
                                      decIdx,
                                      impIdx,
                                      'delta',
                                      Number(e.target.value)
                                    )
                                  }
                                  className={`w-16 text-center font-black rounded-lg border px-2 py-1 ${
                                    imp.delta > 0
                                      ? 'text-emerald-700 bg-emerald-50 border-emerald-300'
                                      : imp.delta < 0
                                      ? 'text-rose-700 bg-rose-50 border-rose-300'
                                      : 'text-slate-700 bg-slate-50 border-slate-200'
                                  }`}
                                />
                              </div>

                              <button
                                type="button"
                                onClick={/* Responde a click desde este control. */ () => eliminarImpactoAfinidad(decIdx, impIdx)}
                                className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                              >
                                <XIcon size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={/* Responde a click desde este control. */ () => setModalAbierto(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#002B5E] hover:bg-[#001D40] transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <CheckIcon size={14} />
                  <span>{guardando ? 'Guardando...' : 'Guardar Conversación'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
