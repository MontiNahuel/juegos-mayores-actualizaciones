/* Arranca React y conecta las secciones del panel de administración. */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginSistemas from './LoginSistemas';
import RutaProtegidaSistemas from './RutaProtegidaSistemas';
import PanelJuegosAdmin from './PanelJuegosAdmin';
import { instalarInterceptorAdmin } from './authService';
import './admin.css';

instalarInterceptorAdmin();

const container = document.getElementById('root');
const root = createRoot(container);

const basename = window.location.pathname.startsWith('/admin_src') ? '/admin_src' : '/admin';

// Conserva ?ticket=... al entrar por la raíz o por una ruta histórica.
const RaizRedirige = () => {
  const { search } = useLocation();
  return <Navigate to={`/juegos${search}`} replace />;
};

root.render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/login" element={<LoginSistemas />} />
        <Route path="/altas" element={<RaizRedirige />} />
        <Route
          path="/juegos"
          element={
            <RutaProtegidaSistemas>
              <PanelJuegosAdmin />
            </RutaProtegidaSistemas>
          }
        />
        <Route path="/" element={<RaizRedirige />} />
        <Route path="*" element={<RaizRedirige />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
