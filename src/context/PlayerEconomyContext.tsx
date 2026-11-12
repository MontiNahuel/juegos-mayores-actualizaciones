import type { ScoringConfig } from '../VISTAS/JUEGOS/classicScoring';
/* Conecta los juegos con la economía y racha en Redux usando cookies HttpOnly y estado en memoria. */
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store/store';
import {
  actualizarEconomia,
  agregarDiaDesbloqueado,
  resetearEconomia,
  type SuscripcionTipo,
} from '../store/playerEconomySlice';
import { API_URL } from '../config/api';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { pedirPistaConPuntos, type SolicitudPista, type RespuestaPista } from '../services/pistasService';
import {
  clearLegacyAuthStorage,
  fetchAuthSession,
  getSessionUser,
  setSessionUser,
  subscribeSessionUser,
} from '../VISTAS/AUTH/sessionStore';

export interface CompraPista extends SolicitudPista {
  onRecibir: (pista: RespuestaPista) => void;
}

export type { SuscripcionTipo };

export interface PlayerEconomyContextType extends ScoringConfig {
  isAuthenticated: boolean;
  puntos: number;
  racha: number;
  rachaUltimaFecha: string | null;
  rachaHoyIngresada: boolean;
  costoPistaPuntos: number;
  costoDesbloqueoDiaPuntos: number;
  suscripcion: SuscripcionTipo;
  diasDesbloqueados: string[];
  puntosPorJuego: Record<string, number>;
  isLoading: boolean;
  isComprarPistaOpen: boolean;
  abrirComprarPista: (solicitud: CompraPista) => void;
  comprarPista: () => Promise<void>;
  cerrarComprarPista: () => void;
  desbloquearDia: (gameId: string, date: string) => Promise<{ success: boolean; message: string }>;
  isDiaDesbloqueado: (gameId: string, date: string) => boolean;
  recargarEconomia: () => Promise<void>;
  getPuntosParaJuego: (gameId: string) => number;
}

const PlayerEconomyContext = createContext<PlayerEconomyContextType | undefined>(undefined);

