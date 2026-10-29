/* Conecta los juegos con la economía de Redux y maneja las compras y las ventanas de la tienda. */
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store/store';
import { actualizarEconomia, agregarDiaDesbloqueado } from '../store/playerEconomySlice';
import { API_URL } from '../config/api';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ErrorPista, pedirPistaConVida, type SolicitudPista, type RespuestaPista } from '../services/pistasService';

export interface CompraPista extends SolicitudPista {
  vidasDisponibles?: number;
  onSinVidas?: () => void;
  onRecibir: (pista: RespuestaPista) => void;
}

export type { TiendaPaquete, SuscripcionTipo } from '../store/playerEconomySlice';
import type { TiendaPaquete, SuscripcionTipo } from '../store/playerEconomySlice';
export interface PlayerEconomyContextType {
  vidas: number;
  puntos: number;
  costoVidaPuntos: number;
  costoDesbloqueoDiaPuntos: number;
  suscripcion: SuscripcionTipo;
  diasDesbloqueados: string[];
  paquetesTienda: TiendaPaquete[];
  puntosPorJuego: Record<string, number>;
  vidasMaximas: number | null;
  isLoading: boolean;
  isMiniTiendaOpen: boolean;
  isComprarPistaOpen: boolean;
  vidasParaPista: number;
  recargarVidasPista: () => void;
  abrirComprarPista: (solicitud: CompraPista) => void;
  comprarPista: () => Promise<void>;
  cerrarComprarPista: () => void;
  abrirMiniTienda: () => void;
  cerrarMiniTienda: () => void;
  consumirVida: () => Promise<boolean>;
  gastarPuntos: (cantidad: number) => Promise<void>;
  canjearVidas: (paqueteId: string) => Promise<{ success: boolean; message: string }>;
  desbloquearDia: (gameId: string, date: string) => Promise<{ success: boolean; message: string }>;
  isDiaDesbloqueado: (gameId: string, date: string) => boolean;
  recargarEconomia: () => Promise<void>;
  getPuntosParaJuego: (gameId: string) => number;
}

const GUEST_ECONOMY_KEY = 'asistodo_guest_economy';

const PlayerEconomyContext = createContext<PlayerEconomyContextType | undefined>(undefined);

// Busca el token de la sesión sin fallar si el navegador no deja leerlo.
function getAuthToken(): string | null {
  try {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  } catch {
    return null;
  }
}

