import { describe, expect, it } from 'vitest';
import { calcularTituloCiclo } from './cicloEvento';

describe('calcularTituloCiclo', () => {
  it('prioriza una categoría ganadora', () => {
    expect(calcularTituloCiclo([{ categoria: 'Pueblo' }, { categoria: 'Pueblo' }, { categoria: 'Fe' }])).toBe('Ciclo de Pueblo');
  });

  it('usa el clima cuando las categorías empatan', () => {
    expect(calcularTituloCiclo([{ categoria: 'Pueblo', tono: 'positivo' }, { categoria: 'Fe', tono: 'negativo' }])).toBe('Ciclo balanceado');
    expect(calcularTituloCiclo([{ categoria: 'Pueblo', tono: 'positivo' }, { categoria: 'Fe', tono: 'positivo' }])).toBe('Ciclo soleado');
    expect(calcularTituloCiclo([{ categoria: 'Pueblo', tono: 'negativo' }, { categoria: 'Fe', tono: 'negativo' }])).toBe('Ciclo tormentoso');
  });

  it('usa Bufón cuando no hay una ganadora', () => {
    expect(calcularTituloCiclo([])).toBe('Ciclo del Bufón');
  });
});
