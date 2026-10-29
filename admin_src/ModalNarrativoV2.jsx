/* Permite editar y probar nodos y opciones de las historias. */
import { useState, useEffect } from 'react';
import {
  XIcon,
  PlusIcon,
  TrashIcon,
  EditIcon,
  CheckIcon,
  GitBranchIcon,
  ChevronRightIcon,
  SparklesIcon,
  BookOpenIcon,
  AlertTriangleIcon,
  SearchIcon,
  RefreshIcon
} from './Icons';

const RECURSOS_DISPONIBLES = [
  { id: 'oro', label: 'Oro / Tesoro' },
  { id: 'pueblo', label: 'Pueblo / Bienestar' },
  { id: 'ejercito', label: 'Ejército / Orden Militar' },
  { id: 'fe', label: 'Fe / Iglesia' }
];

// Permite editar y probar nodos y opciones de las historias.
export default function ModalNarrativoV2({ abierto, onClose, getAuthHeaders, showToast }) {
  if (!abierto) return null;

  const [tabPrincipal, setTabPrincipal] = useState('eventos'); // 'eventos' | 'conversaciones'
  const [listaEventos, setListaEventos] = useState([]);
  const [listaConversaciones, setListaConversaciones] = useState([]);
  const [personajes, setPersonajes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [exitoMsg, setExitoMsg] = useState('');

  // Modo edición / creación
  const [modoEdicion, setModoEdicion] = useState(false);
  const [tipoEdicion, setTipoEdicion] = useState('evento'); // 'evento' | 'conversacion'
  const [itemEnEdicion, setItemEnEdicion] = useState(null);
  const [nodoSeleccionadoId, setNodoSeleccionadoId] = useState('inicio');
  const [guardando, setGuardando] = useState(false);

  // Modo Simulador de recorrido en vivo
  const [modoSimulador, setModoSimulador] = useState(false);
  const [nodoSimulacionId, setNodoSimulacionId] = useState('inicio');
  const [historialSimulacion, setHistorialSimulacion] = useState([]);

  // Carga inicial de datos
  useEffect(/* Sincroniza este efecto cuando cambian los datos de los que depende. */ () => {
    cargarTodo();
  }, []);

  // Carga todo con los datos de este paso.
  const cargarTodo = async () => {
    setCargando(true);
    setErrorMsg('');
    try {
      const [resEvts, resConvs, resPjs] = await Promise.all([
        fetch('/api/narrative/admin/v2/eventos', { headers: getAuthHeaders() }),
        fetch('/api/narrative/admin/v2/conversaciones', { headers: getAuthHeaders() }),
        fetch('/api/narrative/admin/personajes', { headers: getAuthHeaders() })
      ]);

      if (resEvts.ok) {
        const dataEvts = await resEvts.json();
        setListaEventos(dataEvts || []);
      }
      if (resConvs.ok) {
        const dataConvs = await resConvs.json();
        setListaConversaciones(dataConvs || []);
      }
      if (resPjs.ok) {
        const dataPjs = await resPjs.json();
        setPersonajes(dataPjs || []);
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Error al conectar con la API de narrativa V2.');
    } finally {
      setCargando(false);
    }
  };

  // Crear nuevo elemento en blanco
  const handleNuevoItem = (tipo) => {
    setTipoEdicion(tipo);
    const nuevoId = tipo === 'evento' ? `evt_nuevo_${Date.now()}` : `conv_nueva_${Date.now()}`;
    const base = {
      _id: nuevoId,
      id: nuevoId,
      universo_id: 'corte_medieval',
      titulo: tipo === 'evento' ? 'Nuevo Evento de Reino' : 'Nueva Conversación de Corte',
      imagen: tipo === 'evento' ? '/assets/narrative/eventos/default.webp' : '/assets/narrative/conversation-hall.png',
      nodo_raiz: 'inicio',
      nodos: {
        inicio: {
          id: 'inicio',
          hablante_id: tipo === 'evento' ? 'narrador' : (personajes[0]?._id || personajes[0]?.id || 'pj_canciller_elena'),
          texto: 'Texto del primer paso o planteamiento del dilema...',
          es_final: false,
          opciones: [
            { id: 'opt_1', texto: 'Opción A', siguiente_nodo: 'fin_a' },
            { id: 'opt_2', texto: 'Opción B', siguiente_nodo: 'fin_b' }
          ],
          resultado_texto: '',
          impactos_recursos: [],
          impactos_afinidad: []
        },
        fin_a: {
          id: 'fin_a',
          hablante_id: 'narrador',
          texto: 'Resolución de la opción A.',
          es_final: true,
          opciones: [],
          resultado_texto: 'Has elegido el camino A.',
          impactos_recursos: [{ recurso: 'oro', delta: 10 }],
          impactos_afinidad: []
        },
        fin_b: {
          id: 'fin_b',
          hablante_id: 'narrador',
          texto: 'Resolución de la opción B.',
          es_final: true,
          opciones: [],
          resultado_texto: 'Has elegido el camino B.',
          impactos_recursos: [{ recurso: 'oro', delta: -10 }],
          impactos_afinidad: []
        }
      }
    };

    if (tipo === 'evento') {
      base.requisitos_eventos_previos = [];
    } else {
      base.requisitos = personajes.slice(0, 2).map(/* Prepara el resultado de cada elemento. */ (p) => p._id || p.id);
    }

    setItemEnEdicion(base);
    setNodoSeleccionadoId('inicio');
    setModoEdicion(true);
    setModoSimulador(false);
  };

  // Abrir elemento existente para editar
  const handleEditarItem = (item, tipo) => {
    setTipoEdicion(tipo);
    // Clon profundo para no mutar lista original directamente
    const itemClonado = JSON.parse(JSON.stringify(item));
    if (!itemClonado.id && itemClonado._id) itemClonado.id = itemClonado._id;
    if (!itemClonado._id && itemClonado.id) itemClonado._id = itemClonado.id;
    setItemEnEdicion(itemClonado);
    setNodoSeleccionadoId(itemClonado.nodo_raiz || Object.keys(itemClonado.nodos || {})[0] || 'inicio');
    setModoEdicion(true);
    setModoSimulador(false);
  };

  // Eliminar elemento
  const handleEliminarItem = async (id, tipo) => {
    if (!window.confirm(`¿Estás seguro de eliminar ${id}? Esta acción no se puede deshacer.`)) return;

    try {
      const url = tipo === 'evento'
        ? `/api/narrative/admin/v2/eventos/${id}`
        : `/api/narrative/admin/v2/conversaciones/${id}`;

      const res = await fetch(url, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (res.ok) {
        showToast('Elemento eliminado correctamente.');
        cargarTodo();
      } else {
        const data = await res.json().catch(/* Maneja el fallo de esta operación. */ () => ({}));
        setErrorMsg(data.detail || 'Error al eliminar elemento.');
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Error al conectar con el servidor.');
    }
  };

  // Guardar elemento en MongoDB
  const handleGuardarItem = async () => {
    if (!itemEnEdicion) return;

    // Validaciones de integridad
    const id = itemEnEdicion._id || itemEnEdicion.id;
    if (!id || !id.trim()) {
      alert('El ID es obligatorio.');
      return;
    }
    if (!itemEnEdicion.titulo || !itemEnEdicion.titulo.trim()) {
      alert('El título es obligatorio.');
      return;
    }
    if (!itemEnEdicion.nodos || Object.keys(itemEnEdicion.nodos).length === 0) {
      alert('El grafo debe tener al menos un nodo.');
      return;
    }
    if (!itemEnEdicion.nodos[itemEnEdicion.nodo_raiz]) {
      alert(`El nodo raíz "${itemEnEdicion.nodo_raiz}" no existe dentro de los nodos del grafo.`);
      return;
    }

    // Comprobar que los siguiente_nodo de las opciones existan
    const nodosKeys = Object.keys(itemEnEdicion.nodos);
    for (const [nid, nodo] of Object.entries(itemEnEdicion.nodos)) {
      if (!nodo.es_final && Array.isArray(nodo.opciones)) {
        for (const opt of nodo.opciones) {
          if (!nodosKeys.includes(opt.siguiente_nodo)) {
            alert(`En el nodo "${nid}", la opción "${opt.texto}" apunta a "${opt.siguiente_nodo}", que no existe en el grafo.`);
            return;
          }
        }
      }
    }

    setGuardando(true);
    setErrorMsg('');
    try {
      const url = tipoEdicion === 'evento'
        ? '/api/narrative/admin/v2/eventos'
        : '/api/narrative/admin/v2/conversaciones';

      // Asegurar ambos campos de id
      const payload = {
        ...itemEnEdicion,
        _id: id,
        id: id
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(`¡${tipoEdicion === 'evento' ? 'Evento' : 'Conversación'} guardado con éxito!`);
        setModoEdicion(false);
        setItemEnEdicion(null);
        await cargarTodo();
      } else {
        const data = await res.json().catch(/* Maneja el fallo de esta operación. */ () => ({}));
        setErrorMsg(data.detail || data.message || 'Error al guardar el grafo.');
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Error de conexión al guardar.');
    } finally {
      setGuardando(false);
    }
  };

  // Manejadores del Editor de Nodos
  const nodoActual = itemEnEdicion?.nodos?.[nodoSeleccionadoId];

  // Actualiza nodo actual con los datos de este paso.
  const handleUpdateNodoActual = (campo, valor) => {
    if (!itemEnEdicion || !nodoActual) return;
    setItemEnEdicion(/* Actualiza item en edicion a partir del valor anterior. */ (prev) => ({
      ...prev,
      nodos: {
        ...prev.nodos,
        [nodoSeleccionadoId]: {
          ...prev.nodos[nodoSeleccionadoId],
          [campo]: valor
        }
      }
    }));
  };

  // Agrega nodo con los datos de este paso.
  const handleAgregarNodo = () => {
    if (!itemEnEdicion) return;
    const count = Object.keys(itemEnEdicion.nodos).length + 1;
    const nuevoNodoId = `nodo_${count}`;
    const nuevoNodo = {
      id: nuevoNodoId,
      hablante_id: 'narrador',
      texto: 'Descripción del paso...',
      es_final: false,
      opciones: [
        { id: `opt_${count}_1`, texto: 'Continuar', siguiente_nodo: itemEnEdicion.nodo_raiz }
      ],
      resultado_texto: '',
      impactos_recursos: [],
      impactos_afinidad: []
    };

    setItemEnEdicion(/* Actualiza item en edicion a partir del valor anterior. */ (prev) => ({
      ...prev,
      nodos: {
        ...prev.nodos,
        [nuevoNodoId]: nuevoNodo
      }
    }));
    setNodoSeleccionadoId(nuevoNodoId);
  };

  // Quita nodo con los datos de este paso.
  const handleEliminarNodo = (nid) => {
    if (Object.keys(itemEnEdicion.nodos).length <= 1) {
      alert('No puedes eliminar el único nodo del grafo.');
      return;
    }
    if (nid === itemEnEdicion.nodo_raiz) {
      alert('No puedes eliminar el nodo raíz actual. Asigna otro como raíz primero.');
      return;
    }
    if (!window.confirm(`¿Eliminar nodo "${nid}"?`)) return;

    setItemEnEdicion(/* Actualiza item en edicion a partir del valor anterior. */ (prev) => {
      const copia = { ...prev.nodos };
      delete copia[nid];
      return {
        ...prev,
        nodos: copia
      };
    });
    setNodoSeleccionadoId(itemEnEdicion.nodo_raiz);
  };

  // Manejo de Opciones dentro del nodo activo
  const handleAgregarOpcion = () => {
    if (!nodoActual) return;
    const num = (nodoActual.opciones?.length || 0) + 1;
    const nuevaOpt = {
      id: `opt_${num}`,
      texto: `Nueva Opción ${num}`,
      siguiente_nodo: itemEnEdicion.nodo_raiz
    };
    handleUpdateNodoActual('opciones', [...(nodoActual.opciones || []), nuevaOpt]);
  };

  // Actualiza opcion con los datos de este paso.
  const handleUpdateOpcion = (idx, campo, valor) => {
    if (!nodoActual || !nodoActual.opciones) return;
    const nuevas = [...nodoActual.opciones];
    nuevas[idx] = { ...nuevas[idx], [campo]: valor };
    handleUpdateNodoActual('opciones', nuevas);
  };

  // Quita opcion con los datos de este paso.
  const handleEliminarOpcion = (idx) => {
    if (!nodoActual || !nodoActual.opciones) return;
    const nuevas = nodoActual.opciones.filter(/* Conserva los elementos que cumplen esta condición. */ (_, i) => i !== idx);
    handleUpdateNodoActual('opciones', nuevas);
  };

  // Manejo de Impactos Recursos
  const handleAgregarImpactoRecurso = () => {
    if (!nodoActual) return;
    const nuevo = { recurso: 'oro', delta: 5 };
    handleUpdateNodoActual('impactos_recursos', [...(nodoActual.impactos_recursos || []), nuevo]);
  };

  // Actualiza impacto recurso con los datos de este paso.
  const handleUpdateImpactoRecurso = (idx, campo, valor) => {
    if (!nodoActual) return;
    const nuevos = [...(nodoActual.impactos_recursos || [])];
    nuevos[idx] = { ...nuevos[idx], [campo]: campo === 'delta' ? parseInt(valor, 10) || 0 : valor };
    handleUpdateNodoActual('impactos_recursos', nuevos);
  };

  // Quita impacto recurso con los datos de este paso.
  const handleEliminarImpactoRecurso = (idx) => {
    if (!nodoActual) return;
    const nuevos = (nodoActual.impactos_recursos || []).filter(/* Conserva los elementos que cumplen esta condición. */ (_, i) => i !== idx);
    handleUpdateNodoActual('impactos_recursos', nuevos);
  };

  // Manejo de Impactos Afinidad
  const handleAgregarImpactoAfinidad = () => {
    if (!nodoActual) return;
    const nuevo = { personaje_id: personajes[0]?._id || personajes[0]?.id || 'pj_canciller_elena', delta: 10 };
    handleUpdateNodoActual('impactos_afinidad', [...(nodoActual.impactos_afinidad || []), nuevo]);
  };

  // Actualiza impacto afinidad con los datos de este paso.
  const handleUpdateImpactoAfinidad = (idx, campo, valor) => {
    if (!nodoActual) return;
    const nuevos = [...(nodoActual.impactos_afinidad || [])];
    nuevos[idx] = { ...nuevos[idx], [campo]: campo === 'delta' ? parseInt(valor, 10) || 0 : valor };
    handleUpdateNodoActual('impactos_afinidad', nuevos);
  };

  // Quita impacto afinidad con los datos de este paso.
  const handleEliminarImpactoAfinidad = (idx) => {
    if (!nodoActual) return;
    const nuevos = (nodoActual.impactos_afinidad || []).filter(/* Conserva los elementos que cumplen esta condición. */ (_, i) => i !== idx);
    handleUpdateNodoActual('impactos_afinidad', nuevos);
  };

  // Simulador de flujo
  const iniciarSimulacion = () => {
    if (!itemEnEdicion) return;
    setNodoSimulacionId(itemEnEdicion.nodo_raiz);
    setHistorialSimulacion([]);
    setModoSimulador(true);
  };

  // Aplica la opción elegida y sigue el recorrido de prueba.
  const elegirOpcionSimulada = (opt) => {
    const nodoDestino = itemEnEdicion?.nodos?.[opt.siguiente_nodo];
    setHistorialSimulacion(/* Actualiza historial simulacion a partir del valor anterior. */ (prev) => [
      ...prev,
      {
        nodoId: nodoSimulacionId,
        textoNodo: itemEnEdicion.nodos[nodoSimulacionId]?.texto,
        opcionElegida: opt.texto
      }
    ]);
    if (nodoDestino) {
      setNodoSimulacionId(opt.siguiente_nodo);
    }
  };

  // Filtros de búsqueda para listas
  const eventosFiltrados = listaEventos.filter(/* Conserva los elementos que cumplen esta condición. */ (e) =>
    (e.titulo || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (e._id || e.id || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  const conversacionesFiltradas = listaConversaciones.filter(/* Conserva los elementos que cumplen esta condición. */ (c) =>
    (c.titulo || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (c._id || c.id || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-7xl h-[92vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">

        {/* CABECERA MODAL */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <GitBranchIcon size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Motor Narrativo V2 • Grafos de Decisión
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  King's Court V2
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gestión y autoría de eventos ramificados, conversaciones de corte y arcos argumentales.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!modoEdicion ? (
              <button
                onClick={cargarTodo}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Refrescar datos"
              >
                <RefreshIcon size={16} />
              </button>
            ) : null}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <XIcon size={18} />
            </button>
          </div>
        </div>

        {/* MENSAJES DE ERROR O ÉXITO */}
        {errorMsg && (
          <div className="mx-6 mt-3 px-4 py-2.5 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangleIcon size={16} className="text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* CUERPO PRINCIPAL */}
        {!modoEdicion ? (
          /* ============================================================== */
          /* VISTA LISTADO DE GRAFOS V2 (EVENTOS Y CONVERSACIONES)           */
          /* ============================================================== */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Barra de pestañas y acciones */}
            <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3 border-b border-slate-800 bg-slate-900/60">
              <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={/* Responde a click desde este control. */ () => setTabPrincipal('eventos')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    tabPrincipal === 'eventos'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <BookOpenIcon size={14} />
                  <span>Eventos de Reino ({listaEventos.length})</span>
                </button>
                <button
                  onClick={/* Responde a click desde este control. */ () => setTabPrincipal('conversaciones')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    tabPrincipal === 'conversaciones'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <SparklesIcon size={14} />
                  <span>Conversaciones de Corte ({listaConversaciones.length})</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <SearchIcon size={14} className="absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Buscar por ID o título..."
                    value={busqueda}
                    onChange={/* Responde a change desde este control. */ (e) => setBusqueda(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 w-64"
                  />
                </div>
                <button
                  onClick={/* Responde a click desde este control. */ () => handleNuevoItem(tabPrincipal === 'eventos' ? 'evento' : 'conversacion')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition shadow-sm cursor-pointer"
                >
                  <PlusIcon size={15} />
                  <span>{tabPrincipal === 'eventos' ? 'Nuevo Evento V2' : 'Nueva Conversación V2'}</span>
                </button>
              </div>
            </div>

            {/* Lista con scroll */}
            <div className="flex-1 overflow-y-auto p-6">
              {cargando ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                  Cargando catálogo V2...
                </div>
              ) : tabPrincipal === 'eventos' ? (
                eventosFiltrados.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
                    <p>No se encontraron eventos de reino V2.</p>
                    <button
                      onClick={/* Responde a click desde este control. */ () => handleNuevoItem('evento')}
                      className="text-xs text-amber-400 hover:underline font-bold"
                    >
                      + Crear primer evento de grafo
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {eventosFiltrados.map(/* Prepara el resultado de cada elemento. */ (evt) => {
                      const id = evt._id || evt.id;
                      const numNodos = Object.keys(evt.nodos || {}).length;
                      const reqs = evt.requisitos_eventos_previos || [];
                      return (
                        <div
                          key={id}
                          className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between transition group"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 text-amber-300 rounded border border-slate-700">
                                {id}
                              </span>
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <GitBranchIcon size={12} className="text-amber-400" />
                                {numNodos} nodos
                              </span>
                            </div>
                            <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition">
                              {evt.titulo}
                            </h3>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                              {evt.nodos?.[evt.nodo_raiz]?.texto || 'Sin texto inicial'}
                            </p>

                            {reqs.length > 0 && (
                              <div className="mt-3 pt-2 border-t border-slate-800/80">
                                <span className="text-[10px] text-slate-500 block mb-1">
                                  Requiere haber completado:
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {reqs.map(/* Prepara el resultado de cada elemento. */ (r) => (
                                    <span
                                      key={r}
                                      className="text-[9px] px-1.5 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800/60 rounded"
                                    >
                                      {r}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2">
                            <button
                              onClick={/* Responde a click desde este control. */ () => handleEditarItem(evt, 'evento')}
                              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition flex items-center gap-1 cursor-pointer"
                            >
                              <EditIcon size={13} />
                              <span>Editar Nodos</span>
                            </button>
                            <button
                              onClick={/* Responde a click desde este control. */ () => handleEliminarItem(id, 'evento')}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 transition cursor-pointer"
                              title="Eliminar"
                            >
                              <TrashIcon size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                conversacionesFiltradas.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
                    <p>No se encontraron conversaciones de corte V2.</p>
                    <button
                      onClick={/* Responde a click desde este control. */ () => handleNuevoItem('conversacion')}
                      className="text-xs text-amber-400 hover:underline font-bold"
                    >
                      + Crear primera conversación de corte
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {conversacionesFiltradas.map(/* Prepara el resultado de cada elemento. */ (conv) => {
                      const id = conv._id || conv.id;
                      const numNodos = Object.keys(conv.nodos || {}).length;
                      const reqsPjs = conv.requisitos || [];
                      return (
                        <div
                          key={id}
                          className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between transition group"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 text-cyan-300 rounded border border-slate-700">
                                {id}
                              </span>
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <GitBranchIcon size={12} className="text-cyan-400" />
                                {numNodos} nodos
                              </span>
                            </div>
                            <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition">
                              {conv.titulo}
                            </h3>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                              {conv.nodos?.[conv.nodo_raiz]?.texto || 'Sin texto inicial'}
                            </p>

                            {reqsPjs.length > 0 && (
                              <div className="mt-3 pt-2 border-t border-slate-800/80">
                                <span className="text-[10px] text-slate-500 block mb-1">
                                  Consejeros requeridos en corte:
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {reqsPjs.map(/* Prepara el resultado de cada elemento. */ (pjId) => {
                                    const pjInfo = personajes.find(/* Busca el primer elemento que cumple esta condición. */ (p) => (p._id || p.id) === pjId);
                                    return (
                                      <span
                                        key={pjId}
                                        className="text-[9px] px-1.5 py-0.5 bg-purple-950 text-purple-300 border border-purple-800/60 rounded"
                                      >
                                        {pjInfo?.nombre || pjId}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2">
                            <button
                              onClick={/* Responde a click desde este control. */ () => handleEditarItem(conv, 'conversacion')}
                              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition flex items-center gap-1 cursor-pointer"
                            >
                              <EditIcon size={13} />
                              <span>Editar Nodos</span>
                            </button>
                            <button
                              onClick={/* Responde a click desde este control. */ () => handleEliminarItem(id, 'conversacion')}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 transition cursor-pointer"
                              title="Eliminar"
                            >
                              <TrashIcon size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* VISTA EDITOR DE GRAFOS Y NODOS (EL CORAZÓN DEL AUTOR)         */
          /* ============================================================== */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Barra de Control del Grafo */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-3">
                <button
                  onClick={/* Responde a click desde este control. */ () => setModoEdicion(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                >
                  ← Volver al listado
                </button>
                <div className="h-4 w-px bg-slate-700" />
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Editando {tipoEdicion === 'evento' ? 'Evento' : 'Conversación'}:
                </span>
                <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                  {itemEnEdicion?._id || itemEnEdicion?.id}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={iniciarSimulacion}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 font-bold text-xs transition flex items-center gap-1.5"
                >
                  <SparklesIcon size={14} />
                  <span>Probar Recorrido (Simulador)</span>
                </button>

                <button
                  onClick={handleGuardarItem}
                  disabled={guardando}
                  className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckIcon size={15} />
                  <span>{guardando ? 'Guardando...' : 'Guardar Grafo'}</span>
                </button>
              </div>
            </div>

            {/* Split View: Metadatos & Lista de Nodos (Izquierda) + Editor del Nodo Activo (Derecha) */}
            <div className="flex-1 flex overflow-hidden">

              {/* PANEL LATERAL: Metadatos y Árbol de Nodos */}
              <div className="w-80 border-r border-slate-800 bg-slate-950/60 flex flex-col overflow-hidden">
                {/* Metadatos Generales */}
                <div className="p-4 border-b border-slate-800 space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      ID Único (MongoDB)
                    </label>
                    <input
                      type="text"
                      value={itemEnEdicion?._id || itemEnEdicion?.id || ''}
                      onChange={/* Responde a change desde este control. */ (e) => {
                        const val = e.target.value.trim();
                        setItemEnEdicion(/* Actualiza item en edicion a partir del valor anterior. */ (prev) => ({ ...prev, _id: val, id: val }));
                      }}
                      className="w-full text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Título
                    </label>
                    <input
                      type="text"
                      value={itemEnEdicion?.titulo || ''}
                      onChange={/* Responde a change desde este control. */ (e) => setItemEnEdicion(/* Actualiza item en edicion a partir del valor anterior. */ (prev) => ({ ...prev, titulo: e.target.value }))}
                      className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Nodo Raíz Inicial
                    </label>
                    <select
                      value={itemEnEdicion?.nodo_raiz || ''}
                      onChange={/* Responde a change desde este control. */ (e) => setItemEnEdicion(/* Actualiza item en edicion a partir del valor anterior. */ (prev) => ({ ...prev, nodo_raiz: e.target.value }))}
                      className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                    >
                      {Object.keys(itemEnEdicion?.nodos || {}).map(/* Prepara el resultado de cada elemento. */ (nid) => (
                        <option key={nid} value={nid}>{nid}</option>
                      ))}
                    </select>
                  </div>

                  {/* Campo específico según tipo */}
                  {tipoEdicion === 'evento' ? (
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Requisitos de Eventos Previos (Arcos)
                      </label>
                      <input
                        type="text"
                        placeholder="evt_1, evt_2 (separados por coma)"
                        value={(itemEnEdicion?.requisitos_eventos_previos || []).join(', ')}
                        onChange={/* Responde a change desde este control. */ (e) => {
                          const arr = e.target.value.split(',').map(/* Prepara el resultado de cada elemento. */ (s) => s.trim()).filter(Boolean);
                          setItemEnEdicion(/* Actualiza item en edicion a partir del valor anterior. */ (prev) => ({ ...prev, requisitos_eventos_previos: arr }));
                        }}
                        className="w-full text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        IDs de eventos que deben completarse antes de habilitar este.
                      </span>
                    </div>
                  ) : (
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Consejeros Requeridos en Corte
                      </label>
                      <div className="space-y-1 max-h-24 overflow-y-auto bg-slate-900 p-2 rounded-lg border border-slate-800">
                        {personajes.map(/* Prepara el resultado de cada elemento. */ (p) => {
                          const pid = p._id || p.id;
                          const marcado = (itemEnEdicion?.requisitos || []).includes(pid);
                          return (
                            <label key={pid} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={marcado}
                                onChange={/* Responde a change desde este control. */ (e) => {
                                  const actuales = itemEnEdicion?.requisitos || [];
                                  const nuevos = e.target.checked
                                    ? [...actuales, pid]
                                    : actuales.filter(/* Conserva los elementos que cumplen esta condición. */ (x) => x !== pid);
                                  setItemEnEdicion(/* Actualiza item en edicion a partir del valor anterior. */ (prev) => ({ ...prev, requisitos: nuevos }));
                                }}
                                className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-0"
                              />
                              <span>{p.nombre}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Lista de Nodos del Grafo */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Nodos del Árbol ({Object.keys(itemEnEdicion?.nodos || {}).length})
                    </span>
                    <button
                      onClick={handleAgregarNodo}
                      className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <PlusIcon size={13} />
                      <span>Nuevo Nodo</span>
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                    {Object.entries(itemEnEdicion?.nodos || {}).map(/* Prepara el resultado de cada elemento. */ ([nid, n]) => {
                      const esRaiz = nid === itemEnEdicion.nodo_raiz;
                      const seleccionado = nid === nodoSeleccionadoId;
                      return (
                        <div
                          key={nid}
                          onClick={/* Responde a click desde este control. */ () => setNodoSeleccionadoId(nid)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                            seleccionado
                              ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-xs'
                              : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div className="flex flex-col gap-0.5 overflow-hidden pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-amber-300 truncate">{nid}</span>
                              {esRaiz && (
                                <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-amber-500/30 text-amber-300 border border-amber-500/40">
                                  RAÍZ
                                </span>
                              )}
                              {n.es_final && (
                                <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-emerald-500/30 text-emerald-300 border border-emerald-500/40">
                                  FINAL
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 truncate">
                              {n.texto || 'Sin texto'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {n.es_final ? (
                              <span className="text-[10px] text-emerald-400 font-bold">🏁</span>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-mono">
                                {n.opciones?.length || 0} opt
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* PANEL CENTRAL: Editor del Nodo Activo */}
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/40">
                {nodoActual ? (
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Cabecera del Nodo */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Nodo Activo
                          </span>
                          <span className="text-lg font-mono font-bold text-amber-400">
                            {nodoActual.id}
                          </span>
                        </div>

                        {nodoActual.id === itemEnEdicion.nodo_raiz && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                            Punto de Entrada del Grafo
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {nodoActual.id !== itemEnEdicion.nodo_raiz && (
                          <button
                            onClick={/* Responde a click desde este control. */ () => setItemEnEdicion(/* Actualiza item en edicion a partir del valor anterior. */ (prev) => ({ ...prev, nodo_raiz: nodoActual.id }))}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                          >
                            Hacer Nodo Raíz
                          </button>
                        )}
                        <button
                          onClick={/* Responde a click desde este control. */ () => handleEliminarNodo(nodoActual.id)}
                          className="px-2.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-800/60 text-red-300 text-xs font-semibold transition flex items-center gap-1"
                        >
                          <TrashIcon size={12} />
                          <span>Eliminar Nodo</span>
                        </button>
                      </div>
                    </div>

                    {/* Hablante & Naturaleza del Nodo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Hablante / Orador
                        </label>
                        <select
                          value={nodoActual.hablante_id || 'narrador'}
                          onChange={/* Responde a change desde este control. */ (e) => handleUpdateNodoActual('hablante_id', e.target.value)}
                          className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                        >
                          <option value="narrador">Narrador del Reino (Sin personaje directo)</option>
                          {personajes.map(/* Prepara el resultado de cada elemento. */ (p) => (
                            <option key={p._id || p.id} value={p._id || p.id}>
                              {p.nombre} ({p.rol || p.titulo || (p._id || p.id)})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Tipo de Paso
                        </label>
                        <div className="flex items-center gap-2 pt-1">
                          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                            <input
                              type="radio"
                              name="tipo_nodo"
                              checked={!nodoActual.es_final}
                              onChange={/* Responde a change desde este control. */ () => handleUpdateNodoActual('es_final', false)}
                              className="text-amber-500 bg-slate-950 border-slate-700"
                            />
                            <span>Dilema con Opciones (Continúa)</span>
                          </label>
                          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer ml-4">
                            <input
                              type="radio"
                              name="tipo_nodo"
                              checked={!!nodoActual.es_final}
                              onChange={/* Responde a change desde este control. */ () => handleUpdateNodoActual('es_final', true)}
                              className="text-emerald-500 bg-slate-950 border-slate-700"
                            />
                            <span className="text-emerald-400 font-bold">Desenlace Final (Concluye Grafo)</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Texto Narrativo del Paso */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Texto de Diálogo o Narración
                      </label>
                      <textarea
                        rows={3}
                        value={nodoActual.texto || ''}
                        onChange={/* Responde a change desde este control. */ (e) => handleUpdateNodoActual('texto', e.target.value)}
                        placeholder="El orador expone la situación..."
                        className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* SECCIÓN SEGÚN SI ES FINAL O NODO DE RAMIFICACIÓN */}
                    {!nodoActual.es_final ? (
                      /* OPCIONES DE DECISIÓN */
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                              Opciones de Decisión para el Jugador
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              Cada botón conducirá al jugador a un nodo subsiguiente dentro de este grafo.
                            </p>
                          </div>
                          <button
                            onClick={handleAgregarOpcion}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-400 transition flex items-center gap-1 cursor-pointer"
                          >
                            <PlusIcon size={14} />
                            <span>Agregar Opción</span>
                          </button>
                        </div>

                        <div className="space-y-2">
                          {(nodoActual.opciones || []).map(/* Prepara el resultado de cada elemento. */ (opt, idx) => (
                            <div
                              key={opt.id || idx}
                              className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-3"
                            >
                              <div className="w-24">
                                <label className="text-[9px] text-slate-500 font-mono block">ID Opción</label>
                                <input
                                  type="text"
                                  value={opt.id || ''}
                                  onChange={/* Responde a change desde este control. */ (e) => handleUpdateOpcion(idx, 'id', e.target.value)}
                                  className="w-full text-xs font-mono bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200"
                                />
                              </div>

                              <div className="flex-1">
                                <label className="text-[9px] text-slate-500 block">Texto del Botón (Jugador)</label>
                                <input
                                  type="text"
                                  value={opt.texto || ''}
                                  onChange={/* Responde a change desde este control. */ (e) => handleUpdateOpcion(idx, 'texto', e.target.value)}
                                  placeholder="Ej: Aceptar la propuesta..."
                                  className="w-full text-xs bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200"
                                />
                              </div>

                              <div className="w-56">
                                <label className="text-[9px] text-amber-400 font-bold block flex items-center gap-1">
                                  <ChevronRightIcon size={10} />
                                  <span>Salta al Nodo Destino</span>
                                </label>
                                <select
                                  value={opt.siguiente_nodo || ''}
                                  onChange={/* Responde a change desde este control. */ (e) => handleUpdateOpcion(idx, 'siguiente_nodo', e.target.value)}
                                  className="w-full text-xs bg-slate-900 border border-slate-800 rounded px-2 py-1 text-amber-300 font-mono"
                                >
                                  {Object.keys(itemEnEdicion?.nodos || {}).map(/* Prepara el resultado de cada elemento. */ (targetId) => (
                                    <option key={targetId} value={targetId}>
                                      {targetId} {itemEnEdicion.nodos[targetId]?.es_final ? '(🏁 Final)' : ''}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <button
                                onClick={/* Responde a click desde este control. */ () => handleEliminarOpcion(idx)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition mt-3"
                                title="Eliminar opción"
                              >
                                <TrashIcon size={14} />
                              </button>
                            </div>
                          ))}

                          {(nodoActual.opciones || []).length === 0 && (
                            <div className="p-4 bg-amber-950/20 border border-amber-900/40 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                              <AlertTriangleIcon size={16} />
                              <span>Este nodo no tiene opciones configuradas. Agrega al menos una opción o márcalo como Desenlace Final.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* DESENLACE FINAL Y RECOMPENSAS / CONSECUENCIAS */
                      <div className="space-y-4 pt-2 border-t border-slate-800">
                        <div>
                          <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                            Texto de Conclusión / Resolución (resultado_texto)
                          </label>
                          <textarea
                            rows={2}
                            value={nodoActual.resultado_texto || ''}
                            onChange={/* Responde a change desde este control. */ (e) => handleUpdateNodoActual('resultado_texto', e.target.value)}
                            placeholder="Consecuencia final que se le muestra al jugador..."
                            className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        {/* IMPACTOS EN RECURSOS */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Impactos en Recursos del Reino (oro, pueblo, ejercito, fe)
                            </span>
                            <button
                              onClick={handleAgregarImpactoRecurso}
                              className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <PlusIcon size={13} />
                              <span>Agregar Impacto Recurso</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {(nodoActual.impactos_recursos || []).map(/* Prepara el resultado de cada elemento. */ (imp, idx) => (
                              <div
                                key={idx}
                                className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2"
                              >
                                <select
                                  value={imp.recurso}
                                  onChange={/* Responde a change desde este control. */ (e) => handleUpdateImpactoRecurso(idx, 'recurso', e.target.value)}
                                  className="flex-1 text-xs bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200"
                                >
                                  {RECURSOS_DISPONIBLES.map(/* Prepara el resultado de cada elemento. */ (r) => (
                                    <option key={r.id} value={r.id}>{r.label}</option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  value={imp.delta}
                                  onChange={/* Responde a change desde este control. */ (e) => handleUpdateImpactoRecurso(idx, 'delta', e.target.value)}
                                  placeholder="+/- delta"
                                  className="w-20 text-xs font-mono bg-slate-900 border border-slate-800 rounded px-2 py-1 text-amber-300 text-center"
                                />
                                <button
                                  onClick={/* Responde a click desde este control. */ () => handleEliminarImpactoRecurso(idx)}
                                  className="p-1 text-slate-500 hover:text-red-400 transition"
                                >
                                  <TrashIcon size={13} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* IMPACTOS EN AFINIDAD */}
                        <div className="space-y-2 pt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Impactos en Afinidad con Consejeros de la Corte
                            </span>
                            <button
                              onClick={handleAgregarImpactoAfinidad}
                              className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <PlusIcon size={13} />
                              <span>Agregar Impacto Afinidad</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {(nodoActual.impactos_afinidad || []).map(/* Prepara el resultado de cada elemento. */ (imp, idx) => (
                              <div
                                key={idx}
                                className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2"
                              >
                                <select
                                  value={imp.personaje_id}
                                  onChange={/* Responde a change desde este control. */ (e) => handleUpdateImpactoAfinidad(idx, 'personaje_id', e.target.value)}
                                  className="flex-1 text-xs bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200"
                                >
                                  {personajes.map(/* Prepara el resultado de cada elemento. */ (p) => (
                                    <option key={p._id || p.id} value={p._id || p.id}>{p.nombre}</option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  value={imp.delta}
                                  onChange={/* Responde a change desde este control. */ (e) => handleUpdateImpactoAfinidad(idx, 'delta', e.target.value)}
                                  placeholder="+/- delta"
                                  className="w-20 text-xs font-mono bg-slate-900 border border-slate-800 rounded px-2 py-1 text-purple-300 text-center"
                                />
                                <button
                                  onClick={/* Responde a click desde este control. */ () => handleEliminarImpactoAfinidad(idx)}
                                  className="p-1 text-slate-500 hover:text-red-400 transition"
                                >
                                  <TrashIcon size={13} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                    Selecciona un nodo del panel lateral para editar su contenido.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL SIMULADOR EN VIVO (TESTING EN CALIENTE)                   */}
        {/* ============================================================== */}
        {modoSimulador && itemEnEdicion && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <div className="w-full max-w-2xl bg-slate-950 border border-amber-500/40 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <SparklesIcon size={18} className="text-amber-400" />
                  <h3 className="text-sm font-bold text-white">
                    Simulador Interactivo: {itemEnEdicion.titulo}
                  </h3>
                </div>
                <button
                  onClick={/* Responde a click desde este control. */ () => setModoSimulador(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <XIcon size={16} />
                </button>
              </div>

              {/* Paso Actual Simulado */}
              {(/* Completa este paso con los datos recibidos por la operación. */ () => {
                const n = itemEnEdicion.nodos[nodoSimulacionId];
                if (!n) {
                  return <div className="text-xs text-red-400">Nodo destino no encontrado.</div>;
                }
                const pjHablante = personajes.find(/* Busca el primer elemento que cumple esta condición. */ (p) => (p._id || p.id) === n.hablante_id);
                return (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                          {pjHablante?.nombre || (n.hablante_id === 'narrador' ? 'Crónicas del Reino' : n.hablante_id)}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500">[{n.id}]</span>
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed">
                        {n.texto}
                      </p>
                    </div>

                    {/* Desenlace si es final */}
                    {n.es_final ? (
                      <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl space-y-3">
                        <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                          🏁 ¡Fin de este recorrido!
                        </span>
                        <p className="text-xs text-slate-300">{n.resultado_texto}</p>

                        <div className="pt-2 border-t border-emerald-900/60 flex flex-wrap gap-2">
                          {(n.impactos_recursos || []).map(/* Prepara el resultado de cada elemento. */ (imp, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {imp.recurso}: {imp.delta > 0 ? `+${imp.delta}` : imp.delta}
                            </span>
                          ))}
                          {(n.impactos_afinidad || []).map(/* Prepara el resultado de cada elemento. */ (imp, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              {imp.personaje_id}: {imp.delta > 0 ? `+${imp.delta}` : imp.delta}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* Opciones Seleccionables */
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Elige una decisión:
                        </span>
                        {(n.opciones || []).map(/* Prepara el resultado de cada elemento. */ (opt) => (
                          <button
                            key={opt.id}
                            onClick={/* Responde a click desde este control. */ () => elegirOpcionSimulada(opt)}
                            className="w-full text-left p-3 rounded-xl bg-slate-900 hover:bg-amber-600/20 border border-slate-800 hover:border-amber-500/50 text-xs font-semibold text-slate-200 hover:text-white transition flex items-center justify-between cursor-pointer"
                          >
                            <span>{opt.texto}</span>
                            <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                              → {opt.siguiente_nodo}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <button
                        onClick={iniciarSimulacion}
                        className="text-xs text-slate-400 hover:text-white transition"
                      >
                        🔄 Reiniciar Simulación
                      </button>
                      <button
                        onClick={/* Responde a click desde este control. */ () => setModoSimulador(false)}
                        className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition"
                      >
                        Cerrar Simulador
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
