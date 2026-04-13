import { test } from '@fast-check/vitest';
import * as fc from 'fast-check';
import { generateWrongOptions, shuffleOptions } from './randomizer';
import type { Track } from '../types';

// Arbitrario para generar un Track válido
const trackArb = fc.record<Track>({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  previewUrl: fc.oneof(fc.webUrl(), fc.constant(null)),
  artistName: fc.string({ minLength: 1, maxLength: 50 }),
  albumImageUrl: fc.webUrl(),
});

// ─── Propiedad 4: Opciones incorrectas nunca incluyen la canción correcta ─────
// Feature: music-trivia-game, Propiedad 4: Para cualquier canción correcta y pool
// disponible (donde correct está en el pool), generateWrongOptions no incluye
// ningún track con el mismo id que correct.
// Valida: Requisito 3.3
test.prop(
  [
    // Generamos un pool de al menos 4 tracks (1 correcto + 3 incorrectos posibles)
    fc.array(trackArb, { minLength: 4, maxLength: 20 }).chain((pool) => {
      // Elegimos uno del pool como correcto para garantizar que correct está en el pool
      const correctArb = fc.integer({ min: 0, max: pool.length - 1 }).map((i) => pool[i]);
      return fc.tuple(fc.constant(pool), correctArb);
    }),
  ],
  { numRuns: 100 }
)(
  'Propiedad 4: generateWrongOptions no incluye la canción correcta (por id)',
  ([pool, correct]) => {
    const wrong = generateWrongOptions(correct, pool, 3);
    const hasCorrect = wrong.some((t) => t.id === correct.id);
    expect(hasCorrect).toBe(false);
  }
);

// ─── Propiedad 5: Permutación de opciones de respuesta ───────────────────────
// Feature: music-trivia-game, Propiedad 5: Para cualquier array de 4 strings,
// shuffleOptions produce una permutación del conjunto original:
// (a) longitud es 4, (b) todos los elementos originales están presentes,
// (c) el elemento en correctIndex es el primer elemento original.
// Valida: Requisito 3.4
test.prop(
  [
    // 4 strings únicos para evitar ambigüedad en indexOf
    fc
      .uniqueArray(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 4, maxLength: 4 })
      .filter((arr) => arr.length === 4),
  ],
  { numRuns: 100 }
)(
  'Propiedad 5: shuffleOptions produce una permutación del conjunto original',
  (options) => {
    const original = options[0];
    const { shuffled, correctIndex } = shuffleOptions(options);

    // (a) longitud es 4
    expect(shuffled).toHaveLength(4);

    // (b) todos los elementos originales están presentes
    const sortedOriginal = [...options].sort();
    const sortedShuffled = [...shuffled].sort();
    expect(sortedShuffled).toEqual(sortedOriginal);

    // (c) el elemento en correctIndex es el primer elemento original
    expect(shuffled[correctIndex]).toBe(original);
  }
);
