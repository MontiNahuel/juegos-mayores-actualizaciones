import { API_URL } from '../config/api';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface TiendaPaquete {
  id: string;
  vidas: number;
  puntos: number;
  popular?: boolean;
  badge?: string | null;
  descuento?: string | null;
}

export type SuscripcionTipo = 'basica' | 'premium';

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
  abrirComprarPista: () => void;
  cerrarComprarPista: () => void;
  abrirMiniTienda: () => void;
  cerrarMiniTienda: () => void;
  consumirVida: () => Promise<boolean>;
  canjearVidas: (paqueteId: string) => Promise<{ success: boolean; message: string }>;
  desbloquearDia: (gameId: string, date: string) => Promise<{ success: boolean; message: string }>;
  isDiaDesbloqueado: (gameId: string, date: string) => boolean;
  recargarEconomia: () => Promise<void>;
  getPuntosParaJuego: (gameId: string) => number;
}

const DEFAULT_PAQUETES: TiendaPaquete[] = [
  { id: 'pack_1', vidas: 1, puntos: 200, popular: false, badge: null, descuento: null },
  { id: 'pack_3', vidas: 3, puntos: 600, popular: true, badge: 'Popular', descuento: null },
  { id: 'pack_5', vidas: 5, puntos: 1000, popular: false, badge: null, descuento: null },
];

const DEFAULT_PUNTOS_POR_JUEGO: Record<string, number> = {
  wordle: 50,
  sopa_letras: 50,
  sudoku: 60,
  crucigrama: 70,
  narrativo: 80,
};

const GUEST_ECONOMY_KEY = 'asistodo_guest_economy';

const PlayerEconomyContext = createContext<PlayerEconomyContextType | undefined>(undefined);

function getAuthToken(): string | null {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
}

export const PlayerEconomyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vidas, setVidas] = useState<number>(5);
  const [puntos, setPuntos] = useState<number>(0);
  const [costoVidaPuntos, setCostoVidaPuntos] = useState<number>(200);
  const [costoDesbloqueoDiaPuntos, setCostoDesbloqueoDiaPuntos] = useState<number>(100);
  const [suscripcion, setSuscripcion] = useState<SuscripcionTipo>('basica');
  const [diasDesbloqueados, setDiasDesbloqueados] = useState<string[]>([]);
  const [paquetesTienda, setPaquetesTienda] = useState<TiendaPaquete[]>(DEFAULT_PAQUETES);
  const [puntosPorJuego, setPuntosPorJuego] = useState<Record<string, number>>(DEFAULT_PUNTOS_POR_JUEGO);
  const [vidasMaximas, setVidasMaximas] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMiniTiendaOpen, setIsMiniTiendaOpen] = useState<boolean>(false);
  const [isComprarPistaOpen, setIsComprarPistaOpen] = useState(false);
  const abrirComprarPista = useCallback(() => { setIsMiniTiendaOpen(false); setIsComprarPistaOpen(true); }, []);
  const cerrarComprarPista = useCallback(() => setIsComprarPistaOpen(false), []);

  const abrirMiniTienda = useCallback(() => setIsMiniTiendaOpen(true), []);
  const cerrarMiniTienda = useCallback(() => setIsMiniTiendaOpen(false), []);

  // Carga inicial y recarga
  const recargarEconomia = useCallback(async () => {
    setIsLoading(true);
    let configVidasIniciales = 5;

    // 1. Obtener configuración pública de economía
    try {
      const configRes = await fetch(`${API_URL}/api/economy/config`);
      if (configRes.ok) {
        const configData = await configRes.json();
        configVidasIniciales = configData.vidas_iniciales ?? 5;
        setCostoVidaPuntos(configData.costo_vida_puntos ?? 200);
        setCostoDesbloqueoDiaPuntos(configData.costo_desbloqueo_dia_puntos ?? 100);
        if (Array.isArray(configData.paquetes_tienda) && configData.paquetes_tienda.length > 0) {
          setPaquetesTienda(configData.paquetes_tienda);
        }
        if (configData.puntos_por_juego) {
          setPuntosPorJuego(configData.puntos_por_juego);
        }
        setVidasMaximas(configData.vidas_maximas ?? null);
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
          setVidas(userData.vidas);
          setPuntos(userData.puntos);
          setSuscripcion(userData.suscripcion === 'premium' ? 'premium' : 'basica');
          setDiasDesbloqueados(Array.isArray(userData.dias_desbloqueados) ? userData.dias_desbloqueados : []);

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
          setIsLoading(false);
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
        setVidas(typeof guestData.vidas === 'number' ? guestData.vidas : configVidasIniciales);
        setPuntos(typeof guestData.puntos === 'number' ? guestData.puntos : 0);
        setSuscripcion('basica');
        setDiasDesbloqueados([]);
      } else {
        const initialGuest = { vidas: configVidasIniciales, puntos: 0 };
        localStorage.setItem(GUEST_ECONOMY_KEY, JSON.stringify(initialGuest));
        setVidas(configVidasIniciales);
        setPuntos(0);
        setSuscripcion('basica');
        setDiasDesbloqueados([]);
      }
    } catch {
      setVidas(configVidasIniciales);
      setPuntos(0);
      setSuscripcion('basica');
      setDiasDesbloqueados([]);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    recargarEconomia();

    const handleProgressUpdate = () => {
      recargarEconomia();
    };

    window.addEventListener('user_progress_updated', handleProgressUpdate);
    window.addEventListener('storage', handleProgressUpdate);
    return () => {
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
          setVidas(data.vidas);
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
          const errData = await res.json().catch(() => ({}));
          setVidas(errData.vidas ?? 0);
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
    setVidas(nextVidas);
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
  }, [vidas]);

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
          setVidas(data.vidas);
          setPuntos(data.puntos);
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
    const pack = paquetesTienda.find((p) => p.id === paqueteId);
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

    setPuntos(nextPuntos);
    setVidas(nextVidas);

    try {
      const guestData = { vidas: nextVidas, puntos: nextPuntos };
      localStorage.setItem(GUEST_ECONOMY_KEY, JSON.stringify(guestData));
    } catch {}

    window.dispatchEvent(new Event('user_progress_updated'));
    return {
      success: true,
      message: `¡Excelente! Sumaste ${pack.vidas} vidas. Ahora tenés ${nextVidas} vidas.`,
    };
  }, [paquetesTienda, puntos, vidas, vidasMaximas]);

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
          setPuntos(data.puntos);
        }
        const key = `${gameId.toLowerCase().trim()}:${date.trim()}`;
        setDiasDesbloqueados((prev) => (prev.includes(key) ? prev : [...prev, key]));
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
  }, []);

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
        abrirComprarPista,
        cerrarComprarPista,
        abrirMiniTienda,
        cerrarMiniTienda,
        consumirVida,
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

export const usePlayerEconomy = (): PlayerEconomyContextType => {
  const context = useContext(PlayerEconomyContext);
  if (!context) {
    throw new Error('usePlayerEconomy debe ser utilizado dentro de un PlayerEconomyProvider');
  }
  return context;
};

