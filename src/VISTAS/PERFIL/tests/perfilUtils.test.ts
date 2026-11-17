import { describe, expect, it } from 'vitest';
import {
  construirGrillaActividad,
  construirProgreso,
  curva,
  desafiosCompletados,
  diasActivos,
  diasRestantesMes,
  formatearDuracion,
  formatearFechaCorta,
  formatearMes,
  inicioConstancia,
  medallasDe,
  medallasDeRendimiento,
  mensajeEvolucion,
  mensajePractica,
  mesAnterior,
  motivosDeConsejos,
  mesesVentana,
  nivelActividad,
  nombreMesCorto,
  practicaAnual,
  proximoHitoDeRacha,
  puntosRadar,
  rendimientoAgregado,
  sumarMedallas,
  totalMedallas,
  totalMedallasContadas,
  type TramoMensaje,
} from '../utils/perfilUtils';
import type { MedallasMes, MedallasPorCalificacion } from '../services/perfilService';

const MEDALLAS: MedallasPorCalificacion = { S: 5, A: 2, B: 0, C: 1, F: 0 };

const bloqueMedallas = (
  mes: string,
  juegos: Record<string, Partial<MedallasPorCalificacion>>,
): MedallasMes => ({
  mes,
  juegos: Object.fromEntries(
    Object.entries(juegos).map(([juego, conteos]) => [
      juego,
      { S: 0, A: 0, B: 0, C: 0, F: 0, ...conteos },
    ]),
  ),
});

