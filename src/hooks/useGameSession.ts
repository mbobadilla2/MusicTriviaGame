/**
 * @file useGameSession.ts
 * @description React hook that manages the complete game session state machine.
 *
 * ## State Machine
 *
 * The hook owns the `GamePhase` state and all transitions between phases:
 *
 * ```
 * source-selection → preloading → question-active ⇄ question-feedback → results
 *        ↑___________________________________________________|
 * ```
 *
 * ## Design Decisions
 *
 * - All state is kept in a single `GameSessionState` object to ensure atomic
 *   updates. This prevents intermediate renders where, for example, `phase`
 *   has changed but `questions` hasn't yet.
 *
 * - `submitAnswer` uses a functional `setState` update to avoid stale closures.
 *   It builds a minimal `TriviaSession` snapshot to pass to `recordAnswer()`
 *   from the game engine.
 *
 * - `startAndPlay` combines `startGame` + `beginPlaying` into a single state
 *   update to prevent a render with `phase: 'ready'` that would briefly show
 *   a "ready" screen before transitioning to `question-active`.
 */

import { useState, useCallback } from 'react';
import type { GamePhase, TriviaSource, Question, QuestionResult } from '../types';
import { recordAnswer } from '../engine/gameEngine';
import type { TriviaSession } from '../types';

/** Internal state shape for the game session */
interface GameSessionState {
  /** Current phase of the game flow */
  phase: GamePhase;
  /** The artist or playlist the player chose, or null before selection */
  selectedSource: TriviaSource | null;
  /** The 7 questions for the current session */
  questions: Question[];
  /** Index of the question currently being shown (0–6) */
  currentQuestionIndex: number;
  /** Results accumulated so far (one per answered question) */
  results: QuestionResult[];
  /** Running total score */
  totalScore: number;
  /** Current consecutive correct answer streak */
  streak: number;
}

/** Initial state — returned to when the player resets to source selection */
const INITIAL_STATE: GameSessionState = {
  phase: 'source-selection',
  selectedSource: null,
  questions: [],
  currentQuestionIndex: 0,
  results: [],
  totalScore: 0,
  streak: 0,
};

/**
 * Hook that manages the full game session lifecycle.
 *
 * Returns all state fields plus action functions for each phase transition.
 */
export function useGameSession() {
  const [state, setState] = useState<GameSessionState>(INITIAL_STATE);

  /**
   * Transitions from source-selection to preloading.
   * Called when the player confirms their artist or playlist choice.
   */
  const selectSource = useCallback((source: TriviaSource) => {
    setState((prev) => ({ ...prev, selectedSource: source, phase: 'preloading' }));
  }, []);

  /**
   * Transitions from preloading to ready.
   * Called when all audio and images have been downloaded.
   * Prefer `startAndPlay` to avoid an intermediate 'ready' render.
   */
  const startGame = useCallback((questions: Question[]) => {
    setState((prev) => ({ ...prev, questions, phase: 'ready' }));
  }, []);

  /**
   * Transitions from ready to question-active.
   * Called when the player taps the "Play!" button.
   */
  const beginPlaying = useCallback(() => {
    setState((prev) => ({ ...prev, phase: 'question-active' }));
  }, []);

  /**
   * Combines `startGame` + `beginPlaying` in a single atomic state update.
   * Prevents a brief 'ready' phase render between preloading and gameplay.
   * This is the preferred way to start a game from PreloadScreen.
   */
  const startAndPlay = useCallback((questions: Question[]) => {
    setState((prev) => ({ ...prev, questions, phase: 'question-active' }));
  }, []);

  /**
   * Records the player's answer and transitions to question-feedback.
   *
   * Uses a functional setState to avoid stale closure issues.
   * Builds a minimal TriviaSession snapshot for the engine's `recordAnswer()`.
   *
   * @param selectedIndex - The option index chosen, or null if time expired
   * @param timeMs - Elapsed time in ms from question start to answer
   */
  const submitAnswer = useCallback(
    (selectedIndex: number | null, timeMs: number) => {
      setState((prev) => {
        if (!prev.selectedSource) return prev;

        const session: TriviaSession = {
          source: prev.selectedSource,
          questions: prev.questions,
          results: prev.results,
          totalScore: prev.totalScore,
          totalTimeMs: 0,
          startedAt: 0,
        };

        const { result, newStreak, newTotalScore } = recordAnswer(
          session,
          prev.currentQuestionIndex,
          selectedIndex,
          timeMs,
          prev.streak,
        );

        return {
          ...prev,
          results: [...prev.results, result],
          totalScore: newTotalScore,
          streak: newStreak,
          phase: 'question-feedback',
        };
      });
    },
    [],
  );

  /**
   * Advances to the next question or transitions to results if all 7 are done.
   * Only acts when the current phase is 'question-feedback' to prevent
   * double-advances from the auto-advance timeout and the "Next" button.
   */
  const nextQuestion = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== 'question-feedback') return prev;
      const nextIndex = prev.currentQuestionIndex + 1;
      if (nextIndex >= prev.questions.length) {
        return { ...prev, phase: 'results' };
      }
      return { ...prev, currentQuestionIndex: nextIndex, phase: 'question-active' };
    });
  }, []);

  /**
   * Resets all state back to the initial source-selection screen.
   * Called when the player chooses "Back to Home" or "Play Again" (with new source).
   */
  const resetToSelection = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return {
    ...state,
    selectSource,
    startGame,
    beginPlaying,
    startAndPlay,
    submitAnswer,
    nextQuestion,
    resetToSelection,
  };
}
