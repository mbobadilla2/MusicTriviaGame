/**
 * @file gameEngine.ts
 * @description Core game logic: building questions, initializing sessions, and recording answers.
 *
 * This module is the heart of the trivia game. It is intentionally kept as pure
 * business logic with no UI dependencies, making it easy to test in isolation.
 *
 * Responsibilities:
 * - Building the 7 questions for a session from a pool of tracks
 * - Initializing a new TriviaSession
 * - Recording a player's answer and computing the resulting score/streak
 * - Calculating total elapsed time across all answers
 */

import type { Track, TriviaSource, Question, QuestionResult, TriviaSession } from '../types';
import { shuffleOptions } from './randomizer';
import { calculateTotalPoints } from './scoreCalculator';

/**
 * Duration of each question's countdown timer in milliseconds.
 * Players have 10 seconds to select an answer before the question times out.
 */
export const QUESTION_DURATION_MS = 10000;

/**
 * Builds the array of 7 trivia questions from a set of selected tracks.
 *
 * For each track:
 * 1. Picks 3 wrong tracks from the full pool (different from the correct one).
 * 2. Builds parallel arrays of option names and option tracks (for album art).
 * 3. Shuffles the 4 options randomly.
 * 4. Sets `audioBlob` to an empty `Blob()` placeholder — it is populated later
 *    by `preloadAudio()` in the PreloadScreen before the game starts.
 *
 * @param tracks - The 7 tracks selected for this session (correct answers)
 * @param allTracks - Full pool of tracks used to generate wrong options
 * @returns Array of 7 Question objects ready for the game
 */
export function buildQuestions(tracks: Track[], allTracks: Track[]): Question[] {
  return tracks.map((track) => {
    // Pick 3 wrong tracks from the pool (different from the correct one by id)
    const wrongTracks = allTracks
      .filter((t) => t.id !== track.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    // Build parallel arrays: names for display, full tracks for album art
    const allOptionTracks = [track, ...wrongTracks];
    const allOptionNames = allOptionTracks.map((t) => t.name);

    const { shuffled: shuffledNames, correctIndex } = shuffleOptions(allOptionNames);

    // Reorder optionTracks to match the shuffled name order
    const shuffledTracks = shuffledNames.map(
      (name) => allOptionTracks.find((t) => t.name === name) ?? track
    );

    return {
      track,
      options: shuffledNames,
      optionTracks: shuffledTracks,
      correctIndex,
      audioBlob: new Blob(), // placeholder — replaced by preloadAudio()
    };
  });
}

/**
 * Creates a new TriviaSession with empty results and zero score.
 *
 * @param source - The artist or playlist selected by the player
 * @param questions - The 7 questions built by `buildQuestions()`
 * @returns A fresh TriviaSession ready to start
 */
export function initSession(source: TriviaSource, questions: Question[]): TriviaSession {
  return {
    source,
    questions,
    results: [],
    totalScore: 0,
    totalTimeMs: 0,
    startedAt: Date.now(),
  };
}

/**
 * Records the player's answer to a question and computes the result.
 *
 * Scoring rules:
 * - Correct answer: points = `calculateTotalPoints(timeMs, currentStreak)`, streak++
 * - Wrong answer or timeout (`selectedIndex === null`): 0 points, streak resets to 0
 *
 * @param session - Current game session (used to look up the question)
 * @param questionIndex - Index of the question being answered (0–6)
 * @param selectedIndex - Index of the option the player chose, or null if timed out
 * @param timeMs - Time elapsed in ms from question start to answer/timeout
 * @param currentStreak - Number of consecutive correct answers before this one
 * @returns Object containing:
 *   - `result`: the full QuestionResult for this answer
 *   - `newStreak`: updated streak count
 *   - `newTotalScore`: updated cumulative score
 */
export function recordAnswer(
  session: TriviaSession,
  questionIndex: number,
  selectedIndex: number | null,
  timeMs: number,
  currentStreak: number,
): { result: QuestionResult; newStreak: number; newTotalScore: number } {
  const question = session.questions[questionIndex];
  const isCorrect = selectedIndex !== null && selectedIndex === question.correctIndex;

  let pointsEarned: number;
  let newStreak: number;

  if (isCorrect) {
    pointsEarned = calculateTotalPoints(timeMs, currentStreak);
    newStreak = currentStreak + 1;
  } else {
    pointsEarned = 0;
    newStreak = 0;
  }

  const result: QuestionResult = {
    question,
    selectedIndex,
    isCorrect,
    timeMs,
    pointsEarned,
    streakAtAnswer: currentStreak,
  };

  const newTotalScore = session.totalScore + pointsEarned;

  return { result, newStreak, newTotalScore };
}

/**
 * Calculates the total time spent answering all questions in a session.
 * Simply sums the `timeMs` field of each QuestionResult.
 *
 * @param results - Array of question results from the session
 * @returns Total elapsed time in milliseconds
 */
export function calculateTotalTime(results: QuestionResult[]): number {
  return results.reduce((sum, r) => sum + r.timeMs, 0);
}
