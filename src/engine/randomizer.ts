/**
 * Randomizer — Music Trivia Game
 * Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import type { Track } from '../types';

/**
 * Selecciona `count` tracks aleatorios sin repetición del pool usando Fisher-Yates.
 * Si pool.length < count, retorna todos los tracks del pool.
 */
export function selectTracks(pool: Track[], count: number): Track[] {
  const copy = [...pool];
  const limit = Math.min(count, copy.length);

  // Fisher-Yates shuffle parcial: solo barajamos los primeros `limit` elementos
  for (let i = 0; i < limit; i++) {
    const j = i + Math.floor(Math.random() * (copy.length - i));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy.slice(0, limit);
}

/**
 * Selecciona `count` tracks del pool que sean distintos a `correct` (por `id`), sin repetición.
 */
export function generateWrongOptions(correct: Track, pool: Track[], count: number): Track[] {
  const filtered = pool.filter((t) => t.id !== correct.id);
  return selectTracks(filtered, count);
}

/**
 * Recibe un array de 4 strings (el primero es el correcto por convención).
 * Permuta aleatoriamente el array y retorna el array permutado y el nuevo índice del primer elemento original.
 */
export function shuffleOptions(options: string[]): { shuffled: string[]; correctIndex: number } {
  const shuffled = [...options];
  const original = shuffled[0];

  // Fisher-Yates completo
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const correctIndex = shuffled.indexOf(original);
  return { shuffled, correctIndex };
}