// Conecta el saldo y la racha de Redux con los juegos sin guardar sesión en localStorage.
export const PlayerEconomyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    puntosPorCalificacion,
    escalasTiempoPorJuego,
    puntos,
    racha,
    rachaUltimaFecha,
    rachaHoyIngresada,
    costoPistaPuntos,
    costoDesbloqueoDiaPuntos,
    suscripcion,
    diasDesbloqueados,
    puntosPorJuego,
    isLoading,
  } = useSelector((state: RootState) => state.playerEconomy);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => getSessionUser() !== null);
  const [solicitudPista, setSolicitudPista] = useState<CompraPista | null>(null);
  const comprandoPista = useRef(false);
  const recargaEnCursoRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    return subscribeSessionUser((user) => {
      setIsAuthenticated(user !== null);
    });
  }, []);

  // Abre la confirmación y conserva la función que entregará la pista al juego.
  const abrirComprarPista = useCallback((solicitud: CompraPista) => {
    if (comprandoPista.current) return;
    setSolicitudPista(solicitud);
  }, []);

  // Cierra la confirmación y descarta la solicitud de pista pendiente.
  const cerrarComprarPista = useCallback(() => {
    setSolicitudPista(null);
  }, []);

  const confirmarSaldo = useCallback((saldo: { puntos: number }) => {
    dispatch(actualizarEconomia({ puntos: saldo.puntos }));
    const user = getSessionUser();
    if (user) {
      setSessionUser({ ...user, puntos: saldo.puntos });
    }
    window.dispatchEvent(
      new CustomEvent('user_progress_updated', {
        detail: { economiaConfirmada: true, puntos: saldo.puntos },
      })
    );
  }, [dispatch]);

  // Compra la pista, actualiza los puntos confirmados y entrega la ayuda al juego.
  const comprarPista = useCallback(async () => {
    if (!solicitudPista || comprandoPista.current) return;
    comprandoPista.current = true;
    const { onRecibir, ...solicitud } = solicitudPista;
    try {
      const resultado = await pedirPistaConPuntos(solicitud);
      confirmarSaldo({ puntos: resultado.puntos_restantes });
      setSolicitudPista(null);
      onRecibir(resultado);
    } finally {
      comprandoPista.current = false;
    }
  }, [solicitudPista, confirmarSaldo]);

  // Carga inicial y recarga deduplicada usando cookie HttpOnly (/api/auth/session + /api/economy/me)
  const recargarEconomia = useCallback(async () => {
    if (recargaEnCursoRef.current) {
      return recargaEnCursoRef.current;
    }

    const tarea = (async () => {
      dispatch(actualizarEconomia({ isLoading: true }));

      const session = await fetchAuthSession();
      if (!session) {
        dispatch(resetearEconomia());
        return;
      }

      dispatch(
        actualizarEconomia({
          racha: session.streak.racha,
          rachaUltimaFecha: session.streak.rachaUltimaFecha,
          rachaHoyIngresada: session.streak.rachaHoyIngresada,
        })
      );

      try {
        const userRes = await fetch(`${API_URL}/api/economy/me`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (userRes.status === 401 || userRes.status === 403) {
          setSessionUser(null);
          dispatch(resetearEconomia());
          return;
        }

        if (userRes.ok) {
          const userData = await userRes.json();
          const rachaActual =
            typeof userData.racha === 'number' ? userData.racha : session.streak.racha;
          const rachaUltima =
            typeof userData.racha_ultima_fecha === 'string'
              ? userData.racha_ultima_fecha
              : session.streak.rachaUltimaFecha;
          const rachaHoy =
            typeof userData.racha_hoy_ingresada === 'boolean'
              ? userData.racha_hoy_ingresada
              : session.streak.rachaHoyIngresada;

          dispatch(
            actualizarEconomia({
              puntos: typeof userData.puntos === 'number' ? userData.puntos : 0,
              racha: rachaActual,
              rachaUltimaFecha: rachaUltima,
              rachaHoyIngresada: rachaHoy,
              suscripcion: userData.suscripcion === 'premium' ? 'premium' : 'basica',
              diasDesbloqueados: Array.isArray(userData.dias_desbloqueados)
                ? userData.dias_desbloqueados
                : [],
              costoPistaPuntos:
                typeof userData.costo_pista_puntos === 'number'
                  ? userData.costo_pista_puntos
                  : 20,
              isLoading: false,
            })
          );
          return;
        }
      } catch (e) {
        console.warn('Error al obtener economía de usuario autenticado:', e);
      }

      dispatch(actualizarEconomia({ isLoading: false }));
    })();

    recargaEnCursoRef.current = tarea;
    try {
      await tarea;
    } finally {
      recargaEnCursoRef.current = null;
    }
  }, [dispatch]);

  useEffect(() => {
    clearLegacyAuthStorage();
    void recargarEconomia();

    const handleProgressUpdate = (event: Event) => {
      if (event instanceof CustomEvent && event.detail?.economiaConfirmada) {
        if (Number.isFinite(event.detail.puntos)) {
          dispatch(actualizarEconomia({ puntos: event.detail.puntos }));
        }
        return;
      }
      void recargarEconomia();
    };

    window.addEventListener('user_progress_updated', handleProgressUpdate);
    return () => {
      window.removeEventListener('user_progress_updated', handleProgressUpdate);
    };
  }, [recargarEconomia, dispatch]);

  // Verificar si un día histórico está desbloqueado
  const isDiaDesbloqueado = useCallback(
    (gameId: string, date: string): boolean => {
      if (suscripcion === 'premium') return true;
      const cleanGame = gameId.toLowerCase().trim();
      const cleanDate = date.trim();
      const key = `${cleanGame}:${cleanDate}`;
      return diasDesbloqueados.includes(key);
    },
    [suscripcion, diasDesbloqueados]
  );

  // Desbloquear un día histórico con puntos
  const desbloquearDia = useCallback(
    async (gameId: string, date: string): Promise<{ success: boolean; message: string }> => {
      if (!getSessionUser()) {
        return {
          success: false,
          message: 'Debes iniciar sesión para desbloquear desafíos de días anteriores.',
        };
      }

      try {
        const res = await fetch(`${API_URL}/api/economy/unlock-day`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ game_id: gameId, date }),
        });

        if (res.status === 401) {
          setSessionUser(null);
          dispatch(resetearEconomia());
          return {
            success: false,
            message: 'Tu sesión expiró. Volvé a iniciar sesión para continuar.',
          };
        }

        const data = await res.json();
        if (res.ok && data.success) {
          if (typeof data.puntos === 'number') {
            confirmarSaldo({ puntos: data.puntos });
          }
          const key = `${gameId.toLowerCase().trim()}:${date.trim()}`;
          dispatch(agregarDiaDesbloqueado(key));
          return {
            success: true,
            message: data.message || '¡Desafío desbloqueado exitosamente!',
          };
        }
        return {
          success: false,
          message: data.detail || 'No se pudo desbloquear el desafío. Verificá tus puntos.',
        };
      } catch {
        return {
          success: false,
          message: 'Error de conexión con el servidor al intentar desbloquear el desafío.',
        };
      }
    },
    [dispatch, confirmarSaldo]
  );

  // Devuelve cuántos puntos entrega ese juego al completarlo.
  const getPuntosParaJuego = useCallback(
    (gameId: string): number => {
      return puntosPorJuego[gameId] ?? 50;
    },
    [puntosPorJuego]
  );

  return (
    <PlayerEconomyContext.Provider
      value={{
        isAuthenticated,
        puntos,
        racha,
        rachaUltimaFecha,
        rachaHoyIngresada,
        costoPistaPuntos,
        puntosPorCalificacion,
        escalasTiempoPorJuego,
        costoDesbloqueoDiaPuntos,
        suscripcion,
        diasDesbloqueados,
        puntosPorJuego,
        isLoading,
        isComprarPistaOpen: solicitudPista !== null,
        abrirComprarPista,
        comprarPista,
        cerrarComprarPista,
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

// Entrega el saldo, racha y acciones de economía al componente que los necesita.
export const usePlayerEconomy = (): PlayerEconomyContextType => {
  const context = useContext(PlayerEconomyContext);
  if (!context) {
    throw new Error('usePlayerEconomy debe ser utilizado dentro de un PlayerEconomyProvider');
  }
  return context;
};
