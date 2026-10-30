/* Permite buscar un jugador y ajustar vidas, puntos o suscripción. */
import { useState, useEffect } from 'react';
import {
  CoinsIcon,
  HeartIcon,
  SearchIcon,
  CheckIcon,
  AlertTriangleIcon,
  XIcon,
  RefreshIcon,
  UserIcon,
} from './Icons';
import { OPERADOR_STORAGE_KEY } from './LoginSistemas';

// Permite buscar un jugador y ajustar vidas, puntos o suscripción.
export default function ModalAsignarEconomia({
  abierto,
  onCerrar,
  usuarioInicial = null,
  onActualizado,
}) {
  const [identificador, setIdentificador] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [aplicando, setAplicando] = useState(false);
  const [cambiandoSub, setCambiandoSub] = useState(false);
  const [usuarioEncontrado, setUsuarioEncontrado] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [exitoMsg, setExitoMsg] = useState('');

  // Modo: 'sumar' o 'fijar'
  const [modo, setModo] = useState('sumar');
  const [vidasValor, setVidasValor] = useState(5);
  const [puntosValor, setPuntosValor] = useState(100);

  // Arma las cabeceras con la sesión para consultar el panel.
  const getAuthHeaders = () => {
    const sesion = localStorage.getItem(OPERADOR_STORAGE_KEY);
    const token = sesion ? JSON.parse(sesion)?.token : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  useEffect(/* Sincroniza este efecto cuando cambian los datos de los que depende. */ () => {
    if (abierto) {
      setErrorMsg('');
      setExitoMsg('');
      if (usuarioInicial) {
        const iden = usuarioInicial.codigoAcceso || usuarioInicial.codigo_acceso || usuarioInicial.email || String(usuarioInicial.id);
        setIdentificador(iden);
        setUsuarioEncontrado({
          id: usuarioInicial.id,
          name: usuarioInicial.name || 'Usuario',
          email: usuarioInicial.email,
          codigoAcceso: usuarioInicial.codigoAcceso || usuarioInicial.codigo_acceso,
          vidas: usuarioInicial.vidas ?? 5,
          puntos: usuarioInicial.puntos ?? 0,
          suscripcion: usuarioInicial.suscripcion || 'basica',
        });
      } else {
        setIdentificador('');
        setUsuarioEncontrado(null);
      }
    }
  }, [abierto, usuarioInicial]);

  if (!abierto) return null;

  // Busca al jugador por los datos ingresados en el formulario.
  const handleBuscar = async (e) => {
    if (e) e.preventDefault();
    if (!identificador.trim()) {
      setErrorMsg('Ingresá un email, código PIN o ID para buscar.');
      return;
    }

    setBuscando(true);
    setErrorMsg('');
    setExitoMsg('');

    try {
      const res = await fetch(`/api/admin/economy/user/search?identificador=${encodeURIComponent(identificador.trim())}`, {
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        setUsuarioEncontrado(data);
      } else {
        const err = await res.json().catch(/* Maneja el fallo de esta operación. */ () => ({}));
        setErrorMsg(err.detail || 'Usuario no encontrado.');
        setUsuarioEncontrado(null);
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Error al conectar con el servidor.');
    } finally {
      setBuscando(false);
    }
  };

  // Cambia la suscripción del jugador y muestra la respuesta del servidor.
  const handleAlternarSuscripcion = async () => {
    if (!usuarioEncontrado) return;
    const nuevaSub = usuarioEncontrado.suscripcion === 'premium' ? 'basica' : 'premium';
    setCambiandoSub(true);
    setErrorMsg('');
    setExitoMsg('');

    try {
      const res = await fetch(`/api/admin/usuario/${usuarioEncontrado.id}/suscripcion`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ suscripcion: nuevaSub }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setExitoMsg(data.message || `Suscripción actualizada a ${nuevaSub}.`);
        setUsuarioEncontrado(/* Actualiza usuario encontrado a partir del valor anterior. */ (prev) => ({
          ...prev,
          suscripcion: nuevaSub,
        }));
        if (onActualizado) {
          onActualizado({
            ...usuarioEncontrado,
            suscripcion: nuevaSub,
          });
        }
      } else {
        setErrorMsg(data.detail || 'No se pudo actualizar la suscripción.');
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Error de conexión al actualizar la suscripción.');
    } finally {
      setCambiandoSub(false);
    }
  };

  // Confirma el ajuste de saldo del jugador seleccionado.
  const handleAplicar = async (e) => {
    e.preventDefault();
    if (!usuarioEncontrado && !identificador.trim()) {
      setErrorMsg('Primero buscá o seleccioná un usuario.');
      return;
    }

    setAplicando(true);
    setErrorMsg('');
    setExitoMsg('');

    const targetIden = usuarioEncontrado?.codigoAcceso || usuarioEncontrado?.email || identificador.trim();

    const payload = {
      identificador: targetIden,
    };

    if (modo === 'sumar') {
      if (vidasValor !== 0) payload.vidas_sumar = parseInt(vidasValor, 10) || 0;
      if (puntosValor !== 0) payload.puntos_sumar = parseInt(puntosValor, 10) || 0;
    } else {
      payload.vidas_set = Math.max(0, parseInt(vidasValor, 10) || 0);
      payload.puntos_set = Math.max(0, parseInt(puntosValor, 10) || 0);
    }

    try {
      const res = await fetch('/api/admin/economy/user/adjust', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setExitoMsg(data.message || '¡Vidas y puntos actualizados correctamente!');
        setUsuarioEncontrado(/* Actualiza usuario encontrado a partir del valor anterior. */ (prev) => ({
          ...prev,
          id: data.user_id,
          name: data.name,
          email: data.email,
          codigoAcceso: data.codigoAcceso,
          vidas: data.vidas,
          puntos: data.puntos,
          suscripcion: data.suscripcion || prev?.suscripcion || 'basica',
        }));
        if (onActualizado) onActualizado(data);
      } else {
        setErrorMsg(data.detail || 'No se pudo aplicar la asignación.');
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Error de conexión al aplicar la asignación.');
    } finally {
      setAplicando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabecera */}
        <header className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 shadow-xs">
              <HeartIcon size={20} className="fill-rose-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 leading-tight">
                  Gestión de Vidas, Puntos & Suscripción
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full">
                  Torre de Control
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Acreditá vidas/puntos o cambiá la suscripción inmediatamente por PIN o correo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
            title="Cerrar ventana"
          >
            <XIcon size={20} />
          </button>
        </header>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Mensajes de Feedback */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800 font-medium">
              <AlertTriangleIcon size={16} className="text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {exitoMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-medium">
              <CheckIcon size={16} className="text-emerald-600 flex-shrink-0" />
              <span>{exitoMsg}</span>
            </div>
          )}

          {/* Formulario de Búsqueda de Usuario */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Identificador del Usuario (Email, Código PIN o ID)
            </label>
            <form onSubmit={handleBuscar} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Ej: 123456 o alumno@asistodo.com.ar"
                  value={identificador}
                  onChange={/* Responde a change desde este control. */ (e) => setIdentificador(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#002B5E] focus:outline-hidden font-medium text-slate-900"
                />
              </div>
              <button
                type="submit"
                disabled={buscando || !identificador.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {buscando ? <RefreshIcon size={14} className="animate-spin" /> : <SearchIcon size={14} />}
                <span>Buscar</span>
              </button>
            </form>
          </div>

          {/* Tarjeta de Usuario Encontrado */}
          {usuarioEncontrado && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                    <UserIcon size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-900 leading-tight">
                      {usuarioEncontrado.name}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      {usuarioEncontrado.email || 'Sin correo registrado'}
                    </div>
                  </div>
                </div>

                {usuarioEncontrado.codigoAcceso && (
                  <span className="text-xs font-mono font-bold bg-white border border-slate-300 px-2.5 py-1 rounded-lg text-slate-800 shadow-2xs">
                    PIN: {usuarioEncontrado.codigoAcceso}
                  </span>
                )}
              </div>

              {/* Suscripción actual y botón para alternar */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-2xs">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nivel de Suscripción</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {usuarioEncontrado.suscripcion === 'premium' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                        👑 Suscripción Premium
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        Suscripción Básica
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={cambiandoSub}
                  onClick={handleAlternarSuscripcion}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer border shadow-xs ${
                    usuarioEncontrado.suscripcion === 'premium'
                      ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                      : 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600'
                  }`}
                >
                  {cambiandoSub
                    ? 'Actualizando...'
                    : usuarioEncontrado.suscripcion === 'premium'
                    ? 'Bajar a Básica'
                    : 'Ascender a Premium 👑'}
                </button>
              </div>

              {/* Saldo actual de vidas y puntos */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-white border border-rose-200 rounded-xl p-2.5 flex items-center gap-2.5 shadow-2xs">
                  <HeartIcon size={20} className="text-rose-500 fill-rose-500" />
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vidas Actuales</div>
                    <div className="text-base font-black text-rose-700">{usuarioEncontrado.vidas}</div>
                  </div>
                </div>

                <div className="bg-white border border-amber-200 rounded-xl p-2.5 flex items-center gap-2.5 shadow-2xs">
                  <CoinsIcon size={20} className="text-amber-500" />
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Puntos Actuales</div>
                    <div className="text-base font-black text-amber-700">{usuarioEncontrado.puntos} pts</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Formulario de Asignación */}
          <form id="form-asignar-economia" onSubmit={handleAplicar} className="space-y-4">
            
            {/* Selector de Modo: Sumar vs Fijar */}
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={/* Responde a click desde este control. */ () => setModo('sumar')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  modo === 'sumar'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sumar al saldo actual (+)
              </button>
              <button
                type="button"
                onClick={/* Responde a click desde este control. */ () => setModo('fijar')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  modo === 'fijar'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Fijar saldo exacto (=)
              </button>
            </div>

            {/* Inputs de Vidas y Puntos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Vidas */}
              <div className="bg-rose-50/40 border border-rose-200/80 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                    <HeartIcon size={14} className="text-rose-500 fill-rose-500" />
                    <span>{modo === 'sumar' ? 'Vidas a Sumar' : 'Fijar Vidas'}</span>
                  </label>
                  <span className="text-[10px] font-bold text-rose-600">
                    {modo === 'sumar' && vidasValor > 0 ? `+${vidasValor}` : vidasValor}
                  </span>
                </div>

                <input
                  type="number"
                  value={vidasValor}
                  onChange={/* Responde a change desde este control. */ (e) => setVidasValor(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-rose-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />

                {/* Presets rápidos */}
                <div className="flex items-center gap-1.5 pt-1">
                  {[1, 5, 10].map(/* Prepara el resultado de cada elemento. */ (v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={/* Responde a click desde este control. */ () => setVidasValor(v)}
                      className="flex-1 py-1 text-[11px] font-bold bg-white hover:bg-rose-100 text-rose-800 rounded-lg border border-rose-200 transition cursor-pointer"
                    >
                      {modo === 'sumar' ? `+${v}` : v}
                    </button>
                  ))}
                  {modo === 'fijar' && (
                    <button
                      type="button"
                      onClick={/* Responde a click desde este control. */ () => setVidasValor(0)}
                      className="px-2 py-1 text-[11px] font-bold bg-white hover:bg-rose-100 text-rose-800 rounded-lg border border-rose-200 transition cursor-pointer"
                    >
                      0
                    </button>
                  )}
                </div>
              </div>

              {/* Puntos */}
              <div className="bg-amber-50/40 border border-amber-200/80 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <CoinsIcon size={14} className="text-amber-600" />
                    <span>{modo === 'sumar' ? 'Puntos a Sumar' : 'Fijar Puntos'}</span>
                  </label>
                  <span className="text-[10px] font-bold text-amber-700">
                    {modo === 'sumar' && puntosValor > 0 ? `+${puntosValor}` : puntosValor} pts
                  </span>
                </div>

                <input
                  type="number"
                  value={puntosValor}
                  onChange={/* Responde a change desde este control. */ (e) => setPuntosValor(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-amber-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />

                {/* Presets rápidos */}
                <div className="flex items-center gap-1.5 pt-1">
                  {[50, 100, 500].map(/* Prepara el resultado de cada elemento. */ (pts) => (
                    <button
                      key={pts}
                      type="button"
                      onClick={/* Responde a click desde este control. */ () => setPuntosValor(pts)}
                      className="flex-1 py-1 text-[11px] font-bold bg-white hover:bg-amber-100 text-amber-800 rounded-lg border border-amber-200 transition cursor-pointer"
                    >
                      {modo === 'sumar' ? `+${pts}` : pts}
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </form>

        </div>

        {/* Footer */}
        <footer className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="text-[11px] text-slate-500 font-medium">
            Los cambios se reflejan al instante en la partida del jugador.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCerrar}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="submit"
              form="form-asignar-economia"
              disabled={aplicando || (!usuarioEncontrado && !identificador.trim())}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#002B5E] hover:bg-slate-900 rounded-xl transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              {aplicando ? (
                <>
                  <RefreshIcon size={14} className="animate-spin" />
                  <span>Aplicando...</span>
                </>
              ) : (
                <>
                  <CheckIcon size={14} />
                  <span>Aplicar Asignación</span>
                </>
              )}
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
}
