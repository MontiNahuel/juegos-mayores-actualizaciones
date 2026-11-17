/* Periodo de cobro: precio mostrado y ventana de transición entre valores. */
import { formatearPrecioPlan } from '../../utils/perfilUtils';
import type { PeriodoCobro, PlanSuscripcion } from '../../services/planesService';

/** Ventana en la que conviven el valor saliente y el nuevo durante el cambio. */
export const DURACION_CAMBIO = 820;

export interface CambioPeriodo {
  id: number;
  de: PeriodoCobro;
  a: PeriodoCobro;
}

export function movimientoReducido(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Precio del plan en el periodo pedido; en anual, el equivalente por mes. */
export function precioDelPeriodo(plan: PlanSuscripcion, cobro: PeriodoCobro): string {
  if (cobro === 'mensual') return formatearPrecioPlan(plan.precio, 'mensual');
  const anual = plan.precio_anual;
  const porMes =
    anual && anual.monto !== null
      ? { ...anual, monto: Math.round((Number(anual.monto) / 12) * 100) / 100 }
      : anual;
  return formatearPrecioPlan(porMes, 'mensual');
}
