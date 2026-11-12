/* Editor reutilizable de efectos con acciones y frecuencias dinámicas desde Mongo. */
import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, SparklesIcon, ClockIcon, AlertTriangleIcon } from '../Icons';

export default function EfectosEditor({
  efectos = [],
  onChange,
  universoId = 'corte_medieval',
  tipoEntidad = 'carta',
  recursosDisponibles: recursosProps = null,
}) {
  const [catalogoAcciones, setCatalogoAcciones] = useState([]);
  const [catalogoFrecuencias, setCatalogoFrecuencias] = useState([]);
  const [catalogoPersonajes, setCatalogoPersonajes] = useState([]);
  const [recursosDinamicos, setRecursosDinamicos] = useState(recursosProps || ['oro', 'pueblo', 'ejercito', 'fe']);
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState('');

  useEffect(() => {
    let activo = true;
    const cargarDatos = async () => {
      setCargando(true);
      setErrorCarga('');
      try {
        const [resAcc, resFrec, resUniv, resPjs] = await Promise.all([
          fetch(`/api/narrative/admin/acciones?universo_id=${encodeURIComponent(universoId)}`),
          fetch(`/api/narrative/admin/frecuencias?universo_id=${encodeURIComponent(universoId)}`),
          fetch(`/api/narrative/admin/universos/${encodeURIComponent(universoId)}`),
          fetch(`/api/narrative/admin/personajes?universo_id=${encodeURIComponent(universoId)}`),
        ]);

        if (activo) {
          if (resAcc.ok) {
            const dataAcc = await resAcc.json();
            setCatalogoAcciones(dataAcc);
          } else {
            console.warn('No se pudo cargar el catálogo de acciones para el universo', universoId);
          }

          if (resFrec.ok) {
            const dataFrec = await resFrec.json();
            setCatalogoFrecuencias(dataFrec.items || []);
          } else {
            console.warn('No se pudo cargar el catálogo de frecuencias para el universo', universoId);
          }

          if (resUniv.ok) {
            const dataUniv = await resUniv.json();
            if (dataUniv.recursos && Array.isArray(dataUniv.recursos)) {
              setRecursosDinamicos(dataUniv.recursos.map((r) => r.clave));
            }
          }

          if (resPjs.ok) {
            const dataPjs = await resPjs.json();
            setCatalogoPersonajes(dataPjs || []);
          }
        }
      } catch (err) {
        console.error('Error al cargar catálogos dinámicos en EfectosEditor:', err);
        if (activo) setErrorCarga('No se pudieron consultar los catálogos en vivo.');
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargarDatos();
    return () => {
      activo = false;
    };
  }, [universoId]);

  // Filtrar acciones aplicables según tipo de entidad
  const accionesFiltradas = catalogoAcciones.filter((acc) => {
    if (!acc.activo) return false;
    if (!acc.permitido_en || acc.permitido_en.length === 0) return true;
    return acc.permitido_en.includes(tipoEntidad) || acc.permitido_en.includes('ambos');
  });

  const descomponerRuta = (ruta) => {
    if (!ruta) return { tipo: 'recurso', clave: recursosDinamicos[0] || 'oro' };
    if (ruta.startsWith('limites.')) {
      const parts = ruta.split('.');
      const rec = parts[1] || recursosDinamicos[0] || 'oro';
      const sub = parts[2] || 'max';
      return { tipo: sub === 'min' ? 'limite_min' : 'limite_max', clave: rec };
    }
    if (ruta.startsWith('recursos.')) {
      return { tipo: 'recurso', clave: ruta.split('.')[1] || recursosDinamicos[0] || 'oro' };
    }
    if (ruta.startsWith('afinidad.')) {
      return { tipo: 'afinidad', clave: ruta.split('.')[1] || 'portador' };
    }
    if (ruta.startsWith('variables.')) {
      return { tipo: 'variable', clave: ruta.split('.')[1] || '' };
    }
    if (recursosDinamicos.includes(ruta)) {
      return { tipo: 'recurso', clave: ruta };
    }
    return { tipo: 'manual', clave: ruta };
  };

  const componerRuta = (tipo, clave) => {
    if (tipo === 'recurso') return `recursos.${clave || recursosDinamicos[0] || 'oro'}`;
    if (tipo === 'limite_max') return `limites.${clave || recursosDinamicos[0] || 'oro'}.max`;
    if (tipo === 'limite_min') return `limites.${clave || recursosDinamicos[0] || 'oro'}.min`;
    if (tipo === 'afinidad') return `afinidad.${clave || 'portador'}`;
    if (tipo === 'variable') return `variables.${clave || 'variable'}`;
    return clave || '';
  };

  // Normalizar un efecto recibido (soporta formato legacy y nuevo)
  const normalizarEfecto = (ef) => {
    const frecId = ef.frecuencia_id || ef.disparador || 'al_obtener';
    let acciones = [];
    if (ef.acciones && ef.acciones.length > 0) {
      acciones = ef.acciones.map((a) => ({
        accion_id: a.accion_id || 'modificar_recurso',
        parametros: {
          clave: a.parametros?.clave || recursosDinamicos[0] || 'oro',
          ruta: a.parametros?.ruta || '',
          operacion_matematica: a.parametros?.operacion_matematica || 'sumar',
          valor: a.parametros?.valor ?? 10,
          tipo_calculo: a.parametros?.tipo_calculo || 'fijo',
          destino: a.parametros?.destino || (tipoEntidad === 'personaje' ? 'portador' : 'personaje'),
          personaje_id: a.parametros?.personaje_id || null,
          tag: a.parametros?.tag || '',
        },
      }));
    } else if (ef.accion) {
      acciones = [
        {
          accion_id: ef.accion.tipo || 'modificar_recurso',
          parametros: {
            clave: ef.accion.clave || recursosDinamicos[0] || 'oro',
            valor: ef.accion.valor ?? 10,
            tipo_calculo: ef.accion.tipo_calculo || 'fijo',
            destino: tipoEntidad === 'personaje' ? 'portador' : 'personaje',
            personaje_id: ef.accion.personaje_id || null,
            tag: ef.accion.tag || '',
          },
        },
      ];
    } else {
      acciones = [
        {
          accion_id: accionesFiltradas[0]?.id || accionesFiltradas[0]?._id || 'modificar_recurso',
          parametros: { clave: recursosDinamicos[0] || 'oro', valor: 10, tipo_calculo: 'fijo' },
        },
      ];
    }

    return {
      frecuencia_id: frecId,
      disparador: frecId,
      condiciones: ef.condiciones || [],
      acciones: acciones,
    };
  };

  const listaEfectos = efectos.map(normalizarEfecto);

  const handleAgregarEfecto = () => {
    const defaultFrec = catalogoFrecuencias[0]?.id || 'al_obtener';
    const defaultAcc = accionesFiltradas[0]?.id || accionesFiltradas[0]?._id || 'modificar_recurso';
    const defaultRec = recursosDinamicos[0] || 'oro';

    const nuevo = {
      frecuencia_id: defaultFrec,
      disparador: defaultFrec,
      condiciones: [],
      acciones: [
        {
          accion_id: defaultAcc,
          parametros: { clave: defaultRec, valor: 10, tipo_calculo: 'fijo' },
        },
      ],
    };
    onChange([...listaEfectos, nuevo]);
  };

  const handleEliminarEfecto = (idxEfecto) => {
    onChange(listaEfectos.filter((_, i) => i !== idxEfecto));
  };

  const handleCambiarFrecuencia = (idxEfecto, nuevaFrecId) => {
    const copia = [...listaEfectos];
    copia[idxEfecto].frecuencia_id = nuevaFrecId;
    copia[idxEfecto].disparador = nuevaFrecId;
    onChange(copia);
  };

  const handleAgregarAccion = (idxEfecto) => {
    const defaultAcc = accionesFiltradas[0]?.id || accionesFiltradas[0]?._id || 'modificar_recurso';
    const defaultRec = recursosDinamicos[0] || 'oro';

    const copia = [...listaEfectos];
    copia[idxEfecto].acciones.push({
      accion_id: defaultAcc,
      parametros: { clave: defaultRec, valor: 5, tipo_calculo: 'fijo' },
    });
    onChange(copia);
  };

  const handleEliminarAccion = (idxEfecto, idxAccion) => {
    const copia = [...listaEfectos];
    if (copia[idxEfecto].acciones.length <= 1) {
      handleEliminarEfecto(idxEfecto);
      return;
    }
    copia[idxEfecto].acciones = copia[idxEfecto].acciones.filter((_, i) => i !== idxAccion);
    onChange(copia);
  };

  const handleCambiarAccionId = (idxEfecto, idxAccion, nuevaAccId) => {
    const copia = [...listaEfectos];
    const accDoc = catalogoAcciones.find((a) => (a._id || a.id) === nuevaAccId);
    const primitiva = accDoc?.primitiva || nuevaAccId;

    copia[idxEfecto].acciones[idxAccion].accion_id = nuevaAccId;

    // Inicializar parámetros adecuados según la primitiva de la acción elegida
    if (primitiva === 'otorgar_tag' || primitiva === 'remover_tag') {
      copia[idxEfecto].acciones[idxAccion].parametros = {
        tag: copia[idxEfecto].acciones[idxAccion].parametros?.tag || '',
      };
    } else if (primitiva === 'modificar_afinidad') {
      copia[idxEfecto].acciones[idxAccion].parametros = {
        destino: tipoEntidad === 'personaje' ? 'portador' : 'personaje',
        personaje_id: null,
        valor: copia[idxEfecto].acciones[idxAccion].parametros?.valor ?? 10,
      };
    } else if (primitiva === 'mutar_estado') {
      copia[idxEfecto].acciones[idxAccion].parametros = {
        ruta: copia[idxEfecto].acciones[idxAccion].parametros?.ruta || `recursos.${recursosDinamicos[0] || 'oro'}`,
        operacion_matematica: copia[idxEfecto].acciones[idxAccion].parametros?.operacion_matematica || 'sumar',
        valor: copia[idxEfecto].acciones[idxAccion].parametros?.valor ?? 10,
      };
    } else {
      // modificar_recurso o amortiguar_danio
      copia[idxEfecto].acciones[idxAccion].parametros = {
        clave: copia[idxEfecto].acciones[idxAccion].parametros?.clave || recursosDinamicos[0] || 'oro',
        valor: copia[idxEfecto].acciones[idxAccion].parametros?.valor ?? 10,
        tipo_calculo: copia[idxEfecto].acciones[idxAccion].parametros?.tipo_calculo || 'fijo',
      };
    }

    onChange(copia);
  };

  const handleCambiarParametro = (idxEfecto, idxAccion, campo, valor) => {
    const copia = [...listaEfectos];
    copia[idxEfecto].acciones[idxAccion].parametros[campo] = valor;
    onChange(copia);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <SparklesIcon size={14} className="text-[#ecd098]" />
          Efectos Pasivos y Desacoplados ({listaEfectos.length})
        </label>
        <button
          type="button"
          onClick={handleAgregarEfecto}
          disabled={cargando}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-[#ecd098] border border-[#ecd098]/40 text-[11px] font-bold transition disabled:opacity-50 cursor-pointer"
        >
          <PlusIcon size={12} />
          <span>Agregar Efecto</span>
        </button>
      </div>

      {errorCarga && (
        <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] flex items-center gap-1.5">
          <AlertTriangleIcon size={14} />
          <span>{errorCarga}</span>
        </div>
      )}

      {cargando ? (
        <p className="text-[11px] text-slate-400 italic p-3 rounded-xl border border-dashed border-[#52647b]/30 bg-[#151e2b]/30 text-center">
          Cargando catálogos de acciones y frecuencias desde MongoDB...
        </p>
      ) : listaEfectos.length === 0 ? (
        <p className="text-[11px] text-slate-500 italic p-3 rounded-xl border border-dashed border-[#52647b]/30 bg-[#151e2b]/30 text-center">
          No tiene efectos configurados. Haz clic en "Agregar Efecto" para vincular una acción del catálogo.
        </p>
      ) : (
        <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
          {listaEfectos.map((ef, idxEf) => {
            
            return (
              <div
                key={idxEf}
                className="p-3 rounded-[12px] border border-[#52647b]/40 bg-[#151e2b]/70 space-y-2.5 text-xs"
              >
                {/* Selector de frecuencia dinámica de MongoDB */}
                <div className="flex items-center justify-between gap-2 border-b border-[#364454] pb-2">
                  <div className="flex items-center gap-2 flex-1">
                    <ClockIcon size={14} className="text-[#ecd098] flex-shrink-0" />
                    <span className="text-[11px] font-semibold text-slate-400">Frecuencia:</span>
                    <select
                      value={ef.frecuencia_id}
                      onChange={(e) => handleCambiarFrecuencia(idxEf, e.target.value)}
                      className="flex-1 max-w-xs px-2.5 py-1 rounded-lg border border-[#52647b]/40 bg-[#1b2737] font-bold text-[11px] text-[#ecd098] focus:outline-none focus:border-[#ecd098]/60"
                    >
                      {/* Opciones reales desde MongoDB */}
                      {catalogoFrecuencias.map((frec) => (
                        <option key={frec.id} value={frec.id}>
                          {frec.nombre}
                        </option>
                      ))}

                      {/* Garantizar que una frecuencia previa no se pierda si aún no fue sincronizada */}
                      {ef.frecuencia_id && !catalogoFrecuencias.some((f) => f.id === ef.frecuencia_id) && (
                        <option value={ef.frecuencia_id}>
                          {ef.frecuencia_id}
                        </option>
                      )}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleEliminarEfecto(idxEf)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="Eliminar efecto"
                  >
                    <TrashIcon size={14} />
                  </button>
                </div>

                {/* Lista de acciones dinámicas de MongoDB dentro del efecto */}
                <div className="space-y-1.5 pl-2 border-l-2 border-[#ecd098]/40">
                  {ef.acciones.map((acc, idxAcc) => {
                    const accDoc = catalogoAcciones.find((a) => (a._id || a.id) === acc.accion_id);
                    const primitiva = accDoc?.primitiva || acc.accion_id;
                    const rutaInfo = descomponerRuta(acc.parametros?.ruta);

                    return (
                      <div
                        key={idxAcc}
                        className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-[#1b2737]/70 border border-[#52647b]/30 rounded-[8px]"
                      >
                        {/* Selector dinámico de acción desde MongoDB */}
                        <div className="flex flex-col">
                          <label className="text-[9px] uppercase font-bold text-slate-500 mb-0.5">Acción</label>
                          <select
                            value={acc.accion_id}
                            onChange={(e) => handleCambiarAccionId(idxEf, idxAcc, e.target.value)}
                            className="w-40 px-2 py-1 rounded-md border border-[#52647b]/40 bg-[#151e2b] font-bold text-[11px] text-slate-200 focus:outline-none focus:border-[#ecd098]/60"
                          >
                            {/* Opciones reales desde MongoDB filtradas por permitido_en */}
                            {accionesFiltradas.map((a) => {
                              const aid = a._id || a.id;
                              return (
                                <option key={aid} value={aid}>
                                  {a.nombre}
                                </option>
                              );
                            })}

                            {/* Preservar selección previa si la acción aún existe */}
                            {acc.accion_id && !accionesFiltradas.some((a) => (a._id || a.id) === acc.accion_id) && (
                              <option value={acc.accion_id}>
                                {acc.accion_id}
                              </option>
                            )}
                          </select>
                        </div>

                        {/* Parámetros dinámicos según la primitiva de la acción */}
                        {primitiva === 'otorgar_tag' || primitiva === 'remover_tag' ? (
                          <div className="flex flex-col flex-1 min-w-[120px]">
                            <label className="text-[9px] uppercase font-bold text-slate-500 mb-0.5">Tag Pasivo</label>
                            <input
                              type="text"
                              value={acc.parametros?.tag || ''}
                              onChange={(e) => handleCambiarParametro(idxEf, idxAcc, 'tag', e.target.value)}
                              placeholder="Nombre del tag..."
                              className="px-2 py-1 rounded-md border border-[#52647b]/40 bg-[#151e2b] text-[11px] font-mono text-slate-200 focus:outline-none focus:border-[#ecd098]/60"
                            />
                          </div>
                        ) : primitiva === 'modificar_afinidad' ? (
                          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[200px]">
                            <div className="flex flex-col">
                              <label className="text-[9px] uppercase font-bold text-slate-500 mb-0.5">Destino</label>
                              <select
                                value={acc.parametros?.destino || (tipoEntidad === 'personaje' ? 'portador' : 'personaje')}
                                onChange={(e) => handleCambiarParametro(idxEf, idxAcc, 'destino', e.target.value)}
                                className="w-24 px-1.5 py-1 rounded-md border border-[#52647b]/40 bg-[#151e2b] text-[11px] font-semibold text-slate-200"
                              >
                                {tipoEntidad === 'personaje' && <option value="portador">Portador (Él)</option>}
                                <option value="personaje">Personaje</option>
                              </select>
                            </div>

                            {acc.parametros?.destino !== 'portador' && (
                              <div className="flex flex-col">
                                <label className="text-[9px] uppercase font-bold text-slate-500 mb-0.5">Personaje</label>
                                <select
                                  value={acc.parametros?.personaje_id || ''}
                                  onChange={(e) => handleCambiarParametro(idxEf, idxAcc, 'personaje_id', e.target.value)}
                                  className="w-36 px-1.5 py-1 rounded-md border border-[#52647b]/40 bg-[#151e2b] font-bold text-[11px] text-[#ecd098]"
                                >
                                  <option value="">Elegir Personaje...</option>
                                  {catalogoPersonajes.map((pj) => {
                                    const pid = pj._id || pj.id;
                                    return (
                                      <option key={pid} value={pid}>
                                        {pj.nombre} {pj.titulo ? `(${pj.titulo})` : ''}
                                      </option>
                                    );
                                  })}
                                  {acc.parametros?.personaje_id && !catalogoPersonajes.some((p) => (p._id || p.id) === acc.parametros.personaje_id) && (
                                    <option value={acc.parametros.personaje_id}>{acc.parametros.personaje_id} (actual)</option>
                                  )}
                                </select>
                              </div>
                            )}

                            <div className="flex flex-col">
                              <label className="text-[9px] uppercase font-bold text-slate-500 mb-0.5">Delta (+/-)</label>
                              <input
                                type="number"
                                value={acc.parametros?.valor ?? 10}
                                onChange={(e) => handleCambiarParametro(idxEf, idxAcc, 'valor', parseFloat(e.target.value) || 0)}
                                className="w-16 px-1.5 py-1 rounded-md border border-[#52647b]/40 bg-[#151e2b] text-[11px] font-bold text-center text-slate-200"
                              />
                            </div>
                          </div>
                        ) : primitiva === 'mutar_estado' ? (
                            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[320px]">
                              {/* Selector de Categoría de Destino */}
                              <div className="flex flex-col">
                                <label className="text-[9px] uppercase font-bold text-slate-500 mb-0.5">Tipo Objetivo</label>
                                <select
                                  value={rutaInfo.tipo}
                                  onChange={(e) => {
                                    const nuevoTipo = e.target.value;
                                    let defaultClave = recursosDinamicos[0] || 'oro';
                                    if (nuevoTipo === 'afinidad') defaultClave = 'portador';
                                    else if (nuevoTipo === 'variable') defaultClave = 'amenaza';
                                    else if (nuevoTipo === 'manual') defaultClave = acc.parametros?.ruta || '';
                                    handleCambiarParametro(idxEf, idxAcc, 'ruta', componerRuta(nuevoTipo, defaultClave));
                                  }}
                                  className="w-32 px-1.5 py-1 rounded-md border border-[#52647b]/40 bg-[#151e2b] text-[11px] font-semibold text-cyan-300 focus:outline-none"
                                >
                                  <option value="recurso">Recurso Numérico</option>
                                  <option value="limite_max">Límite Máximo (Techo)</option>
                                  <option value="limite_min">Límite Mínimo (Piso)</option>
                                  <option value="afinidad">Afinidad Personaje</option>
                                  <option value="variable">Variable del Universo</option>
                                  <option value="manual">Ruta Manual</option>
                                </select>
                              </div>

                              {/* Selector de Recurso dinámico de MongoDB */}
                              {(rutaInfo.tipo === 'recurso' || rutaInfo.tipo === 'limite_max' || rutaInfo.tipo === 'limite_min') && (
                                <div className="flex flex-col">
                                  <label className="text-[9px] uppercase font-bold text-slate-500 mb-0.5">Recurso</label>
                                  <select
                                    value={rutaInfo.clave}
                                    onChange={(e) => handleCambiarParametro(idxEf, idxAcc, 'ruta', componerRuta(rutaInfo.tipo, e.target.value))}
                                    className="w-28 px-1.5 py-1 rounded-md border border-[#52647b]/40 bg-[#151e2b] font-bold text-[11px] text-emerald-300 focus:outline-none"
                                  >
                                    {recursosDinamicos.map((r) => (
                                      <option key={r} value={r}>
                                        {r.charAt(0).toUpperCase() + r.slice(1)}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              {/* Selector de Personaje dinámico de MongoDB */}
                              {rutaInfo.tipo === 'afinidad' && (
                                <div className="flex flex-col">
                                  <label className="text-[9px] uppercase font-bold text-slate-500 mb-0.5">Personaje</label>
                                  <select
                                    value={rutaInfo.clave}
                                    onChange={(e) => handleCambiarParametro(idxEf, idxAcc, 'ruta', componerRuta('afinidad', e.target.value))}
                                    className="w-40 px-1.5 py-1 rounded-md border border-[#52647b]/40 bg-[#151e2b] font-bold text-[11px] text-[#ecd098] focus:outline-none"
                                  >
                                    <option value="portador">Portador (Él mismo)</option>
                                    {catalogoPersonajes.map((pj) => {
                                      const pid = pj._id || pj.id;
                                      return (
                                        <option key={pid} value={pid}>
                                          {pj.nombre} {pj.titulo ? `(${pj.titulo})` : ''}
                                        </option>
                                      );
                                    })}
                                    {rutaInfo.clave !== 'portador' && !catalogoPersonajes.some((p) => (p._id || p.id) === rutaInfo.clave) && (
                                      <option value={rutaInfo.clave}>{rutaInfo.clave} (actual)</option>
                                    )}
                                  </select>
                                </div>
                              )}

                              {/* Variable del Universo */}
                              {rutaInfo.tipo === 'variable' && (
                                <div className="flex flex-col">
                                  <label className="text-[9px] uppercase font-bold text-slate-500 mb-0.5">Variable</label>
                                  <input
                                    type="text"
                                    value={rutaInfo.clave}
                                    onChange={(e) => handleCambiarParametro(idxEf, idxAcc, 'ruta', componerRuta('variable', e.target.value))}
                                    placeholder="ej: inflacion"
                                    className="w-28 px-1.5 py-1 rounded-md border border-[#52647b]/40 bg-[#151e2b] font-mono text-[11px] text-slate-200"
                                  />
                                </div>
                              )}

                              {/* Ruta Manual */}
                              {rutaInfo.tipo === 'manual' && (
                                <div className="flex flex-col">
                                  <label className="text-[9px] uppercase font-bold text-slate-500 mb-0.5">Ruta Técnica</label>
                                  <input
                                    type="text"
                                    value={rutaInfo.clave}
                                    onChange={(e) => handleCambiarParametro(idxEf, idxAcc, 'ruta', e.target.value)}
                                    placeholder="ej: recursos.oro"
                                    className="w-32 px-1.5 py-1 rounded-md border border-[#52647b]/40 bg-[#151e2b] font-mono text-[11px] text-slate-200"
                                  />
                                </div>
                              )}

                              {/* Selector de Operación matemática */}
                              <div className="flex flex-col">
                                <label className="text-[9px] uppercase font-bold text-slate-500 mb-0.5">Operación</label>
                                <select
                                  value={acc.parametros?.operacion_matematica || 'sumar'}
                                  onChange={(e) => handleCambiarParametro(idxEf, idxAcc, 'operacion_matematica', e.target.value)}
                                  className="w-28 px-1.5 py-1 rounded-md border border-[#52647b]/40 bg-[#151e2b] font-bold text-[11px] text-[#ecd098] focus:outline-none"
                                >
                                  <option value="sumar">Sumar (+)</option>
                                  <option value="restar">Restar (-)</option>
                                  <option value="multiplicar">Multiplicar (×)</option>
                                  <option value="dividir">Dividir (/)</option>
                                  <option value="porcentual">Porcentual (%)</option>
                                  <option value="fijar">Fijar (=)</option>
                                </select>
                              </div>

                              {/* Valor */}
                              <div className="flex flex-col">
                                <label className="text-[9px] uppercase font-bold text-slate-500 mb-0.5">Valor</label>
                                <input
                                  type="number"
                                  step="any"
                                  value={acc.parametros?.valor ?? 0}
                                  onChange={(e) => handleCambiarParametro(idxEf, idxAcc, 'valor', parseFloat(e.target.value) || 0)}
                                  className="w-16 px-1.5 py-1 rounded-md border border-[#52647b]/40 bg-[#151e2b] text-[11px] font-bold text-center text-slate-200"
                                />
                              </div>
                            </div>
                        ) : (
                          /* primitiva modificar_recurso o amortiguar_danio */
                          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                            <div className="flex flex-col">
                              <label className="text-[9px] uppercase font-bold text-slate-500 mb-0.5">Recurso</label>
                              <select
                                value={acc.parametros?.clave || recursosDinamicos[0] || 'oro'}
                                onChange={(e) => handleCambiarParametro(idxEf, idxAcc, 'clave', e.target.value)}
                                className="w-24 px-1.5 py-1 rounded-md border border-[#52647b]/40 bg-[#151e2b] font-bold text-[11px] text-slate-200"
                              >
                                {recursosDinamicos.map((r) => (
                                  <option key={r} value={r}>
                                    {r.charAt(0).toUpperCase() + r.slice(1)}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex flex-col">
                              <label className="text-[9px] uppercase font-bold text-slate-500 mb-0.5">
                                {primitiva === 'amortiguar_danio' ? '% Absorción' : 'Delta (+/-)'}
                              </label>
                              <input
                                type="number"
                                value={acc.parametros?.valor ?? 10}
                                onChange={(e) => handleCambiarParametro(idxEf, idxAcc, 'valor', parseFloat(e.target.value) || 0)}
                                className="w-16 px-1.5 py-1 rounded-md border border-[#52647b]/40 bg-[#151e2b] text-[11px] font-bold text-center text-slate-200"
                              />
                            </div>

                            {primitiva === 'modificar_recurso' && (
                              <div className="flex flex-col">
                                <label className="text-[9px] uppercase font-bold text-slate-500 mb-0.5">Cálculo</label>
                                <select
                                  value={acc.parametros?.tipo_calculo || 'fijo'}
                                  onChange={(e) => handleCambiarParametro(idxEf, idxAcc, 'tipo_calculo', e.target.value)}
                                  className="w-20 px-1 py-1 rounded-md border border-[#52647b]/40 bg-[#151e2b] text-[10px] text-slate-300"
                                >
                                  <option value="fijo">Fijo</option>
                                  <option value="porcentual">%</option>
                                </select>
                              </div>
                            )}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleEliminarAccion(idxEf, idxAcc)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 ml-auto"
                          title="Quitar acción"
                        >
                          <TrashIcon size={12} />
                        </button>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => handleAgregarAccion(idxEf)}
                    className="text-[10px] text-[#ecd098] hover:text-[#ecd098] font-semibold flex items-center gap-1 mt-1 pl-1 cursor-pointer"
                  >
                    <PlusIcon size={10} />
                    <span>Añadir acción ordenada a este efecto</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
