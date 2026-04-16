/**
 * @file leaderboard.ts
 * @description Manages the local leaderboard persisted in localStorage.
 *
 * The leaderboard stores up to 10 entries, sorted by score descending.
 * Ties are broken by total time ascending (faster = better).
 *
 * All functions that access localStorage fail silently if it is unavailable
 * (e.g. in private browsing mode on some browsers).
 */

import type { LeaderboardEntry } from '../types';

/** localStorage key used to persist leaderboard data */
export const LEADERBOARD_KEY = 'music-trivia-leaderboard';

/**
 * Reads and parses all leaderboard entries from localStorage.
 * Returns an empty array if the key doesn't exist or parsing fails.
 */
export function getEntries(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LeaderboardEntry[];
  } catch {
    return [];
  }
}

/**
 * Inserts a new entry into the leaderboard, sorts it, and truncates to 10.
 *
 * Sorting rules:
 * 1. Higher `totalScore` ranks first.
 * 2. For equal scores, lower `totalTimeMs` ranks first (faster is better).
 *
 * This is a **pure function** — it does not write to localStorage.
 * Call `saveEntries()` with the returned array to persist.
 *
 * @param entries - Current leaderboard entries
 * @param newEntry - The new entry to insert
 * @returns New sorted array with at most 10 entries
 */
export function addEntry(
  entries: LeaderboardEntry[],
  newEntry: LeaderboardEntry
): LeaderboardEntry[] {
  const combined = [...entries, newEntry];
  combined.sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    return a.totalTimeMs - b.totalTimeMs;
  });
  return combined.slice(0, 10);
}

/**
 * Persists the leaderboard entries to localStorage.
 * Fails silently if localStorage is unavailable.
 *
 * @param entries - The entries to save (typically the result of `addEntry()`)
 */
export function saveEntries(entries: LeaderboardEntry[]): void {
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
  } catch {
    // localStorage not available — fail silently
  }
}

/**
 * Removes all leaderboard entries from localStorage.
 * Fails silently if localStorage is unavailable.
 */
export function clearEntries(): void {
  try {
    localStorage.removeItem(LEADERBOARD_KEY);
  } catch {
    // localStorage not available — fail silently
  }
}

/**
 * Determines whether a given score qualifies for the top-10 leaderboard.
 *
 * Returns `true` if:
 * - There are fewer than 10 entries (any score qualifies), OR
 * - The score is strictly greater than the lowest score in the current top 10.
 *
 * @param entries - Current leaderboard entries (already sorted)
 * @param score - The score to evaluate
 */
export function isHighScore(entries: LeaderboardEntry[], score: number): boolean {
  if (entries.length < 10) return true;
  const minScore = entries[entries.length - 1].totalScore;
  return score > minScore;
}
