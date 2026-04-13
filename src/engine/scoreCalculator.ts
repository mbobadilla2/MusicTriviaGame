/**
 * Score Calculator — Music Trivia Game
 * Requisitos: 5.1, 5.2, 5.4
 */

/**
 * Calcula los puntos base según el tiempo de respuesta.
 * Fórmula: max(0, 150 - floor(timeMs / 1000) * 10)
 * Máximo: 150 pts (en 0 ms), decrece 10 pts/seg, mínimo: 0 pts.
 */
export function calculateBasePoints(timeMs: number): number {
  return Math.max(0, 150 - Math.floor(timeMs / 1000) * 10);
}

/**
 * Calcula el bonus de racha.
 * Fórmula: streak >= 2 ? floor(streak * 0.1 * basePoints) : 0
 */
export function calculateStreakBonus(streak: number, basePoints: number): number {
  return streak >= 2 ? Math.floor(streak * 0.1 * basePoints) : 0;
}

/**
 * Calcula el total de puntos (base + bonus de racha).
 */
export function calculateTotalPoints(timeMs: number, streak: number): number {
  const base = calculateBasePoints(timeMs);
  return base + calculateStreakBonus(streak, base);
}
