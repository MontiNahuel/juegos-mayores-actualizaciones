/* Permite administrar las acciones del motor narrativo por universo con estilo CogniJuegos. */
import { useState, useEffect } from 'react';
import {
  SparklesIcon,
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

export default function AccionesTab({ universos = [] }) {
  const [acciones, setAcciones] = useState([]);
  const [operaciones, setOperaciones] = useState([]);
  const [universoFiltro, setUniversoFiltro] = useState(
    universos[0]?._id || universos[0]?.id || 'corte_medieval'
  );
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  // Modal Crear/Editar
  const [modalAbierto, setModalAbierto] = useState(false);
  const [esEdicion, setEsEdicion] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Campos formulario acción
  const [id, setId] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [primitiva, setPrimitiva] = useState('');
  const [permitidoEn, setPermitidoEn] = useState(['carta', 'personaje']);
  const [activo, setActivo] = useState(true);

  // Modal Ver Usos
  const [modalUsosAbierto, setModalUsosAbierto] = useState(false);
  const [accionUsosId, setAccionUsosId] = useState('');
  const [usosData, setUsosData] = useState({ cartas: [], personajes: [] });
  const [cargandoUsos, setCargandoUsos] = useState(false);

  // Sincronizar universo inicial
  useEffect(() => {
    if (universos.length > 0 && !universos.some((u) => (u._id || u.id) === universoFiltro)) {
      setUniversoFiltro(universos[0]._id || universos[0].id);
    }
  }, [universos]);

  // Cargar operaciones/primitivas fijas del backend
  const cargarOperaciones = async () => {
    try {
      const res = await fetch('/api/narrative/admin/operaciones');
      if (res.ok) {
        const data = await res.json();
        setOperaciones(data);
        if (data.length > 0 && !primitiva) {
          setPrimitiva(data[0].primitiva);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Cargar acciones dinámicas desde MongoDB
  const cargarAcciones = async (uId = universoFiltro) => {
    setCargando(true);
    setError('');
    try {
      const url = uId
        ? `/api/narrative/admin/acciones?universo_id=${encodeURIComponent(uId)}`
        : '/api/narrative/admin/acciones';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAcciones(data);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(textoDelDetalle(errData.detail, 'No se pudo cargar el catálogo de acciones.'));
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión al cargar acciones.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarOperaciones();
  }, []);

  useEffect(() => {
    if (universoFiltro) {
      cargarAcciones(universoFiltro);
    }
  }, [universoFiltro]);

  const abrirModalNuevo = () => {
    setEsEdicion(false);
    setId('');
    setNombre('');
    setDescripcion('');
    setPrimitiva(operaciones[0]?.primitiva || 'modificar_recurso');
    setPermitidoEn(['carta', 'personaje']);
    setActivo(true);
    setError('');
    setExito('');
    setModalAbierto(true);
  };

  const abrirModalEditar = (acc) => {
    setEsEdicion(true);
    setId(acc._id || acc.id);
    setNombre(acc.nombre || '');
    setDescripcion(acc.descripcion || '');
    setPrimitiva(acc.primitiva || operaciones[0]?.primitiva || 'modificar_recurso');
    setPermitidoEn(Array.isArray(acc.permitido_en) ? acc.permitido_en : ['carta', 'personaje']);
    setActivo(acc.activo !== undefined ? acc.activo : true);
    setError('');
    setExito('');
    setModalAbierto(true);
  };

  const togglePermitidoEn = (tipo) => {
    if (permitidoEn.includes(tipo)) {
      if (permitidoEn.length > 1) {
        setPermitidoEn(permitidoEn.filter((t) => t !== tipo));
      }
    } else {
      setPermitidoEn([...permitidoEn, tipo]);
    }
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!id.trim() || !nombre.trim() || !primitiva.trim()) {
      setError('El identificador, nombre y la primitiva son obligatorios.');
      return;
    }

    setGuardando(true);
    setError('');
    setExito('');

    const payload = {
      _id: id.trim(),
      universo_id: universoFiltro,
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      primitiva: primitiva.trim(),
      permitido_en: permitidoEn,
      activo: activo,
    };

    try {
      const res = await fetch('/api/narrative/admin/acciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setExito(esEdicion ? 'Acción actualizada exitosamente.' : 'Acción creada exitosamente.');
        setModalAbierto(false);
        cargarAcciones(universoFiltro);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(textoDelDetalle(errData.detail, 'No se pudo guardar la acción.'));
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión al guardar.');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (accId) => {
    if (!confirm(`¿Estás seguro de eliminar la acción "${accId}"?`)) return;
    try {
      const res = await fetch(`/api/narrative/admin/acciones/${encodeURIComponent(accId)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setExito('Acción eliminada correctamente.');
        cargarAcciones(universoFiltro);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(textoDelDetalle(errData.detail, 'No se pudo eliminar la acción.'));
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al eliminar.');
    }
  };

  const verUsos = async (accId) => {
    setAccionUsosId(accId);
    setModalUsosAbierto(true);
    setCargandoUsos(true);
    try {
      const res = await fetch(`/api/narrative/admin/acciones/${encodeURIComponent(accId)}/usos`);
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
      {/* Barra de Filtros y Acciones (#2a394c con borde #52647b) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#2a394c] p-3.5 sm:p-4 rounded-[16px] border border-[#52647b]">
        <div className="flex items-center gap-2.5">
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
          <span className="hidden xl:inline-block text-[11px] font-medium text-[#c0cbd7] pl-1">
            {acciones.length} {acciones.length === 1 ? 'acción' : 'acciones'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => cargarAcciones(universoFiltro)}
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
            <span>Nueva Acción</span>
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

      {/* Grid de Acciones */}
      {cargando ? (
        <div className="py-16 text-center text-[#c0cbd7] text-xs font-semibold">
          Cargando catálogo de acciones dinámicas...
        </div>
      ) : acciones.length === 0 ? (
        <div className="py-16 text-center bg-[#2a394c] rounded-[16px] border border-[#52647b] p-8 text-[#c0cbd7] text-xs">
          No hay acciones registradas en este universo. Haz clic en "Nueva Acción" para comenzar.
        </div>
      ) : (
        <div className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {acciones.map((acc) => {
            const accId = acc._id || acc.id;
            const opInfo = operaciones.find((o) => o.primitiva === acc.primitiva);
            return (
              <div
                key={accId}
                className={`bg-[#2e3c50] rounded-[16px] border border-[#52647b] hover:border-[#ecd098]/70 p-5 transition-colors duration-200 flex flex-col justify-between group ${
                  !acc.activo ? 'opacity-65' : ''
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-[#f3f6fa] truncate">{acc.nombre}</h4>
                      <p className="font-mono text-[11px] text-[#ecd098] mt-0.5 truncate">{accId}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-[5px] text-[10px] font-bold uppercase tracking-wider shrink-0 border ${
                        acc.activo
                          ? 'bg-[#99dcd1]/15 text-[#99dcd1] border-[#99dcd1]/40'
                          : 'bg-[#52647b]/20 text-[#c0cbd7] border-[#52647b]'
                      }`}
                    >
                      {acc.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>

                  <p className="mt-2.5 text-xs text-[#c0cbd7] line-clamp-2 leading-relaxed">
                    {acc.descripcion || 'Sin descripción.'}
                  </p>

                  <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-[5px] bg-[#a8ccef]/15 border border-[#a8ccef]/40 text-[10px] font-semibold text-[#a8ccef]">
                      {opInfo?.nombre || acc.primitiva}
                    </span>
                    {(acc.permitido_en || []).map((perm) => (
                      <span
                        key={perm}
                        className="px-2 py-0.5 rounded-[5px] bg-[#1b2737] border border-[#52647b] text-[10px] font-medium text-[#c0cbd7] capitalize"
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#364454] pt-3">
                  <button
                    type="button"
                    onClick={() => verUsos(accId)}
                    className="text-[11px] font-semibold text-[#ecd098] hover:text-[#f3d894] transition cursor-pointer"
                  >
                    Ver referencias
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => abrirModalEditar(acc)}
                      className="p-1.5 rounded-[9px] border border-[#52647b] bg-[#1b2737] hover:bg-[#2a394c] text-[#c0cbd7] hover:text-[#f3f6fa] transition cursor-pointer"
                      title="Editar acción"
                    >
                      <EditIcon size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminar(accId)}
                      className="p-1.5 rounded-[9px] border border-[#52647b] bg-[#1b2737] hover:bg-[#2a394c] hover:border-[#f0bb98] text-[#f0bb98] transition cursor-pointer"
                      title="Eliminar acción"
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

      {/* Modal Crear / Editar Acción (Spacious & Clean) */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-[#151e2b]/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-[#2a394c] rounded-[16px] border border-[#52647b] shadow-2xl w-full max-w-2xl sm:max-w-3xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Cabecera */}
            <div className="px-6 py-4 border-b border-[#364454] bg-[#1b2737] flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-[9px] bg-[#2a394c] border border-[#52647b] text-[#ecd098] flex items-center justify-center shrink-0">
                  <SparklesIcon size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#f3f6fa] truncate">
                    {esEdicion ? `Editar Acción: ${nombre || id}` : 'Nueva Acción del Motor'}
                  </h3>
                  <p className="text-xs text-[#c0cbd7] mt-0.5">Configura el verbo de cálculo y su ámbito de aplicación.</p>
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
            <form onSubmit={handleGuardar} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div className="p-5 rounded-[16px] border border-[#52647b] bg-[#2e3c50] space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[#c0cbd7] uppercase tracking-wider mb-1">
                      Identificador Único (ID) *
                    </label>
                    <input
                      type="text"
                      value={id}
                      onChange={(e) => setId(e.target.value)}
                      disabled={esEdicion}
                      placeholder="ej: tributo_real"
                      className="w-full px-3 py-2 rounded-[9px] border border-[#52647b] bg-[#1b2737] text-xs font-mono font-semibold text-[#f3f6fa] disabled:opacity-50 focus:outline-none focus:border-[#ecd098] focus:ring-1 focus:ring-[#ecd098]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#c0cbd7] uppercase tracking-wider mb-1">
                      Nombre de Catálogo *
                    </label>
                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="ej: Cobro de Tributo"
                      className="w-full px-3 py-2 rounded-[9px] border border-[#52647b] bg-[#1b2737] text-xs font-bold text-[#f3f6fa] focus:outline-none focus:border-[#ecd098] focus:ring-1 focus:ring-[#ecd098]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[#c0cbd7] uppercase tracking-wider mb-1">
                      Primitiva del Motor
                    </label>
                    <select
                      value={primitiva}
                      onChange={(e) => setPrimitiva(e.target.value)}
                      className="w-full px-3 py-2 rounded-[9px] border border-[#52647b] bg-[#1b2737] text-xs font-bold text-[#f3f6fa] [color-scheme:dark] [&>option]:bg-[#1b2737] [&>option]:text-[#f3f6fa] focus:outline-none focus:border-[#ecd098] focus:ring-1 focus:ring-[#ecd098]"
                    >
                      {operaciones.map((op) => (
                        <option key={op.primitiva} value={op.primitiva} className="bg-[#1b2737] text-[#f3f6fa]">
                          {op.nombre}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1.5 text-[11px] text-[#ecd098] italic">
                      {operaciones.find((o) => o.primitiva === primitiva)?.descripcion || ''}
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#c0cbd7] uppercase tracking-wider mb-2">
                      Permitido vincular en
                    </label>
                    <div className="flex items-center gap-4 pt-1">
                      <label className="flex items-center gap-2 text-xs font-semibold text-[#f3f6fa] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permitidoEn.includes('carta')}
                          onChange={() => togglePermitidoEn('carta')}
                          className="w-4 h-4 rounded accent-[#ecd098] cursor-pointer"
                        />
                        Cartas de Apoyo
                      </label>
                      <label className="flex items-center gap-2 text-xs font-semibold text-[#f3f6fa] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permitidoEn.includes('personaje')}
                          onChange={() => togglePermitidoEn('personaje')}
                          className="w-4 h-4 rounded accent-[#ecd098] cursor-pointer"
                        />
                        Personajes de Corte
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#c0cbd7] uppercase tracking-wider mb-1">
                    Descripción del Efecto
                  </label>
                  <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    rows={2}
                    placeholder="Explica qué efecto produce esta acción en el reino y las variables..."
                    className="w-full px-3 py-2 rounded-[9px] border border-[#52647b] bg-[#1b2737] text-xs text-[#f3f6fa] focus:outline-none focus:border-[#ecd098] focus:ring-1 focus:ring-[#ecd098] leading-relaxed resize-none"
                  />
                </div>

                <div className="flex items-center gap-2.5 pt-2 border-t border-[#364454]">
                  <input
                    type="checkbox"
                    id="chk_activo"
                    checked={activo}
                    onChange={(e) => setActivo(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#ecd098] cursor-pointer"
                  />
                  <label htmlFor="chk_activo" className="text-xs font-semibold text-[#f3f6fa] cursor-pointer">
                    Acción activa y disponible en editores de cartas y personajes
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
                  <span>{guardando ? 'Guardando...' : esEdicion ? 'Actualizar Acción' : 'Crear Acción'}</span>
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
                  Referencias de Acción: <span className="font-mono text-[#ecd098]">{accionUsosId}</span>
                </h3>
                <p className="text-xs text-[#c0cbd7] mt-0.5">Elementos que utilizan esta acción en sus efectos.</p>
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
              ) : (
                <>
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#ecd098] mb-2">
                      Cartas ({usosData.cartas?.length || 0})
                    </h4>
                    {usosData.cartas?.length === 0 ? (
                      <p className="text-xs text-[#c0cbd7] italic">Ninguna carta vincula esta acción.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {usosData.cartas.map((c) => (
                          <div key={c._id || c.id} className="p-2 rounded-[8px] bg-[#1b2737] border border-[#52647b]/40 text-xs flex justify-between">
                            <span className="font-bold text-[#f3f6fa]">{c.nombre}</span>
                            <span className="font-mono text-[10px] text-[#c0cbd7]">{c._id || c.id}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#364454]">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#ecd098] mb-2">
                      Personajes ({usosData.personajes?.length || 0})
                    </h4>
                    {usosData.personajes?.length === 0 ? (
                      <p className="text-xs text-[#c0cbd7] italic">Ningún personaje vincula esta acción.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {usosData.personajes.map((p) => (
                          <div key={p._id || p.id} className="p-2 rounded-[8px] bg-[#1b2737] border border-[#52647b]/40 text-xs flex justify-between">
                            <span className="font-bold text-[#f3f6fa]">{p.nombre}</span>
                            <span className="font-mono text-[10px] text-[#c0cbd7]">{p._id || p.id}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
