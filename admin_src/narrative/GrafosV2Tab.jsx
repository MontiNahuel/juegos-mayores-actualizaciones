import { useState, useEffect } from 'react';
import {
  GitBranchIcon,
  PlusIcon,
  TrashIcon,
  EditIcon,
  CheckIcon,
  ChevronRightIcon,
  SparklesIcon,
  BookOpenIcon,
  AlertTriangleIcon,
  SearchIcon,
  RefreshIcon,
  XIcon,
  LockIcon
} from '../Icons';
import DiagramaNodosV2 from './DiagramaNodosV2';

const RECURSOS_DISPONIBLES = [
  { id: 'oro', label: 'Oro / Tesoro' },
  { id: 'pueblo', label: 'Pueblo / Bienestar' },
  { id: 'ejercito', label: 'Ejército / Orden Militar' },
  { id: 'fe', label: 'Fe / Iglesia' }
];

export default function GrafosV2Tab({ universos = [], personajes = [] }) {
  const [subTab, setSubTab] = useState('eventos'); // 'eventos' | 'conversaciones'
  const [listaEventos, setListaEventos] = useState([]);
  const [listaConversaciones, setListaConversaciones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [exitoMsg, setExitoMsg] = useState('');

  // Modo edición / creación
  const [modoEdicion, setModoEdicion] = useState(false);
  const [tipoEdicion, setTipoEdicion] = useState('evento'); // 'evento' | 'conversacion'
  const [itemEnEdicion, setItemEnEdicion] = useState(null);
  const [nodoSeleccionadoId, setNodoSeleccionadoId] = useState('inicio');
  const [vistaEditor, setVistaEditor] = useState('diagrama'); // 'diagrama' | 'formulario'
  const [tabInspector, setTabInspector] = useState('nodo'); // 'nodo' | 'grafo'
  const [guardando, setGuardando] = useState(false);

  // Modo Simulador de recorrido en vivo
  const [modoSimulador, setModoSimulador] = useState(false);
  const [nodoSimulacionId, setNodoSimulacionId] = useState('inicio');
  const [historialSimulacion, setHistorialSimulacion] = useState([]);

  useEffect(() => {
    cargarGrafos();
  }, []);

  const cargarGrafos = async () => {
    setCargando(true);
    setErrorMsg('');
    try {
      const [resEvts, resConvs] = await Promise.all([
        fetch('/api/narrative/admin/v2/eventos'),
        fetch('/api/narrative/admin/v2/conversaciones')
      ]);

      if (resEvts.ok) {
        const dataEvts = await resEvts.json();
        setListaEventos(dataEvts || []);
      }
      if (resConvs.ok) {
        const dataConvs = await resConvs.json();
        setListaConversaciones(dataConvs || []);
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Error al conectar con la API de narrativa V2.');
    } finally {
      setCargando(false);
    }
  };

  const handleNuevoItem = (tipo) => {
    setTipoEdicion(tipo);
    const nuevoId = tipo === 'evento' ? `evt_nuevo_${Date.now()}` : `conv_nueva_${Date.now()}`;
    const base = {
      _id: nuevoId,
      id: nuevoId,
      universo_id: universos[0]?.id || 'corte_medieval',
      titulo: tipo === 'evento' ? 'Nuevo Evento Ramificado' : 'Nueva Conversación de Corte',
      imagen: tipo === 'evento' ? '/assets/narrative/eventos/default.webp' : '/assets/narrative/conversation-hall.png',
      nodo_raiz: 'inicio',
      nodos: {
        inicio: {
          id: 'inicio',
          hablante_id: tipo === 'evento' ? 'narrador' : (personajes[0]?._id || personajes[0]?.id || 'pj_canciller_elena'),
          texto: 'Texto del dilema inicial...',
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
          texto: 'Desenlace favorable de la opción A.',
          es_final: true,
          opciones: [],
          resultado_texto: 'Has completado el camino A con éxito.',
          impactos_recursos: [{ recurso: 'oro', delta: 10 }],
          impactos_afinidad: []
        },
        fin_b: {
          id: 'fin_b',
          hablante_id: 'narrador',
          texto: 'Desenlace alternativo de la opción B.',
          es_final: true,
          opciones: [],
          resultado_texto: 'Has elegido el camino B con sus consecuencias.',
          impactos_recursos: [{ recurso: 'oro', delta: -10 }],
          impactos_afinidad: []
        }
      }
    };

    if (tipo === 'evento') {
      base.requisitos_eventos_previos = [];
    } else {
      base.requisitos = personajes.slice(0, 2).map((p) => p._id || p.id);
    }

    setItemEnEdicion(base);
    setNodoSeleccionadoId('inicio');
    setModoEdicion(true);
    setModoSimulador(false);
  };

  const handleEditarItem = (item, tipo) => {
    setTipoEdicion(tipo);
    const clon = JSON.parse(JSON.stringify(item));
    if (!clon.id && clon._id) clon.id = clon._id;
    if (!clon._id && clon.id) clon._id = clon.id;
    setItemEnEdicion(clon);
    setNodoSeleccionadoId(clon.nodo_raiz || Object.keys(clon.nodos || {})[0] || 'inicio');
    setModoEdicion(true);
    setModoSimulador(false);
  };

  const handleEliminarItem = async (id, tipo) => {
    if (!window.confirm(`¿Estás seguro de eliminar el grafo "${id}"?`)) return;

    try {
      const url = tipo === 'evento'
        ? `/api/narrative/admin/v2/eventos/${id}`
        : `/api/narrative/admin/v2/conversaciones/${id}`;

      const res = await fetch(url, { method: 'DELETE' });
      if (res.ok) {
        setExitoMsg('Grafo eliminado correctamente.');
        setTimeout(() => setExitoMsg(''), 3000);
        cargarGrafos();
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.detail || 'Error al eliminar grafo.');
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Error al conectar con el servidor.');
    }
  };

  const handleGuardarItem = async () => {
    if (!itemEnEdicion) return;

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

      const payload = { ...itemEnEdicion, _id: id, id: id };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setExitoMsg(`¡${tipoEdicion === 'evento' ? 'Evento' : 'Conversación'} V2 guardado con éxito!`);
        setTimeout(() => setExitoMsg(''), 3000);
        setModoEdicion(false);
        setItemEnEdicion(null);
        await cargarGrafos();
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.detail || data.message || 'Error al guardar el grafo.');
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Error de conexión al guardar.');
    } finally {
      setGuardando(false);
    }
  };

  // Manejo de Nodos
  const nodoActual = itemEnEdicion?.nodos?.[nodoSeleccionadoId];

  const handleUpdateNodoActual = (campo, valor) => {
    if (!itemEnEdicion || !nodoActual) return;
    setItemEnEdicion((prev) => ({
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

  const handleAgregarNodo = () => {
    if (!itemEnEdicion) return;
    const count = Object.keys(itemEnEdicion.nodos).length + 1;
    const nuevoNodoId = `paso_${count}`;
    const nuevoNodo = {
      id: nuevoNodoId,
      hablante_id: 'narrador',
      texto: 'Nuevo paso de la historia...',
      es_final: false,
      opciones: [
        { id: `opt_${count}_1`, texto: 'Continuar', siguiente_nodo: itemEnEdicion.nodo_raiz }
      ],
      resultado_texto: '',
      impactos_recursos: [],
      impactos_afinidad: []
    };

    setItemEnEdicion((prev) => ({
      ...prev,
      nodos: { ...prev.nodos, [nuevoNodoId]: nuevoNodo }
    }));
    setNodoSeleccionadoId(nuevoNodoId);
  };

  const handleCrearNodoHijo = () => {
    if (!itemEnEdicion || !nodoActual) return;
    const count = Object.keys(itemEnEdicion.nodos).length + 1;
    const nuevoNodoId = `paso_${count}`;
    const nuevoNodo = {
      id: nuevoNodoId,
      hablante_id: 'narrador',
      texto: 'Continuación del relato...',
      es_final: false,
      opciones: [
        { id: `opt_${count}_1`, texto: 'Continuar', siguiente_nodo: itemEnEdicion.nodo_raiz }
      ],
      resultado_texto: '',
      impactos_recursos: [],
      impactos_afinidad: []
    };

    const opcionesActuales = Array.isArray(nodoActual.opciones) ? nodoActual.opciones : [];
    const nuevasOpciones = !nodoActual.es_final
      ? [...opcionesActuales, { id: `opt_${count}_salto`, texto: `Ir a ${nuevoNodoId}`, siguiente_nodo: nuevoNodoId }]
      : opcionesActuales;

    setItemEnEdicion((prev) => ({
      ...prev,
      nodos: {
        ...prev.nodos,
        [nodoSeleccionadoId]: {
          ...prev.nodos[nodoSeleccionadoId],
          opciones: nuevasOpciones
        },
        [nuevoNodoId]: nuevoNodo
      }
    }));
    setNodoSeleccionadoId(nuevoNodoId);
  };

  const handleEliminarNodo = (nid) => {
    if (Object.keys(itemEnEdicion.nodos).length <= 1) {
      alert('No puedes eliminar el único nodo del grafo.');
      return;
    }
    if (nid === itemEnEdicion.nodo_raiz) {
      alert('No puedes eliminar el nodo raíz. Asigna otro como raíz primero.');
      return;
    }
    if (!window.confirm(`¿Eliminar nodo "${nid}"?`)) return;

    setItemEnEdicion((prev) => {
      const copia = { ...prev.nodos };
      delete copia[nid];
      return { ...prev, nodos: copia };
    });
    setNodoSeleccionadoId(itemEnEdicion.nodo_raiz);
  };

  // Opciones
  const handleAgregarOpcion = () => {
    if (!nodoActual) return;
    const num = (nodoActual.opciones?.length || 0) + 1;
    const nuevaOpt = {
      id: `opt_${num}`,
      texto: `Decisión ${num}`,
      siguiente_nodo: itemEnEdicion.nodo_raiz
    };
    handleUpdateNodoActual('opciones', [...(nodoActual.opciones || []), nuevaOpt]);
  };

  const handleUpdateOpcion = (idx, campo, valor) => {
    if (!nodoActual || !nodoActual.opciones) return;
    const nuevas = [...nodoActual.opciones];
    nuevas[idx] = { ...nuevas[idx], [campo]: valor };
    handleUpdateNodoActual('opciones', nuevas);
  };

  const handleEliminarOpcion = (idx) => {
    if (!nodoActual || !nodoActual.opciones) return;
    const nuevas = nodoActual.opciones.filter((_, i) => i !== idx);
    handleUpdateNodoActual('opciones', nuevas);
  };

  const handleAgregarCondicionAOpcion = (optIdx) => {
    if (!nodoActual || !nodoActual.opciones) return;
    const opt = nodoActual.opciones[optIdx];
    const conds = Array.isArray(opt.condiciones) ? opt.condiciones : [];
    const nuevaCond = {
      tipo: 'comparar_recurso',
      clave: 'oro',
      operador: '>=',
      valor: 30
    };
    handleUpdateOpcion(optIdx, 'condiciones', [...conds, nuevaCond]);
  };

  const handleUpdateCondicionOpcion = (optIdx, condIdx, campo, valor) => {
    if (!nodoActual || !nodoActual.opciones) return;
    const opt = nodoActual.opciones[optIdx];
    const conds = [...(opt.condiciones || [])];
    conds[condIdx] = {
      ...conds[condIdx],
      [campo]: campo === 'valor' && (conds[condIdx].tipo === 'comparar_recurso' || conds[condIdx].tipo === 'afinidad_personaje')
        ? parseInt(valor, 10) || 0
        : valor
    };
    handleUpdateOpcion(optIdx, 'condiciones', conds);
  };

  const handleEliminarCondicionOpcion = (optIdx, condIdx) => {
    if (!nodoActual || !nodoActual.opciones) return;
    const opt = nodoActual.opciones[optIdx];
    const conds = (opt.condiciones || []).filter((_, i) => i !== condIdx);
    handleUpdateOpcion(optIdx, 'condiciones', conds);
  };

  // Impactos Recursos
  const handleAgregarImpactoRecurso = () => {
    if (!nodoActual) return;
    handleUpdateNodoActual('impactos_recursos', [...(nodoActual.impactos_recursos || []), { recurso: 'oro', delta: 5 }]);
  };

  const handleUpdateImpactoRecurso = (idx, campo, valor) => {
    if (!nodoActual) return;
    const nuevos = [...(nodoActual.impactos_recursos || [])];
    nuevos[idx] = { ...nuevos[idx], [campo]: campo === 'delta' ? parseInt(valor, 10) || 0 : valor };
    handleUpdateNodoActual('impactos_recursos', nuevos);
  };

  const handleEliminarImpactoRecurso = (idx) => {
    if (!nodoActual) return;
    const nuevos = (nodoActual.impactos_recursos || []).filter((_, i) => i !== idx);
    handleUpdateNodoActual('impactos_recursos', nuevos);
  };

  // Impactos Afinidad
  const handleAgregarImpactoAfinidad = () => {
    if (!nodoActual) return;
    handleUpdateNodoActual('impactos_afinidad', [
      ...(nodoActual.impactos_afinidad || []),
      { personaje_id: personajes[0]?._id || personajes[0]?.id || 'pj_canciller_elena', delta: 10 }
    ]);
  };

  const handleUpdateImpactoAfinidad = (idx, campo, valor) => {
    if (!nodoActual) return;
    const nuevos = [...(nodoActual.impactos_afinidad || [])];
    nuevos[idx] = { ...nuevos[idx], [campo]: campo === 'delta' ? parseInt(valor, 10) || 0 : valor };
    handleUpdateNodoActual('impactos_afinidad', nuevos);
  };

  const handleEliminarImpactoAfinidad = (idx) => {
    if (!nodoActual) return;
    const nuevos = (nodoActual.impactos_afinidad || []).filter((_, i) => i !== idx);
    handleUpdateNodoActual('impactos_afinidad', nuevos);
  };

  // Simulador
  const iniciarSimulacion = () => {
    if (!itemEnEdicion) return;
    setNodoSimulacionId(itemEnEdicion.nodo_raiz);
    setHistorialSimulacion([]);
    setModoSimulador(true);
  };

  const elegirOpcionSimulada = (opt) => {
    setHistorialSimulacion((prev) => [
      ...prev,
      {
        nodoId: nodoSimulacionId,
        textoNodo: itemEnEdicion.nodos[nodoSimulacionId]?.texto,
        opcionElegida: opt.texto
      }
    ]);
    if (itemEnEdicion?.nodos?.[opt.siguiente_nodo]) {
      setNodoSimulacionId(opt.siguiente_nodo);
    }
  };

  const eventosFiltrados = listaEventos.filter((e) =>
    (e.titulo || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (e._id || e.id || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  const conversacionesFiltradas = listaConversaciones.filter((c) =>
    (c.titulo || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (c._id || c.id || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Alertas */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertTriangleIcon size={16} />
          <span>{errorMsg}</span>
        </div>
      )}
      {exitoMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
          <CheckIcon size={16} />
          <span>{exitoMsg}</span>
        </div>
      )}

      {!modoEdicion ? (
        /* VISTA LISTADO DE GRAFOS V2 */
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSubTab('eventos')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  subTab === 'eventos'
                    ? 'bg-[#002B5E] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <BookOpenIcon size={14} />
                <span>Eventos de Reino ({listaEventos.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSubTab('conversaciones')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  subTab === 'conversaciones'
                    ? 'bg-[#002B5E] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <SparklesIcon size={14} />
                <span>Conversaciones de Corte ({listaConversaciones.length})</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <SearchIcon size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar grafo por ID o título..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#002B5E] w-56"
                />
              </div>

              <button
                type="button"
                onClick={cargarGrafos}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
                title="Refrescar grafos"
              >
                <RefreshIcon size={15} />
              </button>

              <button
                type="button"
                onClick={() => handleNuevoItem(subTab === 'eventos' ? 'evento' : 'conversacion')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#002B5E] hover:bg-slate-900 text-white font-bold text-xs transition shadow-xs cursor-pointer"
              >
                <PlusIcon size={15} />
                <span>{subTab === 'eventos' ? 'Nuevo Evento V2' : 'Nueva Conversación V2'}</span>
              </button>
            </div>
          </div>

          {/* Grilla de Elementos */}
          {cargando ? (
            <div className="py-12 text-center text-slate-400 text-xs font-semibold">
              Cargando catálogo V2...
            </div>
          ) : subTab === 'eventos' ? (
            eventosFiltrados.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                No se encontraron eventos de reino V2.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {eventosFiltrados.map((evt) => {
                  const id = evt._id || evt.id;
                  const numNodos = Object.keys(evt.nodos || {}).length;
                  const reqs = evt.requisitos_eventos_previos || [];
                  return (
                    <div
                      key={id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-[#002B5E]/40 hover:shadow-sm transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-200/70 text-slate-700 rounded font-bold">
                            {id}
                          </span>
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <GitBranchIcon size={11} />
                            {numNodos} nodos
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-slate-900 mb-1">{evt.titulo}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {evt.nodos?.[evt.nodo_raiz]?.texto || 'Sin texto inicial'}
                        </p>

                        {reqs.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-slate-200/60">
                            <span className="text-[10px] text-slate-400 block mb-1 font-semibold">
                              Requiere haber completado:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {reqs.map((r) => (
                                <span
                                  key={r}
                                  className="text-[9px] px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded font-mono font-bold"
                                >
                                  {r}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditarItem(evt, 'evento')}
                          className="px-3 py-1 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition flex items-center gap-1 cursor-pointer"
                        >
                          <EditIcon size={13} />
                          <span>Editar Nodos</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminarItem(id, 'evento')}
                          className="p-1.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition cursor-pointer"
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
              <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                No se encontraron conversaciones de corte V2.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {conversacionesFiltradas.map((conv) => {
                  const id = conv._id || conv.id;
                  const numNodos = Object.keys(conv.nodos || {}).length;
                  const reqsPjs = conv.requisitos || [];
                  return (
                    <div
                      key={id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-[#002B5E]/40 hover:shadow-sm transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-200/70 text-slate-700 rounded font-bold">
                            {id}
                          </span>
                          <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <GitBranchIcon size={11} />
                            {numNodos} nodos
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-slate-900 mb-1">{conv.titulo}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {conv.nodos?.[conv.nodo_raiz]?.texto || 'Sin texto inicial'}
                        </p>

                        {reqsPjs.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-slate-200/60">
                            <span className="text-[10px] text-slate-400 block mb-1 font-semibold">
                              Consejeros requeridos en corte:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {reqsPjs.map((pjId) => {
                                const pjInfo = personajes.find((p) => (p._id || p.id) === pjId);
                                return (
                                  <span
                                    key={pjId}
                                    className="text-[9px] px-1.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded font-bold"
                                  >
                                    {pjInfo?.nombre || pjId}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditarItem(conv, 'conversacion')}
                          className="px-3 py-1 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition flex items-center gap-1 cursor-pointer"
                        >
                          <EditIcon size={13} />
                          <span>Editar Nodos</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminarItem(id, 'conversacion')}
                          className="p-1.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition cursor-pointer"
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
      ) : (
        /* VISTA EDITOR DE GRAFOS Y NODOS */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          {/* Barra Superior del Editor */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setModoEdicion(false)}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer"
              >
                ← Volver al listado
              </button>
              <div className="h-4 w-px bg-slate-300" />
              <span className="text-xs font-extrabold text-[#002B5E] uppercase tracking-wider">
                Editando {tipoEdicion === 'evento' ? 'Evento' : 'Conversación'}:
              </span>
              <span className="text-xs font-mono bg-slate-200 px-2 py-0.5 rounded text-slate-800 font-bold">
                {itemEnEdicion?._id || itemEnEdicion?.id}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* SELECTOR DE VISTA: DIAGRAMA VISUAL vs FORMULARIO */}
              <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl border border-slate-300">
                <button
                  type="button"
                  onClick={() => setVistaEditor('diagrama')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    vistaEditor === 'diagrama'
                      ? 'bg-white text-[#002B5E] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <GitBranchIcon size={13} />
                  <span>Mapa Visual</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVistaEditor('formulario')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    vistaEditor === 'formulario'
                      ? 'bg-white text-[#002B5E] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <EditIcon size={13} />
                  <span>Formulario Detallado</span>
                </button>
              </div>

              <div className="h-4 w-px bg-slate-300 mx-1" />

              <button
                type="button"
                onClick={iniciarSimulacion}
                className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <SparklesIcon size={14} />
                <span>Probar Recorrido (Simulador)</span>
              </button>

              <button
                type="button"
                onClick={handleGuardarItem}
                disabled={guardando}
                className="px-4 py-1.5 rounded-xl bg-[#002B5E] hover:bg-slate-900 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <CheckIcon size={15} />
                <span>{guardando ? 'Guardando...' : 'Guardar Grafo'}</span>
              </button>
            </div>
          </div>

          {vistaEditor === 'diagrama' ? (
            /* VISTA LIENZO VISUAL + INSPECTOR LATERAL */
            <div className="flex flex-col lg:flex-row h-[720px] bg-slate-100">
              {/* Lienzo del Diagrama */}
              <div className="flex-1 min-w-0 h-full p-3 overflow-hidden">
                <DiagramaNodosV2
                  nodos={itemEnEdicion?.nodos || {}}
                  nodoRaiz={itemEnEdicion?.nodo_raiz || 'inicio'}
                  nodoSeleccionadoId={nodoSeleccionadoId}
                  onSeleccionarNodo={(id) => setNodoSeleccionadoId(id)}
                  personajes={personajes}
                />
              </div>

              {/* Inspector Lateral del Grafo y Nodo */}
              <div className="w-full lg:w-96 border-l border-slate-200 bg-white flex flex-col justify-between overflow-hidden h-full shadow-xs">
                {/* Pestañas del Inspector: Nodo vs Propiedades del Grafo */}
                <div className="px-4 pt-3 pb-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTabInspector('nodo')}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                        tabInspector === 'nodo'
                          ? 'bg-[#002B5E] text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <span>📍 Nodo: {nodoSeleccionadoId}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTabInspector('grafo')}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                        tabInspector === 'grafo'
                          ? 'bg-[#002B5E] text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <span>⚙️ Grafo</span>
                    </button>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono font-bold">
                    {Object.keys(itemEnEdicion?.nodos || {}).length} nodos
                  </span>
                </div>

                {/* Contenido scrolleable del Inspector */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                  {tabInspector === 'grafo' ? (
                    /* Configuración Global del Grafo */
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          ID Único del Grafo
                        </label>
                        <input
                          type="text"
                          value={itemEnEdicion?._id || itemEnEdicion?.id || ''}
                          onChange={(e) => {
                            const val = e.target.value.trim();
                            setItemEnEdicion((prev) => ({ ...prev, _id: val, id: val }));
                          }}
                          className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#002B5E]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Título
                        </label>
                        <input
                          type="text"
                          value={itemEnEdicion?.titulo || ''}
                          onChange={(e) => setItemEnEdicion((prev) => ({ ...prev, titulo: e.target.value }))}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#002B5E]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Nodo Raíz (Inicio)
                        </label>
                        <select
                          value={itemEnEdicion?.nodo_raiz || ''}
                          onChange={(e) => setItemEnEdicion((prev) => ({ ...prev, nodo_raiz: e.target.value }))}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:border-[#002B5E]"
                        >
                          {Object.keys(itemEnEdicion?.nodos || {}).map((nid) => (
                            <option key={nid} value={nid}>{nid}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Tags Temáticos (Sinergias con Corte y Cartas)
                        </label>
                        <input
                          type="text"
                          placeholder="militar, diplomacia, iglesia, peste..."
                          value={(itemEnEdicion?.tags_tematicos || []).join(', ')}
                          onChange={(e) => {
                            const arr = e.target.value.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
                            setItemEnEdicion((prev) => ({ ...prev, tags_tematicos: arr }));
                          }}
                          className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#002B5E]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Peso Base de Sorteo
                        </label>
                        <input
                          type="number"
                          value={itemEnEdicion?.peso_base ?? 100}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 100;
                            setItemEnEdicion((prev) => ({ ...prev, peso_base: val }));
                          }}
                          className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#002B5E]"
                        />
                      </div>

                      {tipoEdicion === 'evento' && (
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            Requisitos Previos (Arcos de Misión)
                          </label>
                          <input
                            type="text"
                            placeholder="evt_1, evt_2"
                            value={(itemEnEdicion?.requisitos_eventos_previos || []).join(', ')}
                            onChange={(e) => {
                              const arr = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                              setItemEnEdicion((prev) => ({ ...prev, requisitos_eventos_previos: arr }));
                            }}
                            className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#002B5E]"
                          />
                        </div>
                      )}

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Consejeros Requeridos en Corte
                        </label>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          {personajes.map((p) => {
                            const pid = p._id || p.id;
                            const campoReq = tipoEdicion === 'evento' ? 'requisitos_personajes' : 'requisitos';
                            const marcado = (itemEnEdicion?.[campoReq] || []).includes(pid);
                            return (
                              <label key={pid} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={marcado}
                                  onChange={(e) => {
                                    const actuales = itemEnEdicion?.[campoReq] || [];
                                    const nuevos = e.target.checked
                                      ? [...actuales, pid]
                                      : actuales.filter((x) => x !== pid);
                                    setItemEnEdicion((prev) => ({ ...prev, [campoReq]: nuevos }));
                                  }}
                                  className="rounded text-[#002B5E] focus:ring-0"
                                />
                                <span>{p.nombre}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : nodoActual ? (
                    /* Configuración del Nodo Seleccionado */
                    <div className="space-y-4">
                      {/* Cabecera del Nodo */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-[#002B5E]">
                            {nodoActual.id}
                          </span>
                          {nodoActual.id === itemEnEdicion?.nodo_raiz && (
                            <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                              RAÍZ
                            </span>
                          )}
                          {nodoActual.es_final && (
                            <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                              FINAL
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {nodoActual.id !== itemEnEdicion?.nodo_raiz && (
                            <button
                              type="button"
                              onClick={() => setItemEnEdicion((prev) => ({ ...prev, nodo_raiz: nodoActual.id }))}
                              className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition cursor-pointer"
                              title="Hacer raíz este nodo"
                            >
                              Fijar Raíz
                            </button>
                          )}
                          {nodoActual.id !== itemEnEdicion?.nodo_raiz && (
                            <button
                              type="button"
                              onClick={() => handleEliminarNodo(nodoActual.id)}
                              className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                              title="Eliminar nodo"
                            >
                              <TrashIcon size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Hablante */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Hablante / Personaje
                        </label>
                        <select
                          value={nodoActual.hablante_id || 'narrador'}
                          onChange={(e) => handleUpdateNodoActual('hablante_id', e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#002B5E] font-medium"
                        >
                          <option value="narrador">Crónicas del Reino (Narrador)</option>
                          {personajes.map((p) => {
                            const pid = p._id || p.id;
                            return (
                              <option key={pid} value={pid}>
                                {p.nombre} ({p.rol || p.titulo || pid})
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* Texto Narrativo */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Texto Narrativo
                        </label>
                        <textarea
                          rows={3}
                          value={nodoActual.texto || ''}
                          onChange={(e) => handleUpdateNodoActual('texto', e.target.value)}
                          placeholder="¿Qué ocurre en este nodo?..."
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-[#002B5E]"
                        />
                      </div>

                      {/* Naturaleza: Opciones vs Final */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Tipo de Paso
                        </label>
                        <div className="flex items-center gap-3 pt-1">
                          <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                            <input
                              type="radio"
                              name="diagrama_es_final"
                              checked={!nodoActual.es_final}
                              onChange={() => handleUpdateNodoActual('es_final', false)}
                              className="text-[#002B5E]"
                            />
                            <span>Dilema con Opciones</span>
                          </label>
                          <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                            <input
                              type="radio"
                              name="diagrama_es_final"
                              checked={!!nodoActual.es_final}
                              onChange={() => handleUpdateNodoActual('es_final', true)}
                              className="text-emerald-600"
                            />
                            <span className="font-bold text-emerald-700">Desenlace Final</span>
                          </label>
                        </div>
                      </div>

                      {/* Opciones de Ramificación */}
                      {!nodoActual.es_final ? (
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Opciones de Decisión ({nodoActual.opciones?.length || 0})
                            </span>
                            <button
                              type="button"
                              onClick={handleAgregarOpcion}
                              className="text-xs text-[#002B5E] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <PlusIcon size={12} />
                              <span>+ Opción</span>
                            </button>
                          </div>

                          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                            {(nodoActual.opciones || []).map((opt, idx) => (
                              <div
                                key={opt.id || idx}
                                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs"
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-mono text-[9px] text-slate-400 font-bold">Opción #{idx + 1}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleEliminarOpcion(idx)}
                                    className="text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                  >
                                    <TrashIcon size={12} />
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  value={opt.texto || ''}
                                  onChange={(e) => handleUpdateOpcion(idx, 'texto', e.target.value)}
                                  placeholder="Texto de la decisión..."
                                  className="w-full text-xs bg-white border border-slate-200 rounded px-2 py-1 text-slate-800"
                                />
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] text-[#002B5E] font-bold flex items-center gap-0.5">
                                    <ChevronRightIcon size={10} />
                                    <span>Salta a:</span>
                                  </span>
                                  <select
                                    value={opt.siguiente_nodo || ''}
                                    onChange={(e) => handleUpdateOpcion(idx, 'siguiente_nodo', e.target.value)}
                                    className="flex-1 text-xs bg-white border border-slate-200 rounded px-1.5 py-0.5 font-mono font-bold text-slate-800"
                                  >
                                    {Object.keys(itemEnEdicion?.nodos || {}).map((targetId) => (
                                      <option key={targetId} value={targetId}>
                                        {targetId} {itemEnEdicion.nodos[targetId]?.es_final ? '(🏁)' : ''}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* Condiciones de Desbloqueo */}
                                <div className="pt-2 border-t border-slate-200/60 space-y-1.5 mt-1.5">
                                  <div className="flex items-center justify-between text-[10px]">
                                    <span className="font-bold text-slate-600 flex items-center gap-1">
                                      <LockIcon size={11} className={opt.condiciones?.length > 0 ? "text-amber-600" : "text-slate-400"} />
                                      <span>Condiciones ({opt.condiciones?.length || 0})</span>
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      <select
                                        value={opt.bloqueo_modo || 'deshabilitada'}
                                        onChange={(e) => handleUpdateOpcion(idx, 'bloqueo_modo', e.target.value)}
                                        className="text-[9px] bg-white border border-slate-200 rounded px-1 py-0.5 text-slate-700 font-bold"
                                        title="Modo si el jugador no cumple"
                                      >
                                        <option value="deshabilitada">Candado visible</option>
                                        <option value="oculta">Oculta (Secreta)</option>
                                      </select>
                                      <button
                                        type="button"
                                        onClick={() => handleAgregarCondicionAOpcion(idx)}
                                        className="text-[10px] text-[#002B5E] hover:underline font-bold"
                                      >
                                        + Condición
                                      </button>
                                    </div>
                                  </div>

                                  {(opt.condiciones || []).map((cond, cIdx) => (
                                    <div key={cIdx} className="p-1.5 bg-white rounded-lg border border-slate-200 flex flex-wrap items-center gap-1.5 text-[10px]">
                                      <select
                                        value={cond.tipo || 'comparar_recurso'}
                                        onChange={(e) => handleUpdateCondicionOpcion(idx, cIdx, 'tipo', e.target.value)}
                                        className="bg-slate-50 border border-slate-200 rounded px-1 py-0.5 font-bold text-slate-700"
                                      >
                                        <option value="comparar_recurso">Recurso Reino</option>
                                        <option value="afinidad_personaje">Afinidad Consejero</option>
                                        <option value="tiene_personaje">Consejero en Corte</option>
                                        <option value="tiene_tag">Tag / Atributo</option>
                                        <option value="tiene_carta">Carta / Objeto</option>
                                      </select>

                                      {cond.tipo === 'comparar_recurso' && (
                                        <>
                                          <select
                                            value={cond.clave || 'oro'}
                                            onChange={(e) => handleUpdateCondicionOpcion(idx, cIdx, 'clave', e.target.value)}
                                            className="bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-slate-700 font-bold"
                                          >
                                            {RECURSOS_DISPONIBLES.map((r) => (
                                              <option key={r.id} value={r.id}>{r.label.split(' ')[0]}</option>
                                            ))}
                                          </select>
                                          <select
                                            value={cond.operador || '>='}
                                            onChange={(e) => handleUpdateCondicionOpcion(idx, cIdx, 'operador', e.target.value)}
                                            className="bg-slate-50 border border-slate-200 rounded px-1 py-0.5 font-mono font-bold"
                                          >
                                            <option value=">=">&gt;=</option>
                                            <option value="<=">&lt;=</option>
                                            <option value=">">&gt;</option>
                                            <option value="<">&lt;</option>
                                            <option value="==">==</option>
                                          </select>
                                          <input
                                            type="number"
                                            value={cond.valor ?? 30}
                                            onChange={(e) => handleUpdateCondicionOpcion(idx, cIdx, 'valor', e.target.value)}
                                            className="w-12 bg-slate-50 border border-slate-200 rounded px-1 py-0.5 font-mono text-center font-bold"
                                          />
                                        </>
                                      )}

                                      {cond.tipo === 'afinidad_personaje' && (
                                        <>
                                          <select
                                            value={cond.personaje_id || (personajes[0]?._id || personajes[0]?.id || '')}
                                            onChange={(e) => handleUpdateCondicionOpcion(idx, cIdx, 'personaje_id', e.target.value)}
                                            className="bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-slate-700 font-bold truncate max-w-[80px]"
                                          >
                                            {personajes.map((p) => (
                                              <option key={p._id || p.id} value={p._id || p.id}>{p.nombre}</option>
                                            ))}
                                          </select>
                                          <select
                                            value={cond.operador || '>='}
                                            onChange={(e) => handleUpdateCondicionOpcion(idx, cIdx, 'operador', e.target.value)}
                                            className="bg-slate-50 border border-slate-200 rounded px-1 py-0.5 font-mono font-bold"
                                          >
                                            <option value=">=">&gt;=</option>
                                            <option value="<=">&lt;=</option>
                                          </select>
                                          <input
                                            type="number"
                                            value={cond.valor ?? 50}
                                            onChange={(e) => handleUpdateCondicionOpcion(idx, cIdx, 'valor', e.target.value)}
                                            className="w-12 bg-slate-50 border border-slate-200 rounded px-1 py-0.5 font-mono text-center font-bold"
                                          />
                                        </>
                                      )}

                                      {cond.tipo === 'tiene_personaje' && (
                                        <select
                                          value={cond.personaje_id || (personajes[0]?._id || personajes[0]?.id || '')}
                                          onChange={(e) => handleUpdateCondicionOpcion(idx, cIdx, 'personaje_id', e.target.value)}
                                          className="bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-slate-700 font-bold truncate flex-1"
                                        >
                                          {personajes.map((p) => (
                                            <option key={p._id || p.id} value={p._id || p.id}>{p.nombre}</option>
                                          ))}
                                        </select>
                                      )}

                                      {cond.tipo === 'tiene_tag' && (
                                        <input
                                          type="text"
                                          placeholder="Tag activo..."
                                          value={cond.tag || ''}
                                          onChange={(e) => handleUpdateCondicionOpcion(idx, cIdx, 'tag', e.target.value)}
                                          className="flex-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 font-mono"
                                        />
                                      )}

                                      {cond.tipo === 'tiene_carta' && (
                                        <input
                                          type="text"
                                          placeholder="ID carta..."
                                          value={cond.carta_id || ''}
                                          onChange={(e) => handleUpdateCondicionOpcion(idx, cIdx, 'carta_id', e.target.value)}
                                          className="flex-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 font-mono"
                                        />
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => handleEliminarCondicionOpcion(idx, cIdx)}
                                        className="text-slate-400 hover:text-rose-600 transition"
                                      >
                                        <TrashIcon size={11} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        /* Desenlace */
                        <div className="space-y-3 pt-2 border-t border-slate-100">
                          <div>
                            <label className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                              Texto de Desenlace Final
                            </label>
                            <textarea
                              rows={2}
                              value={nodoActual.resultado_texto || ''}
                              onChange={(e) => handleUpdateNodoActual('resultado_texto', e.target.value)}
                              placeholder="Consecuencia al llegar a este desenlace..."
                              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-none focus:border-emerald-600"
                            />
                          </div>

                          <div className="text-[10px] text-slate-600 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200 flex items-center justify-between">
                            <span>Impactos configurados:</span>
                            <span className="font-bold text-emerald-800 font-mono">
                              {nodoActual.impactos_recursos?.length || 0} recursos / {nodoActual.impactos_afinidad?.length || 0} afinidad
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-20 text-center text-slate-400 text-xs">
                      Selecciona un nodo del diagrama para ver y editar sus propiedades.
                    </div>
                  )}
                </div>

                {/* Acciones Rápidas del Footer del Inspector */}
                <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleCrearNodoHijo}
                      className="py-1.5 px-2 rounded-xl bg-[#002B5E] hover:bg-slate-900 text-white font-bold text-[11px] transition flex items-center justify-center gap-1 cursor-pointer"
                      title="Crea un nodo nuevo y lo enlaza automáticamente como siguiente paso"
                    >
                      <PlusIcon size={12} />
                      <span>+ Rama Hija</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAgregarNodo}
                      className="py-1.5 px-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-[11px] transition flex items-center justify-center gap-1 cursor-pointer"
                      title="Crea un nuevo nodo libre"
                    >
                      <PlusIcon size={12} />
                      <span>+ Nodo Libre</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setVistaEditor('formulario')}
                    className="w-full py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-[#002B5E] font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <EditIcon size={12} />
                    <span>Abrir Formulario Detallado ➔</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Panel Dividido: Árbol Izquierdo + Nodo Activo Derecho */
            <div className="flex flex-col md:flex-row min-h-[550px]">
            {/* Panel Lateral: Metadatos y Árbol */}
            <div className="w-full md:w-80 border-r border-slate-200 bg-slate-50/70 p-4 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    ID Único (MongoDB)
                  </label>
                  <input
                    type="text"
                    value={itemEnEdicion?._id || itemEnEdicion?.id || ''}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      setItemEnEdicion((prev) => ({ ...prev, _id: val, id: val }));
                    }}
                    className="w-full text-xs font-mono bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none focus:border-[#002B5E]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Título
                  </label>
                  <input
                    type="text"
                    value={itemEnEdicion?.titulo || ''}
                    onChange={(e) => setItemEnEdicion((prev) => ({ ...prev, titulo: e.target.value }))}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none focus:border-[#002B5E]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Nodo Raíz Inicial
                  </label>
                  <select
                    value={itemEnEdicion?.nodo_raiz || ''}
                    onChange={(e) => setItemEnEdicion((prev) => ({ ...prev, nodo_raiz: e.target.value }))}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none focus:border-[#002B5E] font-bold"
                  >
                    {Object.keys(itemEnEdicion?.nodos || {}).map((nid) => (
                      <option key={nid} value={nid}>{nid}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Tags Temáticos (Sinergias con Corte y Cartas)
                  </label>
                  <input
                    type="text"
                    placeholder="militar, diplomacia, iglesia, peste..."
                    value={(itemEnEdicion?.tags_tematicos || []).join(', ')}
                    onChange={(e) => {
                      const arr = e.target.value.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
                      setItemEnEdicion((prev) => ({ ...prev, tags_tematicos: arr }));
                    }}
                    className="w-full text-xs font-mono bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none focus:border-[#002B5E]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Peso Base de Sorteo
                  </label>
                  <input
                    type="number"
                    value={itemEnEdicion?.peso_base ?? 100}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 100;
                      setItemEnEdicion((prev) => ({ ...prev, peso_base: val }));
                    }}
                    className="w-full text-xs font-mono bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none focus:border-[#002B5E]"
                  />
                </div>

                {tipoEdicion === 'evento' && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Requisitos Previos (Arcos de Misión)
                    </label>
                    <input
                      type="text"
                      placeholder="evt_1, evt_2"
                      value={(itemEnEdicion?.requisitos_eventos_previos || []).join(', ')}
                      onChange={(e) => {
                        const arr = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                        setItemEnEdicion((prev) => ({ ...prev, requisitos_eventos_previos: arr }));
                      }}
                      className="w-full text-xs font-mono bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none focus:border-[#002B5E]"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Consejeros Requeridos en Corte
                  </label>
                  <div className="space-y-1 max-h-28 overflow-y-auto bg-white p-2 rounded-xl border border-slate-200">
                    {personajes.map((p) => {
                      const pid = p._id || p.id;
                      const campoReq = tipoEdicion === 'evento' ? 'requisitos_personajes' : 'requisitos';
                      const marcado = (itemEnEdicion?.[campoReq] || []).includes(pid);
                      return (
                        <label key={pid} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={marcado}
                            onChange={(e) => {
                              const actuales = itemEnEdicion?.[campoReq] || [];
                              const nuevos = e.target.checked
                                ? [...actuales, pid]
                                : actuales.filter((x) => x !== pid);
                              setItemEnEdicion((prev) => ({ ...prev, [campoReq]: nuevos }));
                            }}
                            className="rounded text-[#002B5E] focus:ring-0"
                          />
                          <span>{p.nombre}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Lista de Nodos */}
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Nodos ({Object.keys(itemEnEdicion?.nodos || {}).length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAgregarNodo}
                    className="text-xs text-[#002B5E] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <PlusIcon size={13} />
                    <span>Agregar</span>
                  </button>
                </div>

                <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                  {Object.entries(itemEnEdicion?.nodos || {}).map(([nid, n]) => {
                    const esRaiz = nid === itemEnEdicion.nodo_raiz;
                    const seleccionado = nid === nodoSeleccionadoId;
                    return (
                      <div
                        key={nid}
                        onClick={() => setNodoSeleccionadoId(nid)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                          seleccionado
                            ? 'bg-[#002B5E] text-white border-[#002B5E] shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <span className="font-mono font-bold block truncate">{nid}</span>
                          <span className={`text-[10px] block truncate ${seleccionado ? 'text-slate-200' : 'text-slate-400'}`}>
                            {n.texto || 'Sin texto'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {esRaiz && (
                            <span className={`text-[8px] font-extrabold px-1.5 py-0.2 rounded ${seleccionado ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 text-amber-800'}`}>
                              RAÍZ
                            </span>
                          )}
                          {n.es_final && (
                            <span className={`text-[8px] font-extrabold px-1.5 py-0.2 rounded ${seleccionado ? 'bg-emerald-400 text-slate-900' : 'bg-emerald-100 text-emerald-800'}`}>
                              FINAL
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Panel Central: Editor del Nodo Activo */}
            <div className="flex-1 p-6 space-y-5">
              {nodoActual ? (
                <>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Nodo Seleccionado
                        </span>
                        <span className="text-base font-mono font-black text-[#002B5E]">
                          {nodoActual.id}
                        </span>
                      </div>
                      {nodoActual.id === itemEnEdicion.nodo_raiz && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-bold">
                          Punto de Entrada del Árbol
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {nodoActual.id !== itemEnEdicion.nodo_raiz && (
                        <button
                          type="button"
                          onClick={() => setItemEnEdicion((prev) => ({ ...prev, nodo_raiz: nodoActual.id }))}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                        >
                          Fijar como Raíz
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleEliminarNodo(nodoActual.id)}
                        className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <TrashIcon size={12} />
                        <span>Eliminar Nodo</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Hablante / Orador
                      </label>
                      <select
                        value={nodoActual.hablante_id || 'narrador'}
                        onChange={(e) => handleUpdateNodoActual('hablante_id', e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#002B5E]"
                      >
                        <option value="narrador">Narrador del Reino</option>
                        {personajes.map((p) => (
                          <option key={p._id || p.id} value={p._id || p.id}>
                            {p.nombre} ({p.rol || p.titulo || (p._id || p.id)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Naturaleza del Paso
                      </label>
                      <div className="flex items-center gap-4 pt-2">
                        <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="radio"
                            name="es_final_radio"
                            checked={!nodoActual.es_final}
                            onChange={() => handleUpdateNodoActual('es_final', false)}
                            className="text-[#002B5E]"
                          />
                          <span>Dilema con Decisiones</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="radio"
                            name="es_final_radio"
                            checked={!!nodoActual.es_final}
                            onChange={() => handleUpdateNodoActual('es_final', true)}
                            className="text-emerald-600"
                          />
                          <span className="font-bold text-emerald-700">Desenlace Final</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Texto del Diálogo o Narración
                    </label>
                    <textarea
                      rows={3}
                      value={nodoActual.texto || ''}
                      onChange={(e) => handleUpdateNodoActual('texto', e.target.value)}
                      placeholder="Planteamiento de la situación..."
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-[#002B5E]"
                    />
                  </div>

                  {!nodoActual.es_final ? (
                    /* OPCIONES */
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                          Opciones de Decisión para el Jugador
                        </span>
                        <button
                          type="button"
                          onClick={handleAgregarOpcion}
                          className="text-xs text-[#002B5E] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <PlusIcon size={14} />
                          <span>Agregar Opción</span>
                        </button>
                      </div>

                      <div className="space-y-3">
                        {(nodoActual.opciones || []).map((opt, idx) => (
                          <div
                            key={opt.id || idx}
                            className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-2.5"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-28">
                                <label className="text-[9px] text-slate-400 block font-mono">ID Opción</label>
                                <input
                                  type="text"
                                  value={opt.id || ''}
                                  onChange={(e) => handleUpdateOpcion(idx, 'id', e.target.value)}
                                  className="w-full text-xs font-mono bg-white border border-slate-200 rounded px-2 py-1 text-slate-800"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="text-[9px] text-slate-400 block">Texto Visible</label>
                                <input
                                  type="text"
                                  value={opt.texto || ''}
                                  onChange={(e) => handleUpdateOpcion(idx, 'texto', e.target.value)}
                                  placeholder="Botón visible para el jugador..."
                                  className="w-full text-xs bg-white border border-slate-200 rounded px-2 py-1 text-slate-800"
                                />
                              </div>
                              <div className="w-56">
                                <label className="text-[9px] text-[#002B5E] font-bold block flex items-center gap-1">
                                  <ChevronRightIcon size={10} />
                                  <span>Salta al Nodo</span>
                                </label>
                                <select
                                  value={opt.siguiente_nodo || ''}
                                  onChange={(e) => handleUpdateOpcion(idx, 'siguiente_nodo', e.target.value)}
                                  className="w-full text-xs bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 font-mono font-bold"
                                >
                                  {Object.keys(itemEnEdicion?.nodos || {}).map((targetId) => (
                                    <option key={targetId} value={targetId}>
                                      {targetId} {itemEnEdicion.nodos[targetId]?.es_final ? '(🏁 Final)' : ''}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleEliminarOpcion(idx)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition mt-3 cursor-pointer"
                                title="Eliminar opción"
                              >
                                <TrashIcon size={14} />
                              </button>
                            </div>

                            {/* Condiciones de Desbloqueo en Formulario */}
                            <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-600 flex items-center gap-1.5">
                                  <LockIcon size={13} className={opt.condiciones?.length > 0 ? "text-amber-600" : "text-slate-400"} />
                                  <span>Condiciones de Desbloqueo ({opt.condiciones?.length || 0})</span>
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-400 font-semibold">Si no cumple:</span>
                                  <select
                                    value={opt.bloqueo_modo || 'deshabilitada'}
                                    onChange={(e) => handleUpdateOpcion(idx, 'bloqueo_modo', e.target.value)}
                                    className="text-xs bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-700 font-bold"
                                  >
                                    <option value="deshabilitada">Candado visible</option>
                                    <option value="oculta">Oculta (Secreta)</option>
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => handleAgregarCondicionAOpcion(idx)}
                                    className="text-xs text-[#002B5E] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <PlusIcon size={12} />
                                    <span>Agregar Condición</span>
                                  </button>
                                </div>
                              </div>

                              {(opt.condiciones || []).map((cond, cIdx) => (
                                <div key={cIdx} className="p-2 bg-white rounded-xl border border-slate-200 flex flex-wrap items-center gap-2 text-xs">
                                  <select
                                    value={cond.tipo || 'comparar_recurso'}
                                    onChange={(e) => handleUpdateCondicionOpcion(idx, cIdx, 'tipo', e.target.value)}
                                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-700 text-xs"
                                  >
                                    <option value="comparar_recurso">Recurso Reino</option>
                                    <option value="afinidad_personaje">Afinidad Consejero</option>
                                    <option value="tiene_personaje">Consejero en Corte</option>
                                    <option value="tiene_tag">Tag / Atributo</option>
                                    <option value="tiene_carta">Carta / Objeto</option>
                                  </select>

                                  {cond.tipo === 'comparar_recurso' && (
                                    <>
                                      <select
                                        value={cond.clave || 'oro'}
                                        onChange={(e) => handleUpdateCondicionOpcion(idx, cIdx, 'clave', e.target.value)}
                                        className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-bold text-xs"
                                      >
                                        {RECURSOS_DISPONIBLES.map((r) => (
                                          <option key={r.id} value={r.id}>{r.label.split(' ')[0]}</option>
                                        ))}
                                      </select>
                                      <select
                                        value={cond.operador || '>='}
                                        onChange={(e) => handleUpdateCondicionOpcion(idx, cIdx, 'operador', e.target.value)}
                                        className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-mono font-bold text-xs"
                                      >
                                        <option value=">=">&gt;=</option>
                                        <option value="<=">&lt;=</option>
                                        <option value=">">&gt;</option>
                                        <option value="<">&lt;</option>
                                        <option value="==">==</option>
                                      </select>
                                      <input
                                        type="number"
                                        value={cond.valor ?? 30}
                                        onChange={(e) => handleUpdateCondicionOpcion(idx, cIdx, 'valor', e.target.value)}
                                        className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-mono text-center font-bold text-xs"
                                      />
                                    </>
                                  )}

                                  {cond.tipo === 'afinidad_personaje' && (
                                    <>
                                      <select
                                        value={cond.personaje_id || (personajes[0]?._id || personajes[0]?.id || '')}
                                        onChange={(e) => handleUpdateCondicionOpcion(idx, cIdx, 'personaje_id', e.target.value)}
                                        className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-bold text-xs truncate max-w-[120px]"
                                      >
                                        {personajes.map((p) => (
                                          <option key={p._id || p.id} value={p._id || p.id}>{p.nombre}</option>
                                        ))}
                                      </select>
                                      <select
                                        value={cond.operador || '>='}
                                        onChange={(e) => handleUpdateCondicionOpcion(idx, cIdx, 'operador', e.target.value)}
                                        className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-mono font-bold text-xs"
                                      >
                                        <option value=">=">&gt;=</option>
                                        <option value="<=">&lt;=</option>
                                      </select>
                                      <input
                                        type="number"
                                        value={cond.valor ?? 50}
                                        onChange={(e) => handleUpdateCondicionOpcion(idx, cIdx, 'valor', e.target.value)}
                                        className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-mono text-center font-bold text-xs"
                                      />
                                    </>
                                  )}

                                  {cond.tipo === 'tiene_personaje' && (
                                    <select
                                      value={cond.personaje_id || (personajes[0]?._id || personajes[0]?.id || '')}
                                      onChange={(e) => handleUpdateCondicionOpcion(idx, cIdx, 'personaje_id', e.target.value)}
                                      className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-bold text-xs truncate flex-1"
                                    >
                                      {personajes.map((p) => (
                                        <option key={p._id || p.id} value={p._id || p.id}>{p.nombre}</option>
                                      ))}
                                    </select>
                                  )}

                                  {cond.tipo === 'tiene_tag' && (
                                    <input
                                      type="text"
                                      placeholder="Tag temático..."
                                      value={cond.tag || ''}
                                      onChange={(e) => handleUpdateCondicionOpcion(idx, cIdx, 'tag', e.target.value)}
                                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-mono text-xs"
                                    />
                                  )}

                                  {cond.tipo === 'tiene_carta' && (
                                    <input
                                      type="text"
                                      placeholder="ID de la carta..."
                                      value={cond.carta_id || ''}
                                      onChange={(e) => handleUpdateCondicionOpcion(idx, cIdx, 'carta_id', e.target.value)}
                                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-mono text-xs"
                                    />
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleEliminarCondicionOpcion(idx, cIdx)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                    title="Eliminar condición"
                                  >
                                    <TrashIcon size={13} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* DESENLACE FINAL */
                    <div className="space-y-4 pt-2 border-t border-slate-200">
                      <div>
                        <label className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                          Texto de Resolución Final (resultado_texto)
                        </label>
                        <textarea
                          rows={2}
                          value={nodoActual.resultado_texto || ''}
                          onChange={(e) => handleUpdateNodoActual('resultado_texto', e.target.value)}
                          placeholder="Consecuencia al llegar a este desenlace..."
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-emerald-600"
                        />
                      </div>

                      {/* Impactos Recursos */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Impactos en Recursos (oro, pueblo, ejercito, fe)
                          </span>
                          <button
                            type="button"
                            onClick={handleAgregarImpactoRecurso}
                            className="text-xs text-emerald-700 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <PlusIcon size={13} />
                            <span>Agregar Impacto</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(nodoActual.impactos_recursos || []).map((imp, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2"
                            >
                              <select
                                value={imp.recurso}
                                onChange={(e) => handleUpdateImpactoRecurso(idx, 'recurso', e.target.value)}
                                className="flex-1 text-xs bg-white border border-slate-200 rounded px-2 py-1 text-slate-800"
                              >
                                {RECURSOS_DISPONIBLES.map((r) => (
                                  <option key={r.id} value={r.id}>{r.label}</option>
                                ))}
                              </select>
                              <input
                                type="number"
                                value={imp.delta}
                                onChange={(e) => handleUpdateImpactoRecurso(idx, 'delta', e.target.value)}
                                placeholder="Delta"
                                className="w-16 text-xs font-mono font-bold bg-white border border-slate-200 rounded px-2 py-1 text-center"
                              />
                              <button
                                type="button"
                                onClick={() => handleEliminarImpactoRecurso(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                              >
                                <TrashIcon size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Impactos Afinidad */}
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Impactos en Afinidad con Consejeros
                          </span>
                          <button
                            type="button"
                            onClick={handleAgregarImpactoAfinidad}
                            className="text-xs text-purple-700 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <PlusIcon size={13} />
                            <span>Agregar Afinidad</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(nodoActual.impactos_afinidad || []).map((imp, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2"
                            >
                              <select
                                value={imp.personaje_id}
                                onChange={(e) => handleUpdateImpactoAfinidad(idx, 'personaje_id', e.target.value)}
                                className="flex-1 text-xs bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 font-bold"
                              >
                                {personajes.map((p) => (
                                  <option key={p._id || p.id} value={p._id || p.id}>{p.nombre}</option>
                                ))}
                              </select>
                              <input
                                type="number"
                                value={imp.delta}
                                onChange={(e) => handleUpdateImpactoAfinidad(idx, 'delta', e.target.value)}
                                placeholder="Delta"
                                className="w-16 text-xs font-mono font-bold bg-white border border-slate-200 rounded px-2 py-1 text-purple-700 text-center"
                              />
                              <button
                                type="button"
                                onClick={() => handleEliminarImpactoAfinidad(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                              >
                                <TrashIcon size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-20 text-center text-slate-400 text-xs">
                  Selecciona un nodo del panel lateral para editar su árbol de decisiones.
                </div>
              )}
            </div>
          </div>
          )}
        </div>
      )}

      {/* Modal Simulador en Caliente */}
      {modoSimulador && itemEnEdicion && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <SparklesIcon size={18} className="text-amber-500" />
                <h3 className="text-sm font-black text-slate-900">
                  Simulador de Recorrido: {itemEnEdicion.titulo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModoSimulador(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <XIcon size={16} />
              </button>
            </div>

            {(() => {
              const n = itemEnEdicion.nodos[nodoSimulacionId];
              if (!n) return <div className="text-xs text-rose-600">Nodo destino no encontrado.</div>;
              const pjHablante = personajes.find((p) => (p._id || p.id) === n.hablante_id);
              return (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#002B5E]">
                        {pjHablante?.nombre || (n.hablante_id === 'narrador' ? 'Crónicas del Reino' : n.hablante_id)}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 font-bold">[{n.id}]</span>
                    </div>
                    <p className="text-sm text-slate-800 leading-relaxed font-serif">
                      {n.texto}
                    </p>
                  </div>

                  {n.es_final ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
                      <span className="text-xs font-black text-emerald-800 flex items-center gap-1">
                        🏁 ¡Desenlace final alcanzado!
                      </span>
                      <p className="text-xs text-slate-700 font-medium">{n.resultado_texto}</p>
                      <div className="pt-2 border-t border-emerald-200 flex flex-wrap gap-1.5">
                        {(n.impactos_recursos || []).map((imp, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                            {imp.recurso}: {imp.delta > 0 ? `+${imp.delta}` : imp.delta}
                          </span>
                        ))}
                        {(n.impactos_afinidad || []).map((imp, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold">
                            {imp.personaje_id}: {imp.delta > 0 ? `+${imp.delta}` : imp.delta}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Decisiones Disponibles:
                      </span>
                      {(n.opciones || []).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => elegirOpcionSimulada(opt)}
                          className="w-full text-left p-3 rounded-2xl bg-slate-50 hover:bg-[#002B5E] hover:text-white border border-slate-200 text-xs font-bold text-slate-800 transition flex items-center justify-between cursor-pointer group"
                        >
                          <span>{opt.texto}</span>
                          <span className="text-[10px] font-mono opacity-60 flex items-center gap-1">
                            → {opt.siguiente_nodo}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={iniciarSimulacion}
                      className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                    >
                      🔄 Reiniciar Simulación
                    </button>
                    <button
                      type="button"
                      onClick={() => setModoSimulador(false)}
                      className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
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
  );
}
