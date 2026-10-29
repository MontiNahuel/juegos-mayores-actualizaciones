import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from 'react-router-dom';
import Menu from './MENU/Menu';
import WordleCalendar from './JUEGOS/WORDLE/WordleCalendar';
import WordleGame from './JUEGOS/WORDLE/WordleGame';
import SopaLetrasCalendar from './JUEGOS/SOPA_LETRAS/SopaLetrasCalendar';
import SopaLetrasGame from './JUEGOS/SOPA_LETRAS/SopaLetrasGame';
import SudokuCalendar from './JUEGOS/SUDOKU/SudokuCalendar';
import SudokuGame from './JUEGOS/SUDOKU/SudokuGame';
import CrucigramaCalendar from './JUEGOS/CRUCIGRAMA/CrucigramaCalendar';
import CrucigramaGame from './JUEGOS/CRUCIGRAMA/CrucigramaGame';
import KingsCourtCalendar from './JUEGOS/NARRATIVO/KingsCourtCalendar';
import KingsCourt from './JUEGOS/NARRATIVO/KingsCourt';
import { AccesoToken } from './LOGIN/AccesoToken';

const NarrativoAdminPage = lazy(() => import('./ADMIN/NarrativoAdminPage'));

// Intercepta token en /menu para iniciar sesión de inmediato en vez de quedar como invitado
const MenuWrapper = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  if (token) {
    return <Navigate to={`/acceso?token=${encodeURIComponent(token)}`} replace />;
  }
  return <Menu />;
};

// Redirecciona / o cualquier ruta comodín con ?token=... hacia /acceso para loguear
const RootRedirection = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  if (token) {
    return <Navigate to={`/acceso?token=${encodeURIComponent(token)}`} replace />;
  }
  return <Navigate to="/menu" replace />;
};

const FallbackLoader = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-400 font-bold">
    Cargando Torre de Control...
  </div>
);

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/acceso" element={<AccesoToken />} />
      <Route path="/menu" element={<MenuWrapper />} />
      <Route path="/juegos/wordle" element={<WordleCalendar />} />
      <Route path="/juegos/wordle/jugar" element={<WordleGame />} />
      <Route path="/juegos/sopa-letras" element={<SopaLetrasCalendar />} />
      <Route path="/juegos/sopa-letras/jugar" element={<SopaLetrasGame />} />
      <Route path="/juegos/sudoku" element={<SudokuCalendar />} />
      <Route path="/juegos/sudoku/jugar" element={<SudokuGame />} />
      <Route path="/juegos/crucigrama" element={<CrucigramaCalendar />} />
      <Route path="/juegos/crucigrama/jugar" element={<CrucigramaGame />} />
      <Route path="/juegos/kings-court" element={<KingsCourtCalendar />} />
      <Route path="/juegos/kings-court/jugar" element={<KingsCourt />} />

      {/* Torre de Control / Panel Administrativo de Juegos y Narrativa */}
      <Route
        path="/panel"
        element={
          <Suspense fallback={<FallbackLoader />}>
            <NarrativoAdminPage />
          </Suspense>
        }
      />
      <Route
        path="/panel-juegos"
        element={
          <Suspense fallback={<FallbackLoader />}>
            <NarrativoAdminPage />
          </Suspense>
        }
      />
      <Route
        path="/editor-narrativo"
        element={
          <Suspense fallback={<FallbackLoader />}>
            <NarrativoAdminPage />
          </Suspense>
        }
      />
      <Route
        path="/torre"
        element={
          <Suspense fallback={<FallbackLoader />}>
            <NarrativoAdminPage />
          </Suspense>
        }
      />
      <Route
        path="/login"
        element={
          <Suspense fallback={<FallbackLoader />}>
            <NarrativoAdminPage />
          </Suspense>
        }
      />

      {/* Aliases de conveniencia */}
      <Route path="/admin" element={<Navigate to="/panel" replace />} />
      <Route path="/admin/narrativo" element={<Navigate to="/panel" replace />} />

      <Route path="/" element={<RootRedirection />} />
      <Route path="*" element={<RootRedirection />} />
    </Routes>
  </BrowserRouter>
);

export default AppRoutes;
