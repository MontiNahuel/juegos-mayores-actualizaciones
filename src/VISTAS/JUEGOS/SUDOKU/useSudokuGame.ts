import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SudokuCell, SudokuGrid, DifficultyLevel } from './types';
import { generateDailyPuzzle, hasConflict } from './sudokuEngine';
import { saveFinalGameAttempt } from '../attemptsService';
import { usePlayerEconomy } from '../../../context/PlayerEconomyContext';
import {
  getSudokuLocalProgress,
  saveSudokuLocalProgress,
  clearSudokuLocalProgress,
} from './sudokuStorage';

/**
 * Cantidad de vidas / corazones según la dificultad seleccionada:
 * - Nivel 1 (Fácil / Bajo): 7 corazones
 * - Nivel 2 (Medio): 5 corazones
 * - Nivel 3 (Alto / Difícil): 3 corazones
 */
export function getMaxLives(level: DifficultyLevel): number {
  if (level === 1) return 7;
  if (level === 2) return 5;
  return 3;
}

export function useSudokuGame() {
  const location = useLocation();
  const navigate = useNavigate();

  const challenge = location.state?.challenge;
  const initialDifficulty: DifficultyLevel = (location.state?.difficultyLevel as DifficultyLevel) || 1;
  const dateKey = challenge?.dateKey || new Date().toISOString().slice(0, 10);
  const dateStr = challenge?.dateStr || 'Desafío de hoy';
  const dayNumber = challenge?.day || parseInt(dateKey.split('-')[2], 10);

  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevel>(() => {
    const saved = getSudokuLocalProgress(dateKey);
    return saved?.difficultyLevel || initialDifficulty;
  });

  const maxLives = useMemo(() => getMaxLives(difficultyLevel), [difficultyLevel]);

  const [cells, setCells] = useState<SudokuCell[][]>([]);
  const [solution, setSolution] = useState<SudokuGrid>([]);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [selectedCol, setSelectedCol] = useState<number | null>(null);
  const economy = usePlayerEconomy();
  const lives = economy.vidas;
  const [errors, setErrors] = useState<number>(0);
  const [isNotesMode, setIsNotesMode] = useState<boolean>(false);
  const [hintsLeft, setHintsLeft] = useState<number>(999);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  // Inicializar o reiniciar partida del día
  const initGame = useCallback((forceFresh: boolean = false) => {
    if (!forceFresh) {
      const saved = getSudokuLocalProgress(dateKey);
      if (saved) {
        setDifficultyLevel(saved.difficultyLevel);
        setSolution(saved.solution);
        setCells(saved.cells);
        setSelectedRow(null);
        setSelectedCol(null);
        // Vidas globales gestionadas vía economy
        setErrors(saved.errors);
        setHintsLeft(saved.hintsLeft);
        setIsWon(false);
        setIsGameOver(false);
        return;
      }
    }

    clearSudokuLocalProgress(dateKey);

    const targetDiff = (location.state?.difficultyLevel as DifficultyLevel) || difficultyLevel || 1;
    setDifficultyLevel(targetDiff);

    let initB: SudokuGrid;
    let solB: SudokuGrid;

    if (challenge?.config?.boards && challenge?.config?.solution) {
      const levelKey = String(targetDiff);
      initB = challenge.config.boards[levelKey] || challenge.config.boards['1'] || challenge.config.initialBoard;
      solB = challenge.config.solution;
    } else if (challenge?.config?.initialBoard && challenge?.config?.solution) {
      initB = challenge.config.initialBoard;
      solB = challenge.config.solution;
    } else {
      const puzzle = generateDailyPuzzle(dateKey, targetDiff);
      initB = puzzle.initialBoard;
      solB = puzzle.solution;
    }

    setSolution(solB);

    const initialCells: SudokuCell[][] = initB.map((row, r) =>
      row.map((val, c) => ({
        row: r,
        col: c,
        value: val,
        initial: val !== 0,
        error: false,
        notes: [],
      }))
    );

    setCells(initialCells);
    setSelectedRow(null);
    setSelectedCol(null);
    // Vidas globales administradas por economy
    setErrors(0);
    setHintsLeft(999);
    setIsWon(false);
    setIsGameOver(false);

    // Guardar el estado inicial inmediatamente para que si sale se recuerde la partida
    saveSudokuLocalProgress({
      date: dateKey,
      difficultyLevel: targetDiff,
      cells: initialCells,
      solution: solB,
      lives: getMaxLives(targetDiff),
      errors: 0,
      hintsLeft: 999,
    });
  }, [challenge, dateKey, location.state?.difficultyLevel, difficultyLevel]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Persistir en localStorage en cada cambio de celdas, vidas o pistas (solo mientras está en curso)
  useEffect(() => {
    if (!cells.length || !solution.length || isWon || isGameOver) return;

    saveSudokuLocalProgress({
      date: dateKey,
      difficultyLevel,
      cells,
      solution,
      lives,
      errors,
      hintsLeft,
    });
  }, [cells, solution, lives, errors, hintsLeft, difficultyLevel, dateKey, isWon, isGameOver]);

  // Contar cuántas veces se colocó cada número válido (1 al 9)
  const numberCounts = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
    cells.forEach(row => {
      row.forEach(cell => {
        if (cell.value >= 1 && cell.value <= 9 && !cell.error) {
          counts[cell.value] = (counts[cell.value] || 0) + 1;
        }
      });
    });
    return counts;
  }, [cells]);

  // Selección de celda
  const selectCell = (row: number, col: number) => {
    if (isWon || isGameOver) return;
    setSelectedRow(row);
    setSelectedCol(col);
  };

  // Entrada de número
  const inputNumber = (num: number) => {
    if (selectedRow === null || selectedCol === null || isWon || isGameOver) return;
    const current = cells[selectedRow][selectedCol];
    if (current.initial) return;

    if (isNotesMode) {
      setCells(prev => {
        const copy = prev.map(r => r.map(c => ({ ...c })));
        const target = copy[selectedRow][selectedCol];
        if (target.notes.includes(num)) {
          target.notes = target.notes.filter(n => n !== num);
        } else {
          target.notes = [...target.notes, num].sort();
        }
        return copy;
      });
      return;
    }

    const isCorrect = solution.length > 0 && solution[selectedRow][selectedCol] === num;

    setCells(prev => {
      const copy = prev.map(r => r.map(c => ({ ...c })));
      const target = copy[selectedRow][selectedCol];
      target.value = num;
      target.notes = [];

      const numericGrid = copy.map(r => r.map(c => c.value));
      const conflict = hasConflict(numericGrid, selectedRow, selectedCol, num);
      target.error = !isCorrect || conflict;

      return copy;
    });

    // Descontar vida si se equivocó
    if (!isCorrect) {
      const newErrors = errors + 1;
      setErrors(newErrors);

      economy.consumirVida().then((hasRemaining) => {
        if (!hasRemaining) {
          setIsGameOver(true);
          clearSudokuLocalProgress(dateKey);
        }
      });
    }
  };

  // Borrar
  const eraseCell = () => {
    if (selectedRow === null || selectedCol === null || isWon || isGameOver) return;
    const current = cells[selectedRow][selectedCol];
    if (current.initial) return;

    setCells(prev => {
      const copy = prev.map(r => r.map(c => ({ ...c })));
      copy[selectedRow][selectedCol].value = 0;
      copy[selectedRow][selectedCol].notes = [];
      copy[selectedRow][selectedCol].error = false;
      return copy;
    });
  };

  // Pista: revela el número correcto y disminuye el contador en 1 garantizado.
  // Si no hay celda seleccionada (o es fija/correcta), busca automáticamente una celda vacía.
  const useHint = () => {
    if (hintsLeft <= 0 || isWon || isGameOver || !solution.length || !cells.length) return;

    let targetRow = selectedRow;
    let targetCol = selectedCol;

    const isCurrentEligible =
      targetRow !== null &&
      targetCol !== null &&
      !cells[targetRow][targetCol].initial &&
      cells[targetRow][targetCol].value !== solution[targetRow][targetCol];

    if (!isCurrentEligible) {
      // Buscar la primera celda vacía o incorrecta en el tablero
      let found = false;
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (!cells[r][c].initial && cells[r][c].value !== solution[r][c]) {
            targetRow = r;
            targetCol = c;
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (!found) return; // Tablero ya resuelto
    }

    if (targetRow === null || targetCol === null) return;

    const correct = solution[targetRow][targetCol];

    // Enfocar y seleccionar la celda revelada
    setSelectedRow(targetRow);
    setSelectedCol(targetCol);

    setCells(prev => {
      const copy = prev.map(r => r.map(c => ({ ...c })));
      copy[targetRow!][targetCol!].value = correct;
      copy[targetRow!][targetCol!].notes = [];
      copy[targetRow!][targetCol!].error = false;
      return copy;
    });

    setHintsLeft(prev => Math.max(0, prev - 1));
  };

  // Verificación de victoria
  useEffect(() => {
    if (!cells.length || !solution.length || isWon || isGameOver) return;

    const isAllFilledAndCorrect = cells.every((row, r) =>
      row.every((cell, c) => cell.value === solution[r][c] && !cell.error)
    );

    if (isAllFilledAndCorrect) {
      setIsWon(true);
      // Limpiar partida activa de localStorage al ganar
      clearSudokuLocalProgress(dateKey);

      const starsEarned = errors === 0 ? 3 : errors <= Math.ceil(maxLives / 3) ? 2 : 1;
      saveFinalGameAttempt({
        gameId: 'sudoku',
        date: dateKey,
        day: dayNumber,
        guesses: [],
        status: 'won',
        attempts: errors,
        stars: starsEarned,
        score: starsEarned * 50,
      });
    }
  }, [cells, solution, isWon, isGameOver, errors, maxLives, dateKey, dayNumber]);

  // Soporte de Teclado Físico (computadora / laptop)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el usuario está en un input de texto o si el juego ya terminó
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        isWon ||
        isGameOver
      ) {
        return;
      }

      // 1. Números del 1 al 9 (teclado alfanumérico y teclado numérico Numpad)
      if (/^[1-9]$/.test(e.key)) {
        e.preventDefault();
        inputNumber(Number(e.key));
        return;
      }

      // 2. Borrar celda (Backspace o Delete)
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        eraseCell();
        return;
      }

      // 3. Mover celda activa con Flechas del teclado
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        setSelectedRow((prevR) => {
          const r = prevR !== null ? prevR : 0;
          if (e.key === 'ArrowUp') return Math.max(0, r - 1);
          if (e.key === 'ArrowDown') return Math.min(8, r + 1);
          return r;
        });
        setSelectedCol((prevC) => {
          const c = prevC !== null ? prevC : 0;
          if (e.key === 'ArrowLeft') return Math.max(0, c - 1);
          if (e.key === 'ArrowRight') return Math.min(8, c + 1);
          return c;
        });
        return;
      }

      // 4. Alternar Modo Lápiz / Notas con 'n' o 'N'
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setIsNotesMode((prev) => !prev);
        return;
      }

      // 5. Pedir Pista con 'p', 'P', 'h' o 'H'
      if (['p', 'P', 'h', 'H'].includes(e.key)) {
        e.preventDefault();
        useHint();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputNumber, eraseCell, useHint, isWon, isGameOver]);

  return {
    dateStr,
    difficultyLevel,
    maxLives,
    cells,
    selectedRow,
    selectedCol,
    lives,
    errors,
    hintsLeft,
    isNotesMode,
    numberCounts,
    isWon,
    isGameOver,
    stars: errors === 0 ? 3 : errors <= Math.ceil(maxLives / 3) ? 2 : 1,
    selectCell,
    inputNumber,
    eraseCell,
    useHint,
    toggleNotes: () => setIsNotesMode(p => !p),
    restart: () => initGame(true),
    goBack: () => navigate('/juegos/sudoku'),
  };
}

