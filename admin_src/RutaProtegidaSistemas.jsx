import { Navigate, useLocation } from 'react-router-dom';
import { OPERADOR_STORAGE_KEY } from './LoginSistemas';

export default function RutaProtegidaSistemas({ children }) {
  const location = useLocation();

  let estaAutenticado = false;
  try {
    const sesion = localStorage.getItem(OPERADOR_STORAGE_KEY) || sessionStorage.getItem(OPERADOR_STORAGE_KEY);
    if (sesion) {
      const parsed = JSON.parse(sesion);
      const esAdmin = parsed && (parsed.tipoUsuario === 2 || parsed.tipoUsuario === '2');
      const tieneUsuario = Boolean(parsed && parsed.user);
      const token = parsed?.token;
      const esJwtValido = typeof token === 'string' &&
        token.split('.').length === 3 &&
        !token.startsWith('op_local_');

      let tokenVigente = false;
      if (esJwtValido) {
        try {
          const payloadBase64 = token.split('.')[1];
          const decodedJson = JSON.parse(
            atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'))
          );
          if (decodedJson.exp) {
            tokenVigente = decodedJson.exp * 1000 > Date.now();
          } else {
            tokenVigente = true;
          }
        } catch {
          tokenVigente = false;
        }
      }

      if (esAdmin && tieneUsuario && esJwtValido && tokenVigente) {
        estaAutenticado = true;
      } else {
        localStorage.removeItem(OPERADOR_STORAGE_KEY);
        sessionStorage.removeItem(OPERADOR_STORAGE_KEY);
        estaAutenticado = false;
      }
    }
  } catch (e) {
    console.error('Error al validar sesión de operador:', e);
    estaAutenticado = false;
  }

  if (!estaAutenticado) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
