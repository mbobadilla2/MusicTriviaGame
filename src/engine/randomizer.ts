/**
 * @file randomizer.ts
 * @description Pure functions for randomizing track selection and answer order.
 *
 * These functions ensure every game session is unique:
 * - Which 7 tracks are selected from the pool
 * - Which 3 wrong options appear alongside the correct answer
 * - The order in which the 4 options are displayed
 *
 * All functions use the Fisher-Yates shuffle algorithm for unbiased randomness.
 */

import type { Track } from '../types';

/**
 * Selects `count` tracks at random from `pool` without repetition.
 * Uses a partial Fisher-Yates shuffle for efficiency.
 *
 * If `pool.length < count`, returns all tracks in the pool (shuffled).
 *
 * @param pool - Array of tracks to select from
 * @param count - Number of tracks to select
 * @returns Array of `count` unique randomly selected tracks
 */
export function selectTracks(pool: Track[], count: number): Track[] {
  const copy = [...pool];
  const limit = Math.min(count, copy.length);

  // Partial Fisher-Yates: only shuffle the first `limit` positions
  for (let i = 0; i < limit; i++) {
    const j = i + Math.floor(Math.random() * (copy.length - i));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy.slice(0, limit);
}

/**
 * Selects `count` tracks from `pool` that are different from `correct`.
 * Comparison is done by track `id` to avoid duplicates.
 *
 * Used to generate the three wrong answer options for a question.
 *
 * @param correct - The correct track (excluded from results)
 * @param pool - Full pool of available tracks
 * @param count - Number of wrong options to generate (typically 3)
 * @returns Array of `count` tracks, none of which match `correct.id`
 */
export function generateWrongOptions(correct: Track, pool: Track[], count: number): Track[] {
  const filtered = pool.filter((t) => t.id !== correct.id);
  return selectTracks(filtered, count);
}

/**
 * Shuffles an array of 4 answer option strings and tracks the new position
 * of the originally-correct answer (always the first element by convention).
 *
 * Uses a full Fisher-Yates shuffle.
 *
 * @param options - Array of 4 strings where `options[0]` is the correct answer
 * @returns Object with:
 *   - `shuffled`: the permuted array
 *   - `correctIndex`: the new index of the originally-correct answer
 */
export function shuffleOptions(options: string[]): { shuffled: string[]; correctIndex: number } {
  const shuffled = [...options];
  const original = shuffled[0]; // correct answer is always first before shuffling

  // Full Fisher-Yates shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const correctIndex = shuffled.indexOf(original);
  return { shuffled, correctIndex };
}