const textoMensaje = (partes: TramoMensaje[]) =>
  partes.map((parte) => parte.texto).join('');

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
    expect(totalMedallas(medallasDe(undefined, 'wordle'))).toBe(0);
  });

  it('suma los sellos de todos los juegos sin compartir referencias', () => {
    const wordle: MedallasPorCalificacion = { S: 2, A: 1, B: 0, C: 0, F: 1 };
    const sopa: MedallasPorCalificacion = { S: 0, A: 0, B: 3, C: 0, F: 0 };
    const suma = sumarMedallas([wordle, sopa, undefined]);
    expect(suma).toEqual({ S: 2, A: 1, B: 3, C: 0, F: 1 });
    expect(wordle).toEqual({ S: 2, A: 1, B: 0, C: 0, F: 1 });
    expect(sumarMedallas([])).toEqual({ S: 0, A: 0, B: 0, C: 0, F: 0 });
  });

  it('agrega rendimiento conjunto: suma jugadas y toma el último intento', () => {
    const agregado = rendimientoAgregado(
      {
        wordle: {
          completadas: 9,
          mejor_tiempo_segundos: 120,
          promedio_tiempo_segundos: 180,
          ultima_fecha: '2026-11-12',
        },
        sopa_letras: {
          completadas: 3,
          mejor_tiempo_segundos: 80,
          promedio_tiempo_segundos: 95,
          ultima_fecha: '2026-11-02',
        },
      },
      ['wordle', 'sopa_letras', 'sudoku'],
    );
    expect(agregado).toEqual({
      completadas: 12,
      mejor_tiempo_segundos: null,
      promedio_tiempo_segundos: null,
      ultima_fecha: '2026-11-12',
    });
    expect(rendimientoAgregado(undefined, ['wordle'])).toMatchObject({
      completadas: 0,
      ultima_fecha: null,
    });
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

describe('perfilUtils: progreso y meses', () => {
  it('arma la ventana de meses y navega al anterior', () => {
    expect(mesesVentana('2026-11', 6)).toEqual([
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
      '2026-11',
    ]);
    expect(mesAnterior('2026-01')).toBe('2025-12');
    expect(nombreMesCorto('2026-09')).toMatch(/^sep/);
  });

  it('cuenta solo S, A, B y C como medallas', () => {
    expect(totalMedallasContadas({ S: 2, A: 1, B: 1, C: 1, F: 5 })).toBe(5);
  });

  it('resume los últimos seis meses con total anual y comparación', () => {
    const mes = (
      fecha: string,
      wordle: Partial<MedallasPorCalificacion>,
    ): MedallasMes => ({
      mes: fecha,
      juegos: { wordle: { S: 0, A: 0, B: 0, C: 0, F: 0, ...wordle } },
    });
    const meses = [
      mes('2026-11', { S: 2, A: 1, F: 4 }),
      mes('2026-10', { S: 2, A: 1, B: 1, C: 1 }),
      mes('2026-09', { S: 1, A: 2 }),
      mes('2026-08', {}),
      mes('2026-07', { S: 1 }),
      mes('2026-06', { S: 1, A: 1 }),
      mes('2025-12', { S: 3 }),
    ];

    const serie = construirProgreso(meses, '2026-11');

    expect(serie.ventana).toHaveLength(6);
    expect(serie.totales).toEqual([2, 1, 0, 3, 5, 3]);
    expect(serie.totalAnio).toBe(14);
    expect(serie.record).toBe(5);
    expect(serie.promedio).toBe(2);
    expect(serie.escala).toBe(10);
    expect(serie.diferencia).toBe(-2);
    expect(serie.anterior).toBe('2026-10');
    expect(serie.puntos[0].x).toBe(6);
    expect(serie.puntos[5]).toMatchObject({ x: 94, mes: '2026-11', total: 3 });
  });

  it('tolera meses vacíos con una escala mínima y curva sin datos', () => {
    const serie = construirProgreso([], '2026-11');

    expect(serie.totalAnio).toBe(0);
    expect(serie.record).toBe(0);
    expect(serie.promedio).toBe(0);
    expect(serie.escala).toBe(5);
    expect(serie.diferencia).toBe(0);
    expect(curva(serie.puntos).startsWith('M ')).toBe(true);
  });

  it('agrupa la práctica del año por eje y comparte la escala del radar', () => {
    const practica = practicaAnual(
      [
        bloqueMedallas('2026-11', {
          wordle: { S: 2, F: 1 },
          crucigrama: { A: 1 },
          sopa_letras: { B: 1 },
          sudoku: { C: 3 },
        }),
        bloqueMedallas('2025-12', { wordle: { S: 9 } }),
      ],
      '2026-11',
    );

    expect(practica.ejes.map((eje) => [eje.etiqueta, eje.total])).toEqual([
      ['Deducción verbal', 2],
      ['Atención visual', 1],
      ['Lógica', 3],
      ['Vocabulario', 1],
    ]);
    expect(practica.total).toBe(7);
    expect(practica.record).toBe(3);
    expect(practica.escala).toBe(5);
    expect(puntosRadar(practica.ejes)).toEqual([
      { x: 160, y: 58.4 },
      { x: 170.8, y: 80 },
      { x: 160, y: 112.4 },
      { x: 149.2, y: 80 },
    ]);
    expect(practicaAnual(undefined, '2026-11')).toMatchObject({
      total: 0,
      record: 0,
      escala: 5,
    });
  });

  it('lee la práctica sin juicios y duda cuando hay pocos datos', () => {
    const practicaCon = (wordle: number, sopa: number, sudoku: number, crucigrama: number) =>
      practicaAnual(
        [
          bloqueMedallas('2026-11', {
            wordle: { S: wordle },
            sopa_letras: { S: sopa },
            sudoku: { S: sudoku },
            crucigrama: { S: crucigrama },
          }),
        ],
        '2026-11',
      );

    expect(textoMensaje(mensajePractica(practicaCon(0, 0, 0, 0)))).toBe(
      'Todavía no sumaste medallas este año.',
    );
    expect(textoMensaje(mensajePractica(practicaCon(2, 0, 0, 0)))).toBe(
      'Con pocas medallas todavía no hay una tendencia clara.',
    );
  });

  it('señala el eje vacío, el concentrado, el repartido y el parejo', () => {
    const practicaCon = (wordle: number, sopa: number, sudoku: number, crucigrama: number) =>
      practicaAnual(
        [
          bloqueMedallas('2026-11', {
            wordle: { S: wordle },
            sopa_letras: { S: sopa },
            sudoku: { S: sudoku },
            crucigrama: { S: crucigrama },
          }),
        ],
        '2026-11',
      );

    expect(textoMensaje(mensajePractica(practicaCon(18, 14, 0, 10)))).toBe(
      'Todavía no sumaste medallas en Lógica.',
    );
    expect(textoMensaje(mensajePractica(practicaCon(30, 12, 8, 6)))).toBe(
      'Practicaste más Deducción verbal: 30 de 56 medallas.',
    );
    expect(textoMensaje(mensajePractica(practicaCon(10, 3, 6, 1)))).toBe(
      'Practicaste más Deducción verbal: 10 de 20 medallas. Después, Lógica con 6.',
    );
    expect(textoMensaje(mensajePractica(practicaCon(8, 6, 5, 4)))).toBe(
      'Tus medallas se reparten entre Deducción verbal y Atención visual.',
    );
    expect(textoMensaje(mensajePractica(practicaCon(10, 9, 9, 10)))).toBe(
      'Práctica pareja: entre 9 y 10 medallas por demanda.',
    );
    expect(textoMensaje(mensajePractica(practicaCon(5, 5, 5, 5)))).toBe(
      'Práctica pareja: 5 medallas por demanda.',
    );
  });

  it('cuenta la evolución mensual y suma días para remontar solo en baja', () => {
    const mes = (fecha: string, total: number): MedallasMes =>
      bloqueMedallas(fecha, { wordle: { S: total } });
    const serie = construirProgreso(
      [
        mes('2026-06', 2),
        mes('2026-07', 1),
        mes('2026-08', 0),
        mes('2026-09', 3),
        mes('2026-10', 5),
        mes('2026-11', 3),
      ],
      '2026-11',
    );

    expect(textoMensaje(mensajeEvolucion(serie, '2026-11-13'))).toBe(
      'Noviembre lleva 3 medallas; octubre cerró con 5. Quedan 17 días para remontarlo.',
    );
    expect(textoMensaje(mensajeEvolucion(serie, '2026-11-30'))).toBe(
      'Noviembre lleva 3 medallas; octubre cerró con 5.',
    );
    expect(
      textoMensaje(
        mensajeEvolucion(
          construirProgreso([mes('2026-10', 3), mes('2026-11', 5)], '2026-11'),
          '2026-11-13',
        ),
      ),
    ).toBe('Noviembre suma 5 medallas; octubre cerró con 3.');
    expect(
      textoMensaje(
        mensajeEvolucion(
          construirProgreso([mes('2026-10', 0), mes('2026-11', 2)], '2026-11'),
          '2026-11-13',
        ),
      ),
    ).toBe('Noviembre suma 2 medallas; octubre cerró sin medallas.');
    expect(
      textoMensaje(
        mensajeEvolucion(construirProgreso([], '2026-11'), '2026-11-13'),
      ),
    ).toBe('Noviembre todavía no suma medallas; octubre tampoco.');
  });

  it('calcula los días restantes del mes', () => {
    expect(diasRestantesMes('2026-11-13')).toBe(17);
    expect(diasRestantesMes('2026-11-30')).toBe(0);
    expect(diasRestantesMes('2026-02-27')).toBe(1);
    expect(diasRestantesMes('sin-fecha')).toBe(0);
  });

  it('traza la curva con un tramo cúbico por punto adicional', () => {
    const trazo = curva([
      { x: 6, y: 80, mes: '2026-10', total: 2 },
      { x: 50, y: 40, mes: '2026-11', total: 6 },
      { x: 94, y: 20, mes: '2026-12', total: 8 },
    ]);

    expect(trazo.startsWith('M 6 80')).toBe(true);
    expect(trazo.match(/ C /g)).toHaveLength(2);
    expect(trazo.endsWith('94 20')).toBe(true);
  });
});

describe('perfilUtils: grilla de constancia', () => {
  it('arranca el último mes en el lunes de cinco semanas atrás', () => {
    expect(inicioConstancia('2026-11-13')).toBe('2026-10-12');
    expect(inicioConstancia('2026-03-01')).toBe('2026-01-26');
  });

  it('arma las cinco semanas del último mes, de lunes a domingo', () => {
    const semanas = construirGrillaActividad('2026-10-12', '2026-11-13', []);
    expect(semanas).toHaveLength(5);
    const celdas = semanas.flatMap((semana) => semana.celdas);
    expect(celdas).toHaveLength(35);
    expect(celdas[0]).toMatchObject({ fecha: '2026-10-12', fuera: false });
    const ultima = semanas[4].celdas;
    expect(ultima[4]).toMatchObject({ fecha: '2026-11-13', fuera: false });
    expect(ultima[5]).toMatchObject({ fecha: '2026-11-14', fuera: true });
    expect(ultima[6].fuera).toBe(true);
  });

  it('marca solo los días presentes en la actividad y cuenta la ventana', () => {
    const actividad = ['2026-11-13', '2026-11-12', '2026-08-01'];
    const semanas = construirGrillaActividad('2026-10-12', '2026-11-13', actividad);
    const celdas = semanas.flatMap((semana) => semana.celdas);
    expect(celdas.find((celda) => celda.fecha === '2026-11-13')?.activa).toBe(true);
    expect(celdas.find((celda) => celda.fecha === '2026-11-12')?.activa).toBe(true);
    expect(celdas.find((celda) => celda.fecha === '2026-11-11')?.activa).toBe(false);
    expect(diasActivos(actividad, '2026-10-12', '2026-11-13')).toBe(2);
  });

  it('traduce los desafíos del día a cuatro tonos', () => {
    expect(nivelActividad(0)).toBe(0);
    expect(nivelActividad(1)).toBe(1);
    expect(nivelActividad(2)).toBe(2);
    expect(nivelActividad(3)).toBe(3);
    expect(nivelActividad(6)).toBe(3);
    expect(nivelActividad(-1)).toBe(0);
    expect(nivelActividad(Number.NaN)).toBe(0);
  });

  it('pinta los desafíos por día y marca la celda de hoy', () => {
    const completadas = {
      '2026-11-13': 3,
      '2026-11-12': 1,
      '2026-08-01': 4,
    };
    const semanas = construirGrillaActividad(
      '2026-10-12',
      '2026-11-13',
      ['2026-11-13'],
      completadas,
    );
    const celdas = semanas.flatMap((semana) => semana.celdas);

    expect(celdas.find((celda) => celda.fecha === '2026-11-13')).toMatchObject({
      activa: true,
      completadas: 3,
      nivel: 3,
      esHoy: true,
      fuera: false,
    });
    expect(celdas.find((celda) => celda.fecha === '2026-11-12')).toMatchObject({
      completadas: 1,
      nivel: 1,
      esHoy: false,
    });
    expect(celdas.find((celda) => celda.fecha === '2026-11-11')).toMatchObject({
      completadas: 0,
      nivel: 0,
    });
    expect(desafiosCompletados(completadas, '2026-10-12', '2026-11-13')).toBe(4);
  });
});

describe('perfilUtils: motivos de los consejos', () => {
  const periodo = { mes: '2026-11', desde: '2026-08-25', hasta: '2026-11-16' };

  it('señala el eje más flojo cuando la diferencia ya es clara', () => {
    const meses = [
      bloqueMedallas('2026-11', {
        wordle: { S: 12 },
        sopa_letras: { S: 11 },
        sudoku: { S: 30 },
        crucigrama: { S: 10 },
      }),
    ];

    expect(motivosDeConsejos({ meses, periodo, actividad: [] }, 12)).toMatchObject({
      eje_desequilibrado: 'Este año practicaste Lógica 3× más que Vocabulario.',
    });
  });

  it('no señala un eje con pocas medallas ni diferencias chicas', () => {
    const pocas = [bloqueMedallas('2026-11', { sudoku: { S: 3 }, crucigrama: { S: 1 } })];
    expect(motivosDeConsejos({ meses: pocas, periodo, actividad: [] }, 12)).toEqual({});

    const parejas = [
      bloqueMedallas('2026-11', {
        wordle: { S: 8 },
        sopa_letras: { S: 7 },
        sudoku: { S: 6 },
        crucigrama: { S: 5 },
      }),
    ];
    expect(motivosDeConsejos({ meses: parejas, periodo, actividad: [] }, 12)).toEqual({});
  });

  it('celebra el mes cuando ya supera al anterior por tres medallas', () => {
    const meses = [
      bloqueMedallas('2026-11', { wordle: { S: 9 } }),
      bloqueMedallas('2026-10', { wordle: { S: 5 } }),
    ];

    expect(motivosDeConsejos({ meses, periodo, actividad: [] }, 12).mes_en_mejora).toBe(
      'Noviembre suma 9 medallas: +4 respecto de octubre.',
    );
  });

  it('no compara contra un mes sin datos', () => {
    const meses = [bloqueMedallas('2026-11', { wordle: { S: 9 } })];

    expect(
      motivosDeConsejos({ meses, periodo, actividad: [] }, 12).mes_en_mejora,
    ).toBeUndefined();
  });

  it('menciona la racha previa al retomar la app', () => {
    const actividad = [
      '2026-11-16',
      '2026-11-13',
      '2026-11-12',
      '2026-11-11',
      '2026-11-10',
    ];

    expect(motivosDeConsejos({ meses: [], periodo, actividad }, 1).racha_reanudada).toBe(
      'Volviste después de 3 días: tu racha anterior duró 4 días.',
    );
  });

  it('no afirma el largo de una racha que pudo empezar antes de la ventana', () => {
    const actividad = [
      '2026-11-16',
      '2026-11-14',
      '2026-11-13',
      '2026-11-12',
      '2026-11-11',
      '2026-11-10',
    ];

    expect(
      motivosDeConsejos(
        { meses: [], periodo: { ...periodo, desde: '2026-11-10' }, actividad },
        1,
      ).racha_reanudada,
    ).toBe('Volviste después de 2 días: tu racha anterior duró más de 5 días.');
  });

  it('no habla de racha si sigue viva', () => {
    const actividad = ['2026-11-16', '2026-11-15', '2026-11-14'];

    expect(
      motivosDeConsejos({ meses: [], periodo, actividad }, 3).racha_reanudada,
    ).toBeUndefined();
  });
});
