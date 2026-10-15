import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IonPage, IonContent } from '@ionic/react';
import { saveFinalGameAttempt } from '../attemptsService';
import {
  saveActiveCrucigrama,
  loadActiveCrucigrama,
  clearActiveCrucigrama,
} from './crucigramaStorage';
import { CrucigramaCompletedModal } from './CrucigramaCompletedModal';
import {
  IconChevronLeft,
  IconChevronRight,
  IconBackspace,
  IconList,
  IconClock,
  IconLightbulb,
} from './CrucigramaIcons';

interface WordDef {
  id: string;
  number: number;
  direction: 'horizontal' | 'vertical';
  word: string;
  length: number;
  row: number;
  col: number;
  coords: [number, number][];
  clue: string;
}

interface CellDef {
  row: number;
  col: number;
  is_block: boolean;
  letter: string;
  number?: number | null;
  across_num?: number | null;
  down_num?: number | null;
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

function cleanClueText(clue?: string): string {
  if (!clue) return '';
  return clue.replace(/^Definici[oó]n\s*[:\-]?\s*/i, '').trim();
}

export const CrucigramaGame: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Obtener estado del desafío si vino desde el calendario (DailyChallengeCalendar)
  const challengeFromState = (location.state as {
    challenge?: {
      day?: number;
      dateStr?: string;
      dateKey?: string;
      config?: {
        theme?: string;
        grid_size?: number;
        cells?: CellDef[][];
        words?: WordDef[];
      };
    };
  })?.challenge;

  // Obtener fecha del query param, del state o fecha de hoy
  const queryParams = new URLSearchParams(location.search);
  const targetDate =
    queryParams.get('date') ||
    challengeFromState?.dateKey ||
    challengeFromState?.dateStr ||
    new Date().toISOString().split('T')[0];

  // Estado del juego - inicializar de inmediato si ya vino por el estado del calendario
  const initialConfig = challengeFromState?.config;
  const [loading, setLoading] = useState<boolean>(!initialConfig?.cells);
  const [theme, setTheme] = useState<string>(initialConfig?.theme || 'Crucigrama diario');
  const [gridSize, setGridSize] = useState<number>(initialConfig?.grid_size || 7);
  const [cells, setCells] = useState<CellDef[][]>(initialConfig?.cells || []);
  const [words, setWords] = useState<WordDef[]>(initialConfig?.words || []);

  // Matriz ingresada por el usuario (7x7 de letras)
  const [userGrid, setUserGrid] = useState<string[][]>(() =>
    Array.from({ length: 7 }, () => Array(7).fill(''))
  );

  // Selección activa
  const [selectedRow, setSelectedRow] = useState<number>(0);
  const [selectedCol, setSelectedCol] = useState<number>(0);
  const [selectedDirection, setSelectedDirection] = useState<'H' | 'V'>('H');

  // Tiempo y control
  const [seconds, setSeconds] = useState<number>(0);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [showClueDrawer, setShowClueDrawer] = useState<boolean>(false);
  const [showVictoryModal, setShowVictoryModal] = useState<boolean>(false);
  const [hintMessage, setHintMessage] = useState<string | null>(null);
  const [revealedCellCoord, setRevealedCellCoord] = useState<{ r: number; c: number } | null>(null);

