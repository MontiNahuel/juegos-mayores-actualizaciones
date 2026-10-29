import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { obtenerSesionAdmin, type AdminSession } from '../AUTH/authUtils';
// @ts-expect-error Componente administrativo en JSX
import NarrativeAdminModal from '../../../admin_src/narrative/NarrativeAdminModal';

export default function NarrativoAdminPage() {
  const navigate = useNavigate();
  const [adminSession, setAdminSession] = useState<AdminSession | null>(() => obtenerSesionAdmin());

  // Verificación reactiva si cambia el storage
  useEffect(() => {
    const handleStorageUpdate = () => {
      const ses = obtenerSesionAdmin();
      setAdminSession(ses);
    };
    window.addEventListener('user_progress_updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('user_progress_updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  // Interceptor en fetch para inyectar token de admin en rutas administrativas
  useEffect(() => {
    if (!adminSession?.token) return;

    const originalFetch = window.fetch;
    const token = adminSession.token;

    window.fetch = async (input, init = {}) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof Request
          ? input.url
          : '';

      if (url.includes('/api/narrative/admin') || url.includes('/api/challenges/admin')) {
        init = init || {};
        const headers = new Headers(
          init.headers || (input instanceof Request ? input.headers : {})
        );
        if (!headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        init.headers = headers;
      }

      return originalFetch(input, init);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [adminSession]);

  // Control de acceso estricto basado en roles:
  // Si no es admin (rol 2) o no está autenticado, NUNCA ingresa.
  // Redirige inmediatamente al menú aunque se coloque la URL directa en el navegador.
  if (!adminSession || !obtenerSesionAdmin()) {
    return <Navigate to="/menu" replace />;
  }

  // Si es admin: Renderizar la Suite Administrativa del Juego Narrativo
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative">
      <NarrativeAdminModal
        abierto={true}
        onCerrar={() => navigate('/menu')}
      />
    </div>
  );
}
