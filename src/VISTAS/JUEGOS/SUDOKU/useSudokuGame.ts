import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SudokuCell, SudokuGrid } from './types';
import { generateDailyPuzzle, hasConflict } from './sudokuEngine';
import { saveFinalGameAttempt } from '../attemptsService';

export const MAX_LIVES = 3;

export function useSudokuGame() {
  const location = useLocation();
  const navigate = useNavigate();

  const challenge = location.state?.challenge;
  const dateKey = challenge?.dateKey || new Date().toISOString().slice(0, 10);
  const dateStr = challenge?.dateStr || 'Desafío de hoy';
  const dayNumber = challenge?.day || parseInt(dateKey.split('-')[2], 10);

  const [cells, setCells] = useState<SudokuCell[][]>([]);
  const [solution, setSolution] = useState<SudokuGrid>([]);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [selectedCol, setSelectedCol] = useState<number | null>(null);
  const [lives, setLives] = useState<number>(MAX_LIVES);
  const [errors, setErrors] = useState<number>(0);
  const [isNotesMode, setIsNotesMode] = useState<boolean>(false);
  const [hintsLeft, setHintsLeft] = useState<number>(3);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  // Inicializar o reiniciar partida del día
  const initGame = useCallback(() => {
    let initB: SudokuGrid;
    let solB: SudokuGrid;

    if (challenge?.config?.initialBoard && challenge?.config?.solution) {
      initB = challenge.config.initialBoard;
      solB = challenge.config.solution;
    } else {
      const puzzle = generateDailyPuzzle(dateKey);
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
    setLives(MAX_LIVES);
    setErrors(0);
    setHintsLeft(3);
    setIsWon(false);
    setIsGameOver(false);
  }, [challenge, dateKey]);

  useEffect(() => {
    initGame();
  }, [initGame]);

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
      const newLives = lives - 1;
      const newErrors = errors + 1;
      setLives(newLives);
      setErrors(newErrors);

      if (newLives <= 0) {
        setIsGameOver(true);
        saveFinalGameAttempt({
          gameId: 'sudoku',
          date: dateKey,
          day: dayNumber,
          status: 'lost',
          attempts: newErrors,
          guesses: [],
          stars: 0,
          score: 0,
        });
      }
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

  // Pista (revela el número correcto en la celda seleccionada)
  const useHint = () => {
    if (selectedRow === null || selectedCol === null || hintsLeft <= 0 || isWon || isGameOver) return;
    const target = cells[selectedRow][selectedCol];
    if (target.initial || !solution.length) return;

    const correct = solution[selectedRow][selectedCol];
    setCells(prev => {
      const copy = prev.map(r => r.map(c => ({ ...c })));
      copy[selectedRow][selectedCol].value = correct;
      copy[selectedRow][selectedCol].notes = [];
      copy[selectedRow][selectedCol].error = false;
      return copy;
    });
    setHintsLeft(prev => prev - 1);
  };

  // Verificación de victoria
  useEffect(() => {
    if (!cells.length || !solution.length || isWon || isGameOver) return;

    const isAllFilledAndCorrect = cells.every((row, r) =>
      row.every((cell, c) => cell.value === solution[r][c] && !cell.error)
    );

    if (isAllFilledAndCorrect) {
      setIsWon(true);
      const starsEarned = errors === 0 ? 3 : errors === 1 ? 2 : 1;
      saveFinalGameAttempt({
        gameId: 'sudoku',
        date: dateKey,
        day: dayNumber,
        status: 'won',
        attempts: errors,
        stars: starsEarned,
        guesses: [],
        score: starsEarned * 50,
      });
    }
  }, [cells, solution, isWon, isGameOver, errors, dateKey, dayNumber]);

  return {
    dateStr,
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
    stars: errors === 0 ? 3 : errors === 1 ? 2 : 1,
    selectCell,
    inputNumber,
    eraseCell,
    useHint,
    toggleNotes: () => setIsNotesMode(p => !p),
    restart: initGame,
    goBack: () => navigate('/juegos/sudoku'),
  };
}

