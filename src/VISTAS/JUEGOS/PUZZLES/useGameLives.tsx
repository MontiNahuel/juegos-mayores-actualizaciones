/**
 * Lógica de vidas conservada exclusivamente para Puzzles.
 * Está desconectada de Wordle, Sudoku, Sopa de letras y Crucigrama.
 * Sus modales de desafío completado siguen activos e independientes de las vidas.
 */
import { useEffect, useRef, useState } from 'react';
import { usePlayerEconomy } from '../../../context/PlayerEconomyContext';
import { getActiveProgressStorageKey, saveActiveGameProgress } from '../attemptsService';
import MiniTiendaModal from '../../COMPONENTS/MODALS/MiniTiendaModal';

export const GAME_LIVES = 4;
export const REFILL_COST = 50;

// Cada llamada pertenece a una partida; no comparte vidas con otros juegos.
export function useGameLives(gameId: string, date: string, onFailed: () => void) {
  const [lives, updateLives] = useState(GAME_LIVES);
  const current = useRef(GAME_LIVES);
  const [refillOpen, setRefillOpen] = useState(false);
  const [declined, setDeclined] = useState(false);
  const buying = useRef(false);
  const closedDuringPurchase = useRef(false);
  useEffect(/* Sincroniza este efecto cuando cambian los datos de los que depende. */ () => {
    const key = getActiveProgressStorageKey(gameId, date);
    // Marca la partida como perdida al salir si ya no quedaban vidas.
    const finalizar = () => {
      if (current.current !== 0 || getActiveProgressStorageKey(gameId, date) !== key) return;
      const raw = localStorage.getItem(key);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.status !== 'won' && saved.status !== 'completed') void saveActiveGameProgress({ ...saved, status: 'failed' });
      }
    };
    window.addEventListener('pagehide', finalizar);
    return /* Libera los recursos de este efecto cuando deja de usarse. */ () => { window.removeEventListener('pagehide', finalizar); finalizar(); };
  }, [gameId, date]);
  const { gastarPuntos } = usePlayerEconomy();
  // Actualiza las vidas de esta partida y las mantiene dentro del límite.
  const setLives = (value: number) => {
    current.current = Number.isFinite(value) ? Math.max(0, Math.min(GAME_LIVES, value)) : GAME_LIVES;
    updateLives(current.current);
  };
  useEffect(/* Sincroniza este efecto cuando cambian los datos de los que depende. */ () => {
    if (lives === 0 && !declined) setRefillOpen(true);
  }, [lives, declined]);
  // Cierra la recarga y termina la partida si ya no quedan vidas.
  const closeRefill = () => {
    setRefillOpen(false);
    if (buying.current) { closedDuringPurchase.current = true; return; }
    if (current.current === 0) { setDeclined(true); onFailed(); }
  };
  // Restaura las vidas iniciales y cierra la recarga de esta partida.
  const reset = () => {
    setLives(GAME_LIVES); setDeclined(false); setRefillOpen(false);
  };
  return {
    lives, setLives,
    // Restaura las vidas guardadas y conserva si la partida ya había terminado.
    hydrate: (value: number, failed = false) => { setDeclined(failed); setLives(value); },
    // Resta una vida de esta partida y avisa si se puede continuar.
    consumeLife: () => { setLives(current.current - 1); return current.current > 0; },
    reset,
    // Da por terminada la partida y evita volver a ofrecer la recarga.
    finish: () => { setDeclined(true); setRefillOpen(false); },
    // Abre la recarga si faltan vidas y el jugador todavía puede aceptarla.
    openRefill: () => { if (current.current === 0 && !declined) setRefillOpen(true); },
    modal: <MiniTiendaModal isOpen={refillOpen} onClose={closeRefill}
      recarga={{ vidas: lives, costo: REFILL_COST, /* Confirma la recarga de vidas y muestra si no pudo completarse. */ onRestaurar: async () => {
        if (buying.current) return;
        buying.current = true; closedDuringPurchase.current = false;
        try {
          if (current.current === 0) {
            await gastarPuntos(REFILL_COST);
            setLives(GAME_LIVES);
          }
          const raw = localStorage.getItem(getActiveProgressStorageKey(gameId, date));
          if (raw) {
            const saved = JSON.parse(raw);
            await saveActiveGameProgress({ ...saved, gameId, date,
              status: 'in_progress', gameData: { ...saved.gameData, lives: GAME_LIVES } }, true);
          }
          reset();
        }
        catch (error) {
          if (closedDuringPurchase.current && current.current === 0) { setDeclined(true); onFailed(); }
          throw new Error(current.current > 0 ? 'Tus vidas ya fueron restauradas. Reintentá guardar sin volver a pagar.' : error instanceof Error ? error.message : 'No se pudo restaurar las vidas.');
        } finally { buying.current = false; }
      } }} />,
  };
}
