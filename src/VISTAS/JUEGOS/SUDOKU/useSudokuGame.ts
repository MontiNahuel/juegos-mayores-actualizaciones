import { useClassicChallenge } from '../useClassicChallenge';
/* Lleva la lógica de números, notas, errores, pistas y guardado del Sudoku. */
/* Lleva la lógica de números, notas, errores, pistas y guardado del Sudoku. */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SudokuCell, SudokuGrid, DifficultyLevel } from './types';
import { generateDailyPuzzle, hasConflict } from './sudokuEngine';
import { getActiveGameProgress, saveActiveGameProgress } from '../attemptsService';
import { usePlayerEconomy } from '../../../context/PlayerEconomyContext';
import {
  getSudokuLocalProgress,
  clearSudokuLocalProgress,
} from './sudokuStorage';


// Lleva la lógica de números, notas, errores, pistas y guardado del Sudoku.
export function useSudokuGame() {
  const location = useLocation();
  const navigate = useNavigate();

  const challenge = location.state?.challenge;
  const initialDifficulty: DifficultyLevel = (location.state?.difficultyLevel as DifficultyLevel) || 1;
  const dateKey = challenge?.dateKey || new Date().toISOString().slice(0, 10);
  const dateStr = challenge?.dateStr || 'Desafío de hoy';
  const dayNumber = challenge?.day || parseInt(dateKey.split('-')[2], 10);

  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevel>(/* Prepara el valor inicial al montar la pantalla. */ () => {
    const saved = getSudokuLocalProgress(dateKey);
    return saved?.difficultyLevel || initialDifficulty;
  });


  const [cells, setCells] = useState<SudokuCell[][]>([]);
  const [solution, setSolution] = useState<SudokuGrid>([]);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [selectedCol, setSelectedCol] = useState<number | null>(null);
  const economy = usePlayerEconomy();
  const [loadedDate, setLoadedDate] = useState('');
  const progressReady = loadedDate === dateKey;
  const [errors, setErrors] = useState<number>(0);
  const [isNotesMode, setIsNotesMode] = useState<boolean>(false);
  const [isWon, setIsWon] = useState<boolean>(false);

  const classic = useClassicChallenge('sudoku', dateKey, progressReady && !isWon, economy);

  // Inicializar o reiniciar partida del día
  const initGame = useCallback(async (forceFresh: boolean = false) => {
    setLoadedDate('');
    if (!forceFresh) {
      const progress = await getActiveGameProgress('sudoku', dateKey);
      if (progress) classic.restore(progress);
      const saved = progress?.gameData?.cells ? progress.gameData : getSudokuLocalProgress(dateKey);
      if (saved) {
        setDifficultyLevel(saved.difficultyLevel);
        setSolution(saved.solution);
        setCells(saved.cells);
        setSelectedRow(null);
        setSelectedCol(null);
        setErrors(saved.errors);
        setIsWon(progress?.status === 'won' || progress?.status === 'completed');
        setLoadedDate(dateKey);
        return;
      }
    }

    classic.reset();
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

    const initialCells: SudokuCell[][] = initB.map(/* Prepara el resultado de cada elemento. */ (row, r) =>
      row.map(/* Prepara el resultado de cada elemento. */ (val, c) => ({
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
    setErrors(0);
    setIsWon(false);

    setLoadedDate(dateKey);
  }, [challenge, dateKey, location.state?.difficultyLevel]);

  useEffect(/* Sincroniza este efecto cuando cambian los datos de los que depende. */ () => {
    initGame();
  }, [initGame]);

  // Persistir el tablero y los errores mientras la partida está en curso.
  useEffect(/* Sincroniza este efecto cuando cambian los datos de los que depende. */ () => {
    if (!progressReady || !cells.length || !solution.length || isWon) return;

    void saveActiveGameProgress({
      gameId: 'sudoku', date: dateKey, guesses: [], attempts: errors,
      status: 'in_progress',
      gameData: { difficultyLevel, cells, solution, errors, elapsedSeconds: classic.seconds },
    });
  }, [cells, solution, errors, difficultyLevel, dateKey, isWon, progressReady]);

  // Contar cuántas veces se colocó cada número válido (1 al 9)
  const numberCounts = useMemo(/* Recalcula este dato cuando cambian sus dependencias. */ () => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
    cells.forEach(/* Aplica este paso a cada elemento. */ row => {
      row.forEach(/* Aplica este paso a cada elemento. */ cell => {
        if (cell.value >= 1 && cell.value <= 9 && !cell.error) {
          counts[cell.value] = (counts[cell.value] || 0) + 1;
        }
      });
    });
    return counts;
  }, [cells]);

  // Selección de celda
  const selectCell = (row: number, col: number) => {
    if (!progressReady || isWon) return;
    setSelectedRow(row);
    setSelectedCol(col);
  };

  // Entrada de número
  const inputNumber = (num: number) => {
    if (!progressReady || selectedRow === null || selectedCol === null || isWon) return;
    const current = cells[selectedRow][selectedCol];
    if (current.initial) return;

    if (isNotesMode) {
      setCells(/* Actualiza cells a partir del valor anterior. */ prev => {
        const copy = prev.map(/* Prepara el resultado de cada elemento. */ r => r.map(/* Prepara el resultado de cada elemento. */ c => ({ ...c })));
        const target = copy[selectedRow][selectedCol];
        if (target.notes.includes(num)) {
          target.notes = target.notes.filter(/* Conserva los elementos que cumplen esta condición. */ n => n !== num);
        } else {
          target.notes = [...target.notes, num].sort();
        }
        return copy;
      });
      return;
    }

    const isCorrect = solution.length > 0 && solution[selectedRow][selectedCol] === num;

    setCells(/* Actualiza cells a partir del valor anterior. */ prev => {
      const copy = prev.map(/* Prepara el resultado de cada elemento. */ r => r.map(/* Prepara el resultado de cada elemento. */ c => ({ ...c })));
      const target = copy[selectedRow][selectedCol];
      target.value = num;
      target.notes = [];

      const numericGrid = copy.map(/* Prepara el resultado de cada elemento. */ r => r.map(/* Prepara el resultado de cada elemento. */ c => c.value));
      const conflict = hasConflict(numericGrid, selectedRow, selectedCol, num);
      target.error = !isCorrect || conflict;

      return copy;
    });

    // Registrar errores para la calificación, sin limitar intentos.
    if (!isCorrect) {
      const newErrors = errors + 1;
      setErrors(newErrors);

    }
  };

  // Borrar
  const eraseCell = () => {
    if (!progressReady || selectedRow === null || selectedCol === null || isWon) return;
    const current = cells[selectedRow][selectedCol];
    if (current.initial) return;

    setCells(/* Actualiza cells a partir del valor anterior. */ prev => {
      const copy = prev.map(/* Prepara el resultado de cada elemento. */ r => r.map(/* Prepara el resultado de cada elemento. */ c => ({ ...c })));
      copy[selectedRow][selectedCol].value = 0;
      copy[selectedRow][selectedCol].notes = [];
      copy[selectedRow][selectedCol].error = false;
      return copy;
    });
  };

  // El canje se confirma en el modal antes de revelar la pista.
  const useHint = () => {
    if (!progressReady || isWon || !solution.length || !cells.length) return;
    const seleccionada = selectedRow !== null && selectedCol !== null ? cells[selectedRow]?.[selectedCol] : null;
    const casilla = seleccionada && !seleccionada.initial && seleccionada.value !== solution[seleccionada.row][seleccionada.col]
      ? seleccionada : cells.flat().find(/* Busca el primer elemento que cumple esta condición. */ c => !c.initial && c.value !== solution[c.row][c.col]);
    if (!casilla) return;
    const { row, col } = casilla;
    economy.abrirComprarPista({ game_id: 'sudoku', date: dateKey, row, col,
      // Aplica al tablero la pista que confirmó el servidor.
      onRecibir: data => {
        const valor = Number(data.valor_revelado);
        if (!Number.isInteger(valor) || valor < 1 || valor > 9) throw new Error('Pista inválida');
        setCells(/* Actualiza cells a partir del valor anterior. */ prev => prev.map(/* Prepara el resultado de cada elemento. */ fila => fila.map(/* Prepara el resultado de cada elemento. */ c => c.row === row && c.col === col ? { ...c, value: valor, error: false, notes: [] } : c)));
        setSelectedRow(row); setSelectedCol(col);
      },
    });
  };
  // Verificación de victoria
  useEffect(/* Sincroniza este efecto cuando cambian los datos de los que depende. */ () => {
    if (!progressReady || !cells.length || !solution.length || isWon) return;

    const isAllFilledAndCorrect = cells.every(/* Comprueba que todos los elementos cumplan esta condición. */ (row, r) =>
      row.every(/* Comprueba que todos los elementos cumplan esta condición. */ (cell, c) => cell.value === solution[r][c] && !cell.error)
    );

    if (isAllFilledAndCorrect) {
      setIsWon(true);
      // Limpiar partida activa de localStorage al ganar
      clearSudokuLocalProgress(dateKey);

      classic.complete({
        day: dayNumber,
        guesses: [],
        status: 'won',
        attempts: errors,
        gameData: { difficultyLevel, cells, solution, errors },
      });
    }
  }, [cells, solution, isWon, errors, dateKey, dayNumber, progressReady]);

  // Soporte de Teclado Físico (computadora / laptop)
  useEffect(/* Sincroniza este efecto cuando cambian los datos de los que depende. */ () => {
    // Traduce la tecla a una acción del juego o de la ventana.
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el usuario está en un input de texto o si el juego ya terminó
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        isWon ||
        !progressReady
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
        setSelectedRow(/* Actualiza selected row a partir del valor anterior. */ (prevR) => {
          const r = prevR !== null ? prevR : 0;
          if (e.key === 'ArrowUp') return Math.max(0, r - 1);
          if (e.key === 'ArrowDown') return Math.min(8, r + 1);
          return r;
        });
        setSelectedCol(/* Actualiza selected col a partir del valor anterior. */ (prevC) => {
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
        setIsNotesMode(/* Actualiza is notes mode a partir del valor anterior. */ (prev) => !prev);
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
    return /* Libera los recursos de este efecto cuando deja de usarse. */ () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputNumber, eraseCell, useHint, isWon, progressReady]);

  return {
    dateStr,
    completion: classic.completion,
    progressReady,
    difficultyLevel,
    cells,
    selectedRow,
    selectedCol,
    errors,
    isNotesMode,
    numberCounts,
    isWon,
    selectCell,
    inputNumber,
    eraseCell,
    useHint,
    // Alterna entre escribir números y tomar notas.
    toggleNotes: () => setIsNotesMode(/* Actualiza is notes mode a partir del valor anterior. */ p => !p),
    // Prepara otra vez la partida desde el inicio.
    restart: () => initGame(true),
    // Vuelve a la pantalla anterior.
    goBack: () => navigate('/juegos/sudoku'),
  };
}