// Conecta el saldo de Redux con los juegos y mantiene locales las ventanas y las compras en curso.
export const PlayerEconomyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { vidas, puntos, costoVidaPuntos, costoDesbloqueoDiaPuntos, suscripcion,
    diasDesbloqueados, paquetesTienda, puntosPorJuego, vidasMaximas, isLoading,
  } = useSelector(/* Lee de Redux el dato compartido que necesita la pantalla. */ (state: RootState) => state.playerEconomy);
  const [isMiniTiendaOpen, setIsMiniTiendaOpen] = useState<boolean>(false);
  const [isComprarPistaOpen, setIsComprarPistaOpen] = useState(false);
  const [solicitudPista, setSolicitudPista] = useState<CompraPista | null>(null);
  const comprandoPista = useRef(false);
  // Abre la confirmación y conserva la función que entregará la pista al juego.
  const abrirComprarPista = useCallback((solicitud: CompraPista) => {
    if (comprandoPista.current) return;
    setSolicitudPista(solicitud); setIsMiniTiendaOpen(false); setIsComprarPistaOpen(true);
  }, []);
  // Cierra la confirmación y descarta la solicitud de pista pendiente.
  const cerrarComprarPista = useCallback(() => {
    setIsComprarPistaOpen(false); setSolicitudPista(null);
  }, []);

  // Compra la pista, actualiza las vidas confirmadas y entrega la ayuda al juego.
  const comprarPista = useCallback(async () => {
    if (!solicitudPista || comprandoPista.current) return;
    comprandoPista.current = true;
    const { onRecibir, vidasDisponibles, onSinVidas, ...solicitud } = solicitudPista;
    try {
      const resultado = await pedirPistaConVida(solicitud);
      dispatch(actualizarEconomia({ vidas: resultado.vidas_restantes }));
      for (const clave of ['usuario', 'user']) {
        try {
          const raw = localStorage.getItem(clave);
          if (raw) localStorage.setItem(clave, JSON.stringify({ ...JSON.parse(raw), vidas: resultado.vidas_restantes }));
        } catch { /* El saldo visible sigue confirmado por el servidor. */ }
      }
      window.dispatchEvent(new Event('user_progress_updated'));
      onRecibir(resultado);
      setIsComprarPistaOpen(false); setSolicitudPista(null);
    } catch (error) {
      if (error instanceof ErrorPista && error.status === 400) {
        setIsComprarPistaOpen(false); setSolicitudPista(null);
        if (onSinVidas) onSinVidas(); else setIsMiniTiendaOpen(true);
      }
      throw error;
    } finally { comprandoPista.current = false; }
  }, [solicitudPista, dispatch]);

  // Abre la tienda para que el jugador pueda reponer vidas.
  const abrirMiniTienda = useCallback(() => setIsMiniTiendaOpen(true), []);
  // Cierra la tienda y deja al jugador en su pantalla actual.
  const cerrarMiniTienda = useCallback(() => setIsMiniTiendaOpen(false), []);

  // Carga inicial y recarga
  const recargarEconomia = useCallback(async () => {
    dispatch(actualizarEconomia({ isLoading: true }));
    let configVidasIniciales = 5;

    // 1. Obtener configuración pública de economía
    try {
      const configRes = await fetch(`${API_URL}/api/economy/config`);
      if (configRes.ok) {
        const configData = await configRes.json();
        configVidasIniciales = configData.vidas_iniciales ?? 5;
        dispatch(actualizarEconomia({ costoVidaPuntos: configData.costo_vida_puntos ?? 200, costoDesbloqueoDiaPuntos: configData.costo_desbloqueo_dia_puntos ?? 100 }));
        if (Array.isArray(configData.paquetes_tienda) && configData.paquetes_tienda.length > 0) {
          dispatch(actualizarEconomia({ paquetesTienda: configData.paquetes_tienda }));
        }
        if (configData.puntos_por_juego) {
          dispatch(actualizarEconomia({ puntosPorJuego: configData.puntos_por_juego }));
        }
        dispatch(actualizarEconomia({ vidasMaximas: configData.vidas_maximas ?? null }));
      }
    } catch (e) {
      console.warn('No se pudo obtener config de economía:', e);
    }

    // 2. Si el usuario está autenticado, sincronizar desde el backend
    const token = getAuthToken();
    if (token) {
      try {
        const userRes = await fetch(`${API_URL}/api/economy/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          dispatch(actualizarEconomia({ vidas: userData.vidas, puntos: userData.puntos, suscripcion: userData.suscripcion === 'premium' ? 'premium' : 'basica', diasDesbloqueados: Array.isArray(userData.dias_desbloqueados) ? userData.dias_desbloqueados : [] }));

          // Actualizar snapshot en localStorage usuario
          try {
            const rawUser = localStorage.getItem('usuario') || localStorage.getItem('user');
            if (rawUser) {
              const u = JSON.parse(rawUser);
              u.vidas = userData.vidas;
              u.puntos = userData.puntos;
              u.suscripcion = userData.suscripcion;
              u.dias_desbloqueados = userData.dias_desbloqueados;
              localStorage.setItem('usuario', JSON.stringify(u));
              localStorage.setItem('user', JSON.stringify(u));
            }
          } catch {}
          dispatch(actualizarEconomia({ isLoading: false }));
          return;
        }
      } catch (e) {
        console.warn('Error al obtener economía de usuario autenticado:', e);
      }
    }

    // 3. Si es usuario invitado (sin token), gestionar en localStorage
    try {
      const rawGuest = localStorage.getItem(GUEST_ECONOMY_KEY);
      if (rawGuest) {
        const guestData = JSON.parse(rawGuest);
        dispatch(actualizarEconomia({ vidas: typeof guestData.vidas === 'number' ? guestData.vidas : configVidasIniciales, puntos: typeof guestData.puntos === 'number' ? guestData.puntos : 0, suscripcion: 'basica', diasDesbloqueados: [] }));
      } else {
        const initialGuest = { vidas: configVidasIniciales, puntos: 0 };
        localStorage.setItem(GUEST_ECONOMY_KEY, JSON.stringify(initialGuest));
        dispatch(actualizarEconomia({ vidas: configVidasIniciales, puntos: 0, suscripcion: 'basica', diasDesbloqueados: [] }));
      }
    } catch {
      dispatch(actualizarEconomia({ vidas: configVidasIniciales, puntos: 0, suscripcion: 'basica', diasDesbloqueados: [] }));
    }

    dispatch(actualizarEconomia({ isLoading: false }));
  }, [dispatch]);

  useEffect(/* Sincroniza este efecto cuando cambian los datos de los que depende. */ () => {
    recargarEconomia();

    // Vuelve a leer el progreso cuando otra pantalla o pestaña avisa que cambió.
    const handleProgressUpdate = () => {
      recargarEconomia();
    };

    window.addEventListener('user_progress_updated', handleProgressUpdate);
    window.addEventListener('storage', handleProgressUpdate);
    return /* Libera los recursos de este efecto cuando deja de usarse. */ () => {
      window.removeEventListener('user_progress_updated', handleProgressUpdate);
      window.removeEventListener('storage', handleProgressUpdate);
    };
  }, [recargarEconomia]);

  // Consumir vida global
  const consumirVida = useCallback(async (): Promise<boolean> => {
    const token = getAuthToken();

    // Si tiene token, consumir en backend
    if (token) {
      try {
        const res = await fetch(`${API_URL}/api/economy/consume-life`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ motivo: 'error_juego' }),
        });

        if (res.ok) {
          const data = await res.json();
          dispatch(actualizarEconomia({ vidas: data.vidas }));
          try {
            const rawUser = localStorage.getItem('usuario') || localStorage.getItem('user');
            if (rawUser) {
              const u = JSON.parse(rawUser);
              u.vidas = data.vidas;
              localStorage.setItem('usuario', JSON.stringify(u));
              localStorage.setItem('user', JSON.stringify(u));
            }
          } catch {}
          window.dispatchEvent(new Event('user_progress_updated'));
          return true;
        } else {
          const errData = await res.json().catch(/* Maneja el fallo de esta operación. */ () => ({}));
          dispatch(actualizarEconomia({ vidas: errData.vidas ?? 0 }));
          setIsMiniTiendaOpen(true);
          return false;
        }
      } catch (e) {
        console.warn('Error consumiendo vida en servidor, aplicando fallback local:', e);
      }
    }

    // Fallback o modo invitado en localStorage
    if (vidas <= 0) {
      setIsMiniTiendaOpen(true);
      return false;
    }

    const nextVidas = Math.max(0, vidas - 1);
    dispatch(actualizarEconomia({ vidas: nextVidas }));
    try {
      const rawGuest = localStorage.getItem(GUEST_ECONOMY_KEY);
      const guestData = rawGuest ? JSON.parse(rawGuest) : { vidas: 5, puntos: 0 };
      guestData.vidas = nextVidas;
      localStorage.setItem(GUEST_ECONOMY_KEY, JSON.stringify(guestData));
    } catch {}

    window.dispatchEvent(new Event('user_progress_updated'));
    if (nextVidas === 0) {
      setIsMiniTiendaOpen(true);
      return false;
    }
    return true;
  }, [vidas, dispatch]);

  // Pide descontar los puntos y guarda el saldo confirmado por el servidor.
  const gastarPuntos = useCallback(async (cantidad: number) => {
    const token = getAuthToken();
    if (!token) throw new Error('Iniciá sesión para restaurar tus vidas.');
    const raw = localStorage.getItem('usuario') || localStorage.getItem('user');
    const usuario = raw ? JSON.parse(raw) : null;
    if (!usuario?.id) throw new Error('No se pudo identificar tu cuenta.');
    if (puntos < cantidad) throw new Error('No tenés suficientes puntos.');
    const res = await fetch(API_URL + '/api/admin/economy/user/adjust', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ identificador: String(usuario.id), puntos_sumar: -cantidad }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(res.status === 403 ? 'El servidor todavía no permite este canje para jugadores.' : data.detail || 'No se pudo confirmar el descuento.');
    dispatch(actualizarEconomia({ puntos: data.puntos }));
    for (const clave of ['usuario', 'user']) {
      const snapshot = localStorage.getItem(clave);
      if (snapshot) localStorage.setItem(clave, JSON.stringify({ ...JSON.parse(snapshot), puntos: data.puntos }));
    }
    window.dispatchEvent(new Event('user_progress_updated'));
  }, [puntos, dispatch]);

  // Canjear vidas en la mini-tienda
  const canjearVidas = useCallback(async (paqueteId: string): Promise<{ success: boolean; message: string }> => {
    const token = getAuthToken();

    if (token) {
      try {
        const res = await fetch(`${API_URL}/api/economy/buy-lives`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ paquete_id: paqueteId }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          dispatch(actualizarEconomia({ vidas: data.vidas, puntos: data.puntos }));
          try {
            const rawUser = localStorage.getItem('usuario') || localStorage.getItem('user');
            if (rawUser) {
              const u = JSON.parse(rawUser);
              u.vidas = data.vidas;
              u.puntos = data.puntos;
              localStorage.setItem('usuario', JSON.stringify(u));
              localStorage.setItem('user', JSON.stringify(u));
            }
          } catch {}
          window.dispatchEvent(new Event('user_progress_updated'));
          return { success: true, message: data.message || `¡Canje exitoso! Tenés ${data.vidas} vidas.` };
        } else {
          return { success: false, message: data.detail || 'No tenés suficientes puntos para este paquete.' };
        }
      } catch (e) {
        return { success: false, message: 'Error de conexión con el servidor.' };
      }
    }

    // Modo invitado local
    const pack = paquetesTienda.find(/* Busca el primer elemento que cumple esta condición. */ (p) => p.id === paqueteId);
    if (!pack) {
      return { success: false, message: 'El paquete seleccionado no existe.' };
    }

    if (puntos < pack.puntos) {
      const faltan = pack.puntos - puntos;
      return {
        success: false,
        message: `Te faltan ${faltan} puntos para este paquete. ¡Seguí jugando para ganar más!`,
      };
    }

    const nextPuntos = puntos - pack.puntos;
    const nextVidas = vidasMaximas ? Math.min(vidasMaximas, vidas + pack.vidas) : vidas + pack.vidas;

    dispatch(actualizarEconomia({ puntos: nextPuntos, vidas: nextVidas }));

    try {
      const guestData = { vidas: nextVidas, puntos: nextPuntos };
      localStorage.setItem(GUEST_ECONOMY_KEY, JSON.stringify(guestData));
    } catch {}

    window.dispatchEvent(new Event('user_progress_updated'));
    return {
      success: true,
      message: `¡Excelente! Sumaste ${pack.vidas} vidas. Ahora tenés ${nextVidas} vidas.`,
    };
  }, [paquetesTienda, puntos, vidas, vidasMaximas, dispatch]);

  // Verificar si un día histórico está desbloqueado
  const isDiaDesbloqueado = useCallback((gameId: string, date: string): boolean => {
    if (suscripcion === 'premium') return true;
    const cleanGame = gameId.toLowerCase().trim();
    const cleanDate = date.trim();
    const key = `${cleanGame}:${cleanDate}`;
    return diasDesbloqueados.includes(key);
  }, [suscripcion, diasDesbloqueados]);

  // Desbloquear un día histórico con puntos
  const desbloquearDia = useCallback(async (gameId: string, date: string): Promise<{ success: boolean; message: string }> => {
    const token = getAuthToken();
    if (!token) {
      return {
        success: false,
        message: 'Debes iniciar sesión para desbloquear desafíos de días anteriores.',
      };
    }

    try {
      const res = await fetch(`${API_URL}/api/economy/unlock-day`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ game_id: gameId, date }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (typeof data.puntos === 'number') {
          dispatch(actualizarEconomia({ puntos: data.puntos }));
        }
        const key = `${gameId.toLowerCase().trim()}:${date.trim()}`;
        dispatch(agregarDiaDesbloqueado(key));
        window.dispatchEvent(new Event('user_progress_updated'));
        return {
          success: true,
          message: data.message || '¡Desafío desbloqueado exitosamente!',
        };
      } else {
        return {
          success: false,
          message: data.detail || 'No se pudo desbloquear el desafío. Verificá tus puntos.',
        };
      }
    } catch (e) {
      return {
        success: false,
        message: 'Error de conexión con el servidor al intentar desbloquear el desafío.',
      };
    }
  }, [dispatch]);

  // Devuelve cuántos puntos entrega ese juego al completarlo.
  const getPuntosParaJuego = useCallback((gameId: string): number => {
    return puntosPorJuego[gameId] ?? 50;
  }, [puntosPorJuego]);

  return (
    <PlayerEconomyContext.Provider
      value={{
        vidas,
        puntos,
        costoVidaPuntos,
        costoDesbloqueoDiaPuntos,
        suscripcion,
        diasDesbloqueados,
        paquetesTienda,
        puntosPorJuego,
        vidasMaximas,
        isLoading,
        isMiniTiendaOpen,
        isComprarPistaOpen,
        vidasParaPista: solicitudPista?.vidasDisponibles ?? vidas,
        recargarVidasPista: solicitudPista?.onSinVidas ?? abrirMiniTienda,
        abrirComprarPista,
        comprarPista,
        cerrarComprarPista,
        abrirMiniTienda,
        cerrarMiniTienda,
        consumirVida,
        gastarPuntos,
        canjearVidas,
        desbloquearDia,
        isDiaDesbloqueado,
        recargarEconomia,
        getPuntosParaJuego,
      }}
    >
      {children}
    </PlayerEconomyContext.Provider>
  );
};

// Entrega el saldo y las acciones de la tienda al componente que los necesita.
export const usePlayerEconomy = (): PlayerEconomyContextType => {
  const context = useContext(PlayerEconomyContext);
  if (!context) {
    throw new Error('usePlayerEconomy debe ser utilizado dentro de un PlayerEconomyProvider');
  }
  return context;
};

