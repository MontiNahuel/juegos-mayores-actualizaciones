import { useClassicChallenge } from '../useClassicChallenge';
/* Maneja las palabras, colorea los aciertos y guarda el resultado de Wordle. */
/* Acá maneja las palabras, colorea los aciertos y guarda el resultado de Wordle. */
import { CompletedModal } from '../../COMPONENTS/MODALS/CompletedModal';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  IonContent,
  IonPage,
  IonTitle,
  IonToolbar,
  IonIcon,
} from '@ionic/react';
import AppNavbar from '../../COMPONENTS/Navbar/AppNavbar';
import { usePlayerEconomy } from '../../../context/PlayerEconomyContext';
import {
  arrowBackOutline,
  refreshOutline,
  chevronDownOutline,
  chevronUpOutline,
  helpCircleOutline,
  closeOutline,
} from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  getActiveGameProgress,
  saveActiveGameProgress,
  clearActiveGameProgress,
} from '../attemptsService';
import { isValidWordleWord } from './wordleDictionary';

// Solución por defecto
const DEFAULT_SOLUTION = 'HOGAR';
const MIN_ROWS = 4;
const WORD_LENGTH = 5;
const MAX_ATTEMPTS = 6;

type LetterStatus = 'correct' | 'present' | 'absent';

interface GuessEvaluation {
  word: string;
  statuses: LetterStatus[];
}

// Evaluación estricta de Wordle (maneja repeticiones de letras)
function evaluateGuess(guess: string, solution: string): LetterStatus[] {
  const result: LetterStatus[] = Array(WORD_LENGTH).fill('absent');
  const solutionArr = solution.split('');
  const guessArr = guess.split('');
  const remainingCounts: Record<string, number> = {};

  // 1ra pasada: coincidencias exactas (verde)
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessArr[i] === solutionArr[i]) {
      result[i] = 'correct';
    } else {
      const letter = solutionArr[i];
      remainingCounts[letter] = (remainingCounts[letter] || 0) + 1;
    }
  }

  // 2da pasada: letras presentes en otra posición (amarillo)
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] !== 'correct') {
      const letter = guessArr[i];
      if (remainingCounts[letter] && remainingCounts[letter] > 0) {
        result[i] = 'present';
        remainingCounts[letter]--;
      } else {
        result[i] = 'absent';
      }
    }
  }

  return result;
}

