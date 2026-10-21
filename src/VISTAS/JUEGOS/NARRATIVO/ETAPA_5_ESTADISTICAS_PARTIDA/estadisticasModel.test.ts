import { describe, expect, it } from 'vitest';
import type { CatalogosCronica, HistorialPartidaApi } from '../narrativeService';
import { construirCronica } from './estadisticasModel';

const catalogosVacios: CatalogosCronica = { cartas: [], eventos: [], resultados: [], conversaciones: [] };
const inicial = { oro: 50, pueblo: 50, ejercito: 50, fe: 50 };

describe('crónica de la partida', () => {
  it('calcula ganancias y pérdidas entre las fotos mensuales de la API', () => {
    const historial: HistorialPartidaApi = { historial_mensual: [
      { mes: 2, recursos_fin_mes: { ...inicial, oro: 55, pueblo: 41 } },
      { mes: 1, recursos_fin_mes: { ...inicial, oro: 40, pueblo: 53 } },
    ] };
    const cronica = construirCronica(historial, { recursos: { ...inicial, oro: 55, pueblo: 41 } }, inicial, catalogosVacios);
    expect(cronica.meses.map(mes => mes.numero)).toEqual([1, 2]);
    expect(cronica.meses[0].cambios).toMatchObject({ oro: -10, pueblo: 3 });
    expect(cronica.meses[1].cambios).toMatchObject({ oro: 15, pueblo: -12 });
  });

  it('no atribuye al mes anterior un balance desconocido', () => {
    const historial: HistorialPartidaApi = { historial_mensual: [
      { mes: 1, recursos_fin_mes: { ...inicial, oro: 45 } },
      { mes: 2 },
      { mes: 3, recursos_fin_mes: { ...inicial, oro: 70 } },
    ] };
    const cronica = construirCronica(historial, { recursos: { ...inicial, oro: 70 } }, inicial, catalogosVacios);
    expect(cronica.meses[1].cambios.oro).toBeNull();
    expect(cronica.meses[2].cambios.oro).toBeNull();
    expect(cronica.final.oro).toBe(70);
  });

  it('interrumpe el cambio si falta un mes completo en el historial', () => {
    const historial: HistorialPartidaApi = { historial_mensual: [
      { mes: 1, recursos_fin_mes: { ...inicial, oro: 45 } },
      { mes: 3, recursos_fin_mes: { ...inicial, oro: 70 } },
    ] };
    const cronica = construirCronica(historial, { recursos: { ...inicial, oro: 70 } }, inicial, catalogosVacios);
    expect(cronica.meses[1].cambios.oro).toBeNull();
  });

  it('resuelve la elección y sus consecuencias para la corte desde los catálogos', () => {
    const historial: HistorialPartidaApi = { historial_mensual: [{
      mes: 1, carta_elegida_id: 'c1', evento_id: 'e1', opcion_elegida_id: 'o1',
      resultado_id: 'r1', conversacion_id: 'd1', decision_conversacion_opcion: 2,
      recursos_fin_mes: inicial,
    }] };
    const catalogos: CatalogosCronica = {
      cartas: [{ _id: 'c1', nombre: 'Sello real' }],
      eventos: [{ _id: 'e1', titulo: 'La helada', opciones: [{ id: 'o1', texto: 'Comprar grano' }] }],
      resultados: [{ _id: 'r1', titulo: 'Llegó el trigo', texto: 'El pueblo tiene pan.' }],
      conversaciones: [{ _id: 'd1', titulo: 'El consejo', decisiones: [{ opcion: 2, texto: 'Escuchar a Elena', resultado_texto: 'Marcus protesta.', impacto_afinidad: [{ personaje_id: 'marcus', delta: -15 }] }] }],
    };
    const mes = construirCronica(historial, { recursos: inicial }, inicial, catalogos).meses[0];
    expect(mes).toMatchObject({ carta: 'Sello real', evento: 'La helada', opcion: 'Comprar grano', resultado: 'Llegó el trigo', decision: 'Escuchar a Elena', decisionResultado: 'Marcus protesta.' });
    expect(mes.impactoAfinidad).toEqual([{ personajeId: 'marcus', delta: -15 }]);
  });
});
