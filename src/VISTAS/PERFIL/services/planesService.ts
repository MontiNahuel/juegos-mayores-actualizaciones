/* Catálogo público de planes de suscripción que ve el jugador. */
import { API_URL } from '../../../config/api';

export type PeriodoCobro = 'mensual' | 'anual';

export interface PrecioPlan {
  monto: number | null;
  moneda: string;
}

export interface PlanSuscripcion {
  codigo: string;
  nombre: string;
  descripcion: string;
  precio: PrecioPlan;
  descuento_anual_pct: number;
  precio_anual: PrecioPlan;
  beneficios: string[];
  orden: number;
  visible: boolean;
  habilitado: boolean;
  updated_at: string | null;
}

export interface CatalogoPlanes {
  anual_habilitado: boolean;
  planes: PlanSuscripcion[];
}

/** Deduplica el montaje doble de React en desarrollo; el servidor filtra los visibles. */
let peticionEnCurso: Promise<CatalogoPlanes | null> | null = null;

/** El endpoint deriva el usuario de la cookie; nunca se manda un id. */
export async function fetchPlanes(): Promise<CatalogoPlanes | null> {
  if (peticionEnCurso) return peticionEnCurso;

  peticionEnCurso = (async () => {
    try {
      const res = await fetch(`${API_URL}/api/subscription/plans`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) return null;
      const datos = (await res.json()) as Partial<CatalogoPlanes>;
      if (!datos || !Array.isArray(datos.planes)) return null;
      return { anual_habilitado: datos.anual_habilitado === true, planes: datos.planes };
    } catch {
      return null;
    }
  })();

  try {
    return await peticionEnCurso;
  } finally {
    peticionEnCurso = null;
  }
}
