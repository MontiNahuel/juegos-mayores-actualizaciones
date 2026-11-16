/* Formato y cálculos de la página de perfil, sin depender de la zona del navegador. */
import type { MedallasPorCalificacion, RendimientoJuego } from './perfilService';
import type { PrecioPlan, PeriodoCobro } from './planesService';

export const CALIFICACIONES = ['S', 'A', 'B', 'C', 'F'] as const;
export type Calificacion = (typeof CALIFICACIONES)[number];

/** Colores del sello del calendario, aclarados para el fondo oscuro del menú. */
export const ESTILO_CALIFICACION: Record<Calificacion, string> = {
  S: 'text-[#F0CC80] bg-[#F0CC80]/10',
  A: 'text-[#8FD9CC] bg-[#8FD9CC]/10',
  B: 'text-[#A9C8EE] bg-[#A9C8EE]/10',
  C: 'text-[#C3CEDA] bg-[#C3CEDA]/10',
  F: 'text-[#E79586] bg-[#E79586]/10',
};

export const MEDALLAS_VACIAS: MedallasPorCalificacion = { S: 0, A: 0, B: 0, C: 0, F: 0 };

function parsearFecha(iso: string): Date | null {
  const [anio, mes, dia] = iso.split('-').map(Number);
  if (!anio || !mes || !dia) return null;
  return new Date(anio, mes - 1, dia);
}

function aIso(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function sumarDias(fecha: Date, dias: number): Date {
  const copia = new Date(fecha);
  copia.setDate(copia.getDate() + dias);
  return copia;
}

export function medallasDe(
  bloque: Record<string, MedallasPorCalificacion> | undefined,
  juego: string,
): MedallasPorCalificacion {
  return bloque?.[juego] ?? MEDALLAS_VACIAS;
}

export function totalMedallas(medallas: MedallasPorCalificacion): number {
  return CALIFICACIONES.reduce((total, calificacion) => total + medallas[calificacion], 0);
}

export function resumenHistorico(medallas: MedallasPorCalificacion): string {
  const partes = CALIFICACIONES.filter((calificacion) => medallas[calificacion] > 0).map(
    (calificacion) => `${medallas[calificacion]} ${calificacion}`,
  );
  return partes.length > 0 ? partes.join(' · ') : 'Sin medallas todavía';
}

export function formatearMes(mes: string): string {
  const [anio, numeroMes] = mes.split('-').map(Number);
  if (!anio || !numeroMes) return mes;
  const texto = new Intl.DateTimeFormat('es-AR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(anio, numeroMes - 1, 1));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function formatearDuracion(segundos: number | null | undefined): string {
  if (typeof segundos !== 'number' || !Number.isFinite(segundos) || segundos < 0) {
    return '—';
  }
  const minutos = Math.floor(segundos / 60);
  const resto = Math.round(segundos % 60);
  return `${minutos}:${String(resto).padStart(2, '0')}`;
}

/** Precio del plan con su moneda y periodo; sin monto se informa que falta definirlo. */
export function formatearPrecioPlan(
  precio: PrecioPlan | null | undefined,
  periodo: PeriodoCobro = 'mensual',
): string {
  const monto = Number(precio?.monto);
  if (!precio || precio.monto === null || !Number.isFinite(monto)) return 'Precio a confirmar';
  const moneda = /^[A-Z]{3}$/.test(precio.moneda) ? precio.moneda : 'ARS';
  let texto: string;
  try {
    texto = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: moneda,
      maximumFractionDigits: 2,
    }).format(monto);
  } catch {
    texto = `${moneda} ${monto.toLocaleString('es-AR')}`;
  }
  return `${texto} / ${periodo === 'anual' ? 'año' : 'mes'}`;
}

export function formatearFechaCorta(iso: string | null | undefined): string {
  if (!iso) return '—';
  const fecha = parsearFecha(iso);
  if (!fecha) return '—';
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
  }).format(fecha);
}

export function formatearFechaLarga(iso: string): string {
  const fecha = parsearFecha(iso);
  if (!fecha) return iso;
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(fecha);
}

export interface CeldaActividad {
  fecha: string;
  activa: boolean;
  /** Días futuros o previos a la ventana que no se pintan. */
  fuera: boolean;
}

export interface SemanaActividad {
  celdas: CeldaActividad[];
}

/** Doce columnas de lunes a domingo, alineadas a la semana actual. */
export function construirGrillaActividad(
  desde: string,
  hasta: string,
  actividad: string[],
): SemanaActividad[] {
  const fin = parsearFecha(hasta);
  if (!fin) return [];
  const activas = new Set(actividad);
  const desplazamiento = (fin.getDay() + 6) % 7;
  const lunesActual = sumarDias(fin, -desplazamiento);
  const inicio = sumarDias(lunesActual, -77);

  return Array.from({ length: 12 }, (_, semana) => ({
    celdas: Array.from({ length: 7 }, (_, dia) => {
      const fecha = sumarDias(inicio, semana * 7 + dia);
      const iso = aIso(fecha);
      return {
        fecha: iso,
        activa: activas.has(iso),
        fuera: fecha > fin,
      };
    }),
  }));
}

export function diasActivos(actividad: string[], desde: string, hasta: string): number {
  return new Set(
    actividad.filter((fecha) => fecha >= desde && fecha <= hasta),
  ).size;
}

export interface HitoRacha {
  dias: number;
  valor: number;
}

export function proximoHitoDeRacha(
  racha: number,
  tramos: HitoRacha[] | undefined,
): { siguiente: HitoRacha | null; alcanzados: number; total: number } {
  const ordenados = [...(tramos ?? [])].sort((a, b) => a.dias - b.dias);
  const siguiente = ordenados.find((tramo) => racha < tramo.dias) ?? null;
  const alcanzados = ordenados.filter((tramo) => racha >= tramo.dias).length;
  return { siguiente, alcanzados, total: ordenados.length };
}

export function medallasDeRendimiento(
  rendimiento: Record<string, RendimientoJuego> | undefined,
  juego: string,
): RendimientoJuego {
  return (
    rendimiento?.[juego] ?? {
      completadas: 0,
      mejor_tiempo_segundos: null,
      promedio_tiempo_segundos: null,
      ultima_fecha: null,
    }
  );
}
