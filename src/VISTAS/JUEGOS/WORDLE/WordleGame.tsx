/* Maneja las palabras, colorea los aciertos y guarda el resultado de Wordle. */
import { useGameLives } from '../useGameLives';
/* Acá maneja las palabras, colorea los aciertos y guarda el resultado de Wordle. */
import { CompletedModal } from '../../COMPONENTS/MODALS/CompletedModal';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  IonContent,
  IonPage,
  IonTitle,
  IonToolbar,
  IonIcon,
} from '@ionic/react';
import { GameHeader, LivesBadge } from '../../COMPONENTS/GameHeader';
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
  saveFinalGameAttempt,
  clearActiveGameProgress,
} from '../attemptsService';

// Solución por defecto
const DEFAULT_SOLUTION = 'HOGAR';
const MAX_ATTEMPTS = 4;
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

// Muestra color legend content y conecta sus controles con la pantalla.
const ColorLegendContent: React.FC = () => (
  <div className="flex flex-col gap-2.5">
    {/* Verde */}
    <div className="flex items-center gap-3 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200">
      <div className="w-10 h-10 rounded-lg bg-emerald-600 border border-emerald-700 text-white font-black flex items-center justify-center text-lg shadow-xs shrink-0">
        V
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-black text-emerald-950 leading-tight">
          Verde: Posición correcta
        </p>
        <p className="text-[11px] sm:text-xs text-emerald-800 font-medium mt-0.5 leading-snug">
          La letra está en la palabra y en el casillero correcto.
        </p>
      </div>
    </div>

    {/* Amarillo */}
    <div className="flex items-center gap-3 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200">
      <div className="w-10 h-10 rounded-lg bg-amber-500 border border-amber-600 text-white font-black flex items-center justify-center text-lg shadow-xs shrink-0">
        A
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-black text-amber-950 leading-tight">
          Amarillo: En otra posición
        </p>
        <p className="text-[11px] sm:text-xs text-amber-900 font-medium mt-0.5 leading-snug">
          La letra sí está en la palabra, pero va en otra casilla.
        </p>
      </div>
    </div>

    {/* Gris */}
    <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
      <div className="w-10 h-10 rounded-lg bg-slate-400 border border-slate-500 text-white font-black flex items-center justify-center text-lg shadow-xs shrink-0">
        G
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-black text-slate-800 leading-tight">
          Gris: No está en la palabra
        </p>
        <p className="text-[11px] sm:text-xs text-slate-600 font-medium mt-0.5 leading-snug">
          La letra no forma parte del desafío de hoy.
        </p>
      </div>
    </div>
  </div>
);

