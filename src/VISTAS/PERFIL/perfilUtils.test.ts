import { describe, expect, it } from 'vitest';
import {
  construirGrillaActividad,
  diasActivos,
  formatearDuracion,
  formatearFechaCorta,
  formatearMes,
  medallasDe,
  medallasDeRendimiento,
  proximoHitoDeRacha,
  resumenHistorico,
  totalMedallas,
} from './perfilUtils';
import type { MedallasPorCalificacion } from './perfilService';

const MEDALLAS: MedallasPorCalificacion = { S: 5, A: 2, B: 0, C: 1, F: 0 };

describe('perfilUtils: formato y agregados', () => {
  it('formatea el mes en español con inicial mayúscula', () => {
    expect(formatearMes('2026-11')).toBe('Noviembre de 2026');
    expect(formatearMes('2026-01')).toBe('Enero de 2026');
  });

  it('formatea duraciones en minutos:segundos y tolera datos ausentes', () => {
    expect(formatearDuracion(125)).toBe('2:05');
    expect(formatearDuracion(59)).toBe('0:59');
    expect(formatearDuracion(0)).toBe('0:00');
    expect(formatearDuracion(null)).toBe('—');
    expect(formatearDuracion(undefined)).toBe('—');
  });

  it('formatea fechas cortas sin depender del huso del navegador', () => {
    expect(formatearFechaCorta('2026-11-02')).toMatch(/^2\D+nov/);
    expect(formatearFechaCorta(null)).toBe('—');
    expect(formatearFechaCorta('sin-fecha')).toBe('—');
  });

  it('resume medallas por calificación y contempla el bloque vacío', () => {
    expect(totalMedallas(MEDALLAS)).toBe(8);
    expect(resumenHistorico(MEDALLAS)).toBe('5 S · 2 A · 1 C');
    expect(resumenHistorico(medallasDe(undefined, 'wordle'))).toBe('Sin medallas todavía');
    expect(totalMedallas(medallasDe(undefined, 'wordle'))).toBe(0);
  });

  it('devuelve rendimiento neutro cuando el juego no tiene intentos', () => {
    expect(medallasDeRendimiento(undefined, 'sudoku')).toEqual({
      completadas: 0,
      mejor_tiempo_segundos: null,
      promedio_tiempo_segundos: null,
      ultima_fecha: null,
    });
  });

  it('calcula el próximo hito y los hitos alcanzados', () => {
    const tramos = [
      { dias: 20, valor: 30 },
      { dias: 10, valor: 10 },
      { dias: 15, valor: 20 },
    ];
    expect(proximoHitoDeRacha(12, tramos)).toMatchObject({ alcanzados: 1, total: 3 });
    expect(proximoHitoDeRacha(12, tramos).siguiente).toEqual({ dias: 15, valor: 20 });
    expect(proximoHitoDeRacha(30, tramos).siguiente).toBeNull();
    expect(proximoHitoDeRacha(0, undefined)).toMatchObject({
      siguiente: null,
      alcanzados: 0,
      total: 0,
    });
  });
});

describe('perfilUtils: grilla de constancia', () => {
  it('arma doce semanas de lunes a domingo alineadas al último día', () => {
    const semanas = construirGrillaActividad('2026-08-22', '2026-11-13', []);
    expect(semanas).toHaveLength(12);
    expect(semanas.flatMap((semana) => semana.celdas)).toHaveLength(84);
    expect(semanas[0].celdas[0].fecha).toBe('2026-08-24');
    expect(semanas[0].celdas[0].fuera).toBe(false);
    const ultima = semanas[11].celdas;
    expect(ultima[4]).toMatchObject({ fecha: '2026-11-13', fuera: false });
    expect(ultima[5]).toMatchObject({ fecha: '2026-11-14', fuera: true });
    expect(ultima[6].fuera).toBe(true);
  });

  it('marca solo los días presentes en la actividad y cuenta la ventana', () => {
    const actividad = ['2026-11-13', '2026-11-12', '2026-08-01'];
    const semanas = construirGrillaActividad('2026-08-22', '2026-11-13', actividad);
    const celdas = semanas.flatMap((semana) => semana.celdas);
    expect(celdas.find((celda) => celda.fecha === '2026-11-13')?.activa).toBe(true);
    expect(celdas.find((celda) => celda.fecha === '2026-11-12')?.activa).toBe(true);
    expect(celdas.find((celda) => celda.fecha === '2026-11-11')?.activa).toBe(false);
    expect(diasActivos(actividad, '2026-08-22', '2026-11-13')).toBe(2);
  });
});