  // 1. Cargar el desafío (prioriza state del calendario; si no, consulta con endpoints resilientes)
  useEffect(() => {
    let isMounted = true;

    const setupChallenge = async () => {
      let config = initialConfig;

      // Si no vino en el state de navegación o faltan celdas, buscar en la API
      if (!config?.cells || !config?.words) {
        setLoading(true);
        // Lista de endpoints en orden de preferencia:
        // 1. Relativo (/api/... funciona en web, celular por proxy Vite y producción)
        // 2. IP de la máquina local (http://<hostname>:8080/api/...)
        // 3. Localhost fallback
        const tryEndpoints = [
          `/api/challenges/date/${targetDate}?game_id=crucigrama`,
          `http://${window.location.hostname}:8080/api/challenges/date/${targetDate}?game_id=crucigrama`,
          `http://localhost:8080/api/challenges/date/${targetDate}?game_id=crucigrama`,
        ];

        for (const url of tryEndpoints) {
          try {
            const res = await fetch(url);
            if (res.ok) {
              const data = await res.json();
              if (data?.config?.cells && data?.config?.words) {
                config = data.config;
                break;
              }
            }
          } catch {
            // Intentar siguiente endpoint
          }
        }
      }

      if (!isMounted) return;

      if (config?.cells && config?.words) {
        if (config.theme) setTheme(config.theme);
        if (config.grid_size) setGridSize(config.grid_size);
        setCells(config.cells);
        setWords(config.words);

        // Restaurar estado activo previo o inicializar primera casilla blanca
        const saved = loadActiveCrucigrama(targetDate);
        if (saved && saved.userGrid) {
          setUserGrid(saved.userGrid);
          setSelectedRow(saved.selectedRow ?? 0);
          setSelectedCol(saved.selectedCol ?? 0);
          setSelectedDirection(saved.selectedDirection ?? 'H');
          setSeconds(saved.elapsedSeconds ?? 0);
        } else {
          // Buscar primera celda blanca jugable
          let found = false;
          for (let r = 0; r < config.cells.length; r++) {
            for (let c = 0; c < config.cells[r].length; c++) {
              if (!config.cells[r][c].is_block) {
                setSelectedRow(r);
                setSelectedCol(c);
                setSelectedDirection('H');
                found = true;
                break;
              }
            }
            if (found) break;
          }
        }
      } else {
        console.warn('[Crucigrama] No se pudo obtener la configuración del desafío.');
      }

      setLoading(false);
    };

    setupChallenge();
    return () => {
      isMounted = false;
    };
  }, [targetDate, initialConfig]);

  // 2. Temporizador
  useEffect(() => {
    if (loading || isWon) return;
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, isWon]);

  // 3. Palabra activa según la celda seleccionada y la dirección
  const activeWord = useMemo<WordDef | null>(() => {
    if (!words.length) return null;

    // Buscar palabra en la dirección actual
    const targetDir = selectedDirection === 'H' ? 'horizontal' : 'vertical';
    const match = words.find(
      (w) =>
        w.direction === targetDir &&
        w.coords.some(([r, c]) => r === selectedRow && c === selectedCol)
    );
    if (match) return match;

    // Si no hay en esa dirección, buscar en la otra dirección
    const otherDir = selectedDirection === 'H' ? 'vertical' : 'horizontal';
    const otherMatch = words.find(
      (w) =>
        w.direction === otherDir &&
        w.coords.some(([r, c]) => r === selectedRow && c === selectedCol)
    );
    if (otherMatch) {
      // Ajustar automáticamente dirección si la celda solo pertenece a esa palabra
      return otherMatch;
    }

    return null;
  }, [words, selectedRow, selectedCol, selectedDirection]);

  // Coordenadas de las celdas pertenecientes a la palabra activa
  const activeWordCoordsSet = useMemo(() => {
    const set = new Set<string>();
    if (activeWord) {
      activeWord.coords.forEach(([r, c]) => set.add(`${r},${c}`));
    }
    return set;
  }, [activeWord]);

  // 4. Seleccionar celda al hacer clic / toque
  const handleCellClick = useCallback(
    (r: number, c: number) => {
      if (cells[r]?.[c]?.is_block) return;

      if (r === selectedRow && c === selectedCol) {
        // Tocar la misma celda conmuta la dirección si la celda pertenece a ambas
        const hasHorizontal = words.some(
          (w) => w.direction === 'horizontal' && w.coords.some(([rr, cc]) => rr === r && cc === c)
        );
        const hasVertical = words.some(
          (w) => w.direction === 'vertical' && w.coords.some(([rr, cc]) => rr === r && cc === c)
        );

        if (hasHorizontal && hasVertical) {
          setSelectedDirection((prev) => (prev === 'H' ? 'V' : 'H'));
        }
      } else {
        setSelectedRow(r);
        setSelectedCol(c);

        // Si la celda solo tiene una dirección válida, adaptarse automáticamente
        const inCurrentDir = words.some(
          (w) =>
            w.direction === (selectedDirection === 'H' ? 'horizontal' : 'vertical') &&
            w.coords.some(([rr, cc]) => rr === r && cc === c)
        );
        if (!inCurrentDir) {
          setSelectedDirection((prev) => (prev === 'H' ? 'V' : 'H'));
        }
      }
    },
    [cells, selectedRow, selectedCol, selectedDirection, words]
  );

