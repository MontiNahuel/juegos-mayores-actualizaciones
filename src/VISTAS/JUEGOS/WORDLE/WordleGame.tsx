import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonIcon,
} from '@ionic/react';
import {
  arrowBackOutline,
  refreshOutline,
  closeCircleOutline,
  checkmarkCircleOutline,
  bulbOutline,
  chevronDownOutline,
  chevronUpOutline,
} from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  getActiveGameProgress,
  saveActiveGameProgress,
  saveFinalGameAttempt,
  clearActiveGameProgress,
} from '../attemptsService';

// Solución por defecto
const DEFAULT_SOLUTION = 'HOGAR';
const MAX_ATTEMPTS = 6;
const WORD_LENGTH = 5;

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

const WordleGame: React.FC = () => {
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
  const [message, setMessage] = useState<string | null>(null);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [hintIndex, setHintIndex] = useState<number>(0);
  const [showEndModal, setShowEndModal] = useState<boolean>(false);

  // Restaurar progreso activo o resultado previo si existe
  useEffect(() => {
    let isMounted = true;
    const restoreProgress = async () => {
      const saved = await getActiveGameProgress('wordle', dateStrKey);
      if (!isMounted || !saved) return;

      if (saved.word) {
        setActiveSolution(saved.word);
      }

      if (saved.guesses && Array.isArray(saved.guesses) && saved.guesses.length > 0) {
        setGuesses(saved.guesses);
      }

      if (saved.status === 'won' || saved.status === 'completed') {
        setGameStatus('won');
      } else if (saved.status === 'lost' || saved.status === 'failed') {
        setGameStatus('lost');
      } else if (saved.status === 'in_progress') {
        setGameStatus('playing');
        if (saved.currentInput) {
          setCurrentInput(saved.currentInput);
        }
      }
    };

    restoreProgress();
    return () => {
      isMounted = false;
    };
  }, [dateStrKey]);

  // Esperar 1 segundo antes de mostrar el cartel de felicitación o fin de partida
  useEffect(() => {
    if (gameStatus === 'won' || gameStatus === 'lost') {
      const timer = setTimeout(() => {
        setShowEndModal(true);
      }, 1000);
      return () => clearTimeout(timer);
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

  const showFeedback = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 2200);
  };

  // Manejador central de teclas
  const handleKeyPress = useCallback((char: string) => {
    if (gameStatus !== 'playing') return;

    triggerHaptic();

    if (char === 'BORRAR' || char === 'BACKSPACE') {
      setCurrentInput((prev) => prev.slice(0, -1));
      return;
    }

    if (char === 'ENVIAR' || char === 'ENTER') {
      if (currentInput.length < WORD_LENGTH) {
        showFeedback(`Escribí ${WORD_LENGTH} letras`);
        return;
      }

      const evaluatedStatuses = evaluateGuess(currentInput, activeSolution);
      const newGuesses = [...guesses, { word: currentInput, statuses: evaluatedStatuses }];
      setGuesses(newGuesses);
      setCurrentInput('');

      if (currentInput === activeSolution) {
        setGameStatus('won');
        const stars = newGuesses.length <= 3 ? 3 : newGuesses.length <= 5 ? 2 : 1;
        saveFinalGameAttempt({
          gameId: 'wordle',
          date: dateStrKey,
          day: dayNum,
          word: activeSolution,
          guesses: newGuesses,
          status: 'won',
          attempts: newGuesses.length,
          stars,
          score: stars * 50,
        });
        return;
      }

      if (newGuesses.length >= MAX_ATTEMPTS) {
        setGameStatus('lost');
        saveFinalGameAttempt({
          gameId: 'wordle',
          date: dateStrKey,
          day: dayNum,
          word: activeSolution,
          guesses: newGuesses,
          status: 'lost',
          attempts: newGuesses.length,
          stars: 0,
          score: 0,
        });
        return;
      }

      // Guardar progreso en tiempo real de la partida en curso
      saveActiveGameProgress({
        gameId: 'wordle',
        date: dateStrKey,
        day: dayNum,
        word: activeSolution,
        guesses: newGuesses,
        currentInput: '',
        status: 'in_progress',
        attempts: newGuesses.length,
      });

      if (newGuesses.length === 3 && !showHint) {
        setShowHint(true);
        setHintIndex(0);
      }

      return;
    }

    if (/^[A-ZÑ]$/.test(char) && currentInput.length < WORD_LENGTH) {
      setCurrentInput((prev) => prev + char);
    }
  }, [currentInput, gameStatus, guesses, showHint, triggerHaptic]);

  // Teclado físico de PC
  useEffect(() => {
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
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress]);

  const handleRestart = () => {
    clearActiveGameProgress('wordle', dateStrKey);
    setGuesses([]);
    setCurrentInput('');
    setGameStatus('playing');
    setShowEndModal(false);
    setMessage(null);
    setShowHint(false);
    setHintIndex(0);
  };

  // Mapa de estados de letras para colorear teclas
  const keyboardLetterStatus = useMemo(() => {
    const map: Record<string, LetterStatus> = {};
    guesses.forEach(({ word, statuses }) => {
      word.split('').forEach((letter, i) => {
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
    <IonPage style={{ background: '#F4F6F9' }}>
      {/* Navbar con el mismo tamaño y estilo de Home / Menu */}
      <IonHeader style={{ boxShadow: '0 1px 8px rgba(23, 59, 99, 0.14)' }} className="shrink-0">
        <style>{`
          .wordle-back-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: #F4F6F9;
            border: 1px solid #DEE3EA;
            border-radius: 14px;
            color: #294C6B;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            white-space: nowrap;
            transition: background-color 0.15s ease;
          }
          .wordle-back-btn:active {
            background-color: #E2E8F0;
          }
          @media (max-width: 639px) {
            .wordle-back-btn {
              width: 44px;
              height: 44px;
              padding: 0;
            }
            .wordle-back-btn .btn-text {
              display: none;
            }
          }
          @media (min-width: 640px) {
            .wordle-back-btn {
              min-height: 44px;
              padding: 9px 18px;
              gap: 8px;
            }
            .wordle-back-btn .btn-text {
              display: inline;
            }
          }
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
        `}</style>
        <IonToolbar style={{ '--background': '#FFFFFF', '--border-width': 0 } as React.CSSProperties}>
          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              margin: '0 auto',
              maxWidth: 1180,
              minHeight: 76,
              padding: '10px 16px',
              width: '100%',
            }}
          >
            {/* Columna Izquierda: Botón para volver al Menú (ancho flexible balanceado) */}
            <div style={{ alignItems: 'center', display: 'flex', flex: '1 1 0', justifyContent: 'flex-start' }}>
              <button
                onClick={() => navigate('/menu')}
                aria-label="Volver al Menú"
                className="wordle-back-btn"
              >
                {/* Ícono SVG tipo "<" para volver atrás */}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#294C6B"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                <span className="btn-text">Menú</span>
              </button>
            </div>

            {/* Columna Central: Título exactamente en el centro geométrico de la pantalla */}
            <div style={{ flex: '0 0 auto', padding: '0 8px', textAlign: 'center' }}>
              <h1
                style={{
                  color: '#294C6B',
                  fontSize: 'clamp(17px, 4.5vw, 21px)',
                  fontWeight: 800,
                  lineHeight: 1.2,
                  margin: 0,
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                Palabra del día
              </h1>
            </div>

            {/* Columna Derecha: Logo de ASISTODO (ancho flexible exactamente igual al de la izquierda) */}
            <div style={{ alignItems: 'center', display: 'flex', flex: '1 1 0', justifyContent: 'flex-end' }}>
              <img
                alt="ASISTODO"
                src="/asistodo-logo.svg"
                style={{ display: 'block', height: 44, width: 44, objectFit: 'contain' }}
              />
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      {/* 2. Contenedor a pantalla completa sin scroll vertical */}
      <IonContent
        fullscreen
        scrollY={false}
        style={{
          '--background': '#F4F6F9',
          '--padding-top': '0px',
          '--padding-bottom': 'max(calc(env(safe-area-inset-bottom, 0px) + 8px), 24px)',
        } as React.CSSProperties}
      >
        <div
          className="max-w-md mx-auto px-2.5 py-1.5 sm:py-2.5 flex flex-col justify-between h-full select-none"
          style={{
            boxSizing: 'border-box',
            paddingBottom: 'max(calc(env(safe-area-inset-bottom, 0px) + 12px), 32px)',
          }}
        >

          {/* Mensaje flotante de feedback (sin alterar el layout) */}
          {message && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#294C6B] text-white font-bold text-xs sm:text-sm px-4 py-1.5 rounded-full shadow-lg pointer-events-none animate-bounce">
              {message}
            </div>
          )}

          {/* Tarjeta superior compacta (sin DESAFIO DIARIO) */}
          <div className="w-full bg-white rounded-xl px-3.5 py-2 shadow-xs border border-slate-200 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-extrabold text-[#294C6B] leading-tight">
                  Adiviná la palabra de 5 letras
                </p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {showHint ? hints[hintIndex] : 'Tocá la bombilla para ver una pista'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowHint(true);
                    setHintIndex((prev) => (prev + 1) % hints.length);
                  }}
                  className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-lg border border-amber-300 transition-colors"
                  title="Pistas"
                >
                  <IonIcon icon={bulbOutline} className="text-sm" />
                  <span>Pista</span>
                </button>
                <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                  <span className="text-xs sm:text-sm font-black text-[#294C6B]">
                    {guesses.length}/{MAX_ATTEMPTS}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Tablero de Wordle (6 filas proporcionales ajustadas a la pantalla) */}
          <div className="flex flex-col gap-1.5 sm:gap-2 justify-center my-auto py-1">
            {Array.from({ length: MAX_ATTEMPTS }).map((_, rowIndex) => {
              const isPastRow = rowIndex < guesses.length;
              const isCurrentRow = rowIndex === guesses.length;
              const pastGuess = guesses[rowIndex];

              return (
                <div key={rowIndex} className="flex gap-2 sm:gap-2.5 justify-center">
                  {Array.from({ length: WORD_LENGTH }).map((_, colIndex) => {
                    let letter = '';
                    let statusClass = 'bg-white border-2 border-slate-300 text-slate-700';

                    if (isPastRow && pastGuess) {
                      letter = pastGuess.word[colIndex];
                      const status = pastGuess.statuses[colIndex];
                      if (status === 'correct') {
                        statusClass = 'bg-emerald-600 border-2 border-emerald-600 text-white font-extrabold shadow-xs';
                      } else if (status === 'present') {
                        statusClass = 'bg-amber-500 border-2 border-amber-500 text-white font-extrabold shadow-xs';
                      } else {
                        statusClass = 'bg-slate-400 border-2 border-slate-400 text-white font-bold';
                      }
                    } else if (isCurrentRow) {
                      letter = currentInput[colIndex] || '';
                      if (letter) {
                        statusClass = 'bg-white border-2 border-[#294C6B] text-[#294C6B] font-extrabold scale-105 shadow-xs';
                      } else {
                        statusClass = 'bg-white border-2 border-slate-300 text-slate-400';
                      }
                    }

                    return (
                      <div
                        key={colIndex}
                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-xl sm:text-2xl font-black transition-all duration-150 ${statusClass}`}
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
            className="w-full flex flex-col gap-1 sm:gap-1.5 shrink-0"
            style={{
              paddingBottom: 'max(calc(env(safe-area-inset-bottom, 0px) + 6px), 16px)',
            }}
          >
            {keyboardRows.map((row, rIdx) => (
              <div key={rIdx} className="flex justify-center gap-1 sm:gap-1.5">
                {row.map((key) => {
                  const isSpecial = key === 'ENVIAR' || key === 'BORRAR';
                  const status = keyboardLetterStatus[key];

                  let keyBg = '#FFFFFF';
                  let keyColor = '#1E293B';
                  let keyBorder = '#CBD5E1';

                  if (status === 'correct') {
                    keyBg = '#059669';
                    keyColor = '#FFFFFF';
                    keyBorder = '#059669';
                  } else if (status === 'present') {
                    keyBg = '#F59E0B';
                    keyColor = '#FFFFFF';
                    keyBorder = '#F59E0B';
                  } else if (status === 'absent') {
                    keyBg = '#CBD5E1';
                    keyColor = '#64748B';
                    keyBorder = '#CBD5E1';
                  } else if (isSpecial) {
                    keyBg = '#E2E8F0';
                    keyColor = '#294C6B';
                    keyBorder = '#CBD5E1';
                  }

                  return (
                    <button
                      key={key}
                      onClick={() => handleKeyPress(key)}
                      style={{
                        borderRadius: 5,
                        border: `1px none ${keyBorder}`,
                        backgroundColor: keyBg,
                        color: keyColor,
                        padding: "2px 5px"
                      }}
                      className={`h-11 sm:h-12 transition-transform active:scale-95 shadow-xs flex items-center justify-center font-extrabold ${isSpecial
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

        {/* 6. Modal de Victoria o Fin de Partida (Overlay que no desplaza el layout, con 1s de espera y animación suave) */}
        {showEndModal && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 wordle-modal-backdrop"
            style={{
              paddingBottom: 'max(calc(env(safe-area-inset-bottom, 0px) + 24px), 48px)',
            }}
          >
            <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 text-center wordle-modal-card">
              {gameStatus === 'won' ? (
                <div>
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 text-2xl">
                    <IonIcon icon={checkmarkCircleOutline} />
                  </div>
                  <h3 className="text-lg font-black text-[#294C6B]">¡Felicitaciones!</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Adivinaste la palabra en <strong>{guesses.length}</strong> de {MAX_ATTEMPTS} intentos.
                  </p>
                  <div className="flex justify-center gap-1 my-2.5 text-xl text-amber-400">
                    {Array.from({ length: Math.max(1, 4 - Math.floor(guesses.length / 2)) }).map((_, i) => (
                      <span key={i}>⭐</span>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-2 text-2xl">
                    <IonIcon icon={closeCircleOutline} />
                  </div>
                  <h3 className="text-lg font-black text-[#294C6B]">¡Buen intento!</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    La palabra de hoy era: <span className="font-black text-emerald-700 tracking-wider">{activeSolution}</span>.
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    El ejercicio diario mantiene tu mente ágil.
                  </p>
                </div>
              )}

              <div className="flex gap-2.5 justify-center mt-4">
                <button
                  onClick={handleRestart}
                  className="flex-1 py-2 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  style={{
                    padding: "12px",
                    borderRadius: "5px",
                    border: "1px none"
                  }}
                >
                  Jugar de nuevo
                </button>
                <button
                  onClick={() => navigate('/menu')}
                  className="flex-1 py-2 rounded-xl font-bold text-xs bg-[#294C6B] hover:bg-[#1E364D] text-white transition-colors shadow-xs"
                  style={{
                    padding: "12px",
                    borderRadius: "5px",
                    border: "1px none"
                  }}
                >
                  Volver al Menú
                </button>
              </div>
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default WordleGame;
