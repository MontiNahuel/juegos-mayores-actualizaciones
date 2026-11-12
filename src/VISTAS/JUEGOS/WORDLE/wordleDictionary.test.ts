import { expect, it } from 'vitest';
import { isValidWordleWord, normalizeWordleInput } from './wordleDictionary';

it('normaliza mayúsculas y quita tildes conservando la Ñ', () => {
  expect(normalizeWordleInput('árbol')).toBe('ARBOL');
  expect(normalizeWordleInput('sueño')).toBe('SUEÑO');
  expect(normalizeWordleInput(' güero ')).toBe('GUERO');
});

it('acepta palabras reales del español incluyendo Ñ, plurales y verbos conjugados', () => {
  expect(isValidWordleWord('CASAS')).toBe(true);
  expect(isValidWordleWord('PERRO')).toBe(true);
  expect(isValidWordleWord('SUEÑO')).toBe(true);
  expect(isValidWordleWord('COMEN')).toBe(true);
  expect(isValidWordleWord('árbol')).toBe(true);
});

it('rechaza cadenas sin sentido o de longitud incorrecta', () => {
  expect(isValidWordleWord('AAAAA')).toBe(false);
  expect(isValidWordleWord('ZZZZZ')).toBe(false);
  expect(isValidWordleWord('QWERT')).toBe(false);
  expect(isValidWordleWord('CASA')).toBe(false);
  expect(isValidWordleWord('CASASS')).toBe(false);
});

it('siempre acepta la solución activa del día aunque sea un término propio o personalizado', () => {
  expect(isValidWordleWord('XYZWK', 'XYZWK')).toBe(true);
});