  // 5. Navegar a palabra anterior / siguiente en la barra de pistas
  const handleNavigateClue = useCallback(
    (step: number) => {
      if (!words.length || !activeWord) return;
      const curIdx = words.findIndex((w) => w.id === activeWord.id);
      if (curIdx === -1) return;
      let nextIdx = (curIdx + step + words.length) % words.length;
      const nextWord = words[nextIdx];
      setSelectedRow(nextWord.coords[0][0]);
      setSelectedCol(nextWord.coords[0][1]);
      setSelectedDirection(nextWord.direction === 'horizontal' ? 'H' : 'V');
    },
    [words, activeWord]
  );

  // 6. Verificar victoria
  const checkVictory = useCallback(
    (currentGrid: string[][]) => {
      if (!cells.length) return false;
      for (let r = 0; r < cells.length; r++) {
        for (let c = 0; c < cells[r].length; c++) {
          const cell = cells[r][c];
          if (!cell.is_block) {
            const entered = (currentGrid[r]?.[c] || '').toUpperCase();
            if (entered !== cell.letter.toUpperCase()) {
              return false;
            }
          }
        }
      }
      return true;
    },
    [cells]
  );

  // 7. Ingreso de letras y borrado
  const handleInputChar = useCallback(
    (char: string) => {
      if (isWon || !cells.length) return;
      const upper = char.toUpperCase();

      setUserGrid((prevGrid) => {
        const nextGrid = prevGrid.map((row) => [...row]);
        nextGrid[selectedRow][selectedCol] = upper;

        // Persistir en localStorage
        saveActiveCrucigrama(targetDate, {
          userGrid: nextGrid,
          selectedRow,
          selectedCol,
          selectedDirection,
          elapsedSeconds: seconds,
        });

        // Verificar si completó el tablero
        if (checkVictory(nextGrid)) {
          setIsWon(true);
          clearActiveCrucigrama(targetDate);
          saveFinalGameAttempt({
            gameId: 'crucigrama',
            date: targetDate,
            status: 'won',
            attempts: 1,
            stars: 3,
            score: 100,
            guesses: words.map((w) => w.word),
            gameData: { timeTaken: seconds, theme },
          }).catch((e) => console.warn('Error guardando intento final:', e));
          setTimeout(() => setShowVictoryModal(true), 400);
        }

        return nextGrid;
      });

      // Avanzar a la siguiente celda dentro de la palabra activa
      if (activeWord) {
        const coords = activeWord.coords;
        const curIdx = coords.findIndex(([r, c]) => r === selectedRow && c === selectedCol);
        if (curIdx !== -1 && curIdx + 1 < coords.length) {
          const [nr, nc] = coords[curIdx + 1];
          setSelectedRow(nr);
          setSelectedCol(nc);
        }
      }
    },
    [
      isWon,
      cells,
      selectedRow,
      selectedCol,
      selectedDirection,
      seconds,
      targetDate,
      checkVictory,
      words,
      activeWord,
      theme,
    ]
  );

  const handleBackspace = useCallback(() => {
    if (isWon) return;

    setUserGrid((prevGrid) => {
      const nextGrid = prevGrid.map((row) => [...row]);
      const curLetter = nextGrid[selectedRow][selectedCol];

      if (curLetter !== '') {
        // Borrar celda actual
        nextGrid[selectedRow][selectedCol] = '';
      } else if (activeWord) {
        // Retroceder a la celda anterior y borrarla
        const coords = activeWord.coords;
        const curIdx = coords.findIndex(([r, c]) => r === selectedRow && c === selectedCol);
        if (curIdx > 0) {
          const [pr, pc] = coords[curIdx - 1];
          setSelectedRow(pr);
          setSelectedCol(pc);
          nextGrid[pr][pc] = '';
        }
      }

      saveActiveCrucigrama(targetDate, {
        userGrid: nextGrid,
        selectedRow,
        selectedCol,
        selectedDirection,
        elapsedSeconds: seconds,
      });

      return nextGrid;
    });
  }, [isWon, selectedRow, selectedCol, selectedDirection, seconds, targetDate, activeWord]);

