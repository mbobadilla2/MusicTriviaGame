/**
 * @file scoreCalculator.ts
 * @description Pure functions for calculating question scores and streak bonuses.
 *
 * Scoring system:
 * - Each question has a maximum of 150 base points.
 * - Points decrease by 10 for each full second elapsed.
 * - A streak bonus is added when the player answers correctly 2+ times in a row.
 * - Minimum score per question is 0 (never negative).
 */

/**
 * Calculates the base points for a question based on response time.
 *
 * Formula: `max(0, 150 - floor(timeMs / 1000) * 10)`
 *
 * Examples:
 * - 0 ms → 150 pts (maximum)
 * - 1500 ms → 140 pts (1 full second elapsed)
 * - 9999 ms → 60 pts
 * - 10000 ms → 50 pts
 * - 15000 ms → 0 pts (minimum)
 *
 * @param timeMs - Time elapsed in milliseconds from question start to answer
 * @returns Base points in the range [0, 150]
 */
export function calculateBasePoints(timeMs: number): number {
  return Math.max(0, 150 - Math.floor(timeMs / 1000) * 10);
}

/**
 * Calculates the streak bonus added on top of base points.
 *
 * A streak bonus only applies when the player has answered correctly
 * 2 or more times in a row. The bonus grows with both streak length
 * and base points, rewarding fast answers during a streak.
 *
 * Formula: `streak >= 2 ? floor(streak * 0.1 * basePoints) : 0`
 *
 * Examples (basePoints = 100):
 * - streak 0 or 1 → 0 bonus
 * - streak 2 → 20 bonus
 * - streak 3 → 30 bonus
 * - streak 5 → 50 bonus
 *
 * @param streak - Number of consecutive correct answers so far
 * @param basePoints - Base points already calculated for this question
 * @returns Streak bonus (0 if streak < 2)
 */
export function calculateStreakBonus(streak: number, basePoints: number): number {
  return streak >= 2 ? Math.floor(streak * 0.1 * basePoints) : 0;
}

/**
 * Calculates the total points earned for a single correct answer.
 * Combines base points and streak bonus.
 *
 * @param timeMs - Time elapsed in milliseconds
 * @param streak - Current consecutive correct answer streak
 * @returns Total points (base + streak bonus)
 */
export function calculateTotalPoints(timeMs: number, streak: number): number {
  const base = calculateBasePoints(timeMs);
  return base + calculateStreakBonus(streak, base);
}
