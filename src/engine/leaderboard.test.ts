import { test } from '@fast-check/vitest';
import * as fc from 'fast-check';
import { addEntry } from './leaderboard';
import type { LeaderboardEntry } from '../types';

// Arbitrary for a valid LeaderboardEntry
const leaderboardEntryArb = fc.record<LeaderboardEntry>({
  id: fc.uuid(),
  sourceName: fc.string({ minLength: 1, maxLength: 50 }),
  sourceType: fc.constantFrom('artist' as const, 'playlist' as const),
  totalScore: fc.integer({ min: 0, max: 10500 }),
  correctAnswers: fc.integer({ min: 0, max: 7 }),
  totalTimeMs: fc.integer({ min: 0, max: 70000 }),
  playedAt: fc.integer({ min: 0, max: 9999999999999 }),
});

// ─── Propiedad 14: Entrada del Leaderboard contiene todos los campos requeridos ──
// Feature: music-trivia-game, Propiedad 14: Para cualquier LeaderboardEntry generada,
// debe contener sourceName (string no vacío), totalScore (>= 0), correctAnswers (en [0,7])
// y totalTimeMs (>= 0). addEntry preserva estos invariantes en todas las entradas del resultado.
// Valida: Requisito 8.1
test.prop(
  [fc.array(leaderboardEntryArb, { maxLength: 15 }), leaderboardEntryArb],
  { numRuns: 100 }
)(
  'Propiedad 14: addEntry preserva los invariantes de campo en todas las entradas del resultado',
  (entries, newEntry) => {
    const result = addEntry(entries, newEntry);

    for (const entry of result) {
      expect(typeof entry.sourceName).toBe('string');
      expect(entry.sourceName.length).toBeGreaterThan(0);
      expect(entry.totalScore).toBeGreaterThanOrEqual(0);
      expect(entry.correctAnswers).toBeGreaterThanOrEqual(0);
      expect(entry.correctAnswers).toBeLessThanOrEqual(7);
      expect(entry.totalTimeMs).toBeGreaterThanOrEqual(0);
    }
  }
);

// ─── Propiedad 15: Leaderboard mantiene máximo 10 entradas con las mejores puntuaciones ──
// Feature: music-trivia-game, Propiedad 15: Para cualquier array de entradas + nueva entrada,
// después de addEntry el resultado tiene máximo 10 entradas, y todas las entradas conservadas
// tienen score >= cualquier entrada descartada.
// Valida: Requisito 8.3
test.prop(
  [fc.array(leaderboardEntryArb, { maxLength: 15 }), leaderboardEntryArb],
  { numRuns: 100 }
)(
  'Propiedad 15: addEntry retorna máximo 10 entradas y conserva las de mayor score',
  (entries, newEntry) => {
    const combined = [...entries, newEntry];
    const result = addEntry(entries, newEntry);

    // At most 10 entries
    expect(result.length).toBeLessThanOrEqual(10);

    // All kept entries have score >= any discarded entry
    if (combined.length > 10) {
      const keptIds = new Set(result.map((e) => e.id));
      const discarded = combined.filter((e) => !keptIds.has(e.id));
      const minKeptScore = Math.min(...result.map((e) => e.totalScore));

      for (const d of discarded) {
        expect(minKeptScore).toBeGreaterThanOrEqual(d.totalScore);
      }
    }
  }
);

// ─── Propiedad 16: Leaderboard ordenado correctamente ────────────────────────
// Feature: music-trivia-game, Propiedad 16: Para cualquier conjunto de entradas,
// el resultado de addEntry está ordenado score DESC; para igual score, totalTimeMs ASC.
// Valida: Requisitos 8.5, 8.6
test.prop(
  [fc.array(leaderboardEntryArb, { maxLength: 15 }), leaderboardEntryArb],
  { numRuns: 100 }
)(
  'Propiedad 16: addEntry retorna entradas ordenadas score DESC, totalTimeMs ASC para igual score',
  (entries, newEntry) => {
    const result = addEntry(entries, newEntry);

    for (let i = 0; i < result.length - 1; i++) {
      const a = result[i];
      const b = result[i + 1];

      if (a.totalScore === b.totalScore) {
        expect(a.totalTimeMs).toBeLessThanOrEqual(b.totalTimeMs);
      } else {
        expect(a.totalScore).toBeGreaterThan(b.totalScore);
      }
    }
  }
);