  // 8. Soporte de Teclado Físico
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isWon || loading) return;

      const key = e.key;

      if (/^[a-zA-ZñÑáéíóúÁÉÍÓÚ]$/.test(key)) {
        e.preventDefault();
        // Quitar tilde si fue ingresada con acento
        const norm = key
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toUpperCase();
        handleInputChar(norm);
      } else if (key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (key === 'ArrowRight') {
        e.preventDefault();
        if (selectedCol + 1 < gridSize && !cells[selectedRow]?.[selectedCol + 1]?.is_block) {
          setSelectedCol((c) => c + 1);
        }
      } else if (key === 'ArrowLeft') {
        e.preventDefault();
        if (selectedCol - 1 >= 0 && !cells[selectedRow]?.[selectedCol - 1]?.is_block) {
          setSelectedCol((c) => c - 1);
        }
      } else if (key === 'ArrowDown') {
        e.preventDefault();
        if (selectedRow + 1 < gridSize && !cells[selectedRow + 1]?.[selectedCol]?.is_block) {
          setSelectedRow((r) => r + 1);
        }
      } else if (key === 'ArrowUp') {
        e.preventDefault();
        if (selectedRow - 1 >= 0 && !cells[selectedRow - 1]?.[selectedCol]?.is_block) {
          setSelectedRow((r) => r - 1);
        }
      } else if (key === 'Tab' || key === 'Enter') {
        e.preventDefault();
        handleNavigateClue(1);
      } else if (key === ' ') {
        e.preventDefault();
        setSelectedDirection((prev) => (prev === 'H' ? 'V' : 'H'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isWon,
    loading,
    selectedRow,
    selectedCol,
    gridSize,
    cells,
    handleInputChar,
    handleBackspace,
    handleNavigateClue,
  ]);

  // Formato mm:ss para el reloj
  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Botón de ayuda/pista: micro-interacción directa en la casilla sin cartel
  const handleRevealCell = () => {
    if (isWon || !cells.length) return;
    const targetCell = cells[selectedRow]?.[selectedCol];
    if (!targetCell || targetCell.is_block) {
      setHintMessage('Seleccioná una casilla libre para revelar');
      setTimeout(() => setHintMessage(null), 2000);
      return;
    }
    const correct = targetCell.letter;
    if (correct) {
      handleInputChar(correct);
      setRevealedCellCoord({ r: selectedRow, c: selectedCol });
      setTimeout(() => {
        setRevealedCellCoord(null);
      }, 1100);
    }
  };

  return (
    <IonPage>
      <IonContent
        fullscreen
        style={
          {
            '--background': '#F8FAFC',
          } as React.CSSProperties
        }
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100%',
            maxWidth: 520,
            margin: '0 auto',
            padding: 'calc(env(safe-area-inset-top, 0px) + 8px) 14px calc(env(safe-area-inset-bottom, 0px) + 12px)',
            boxSizing: 'border-box',
          }}
        >
          {/* HEADER SUPERIOR */}
          <header
            style={{
              display: 'grid',
              gridTemplateColumns: '40px 1fr 40px',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <button
              type="button"
              onClick={() => navigate('/juegos/crucigrama')}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                height: 38,
                width: 38,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#294C6B',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
              aria-label="Volver al calendario"
            >
              <IconChevronLeft size={20} color="#294C6B" />
            </button>

            <div style={{ textAlign: 'center' }}>
              <h1
                style={{
                  color: '#294C6B',
                  fontSize: 17,
                  fontWeight: 900,
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}
              >
                Crucigrama 7x7
              </h1>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  marginTop: 2,
                }}
              >
                <span
                  style={{
                    color: '#64748B',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {targetDate}
                </span>
                <span style={{ color: '#CBD5E1' }}>•</span>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    color: '#294C6B',
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  <IconClock size={13} color="#294C6B" />
                  {formatTimer(seconds)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowClueDrawer((prev) => !prev)}
              style={{
                background: showClueDrawer ? '#294C6B' : '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                height: 38,
                width: 38,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: showClueDrawer ? '#FFFFFF' : '#294C6B',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
              aria-label="Ver todas las pistas"
            >
              <IconList size={18} color={showClueDrawer ? '#FFFFFF' : '#294C6B'} />
            </button>
          </header>

          {/* BARRA DE PISTA ACTIVA FLOTANTE */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 16,
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              padding: '10px 12px',
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              minHeight: 58,
            }}
          >
            <button
              type="button"
              onClick={() => handleNavigateClue(-1)}
              style={{
                background: '#F1F5F9',
                border: 'none',
                borderRadius: 10,
                width: 34,
                height: 34,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              aria-label="Pista anterior"
            >
              <IconChevronLeft size={18} color="#475569" />
            </button>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span
                  style={{
                    background: '#294C6B',
                    color: '#FFFFFF',
                    fontSize: 11,
                    fontWeight: 800,
                    borderRadius: 6,
                    padding: '2px 7px',
                    letterSpacing: '0.04em',
                  }}
                >
                  {activeWord ? `${activeWord.number} ${activeWord.direction === 'horizontal' ? 'HORIZ.' : 'VERT.'}` : 'PISTA'}
                </span>
                <span style={{ color: '#64748B', fontSize: 11, fontWeight: 700 }}>
                  ({activeWord ? `${activeWord.length} letras` : ''})
                </span>
              </div>
              <p
                style={{
                  color: '#1E293B',
                  fontSize: 13,
                  fontWeight: 600,
                  margin: 0,
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {cleanClueText(activeWord?.clue) || 'Seleccioná una casilla en el tablero para ver su pista.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleNavigateClue(1)}
              style={{
                background: '#F1F5F9',
                border: 'none',
                borderRadius: 10,
                width: 34,
                height: 34,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              aria-label="Pista siguiente"
            >
              <IconChevronRight size={18} color="#475569" />
            </button>
          </div>

          {/* TOAST FLOTANTE SUTIL (SIN LAYOUT SHIFT) */}
          {hintMessage && (
            <div
              style={{
                position: 'fixed',
                top: 24,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                background: '#0F172A',
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 700,
                borderRadius: 9999,
                padding: '8px 18px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              <span>💡</span>
              <span>{hintMessage}</span>
            </div>
          )}

          {/* TABLERO 7x7 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '0 auto 12px',
              width: '100%',
              maxWidth: 380,
            }}
          >
            {cells.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  aspectRatio: '1 / 1',
                  background: '#FFFFFF',
                  borderRadius: 14,
                  border: '1px solid #E2E8F0',
                  padding: 20,
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                {loading ? (
                  <>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        border: '3px solid #E2E8F0',
                        borderTopColor: '#294C6B',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        marginBottom: 12,
                      }}
                    />
                    <p style={{ color: '#294C6B', fontSize: 15, fontWeight: 700, margin: 0 }}>
                      Cargando crucigrama...
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ color: '#475569', fontSize: 14, fontWeight: 600, margin: '0 0 14px' }}>
                      No se pudo cargar el desafío de esta fecha.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/juegos/crucigrama')}
                      style={{
                        background: '#294C6B',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 10,
                        padding: '10px 18px',
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      Volver al calendario
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                  gridTemplateRows: `repeat(${gridSize}, 1fr)`,
                  gap: 4,
                  width: '100%',
                  aspectRatio: '1 / 1',
                  background: '#0F172A',
                  padding: 6,
                  borderRadius: 14,
                  boxSizing: 'border-box',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                }}
              >
                {cells.map((rowCells, r) =>
                  rowCells.map((cell, c) => {
                  if (cell.is_block) {
                    return (
                      <div
                        key={`${r}-${c}`}
                        style={{
                          background: '#1E293B',
                          borderRadius: 6,
                          width: '100%',
                          height: '100%',
                          aspectRatio: '1 / 1',
                          boxSizing: 'border-box',
                        }}
                      />
                    );
                  }

                  const isSelected = r === selectedRow && c === selectedCol;
                  const isInActiveWord = activeWordCoordsSet.has(`${r},${c}`);
                  const isRevealed = revealedCellCoord?.r === r && revealedCellCoord?.c === c;
                  const userVal = userGrid[r]?.[c] || '';

                  let bg = '#FFFFFF';
                  let border = '1px solid #CBD5E1';

                  if (isRevealed) {
                    bg = '#BBF7D0'; // Verde menta brillante
                    border = '2px solid #16A34A'; // Verde esmeralda vivo
                  } else if (isSelected) {
                    bg = '#FEF08A'; // Amarillo dorado brillante
                    border = '2px solid #CA8A04';
                  } else if (isInActiveWord) {
                    bg = '#FEF9C3'; // Crema cálido
                    border = '1px solid #FDE047';
                  }

                  return (
                    <button
                      key={`${r}-${c}`}
                      type="button"
                      onClick={() => handleCellClick(r, c)}
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        aspectRatio: '1 / 1',
                        minWidth: 0,
                        minHeight: 0,
                        boxSizing: 'border-box',
                        overflow: 'visible',
                        background: bg,
                        border: border,
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0,
                        transform: isRevealed ? 'scale(1.15)' : 'scale(1)',
                        zIndex: isRevealed ? 25 : isSelected ? 5 : 1,
                        boxShadow: isRevealed
                          ? '0 0 16px rgba(22, 163, 74, 0.55)'
                          : 'none',
                        transition:
                          'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.15s ease, border 0.15s ease, box-shadow 0.25s ease',
                      }}
                      aria-label={`Fila ${r + 1}, columna ${c + 1}`}
                    >
                      {/* Número pequeño de pista en la esquina superior izquierda */}
                      {cell.number != null && (
                        <span
                          style={{
                            position: 'absolute',
                            top: 2,
                            left: 3,
                            fontSize: 10,
                            fontWeight: 800,
                            color: '#475569',
                            lineHeight: 1,
                            pointerEvents: 'none',
                            userSelect: 'none',
                          }}
                        >
                          {cell.number}
                        </span>
                      )}

                      {/* Letra del usuario */}
                      <span
                        style={{
                          fontSize: 20,
                          fontWeight: 900,
                          color: isRevealed ? '#15803D' : '#0F172A',
                          textTransform: 'uppercase',
                          lineHeight: 1,
                          margin: 0,
                          pointerEvents: 'none',
                          userSelect: 'none',
                          transition: 'color 0.2s ease',
                        }}
                      >
                        {userVal}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

          {/* BOTONES AUXILIARES (Pista / Cambiar Dirección) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
              marginBottom: 10,
              padding: '0 4px',
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedDirection((prev) => (prev === 'H' ? 'V' : 'H'))}
              style={{
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: 12,
                color: '#294C6B',
                fontSize: 12,
                fontWeight: 800,
                padding: '8px 14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              <span>Sentido: {selectedDirection === 'H' ? 'Horizontal ➔' : 'Vertical ⬇'}</span>
            </button>

            <button
              type="button"
              onClick={handleRevealCell}
              style={{
                background: '#FEF3C7',
                border: '1px solid #FCD34D',
                borderRadius: 12,
                color: '#92400E',
                fontSize: 12,
                fontWeight: 800,
                padding: '8px 14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              <IconLightbulb size={15} color="#92400E" />
              <span>Revelar letra</span>
            </button>
          </div>

          {/* TECLADO EN PANTALLA TÁCTIL */}
          <div
            style={{
              background: '#E2E8F0',
              padding: '8px 6px',
              borderRadius: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              marginTop: 'auto',
            }}
          >
            {KEYBOARD_ROWS.map((row, rIdx) => (
              <div
                key={rIdx}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 4,
                }}
              >
                {/* En la 3ra fila agregar botón de Siguiente palabra a la izquierda */}
                {rIdx === 2 && (
                  <button
                    type="button"
                    onClick={() => handleNavigateClue(1)}
                    style={{
                      flex: 1.4,
                      background: '#CBD5E1',
                      border: 'none',
                      borderRadius: 8,
                      color: '#1E293B',
                      fontSize: 11,
                      fontWeight: 800,
                      height: 44,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    aria-label="Siguiente palabra"
                  >
                    SIG.
                  </button>
                )}

                {row.map((char) => (
                  <button
                    key={char}
                    type="button"
                    onClick={() => handleInputChar(char)}
                    style={{
                      flex: 1,
                      background: '#FFFFFF',
                      border: 'none',
                      borderRadius: 8,
                      color: '#0F172A',
                      fontSize: 16,
                      fontWeight: 800,
                      height: 44,
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {char}
                  </button>
                ))}

                {/* En la 3ra fila agregar botón Borrar a la derecha */}
                {rIdx === 2 && (
                  <button
                    type="button"
                    onClick={handleBackspace}
                    style={{
                      flex: 1.4,
                      background: '#CBD5E1',
                      border: 'none',
                      borderRadius: 8,
                      color: '#1E293B',
                      height: 44,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    aria-label="Borrar letra"
                  >
                    <IconBackspace size={20} color="#1E293B" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* DRAWER / MODAL CON TODAS LAS PISTAS (LISTA COMPLETA) */}
          {showClueDrawer && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.5)',
                backdropFilter: 'blur(3px)',
                zIndex: 900,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
              }}
              onClick={() => setShowClueDrawer(false)}
            >
              <div
                style={{
                  background: '#FFFFFF',
                  width: '100%',
                  maxWidth: 480,
                  maxHeight: '75vh',
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  padding: '18px 20px 32px',
                  display: 'flex',
                  flexDirection: 'column',
                  overflowY: 'auto',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#294C6B' }}>
                    Pistas del Crucigrama
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowClueDrawer(false)}
                    style={{
                      background: '#F1F5F9',
                      border: 'none',
                      borderRadius: 20,
                      padding: '6px 12px',
                      fontSize: 13,
                      fontWeight: 800,
                      color: '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    Cerrar
                  </button>
                </div>

                {/* HORIZONTALES */}
                <h4 style={{ color: '#294C6B', fontSize: 14, fontWeight: 800, margin: '10px 0 6px' }}>
                  HORIZONTALES
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {words
                    .filter((w) => w.direction === 'horizontal')
                    .map((w) => {
                      const isComplete = w.coords.every(
                        ([r, c]) => (userGrid[r]?.[c] || '').toUpperCase() === cells[r]?.[c]?.letter.toUpperCase()
                      );
                      const isSelected = activeWord?.id === w.id;
                      return (
                        <div
                          key={w.id}
                          onClick={() => {
                            setSelectedRow(w.coords[0][0]);
                            setSelectedCol(w.coords[0][1]);
                            setSelectedDirection('H');
                            setShowClueDrawer(false);
                          }}
                          style={{
                            padding: '8px 10px',
                            borderRadius: 10,
                            background: isSelected ? '#FEF9C3' : '#F8FAFC',
                            border: isSelected ? '1px solid #CA8A04' : '1px solid #E2E8F0',
                            cursor: 'pointer',
                          }}
                        >
                          <span style={{ fontWeight: 800, color: '#294C6B', marginRight: 6 }}>
                            {w.number}.
                          </span>
                          <span style={{ color: isComplete ? '#059669' : '#1E293B', fontSize: 13 }}>
                            {cleanClueText(w.clue)}
                          </span>
                          {isComplete && <span style={{ marginLeft: 6, color: '#059669', fontWeight: 800 }}>✓</span>}
                        </div>
                      );
                    })}
                </div>

                {/* VERTICALES */}
                <h4 style={{ color: '#294C6B', fontSize: 14, fontWeight: 800, margin: '10px 0 6px' }}>
                  VERTICALES
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {words
                    .filter((w) => w.direction === 'vertical')
                    .map((w) => {
                      const isComplete = w.coords.every(
                        ([r, c]) => (userGrid[r]?.[c] || '').toUpperCase() === cells[r]?.[c]?.letter.toUpperCase()
                      );
                      const isSelected = activeWord?.id === w.id;
                      return (
                        <div
                          key={w.id}
                          onClick={() => {
                            setSelectedRow(w.coords[0][0]);
                            setSelectedCol(w.coords[0][1]);
                            setSelectedDirection('V');
                            setShowClueDrawer(false);
                          }}
                          style={{
                            padding: '8px 10px',
                            borderRadius: 10,
                            background: isSelected ? '#FEF9C3' : '#F8FAFC',
                            border: isSelected ? '1px solid #CA8A04' : '1px solid #E2E8F0',
                            cursor: 'pointer',
                          }}
                        >
                          <span style={{ fontWeight: 800, color: '#294C6B', marginRight: 6 }}>
                            {w.number}.
                          </span>
                          <span style={{ color: isComplete ? '#059669' : '#1E293B', fontSize: 13 }}>
                            {cleanClueText(w.clue)}
                          </span>
                          {isComplete && <span style={{ marginLeft: 6, color: '#059669', fontWeight: 800 }}>✓</span>}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* MODAL DE VICTORIA */}
          {showVictoryModal && (
            <CrucigramaCompletedModal
              challenge={{
                dateStr: targetDate,
                stars: 3,
                score: 100,
                config: {
                  theme,
                  words,
                  timeTaken: seconds,
                },
              }}
              onClose={() => {
                setShowVictoryModal(false);
                navigate('/juegos/crucigrama');
              }}
            />
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CrucigramaGame;
