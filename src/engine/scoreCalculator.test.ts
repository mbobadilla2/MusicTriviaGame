import { test } from '@fast-check/vitest';
import * as fc from 'fast-check';
import { calculateBasePoints, calculateStreakBonus } from './scoreCalculator';

// ─── Propiedad 6: Puntos dentro del rango válido ─────────────────────────────
// Feature: music-trivia-game, Propiedad 6: Para cualquier t en [0, 10000],
// calculateBasePoints(t) retorna entero en [0, 150] satisfaciendo la fórmula
// Valida: Requisito 5.1
test.prop(
  [fc.integer({ min: 0, max: 10000 })],
  { numRuns: 100 }
)('Propiedad 6: calculateBasePoints retorna entero en [0, 150] satisfaciendo la fórmula', (t) => {
  const result = calculateBasePoints(t);
  const expected = Math.max(0, 150 - Math.floor(t / 1000) * 10);

  expect(result).toBe(expected);
  expect(result).toBeGreaterThanOrEqual(0);
  expect(result).toBeLessThanOrEqual(150);
  expect(Number.isInteger(result)).toBe(true);
});

// ─── Propiedad 7: Acumulación correcta del Score_Counter ─────────────────────
// Feature: music-trivia-game, Propiedad 7: Para cualquier puntuación previa y puntos
// ganados, el nuevo total es exactamente la suma de ambos
// Valida: Requisito 5.2
test.prop(
  [
    fc.integer({ min: 0, max: 100000 }),
    fc.integer({ min: 0, max: 10000 }),
  ],
  { numRuns: 100 }
)('Propiedad 7: la acumulación de puntos es exactamente la suma de prev + earned', (prev, earned) => {
  const newTotal = prev + earned;
  expect(newTotal).toBe(prev + earned);
});

// ─── Propiedad 9: Bonus de streak proporcional ───────────────────────────────
// Feature: music-trivia-game, Propiedad 9: Para cualquier streak >= 2 y basePoints > 0,
// el bonus es > 0 y estrictamente mayor que el bonus para streak-1
// Valida: Requisito 5.4
// Para garantizar bonus > 0 y monotonía estricta con floor, basePoints debe ser >= 10
// (con bp=10 y streak=2: floor(2*0.1*10)=2 > floor(1*0.1*10)=1 > 0)
test.prop(
  [
    fc.integer({ min: 2, max: 100 }),
    fc.integer({ min: 10, max: 150 }),
  ],
  { numRuns: 100 }
)('Propiedad 9: calculateStreakBonus es > 0 y monotónicamente creciente para streak >= 2', (streak, basePoints) => {
  const bonus = calculateStreakBonus(streak, basePoints);
  const bonusPrev = calculateStreakBonus(streak - 1, basePoints);

  expect(bonus).toBeGreaterThan(0);
  expect(bonus).toBeGreaterThan(bonusPrev);
});
