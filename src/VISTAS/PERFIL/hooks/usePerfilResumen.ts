/* Carga y estado del resumen del perfil para el usuario de la sesión. */
import { useCallback, useEffect, useState } from 'react';
import { fetchPerfilResumen, type PerfilResumen } from '../services/perfilService';

export function usePerfilResumen(autenticado: boolean) {
  const [resumen, setResumen] = useState<PerfilResumen | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(false);
    const datos = await fetchPerfilResumen();
    setCargando(false);
    if (datos) {
      setResumen(datos);
    } else {
      setError(true);
    }
  }, []);

  useEffect(() => {
    if (!autenticado) {
      setResumen(null);
      setError(false);
      return;
    }
    void cargar();
  }, [autenticado, cargar]);

  return { resumen, cargando, error, recargar: cargar };
}

export default usePerfilResumen;
