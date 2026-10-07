import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Menu from './MENU/Menu';
import WordleGame from './JUEGOS/WORDLE/WordleGame';

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/menu" element={<Menu />} />
      <Route path="/juegos/wordle" element={<WordleGame />} />
      <Route path="/" element={<Navigate to="/menu" replace />} />
      <Route path="*" element={<Navigate to="/menu" replace />} />
    </Routes>
  </BrowserRouter>
);

export default AppRoutes;
