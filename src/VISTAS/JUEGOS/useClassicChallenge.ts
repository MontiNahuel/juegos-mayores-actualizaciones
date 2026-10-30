import { useEffect, useRef, useState } from 'react';
import { getActiveProgressStorageKey, getCurrentUserId, saveActiveGameProgress, saveFinalGameAttempt, type ActiveGameProgress, type SaveProgressPayload } from './attemptsService';
import { DEFAULT_GRADE_POINTS, DEFAULT_TIME_GRADES, getClassicResult, type ScoringConfig, type ClassicGameId, type ClassicResult } from './classicScoring';

export interface ClassicCompletion {
  result: ClassicResult | null;
  saving: boolean;
  error: string;
  retry: () => Promise<void>;
}

export function useClassicChallenge(game: ClassicGameId, date: string, running: boolean, config: ScoringConfig = { puntosPorCalificacion: DEFAULT_GRADE_POINTS, escalasTiempoPorJuego: DEFAULT_TIME_GRADES }) {
  const elapsed = useRef(0);
  const hydrated = useRef(false);
  const started = useRef<number | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [result, setResult] = useState<ClassicResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const version = useRef(0);
  const pending = useRef<SaveProgressPayload | null>(null);
  const getSeconds = () => elapsed.current + (started.current === null ? 0 : Math.floor((Date.now() - started.current) / 1000));

  useEffect(() => {
    if (!running || game === 'wordle') return;
    hydrated.current = true;
    started.current = Date.now();
    const tick = setInterval(() => setSeconds(getSeconds()), 1000);
    return () => { elapsed.current = getSeconds(); started.current = null; clearInterval(tick); };
  }, [running, game, date]);

  useEffect(() => {
    const key = getActiveProgressStorageKey(game, date);
    const persistTime = () => {
      if (!hydrated.current || game === 'wordle' || getActiveProgressStorageKey(game, date) !== key) return;
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.status === 'in_progress') void saveActiveGameProgress({ ...saved, timeTakenSeconds: getSeconds(), gameData: { ...saved.gameData, elapsedSeconds: getSeconds() } });
    };
    window.addEventListener('pagehide', persistTime);
    return () => { window.removeEventListener('pagehide', persistTime); persistTime(); };
  }, [game, date]);

  const submit = async () => {
    if (!pending.current || busy.current) return;
    const payload = pending.current;
    const requestVersion = version.current;
    busy.current = true; setSaving(true); setError('');
    try {
      const saved = await saveFinalGameAttempt(payload);
      if (requestVersion !== version.current) return;
      setResult({ grade: saved.grade!, score: saved.score, stars: saved.stars,
        timeTakenSeconds: saved.timeTakenSeconds, awardedPoints: saved.awardedPoints });
      pending.current = null;
    } catch {
      if (requestVersion === version.current) setError('El resultado está guardado en este dispositivo. Reintentá para confirmar tus puntos.');
    } finally {
      busy.current = false;
      if (requestVersion === version.current) setSaving(false);
      if (pending.current && pending.current !== payload) void submit();
    }
  };

  return {
    seconds,
    getSeconds,
    completion: { result, saving, error, retry: submit } satisfies ClassicCompletion,
    restore: (saved: ActiveGameProgress) => {
      version.current++; pending.current = null;
      hydrated.current = true;
      elapsed.current = saved.timeTakenSeconds ?? saved.gameData?.elapsedSeconds ?? saved.gameData?.timeTaken ?? 0;
      setSeconds(elapsed.current);
      if ((saved.status === 'won' || saved.status === 'completed') && (saved.grade || game === 'wordle' || saved.timeTakenSeconds !== undefined || saved.gameData?.elapsedSeconds !== undefined || saved.gameData?.timeTaken !== undefined)) {
        const restored = saved.grade ? { grade: saved.grade, score: saved.score, stars: saved.stars, timeTakenSeconds: game === 'wordle' ? undefined : elapsed.current, awardedPoints: saved.awardedPoints }
          : getClassicResult(game, saved.attempts, elapsed.current, config);
        setResult(restored);
        if (saved.synced === false && getCurrentUserId() !== null) {
          pending.current = { ...saved, ...restored };
          void submit();
        }
      }
    },
    complete: (payload: Omit<SaveProgressPayload, 'gameId' | 'date'>) => {
      const calculated = getClassicResult(game, payload.attempts, getSeconds(), config);
      setResult(calculated);
      pending.current = { ...payload, gameId: game, date, ...calculated,
        gameData: { ...payload.gameData, ...(game !== 'wordle' ? { elapsedSeconds: calculated.timeTakenSeconds } : {}) } };
      void submit();
    },
    reset: () => {
      version.current++; setSaving(false);
      elapsed.current = 0; if (started.current !== null) started.current = Date.now();
      setSeconds(0); setResult(null); setError(''); pending.current = null;
    },
  };
}
