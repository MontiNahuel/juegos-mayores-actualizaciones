/* Valida en tiempo constante O(1) si un intento de Wordle es una palabra real en español. */
import words from './wordleWords.json';

const VALID_WORDS = new Set<string>(words);

/** Normaliza una palabra a 5 letras en mayúsculas sin tildes en vocales, conservando la Ñ. */
export function normalizeWordleInput(word: string): string {
  return word
    .trim()
    .replace(/[áÁ]/g, 'A')
    .replace(/[éÉ]/g, 'E')
    .replace(/[íÍ]/g, 'I')
    .replace(/[óÓ]/g, 'O')
    .replace(/[úüÚÜ]/g, 'U')
    .toUpperCase();
}

/**
 * Verifica si la palabra ingresada pertenece al diccionario válido de Wordle.
 * Siempre acepta la solución activa del día por si fue configurada manualmente por un operador.
 */
export function isValidWordleWord(word: string, activeSolution?: string): boolean {
  const normalized = normalizeWordleInput(word);
  if (!/^[A-ZÑ]{5}$/.test(normalized)) return false;
  if (activeSolution && normalized === normalizeWordleInput(activeSolution)) return true;
  return VALID_WORDS.has(normalized);
}
