/* Catálogo de planes del modal: carga, periodo elegido y transición de precios. */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DURACION_CAMBIO,
  movimientoReducido,
  type CambioPeriodo,
} from '../components/planes/planesPeriodo';
import {
  fetchPlanes,
  type CatalogoPlanes,
  type PeriodoCobro,
  type PlanSuscripcion,
} from '../services/planesService';

export function useCatalogoPlanes(isOpen: boolean) {
  const [catalogo, setCatalogo] = useState<CatalogoPlanes | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(false);
  const [aviso, setAviso] = useState('');
  const [periodo, setPeriodo] = useState<PeriodoCobro>('mensual');
  const [cambio, setCambio] = useState<CambioPeriodo | null>(null);
  const secuencia = useRef(0);
  const temporizador = useRef<number | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(false);
    const datos = await fetchPlanes();
    setCargando(false);
    if (datos) {
      setCatalogo(datos);
    } else {
      setError(true);
    }
  }, []);

  // El catálogo lo administra el panel: al abrir se relee para no mostrar planes viejos.
  useEffect(() => {
    if (!isOpen) {
      setAviso('');
      return;
    }
    setAviso('');
    setPeriodo('mensual');
    setCambio(null);
    void cargar();
  }, [isOpen, cargar]);

  useEffect(
    () => () => {
      if (temporizador.current !== null) window.clearTimeout(temporizador.current);
    },
    [],
  );

  const anualHabilitado = catalogo?.anual_habilitado === true;
  const periodoActivo: PeriodoCobro = anualHabilitado ? periodo : 'mensual';
  const planes = catalogo?.planes ?? [];

  const cambiarPeriodo = (siguiente: PeriodoCobro) => {
    setAviso('');
    if (siguiente === periodoActivo) return;
    if (temporizador.current !== null) {
      window.clearTimeout(temporizador.current);
      temporizador.current = null;
    }
    setPeriodo(siguiente);
    if (movimientoReducido()) {
      setCambio(null);
      return;
    }
    secuencia.current += 1;
    setCambio({ id: secuencia.current, de: periodoActivo, a: siguiente });
    temporizador.current = window.setTimeout(() => {
      setCambio(null);
      temporizador.current = null;
    }, DURACION_CAMBIO);
  };

  const elegirPlan = (plan: PlanSuscripcion) => {
    const modalidad = periodoActivo === 'anual' ? ' en su modalidad anual' : '';
    setAviso(
      `La compra de “${plan.nombre}”${modalidad} va a estar disponible cuando conectemos la pasarela de pagos.`,
    );
  };

  return {
    cargando,
    error,
    aviso,
    anualHabilitado,
    periodoActivo,
    cambio,
    planes,
    cargar,
    cambiarPeriodo,
    elegirPlan,
  };
}

export default useCatalogoPlanes;
