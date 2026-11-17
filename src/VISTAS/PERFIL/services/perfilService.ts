/* Consulta el resumen de medallas, rendimiento y actividad del jugador. */
import { API_URL } from '../../../config/api';

export interface MedallasPorCalificacion {
  S: number;
  A: number;
  B: number;
  C: number;
  F: number;
}

export interface RendimientoJuego {
  completadas: number;
  mejor_tiempo_segundos: number | null;
  promedio_tiempo_segundos: number | null;
  ultima_fecha: string | null;
}

export interface MedallasMes {
  mes: string;
  juegos: Record<string, MedallasPorCalificacion>;
}

/** Situación del progreso con la que se empareja un consejo; sin valor, es general. */
export type SituacionConsejo = 'eje_desequilibrado' | 'racha_reanudada' | 'mes_en_mejora';

export interface ConsejoPerfil {
  id: string;
  texto: string;
  fuente: string;
  url: string;
  situacion?: SituacionConsejo | null;
}

export interface PerfilResumen {
  periodo: { mes: string; desde: string; hasta: string };
  medallas: {
    mes_actual: Record<string, MedallasPorCalificacion>;
    historico: Record<string, MedallasPorCalificacion>;
  };
  meses: MedallasMes[];
  rendimiento: Record<string, RendimientoJuego>;
  actividad: string[];
  completadas_por_dia: Record<string, number>;
  consejos: ConsejoPerfil[];
}

/** Deduplica el montaje doble de React en desarrollo; el servidor deriva el usuario. */
let peticionEnCurso: Promise<PerfilResumen | null> | null = null;

/** El endpoint deriva el usuario de la cookie; nunca se manda un id. */
export async function fetchPerfilResumen(): Promise<PerfilResumen | null> {
  if (peticionEnCurso) return peticionEnCurso;

  peticionEnCurso = (async () => {
    try {
      const res = await fetch(`${API_URL}/api/profile/summary`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) return null;
      return (await res.json()) as PerfilResumen;
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
