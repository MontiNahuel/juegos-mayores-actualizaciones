import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginSistemas from './LoginSistemas';
import RutaProtegidaSistemas from './RutaProtegidaSistemas';
import PanelAltasSistemas from './PanelAltasSistemas';
import './admin.css';

const container = document.getElementById('root');
const root = createRoot(container);

const basename = window.location.pathname.startsWith('/admin_src') ? '/admin_src' : '/admin';

root.render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/login" element={<LoginSistemas />} />
        <Route
          path="/"
          element={
            <RutaProtegidaSistemas>
              <PanelAltasSistemas />
            </RutaProtegidaSistemas>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