// Muestra color legend content y conecta sus controles con la pantalla.
const ColorLegendContent: React.FC = () => (
  <div className="flex flex-col gap-2.5">
    {/* Verde */}
    <div className="flex items-center gap-3 rounded-xl border border-[var(--app-border)] bg-[#35475a] p-2.5">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#285d54] bg-[#327267] text-lg font-black text-white">
        V
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs leading-tight font-black text-[#d8f0e9] sm:text-sm">
          Verde: Posición correcta
        </p>
        <p className="mt-0.5 text-sm leading-snug font-medium text-[var(--app-copy)]">
          La letra está en la palabra y en el casillero correcto.
        </p>
      </div>
    </div>

    {/* Amarillo */}
    <div className="flex items-center gap-3 rounded-xl border border-[var(--app-border)] bg-[#35475a] p-2.5">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#75500d] bg-[#956a15] text-lg font-black text-white">
        A
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs leading-tight font-black text-[#f5dfb4] sm:text-sm">
          Amarillo: En otra posición
        </p>
        <p className="mt-0.5 text-sm leading-snug font-medium text-[var(--app-copy)]">
          La letra sí está en la palabra, pero va en otra casilla.
        </p>
      </div>
    </div>

    {/* Gris */}
    <div className="flex items-center gap-3 rounded-xl border border-[var(--app-border)] bg-[#35475a] p-2.5">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#526176] bg-[#526176] text-lg font-black text-white">
        G
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs leading-tight font-black text-[var(--app-text)] sm:text-sm">
          Gris: No está en la palabra
        </p>
        <p className="mt-0.5 text-sm leading-snug font-medium text-[var(--app-copy)]">
          La letra no forma parte del desafío de hoy.
        </p>
      </div>
    </div>
  </div>
);

// Maneja las palabras, colorea los aciertos y guarda el resultado de Wordle.
const WordleGame: React.FC = () => {
  const economy = usePlayerEconomy();
  const { abrirComprarPista } = economy;
  const navigate = useNavigate();
  const location = useLocation();

  const challenge = (location.state as {
    challenge?: {
      day?: number;
      dateStr?: string;
      dateKey?: string;
      word?: string;
      hints?: string[];
    };
  })?.challenge;
  const [activeSolution, setActiveSolution] = useState<string>(challenge?.word || DEFAULT_SOLUTION);
  const now = new Date();
  const dayNum = challenge?.day || now.getDate();
  const dateStrKey = challenge?.dateKey || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

  // Estados del juego
  const [guesses, setGuesses] = useState<GuessEvaluation[]>([]);
  const [currentInput, setCurrentInput] = useState<string>('');
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [loadedDate, setLoadedDate] = useState('');
  const progressReady = loadedDate === dateStrKey;
  const classic = useClassicChallenge('wordle', dateStrKey, progressReady && gameStatus === 'playing', economy);
  const [message, setMessage] = useState<string | null>(null);
  const [shakeRow, setShakeRow] = useState<boolean>(false);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCurrentWordInvalid =
    progressReady &&
    gameStatus === 'playing' &&
    currentInput.length === WORD_LENGTH &&
    !isValidWordleWord(currentInput, activeSolution);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [hintIndex, setHintIndex] = useState<number>(0);
  const [pistaComprada, setPistaComprada] = useState('');
  const [showEndModal, setShowEndModal] = useState<boolean>(false);
  const [showColorGuideModal, setShowColorGuideModal] = useState<boolean>(false);

  // Restaurar progreso activo o resultado previo si existe
  useEffect(/* Sincroniza este efecto cuando cambian los datos de los que depende. */ () => {
    let isMounted = true;
    // Restaura las jugadas guardadas para continuar.
    const restoreProgress = async () => {
      const saved = await getActiveGameProgress('wordle', dateStrKey);
      if (!isMounted) return;
      setLoadedDate(dateStrKey);
      if (!saved) return;
      classic.restore(saved);
      setPistaComprada(saved.gameData?.pistaComprada ?? '');
      setShowHint(Boolean(saved.gameData?.pistaComprada));
      setHintIndex(saved.gameData?.hintIndex ?? 0);

      if (saved.word) {
        setActiveSolution(saved.word);
      }

      if (saved.guesses && Array.isArray(saved.guesses) && saved.guesses.length > 0) {
        setGuesses(saved.guesses);
      }

      if (saved.status === 'won' || saved.status === 'completed') {
        setGameStatus('won');
      } else if (saved.status === 'lost' || saved.status === 'failed' || (saved.guesses && saved.guesses.length >= MAX_ATTEMPTS)) {
        setGameStatus('lost');
      } else {
        setGameStatus('playing');
        if (saved.currentInput) {
          setCurrentInput(saved.currentInput);
        }
      }
    };

    restoreProgress();
    return /* Libera los recursos de este efecto cuando deja de usarse. */ () => {
      isMounted = false;
    };
  }, [dateStrKey]);

  useEffect(/* Sincroniza este efecto cuando cambian los datos de los que depende. */ () => {
    if (!progressReady || gameStatus === 'won' || gameStatus === 'lost') return;
    void saveActiveGameProgress({ gameId: 'wordle', date: dateStrKey, day: dayNum,
      word: activeSolution, guesses, currentInput, attempts: guesses.length,
      status: 'in_progress',
      gameData: { pistaComprada, hintIndex },
    });
  }, [progressReady, gameStatus, guesses, currentInput, pistaComprada, hintIndex, dateStrKey, dayNum, activeSolution]);

  // Esperar 1 segundo antes de mostrar el cartel de felicitación o fin de partida
  useEffect(/* Sincroniza este efecto cuando cambian los datos de los que depende. */ () => {
    if (gameStatus === 'won' || gameStatus === 'lost') {
      const timer = setTimeout(/* Ejecuta este paso cuando se cumple la espera. */ () => {
        setShowEndModal(true);
      }, 1000);
      return /* Libera los recursos de este efecto cuando deja de usarse. */ () => clearTimeout(timer);
    } else {
      setShowEndModal(false);
    }
  }, [gameStatus]);

  // Pistas accesibles
  const hints = challenge?.hints && challenge.hints.length > 0
    ? challenge.hints
    : [
        'Lugar donde vive una familia o se comparte la vida cotidiana.',
        `La primera letra de la palabra es la ${activeSolution[0]}.`,
        `Tiene ${activeSolution.length} letras.`,
      ];

  // Feedback háptico
  const triggerHaptic = useCallback(async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Ignorar en navegadores web sin soporte háptico
    }
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    };
  }, []);

  // Agita suavemente la fila activa cuando la palabra no es válida o está incompleta.
  const triggerInvalidShake = useCallback(() => {
    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    setShakeRow(true);
    shakeTimerRef.current = setTimeout(() => setShakeRow(false), 450);
  }, []);

  // Muestra un aviso breve sobre la jugada.
  const showFeedback = useCallback((text: string) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setMessage(text);
    feedbackTimerRef.current = setTimeout(/* Ejecuta este paso cuando se cumple la espera. */ () => setMessage(null), 2200);
  }, []);

  // Manejador central de teclas
  const handleKeyPress = useCallback((char: string) => {
    if (!progressReady || gameStatus !== 'playing') return;
    if (guesses.length >= MAX_ATTEMPTS) return;

    triggerHaptic();

    if (char === 'BORRAR' || char === 'BACKSPACE') {
      setCurrentInput(/* Actualiza current input a partir del valor anterior. */ (prev) => prev.slice(0, -1));
      return;
    }

    if (char === 'ENVIAR' || char === 'ENTER') {
      if (currentInput.length < WORD_LENGTH) {
        triggerInvalidShake();
        showFeedback(`Escribí ${WORD_LENGTH} letras`);
        return;
      }

      if (!isValidWordleWord(currentInput, activeSolution)) {
        triggerInvalidShake();
        showFeedback('Esa palabra no existe. Intentá con otra.');
        return;
      }

      const evaluatedStatuses = evaluateGuess(currentInput, activeSolution);
      const newGuesses = [...guesses, { word: currentInput, statuses: evaluatedStatuses }];
      setGuesses(newGuesses);
      setCurrentInput('');

      if (currentInput === activeSolution) {
        setGameStatus('won');
        classic.complete({
          day: dayNum,
          word: activeSolution,
          guesses: newGuesses,
          status: 'won',
          attempts: newGuesses.length,
          gameData: { pistaComprada, hintIndex },
        });
        return;
      }

      if (newGuesses.length >= MAX_ATTEMPTS) {
        setGameStatus('lost');
        showFeedback('¡Se agotaron los intentos!');
        classic.complete({
          day: dayNum,
          word: activeSolution,
          guesses: newGuesses,
          status: 'lost',
          attempts: newGuesses.length,
          gameData: { pistaComprada, hintIndex },
        });
        return;
      }

      return;
    }

    if (/^[A-ZÑ]$/.test(char) && currentInput.length < WORD_LENGTH) {
      setCurrentInput(/* Actualiza current input a partir del valor anterior. */ (prev) => prev + char);
    }
  }, [currentInput, gameStatus, guesses, triggerHaptic, triggerInvalidShake, showFeedback, progressReady, activeSolution, dayNum, classic, pistaComprada, hintIndex]);

  // Teclado físico de PC
  useEffect(/* Sincroniza este efecto cuando cambian los datos de los que depende. */ () => {
    // Traduce la tecla a una acción del juego o de la ventana.
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (key === 'ENTER') {
        handleKeyPress('ENVIAR');
      } else if (key === 'BACKSPACE') {
        handleKeyPress('BORRAR');
      } else if (/^[A-ZÑ]$/.test(key)) {
        handleKeyPress(key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return /* Libera los recursos de este efecto cuando deja de usarse. */ () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress]);

  // Reinicia el desafío para volver a jugarlo.
  const handleRestart = () => {
    clearActiveGameProgress('wordle', dateStrKey);
    classic.reset();
    setGuesses([]);
    setCurrentInput('');
    setGameStatus('playing');
    setShowEndModal(false);
    setMessage(null);
    setShowHint(false);
    setPistaComprada('');
    setHintIndex(0);
  };

  // Mapa de estados de letras para colorear teclas
  const keyboardLetterStatus = useMemo(/* Recalcula este dato cuando cambian sus dependencias. */ () => {
    const map: Record<string, LetterStatus> = {};
    guesses.forEach(/* Aplica este paso a cada elemento. */ ({ word, statuses }) => {
      word.split('').forEach(/* Aplica este paso a cada elemento. */ (letter, i) => {
        const current = map[letter];
        const status = statuses[i];
        if (status === 'correct') {
          map[letter] = 'correct';
        } else if (status === 'present' && current !== 'correct') {
          map[letter] = 'present';
        } else if (status === 'absent' && !current) {
          map[letter] = 'absent';
        }
      });
    });
    return map;
  }, [guesses]);

  const keyboardRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
    ['BORRAR', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'ENVIAR'],
  ];

  return (
    <IonPage className="cognitive-game cognitive-game--wordle">
      {/* Navbar con el mismo tamaño y estilo de Home / Menu */}
      <>
        <style>{`
          @keyframes wordleBackdropFade {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          @keyframes wordleModalPop {
            0% {
              opacity: 0;
              transform: scale(0.85) translateY(18px);
            }
            100% {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
          .wordle-modal-backdrop {
            animation: wordleBackdropFade 0.35s ease-out forwards;
          }
          .wordle-modal-card {
            animation: wordleModalPop 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          @keyframes wordleRowShake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-6px); }
            40%, 80% { transform: translateX(6px); }
          }
          .wordle-row-shake {
            animation: wordleRowShake 0.42s ease-in-out;
          }
        `}</style>
        <AppNavbar view={{ kind: 'game',
title: "Palabra del día",
onBack: () => navigate("/menu"),
rightAction: <button
              type="button"
              onClick={/* Responde a click desde este control. */ () => setShowColorGuideModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] px-2.5 py-1.5 text-xs font-bold text-[var(--app-text)] transition-colors hover:bg-[var(--app-panel-raised)] lg:hidden"
              title="Guía de colores"
              aria-label="Ver qué significa cada color"
            >
              <IonIcon icon={helpCircleOutline} className="text-base text-[#99dcd1]" />
              <span className="hidden sm:inline">Colores</span>
            </button>,
onHint: () => {
            if (gameStatus !== 'playing') return;
            abrirComprarPista({ game_id: 'wordle', date: dateStrKey, hint_index: hintIndex,
              // Aplica al tablero la pista que confirmó el servidor.
              onRecibir: data => {
                setPistaComprada(data.pista || 'Sin texto de pista.');
                setShowHint(true);
                setHintIndex(/* Actualiza hint index a partir del valor anterior. */ indice => (indice + 1) % hints.length);
              },
            });
          },
hintDisabled: !progressReady || gameStatus !== 'playing' }} />
      </>

      {/* 2. Contenedor a pantalla completa sin scroll vertical */}
      <IonContent
        fullscreen
        scrollY={true}
        style={{
          '--background': 'var(--app-background)',
          '--padding-top': '0px',
          '--padding-bottom': 'max(calc(env(safe-area-inset-bottom, 0px) + 8px), 24px)',
        } as React.CSSProperties}
      >
        <div
          className="w-full max-w-4xl mx-auto px-2.5 sm:px-4 py-1.5 sm:py-2.5 flex flex-col lg:flex-row items-center justify-center lg:gap-8 h-full select-none"
          style={{
            boxSizing: 'border-box',
            paddingBottom: 'max(calc(env(safe-area-inset-bottom, 0px) + 12px), 32px)',
          }}
        >
          {/* Columna central del juego */}
          <div className="w-full max-w-md flex flex-col justify-between h-full">

          {/* Mensaje flotante de feedback (sin alterar el layout) */}
          {message && (
            <div
              role="status"
              aria-live="polite"
              className="fixed top-20 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] px-4 py-2 text-sm font-bold text-[var(--app-text)] shadow-md pointer-events-none"
            >
              {message}
            </div>
          )}

          {/* Tarjeta superior compacta (sin DESAFIO DIARIO) */}
          <div className="w-full shrink-0 rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] px-3.5 py-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm leading-tight font-extrabold text-[var(--app-text)]">
                  Adiviná la palabra de 5 letras
                </p>
                {isCurrentWordInvalid ? (
                  <p className="mt-0.5 text-sm font-bold text-[#ffb4a2]" role="alert">
                    Esa palabra no existe. Intentá con otra.
                  </p>
                ) : (
                  <p className="mt-0.5 text-sm font-medium text-[var(--app-copy)]">
                    {showHint ? pistaComprada : 'Tocá la bombilla para ver una pista'}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1 rounded-lg border border-[var(--app-border)] bg-[var(--app-panel-raised)] px-2 py-1">
                  <span className="text-xs font-black text-[var(--app-text)] sm:text-sm">
                    Intentos: {guesses.length} / {MAX_ATTEMPTS}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Tablero de Wordle (6 filas proporcionales ajustadas a la pantalla) */}
          <div className="flex flex-col gap-1.5 sm:gap-2 justify-center my-auto py-1">
            {Array.from({ length: MAX_ATTEMPTS }).map(/* Prepara el resultado de cada elemento. */ (_, rowIndex) => {
              const isPastRow = rowIndex < guesses.length;
              const isCurrentRow = rowIndex === guesses.length && gameStatus === 'playing';
              const pastGuess = guesses[rowIndex];

              return (
                <div
                  key={rowIndex}
                  className={`flex gap-2 sm:gap-2.5 justify-center ${isCurrentRow && shakeRow ? 'wordle-row-shake' : ''}`}
                >
                  {Array.from({ length: WORD_LENGTH }).map(/* Prepara el resultado de cada elemento. */ (_, colIndex) => {
                    let letter = '';
                    let statusClass = 'bg-[var(--app-text)] border-2 border-[#aeb9c8] text-[#172433]';

                    if (isPastRow && pastGuess) {
                      letter = pastGuess.word[colIndex];
                      const status = pastGuess.statuses[colIndex];
                      if (status === 'correct') {
                        statusClass = 'bg-[#327267] border-2 border-[#327267] text-white font-extrabold';
                      } else if (status === 'present') {
                        statusClass = 'bg-[#956a15] border-2 border-[#956a15] text-white font-extrabold';
                      } else {
                        statusClass = 'bg-[#526176] border-2 border-[#526176] text-white font-bold';
                      }
                    } else if (isCurrentRow) {
                      letter = currentInput[colIndex] || '';
                      if (letter) {
                        statusClass = isCurrentWordInvalid
                          ? 'bg-[#fff2ef] border-2 border-[#e07a5f] text-[#a63424] font-extrabold'
                          : 'bg-[var(--app-text)] border-2 border-[#99dcd1] text-[#315f59] font-extrabold scale-105';
                      } else {
                        statusClass = 'bg-[var(--app-text)] border-2 border-[#aeb9c8] text-[#718095]';
                      }
                    }

                    return (
                      <div
                        key={colIndex}
                        className={`w-12 h-12 sm:w-14 sm:h-14 [@media(hover:hover)_and_(pointer:fine)]:size-[clamp(56px,8dvh,72px)] [@media(hover:hover)_and_(pointer:fine)]:text-3xl rounded-xl flex items-center justify-center text-xl sm:text-2xl font-black transition-all duration-150 ${statusClass}`}
                      >
                        {letter}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* 5. Teclado táctil en pantalla con botones de ENVIAR y BORRAR adaptados */}
          <div
            className="w-full flex flex-col gap-1 sm:gap-1.5 shrink-0 [@media(hover:hover)_and_(pointer:fine)]:hidden"
            style={{
              paddingBottom: 'max(calc(env(safe-area-inset-bottom, 0px) + 6px), 16px)',
            }}
          >
            {keyboardRows.map(/* Prepara el resultado de cada elemento. */ (row, rIdx) => (
              <div key={rIdx} className="flex justify-center gap-1 sm:gap-1.5">
                {row.map(/* Prepara el resultado de cada elemento. */ (key) => {
                  const isSpecial = key === 'ENVIAR' || key === 'BORRAR';
                  const status = keyboardLetterStatus[key];

                  let keyBg = 'var(--app-panel-raised)';
                  let keyColor = 'var(--app-text)';
                  let keyBorder = 'var(--app-border)';

                  if (status === 'correct') {
                    keyBg = '#327267';
                    keyColor = '#FFFFFF';
                    keyBorder = '#327267';
                  } else if (status === 'present') {
                    keyBg = '#956a15';
                    keyColor = '#FFFFFF';
                    keyBorder = '#956a15';
                  } else if (status === 'absent') {
                    keyBg = '#526176';
                    keyColor = 'var(--app-text)';
                    keyBorder = '#526176';
                  } else if (isSpecial) {
                    if (key === 'ENVIAR' && isCurrentWordInvalid) {
                      keyBg = '#4b383c';
                      keyColor = '#ffb4a2';
                      keyBorder = '#a64d3d';
                    } else {
                      keyBg = '#40556e';
                      keyColor = 'var(--app-text)';
                      keyBorder = '#60738b';
                    }
                  }

                  const enviarBloqueado = key === 'ENVIAR' && isCurrentWordInvalid;

                  return (
                    <button
                      key={key}
                      aria-disabled={enviarBloqueado || undefined}
                      onClick={/* Responde a click desde este control. */ () => handleKeyPress(key)}
                      style={{
                        borderRadius: 5,
                        border: `1px solid ${keyBorder}`,
                        backgroundColor: keyBg,
                        color: keyColor,
                        padding: "2px 5px"
                      }}
                      className={`h-11 sm:h-12 transition-transform active:scale-95 shadow-xs flex items-center justify-center font-extrabold ${enviarBloqueado ? 'opacity-70 cursor-not-allowed' : ''} ${isSpecial
                        ? 'px-2 sm:px-3 text-[10px] sm:text-xs font-black tracking-tight shrink-0'
                        : 'flex-1 max-w-[34px] sm:max-w-[40px] text-sm sm:text-base'
                        }`}
                    >
                      {key}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          </div>

          {/* Guía de colores lateral (Escritorio / Pantallas grandes) */}
          <aside
            className="hidden w-72 shrink-0 flex-col self-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-5 text-[var(--app-text)] xl:w-80 lg:flex"
            aria-label="Guía de colores de Wordle"
          >
            <div className="mb-3.5 flex items-center gap-2 border-b border-[var(--app-border)] pb-2.5">
              <span className="text-xl">🎨</span>
              <div>
                <h2 className="text-sm leading-tight font-black text-[var(--app-text)]">
                  Guía de Colores
                </h2>
                <p className="text-sm font-medium text-[var(--app-copy)]">
                  Qué representa cada casilla
                </p>
              </div>
            </div>

            <ColorLegendContent />

            <div className="mt-3.5 flex items-start gap-2 border-t border-[var(--app-border)] pt-3 text-xs leading-snug text-[var(--app-copy)]">
              <span className="text-sm leading-none shrink-0">💡</span>
              <p>
                  <strong className="text-[var(--app-text)]">Pista:</strong> Una misma letra puede aparecer más de una vez en la palabra secreta.
              </p>
            </div>
          </aside>

        </div>

        {/* Modal accesible de Guía de Colores (solo móvil / tablets) */}
        {showColorGuideModal && (
          <div
            className="wordle-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[#08111c]/75 p-4 lg:hidden"
            style={{
              paddingBottom: 'max(calc(env(safe-area-inset-bottom, 0px) + 24px), 32px)',
            }}
            onClick={/* Responde a click desde este control. */ () => setShowColorGuideModal(false)}
          >
            <div
              className="wordle-modal-card w-full max-w-sm rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-5 text-[var(--app-text)]"
              onClick={/* Responde a click desde este control. */ (e) => e.stopPropagation()}
            >
              <div className="mb-3.5 flex items-center justify-between border-b border-[var(--app-border)] pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎨</span>
                  <div>
                    <h2 className="text-base leading-tight font-black text-[var(--app-text)]">
                      Guía de Colores
                    </h2>
                    <p className="text-sm font-medium text-[var(--app-copy)]">
                      Qué representa cada casilla
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={/* Responde a click desde este control. */ () => setShowColorGuideModal(false)}
                  className="flex size-9 items-center justify-center rounded-lg text-[var(--app-copy)] transition-colors hover:bg-[var(--app-panel-raised)] hover:text-white"
                  aria-label="Cerrar guía de colores"
                >
                  <IonIcon icon={closeOutline} className="text-xl" />
                </button>
              </div>

              <ColorLegendContent />

              <div className="mt-3.5 mb-4 flex items-start gap-2 border-t border-[var(--app-border)] pt-2.5 text-xs leading-snug text-[var(--app-copy)]">
                <span className="text-sm leading-none shrink-0">💡</span>
                <p>
                  <strong className="text-[var(--app-text)]">Pista:</strong> Las letras pueden repetirse en una misma palabra.
                </p>
              </div>

              <button
                type="button"
                onClick={/* Responde a click desde este control. */ () => setShowColorGuideModal(false)}
                className="w-full rounded-xl bg-[#99dcd1] py-3 text-sm font-black text-[#172433] transition-colors hover:bg-[#b3e8df]"
              >
                ¡Entendido!
              </button>
            </div>
          </div>
        )}

        {showEndModal && (
          <CompletedModal
            gameId="wordle"
            completion={classic.completion}
            continuationDateKey={dateStrKey}
            challenge={{
              attempts: guesses.length,
              config: gameStatus === 'lost' ? undefined : { solution: activeSolution },
            }}
            isGameOver={gameStatus === 'lost'}
            onRestart={handleRestart}
            onClose={/* Responde a close desde este control. */ () => navigate('/juegos/wordle')}
          />
        )}
      </IonContent>
    </IonPage>
  );
};

export default WordleGame;
