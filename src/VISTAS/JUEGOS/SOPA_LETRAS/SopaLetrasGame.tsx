import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  bulbOutline,
  checkmarkCircle,
  closeOutline,
  refreshOutline,
  star,
} from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  getActiveGameProgress,
  saveActiveGameProgress,
  saveFinalGameAttempt,
} from '../attemptsService';

const GRID_SIZE = 8;

interface CellCoord {
  row: number;
  col: number;
}

const DEFAULT_THEME = 'Frutas Frescas';
const DEFAULT_WORDS = ['MANZANA', 'PERA', 'LIMON', 'UVA'];
const DEFAULT_HINTS = ['Roja y crujiente', 'Verde y jugosa', 'Amarillo y ácido', 'Viene en racimos'];
const DEFAULT_GRID = [
  ['M', 'A', 'N', 'Z', 'A', 'N', 'A', 'O'],
  ['P', 'E', 'R', 'A', 'S', 'T', 'U', 'V'],
  ['L', 'I', 'M', 'O', 'N', 'A', 'D', 'A'],
  ['U', 'V', 'A', 'B', 'C', 'D', 'E', 'F'],
  ['C', 'D', 'E', 'F', 'L', 'M', 'N', 'O'],
  ['F', 'L', 'M', 'N', 'O', 'R', 'S', 'T'],
  ['R', 'S', 'T', 'U', 'V', 'Z', 'A', 'B'],
  ['A', 'B', 'C', 'D', 'E', 'F', 'L', 'M'],
];

