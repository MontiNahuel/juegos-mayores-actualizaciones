import { describe, expect, it } from 'vitest';
// @ts-expect-error El gestor se escribe en JavaScript.
import { validarCierreGrafo } from './validarCierreGrafo';

const nodo = (destino: string) => ({ opciones: [{ siguiente_nodo: destino }] });
describe('cierre de las historias del gestor', () => {
  it('rechaza nodos sin opciones y ciclos sin cierre alcanzables', () => {
    expect(validarCierreGrafo({ nodo_raiz: 'inicio', nodos: { inicio: {} } })).toContain('inicio');
    expect(validarCierreGrafo({ nodo_raiz: 'inicio', nodos: { inicio: nodo('bucle'), bucle: nodo('inicio'), fin: { es_final: true } } })).toContain('no tienen un camino');
  });
  it('permite ciclos con una salida y no exige usar nodos sueltos del editor', () => {
    expect(validarCierreGrafo({ nodo_raiz: 'inicio', nodos: {
      inicio: { opciones: [{ siguiente_nodo: 'inicio' }, { siguiente_nodo: 'fin' }] }, fin: { es_final: true }, suelto: {},
    } })).toBeNull();
  });
  it('no considera salida un desenlace con peso cero', () => {
    expect(validarCierreGrafo({ nodo_raiz: 'inicio', nodos: {
      inicio: { opciones: [{ desenlaces: [{ nodo: 'fin', peso: 0 }, { nodo: 'inicio', peso: 1 }] }] }, fin: { es_final: true },
    } })).toContain('no tienen un camino');
  });
});
