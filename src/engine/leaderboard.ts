import type { LeaderboardEntry } from '../types';

export const LEADERBOARD_KEY = 'music-trivia-leaderboard';

export function getEntries(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LeaderboardEntry[];
  } catch {
    return [];
  }
}

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

export function saveEntries(entries: LeaderboardEntry[]): void {
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
  } catch {
    // localStorage not available — fail silently
  }
}

export function clearEntries(): void {
  try {
    localStorage.removeItem(LEADERBOARD_KEY);
  } catch {
    // localStorage not available — fail silently
  }
}

export function isHighScore(entries: LeaderboardEntry[], score: number): boolean {
  if (entries.length < 10) return true;
  const minScore = entries[entries.length - 1].totalScore;
  return score > minScore;
}