export const SopaLetrasGame: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const challengeState = (location.state as {
    challenge?: {
      day?: number;
      dateStr?: string;
      dateKey?: string;
      config?: {
        theme?: string;
        words?: string[];
        hints?: string[];
        grid?: string[][];
        placed_words?: Array<{
          word: string;
          start: [number, number];
          end: [number, number];
          direction: 'H' | 'V';
        }>;
      };
    };
  })?.challenge;

  const now = new Date();
  const dayNum = challengeState?.day || now.getDate();
  const dateStrKey = challengeState?.dateKey || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
  const dateDisplay = challengeState?.dateStr || `${String(dayNum).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

  // Estados del juego
  const [theme, setTheme] = useState<string>(challengeState?.config?.theme || DEFAULT_THEME);
  const [targetWords, setTargetWords] = useState<string[]>(challengeState?.config?.words || DEFAULT_WORDS);
  const [hints, setHints] = useState<string[]>(challengeState?.config?.hints || DEFAULT_HINTS);
  const [grid, setGrid] = useState<string[][]>(challengeState?.config?.grid || DEFAULT_GRID);

  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [foundCellKeys, setFoundCellKeys] = useState<Set<string>>(new Set());

  // Interacción táctil dual (Swipe / Drag + Tap inicio / fin)
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<CellCoord | null>(null);
  const [dragCurrent, setDragCurrent] = useState<CellCoord | null>(null);
  const [tapStart, setTapStart] = useState<CellCoord | null>(null);

  // Modales
  const [showVictoryModal, setShowVictoryModal] = useState<boolean>(false);
  const [showHintModal, setShowHintModal] = useState<boolean>(false);
  const [justFoundWord, setJustFoundWord] = useState<string | null>(null);
  const [justFoundCells, setJustFoundCells] = useState<Set<string>>(new Set());

  const gridRef = useRef<HTMLDivElement>(null);

  // Feedback háptico
  const triggerHaptic = useCallback(async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      // Ignorar en plataformas sin motor háptico
    }
  }, []);

  // Carga remota de desafío si no vino por state (ej: recarga de página o link directo)
  useEffect(() => {
    if (challengeState?.config?.grid && challengeState?.config?.words) {
      return;
    }

    let isMounted = true;
    const fetchChallenge = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/challenges/date/${dateStrKey}?game_id=sopa_letras`);
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted || !data?.config) return;

        if (data.config.theme) setTheme(data.config.theme);
        if (data.config.words) setTargetWords(data.config.words);
        if (data.config.hints) setHints(data.config.hints);
        if (data.config.grid) setGrid(data.config.grid);
      } catch {
        // Fallback en estado local
      }
    };

    fetchChallenge();
    return () => {
      isMounted = false;
    };
  }, [dateStrKey, challengeState]);

  // Restaurar progreso guardado (palabras encontradas previamente)
  useEffect(() => {
    let isMounted = true;
    const restoreProgress = async () => {
      const saved = await getActiveGameProgress('sopa_letras', dateStrKey);
      if (!isMounted || !saved) return;

      if (saved.guesses && Array.isArray(saved.guesses) && saved.guesses.length > 0) {
        const parsed: string[] = saved.guesses
          .map((g: any) => (typeof g === 'string' ? g : g?.word || ''))
          .filter(Boolean);
        setFoundWords(parsed);
      }

      if (saved.status === 'completed' || saved.status === 'won') {
        setShowVictoryModal(true);
      }
    };

    restoreProgress();
    return () => {
      isMounted = false;
    };
  }, [dateStrKey]);

  // Recalcular celdas coloreadas de palabras encontradas cuando cambia foundWords o grid
  useEffect(() => {
    if (!grid || grid.length !== GRID_SIZE || foundWords.length === 0) return;

    const newKeys = new Set<string>();

    // Buscar cada palabra encontrada en la cuadrícula (H o V) para marcar sus celdas
    foundWords.forEach((word) => {
      const wLen = word.length;
      let matched = false;

      // Buscar Horizontal
      for (let r = 0; r < GRID_SIZE && !matched; r++) {
        for (let c = 0; c <= GRID_SIZE - wLen; c++) {
          let test = '';
          for (let i = 0; i < wLen; i++) {
            test += grid[r][c + i];
          }
          if (test === word) {
            for (let i = 0; i < wLen; i++) {
              newKeys.add(`${r}-${c + i}`);
            }
            matched = true;
            break;
          }
        }
      }

      // Buscar Vertical
      if (!matched) {
        for (let c = 0; c < GRID_SIZE && !matched; c++) {
          for (let r = 0; r <= GRID_SIZE - wLen; r++) {
            let test = '';
            for (let i = 0; i < wLen; i++) {
              test += grid[r + i][c];
            }
            if (test === word) {
              for (let i = 0; i < wLen; i++) {
                newKeys.add(`${r + i}-${c}`);
              }
              matched = true;
              break;
            }
          }
        }
      }
    });

    setFoundCellKeys(newKeys);
  }, [foundWords, grid]);

  // Calcular las celdas actualmente seleccionadas (por swipe o tap inicio)
  const selectedCoords = useMemo<CellCoord[]>(() => {
    if (isDragging && dragStart && dragCurrent) {
      const coords: CellCoord[] = [];
      const { row: r1, col: c1 } = dragStart;
      const { row: r2, col: c2 } = dragCurrent;

      // Horizontal (izquierda a derecha)
      if (r1 === r2 && c2 >= c1) {
        for (let c = c1; c <= c2; c++) {
          coords.push({ row: r1, col: c });
        }
        return coords;
      }

      // Vertical (arriba a abajo)
      if (c1 === c2 && r2 >= r1) {
        for (let r = r1; r <= r2; r++) {
          coords.push({ row: r, col: c1 });
        }
        return coords;
      }

      // Si no es horizontal ni vertical válido, solo marcar la celda inicial
      return [dragStart];
    }

    if (tapStart) {
      return [tapStart];
    }

    return [];
  }, [isDragging, dragStart, dragCurrent, tapStart]);

  // Set de claves de celdas seleccionadas actualmente
  const selectedKeySet = useMemo(() => {
    const set = new Set<string>();
    selectedCoords.forEach((c) => set.add(`${c.row}-${c.col}`));
    return set;
  }, [selectedCoords]);

  // Verificar palabra seleccionada
  const checkSelection = useCallback(
    (start: CellCoord, end: CellCoord) => {
      const { row: r1, col: c1 } = start;
      const { row: r2, col: c2 } = end;

      let candidate = '';
      const cellsToMark: string[] = [];

      // Horizontal
      if (r1 === r2 && c2 >= c1) {
        for (let c = c1; c <= c2; c++) {
          candidate += grid[r1][c];
          cellsToMark.push(`${r1}-${c}`);
        }
      }
      // Vertical
      else if (c1 === c2 && r2 >= r1) {
        for (let r = r1; r <= r2; r++) {
          candidate += grid[r][c1];
          cellsToMark.push(`${r}-${c1}`);
        }
      } else {
        return false;
      }

      const match = targetWords.find((w) => w === candidate);
      if (match && !foundWords.includes(match)) {
        triggerHaptic();
        const nextFound = [...foundWords, match];
        setFoundWords(nextFound);

        // Guardar progreso en tiempo real
        saveActiveGameProgress({
          gameId: 'sopa_letras',
          date: dateStrKey,
          day: dayNum,
          word: theme,
          guesses: nextFound,
          status: nextFound.length === targetWords.length ? 'completed' : 'in_progress',
          attempts: nextFound.length,
          stars: nextFound.length === targetWords.length ? 3 : 1,
          score: nextFound.length * 100,
        });

        // Micro-interacción de celebración en el chip y en las celdas encontradas
        setJustFoundWord(match);
        setJustFoundCells(new Set(cellsToMark));
        setTimeout(() => {
          setJustFoundWord(null);
          setJustFoundCells(new Set());
        }, 1200);

        // Si se encontraron las 4 palabras -> ¡Victoria!
        if (nextFound.length === targetWords.length) {
          saveFinalGameAttempt({
            gameId: 'sopa_letras',
            date: dateStrKey,
            day: dayNum,
            status: 'completed',
            word: theme,
            attempts: targetWords.length,
            stars: 3,
            score: 400,
            guesses: nextFound,
          });

          setTimeout(() => {
            setShowVictoryModal(true);
          }, 800);
        }

        return true;
      }

      return false;
    },
    [grid, targetWords, foundWords, triggerHaptic, dateStrKey, dayNum, theme]
  );

  // Manejo de eventos Pointer (Unifica mouse y touch)
  const handlePointerDown = (row: number, col: number, e: React.PointerEvent) => {
    // Si ya había un tap inicial activo:
    if (tapStart) {
      // Si tocó la misma celda -> deseleccionar
      if (tapStart.row === row && tapStart.col === col) {
        setTapStart(null);
        return;
      }

      // Si tocó una celda en la misma fila (der) o columna (abajo) -> intentar formar palabra
      const isH = tapStart.row === row && col >= tapStart.col;
      const isV = tapStart.col === col && row >= tapStart.row;

      if (isH || isV) {
        const found = checkSelection(tapStart, { row, col });
        setTapStart(null);
        if (found) return;
      }

      // Si no coincidió o dirección inválida, la nueva celda pasa a ser el nuevo tap inicial
      setTapStart({ row, col });
      return;
    }

    // Iniciar arrastre / swipe
    setIsDragging(true);
    setDragStart({ row, col });
    setDragCurrent({ row, col });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStart) return;

    // Detectar celda bajo el dedo o cursor
    const element = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    if (!element) return;

    const cellEl = element.closest('[data-cell-row]') as HTMLElement | null;
    if (!cellEl) return;

    const r = parseInt(cellEl.getAttribute('data-cell-row') || '-1', 10);
    const c = parseInt(cellEl.getAttribute('data-cell-col') || '-1', 10);

    if (r >= 0 && c >= 0) {
      // Solo actualizar si es horizontal hacia la derecha o vertical hacia abajo
      const isH = r === dragStart.row && c >= dragStart.col;
      const isV = c === dragStart.col && r >= dragStart.row;
      if (isH || isV) {
        setDragCurrent({ row: r, col: c });
      }
    }
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (dragStart && dragCurrent) {
      const moved = dragStart.row !== dragCurrent.row || dragStart.col !== dragCurrent.col;
      if (moved) {
        // El usuario arrastró por múltiples celdas
        checkSelection(dragStart, dragCurrent);
        setDragStart(null);
        setDragCurrent(null);
      } else {
        // Fue un toque simple (Tap) -> activar modo tap-to-select
        setTapStart(dragStart);
        setDragStart(null);
        setDragCurrent(null);
      }
    } else {
      setDragStart(null);
      setDragCurrent(null);
    }
  };

  const handleResetChallenge = () => {
    setFoundWords([]);
    setFoundCellKeys(new Set());
    setTapStart(null);
    setShowVictoryModal(false);
  };

  const unfoundCount = targetWords.length - foundWords.length;

  return (
    <IonPage style={{ background: '#F4F6F9' }}>
      <IonHeader className="ion-no-border">
        <IonToolbar
          style={
            {
              '--background': '#294C6B',
              '--color': '#FFFFFF',
              borderBottom: '1px solid #1E3850',
            } as React.CSSProperties
          }
        >
          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0 12px',
              width: '100%',
            }}
          >
            <button
              onClick={() => navigate('/juegos/sopa-letras')}
              style={{
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.12)',
                border: 'none',
                borderRadius: 12,
                color: '#FFFFFF',
                cursor: 'pointer',
                display: 'inline-flex',
                fontSize: 14,
                fontWeight: 700,
                gap: 6,
                padding: '8px 12px',
              }}
              title="Volver al calendario"
            >
              <IonIcon icon={arrowBackOutline} style={{ fontSize: 18 }} />
              <span className="hidden sm:inline">Calendario</span>
            </button>

            <IonTitle
              style={{
                color: '#FFFFFF',
                fontSize: 18,
                fontWeight: 900,
                textAlign: 'center',
              }}
            >
              Sopa de letras
            </IonTitle>

            <button
              onClick={() => setShowHintModal(true)}
              style={{
                alignItems: 'center',
                background: '#53BFC9',
                border: 'none',
                borderRadius: 12,
                color: '#1A344A',
                cursor: 'pointer',
                display: 'inline-flex',
                fontSize: 14,
                fontWeight: 800,
                gap: 5,
                padding: '8px 12px',
              }}
              title="Ver pistas"
            >
              <IonIcon icon={bulbOutline} style={{ fontSize: 18 }} />
              <span className="hidden sm:inline">Pistas</span>
            </button>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        style={
          {
            '--background': '#F4F6F9',
          } as React.CSSProperties
        }
      >
        <div
          style={{
            alignItems: 'center',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            margin: '0 auto',
            maxWidth: 520,
            minHeight: '100%',
            padding: '12px 14px max(calc(env(safe-area-inset-bottom, 0px) + 24px), 48px)',
            width: '100%',
          }}
        >
          {/* Cartel de Tema y Progreso */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #DEE3EA',
              borderRadius: 16,
              boxShadow: '0 2px 8px rgba(41, 76, 107, 0.06)',
              marginBottom: 10,
              padding: '10px 16px',
              textAlign: 'center',
              width: '100%',
            }}
          >
            <div
              style={{
                alignItems: 'center',
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 2,
              }}
            >
              <span
                style={{
                  background: '#E8F8F5',
                  borderRadius: 999,
                  color: '#17695F',
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: '0.04em',
                  padding: '2px 8px',
                  textTransform: 'uppercase',
                }}
              >
                Tema: {theme}
              </span>
              <span
                style={{
                  color: '#294C6B',
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {foundWords.length} de {targetWords.length} palabras
              </span>
            </div>

            <p
              style={{
                color: '#64748B',
                fontSize: 12,
                lineHeight: 1.3,
                margin: '4px 0 0',
              }}
            >
              {tapStart
                ? `Letra seleccionada: "${grid[tapStart.row][tapStart.col]}". Tocá la última letra de la palabra.`
                : 'Arrastrá el dedo o tocá la primera y última letra para encontrar cada palabra.'}
            </p>
          </div>

          {/* Chips de las 4 Palabras a Buscar */}
          <div
            style={{
              display: 'grid',
              gap: 8,
              gridTemplateColumns: 'repeat(2, 1fr)',
              marginBottom: 12,
              width: '100%',
            }}
          >
            {targetWords.map((word, idx) => {
              const isFound = foundWords.includes(word);
              const isJustFound = justFoundWord === word;
              return (
                <div
                  key={idx}
                  style={{
                    alignItems: 'center',
                    background: isJustFound ? '#CCFBF1' : isFound ? '#E8F8F5' : '#FFFFFF',
                    border: isJustFound ? '2px solid #0D9488' : `1.5px solid ${isFound ? '#17695F' : '#DEE3EA'}`,
                    borderRadius: 12,
                    boxShadow: isJustFound
                      ? '0 0 16px rgba(13, 148, 136, 0.45)'
                      : isFound
                      ? '0 1px 3px rgba(23, 105, 95, 0.15)'
                      : 'none',
                    color: isJustFound ? '#0F766E' : isFound ? '#17695F' : '#294C6B',
                    display: 'flex',
                    fontSize: 'clamp(13px, 3.8vw, 15px)',
                    fontWeight: 900,
                    gap: 6,
                    justifyContent: 'center',
                    letterSpacing: '0.06em',
                    minHeight: 40,
                    padding: '6px 8px',
                    position: 'relative',
                    textDecoration: isFound && !isJustFound ? 'line-through' : 'none',
                    transform: isJustFound ? 'scale(1.08)' : 'scale(1)',
                    zIndex: isJustFound ? 10 : 1,
                    transition:
                      'transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s ease, border 0.2s ease, box-shadow 0.25s ease',
                  }}
                >
                  {isFound && <IonIcon icon={checkmarkCircle} style={{ color: isJustFound ? '#0D9488' : '#17695F', fontSize: 16 }} />}
                  <span>{word}</span>
                </div>
              );
            })}
          </div>

          {/* Cuadrícula 8x8 de la Sopa de Letras */}
          <div
            ref={gridRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
              background: '#FFFFFF',
              border: '2px solid #DEE3EA',
              borderRadius: 18,
              boxShadow: '0 4px 16px rgba(41, 76, 107, 0.08)',
              display: 'grid',
              gap: 4,
              gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
              maxWidth: 380,
              padding: 6,
              touchAction: 'none', // Evita scroll o recarga al arrastrar en celular
              userSelect: 'none',
              width: '100%',
            }}
          >
            {grid.map((rowArr, rIdx) =>
              rowArr.map((letter, cIdx) => {
                const cellKey = `${rIdx}-${cIdx}`;
                const isFound = foundCellKeys.has(cellKey);
                const isSelected = selectedKeySet.has(cellKey);
                const isJustFound = justFoundCells.has(cellKey);

                let cellBg = '#FFFFFF';
                let cellColor = '#294C6B';
                let cellBorder = '1px solid #E2E8F0';

                if (isJustFound) {
                  cellBg = '#A7F3D0';
                  cellColor = '#065F46';
                  cellBorder = '2px solid #059669';
                } else if (isSelected) {
                  cellBg = '#53BFC9';
                  cellColor = '#1A344A';
                  cellBorder = '1.5px solid #294C6B';
                } else if (isFound) {
                  cellBg = '#E8F8F5';
                  cellColor = '#17695F';
                  cellBorder = '1.5px solid #A3E5D9';
                }

                return (
                  <button
                    key={cellKey}
                    data-cell-row={rIdx}
                    data-cell-col={cIdx}
                    onPointerDown={(e) => handlePointerDown(rIdx, cIdx, e)}
                    style={{
                      alignItems: 'center',
                      aspectRatio: '1 / 1',
                      background: cellBg,
                      border: cellBorder,
                      borderRadius: 10,
                      boxSizing: 'border-box',
                      color: cellColor,
                      cursor: 'pointer',
                      display: 'flex',
                      fontSize: 'clamp(16px, 4.8vw, 20px)',
                      fontWeight: 900,
                      justifyContent: 'center',
                      lineHeight: 1,
                      outline: 'none',
                      padding: 0,
                      position: 'relative',
                      touchAction: 'none',
                      transform: isJustFound ? 'scale(1.14)' : isSelected ? 'scale(1.04)' : 'scale(1)',
                      zIndex: isJustFound ? 15 : isSelected ? 5 : 1,
                      boxShadow: isJustFound ? '0 0 14px rgba(5, 150, 105, 0.45)' : 'none',
                      transition:
                        'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.15s ease, border 0.15s ease, box-shadow 0.25s ease',
                      width: '100%',
                    }}
                    title={`Fila ${rIdx + 1}, Columna ${cIdx + 1}: ${letter}`}
                  >
                    {letter}
                  </button>
                );
              })
            )}
          </div>

          {/* Botón para reiniciar progreso local si el usuario desea practicar de nuevo */}
          {foundWords.length > 0 && (
            <button
              onClick={handleResetChallenge}
              style={{
                alignItems: 'center',
                background: 'transparent',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer',
                display: 'inline-flex',
                fontSize: 13,
                fontWeight: 700,
                gap: 5,
                marginTop: 14,
                padding: '6px 12px',
              }}
            >
              <IonIcon icon={refreshOutline} style={{ fontSize: 16 }} />
              <span>Volver a jugar este desafío</span>
            </button>
          )}
        </div>

        {/* Modal de Pistas */}
        {showHintModal && (
          <div
            style={{
              alignItems: 'center',
              background: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(3px)',
              display: 'flex',
              inset: 0,
              justifyContent: 'center',
              padding: '16px 16px max(calc(env(safe-area-inset-bottom, 0px) + 24px), 48px)',
              position: 'fixed',
              zIndex: 999,
            }}
          >
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 20,
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                maxWidth: 380,
                padding: '22px 20px',
                width: '100%',
              }}
            >
              <div
                style={{
                  alignItems: 'center',
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
                  <div
                    style={{
                      alignItems: 'center',
                      background: '#FFF8E6',
                      borderRadius: 10,
                      color: '#F59E0B',
                      display: 'flex',
                      height: 36,
                      justifyContent: 'center',
                      width: 36,
                    }}
                  >
                    <IonIcon icon={bulbOutline} style={{ fontSize: 22 }} />
                  </div>
                  <h3 style={{ color: '#294C6B', fontSize: 17, fontWeight: 900, margin: 0 }}>
                    Pistas del tema
                  </h3>
                </div>
                <button
                  onClick={() => setShowHintModal(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748B',
                    cursor: 'pointer',
                    fontSize: 20,
                    padding: 4,
                  }}
                >
                  <IonIcon icon={closeOutline} />
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  marginBottom: 16,
                  maxHeight: 260,
                  overflowY: 'auto',
                }}
              >
                {targetWords.map((word, idx) => {
                  const isFound = foundWords.includes(word);
                  return (
                    <div
                      key={idx}
                      style={{
                        background: isFound ? '#E8F8F5' : '#F8FAFC',
                        border: `1px solid ${isFound ? '#A3E5D9' : '#E2E8F0'}`,
                        borderRadius: 12,
                        padding: '10px 12px',
                      }}
                    >
                      <div
                        style={{
                          alignItems: 'center',
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: 3,
                        }}
                      >
                        <span
                          style={{
                            color: isFound ? '#17695F' : '#294C6B',
                            fontSize: 13,
                            fontWeight: 900,
                            letterSpacing: '0.04em',
                          }}
                        >
                          {word} {isFound && '✓ (Encontrada)'}
                        </span>
                        <span style={{ color: '#94A3B8', fontSize: 11, fontWeight: 700 }}>
                          {word.length} letras
                        </span>
                      </div>
                      <p style={{ color: '#64748B', fontSize: 12, margin: 0 }}>
                        {hints[idx] || `Palabra de ${word.length} letras`}
                      </p>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setShowHintModal(false)}
                style={{
                  background: '#294C6B',
                  border: 'none',
                  borderRadius: 12,
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 800,
                  padding: '11px 0',
                  width: '100%',
                }}
              >
                Volver a la sopa
              </button>
            </div>
          </div>
        )}

        {/* Modal de Felicitación / Victoria */}
        {showVictoryModal && (
          <div
            style={{
              alignItems: 'center',
              background: 'rgba(15, 23, 42, 0.55)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              inset: 0,
              justifyContent: 'center',
              padding: '16px 16px max(calc(env(safe-area-inset-bottom, 0px) + 24px), 48px)',
              position: 'fixed',
              zIndex: 1000,
            }}
          >
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 22,
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25)',
                maxWidth: 360,
                padding: '24px 20px',
                textAlign: 'center',
                width: '100%',
              }}
              className="calendar-shared-modal-card"
            >
              <div
                style={{
                  alignItems: 'center',
                  background: '#E8F8F5',
                  borderRadius: 999,
                  display: 'flex',
                  height: 52,
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  width: 52,
                }}
              >
                <IonIcon icon={checkmarkCircle} style={{ color: '#17695F', fontSize: 32 }} />
              </div>

              <h2
                style={{
                  color: '#294C6B',
                  fontSize: 20,
                  fontWeight: 900,
                  margin: 0,
                }}
              >
                ¡Felicitaciones!
              </h2>

              <p
                style={{
                  color: '#64748B',
                  fontSize: 13,
                  margin: '6px 0 14px',
                }}
              >
                Completaste la sopa de letras del día:
                <br />
                <strong>{theme}</strong>
              </p>

              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <IonIcon icon={star} style={{ color: '#F59E0B', fontSize: 24 }} />
                <IonIcon icon={star} style={{ color: '#F59E0B', fontSize: 24 }} />
                <IonIcon icon={star} style={{ color: '#F59E0B', fontSize: 24 }} />
              </div>

              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 14,
                  marginBottom: 18,
                  padding: '12px 14px',
                }}
              >
                <p
                  style={{
                    color: '#64748B',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    margin: '0 0 6px',
                    textTransform: 'uppercase',
                  }}
                >
                  Palabras descubiertas
                </p>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 6,
                    justifyContent: 'center',
                  }}
                >
                  {foundWords.map((word, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: '#E8F8F5',
                        border: '1px solid #A3E5D9',
                        borderRadius: 8,
                        color: '#17695F',
                        fontSize: 12,
                        fontWeight: 800,
                        padding: '4px 8px',
                      }}
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => navigate('/juegos/sopa-letras')}
                style={{
                  background: '#294C6B',
                  border: 'none',
                  borderRadius: 14,
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  fontSize: 15,
                  fontWeight: 800,
                  padding: '13px 0',
                  width: '100%',
                }}
                className="active:bg-slate-800 transition-colors"
              >
                Volver al calendario
              </button>
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default SopaLetrasGame;
