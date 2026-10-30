/* Permite editar eventos, opciones y resultados posibles. */
import { useState, useEffect } from 'react';
import {
  FileTextIcon,
  PlusIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
  AlertTriangleIcon,
  RefreshIcon,
  XIcon,
  FilterIcon,
  ChevronRightIcon,
  SparklesIcon,
  TagIcon,
  LockIcon,
} from '../Icons';
import ImageUploadField from './ImageUploadField';

// Permite editar eventos, opciones y resultados posibles.
export default function EventosTab({ universos = [], personajes = [] }) {
  const [eventos, setEventos] = useState([]);
  const [resultados, setResultados] = useState([]);
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
  const [descripcion, setDescripcion] = useState('');
  const [imagen, setImagen] = useState('');
  const [pesoBase, setPesoBase] = useState(100);
  const [tagsStr, setTagsStr] = useState('');
  const [opciones, setOpciones] = useState([]);

  // Cargar lista de eventos
  const cargarEventos = async (uId = universoFiltro) => {
    setCargando(true);
    setError('');
    try {
      const url = uId
        ? `/api/narrative/admin/eventos?universo_id=${encodeURIComponent(uId)}`
        : '/api/narrative/admin/eventos';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEventos(data);
      } else {
        setError('No se pudo cargar la lista de eventos.');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión al cargar eventos.');
    } finally {
      setCargando(false);
    }
  };

  // Cargar lista de resultados para los desplegables de desenlaces
  const cargarResultados = async () => {
    try {
      const res = await fetch('/api/narrative/admin/resultados');
      if (res.ok) {
        const data = await res.json();
        setResultados(data);
      }
    } catch (err) {
      console.error('Error al cargar resultados de referencia:', err);
    }
  };

  useEffect(/* Sincroniza este efecto cuando cambian los datos de los que depende. */ () => {
    cargarEventos(universoFiltro);
  }, [universoFiltro]);

  useEffect(/* Sincroniza este efecto cuando cambian los datos de los que depende. */ () => {
    cargarResultados();
  }, []);

  // Abre el formulario vacío para crear un registro.
  const abrirModalNuevo = () => {
    setEsEdicion(false);
    const newId = 'evt_' + Date.now().toString(36);
    setId(newId);
    const u = universoFiltro || universos[0]?._id || universos[0]?.id || 'corte_medieval';
    setUniversoId(u);
    setTitulo('');
    setDescripcion('');
    setImagen('/assets/narrative/eventos/default.webp');
    setPesoBase(100);
    setTagsStr('crisis, orden');

    // Plantilla inicial de 2 opciones estándar y 1 secreta
    const primerResId = resultados[0]?._id || resultados[0]?.id || 'res_resultado_1';
    const segundoResId = resultados[1]?._id || resultados[1]?.id || primerResId;

    setOpciones([
      {
        id: 'op_a',
        texto: 'Intervenir de manera directa y contundente',
        es_secreta: false,
        condiciones: [],
        resultados_posibles: [
          {
            resultado_id: primerResId,
            peso_base: 60,
            modificadores_probabilidad: [],
          },
          {
            resultado_id: segundoResId,
            peso_base: 40,
            modificadores_probabilidad: [],
          },
        ],
      },
      {
        id: 'op_b',
        texto: 'Negociar una solución prudente con las partes',
        es_secreta: false,
        condiciones: [],
        resultados_posibles: [
          {
            resultado_id: primerResId,
            peso_base: 50,
            modificadores_probabilidad: [],
          },
        ],
      },
      {
        id: 'op_c',
        texto: '[Secreto] Desplegar un recurso exclusivo o sello de la corona',
        es_secreta: true,
        condiciones: [
          {
            tipo: 'tiene_tag',
            clave: null,
            operador: null,
            valor: null,
            personaje_id: null,
            carta_id: null,
            tag: 'sello_real',
          },
        ],
        resultados_posibles: [
          {
            resultado_id: primerResId,
            peso_base: 100,
            modificadores_probabilidad: [],
          },
        ],
      },
    ]);

    setError('');
    setExito('');
    setModalAbierto(true);
  };

  // Carga el registro en el formulario de edición.
  const abrirModalEditar = (evt) => {
    setEsEdicion(true);
    setId(evt._id || evt.id);
    setUniversoId(evt.universo_id || '');
    setTitulo(evt.titulo || '');
    setDescripcion(evt.descripcion || '');
    setImagen(evt.imagen || '/assets/narrative/eventos/default.webp');
    setPesoBase(evt.peso_base ?? 100);
    setTagsStr((evt.tags_tematicos || []).join(', '));

    // Clonar opciones profundamente
    const opsClonadas = (evt.opciones || []).map(/* Prepara el resultado de cada elemento. */ (op) => ({
      id: op.id,
      texto: op.texto || '',
      es_secreta: !!op.es_secreta,
      condiciones: (op.condiciones || []).map(/* Prepara el resultado de cada elemento. */ (c) => ({ ...c })),
      resultados_posibles: (op.resultados_posibles || []).map(/* Prepara el resultado de cada elemento. */ (rp) => ({
        resultado_id: rp.resultado_id || '',
        peso_base: rp.peso_base ?? 50,
        modificadores_probabilidad: (rp.modificadores_probabilidad || []).map(/* Prepara el resultado de cada elemento. */ (m) => ({
          delta_peso: m.delta_peso ?? 0,
          explicacion: m.explicacion || '',
          condicion: { ...(m.condicion || {}) },
        })),
      })),
    }));

    setOpciones(opsClonadas);
    setError('');
    setExito('');
    setModalAbierto(true);
  };

  // Manejo de Opciones
  const agregarOpcion = () => {
    const letra = String.fromCharCode(97 + opciones.length); // a, b, c, d...
    const primerResId = resultados[0]?._id || resultados[0]?.id || 'res_resultado_1';
    setOpciones([
      ...opciones,
      {
        id: `op_${letra}`,
        texto: '',
        es_secreta: false,
        condiciones: [],
        resultados_posibles: [
          {
            resultado_id: primerResId,
            peso_base: 50,
            modificadores_probabilidad: [],
          },
        ],
      },
    ]);
  };

  // Quita opcion con los datos de este paso.
  const eliminarOpcion = (idx) => {
    setOpciones(opciones.filter(/* Conserva los elementos que cumplen esta condición. */ (_, i) => i !== idx));
  };

  // Actualiza opcion con los datos de este paso.
  const actualizarOpcion = (idx, campo, valor) => {
    setOpciones(/* Actualiza opciones a partir del valor anterior. */ (prev) =>
      prev.map(/* Prepara el resultado de cada elemento. */ (op, i) => (i === idx ? { ...op, [campo]: valor } : op))
    );
  };

  // Manejo de Resultados dentro de una Opción
  const agregarResultadoPosible = (opIdx) => {
    const primerResId = resultados[0]?._id || resultados[0]?.id || 'res_resultado_1';
    setOpciones(/* Actualiza opciones a partir del valor anterior. */ (prev) =>
      prev.map(/* Prepara el resultado de cada elemento. */ (op, i) => {
        if (i !== opIdx) return op;
        return {
          ...op,
          resultados_posibles: [
            ...op.resultados_posibles,
            {
              resultado_id: primerResId,
              peso_base: 50,
              modificadores_probabilidad: [],
            },
          ],
        };
      })
    );
  };

  // Quita resultado posible con los datos de este paso.
  const eliminarResultadoPosible = (opIdx, resIdx) => {
    setOpciones(/* Actualiza opciones a partir del valor anterior. */ (prev) =>
      prev.map(/* Prepara el resultado de cada elemento. */ (op, i) => {
        if (i !== opIdx) return op;
        return {
          ...op,
          resultados_posibles: op.resultados_posibles.filter(/* Conserva los elementos que cumplen esta condición. */ (_, ri) => ri !== resIdx),
        };
      })
    );
  };

  // Actualiza resultado posible con los datos de este paso.
  const actualizarResultadoPosible = (opIdx, resIdx, campo, valor) => {
    setOpciones(/* Actualiza opciones a partir del valor anterior. */ (prev) =>
      prev.map(/* Prepara el resultado de cada elemento. */ (op, i) => {
        if (i !== opIdx) return op;
        const nuevosResultados = op.resultados_posibles.map(/* Prepara el resultado de cada elemento. */ (rp, ri) =>
          ri === resIdx ? { ...rp, [campo]: valor } : rp
        );
        return { ...op, resultados_posibles: nuevosResultados };
      })
    );
  };

  // Manejo de Modificadores de Probabilidad dentro de un Resultado Posible
  const agregarModificador = (opIdx, resIdx) => {
    setOpciones(/* Actualiza opciones a partir del valor anterior. */ (prev) =>
      prev.map(/* Prepara el resultado de cada elemento. */ (op, i) => {
        if (i !== opIdx) return op;
        const nuevosResultados = op.resultados_posibles.map(/* Prepara el resultado de cada elemento. */ (rp, ri) => {
          if (ri !== resIdx) return rp;
          return {
            ...rp,
            modificadores_probabilidad: [
              ...rp.modificadores_probabilidad,
              {
                delta_peso: 25,
                explicacion: '+25% por apoyo en la corte',
                condicion: {
                  tipo: 'tiene_personaje',
                  clave: null,
                  operador: null,
                  valor: null,
                  personaje_id: personajes[0]?._id || personajes[0]?.id || '',
                  carta_id: null,
                  tag: null,
                },
              },
            ],
          };
        });
        return { ...op, resultados_posibles: nuevosResultados };
      })
    );
  };

  // Quita modificador con los datos de este paso.
  const eliminarModificador = (opIdx, resIdx, modIdx) => {
    setOpciones(/* Actualiza opciones a partir del valor anterior. */ (prev) =>
      prev.map(/* Prepara el resultado de cada elemento. */ (op, i) => {
        if (i !== opIdx) return op;
        const nuevosResultados = op.resultados_posibles.map(/* Prepara el resultado de cada elemento. */ (rp, ri) => {
          if (ri !== resIdx) return rp;
          return {
            ...rp,
            modificadores_probabilidad: rp.modificadores_probabilidad.filter(
              // Conserva los elementos que cumplen esta condición.
              (_, mi) => mi !== modIdx
            ),
          };
        });
        return { ...op, resultados_posibles: nuevosResultados };
      })
    );
  };

  // Actualiza modificador con los datos de este paso.
  const actualizarModificador = (opIdx, resIdx, modIdx, campo, valor) => {
    setOpciones(/* Actualiza opciones a partir del valor anterior. */ (prev) =>
      prev.map(/* Prepara el resultado de cada elemento. */ (op, i) => {
        if (i !== opIdx) return op;
        const nuevosResultados = op.resultados_posibles.map(/* Prepara el resultado de cada elemento. */ (rp, ri) => {
          if (ri !== resIdx) return rp;
          const nuevosMods = rp.modificadores_probabilidad.map(/* Prepara el resultado de cada elemento. */ (mod, mi) => {
            if (mi !== modIdx) return mod;
            if (campo === 'condicion') {
              return { ...mod, condicion: { ...mod.condicion, ...valor } };
            }
            return { ...mod, [campo]: valor };
          });
          return { ...rp, modificadores_probabilidad: nuevosMods };
        });
        return { ...op, resultados_posibles: nuevosResultados };
      })
    );
  };

  // Guardar Evento
  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!id.trim() || !titulo.trim() || !descripcion.trim()) {
      setError('Por favor complete el ID, título y descripción del evento.');
      return;
    }

    if (opciones.length === 0) {
      setError('Debe incluir al menos una opción de decisión para el evento.');
      return;
    }

    // Verificar que todas las opciones tengan al menos 1 resultado
    for (let i = 0; i < opciones.length; i++) {
      if (!opciones[i].texto.trim()) {
        setError(`El texto de la opción ${i + 1} (${opciones[i].id}) no puede estar vacío.`);
        return;
      }
      if (opciones[i].resultados_posibles.length === 0) {
        setError(`La opción ${opciones[i].id} debe tener al menos un desenlace posible asignado.`);
        return;
      }
    }

    setGuardando(true);
    setError('');

    const tagsArray = tagsStr
      .split(',')
      .map(/* Prepara el resultado de cada elemento. */ (t) => t.trim())
      .filter(Boolean);

    const payload = {
      _id: id.trim(),
      universo_id: universoId,
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      imagen: imagen.trim() || '/assets/narrative/eventos/default.webp',
      tags_tematicos: tagsArray,
      peso_base: parseFloat(pesoBase) || 100,
      opciones: opciones,
    };

    try {
      const res = await fetch('/api/narrative/admin/eventos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setExito(`Evento "${titulo}" guardado exitosamente.`);
        setModalAbierto(false);
        cargarEventos(universoFiltro);
      } else {
        const errData = await res.json().catch(/* Maneja el fallo de esta operación. */ () => ({}));
        setError(errData.detail || 'Error al guardar el evento.');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión con el servidor.');
    } finally {
      setGuardando(false);
    }
  };

  // Eliminar Evento
  const handleEliminar = async (evtId, evtTitulo) => {
    if (!window.confirm(`¿Está seguro de eliminar el evento "${evtTitulo}" (${evtId})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/narrative/admin/eventos/${encodeURIComponent(evtId)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setExito(`Evento "${evtTitulo}" eliminado.`);
        cargarEventos(universoFiltro);
      } else {
        const errData = await res.json().catch(/* Maneja el fallo de esta operación. */ () => ({}));
        setError(errData.detail || 'Error al eliminar el evento.');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión al eliminar evento.');
    }
  };

  // Filtrado en memoria por búsqueda
  const eventosFiltrados = eventos.filter(/* Conserva los elementos que cumplen esta condición. */ (evt) => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    const enTitulo = (evt.titulo || '').toLowerCase().includes(q);
    const enDesc = (evt.descripcion || '').toLowerCase().includes(q);
    const enId = (evt._id || evt.id || '').toLowerCase().includes(q);
    const enTags = (evt.tags_tematicos || []).some(/* Comprueba si algún elemento cumple esta condición. */ (t) => t.toLowerCase().includes(q));
    return enTitulo || enDesc || enId || enTags;
  });

  // Mapa de resultados para mostrar nombres en tarjetas
  const mapaResultados = resultados.reduce(/* Acumula los valores en un solo resultado. */ (acc, r) => {
    acc[r._id || r.id] = r;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Barra Superior con Controles */}
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
              placeholder="Buscar por título, tag o ID..."
              value={busqueda}
              onChange={/* Responde a change desde este control. */ (e) => setBusqueda(e.target.value)}
              className="text-xs w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 font-medium text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#002B5E]/20"
            />
          </div>

          <button
            type="button"
            onClick={/* Responde a click desde este control. */ () => {
              cargarEventos(universoFiltro);
              cargarResultados();
            }}
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
          <span>Crear Evento Mensual</span>
        </button>
      </div>

      {/* Alertas de Éxito / Error */}
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

      {/* Listado de Eventos */}
      {cargando ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center text-slate-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-[#002B5E] mb-3" />
          <p className="text-xs font-semibold">Cargando catálogo de eventos...</p>
        </div>
      ) : eventosFiltrados.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center text-slate-400">
          <FileTextIcon size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No se encontraron eventos</p>
          <p className="text-xs text-slate-400 mt-1">
            {busqueda
              ? 'Prueba modificando los filtros de búsqueda.'
              : 'Empieza creando el primer evento narrativo para este universo.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {eventosFiltrados.map(/* Prepara el resultado de cada elemento. */ (evt) => {
            const numOpciones = (evt.opciones || []).length;
            const tieneSecreta = (evt.opciones || []).some(/* Comprueba si algún elemento cumple esta condición. */ (o) => o.es_secreta);

            return (
              <div
                key={evt._id || evt.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Imagen y badges de cabecera */}
                  <div className="relative h-36 bg-slate-900 overflow-hidden flex items-center justify-center">
                    <img
                      src={evt.imagen || '/assets/narrative/eventos/default.webp'}
                      alt={evt.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-90"
                      onError={/* Responde a error desde este control. */ (e) => {
                        e.target.onerror = null;
                        e.target.src = '/assets/narrative/eventos/default.webp';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />

                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/20">
                        {evt.universo_id}
                      </span>
                      <span className="text-[10px] font-bold bg-[#002B5E]/90 text-white backdrop-blur-xs px-2 py-0.5 rounded-md border border-white/20">
                        ⚖️ Peso: {evt.peso_base ?? 100}
                      </span>
                    </div>

                    <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-white text-[11px] font-semibold">
                      <span className="truncate pr-2">ID: {evt._id || evt.id}</span>
                      {tieneSecreta && (
                        <span className="inline-flex items-center gap-1 bg-amber-500/90 text-amber-950 font-bold px-2 py-0.5 rounded-full text-[10px]">
                          <LockIcon size={11} /> Secreta
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cuerpo de la tarjeta */}
                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 group-hover:text-[#002B5E] transition">
                        {evt.titulo}
                      </h3>
                      <p className="text-xs text-slate-600 font-medium line-clamp-2 mt-1 leading-relaxed">
                        {evt.descripcion}
                      </p>
                    </div>

                    {/* Tags Temáticos */}
                    {(evt.tags_tematicos || []).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {evt.tags_tematicos.map(/* Prepara el resultado de cada elemento. */ (tag, tidx) => (
                          <span
                            key={tidx}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200"
                          >
                            <TagIcon size={10} className="text-slate-400" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Resumen de Opciones */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                        <span>{numOpciones} Decisiones Posibles</span>
                      </div>

                      <div className="space-y-1.5">
                        {(evt.opciones || []).map(/* Prepara el resultado de cada elemento. */ (op, oidx) => {
                          const resPosiblesCount = (op.resultados_posibles || []).length;
                          return (
                            <div
                              key={oidx}
                              className={`p-2 rounded-xl text-xs flex items-start justify-between gap-2 border ${
                                op.es_secreta
                                  ? 'bg-amber-50/70 border-amber-200/70 text-amber-900'
                                  : 'bg-slate-50 border-slate-200/70 text-slate-700'
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="font-black text-[10px] uppercase tracking-wider text-slate-500">
                                    {op.id}:
                                  </span>
                                  {op.es_secreta && (
                                    <span className="text-[9px] font-extrabold uppercase bg-amber-200 text-amber-900 px-1 rounded">
                                      Secreta
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] font-medium truncate text-slate-700">
                                  {op.texto}
                                </p>
                              </div>
                              <span className="text-[10px] font-semibold text-slate-400 whitespace-nowrap bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                {resPosiblesCount} {resPosiblesCount === 1 ? 'resultado' : 'resultados'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pie con Acciones */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {numOpciones} {numOpciones === 1 ? 'opción configurada' : 'opciones configuradas'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={/* Responde a click desde este control. */ () => abrirModalEditar(evt)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition cursor-pointer"
                    >
                      <EditIcon size={13} />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={/* Responde a click desde este control. */ () => handleEliminar(evt._id || evt.id, evt.titulo)}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
                      title="Eliminar evento"
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
      {/* MODAL CREAR / EDITAR EVENTO                                               */}
      {/* ========================================================================= */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Cabecera Modal */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#002B5E] text-white flex items-center justify-center">
                  <FileTextIcon size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {esEdicion ? 'Editar Evento Mensual' : 'Nuevo Evento Mensual'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Configura el dilema del mes, opciones de respuesta y probabilidades de desenlace
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

            {/* Formulario Scrolleable */}
            <form onSubmit={handleGuardar} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Sección 1: Datos Básicos */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  1. Información General del Evento
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Identificador Único (ID) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={esEdicion}
                      value={id}
                      onChange={/* Responde a change desde este control. */ (e) => setId(e.target.value)}
                      placeholder="evt_crisis_sequia"
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
                          {u.nombre} ({u._id || u.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Peso Base de Sorteo
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={pesoBase}
                      onChange={/* Responde a change desde este control. */ (e) => setPesoBase(Number(e.target.value))}
                      className="text-xs w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:ring-2 focus:ring-[#002B5E]/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Título del Evento <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={titulo}
                    onChange={/* Responde a change desde este control. */ (e) => setTitulo(e.target.value)}
                    placeholder="Ej: La Gran Helada en el Valle"
                    className="text-xs w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:ring-2 focus:ring-[#002B5E]/20"
                  />
                </div>

                <ImageUploadField
                  label="Ilustración del Evento Mensual"
                  categoria="eventos"
                  value={imagen}
                  onChange={setImagen}
                  helperText="Ilustración del evento. Proporción panorámica recomendada (900x500 px)."
                />

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Descripción Narrativa de la Situación <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={descripcion}
                    onChange={/* Responde a change desde este control. */ (e) => setDescripcion(e.target.value)}
                    placeholder="Describe el dilema o problema que enfrenta el reino..."
                    className="text-xs w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-slate-800 focus:ring-2 focus:ring-[#002B5E]/20 leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tags Temáticos (separados por coma)
                  </label>
                  <input
                    type="text"
                    value={tagsStr}
                    onChange={/* Responde a change desde este control. */ (e) => setTagsStr(e.target.value)}
                    placeholder="clima, comida, crisis, pueblo"
                    className="text-xs w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:ring-2 focus:ring-[#002B5E]/20"
                  />
                </div>
              </div>

              {/* Sección 2: Opciones de Decisión y Probabilidades */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                      2. Opciones de Decisión del Jugador
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Cada opción tiene texto propio y desenlaces con pesos ponderados
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={agregarOpcion}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                  >
                    <PlusIcon size={14} />
                    <span>Agregar Opción</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {opciones.map(/* Prepara el resultado de cada elemento. */ (op, opIdx) => (
                    <div
                      key={opIdx}
                      className={`p-4 rounded-2xl border ${
                        op.es_secreta
                          ? 'bg-amber-50/50 border-amber-200'
                          : 'bg-slate-50/70 border-slate-200'
                      } space-y-3`}
                    >
                      {/* Cabecera de la Opción */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={op.id}
                            onChange={/* Responde a change desde este control. */ (e) => actualizarOpcion(opIdx, 'id', e.target.value)}
                            placeholder="op_a"
                            className="text-xs w-20 font-black uppercase tracking-wider bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700"
                          />
                          <label className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100/70 px-2 py-1 rounded-lg border border-amber-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={op.es_secreta}
                              onChange={/* Responde a change desde este control. */ (e) => actualizarOpcion(opIdx, 'es_secreta', e.target.checked)}
                              className="rounded text-amber-600 focus:ring-0 cursor-pointer"
                            />
                            <span>Opción Secreta</span>
                          </label>
                        </div>

                        <button
                          type="button"
                          onClick={/* Responde a click desde este control. */ () => eliminarOpcion(opIdx)}
                          className="p-1 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-100/60 transition cursor-pointer"
                          title="Eliminar esta opción"
                        >
                          <TrashIcon size={14} />
                        </button>
                      </div>

                      {/* Texto de la Opción */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Texto que ve el jugador en la carta de decisión:
                        </label>
                        <input
                          type="text"
                          value={op.texto}
                          onChange={/* Responde a change desde este control. */ (e) => actualizarOpcion(opIdx, 'texto', e.target.value)}
                          placeholder="Ej: Racionar graneros y custodiar los caminos con la guardia"
                          className="text-xs w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:ring-2 focus:ring-[#002B5E]/20"
                        />
                      </div>

                      {/* Si es secreta, configurar condición de desbloqueo */}
                      {op.es_secreta && (
                        <div className="p-3 bg-amber-100/50 border border-amber-200/80 rounded-xl space-y-2">
                          <span className="text-[11px] font-extrabold uppercase text-amber-900 flex items-center gap-1">
                            <LockIcon size={12} /> Condición para Desbloquear esta opción:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <select
                              value={op.condiciones?.[0]?.tipo || 'tiene_tag'}
                              onChange={/* Responde a change desde este control. */ (e) => {
                                const nuevoTipo = e.target.value;
                                const cond = {
                                  tipo: nuevoTipo,
                                  clave: null,
                                  operador: null,
                                  valor: null,
                                  personaje_id: null,
                                  carta_id: null,
                                  tag: nuevoTipo === 'tiene_tag' ? 'sello_real' : null,
                                };
                                actualizarOpcion(opIdx, 'condiciones', [cond]);
                              }}
                              className="text-xs bg-white border border-amber-300 rounded-lg px-2 py-1.5 font-medium text-slate-700"
                            >
                              <option value="tiene_tag">Posee Tag Pasivo</option>
                              <option value="tiene_personaje">Tiene Personaje en Corte</option>
                            </select>

                            {op.condiciones?.[0]?.tipo === 'tiene_personaje' ? (
                              <select
                                value={op.condiciones?.[0]?.personaje_id || ''}
                                onChange={/* Responde a change desde este control. */ (e) => {
                                  const c = { ...(op.condiciones?.[0] || {}) };
                                  c.personaje_id = e.target.value;
                                  actualizarOpcion(opIdx, 'condiciones', [c]);
                                }}
                                className="text-xs bg-white border border-amber-300 rounded-lg px-2 py-1.5 font-medium text-slate-700 sm:col-span-2"
                              >
                                <option value="">Seleccionar Personaje Requerido...</option>
                                {personajes.map(/* Prepara el resultado de cada elemento. */ (pj) => (
                                  <option key={pj._id || pj.id} value={pj._id || pj.id}>
                                    {pj.nombre} ({pj.titulo})
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                placeholder="Tag requerido (ej: sello_real, medicina_hierbas)"
                                value={op.condiciones?.[0]?.tag || ''}
                                onChange={/* Responde a change desde este control. */ (e) => {
                                  const c = { ...(op.condiciones?.[0] || {}) };
                                  c.tag = e.target.value;
                                  actualizarOpcion(opIdx, 'condiciones', [c]);
                                }}
                                className="text-xs bg-white border border-amber-300 rounded-lg px-2 py-1.5 font-medium text-slate-700 sm:col-span-2"
                              />
                            )}
                          </div>
                        </div>
                      )}

                      {/* Desenlaces Posibles (Resultados) */}
                      <div className="pt-2 border-t border-slate-200/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-600">
                            Desenlaces Posibles ({op.resultados_posibles.length}):
                          </span>
                          <button
                            type="button"
                            onClick={/* Responde a click desde este control. */ () => agregarResultadoPosible(opIdx)}
                            className="text-[11px] font-bold text-[#002B5E] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <PlusIcon size={12} />
                            <span>Vincular Desenlace</span>
                          </button>
                        </div>

                        <div className="space-y-2">
                          {op.resultados_posibles.map(/* Prepara el resultado de cada elemento. */ (rp, resIdx) => {
                            const resObj = mapaResultados[rp.resultado_id];
                            return (
                              <div
                                key={resIdx}
                                className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2"
                              >
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                                  {/* Selector de Resultado */}
                                  <div className="sm:col-span-8">
                                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                                      Desenlace Asignado:
                                    </label>
                                    <select
                                      value={rp.resultado_id}
                                      onChange={/* Responde a change desde este control. */ (e) =>
                                        actualizarResultadoPosible(
                                          opIdx,
                                          resIdx,
                                          'resultado_id',
                                          e.target.value
                                        )
                                      }
                                      className="text-xs w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 font-bold text-slate-800"
                                    >
                                      {resultados.map(/* Prepara el resultado de cada elemento. */ (r) => (
                                        <option key={r._id || r.id} value={r._id || r.id}>
                                          {r.titulo} [{r.tipo_resultado?.toUpperCase()}] (
                                          {r._id || r.id})
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Peso Base */}
                                  <div className="sm:col-span-3">
                                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                                      Peso Base:
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      max="500"
                                      value={rp.peso_base}
                                      onChange={/* Responde a change desde este control. */ (e) =>
                                        actualizarResultadoPosible(
                                          opIdx,
                                          resIdx,
                                          'peso_base',
                                          Number(e.target.value)
                                        )
                                      }
                                      className="text-xs w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 font-bold text-slate-800 text-center"
                                    />
                                  </div>

                                  {/* Botón Eliminar Desenlace */}
                                  <div className="sm:col-span-1 flex justify-end">
                                    <button
                                      type="button"
                                      onClick={/* Responde a click desde este control. */ () => eliminarResultadoPosible(opIdx, resIdx)}
                                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                      title="Desvincular resultado"
                                    >
                                      <TrashIcon size={13} />
                                    </button>
                                  </div>
                                </div>

                                {/* Modificadores de Probabilidad */}
                                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                      Modificadores de Probabilidad (Tags / Personajes)
                                    </span>
                                    <button
                                      type="button"
                                      onClick={/* Responde a click desde este control. */ () => agregarModificador(opIdx, resIdx)}
                                      className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                                    >
                                      + Modificador
                                    </button>
                                  </div>

                                  {rp.modificadores_probabilidad.length === 0 ? (
                                    <p className="text-[10px] text-slate-400 italic">
                                      Sin modificadores condicionales (peso fijo: {rp.peso_base}).
                                    </p>
                                  ) : (
                                    <div className="space-y-1.5">
                                      {rp.modificadores_probabilidad.map(/* Prepara el resultado de cada elemento. */ (mod, modIdx) => (
                                        <div
                                          key={modIdx}
                                          className="p-2 rounded-lg bg-indigo-50/60 border border-indigo-100 flex flex-wrap items-center gap-2 text-xs"
                                        >
                                          {/* Tipo de Condición */}
                                          <select
                                            value={mod.condicion?.tipo || 'tiene_personaje'}
                                            onChange={/* Responde a change desde este control. */ (e) => {
                                              const nuevoTipo = e.target.value;
                                              actualizarModificador(
                                                opIdx,
                                                resIdx,
                                                modIdx,
                                                'condicion',
                                                {
                                                  tipo: nuevoTipo,
                                                  personaje_id:
                                                    nuevoTipo === 'tiene_personaje'
                                                      ? personajes[0]?._id || personajes[0]?.id || ''
                                                      : null,
                                                  tag: nuevoTipo === 'tiene_tag' ? 'logistica' : null,
                                                }
                                              );
                                            }}
                                            className="text-[11px] bg-white border border-indigo-200 rounded px-1.5 py-1 font-medium"
                                          >
                                            <option value="tiene_personaje">Si tiene Personaje</option>
                                            <option value="tiene_tag">Si tiene Tag Pasivo</option>
                                          </select>

                                          {/* Valor de la Condición */}
                                          {mod.condicion?.tipo === 'tiene_personaje' ? (
                                            <select
                                              value={mod.condicion?.personaje_id || ''}
                                              onChange={/* Responde a change desde este control. */ (e) =>
                                                actualizarModificador(
                                                  opIdx,
                                                  resIdx,
                                                  modIdx,
                                                  'condicion',
                                                  { personaje_id: e.target.value }
                                                )
                                              }
                                              className="text-[11px] bg-white border border-indigo-200 rounded px-1.5 py-1 font-medium flex-1 min-w-[140px]"
                                            >
                                              {personajes.map(/* Prepara el resultado de cada elemento. */ (pj) => (
                                                <option key={pj._id || pj.id} value={pj._id || pj.id}>
                                                  {pj.nombre}
                                                </option>
                                              ))}
                                            </select>
                                          ) : (
                                            <input
                                              type="text"
                                              placeholder="Tag pasivo (ej: logistica)"
                                              value={mod.condicion?.tag || ''}
                                              onChange={/* Responde a change desde este control. */ (e) =>
                                                actualizarModificador(
                                                  opIdx,
                                                  resIdx,
                                                  modIdx,
                                                  'condicion',
                                                  { tag: e.target.value }
                                                )
                                              }
                                              className="text-[11px] bg-white border border-indigo-200 rounded px-1.5 py-1 font-medium flex-1 min-w-[120px]"
                                            />
                                          )}

                                          {/* Delta Peso */}
                                          <div className="flex items-center gap-1">
                                            <span className="text-[10px] font-bold text-indigo-900">
                                              Δ Peso:
                                            </span>
                                            <input
                                              type="number"
                                              value={mod.delta_peso}
                                              onChange={/* Responde a change desde este control. */ (e) =>
                                                actualizarModificador(
                                                  opIdx,
                                                  resIdx,
                                                  modIdx,
                                                  'delta_peso',
                                                  Number(e.target.value)
                                                )
                                              }
                                              className="w-14 text-[11px] text-center font-bold bg-white border border-indigo-200 rounded px-1 py-1"
                                            />
                                          </div>

                                          {/* Explicación */}
                                          <input
                                            type="text"
                                            placeholder="Explicación (ej: +35% por liderazgo)"
                                            value={mod.explicacion}
                                            onChange={/* Responde a change desde este control. */ (e) =>
                                              actualizarModificador(
                                                opIdx,
                                                resIdx,
                                                modIdx,
                                                'explicacion',
                                                e.target.value
                                              )
                                            }
                                            className="text-[11px] bg-white border border-indigo-200 rounded px-1.5 py-1 font-medium flex-1 min-w-[150px]"
                                          />

                                          <button
                                            type="button"
                                            onClick={/* Responde a click desde este control. */ () =>
                                              eliminarModificador(opIdx, resIdx, modIdx)
                                            }
                                            className="text-rose-500 hover:text-rose-700 p-1"
                                          >
                                            <XIcon size={12} />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botones de Acción Modal */}
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
                  <span>{guardando ? 'Guardando...' : 'Guardar Evento'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
