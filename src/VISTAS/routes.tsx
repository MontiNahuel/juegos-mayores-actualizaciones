import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Menu from './MENU/Menu';
import WordleCalendar from './JUEGOS/WORDLE/WordleCalendar';
import WordleGame from './JUEGOS/WORDLE/WordleGame';
import SopaLetrasCalendar from './JUEGOS/SOPA_LETRAS/SopaLetrasCalendar';
import SopaLetrasGame from './JUEGOS/SOPA_LETRAS/SopaLetrasGame';
import SudokuCalendar from './JUEGOS/SUDOKU/SudokuCalendar';
import SudokuGame from './JUEGOS/SUDOKU/SudokuGame';
import CrucigramaCalendar from './JUEGOS/CRUCIGRAMA/CrucigramaCalendar';
import CrucigramaGame from './JUEGOS/CRUCIGRAMA/CrucigramaGame';

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/menu" element={<Menu />} />
      <Route path="/juegos/wordle" element={<WordleCalendar />} />
      <Route path="/juegos/wordle/jugar" element={<WordleGame />} />
      <Route path="/juegos/sopa-letras" element={<SopaLetrasCalendar />} />
      <Route path="/juegos/sopa-letras/jugar" element={<SopaLetrasGame />} />
      <Route path="/juegos/sudoku" element={<SudokuCalendar />} />
      <Route path="/juegos/sudoku/jugar" element={<SudokuGame />} />
      <Route path="/juegos/crucigrama" element={<CrucigramaCalendar />} />
      <Route path="/juegos/crucigrama/jugar" element={<CrucigramaGame />} />
      <Route path="/" element={<Navigate to="/menu" replace />} />
      <Route path="*" element={<Navigate to="/menu" replace />} />
    </Routes>
  </BrowserRouter>
);

export default AppRoutes;