// Maneja las palabras, colorea los aciertos y guarda el resultado de Wordle.
const WordleGame: React.FC = () => {
  const { abrirComprarPista } = usePlayerEconomy();
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
  const gameLives = useGameLives('wordle', dateStrKey, /* Completa este paso con los datos recibidos por la operación. */ () => setGameStatus('lost'));
  const lives = gameLives.lives;
  const [loadedDate, setLoadedDate] = useState('');
  const progressReady = loadedDate === dateStrKey;
  const [message, setMessage] = useState<string | null>(null);
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
      gameLives.hydrate(saved.gameData?.lives ?? 4, saved.status === 'lost' || saved.status === 'failed');
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
        gameLives.finish();
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
    return /* Libera los recursos de este efecto cuando deja de usarse. */ () => {
      isMounted = false;
    };
  }, [dateStrKey]);

  useEffect(/* Sincroniza este efecto cuando cambian los datos de los que depende. */ () => {
    if (!progressReady || gameStatus === 'won') return;
    void saveActiveGameProgress({ gameId: 'wordle', date: dateStrKey, day: dayNum,
      word: activeSolution, guesses, currentInput, attempts: guesses.length,
      status: gameStatus === 'lost' ? 'failed' : 'in_progress',
      gameData: { lives, pistaComprada, hintIndex },
    });
  }, [progressReady, gameStatus, guesses, currentInput, lives, pistaComprada, hintIndex, dateStrKey, dayNum, activeSolution]);

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

  // Muestra un aviso breve sobre la jugada.
  const showFeedback = (text: string) => {
    setMessage(text);
    setTimeout(/* Ejecuta este paso cuando se cumple la espera. */ () => setMessage(null), 2200);
  };

  // Manejador central de teclas
  const handleKeyPress = useCallback((char: string) => {
    if (!progressReady || lives <= 0 || gameStatus !== 'playing') return;

    triggerHaptic();

    if (char === 'BORRAR' || char === 'BACKSPACE') {
      setCurrentInput(/* Actualiza current input a partir del valor anterior. */ (prev) => prev.slice(0, -1));
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
        gameLives.finish();
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
          gameData: { lives, pistaComprada, hintIndex },
          score: stars * 50,
        });
        return;
      }

      gameLives.consumeLife();

      return;
    }

    if (/^[A-ZÑ]$/.test(char) && currentInput.length < WORD_LENGTH) {
      setCurrentInput(/* Actualiza current input a partir del valor anterior. */ (prev) => prev + char);
    }
  }, [currentInput, gameStatus, guesses, showHint, triggerHaptic, progressReady, lives, activeSolution, dateStrKey, dayNum]);

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
    gameLives.reset();
    setGuesses([]);
    setCurrentInput('');
    setGameStatus('playing');
    setShowEndModal(false);
    setMessage(null);
    setShowHint(false);
    setHintIndex(0);
    setPistaComprada('');
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
    <IonPage style={{ background: '#F4F6F9' }}>
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
        `}</style>
        <GameHeader
          title="Palabra del día"
          backRoute="/menu"
          backLabel="Menú"
          badges={<LivesBadge lives={lives} maxLives={4} onClick={gameLives.openRefill} />}
          onHint={/* Responde a hint desde este control. */ () => {
            if (gameStatus !== 'playing') return;
            abrirComprarPista({ vidasDisponibles: lives, onSinVidas: gameLives.openRefill, game_id: 'wordle', date: dateStrKey, hint_index: hintIndex,
              // Aplica al tablero la pista que confirmó el servidor.
              onRecibir: data => {
                gameLives.consumeLife();
                setPistaComprada(data.pista || 'Sin texto de pista.');
                setShowHint(true);
                setHintIndex(/* Actualiza hint index a partir del valor anterior. */ indice => (indice + 1) % hints.length);
              },
            });
          }}
          hintDisabled={!progressReady || lives <= 0 || gameStatus !== 'playing'}
          rightAction={
            <button
              type="button"
              onClick={/* Responde a click desde este control. */ () => setShowColorGuideModal(true)}
              className="lg:hidden flex items-center gap-1.5 bg-[#F4F6F9] hover:bg-slate-200 text-[#294C6B] text-xs font-bold px-2.5 py-1.5 rounded-xl border border-[#DEE3EA] transition-colors"
              title="Guía de colores"
              aria-label="Ver qué significa cada color"
            >
              <IonIcon icon={helpCircleOutline} className="text-base text-[#294C6B]" />
              <span className="hidden sm:inline">Colores</span>
            </button>
          }
        />
      </>

      {/* 2. Contenedor a pantalla completa sin scroll vertical */}
      {gameLives.modal}
      <IonContent
        fullscreen
        scrollY={true}
        style={{
          '--background': '#F4F6F9',
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
                  {showHint ? pistaComprada : 'Tocá la bombilla para ver una pista'}
                </p>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={/* Responde a click desde este control. */ () => setShowColorGuideModal(true)}
                  className="lg:hidden flex items-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold px-2 py-1 rounded-lg border border-slate-300 transition-colors"
                  title="¿Qué significan los colores?"
                >
                  <span className="text-xs">🎨</span>
                  <span>Colores</span>
                </button>

                <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                  <span className="text-xs sm:text-sm font-black text-[#294C6B]">
                    Intentos: {guesses.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Tablero de Wordle (6 filas proporcionales ajustadas a la pantalla) */}
          <div className="flex flex-col gap-1.5 sm:gap-2 justify-center my-auto py-1">
            {Array.from({ length: Math.max(MAX_ATTEMPTS, guesses.length + 1) }).map(/* Prepara el resultado de cada elemento. */ (_, rowIndex) => {
              const isPastRow = rowIndex < guesses.length;
              const isCurrentRow = rowIndex === guesses.length;
              const pastGuess = guesses[rowIndex];

              return (
                <div key={rowIndex} className="flex gap-2 sm:gap-2.5 justify-center">
                  {Array.from({ length: WORD_LENGTH }).map(/* Prepara el resultado de cada elemento. */ (_, colIndex) => {
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
                      onClick={/* Responde a click desde este control. */ () => handleKeyPress(key)}
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

          {/* Guía de colores lateral (Escritorio / Pantallas grandes) */}
          <aside
            className="hidden lg:flex flex-col w-72 xl:w-80 bg-white rounded-2xl p-5 shadow-xs border border-slate-200 shrink-0 self-center"
            aria-label="Guía de colores de Wordle"
          >
            <div className="flex items-center gap-2 mb-3.5 pb-2.5 border-b border-slate-100">
              <span className="text-xl">🎨</span>
              <div>
                <h2 className="text-sm font-black text-[#294C6B] leading-tight">
                  Guía de Colores
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  Qué representa cada casilla
                </p>
              </div>
            </div>

            <ColorLegendContent />

            <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-start gap-2 text-[11px] text-slate-500 leading-snug">
              <span className="text-sm leading-none shrink-0">💡</span>
              <p>
                <strong className="text-slate-700">Pista:</strong> Una misma letra puede aparecer más de una vez en la palabra secreta.
              </p>
            </div>
          </aside>

        </div>

        {/* Modal accesible de Guía de Colores (solo móvil / tablets) */}
        {showColorGuideModal && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 wordle-modal-backdrop lg:hidden"
            style={{
              paddingBottom: 'max(calc(env(safe-area-inset-bottom, 0px) + 24px), 32px)',
            }}
            onClick={/* Responde a click desde este control. */ () => setShowColorGuideModal(false)}
          >
            <div
              className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 wordle-modal-card"
              onClick={/* Responde a click desde este control. */ (e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎨</span>
                  <div>
                    <h2 className="text-base font-black text-[#294C6B] leading-tight">
                      Guía de Colores
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Qué representa cada casilla
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={/* Responde a click desde este control. */ () => setShowColorGuideModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  aria-label="Cerrar guía de colores"
                >
                  <IonIcon icon={closeOutline} className="text-xl" />
                </button>
              </div>

              <ColorLegendContent />

              <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-500 leading-snug mb-4">
                <span className="text-sm leading-none shrink-0">💡</span>
                <p>
                  <strong className="text-slate-700">Pista:</strong> Las letras pueden repetirse en una misma palabra.
                </p>
              </div>

              <button
                type="button"
                onClick={/* Responde a click desde este control. */ () => setShowColorGuideModal(false)}
                className="w-full py-2.5 rounded-xl font-black text-sm bg-[#294C6B] hover:bg-[#1E364D] text-white transition-colors shadow-xs"
              >
                ¡Entendido!
              </button>
            </div>
          </div>
        )}

        {showEndModal && (
          <CompletedModal
            gameId="wordle"
            isGameOver={gameStatus === 'lost'}
            challenge={{
              attempts: guesses.length,
              stars: Math.max(1, 4 - Math.floor(guesses.length / 2)),
              config: { solution: activeSolution },
            }}
            onRestart={handleRestart}
            onClose={/* Responde a close desde este control. */ () => navigate('/menu')}
            closeLabel="Volver al menú"
          />
        )}
      </IonContent>
    </IonPage>
  );
};

export default WordleGame;
