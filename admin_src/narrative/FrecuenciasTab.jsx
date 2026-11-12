/* Permite administrar las frecuencias dinámicas del motor narrativo con diseño CogniJuegos. */
import { useState, useEffect } from 'react';
import {
  ClockIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
  AlertTriangleIcon,
  RefreshIcon,
  XIcon,
  FilterIcon,
} from '../Icons';
import { textoDelDetalle } from './erroresApi';

export default function FrecuenciasTab({ universos = [] }) {
  const [universoFiltro, setUniversoFiltro] = useState(
    universos[0]?._id || universos[0]?.id || 'corte_medieval'
  );
  const [documentoFrec, setDocumentoFrec] = useState(null);
  const [eventosMotor, setEventosMotor] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  // Modal Item Crear/Editar
  const [modalAbierto, setModalAbierto] = useState(false);
  const [esEdicion, setEsEdicion] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Campos formulario frecuencia
  const [itemId, setItemId] = useState('');
  const [nombre, setNombre] = useState('');
  const [eventoMotor, setEventoMotor] = useState('inicio_mes');
  const [cada, setCada] = useState(1);
  const [desfase, setDesfase] = useState(0);
  const [conteoDesde, setConteoDesde] = useState('adquisicion');
  const [activo, setActivo] = useState(true);

  // Modal Ver Usos
  const [modalUsosAbierto, setModalUsosAbierto] = useState(false);
  const [frecuenciaUsosId, setFrecuenciaUsosId] = useState('');
  const [usosData, setUsosData] = useState(null);
  const [cargandoUsos, setCargandoUsos] = useState(false);

  useEffect(() => {
    if (universos.length > 0 && !universos.some((u) => (u._id || u.id) === universoFiltro)) {
      setUniversoFiltro(universos[0]._id || universos[0].id);
    }
  }, [universos]);

  // Cargar eventos del motor disponibles en backend
  const cargarEventosMotor = async () => {
    try {
      const res = await fetch('/api/narrative/admin/eventos-motor');
      if (res.ok) {
        const data = await res.json();
        setEventosMotor(data);
        if (data.length > 0 && !eventoMotor) {
          setEventoMotor(data[0].evento_motor);
        }
      }
    } catch (err) {
      console.error('Error al cargar eventos motor:', err);
    }
  };

  // Cargar documento de frecuencias del universo actual
  const cargarFrecuencias = async (universoId) => {
    setCargando(true);
    setError('');
    try {
      const res = await fetch(`/api/narrative/admin/frecuencias?universo_id=${encodeURIComponent(universoId)}`);
      if (res.ok) {
        const data = await res.json();
        setDocumentoFrec(data);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(textoDelDetalle(errData.detail, 'No se pudo cargar el catálogo de frecuencias.'));
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión al cargar frecuencias.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEventosMotor();
  }, []);

  useEffect(() => {
    if (universoFiltro) {
      cargarFrecuencias(universoFiltro);
    }
  }, [universoFiltro]);

  const items = Array.isArray(documentoFrec?.items) ? documentoFrec.items : [];

  const abrirModalNuevo = () => {
    setEsEdicion(false);
    setItemId('frec_' + Date.now().toString(36));
    setNombre('');
    setEventoMotor(eventosMotor[0]?.evento_motor || 'inicio_mes');
    setCada(1);
    setDesfase(0);
    setConteoDesde('adquisicion');
    setActivo(true);
    setError('');
    setExito('');
    setModalAbierto(true);
  };

  const abrirModalEditar = (item) => {
    setEsEdicion(true);
    setItemId(item.id || item._id);
    setNombre(item.nombre || '');
    setEventoMotor(item.evento_motor || 'inicio_mes');
    setCada(item.cada !== undefined ? item.cada : 1);
    setDesfase(item.desfase !== undefined ? item.desfase : 0);
    setConteoDesde(item.conteo_desde || 'adquisicion');
    setActivo(item.activo !== undefined ? item.activo : true);
    setError('');
    setExito('');
    setModalAbierto(true);
  };

  const handleGuardarItem = async (e) => {
    e.preventDefault();
    if (!itemId.trim() || !nombre.trim() || !eventoMotor.trim()) {
      setError('El identificador, nombre y el evento de motor son obligatorios.');
      return;
    }

    setGuardando(true);
    setError('');
    setExito('');

    const itemsActuales = [...items];
    const nuevoItem = {
      id: itemId.trim(),
      nombre: nombre.trim(),
      evento_motor: eventoMotor.trim(),
      cada: eventoMotor === 'inicio_mes' ? parseInt(cada, 10) || 1 : 1,
      desfase: eventoMotor === 'inicio_mes' ? parseInt(desfase, 10) || 0 : 0,
      conteo_desde: conteoDesde,
      activo: activo,
    };

    let nuevosItems;
    if (esEdicion) {
      nuevosItems = itemsActuales.map((it) => ((it.id || it._id) === itemId ? nuevoItem : it));
    } else {
      if (itemsActuales.some((it) => (it.id || it._id) === nuevoItem.id)) {
        setError(`Ya existe una frecuencia con el ID '${nuevoItem.id}'.`);
        setGuardando(false);
        return;
      }
      nuevosItems = [...itemsActuales, nuevoItem];
    }

    try {
      const res = await fetch(`/api/narrative/admin/frecuencias/${encodeURIComponent(universoFiltro)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: nuevosItems,
          expected_version: documentoFrec?.version,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(textoDelDetalle(errData.detail, 'Error al guardar frecuencias.'));
      }

      setExito('Frecuencias actualizadas exitosamente.');
      setModalAbierto(false);
      cargarFrecuencias(universoFiltro);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error inesperado al guardar.');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarItem = async (idAEliminar) => {
    if (!confirm(`¿Seguro que deseas eliminar la frecuencia "${idAEliminar}"?`)) return;
    setError('');
    setExito('');

    // Verificar usos antes de eliminar
    try {
      const resUsos = await fetch(
        `/api/narrative/admin/frecuencias/${encodeURIComponent(idAEliminar)}/usos?universo_id=${encodeURIComponent(universoFiltro)}`
      );
      if (resUsos.ok) {
        const dataUsos = await resUsos.json();
        if (dataUsos.total_usos > 0) {
          setError(
            `No se puede eliminar la frecuencia "${idAEliminar}" porque está en uso por ${dataUsos.total_usos} entidad(es). Desactívala en su lugar.`
          );
          return;
        }
      }

      const nuevosItems = items.filter((it) => (it.id || it._id) !== idAEliminar);
      const res = await fetch(`/api/narrative/admin/frecuencias/${encodeURIComponent(universoFiltro)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: nuevosItems,
          expected_version: documentoFrec?.version,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(textoDelDetalle(errData.detail, 'Error al eliminar la frecuencia.'));
      }

      setExito('Frecuencia eliminada correctamente.');
      cargarFrecuencias(universoFiltro);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al eliminar.');
    }
  };

  const verUsos = async (frecId) => {
    setFrecuenciaUsosId(frecId);
    setModalUsosAbierto(true);
    setCargandoUsos(true);
    try {
      const res = await fetch(
        `/api/narrative/admin/frecuencias/${encodeURIComponent(frecId)}/usos?universo_id=${encodeURIComponent(universoFiltro)}`
      );
      if (res.ok) {
        const data = await res.json();
        setUsosData(data);
      } else {
        setUsosData({ cartas: [], personajes: [] });
      }
    } catch (err) {
      console.error(err);
      setUsosData({ cartas: [], personajes: [] });
    } finally {
      setCargandoUsos(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra Superior (#2a394c con borde #52647b) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#2a394c] p-3.5 sm:p-4 rounded-[16px] border border-[#52647b]">
        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de Universo */}
          {universos.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-[9px] border border-[#52647b] bg-[#1b2737] text-xs text-[#f3f6fa] focus-within:border-[#ecd098] focus-within:ring-1 focus-within:ring-[#ecd098] transition">
              <FilterIcon size={14} className="text-[#ecd098] shrink-0" />
              <select
                value={universoFiltro}
                onChange={(e) => setUniversoFiltro(e.target.value)}
                className="bg-transparent font-semibold text-[#f3f6fa] text-xs focus:outline-none cursor-pointer pr-1 [color-scheme:dark] [&>option]:bg-[#1b2737] [&>option]:text-[#f3f6fa]"
              >
                {universos.map((u) => {
                  const uid = u._id || u.id;
                  return (
                    <option key={uid} value={uid} className="bg-[#1b2737] text-[#f3f6fa]">
                      {u.nombre || uid}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#f3f6fa] flex items-center gap-2">
              <ClockIcon className="text-[#ecd098]" size={18} />
              Catálogo de Frecuencias de Disparo
            </h2>
            <p className="text-[11px] text-[#c0cbd7] mt-0.5">
              Configura cuándo y con qué cadencia se evalúan los efectos pasivos de cartas y personajes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => cargarFrecuencias(universoFiltro)}
            disabled={cargando}
            className="p-2 rounded-[9px] border border-[#52647b] bg-[#1b2737] hover:bg-[#2e3c50] text-[#c0cbd7] hover:text-[#f3f6fa] transition cursor-pointer"
            title="Recargar catálogo"
          >
            <RefreshIcon size={16} className={cargando ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={abrirModalNuevo}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[9px] bg-[#ecd098] hover:bg-[#f6deb0] text-[#172433] font-bold text-xs transition cursor-pointer"
          >
            <PlusIcon size={15} />
            <span>Nueva Frecuencia</span>
          </button>
        </div>
      </div>

      {/* Alertas */}
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

      {/* Grid de Frecuencias */}
      {cargando ? (
        <div className="py-16 text-center text-[#c0cbd7] text-xs font-semibold">
          Cargando catálogo de frecuencias...
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center bg-[#2a394c] rounded-[16px] border border-[#52647b] p-8 text-[#c0cbd7] text-xs">
          No hay frecuencias configuradas en este universo. Haz clic en "Nueva Frecuencia" para registrar la primera.
        </div>
      ) : (
        <div className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => {
            const itemIdReal = item.id || item._id;
            const evInfo = eventosMotor.find((e) => e.evento_motor === item.evento_motor);
            return (
              <div
                key={itemIdReal}
                className={`bg-[#2e3c50] rounded-[16px] border border-[#52647b] hover:border-[#ecd098]/70 p-5 transition-colors duration-200 flex flex-col justify-between group ${
                  !item.activo ? 'opacity-65' : ''
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-[#f3f6fa] truncate">{item.nombre}</h4>
                      <p className="font-mono text-[11px] text-[#ecd098] mt-0.5 truncate">{itemIdReal}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-[5px] text-[10px] font-bold uppercase tracking-wider shrink-0 border ${
                        item.activo
                          ? 'bg-[#99dcd1]/15 text-[#99dcd1] border-[#99dcd1]/40'
                          : 'bg-[#52647b]/20 text-[#c0cbd7] border-[#52647b]'
                      }`}
                    >
                      {item.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>

                  <div className="mt-3.5 space-y-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-[5px] bg-[#c8bbf0]/15 border border-[#c8bbf0]/40 text-[10px] font-semibold text-[#c8bbf0]">
                        {evInfo?.nombre || item.evento_motor}
                      </span>
                      {item.evento_motor === 'inicio_mes' && (
                        <span className="px-2 py-0.5 rounded-[5px] bg-[#1b2737] border border-[#52647b] text-[10px] font-mono text-[#ecd098]">
                          Cada {item.cada} mes(es)
                        </span>
                      )}
                    </div>

                    {item.evento_motor === 'inicio_mes' && (
                      <p className="text-[11px] text-[#c0cbd7] leading-relaxed">
                        Desfase: <span className="font-mono text-[#f3f6fa]">{item.desfase || 0}</span> | Base:{' '}
                        <span className="text-[#f3f6fa] font-medium">{item.conteo_desde || 'adquisición'}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#364454] pt-3">
                  <button
                    type="button"
                    onClick={() => verUsos(itemIdReal)}
                    className="text-[11px] font-semibold text-[#ecd098] hover:text-[#f3d894] transition cursor-pointer"
                  >
                    Ver referencias
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => abrirModalEditar(item)}
                      className="p-1.5 rounded-[9px] border border-[#52647b] bg-[#1b2737] hover:bg-[#2a394c] text-[#c0cbd7] hover:text-[#f3f6fa] transition cursor-pointer"
                      title="Editar frecuencia"
                    >
                      <EditIcon size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminarItem(itemIdReal)}
                      className="p-1.5 rounded-[9px] border border-[#52647b] bg-[#1b2737] hover:bg-[#2a394c] hover:border-[#f0bb98] text-[#f0bb98] transition cursor-pointer"
                      title="Eliminar frecuencia"
                    >
                      <TrashIcon size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear / Editar Frecuencia (Spacious) */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-[#151e2b]/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-[#2a394c] rounded-[16px] border border-[#52647b] shadow-2xl w-full max-w-2xl sm:max-w-3xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Cabecera */}
            <div className="px-6 py-4 border-b border-[#364454] bg-[#1b2737] flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-[9px] bg-[#2a394c] border border-[#52647b] text-[#ecd098] flex items-center justify-center shrink-0">
                  <ClockIcon size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#f3f6fa] truncate">
                    {esEdicion ? `Editar Frecuencia: ${nombre || itemId}` : 'Nueva Frecuencia de Disparo'}
                  </h3>
                  <p className="text-xs text-[#c0cbd7] mt-0.5">Configura la periodicidad y disparadores del motor de juego.</p>
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

            {/* Formulario */}
            <form onSubmit={handleGuardarItem} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div className="p-5 rounded-[16px] border border-[#52647b] bg-[#2e3c50] space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[#c0cbd7] uppercase tracking-wider mb-1">
                      Identificador Único (ID) *
                    </label>
                    <input
                      type="text"
                      value={itemId}
                      onChange={(e) => setItemId(e.target.value)}
                      disabled={esEdicion}
                      placeholder="ej: cada_2_meses"
                      className="w-full px-3 py-2 rounded-[9px] border border-[#52647b] bg-[#1b2737] text-xs font-mono font-semibold text-[#f3f6fa] disabled:opacity-50 focus:outline-none focus:border-[#ecd098] focus:ring-1 focus:ring-[#ecd098]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#c0cbd7] uppercase tracking-wider mb-1">
                      Nombre Legible *
                    </label>
                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="ej: Cada 2 meses desde adquisición"
                      className="w-full px-3 py-2 rounded-[9px] border border-[#52647b] bg-[#1b2737] text-xs font-bold text-[#f3f6fa] focus:outline-none focus:border-[#ecd098] focus:ring-1 focus:ring-[#ecd098]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#c0cbd7] uppercase tracking-wider mb-1">
                    Evento de Motor
                  </label>
                  <select
                    value={eventoMotor}
                    onChange={(e) => setEventoMotor(e.target.value)}
                    className="w-full px-3 py-2 rounded-[9px] border border-[#52647b] bg-[#1b2737] text-xs font-bold text-[#f3f6fa] [color-scheme:dark] [&>option]:bg-[#1b2737] [&>option]:text-[#f3f6fa] focus:outline-none focus:border-[#ecd098] focus:ring-1 focus:ring-[#ecd098]"
                  >
                    {eventosMotor.map((ev) => (
                      <option key={ev.evento_motor} value={ev.evento_motor} className="bg-[#1b2737] text-[#f3f6fa]">
                        {ev.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {eventoMotor === 'inicio_mes' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-[12px] bg-[#1b2737] border border-[#52647b]/50">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-[#c0cbd7] mb-1">
                        Intervalo (meses)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={cada}
                        onChange={(e) => setCada(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-[7px] border border-[#52647b] bg-[#151e2b] text-xs text-[#f3f6fa] font-bold text-center"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-[#c0cbd7] mb-1">
                        Desfase (meses)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={12}
                        value={desfase}
                        onChange={(e) => setDesfase(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-[7px] border border-[#52647b] bg-[#151e2b] text-xs text-[#f3f6fa] font-bold text-center"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-[#c0cbd7] mb-1">
                        Base de cálculo
                      </label>
                      <select
                        value={conteoDesde}
                        onChange={(e) => setConteoDesde(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-[7px] border border-[#52647b] bg-[#151e2b] text-xs font-semibold text-[#f3f6fa] [color-scheme:dark]"
                      >
                        <option value="adquisicion">Mes de adquisición</option>
                        <option value="inicio_partida">Mes 1 (partida)</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2.5 pt-2 border-t border-[#364454]">
                  <input
                    type="checkbox"
                    id="chk_frec_activo"
                    checked={activo}
                    onChange={(e) => setActivo(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#ecd098] cursor-pointer"
                  />
                  <label htmlFor="chk_frec_activo" className="text-xs font-semibold text-[#f3f6fa] cursor-pointer">
                    Frecuencia activa para selección en cartas y personajes
                  </label>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="pt-4 border-t border-[#364454] bg-[#1b2737] -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-4 sm:p-5 flex items-center justify-end gap-2 shrink-0 rounded-b-[16px]">
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
                  <span>{guardando ? 'Guardando...' : esEdicion ? 'Actualizar Frecuencia' : 'Crear Frecuencia'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ver Usos */}
      {modalUsosAbierto && (
        <div className="fixed inset-0 z-50 bg-[#151e2b]/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-[#2a394c] rounded-[16px] border border-[#52647b] shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh] overflow-hidden my-auto">
            <div className="px-5 py-4 border-b border-[#364454] bg-[#1b2737] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#f3f6fa]">
                  Referencias de Frecuencia: <span className="font-mono text-[#ecd098]">{frecuenciaUsosId}</span>
                </h3>
                <p className="text-xs text-[#c0cbd7] mt-0.5">Elementos que evalúan sus efectos con esta periodicidad.</p>
              </div>
              <button
                type="button"
                onClick={() => setModalUsosAbierto(false)}
                className="p-1.5 rounded-[9px] text-[#c0cbd7] hover:text-[#f3f6fa] hover:bg-[#2a394c] transition cursor-pointer"
              >
                <XIcon size={16} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {cargandoUsos ? (
                <div className="py-8 text-center text-xs text-[#c0cbd7] font-semibold">Consultando dependencias...</div>
              ) : !usosData || (usosData.cartas?.length === 0 && usosData.personajes?.length === 0) ? (
                <p className="text-xs text-[#c0cbd7] italic text-center py-6">
                  Esta frecuencia no está referenciada por ninguna carta ni personaje actualmente.
                </p>
              ) : (
                <>
                  {usosData.cartas?.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#ecd098] mb-2">
                        Cartas ({usosData.cartas.length})
                      </h4>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {usosData.cartas.map((c) => (
                          <div key={c.id || c._id} className="p-2 rounded-[8px] bg-[#1b2737] border border-[#52647b]/40 text-xs flex justify-between">
                            <span className="font-bold text-[#f3f6fa]">{c.nombre}</span>
                            <span className="font-mono text-[10px] text-[#c0cbd7]">{c.id || c._id}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {usosData.personajes?.length > 0 && (
                    <div className="pt-3 border-t border-[#364454]">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#ecd098] mb-2">
                        Personajes ({usosData.personajes.length})
                      </h4>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {usosData.personajes.map((p) => (
                          <div key={p.id || p._id} className="p-2 rounded-[8px] bg-[#1b2737] border border-[#52647b]/40 text-xs flex justify-between">
                            <span className="font-bold text-[#f3f6fa]">{p.nombre}</span>
                            <span className="font-mono text-[10px] text-[#c0cbd7]">{p.id || p._id}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="p-4 border-t border-[#364454] bg-[#1b2737] flex justify-end">
              <button
                type="button"
                onClick={() => setModalUsosAbierto(false)}
                className="px-4 py-2 rounded-[9px] border border-[#52647b] bg-[#2a394c] hover:bg-[#2e3c50] text-[#f3f6fa] font-bold text-xs transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
