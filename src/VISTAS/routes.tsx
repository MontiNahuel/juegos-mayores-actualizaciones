import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Menu from './MENU/Menu';
import WordleCalendar from './JUEGOS/WORDLE/WordleCalendar';
import WordleGame from './JUEGOS/WORDLE/WordleGame';

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/menu" element={<Menu />} />
      <Route path="/juegos/wordle" element={<WordleCalendar />} />
      <Route path="/juegos/wordle/jugar" element={<WordleGame />} />
      <Route path="/" element={<Navigate to="/menu" replace />} />
      <Route path="*" element={<Navigate to="/menu" replace />} />
    </Routes>
  </BrowserRouter>
);

export default AppRoutes;
